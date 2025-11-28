# Roles Endpoints

## POST /api/roles

Create a new role.

**Required Authentication:** JWT token via cookie or Authorization header
**Required Permission:** `roles.create`
**Rate Limit:** 100 requests per 15 minutes

**Headers:**

- `X-CSRF-Token` (string, required) - CSRF token for request validation

**Body:**

- `code` (string, min 1, max 50, required)
- `name` (string, min 1, max 100, required)
- `description` (string, max 500, optional)

**Success 201:** Returns created role
**Errors:** `401` unauthorized, `403` forbidden, `409` role exists, `422` validation

## GET /api/roles

List all active roles.

**Required Authentication:** JWT token via cookie or Authorization header
**Required Permission:** `roles.view`
**Rate Limit:** 100 requests per 15 minutes

**Success 200:** Array of role objects

## GET /api/roles/:id

Retrieve single role by UUID.

**Required Authentication:** JWT token via cookie or Authorization header
**Required Permission:** `roles.view`
**Rate Limit:** 100 requests per 15 minutes

**Path:** `id` (uuid)
**Success 200:** Role object
**Errors:** `401` unauthorized, `403` forbidden, `404` not found

## PATCH /api/roles/:id

Update role properties.

**Required Authentication:** JWT token via cookie or Authorization header
**Required Permission:** `roles.update`
**Rate Limit:** 100 requests per 15 minutes

**Headers:**

- `X-CSRF-Token` (string, required) - CSRF token for request validation

**Path:** `id` (uuid)
**Body:** `name`, `description`, `isActive` (all optional)
**Success 200:** Updated role
**Errors:** `401` unauthorized, `403` forbidden, `404` not found, `422` validation
