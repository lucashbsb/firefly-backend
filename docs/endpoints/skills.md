# Skills Endpoints

## POST /api/skills

Create a skill definition with category, track, and CEFR level range.

**Required Authentication:** JWT token via cookie or Authorization header
**Required Permission:** `skills.create`
**Rate Limit:** 100 requests per 15 minutes

**Headers:**

- `X-CSRF-Token` (string, required) - CSRF token for request validation

**Body:**

- `code` (string, max 100, unique, required)
- `name` (string, max 200, required)
- `description` (string, max 1000, required)
- `categoryId` (integer, required)
- `trackId` (integer, required)
- `levelMinId` (integer, required)
- `levelMaxId` (integer, required)
- `importanceWeight` (integer 1-5, required)
- `difficultyWeight` (integer 1-5, required)
- `metadata` (object, optional)

**Success 201:** Returns created skill with full relations
**Errors:** `400` invalid references, `401` unauthorized, `403` forbidden, `409` code exists, `422` validation

## GET /api/skills

List all active skills with category, track, and level relations.

**Required Authentication:** JWT token via cookie or Authorization header
**Required Permission:** `skills.view`
**Rate Limit:** 100 requests per 15 minutes

**Success 200:** Array of skill objects ordered by name
**Errors:** `401` unauthorized, `403` forbidden

## GET /api/skills/:id

Retrieve single skill by UUID with full relations.

**Required Authentication:** JWT token via cookie or Authorization header
**Required Permission:** `skills.view`
**Rate Limit:** 100 requests per 15 minutes

**Path:** `id` (uuid)
**Success 200:** Skill object
**Errors:** `401` unauthorized, `403` forbidden, `404` not found

## PATCH /api/skills/:id

Update skill properties.

**Required Authentication:** JWT token via cookie or Authorization header
**Required Permission:** `skills.update`
**Rate Limit:** 100 requests per 15 minutes

**Headers:**

- `X-CSRF-Token` (string, required) - CSRF token for request validation

**Path:** `id` (uuid)
**Body:** `name`, `description`, `importanceWeight`, `difficultyWeight`, `isActive`, `metadata` (all optional)
**Success 200:** Updated skill
**Errors:** `401` unauthorized, `403` forbidden, `404` not found, `422` validation
