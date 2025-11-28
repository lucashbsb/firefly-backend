# Students Endpoints

## POST /api/students

Create a new student profile linked to a user.

**Required Authentication:** JWT token via cookie or Authorization header
**Required Permission:** `students.create`
**Rate Limit:** 100 requests per 15 minutes

**Headers:**

- `X-CSRF-Token` (string, required) - CSRF token for request validation

**Body:**

- `userId` (uuid, required)
- `displayName` (string, max 200, optional)
- `initialLevelId` (int, optional)
- `currentLevelId` (int, optional)
- `locale` (string, optional)
- `timezone` (string, optional)
- `learningGoal` (string, max 500, optional)
- `metadata` (object, optional)

**Success 201:** Returns created student with relations
**Errors:** `401` unauthorized, `403` forbidden, `404` user not found, `409` student exists, `422` validation

## GET /api/students

List all active students with user and level relations.

**Required Authentication:** JWT token via cookie or Authorization header
**Required Permission:** `students.view`
**Rate Limit:** 100 requests per 15 minutes

**Success 200:** Array of student objects
**Errors:** `401` unauthorized, `403` forbidden

## GET /api/students/:id

Retrieve single student by UUID with full relations.

**Required Authentication:** JWT token via cookie or Authorization header
**Required Permission:** `students.view`
**Rate Limit:** 100 requests per 15 minutes

**Path:** `id` (uuid)
**Success 200:** Student object
**Errors:** `401` unauthorized, `403` forbidden, `404` not found

## PATCH /api/students/:id

Update student fields.

**Required Authentication:** JWT token via cookie or Authorization header
**Required Permission:** `students.update`
**Rate Limit:** 100 requests per 15 minutes

**Headers:**

- `X-CSRF-Token` (string, required) - CSRF token for request validation

**Path:** `id` (uuid)
**Body:** `displayName`, `currentLevelId`, `locale`, `timezone`, `learningGoal`, `isActive`, `metadata` (all optional)
**Success 200:** Updated student
**Errors:** `401` unauthorized, `403` forbidden, `404` not found, `422` validation
