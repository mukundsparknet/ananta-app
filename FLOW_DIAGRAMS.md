# 🎨 User Management System - Flow Diagrams

## 1. User Deletion Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    ADMIN PANEL                              │
│                                                             │
│  Admin clicks "Delete" on user                             │
│         │                                                   │
│         ▼                                                   │
│  Confirmation dialog                                        │
│         │                                                   │
│         ▼                                                   │
│  DELETE /api/admin/users/{userId}                          │
└─────────────────────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND                                  │
│                                                             │
│  1. Find user by userId                                    │
│  2. Delete wallet transactions                             │
│  3. Delete wallet                                          │
│  4. Delete follows (follower & followee)                   │
│  5. Delete KYC records                                     │
│  6. Delete user                                            │
│         │                                                   │
│         ▼                                                   │
│  Return success                                            │
└─────────────────────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────┐
│                    DATABASE                                 │
│                                                             │
│  ❌ User record deleted                                     │
│  ❌ KYC records deleted                                     │
│  ❌ Wallet deleted                                          │
│  ❌ Transactions deleted                                    │
│  ❌ Follows deleted                                         │
└─────────────────────────────────────────────────────────────┘
```

## 2. Block User Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    ADMIN PANEL                              │
│                                                             │
│  Admin clicks "Block" on user                              │
│         │                                                   │
│         ▼                                                   │
│  PATCH /api/admin/users                                    │
│  { isBlocked: true }                                       │
└─────────────────────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND                                  │
│                                                             │
│  Update user.isBlocked = true                              │
│  Save to database                                          │
└─────────────────────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────┐
│                    MOBILE APP                               │
│                                                             │
│  Scenario A: User tries to login                           │
│  ────────────────────────────────                          │
│  POST /api/app/verify-otp                                  │
│         │                                                   │
│         ▼                                                   │
│  Backend checks: isBlocked = true                          │
│         │                                                   │
│         ▼                                                   │
│  Return 403 with message                                   │
│         │                                                   │
│         ▼                                                   │
│  Show alert: "Account blocked"                             │
│  Redirect to login                                         │
│                                                             │
│  Scenario B: User already logged in                        │
│  ────────────────────────────────────                      │
│  Every 30 seconds:                                         │
│  GET /api/app/check-account-status/{userId}               │
│         │                                                   │
│         ▼                                                   │
│  Backend checks: isBlocked = true                          │
│         │                                                   │
│         ▼                                                   │
│  Return { shouldLogout: true }                             │
│         │                                                   │
│         ▼                                                   │
│  Clear userId from storage                                 │
│  Show alert: "Account blocked"                             │
│  Redirect to login                                         │
└─────────────────────────────────────────────────────────────┘
```

## 3. Ban User Flow (with Duration)

```
┌─────────────────────────────────────────────────────────────┐
│                    ADMIN PANEL                              │
│                                                             │
│  Admin clicks "Ban" on user                                │
│         │                                                   │
│         ▼                                                   │
│  Prompt: "Enter days (empty = permanent)"                  │
│         │                                                   │
│    ┌────┴────┐                                             │
│    │         │                                             │
│    ▼         ▼                                             │
│  "3"      [empty]                                          │
│    │         │                                             │
│    ▼         ▼                                             │
│  PATCH /api/admin/users                                    │
│  { isBanned: true, banDays: 3 }  or  { isBanned: true }  │
└─────────────────────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND                                  │
│                                                             │
│  if (banDays > 0) {                                        │
│    banUntil = now + 3 days                                 │
│    banReason = "Banned for 3 days"                         │
│  } else {                                                  │
│    banUntil = null                                         │
│    banReason = "Permanently banned"                        │
│  }                                                         │
│  isBanned = true                                           │
│  Save to database                                          │
└─────────────────────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────┐
│                    MOBILE APP                               │
│                                                             │
│  User tries to login                                       │
│         │                                                   │
│         ▼                                                   │
│  POST /api/app/verify-otp                                  │
│         │                                                   │
│         ▼                                                   │
│  Backend checks: isBanned = true                           │
│         │                                                   │
│    ┌────┴────┐                                             │
│    │         │                                             │
│    ▼         ▼                                             │
│  banUntil   banUntil                                       │
│  = date     = null                                         │
│    │         │                                             │
│    ▼         ▼                                             │
│  "Banned    "Permanently                                   │
│   for 3     banned"                                        │
│   days.                                                    │
│   Expires:                                                 │
│   [date]"                                                  │
│    │         │                                             │
│    └────┬────┘                                             │
│         │                                                   │
│         ▼                                                   │
│  Return 403 with message                                   │
│         │                                                   │
│         ▼                                                   │
│  Show alert with ban details                               │
│  Redirect to login                                         │
└─────────────────────────────────────────────────────────────┘
```

## 4. Auto-Unban Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    TIME PASSES                              │
│                                                             │
│  User banned for 3 days                                    │
│  banUntil = 2024-01-15 10:00:00                           │
│                                                             │
│  Current time = 2024-01-16 11:00:00                       │
│  (Ban expired!)                                            │
└─────────────────────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────┐
│                    MOBILE APP                               │
│                                                             │
│  User tries to login                                       │
│         │                                                   │
│         ▼                                                   │
│  POST /api/app/verify-otp                                  │
└─────────────────────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND                                  │
│                                                             │
│  Check: isBanned = true                                    │
│  Check: banUntil = 2024-01-15 10:00:00                    │
│  Check: now = 2024-01-16 11:00:00                         │
│         │                                                   │
│         ▼                                                   │
│  now > banUntil? YES!                                      │
│         │                                                   │
│         ▼                                                   │
│  Auto-unban:                                               │
│    isBanned = false                                        │
│    banUntil = null                                         │
│    banReason = null                                        │
│    Save to database                                        │
│         │                                                   │
│         ▼                                                   │
│  Allow login                                               │
└─────────────────────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────┐
│                    MOBILE APP                               │
│                                                             │
│  ✅ Login successful!                                       │
│  User can use app normally                                 │
└─────────────────────────────────────────────────────────────┘
```

## 5. Status Check Flow (Every 30 Seconds)

```
┌─────────────────────────────────────────────────────────────┐
│                    MOBILE APP                               │
│                                                             │
│  App starts                                                │
│         │                                                   │
│         ▼                                                   │
│  Start interval timer (30 seconds)                         │
│         │                                                   │
│         ▼                                                   │
│  ┌──────────────────────────────┐                         │
│  │  Every 30 seconds:           │                         │
│  │                              │                         │
│  │  GET /api/app/check-account- │                         │
│  │      status/{userId}         │                         │
│  │         │                    │                         │
│  │         ▼                    │                         │
│  │  Response:                   │                         │
│  │  {                           │                         │
│  │    isBlocked: false,         │                         │
│  │    isBanned: false,          │                         │
│  │    shouldLogout: false       │                         │
│  │  }                           │                         │
│  │         │                    │                         │
│  │         ▼                    │                         │
│  │  Continue normally           │                         │
│  └──────────────────────────────┘                         │
│         │                                                   │
│         │ (Admin blocks/bans user)                         │
│         │                                                   │
│         ▼                                                   │
│  ┌──────────────────────────────┐                         │
│  │  Next check (30 sec later):  │                         │
│  │                              │                         │
│  │  GET /api/app/check-account- │                         │
│  │      status/{userId}         │                         │
│  │         │                    │                         │
│  │         ▼                    │                         │
│  │  Response:                   │                         │
│  │  {                           │                         │
│  │    isBlocked: true,          │                         │
│  │    isBanned: false,          │                         │
│  │    shouldLogout: true,       │                         │
│  │    message: "Account blocked"│                         │
│  │  }                           │                         │
│  │         │                    │                         │
│  │         ▼                    │                         │
│  │  Clear userId from storage   │                         │
│  │  Show alert                  │                         │
│  │  Redirect to login           │                         │
│  └──────────────────────────────┘                         │
└─────────────────────────────────────────────────────────────┘
```

## 6. Complete User Journey

```
┌─────────────────────────────────────────────────────────────┐
│                    USER JOURNEY                             │
│                                                             │
│  1. User installs app                                      │
│         │                                                   │
│         ▼                                                   │
│  2. User enters phone number                               │
│         │                                                   │
│         ▼                                                   │
│  3. User enters OTP (12345)                                │
│         │                                                   │
│         ▼                                                   │
│  4. Backend checks:                                        │
│     ✓ OTP valid?                                           │
│     ✓ User blocked?                                        │
│     ✓ User banned?                                         │
│     ✓ Ban expired?                                         │
│         │                                                   │
│    ┌────┴────┐                                             │
│    │         │                                             │
│    ▼         ▼                                             │
│  PASS      FAIL                                            │
│    │         │                                             │
│    │         ▼                                             │
│    │    Show error                                         │
│    │    Redirect to login                                  │
│    │                                                        │
│    ▼                                                        │
│  5. Login successful                                       │
│         │                                                   │
│         ▼                                                   │
│  6. User uses app                                          │
│         │                                                   │
│         ▼                                                   │
│  7. Every 30 seconds:                                      │
│     Check account status                                   │
│         │                                                   │
│    ┌────┴────┐                                             │
│    │         │                                             │
│    ▼         ▼                                             │
│  ACTIVE   BLOCKED/BANNED                                   │
│    │         │                                             │
│    │         ▼                                             │
│    │    Logout user                                        │
│    │    Show alert                                         │
│    │    Redirect to login                                  │
│    │                                                        │
│    ▼                                                        │
│  Continue using app                                        │
└─────────────────────────────────────────────────────────────┘
```

## 7. Admin Actions Summary

```
┌──────────────────────────────────────────────────────────────┐
│                    ADMIN ACTIONS                             │
│                                                              │
│  DELETE USER                                                 │
│  ────────────                                                │
│  Effect: User permanently removed from database              │
│  Impact: Cannot login, all data deleted                      │
│  Reversible: No                                              │
│                                                              │
│  BLOCK USER                                                  │
│  ───────────                                                 │
│  Effect: User cannot login                                   │
│  Impact: Immediate, force logout if logged in               │
│  Reversible: Yes (Unblock)                                   │
│                                                              │
│  BAN USER (3 DAYS)                                           │
│  ──────────────────                                          │
│  Effect: User cannot login for 3 days                        │
│  Impact: Immediate, force logout if logged in               │
│  Reversible: Yes (Unban or wait 3 days)                     │
│  Auto-expires: Yes                                           │
│                                                              │
│  BAN USER (PERMANENT)                                        │
│  ─────────────────────                                       │
│  Effect: User cannot login forever                           │
│  Impact: Immediate, force logout if logged in               │
│  Reversible: Yes (Unban)                                     │
│  Auto-expires: No                                            │
│                                                              │
│  UNBLOCK USER                                                │
│  ─────────────                                               │
│  Effect: User can login again                                │
│  Impact: Immediate                                           │
│                                                              │
│  UNBAN USER                                                  │
│  ───────────                                                 │
│  Effect: User can login again                                │
│  Impact: Immediate                                           │
└──────────────────────────────────────────────────────────────┘
```

---

**These diagrams show the complete flow of the user management system! 📊**
