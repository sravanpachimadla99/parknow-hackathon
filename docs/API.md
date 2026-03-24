# ParkNow — API Reference

Base URL: `http://localhost:3000/api`

All protected endpoints require:
```
Authorization: Bearer <jwt_token>
```

---

## Auth

### POST /auth/register
Create a new user account.

**Body:**
```json
{
  "first": "Rahul",
  "last": "Kumar",
  "email": "rahul@example.com",
  "password": "mypassword",
  "vehicle": "KA 01 AB 1234",
  "vtype": "car"
}
```
`vtype`: `car` | `bike` | `suv`

**Response 201:**
```json
{ "token": "<jwt>", "user": { "id": "...", "first": "Rahul", "role": "user", ... } }
```

---

### POST /auth/login
```json
{ "email": "rahul@example.com", "password": "mypassword" }
```
**Response 200:** `{ "token": "<jwt>", "user": { ... } }`

---

### GET /auth/me  🔒
Returns the currently authenticated user.

---

## Slots

### GET /slots
Returns all 48 parking slots.

**Query params (optional):**
- `zone=A` — filter by zone (A/B/C/D)
- `status=free` — filter by status (free/occupied/reserved)

**Response:**
```json
{
  "slots": [
    { "id": "A1", "zone": "A", "zone_name": "Ground Floor – Standard", "type": "car", "status": "free" },
    ...
  ]
}
```

---

### GET /slots/:id
Returns a single slot. Example: `GET /slots/A1`

---

### PATCH /slots/:id  🔒 Admin only
Manually set a slot's status.
```json
{ "status": "occupied" }
```

---

### GET /slots/stats/summary
```json
{ "free": 32, "occupied": 8, "reserved": 8, "total": 48 }
```

---

## Bookings

### GET /bookings  🔒
- **User:** returns own bookings only
- **Admin:** returns all bookings

Response includes nested `users` and `slots` objects.

---

### GET /bookings/:id  🔒
Returns a single booking (users can only access their own).

---

### POST /bookings  🔒
Create a booking (after payment confirmation on frontend).

```json
{
  "slot_id": "A3",
  "vehicle": "KA 01 AB 1234",
  "vtype": "car",
  "date": "2026-03-20",
  "time": "10:00",
  "dur": 8,
  "pay": "upi"
}
```
`dur` (hours): `1` | `2` | `3` | `4` | `8` | `24`
`pay`: `upi` | `card` | `wallet` | `cash`

**Response 201:** `{ "booking": { "id": "BK0001", ... } }`

**Error 409:** Slot no longer available (race condition guard).

---

### PATCH /bookings/:id/cancel  🔒
Cancel a booking. Users can only cancel their own; admins can cancel any.

---

### GET /bookings/stats/revenue  🔒 Admin only
```json
{
  "totalRevenue": 2450,
  "totalBookings": 18,
  "byPayMethod": { "upi": 900, "card": 1250, "wallet": 300 }
}
```

---

## Users

### GET /users  🔒 Admin only
Returns all users (passwords excluded).

---

### GET /users/:id  🔒
Users can fetch their own profile; admins can fetch any.

---

### PATCH /users/:id  🔒
Update profile. Allowed fields: `first`, `last`, `vehicle`, `vtype`, `password`.

---

### DELETE /users/:id  🔒 Admin only
Permanently deletes a user and their bookings (cascade).

---

## Error Responses

All errors return:
```json
{ "error": "Human-readable message" }
```

| Status | Meaning |
|--------|---------|
| 400 | Bad request / missing fields |
| 401 | Not authenticated / token expired |
| 403 | Forbidden (wrong role) |
| 404 | Resource not found |
| 409 | Conflict (e.g. slot taken) |
| 429 | Rate limited |
| 500 | Internal server error |
