# Authentication Endpoints

## POST /api/auth/register

Register a new user account.

**Public endpoint** (no authentication required)
**Rate limit:** 3 requests per hour per IP

**Headers:**

- `X-CSRF-Token` (string, required) - CSRF token from response header

**Body:**

- `email` (string, email, required)
- `password` (string, min 8, required)
- `displayName` (string, max 200, optional)

**Success 201:**

```json
{
  "user": { "id": "uuid", "email": "user@example.com", ... }
}
```

**Cookies Set:**

- `firefly_access_token` - HTTP-only, Secure, SameSite, 15min expiry
- `firefly_refresh_token` - HTTP-only, Secure, SameSite, 7day expiry

**Errors:** `403` CSRF token invalid, `409` user exists, `422` validation

## POST /api/auth/login

Authenticate user and receive JWT tokens via HTTP-only cookies.

**Public endpoint** (no authentication required)
**Rate limit:** 5 requests per 15 minutes per IP

**Headers:**

- `X-CSRF-Token` (string, required) - CSRF token from response header

**Body:**

- `email` (string, email, required)
- `password` (string, required)

**Success 200:**

```json
{
  "user": { "id": "uuid", "email": "user@example.com", ... }
}
```

**Cookies Set:**

- `firefly_access_token` - HTTP-only, Secure, SameSite, 15min expiry
- `firefly_refresh_token` - HTTP-only, Secure, SameSite, 7day expiry

**Errors:** `401` invalid credentials, `403` CSRF token invalid, `422` validation

## POST /api/auth/refresh

Refresh access token using refresh token from cookie. Implements token rotation.

**Public endpoint** (no authentication required)
**Rate limit:** 10 requests per 15 minutes per IP

**Headers:**

- `X-CSRF-Token` (string, required) - CSRF token from response header

**Cookies Required:**

- `firefly_refresh_token` - Refresh token previously set

**Success 200:**

```json
{
  "success": true
}
```

**Cookies Set:**

- `firefly_access_token` - New HTTP-only, Secure, SameSite token, 15min expiry
- `firefly_refresh_token` - New rotated HTTP-only, Secure, SameSite token, 7day expiry

**Errors:** `401` invalid token, `403` CSRF token invalid

**Notes:** Old refresh token is automatically revoked upon successful refresh.

## JWT Token Usage

**Cookie-Based Authentication (Recommended):**

Tokens are automatically sent via HTTP-only cookies. No client-side storage required.

**Header-Based Authentication (Alternative):**

For API clients that cannot use cookies, include access token in Authorization header:

```
Authorization: Bearer eyJhbGc...
```

## Security Features

- **RS256 Algorithm:** Asymmetric JWT signing with RSA 2048-bit keys
- **HTTP-Only Cookies:** Tokens stored in secure cookies, inaccessible to JavaScript
- **CSRF Protection:** Required X-CSRF-Token header for all mutating requests
- **Token Rotation:** Refresh tokens automatically rotated on each use
- **Server-Side Storage:** Refresh tokens validated against server-side store
- **Automatic Cleanup:** Expired tokens automatically removed from storage
- **Short Expiry:** Access tokens expire after 15 minutes
- **Rate Limiting:** Login, register, and refresh endpoints are rate-limited

## CSRF Token Retrieval

The CSRF token is provided in the `X-CSRF-Token` response header on any GET request. Store it and include it in subsequent mutating requests.

Tokens use RS256 algorithm with 15-minute access token expiry and 7-day refresh token expiry.
