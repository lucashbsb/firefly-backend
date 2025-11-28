# Skill Categories Endpoints

## POST /api/skill-categories

Create a skill category (grammar, vocabulary, speaking, etc.).

**Required Authentication:** JWT token via cookie or Authorization header
**Required Permission:** `skill-categories.create`
**Rate Limit:** 100 requests per 15 minutes

**Headers:**

- `X-CSRF-Token` (string, required) - CSRF token for request validation

**Body:**

- `code` (string, max 50, required)
- `name` (string, max 100, required)

**Success 201:** Returns created category
**Errors:** `401` unauthorized, `403` forbidden, `409` code exists, `422` validation

## GET /api/skill-categories

List all active categories ordered by name.

**Required Authentication:** JWT token via cookie or Authorization header
**Required Permission:** `skill-categories.view`
**Rate Limit:** 100 requests per 15 minutes

**Success 200:** Array of category objects
**Errors:** `401` unauthorized, `403` forbidden

## GET /api/skill-categories/:id

Retrieve single category by numeric ID.

**Required Authentication:** JWT token via cookie or Authorization header
**Required Permission:** `skill-categories.view`
**Rate Limit:** 100 requests per 15 minutes

**Path:** `id` (integer)
**Success 200:** Category object
**Errors:** `401` unauthorized, `403` forbidden, `404` not found

## PATCH /api/skill-categories/:id

Update category name or status.

**Required Authentication:** JWT token via cookie or Authorization header
**Required Permission:** `skill-categories.update`
**Rate Limit:** 100 requests per 15 minutes

**Headers:**

- `X-CSRF-Token` (string, required) - CSRF token for request validation

**Path:** `id` (integer)
**Body:** `name`, `isActive` (optional)
**Success 200:** Updated category
**Errors:** `401` unauthorized, `403` forbidden, `404` not found, `422` validation
