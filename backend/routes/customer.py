"""Protected customer endpoints — require a valid Supabase Bearer token."""

from __future__ import annotations

import logging
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from auth import CurrentUser, get_current_user
from supabase_api import SupabaseError, supabase_rest

logger = logging.getLogger(__name__)

router = APIRouter(tags=["customer"])


@router.get("/me")
async def get_me(user: CurrentUser = Depends(get_current_user)) -> dict:
    return {"id": user.id, "email": user.email}


@router.get("/dogs")
async def list_dogs(user: CurrentUser = Depends(get_current_user)) -> list[dict]:
    try:
        status_code, body = await supabase_rest(
            "dogs",
            method="GET",
            user_token=user.token,
            params={
                "select": "id,name,breed,age_range,size,is_active",
                "is_active": "eq.true",
                "order": "created_at.desc",
            },
        )
    except SupabaseError:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Upstream service unavailable",
        )

    if status_code >= 500:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Upstream service unavailable",
        )

    if status_code >= 400:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden",
        )

    return body if isinstance(body, list) else []


# ── Booking creation ───────────────────────────────────────────


class BookingRequest(BaseModel):
    service_id: UUID
    dog_ids: list[UUID] = Field(min_length=1, max_length=2)
    date: str
    time: str
    pickup_address: str = Field(min_length=1, max_length=500)
    pickup_notes: str | None = None
    idempotency_key: UUID


class BookingResponse(BaseModel):
    booking_id: str


def _friendly_booking_error(msg: str) -> str:
    lower = msg.lower()
    if "no walker available" in lower:
        return "That time slot is no longer available. Please choose another time."
    if "already have a booking during this time" in lower:
        return "One of your selected dogs already has a booking during this time."
    if "not found or inactive" in lower:
        return "The selected service is no longer available."
    if "does not belong" in lower:
        return "One or more selected dogs are invalid."
    if "no_walker_overlap" in lower or "exclusion" in lower:
        return "That time slot is no longer available. Please choose another time."
    return "Something went wrong. Please try again."


@router.post("/bookings", status_code=status.HTTP_201_CREATED)
async def create_booking(
    req: BookingRequest,
    user: CurrentUser = Depends(get_current_user),
) -> BookingResponse:
    rpc_body = {
        "p_service_id": str(req.service_id),
        "p_dog_ids": [str(d) for d in req.dog_ids],
        "p_date": req.date,
        "p_time": req.time,
        "p_pickup_address": req.pickup_address,
        "p_pickup_notes": req.pickup_notes,
        "p_idempotency_key": str(req.idempotency_key),
    }

    try:
        status_code, body = await supabase_rest(
            "rpc/create_booking",
            method="POST",
            user_token=user.token,
            json_body=rpc_body,
        )
    except SupabaseError:
        logger.exception("Supabase transport error during booking creation")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Upstream service unavailable",
        )

    # Supabase RPC returns 200 with the scalar result on success.
    if status_code == 200:
        # PostgREST returns a plain string (the UUID) for scalar RPCs.
        booking_id = body if isinstance(body, str) else str(body)
        return BookingResponse(booking_id=booking_id)

    # RPC raised an exception — extract the message safely.
    detail_msg = "Something went wrong. Please try again."
    if isinstance(body, dict):
        raw = body.get("message") or body.get("hint") or ""
        if raw:
            detail_msg = _friendly_booking_error(raw)
    elif isinstance(body, str):
        detail_msg = _friendly_booking_error(body)

    logger.warning("Booking RPC returned %d: %s", status_code, detail_msg)

    if status_code == 401:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Session expired")
    if status_code >= 500:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="Upstream service unavailable")

    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=detail_msg)