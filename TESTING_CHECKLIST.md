# 🧪 Testing Checklist - User Management System

## Pre-Testing Setup

- [ ] Database migration completed (`add_ban_columns.sql` executed)
- [ ] Backend rebuilt and restarted
- [ ] Admin panel restarted
- [ ] Mobile app rebuilt and restarted

## 1. Permanent User Deletion

### Test Case 1.1: Delete User
- [ ] Login to admin panel (http://localhost:3000/users)
- [ ] Click "Delete" on a test user
- [ ] Confirm deletion
- [ ] **Expected**: User disappears from list
- [ ] **Verify in DB**: User record deleted from `users` table
- [ ] **Verify in DB**: Related KYC records deleted
- [ ] **Verify in DB**: Related wallet records deleted
- [ ] **Verify in DB**: Related follow records deleted

### Test Case 1.2: Delete User with Lots of Data
- [ ] Create a user with profile, KYC, wallet, follows
- [ ] Delete the user
- [ ] **Expected**: All data removed, no errors

## 2. Block Functionality

### Test Case 2.1: Block Prevents New Login
- [ ] Block a user from admin panel
- [ ] Try to login with that user's phone in mobile app
- [ ] Enter OTP (12345)
- [ ] **Expected**: Error message "Your account has been blocked. Please contact support."
- [ ] **Expected**: Redirected to login screen

### Test Case 2.2: Block Forces Logout
- [ ] Login to mobile app with a user
- [ ] Keep app open
- [ ] Block that user from admin panel
- [ ] Wait 30-60 seconds
- [ ] **Expected**: Alert appears with block message
- [ ] **Expected**: User logged out and redirected to login

### Test Case 2.3: Unblock Allows Login
- [ ] Unblock a previously blocked user
- [ ] Try to login with that user
- [ ] **Expected**: Login successful

## 3. Ban with Duration

### Test Case 3.1: Temporary Ban (3 Days)
- [ ] Click "Ban" on a user
- [ ] Enter "3" in the prompt
- [ ] Click OK
- [ ] **Expected**: User status shows "Banned"
- [ ] Try to login with that user
- [ ] **Expected**: Error message "Your account is banned: Banned for 3 days. Ban expires on: [date]"
- [ ] **Verify in DB**: `ban_until` is set to 3 days from now
- [ ] **Verify in DB**: `ban_reason` is "Banned for 3 days"

### Test Case 3.2: Permanent Ban
- [ ] Click "Ban" on a user
- [ ] Leave prompt empty or click Cancel
- [ ] Click OK
- [ ] **Expected**: User status shows "Banned"
- [ ] Try to login with that user
- [ ] **Expected**: Error message "Your account has been permanently banned. Please contact support."
- [ ] **Verify in DB**: `ban_until` is NULL
- [ ] **Verify in DB**: `ban_reason` is "Permanently banned"

### Test Case 3.3: Ban Forces Logout
- [ ] Login to mobile app with a user
- [ ] Keep app open
- [ ] Ban that user from admin panel (any duration)
- [ ] Wait 30-60 seconds
- [ ] **Expected**: Alert appears with ban message
- [ ] **Expected**: User logged out and redirected to login

### Test Case 3.4: Auto-Unban After Duration
**Note**: This test requires waiting or manually updating the database

Option A (Manual DB Update):
- [ ] Ban a user for 3 days
- [ ] Manually update DB: `UPDATE users SET ban_until = NOW() - INTERVAL '1 day' WHERE user_id = 'XXX';`
- [ ] Try to login with that user
- [ ] **Expected**: Login successful (ban expired)
- [ ] **Verify in DB**: `is_banned` is now false, `ban_until` is NULL

Option B (Wait):
- [ ] Ban a user for 1 minute (modify code temporarily to use minutes instead of days)
- [ ] Wait 1 minute
- [ ] Try to login
- [ ] **Expected**: Login successful

### Test Case 3.5: Unban User
- [ ] Click "Unban" on a banned user
- [ ] **Expected**: User status shows "Active"
- [ ] Try to login with that user
- [ ] **Expected**: Login successful
- [ ] **Verify in DB**: `is_banned` is false, `ban_until` is NULL, `ban_reason` is NULL

## 4. Status Messages

### Test Case 4.1: Block Message
- [ ] Block a user
- [ ] Try to login
- [ ] **Expected**: "Your account has been blocked. Please contact support."

### Test Case 4.2: Temporary Ban Message
- [ ] Ban a user for 5 days
- [ ] Try to login
- [ ] **Expected**: "Your account is banned: Banned for 5 days. Ban expires on: [specific date/time]"

### Test Case 4.3: Permanent Ban Message
- [ ] Ban a user permanently
- [ ] Try to login
- [ ] **Expected**: "Your account has been permanently banned. Please contact support."

## 5. Real-time Status Checking

### Test Case 5.1: Periodic Check Works
- [ ] Login to mobile app
- [ ] Open browser dev tools / React Native debugger
- [ ] Watch network requests
- [ ] **Expected**: See requests to `/api/app/check-account-status/` every 30 seconds

### Test Case 5.2: Status Check Detects Block
- [ ] Login to mobile app
- [ ] Keep app in foreground
- [ ] Block user from admin panel
- [ ] Wait up to 30 seconds
- [ ] **Expected**: Alert appears and user is logged out

### Test Case 5.3: Status Check Detects Ban
- [ ] Login to mobile app
- [ ] Keep app in foreground
- [ ] Ban user from admin panel
- [ ] Wait up to 30 seconds
- [ ] **Expected**: Alert appears and user is logged out

## 6. Edge Cases

### Test Case 6.1: Invalid Ban Days
- [ ] Click "Ban" on a user
- [ ] Enter "abc" (non-numeric)
- [ ] **Expected**: Error message "Please enter a valid number"
- [ ] **Expected**: User not banned

### Test Case 6.2: Negative Ban Days
- [ ] Click "Ban" on a user
- [ ] Enter "-5"
- [ ] **Expected**: Treated as permanent ban (0 or negative = permanent)

### Test Case 6.3: Very Large Ban Days
- [ ] Click "Ban" on a user
- [ ] Enter "999999"
- [ ] **Expected**: User banned for 999999 days
- [ ] **Verify**: No errors, ban_until calculated correctly

### Test Case 6.4: Delete Already Deleted User
- [ ] Delete a user
- [ ] Try to delete the same user again (if possible)
- [ ] **Expected**: Error message "User not found" or graceful handling

### Test Case 6.5: Block Already Blocked User
- [ ] Block a user
- [ ] Block the same user again
- [ ] **Expected**: No errors, user remains blocked

## 7. Database Verification

After each test, verify in database:

```sql
-- Check user status
SELECT user_id, username, is_blocked, is_banned, ban_until, ban_reason 
FROM users 
WHERE user_id = 'YOUR_TEST_USER_ID';

-- Check if related data deleted
SELECT COUNT(*) FROM kyc_records WHERE user_id = 'DELETED_USER_ID'; -- Should be 0
SELECT COUNT(*) FROM wallets WHERE user_id = 'DELETED_USER_ID'; -- Should be 0
SELECT COUNT(*) FROM follows WHERE follower_id = 'DELETED_USER_ID' OR followee_id = 'DELETED_USER_ID'; -- Should be 0
```

## 8. Performance Testing

### Test Case 8.1: Delete User with Many Records
- [ ] Create a user with 100+ follows, 50+ transactions
- [ ] Delete the user
- [ ] **Expected**: Deletion completes within 5 seconds
- [ ] **Expected**: No errors

### Test Case 8.2: Multiple Concurrent Status Checks
- [ ] Login with 5 different users on 5 devices/browsers
- [ ] **Expected**: All status checks work without conflicts
- [ ] **Expected**: No performance degradation

## 📊 Test Results Summary

| Test Case | Status | Notes |
|-----------|--------|-------|
| 1.1 Delete User | ⬜ | |
| 1.2 Delete User with Data | ⬜ | |
| 2.1 Block Prevents Login | ⬜ | |
| 2.2 Block Forces Logout | ⬜ | |
| 2.3 Unblock Allows Login | ⬜ | |
| 3.1 Temporary Ban | ⬜ | |
| 3.2 Permanent Ban | ⬜ | |
| 3.3 Ban Forces Logout | ⬜ | |
| 3.4 Auto-Unban | ⬜ | |
| 3.5 Unban User | ⬜ | |
| 4.1 Block Message | ⬜ | |
| 4.2 Temporary Ban Message | ⬜ | |
| 4.3 Permanent Ban Message | ⬜ | |
| 5.1 Periodic Check | ⬜ | |
| 5.2 Check Detects Block | ⬜ | |
| 5.3 Check Detects Ban | ⬜ | |
| 6.1 Invalid Ban Days | ⬜ | |
| 6.2 Negative Ban Days | ⬜ | |
| 6.3 Large Ban Days | ⬜ | |
| 6.4 Delete Deleted User | ⬜ | |
| 6.5 Block Blocked User | ⬜ | |
| 8.1 Delete Many Records | ⬜ | |
| 8.2 Concurrent Checks | ⬜ | |

**Legend**: ⬜ Not Tested | ✅ Passed | ❌ Failed

## 🎯 Success Criteria

All tests should pass with:
- ✅ No errors in backend logs
- ✅ No errors in frontend console
- ✅ No errors in mobile app
- ✅ Database integrity maintained
- ✅ User experience is smooth
- ✅ Messages are clear and helpful

---

**Happy Testing! 🧪**
