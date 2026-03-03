# Notification Service

Email, SMS, and push notification delivery service for the FinServ platform.

Runs on port `3003` by default. All endpoints are also accessible through the API gateway at `http://localhost:3000`.

### Routing

| Direct (service)                        | Via API Gateway                                          |
|-----------------------------------------|----------------------------------------------------------|
| `http://localhost:3003/notifications`   | `http://localhost:3000/api/notifications/notifications`  |
| `http://localhost:3003/notifications/bulk` | `http://localhost:3000/api/notifications/notifications/bulk` |
| `http://localhost:3003/notifications/:id`  | `http://localhost:3000/api/notifications/notifications/:id`  |

The API gateway (`/api/:service/*`) strips the `/api/notifications` prefix and forwards the remainder to `http://localhost:3003`.

## Endpoints

### List Notifications

```
GET /notifications
```

Returns all notifications, sorted by `createdAt` descending. Supports optional query filters.

**Query Parameters**

| Parameter | Type   | Required | Description                          |
|-----------|--------|----------|--------------------------------------|
| `userId`  | string | No       | Filter by user ID                    |
| `status`  | string | No       | Filter by status (see [Enums](#enums)) |

**Response**

```json
{
  "data": [
    {
      "id": "ntf-001",
      "userId": "usr-001",
      "type": "trade_executed",
      "channel": "email",
      "subject": "Trade Executed: AAPL",
      "body": "Your buy order for 100 shares of AAPL has been executed.",
      "status": "sent",
      "metadata": {},
      "createdAt": "2024-10-15T10:30:05.000Z",
      "sentAt": "2024-10-15T10:30:06.000Z"
    }
  ],
  "total": 1
}
```

**Example**

```bash
# List all notifications for a user
# Direct
curl http://localhost:3003/notifications?userId=usr-001

# Via API gateway
curl http://localhost:3000/api/notifications/notifications?userId=usr-001

# List queued notifications
curl http://localhost:3003/notifications?status=queued
```

---

### Create Notification

```
POST /notifications
```

Creates and dispatches a single notification.

**Request Body**

| Field      | Type   | Required | Description                                    |
|------------|--------|----------|------------------------------------------------|
| `userId`   | string | Yes      | Target user ID                                 |
| `type`     | string | Yes      | Notification type (see [Enums](#enums))        |
| `channel`  | string | Yes      | Delivery channel (see [Enums](#enums))         |
| `subject`  | string | Yes      | Notification subject line                      |
| `body`     | string | Yes      | Notification body text                         |
| `metadata` | object | No       | Arbitrary key-value pairs for template variables |

**Response** `201 Created`

```json
{
  "data": {
    "id": "ntf-abc123",
    "userId": "usr-001",
    "type": "trade_executed",
    "channel": "email",
    "subject": "Trade Executed: AAPL",
    "body": "Your buy order for 100 shares of AAPL has been executed.",
    "status": "queued",
    "metadata": {
      "symbol": "AAPL",
      "side": "buy",
      "quantity": 100,
      "price": 150.00,
      "total": 15000.00
    },
    "createdAt": "2024-11-01T12:00:00.000Z"
  }
}
```

**Example**

```bash
curl -X POST http://localhost:3003/notifications \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "usr-001",
    "type": "trade_executed",
    "channel": "email",
    "subject": "Trade Executed: AAPL",
    "body": "Your buy order for 100 shares of AAPL has been executed.",
    "metadata": {
      "symbol": "AAPL",
      "side": "buy",
      "quantity": 100,
      "price": 150.00,
      "total": 15000.00
    }
  }'
```

---

### Bulk Create Notifications

```
POST /notifications/bulk
```

Creates and dispatches multiple notifications in a single request.

**Request Body**

| Field           | Type  | Required | Description                                        |
|-----------------|-------|----------|----------------------------------------------------|
| `notifications` | array | Yes      | Array of notification objects (same fields as above) |

**Response** `201 Created`

```json
{
  "data": [
    {
      "id": "ntf-abc123",
      "userId": "usr-001",
      "type": "security_alert",
      "channel": "email",
      "subject": "Security Alert",
      "body": "Suspicious login detected.",
      "status": "queued",
      "createdAt": "2024-11-01T12:00:00.000Z"
    },
    {
      "id": "ntf-abc124",
      "userId": "usr-002",
      "type": "balance_low",
      "channel": "sms",
      "subject": "Low Balance",
      "body": "Your balance is below $100.",
      "status": "queued",
      "createdAt": "2024-11-01T12:00:00.000Z"
    }
  ],
  "total": 2
}
```

**Example**

```bash
curl -X POST http://localhost:3003/notifications/bulk \
  -H "Content-Type: application/json" \
  -d '{
    "notifications": [
      {
        "userId": "usr-001",
        "type": "security_alert",
        "channel": "email",
        "subject": "Security Alert",
        "body": "Suspicious login detected.",
        "metadata": { "alertType": "suspicious_login" }
      },
      {
        "userId": "usr-002",
        "type": "balance_low",
        "channel": "sms",
        "subject": "Low Balance",
        "body": "Your balance is below $100.",
        "metadata": { "threshold": 100, "balance": 42.50 }
      }
    ]
  }'
```

---

### Get Notification by ID

```
GET /notifications/:id
```

Returns a single notification by its ID.

**Path Parameters**

| Parameter | Type   | Required | Description      |
|-----------|--------|----------|------------------|
| `id`      | string | Yes      | Notification ID  |

**Response**

```json
{
  "data": {
    "id": "ntf-001",
    "userId": "usr-001",
    "type": "trade_executed",
    "channel": "email",
    "subject": "Trade Executed: AAPL",
    "body": "Your buy order for 100 shares of AAPL has been executed.",
    "status": "sent",
    "createdAt": "2024-10-15T10:30:05.000Z",
    "sentAt": "2024-10-15T10:30:06.000Z"
  }
}
```

**Example**

```bash
curl http://localhost:3003/notifications/ntf-001
```

---

## Enums

### `type` (NotificationType)

| Value             | Description                           |
|-------------------|---------------------------------------|
| `trade_executed`  | Trade was successfully executed       |
| `trade_failed`    | Trade execution failed                |
| `kyc_approved`    | KYC verification approved             |
| `kyc_rejected`    | KYC verification rejected             |
| `balance_low`     | Account balance below threshold       |
| `security_alert`  | Security event detected on account    |

### `channel` (NotificationChannel)

| Value   | Description              |
|---------|--------------------------|
| `email` | Email delivery           |
| `sms`   | SMS text message         |
| `push`  | Push notification        |

### `status` (NotificationStatus)

| Value    | Description                           |
|----------|---------------------------------------|
| `queued` | Notification created, pending send    |
| `sent`   | Successfully delivered                |
| `failed` | Delivery failed                       |

## Error Responses

All error responses follow this format:

```json
{
  "error": "Error message describing what went wrong"
}
```

| Status Code | Condition                                                |
|-------------|----------------------------------------------------------|
| `400`       | Missing required fields or invalid `notifications` array |
| `404`       | Notification with the given ID not found                 |
| `502`       | Bad gateway (API gateway could not reach the service)    |
| `504`       | Gateway timeout (service did not respond in time)        |

## Template Variables

The service uses `metadata` fields to interpolate notification templates. Below are the template variables for each notification type:

| Type              | Template Variables                                      |
|-------------------|---------------------------------------------------------|
| `trade_executed`  | `symbol`, `side`, `quantity`, `price`, `total`          |
| `trade_failed`    | `symbol`, `side`, `quantity`                            |
| `kyc_approved`    | _(none)_                                                |
| `kyc_rejected`    | `reason`                                                |
| `balance_low`     | `threshold`, `balance`                                  |
| `security_alert`  | `alertType`                                             |

## Environment Variables

| Variable        | Default                                  | Description            |
|-----------------|------------------------------------------|------------------------|
| `PORT`          | `3003`                                   | Service listen port    |
| `EMAIL_API_URL` | `https://api.email-provider.internal`    | Email provider API URL |
| `SMS_API_URL`   | `https://api.sms-provider.internal`      | SMS provider API URL   |
