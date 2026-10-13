"""Thin httpx wrapper for Supabase REST calls.

Always uses the caller's Bearer token so Supabase RLS is authoritative.
The service-role / secret key is never used here.
"""

from __future__ import annotations

from typing import Any

import httpx

from config import settings

_TIMEOUT = httpx.Timeout(10.0)


class SupabaseError(Exception):
    """Raised when the Supabase REST call fails at the transport level."""


async def supabase_rest(
    path: str,
    method: str = "GET",
    user_token: str = "",
    params: dict[str, str] | None = None,
    json_body: Any = None,
) -> tuple[int, Any]:
    """Execute a Supabase REST call and return (status_code, parsed_body).

    ``parsed_body`` is the decoded JSON body, or ``None`` when the response
    body is empty or not valid JSON.  Raw upstream error text is never
    propagated to the caller.
    """
    url = f"{settings.supabase_url}/rest/v1/{path}"

    headers = {
        "apikey": settings.supabase_publishable_key,
        "Authorization": f"Bearer {user_token}",
        "Content-Type": "application/json",
    }

    async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
        try:
            resp = await client.request(
                method,
                url,
                headers=headers,
                params=params,
                json=json_body,
            )
        except httpx.HTTPError as exc:
            raise SupabaseError("Supabase request failed") from exc

    # Safely parse JSON — do not assume every response has a JSON body.
    try:
        body = resp.json()
    except ValueError:
        body = None

    return resp.status_code, body