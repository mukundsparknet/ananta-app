# 📡 User Management API Documentation

## Base URLs
- **Backend API**: `http://localhost:8080`
- **Admin Panel**: `http://localhost:3000`

---

## Admin Endpoints

### 1. Get All Users
**GET** `/api/admin/users`

**Headers:**
```
Authorization: Bearer {admin_token}
```

**Response:**
```json
{
  "users": [
    {
      "id": 1,
      "userId": "AN12345678",
      "username": "john_doe",
      "phone": "+919876543210",
      "email": "john@example.com",
      "fullName": "John Doe",
      "isBlocked": false,
      "isBanned": false,
      "banUntil": null,
      "banReason": null,
      "createdAt": "2024-01-01T10:00:00",
      "updatedAt": "2024-01-01T10:00:00"
    }
  ]
}
```

---

### 2. Update User Status (Block/Ban)
**PATCH** `/api/admin/users`

**Headers:**
```
Authorization: Bearer {admin_token}
Content-Type: application/json
```

**Request Body (Block):**
```json
{
  "id": 1,
  "userId": "AN12345678",
  "isBlocked": true
}
```

**Request Body (Unblock):**
```json
{
  "id": 1,
  "userId": "AN12345678",
  "isBlocked": false
}
```

**Request Body (Ban - Temporary):**
```json
{
  "id": 1,
  "userId": "AN12345678",
  "isBanned": true,
  "banDays": 3
}
```

**Request Body (Ban - Permanent):**
```json
{
  "id": 1,
  "userId": "AN12345678",
  "isBanned": true
}
```

**Request Body (Unban):**
```json
{
  "id": 1,
  "userId": "AN12345678",
  "isBanned": false
}
```

**Response:**
```json
{
  "message": "User updated successfully"
}
```

**Error Response (404):**
```json
{
  "message": "User not found"
}
```

---

### 3. Get User Details
**GET** `/api/admin/users/{userId}`

**Headers:**
```
Authorization: Bearer {admin_token}
```

**Response:**
```json
{
  "user": {
    "id": 1,
    "userId": "AN12345678",
    "username": "john_doe",
    "phone": "+919876543210",
    "email": "john@example.com",
    "fullName": "John Doe",
    "gender": "Male",
    "birthday": "1990-01-01",
    "bio": "Hello world",
    "isBlocked": false,
    "isBanned": false,
    "banUntil": null,
    "banReason": null
  },
  "kyc": {
    "userId": "AN12345678",
    "fullName": "John Doe",
    "documentType": "AADHAR",
    "documentNumber": "1234-5678-9012",
    "status": "APPROVED"
  }
}
```

---

### 4. Update User Profile
**PUT** `/api/admin/users/{userId}`

**Headers:**
```
Authorization: Bearer {admin_token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "username": "john_doe_updated",
  "email": "john.updated@example.com",
  "fullName": "John Doe Updated",
  "phone": "+919876543210",
  "gender": "Male",
  "birthday": "1990-01-01",
  "bio": "Updated bio",
  "addressLine1": "123 Main St",
  "city": "Mumbai",
  "state": "Maharashtra",
  "country": "India",
  "pinCode": "400001",
  "location": "Mumbai, India"
}
```

**Response:**
```json
{
  "message": "User updated successfully"
}
```

---

### 5. Delete User (Permanent)
**DELETE** `/api/admin/users/{userId}`

**Headers:**
```
Authorization: Bearer {admin_token}
```

**Response:**
```json
{
  "message": "User permanently deleted"
}
```

**Error Response (404):**
```json
{
  "message": "User not found"
}
```

**Error Response (500):**
```json
{
  "message": "Error deleting user: {error_details}"
}
```

---

## App Endpoints (Mobile)

### 6. Verify OTP (Login)
**POST** `/api/app/verify-otp`

**Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "phone": "+919876543210",
  "otp": "12345"
}
```

**Response (Success):**
```json
{
  "userId": "AN12345678",
  "phone": "+919876543210",
  "kycStatus": "APPROVED",
  "hasProfile": true
}
```

**Response (Blocked - 403):**
```json
{
  "message": "Your account has been blocked. Please contact support."
}
```

**Response (Banned Temporary - 403):**
```json
{
  "message": "Your account is banned: Banned for 3 days. Ban expires on: 2024-01-15 10:30:00"
}
```

**Response (Banned Permanent - 403):**
```json
{
  "message": "Your account has been permanently banned. Please contact support."
}
```

**Response (Invalid OTP - 400):**
```json
{
  "message": "Invalid OTP"
}
```

---

### 7. Check Account Status
**GET** `/api/app/check-account-status/{userId}`

**Response (Active):**
```json
{
  "status": "ok",
  "isBlocked": false,
  "isBanned": false,
  "banReason": null,
  "banUntil": null,
  "message": "Account is active",
  "shouldLogout": false
}
```

**Response (Blocked):**
```json
{
  "status": "ok",
  "isBlocked": true,
  "isBanned": false,
  "banReason": null,
  "banUntil": null,
  "message": "Your account has been blocked. Please contact support.",
  "shouldLogout": true
}
```

**Response (Banned Temporary):**
```json
{
  "status": "ok",
  "isBlocked": false,
  "isBanned": true,
  "banReason": "Banned for 3 days",
  "banUntil": "2024-01-15T10:30:00",
  "message": "Your account is banned: Banned for 3 days. Ban expires on: 2024-01-15T10:30:00",
  "shouldLogout": true
}
```

**Response (Banned Permanent):**
```json
{
  "status": "ok",
  "isBlocked": false,
  "isBanned": true,
  "banReason": "Permanently banned",
  "banUntil": null,
  "message": "Your account is banned permanently.",
  "shouldLogout": true
}
```

**Response (User Not Found - 404):**
```json
{
  "status": "error",
  "message": "User not found"
}
```

---

### 8. Get User Profile
**GET** `/api/app/profile/{userId}`

**Response:**
```json
{
  "user": {
    "userId": "AN12345678",
    "username": "john_doe",
    "phone": "+919876543210",
    "email": "john@example.com",
    "fullName": "John Doe",
    "gender": "Male",
    "birthday": "1990-01-01",
    "bio": "Hello world",
    "profileImage": "/uploads/profile_AN12345678_1234567890.jpg",
    "coverImage": "/uploads/cover_AN12345678_1234567890.jpg",
    "isBlocked": false,
    "isBanned": false
  },
  "kyc": {
    "userId": "AN12345678",
    "fullName": "John Doe",
    "documentType": "AADHAR",
    "status": "APPROVED"
  },
  "followers": 150,
  "following": 200,
  "coins": 1500.50,
  "followersList": [...],
  "followingList": [...]
}
```

**Note:** This endpoint also performs auto-unban if ban has expired.

---

### 9. Update User Profile
**POST** `/api/app/profile`

**Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "userId": "AN12345678",
  "username": "john_doe",
  "fullName": "John Doe",
  "bio": "Updated bio",
  "location": "Mumbai, India",
  "gender": "Male",
  "birthday": "1990-01-01",
  "addressLine1": "123 Main St",
  "city": "Mumbai",
  "state": "Maharashtra",
  "country": "India",
  "pinCode": "400001",
  "profileImage": "data:image/jpeg;base64,...",
  "coverImage": "data:image/jpeg;base64,..."
}
```

**Response:**
```json
{
  "message": "Profile updated successfully"
}
```

---

## Status Codes

| Code | Meaning | Usage |
|------|---------|-------|
| 200 | OK | Request successful |
| 400 | Bad Request | Invalid input data |
| 403 | Forbidden | User blocked/banned |
| 404 | Not Found | User not found |
| 500 | Server Error | Internal server error |

---

## Error Handling

All endpoints return errors in this format:

```json
{
  "message": "Error description"
}
```

---

## Authentication

Admin endpoints require JWT token in Authorization header:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

App endpoints (mobile) don't require authentication for most operations.

---

## Rate Limiting

- **Account Status Check**: Called every 30 seconds by mobile app
- **Login Attempts**: No limit (uses fixed OTP for demo)
- **Admin Actions**: No limit

---

## Database Schema

### Users Table
```sql
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    user_id VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    gender VARCHAR(50),
    birthday VARCHAR(50),
    bio TEXT,
    address_line1 VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100),
    pin_code VARCHAR(20),
    location VARCHAR(255),
    profile_image TEXT,
    cover_image TEXT,
    is_blocked BOOLEAN DEFAULT FALSE,
    is_banned BOOLEAN DEFAULT FALSE,
    ban_until TIMESTAMP,
    ban_reason VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## Testing with cURL

### Block User
```bash
curl -X PATCH http://localhost:8080/api/admin/users \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"userId":"AN12345678","isBlocked":true}'
```

### Ban User for 3 Days
```bash
curl -X PATCH http://localhost:8080/api/admin/users \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"userId":"AN12345678","isBanned":true,"banDays":3}'
```

### Delete User
```bash
curl -X DELETE http://localhost:8080/api/admin/users/AN12345678 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Check Account Status
```bash
curl http://localhost:8080/api/app/check-account-status/AN12345678
```

### Verify OTP
```bash
curl -X POST http://localhost:8080/api/app/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"phone":"+919876543210","otp":"12345"}'
```

---

## Postman Collection

Import this JSON into Postman for easy testing:

```json
{
  "info": {
    "name": "ANANTA User Management",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Admin - Get Users",
      "request": {
        "method": "GET",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{admin_token}}"
          }
        ],
        "url": "{{base_url}}/api/admin/users"
      }
    },
    {
      "name": "Admin - Block User",
      "request": {
        "method": "PATCH",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{admin_token}}"
          },
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"userId\": \"AN12345678\",\n  \"isBlocked\": true\n}"
        },
        "url": "{{base_url}}/api/admin/users"
      }
    },
    {
      "name": "Admin - Ban User (3 days)",
      "request": {
        "method": "PATCH",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{admin_token}}"
          },
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"userId\": \"AN12345678\",\n  \"isBanned\": true,\n  \"banDays\": 3\n}"
        },
        "url": "{{base_url}}/api/admin/users"
      }
    },
    {
      "name": "Admin - Delete User",
      "request": {
        "method": "DELETE",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{admin_token}}"
          }
        ],
        "url": "{{base_url}}/api/admin/users/AN12345678"
      }
    },
    {
      "name": "App - Verify OTP",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"phone\": \"+919876543210\",\n  \"otp\": \"12345\"\n}"
        },
        "url": "{{base_url}}/api/app/verify-otp"
      }
    },
    {
      "name": "App - Check Account Status",
      "request": {
        "method": "GET",
        "url": "{{base_url}}/api/app/check-account-status/AN12345678"
      }
    }
  ],
  "variable": [
    {
      "key": "base_url",
      "value": "http://localhost:8080"
    },
    {
      "key": "admin_token",
      "value": "YOUR_ADMIN_TOKEN_HERE"
    }
  ]
}
```

---

**Complete API documentation for the user management system! 📡**
