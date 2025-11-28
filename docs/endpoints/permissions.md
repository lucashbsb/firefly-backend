# Permissions Endpoints

## POST /api/permissions

Create a new permission.

**Required Authentication:** JWT token via cookie or Authorization header
**Required Permission:** `permissions.create`
**Rate Limit:** 100 requests per 15 minutes

**Headers:**

- `X-CSRF-Token` (string, required) - CSRF token for request validation

**Body:**

- `code` (string, min 1, max 100, required, format: `resource.action`)
- `name` (string, min 1, max 200, required)
- `description` (string, max 500, optional)
- `domain` (string, max 50, optional, default: firefly)
- `target` (enum: backend/frontend/both, optional, default: both)

**Success 201:** Returns created permission
**Errors:** `401` unauthorized, `403` forbidden, `409` permission exists, `422` validation

## GET /api/permissions

List all active permissions.

**Required Authentication:** JWT token via cookie or Authorization header
**Required Permission:** `permissions.view`
**Rate Limit:** 100 requests per 15 minutes

**Success 200:** Array of permission objects

## GET /api/permissions/:id

Retrieve single permission by UUID.

**Required Authentication:** JWT token via cookie or Authorization header
**Required Permission:** `permissions.view`
**Rate Limit:** 100 requests per 15 minutes

**Path:** `id` (uuid)
**Success 200:** Permission object
**Errors:** `401` unauthorized, `403` forbidden, `404` not found

## PATCH /api/permissions/:id

Update permission properties.

**Required Authentication:** JWT token via cookie or Authorization header
**Required Permission:** `permissions.update`
**Rate Limit:** 100 requests per 15 minutes

**Headers:**

- `X-CSRF-Token` (string, required) - CSRF token for request validation

**Path:** `id` (uuid)
**Body:** `name`, `description`, `domain`, `target`, `isActive` (all optional)
**Success 200:** Updated permission
**Errors:** `401` unauthorized, `403` forbidden, `404` not found, `422` validation
