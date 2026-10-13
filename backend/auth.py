"""FastAPI authentication dependency that verifies Supabase Bearer tokens.

Tokens are verified against the Supabase Auth server (GET /auth/v1/user)
rather than decoded locally, so only tokens that are valid *right now* are
accepted.  Access tokens are never logged.
"""

from __future__ import annotations

import httpx
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from config import settings

_bearer_scheme = HTTPBearer(auto_error=False)

_TIMEOUT = httpx.Timeout(10.0)


class CurrentUser:
    """Authenticated Supabase user's safe identity fields.

    The raw access token is kept so downstream Supabase REST calls can
    authenticate with RLS.  Never log or expose ``token``.
    """

    def __init__(self, id: str, email: str | None = None, token: str = "") -> None:
        self.id = id
        self.email = email
        self.token = token  # never log this


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer_scheme),
) -> CurrentUser:
    if credentials is None or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )

    token = credentials.credentials

    async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
        try:
            resp = await client.get(
                f"{settings.supabase_url}/auth/v1/user",
                headers={
                    "apikey": settings.supabase_publishable_key,
                    "Authorization": f"Bearer {token}",
                },
            )
        except httpx.HTTPError:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Authentication service unavailable",
            )

    if resp.status_code != 200:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )

    # Parse the Supabase user object safely.
    try:
        body = resp.json()
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Unexpected response from authentication service",
        )

    user_id = body.get("id")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Unexpected response from authentication service",
        )

    return CurrentUser(id=user_id, email=body.get("email"), token=token)