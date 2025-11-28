# Users Endpoints

## POST /api/users

Create a new user account.

**Required Authentication:** JWT token via cookie or Authorization header
**Required Permission:** `users.create`
**Rate Limit:** 100 requests per 15 minutes

**Headers:**

- `X-CSRF-Token` (string, required) - CSRF token for request validation

**Body:**

- `email` (string, email, required)
- `passwordHash` (string, min 8, required)
- `authProvider` (string, optional)
- `authProviderId` (string, optional)
- `role` (enum: student/admin/teacher, optional)

**Success 201:** Returns created user
**Errors:** `401` unauthorized, `403` forbidden, `409` user exists, `422` validation

## GET /api/users

List all active users ordered by creation date.

**Required Authentication:** JWT token via cookie or Authorization header
**Required Permission:** `users.view`
**Rate Limit:** 100 requests per 15 minutes

**Success 200:** Array of user objects
**Errors:** `401` unauthorized, `403` forbidden

## GET /api/users/:id

Retrieve single user by UUID.

**Required Authentication:** JWT token via cookie or Authorization header
**Required Permission:** `users.view`
**Rate Limit:** 100 requests per 15 minutes

**Path:** `id` (uuid)
**Success 200:** User object
**Errors:** `401` unauthorized, `403` forbidden, `404` not found

## PATCH /api/users/:id

Update user properties.

**Required Authentication:** JWT token via cookie or Authorization header
**Required Permission:** `users.update`
**Rate Limit:** 100 requests per 15 minutes

**Headers:**

- `X-CSRF-Token` (string, required) - CSRF token for request validation

**Path:** `id` (uuid)
**Body:** `email`, `role`, `isEmailVerified`, `isActive` (all optional)
**Success 200:** Updated user
**Errors:** `401` unauthorized, `403` forbidden, `404` not found, `422` validation
