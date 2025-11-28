# CEFR Levels Endpoints

## POST /api/cefr-levels

Create a CEFR proficiency level reference.

**Required Authentication:** JWT token via cookie or Authorization header
**Required Permission:** `cefr-levels.create`
**Rate Limit:** 100 requests per 15 minutes

**Headers:**

- `X-CSRF-Token` (string, required) - CSRF token for request validation

**Body:**

- `code` (enum: a1/a2/b1/b2/c1, required)
- `name` (string, required)

**Success 201:** Returns created level
**Errors:** `401` unauthorized, `403` forbidden, `409` code exists, `422` validation

## GET /api/cefr-levels

List all active CEFR levels ordered by ID.

**Required Authentication:** JWT token via cookie or Authorization header
**Required Permission:** `cefr-levels.view`
**Rate Limit:** 100 requests per 15 minutes

**Success 200:** Array of level objects
**Errors:** `401` unauthorized, `403` forbidden

## GET /api/cefr-levels/:id

Retrieve single CEFR level by numeric ID.

**Required Authentication:** JWT token via cookie or Authorization header
**Required Permission:** `cefr-levels.view`
**Rate Limit:** 100 requests per 15 minutes

**Path:** `id` (integer)
**Success 200:** Level object
**Errors:** `401` unauthorized, `403` forbidden, `404` not found

## PATCH /api/cefr-levels/:id

Update level properties.

**Required Authentication:** JWT token via cookie or Authorization header
**Required Permission:** `cefr-levels.update`
**Rate Limit:** 100 requests per 15 minutes

**Headers:**

- `X-CSRF-Token` (string, required) - CSRF token for request validation

**Path:** `id` (integer)
**Body:** `name`, `isActive` (optional)
**Success 200:** Updated level
**Errors:** `401` unauthorized, `403` forbidden, `404` not found, `422` validation
