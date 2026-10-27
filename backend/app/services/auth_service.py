import os
import jwt
from jwt import PyJWKClient
from fastapi import Depends, HTTPException, status, Header
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

security = HTTPBearer()

FIREBASE_PROJECT_ID = os.environ["FIREBASE_PROJECT_ID"]
AZURE_ISSUER = f"https://securetoken.google.com/{FIREBASE_PROJECT_ID}"
AZURE_JWKS_URL = "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com"
ALLOWED_EMAIL_SUFFIX = "@unilever.com"


# JWKS client fetches Azure's public signing keys (cached internally)
_jwks_client = PyJWKClient(AZURE_JWKS_URL)


def _decode_and_validate(bearer_token: str ='') -> dict:
    """
    The single function the dependency calls.
    Decodes the JWT, verifies its signature, checks issuer + expiry,
    then checks the email domain. Raises HTTPException(403) on any problem.
    """
    try:
        parts = bearer_token.strip().split(' ', 1)
        if len(parts) != 2 or parts[0].lower() != 'bearer':
            raise ValueError("Invalid Authorization header format")
        token = parts[1]
        signing_key = _jwks_client.get_signing_key_from_jwt(token)
        payload = jwt.decode(
            token,
            signing_key.key,
            algorithms=["RS256"],
            issuer=AZURE_ISSUER,
            audience=FIREBASE_PROJECT_ID,
            options={"require": ["exp", "iss", "aud"]},
        )
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Token has expired")
    except jwt.InvalidIssuerError:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid token issuer")
    except jwt.InvalidAudienceError:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid token audience")
    except jwt.PyJWTError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=f"Invalid token ")
 
    email = (
        payload.get("email")
        or payload.get("upn")
        or payload.get("preferred_username")
        or ""
    )
 
    if not email.lower().endswith(ALLOWED_EMAIL_SUFFIX):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Unauthorized email domain")
 
    return payload
def verify_bearer_token(
     x_apigateway_api_userinfo: str = Header(None, alias="x-forwarded-authorization")
) -> dict:
    """
    The single dependency you add to any route.
    Extracts the Bearer token and delegates everything to one function.
    """
    return _decode_and_validate(x_apigateway_api_userinfo)
