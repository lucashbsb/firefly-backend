# Skill Tracks Endpoints

## POST /api/skill-tracks

Create a skill track type (general, business, daily_english, etc.).

**Required Authentication:** JWT token via cookie or Authorization header
**Required Permission:** `skill-tracks.create`
**Rate Limit:** 100 requests per 15 minutes

**Headers:**

- `X-CSRF-Token` (string, required) - CSRF token for request validation

**Body:**

- `code` (string, max 50, required)
- `name` (string, max 100, required)

**Success 201:** Returns created track
**Errors:** `401` unauthorized, `403` forbidden, `409` code exists, `422` validation

## GET /api/skill-tracks

List all active tracks ordered by name.

**Required Authentication:** JWT token via cookie or Authorization header
**Required Permission:** `skill-tracks.view`
**Rate Limit:** 100 requests per 15 minutes

**Success 200:** Array of track objects
**Errors:** `401` unauthorized, `403` forbidden

## GET /api/skill-tracks/:id

Retrieve single track by numeric ID.

**Required Authentication:** JWT token via cookie or Authorization header
**Required Permission:** `skill-tracks.view`
**Rate Limit:** 100 requests per 15 minutes

**Path:** `id` (integer)
**Success 200:** Track object
**Errors:** `401` unauthorized, `403` forbidden, `404` not found

## PATCH /api/skill-tracks/:id

Update track name or status.

**Required Authentication:** JWT token via cookie or Authorization header
**Required Permission:** `skill-tracks.update`
**Rate Limit:** 100 requests per 15 minutes

**Headers:**

- `X-CSRF-Token` (string, required) - CSRF token for request validation

**Path:** `id` (integer)
**Body:** `name`, `isActive` (optional)
**Success 200:** Updated track
**Errors:** `401` unauthorized, `403` forbidden, `404` not found, `422` validation
