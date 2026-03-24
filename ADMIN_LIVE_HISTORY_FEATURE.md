# 📹 Admin Live History Feature

## ✨ What's New

Admins can now view a user's complete live streaming history from the Users page. A new "Live History" button has been added to the actions column.

## 📍 Location

**Admin Panel** → Users → Actions → **Live History** (New Button)

## 🎨 Button Design

### Live History Button
- **Color**: Green (#38a169)
- **Style**: Outlined button with white background
- **Position**: Between "Edit" and "Delete" buttons
- **Text**: "Live History"

## 📊 Live History Page Features

### 1. Stats Cards (Top Section)
```
┌─────────────────────────────────────────────┐
│  Total Sessions  │  Video  │  Audio  │  Viewers  │
│       12         │    8    │    4    │    245    │
└─────────────────────────────────────────────┘
```

### 2. Sessions Table
Displays all live sessions with:
- **Session ID** - Truncated session identifier
- **Title** - Session title
- **Type** - VIDEO or AUDIO badge
- **Started** - Start date and time
- **Ended** - End date and time
- **Duration** - Calculated duration (minutes and seconds)
- **Viewers** - Total viewer count
- **Status** - LIVE or ENDED badge

## 🔧 Technical Implementation

### Users Page Update (`users/page.tsx`)

Added "Live History" button:
```tsx
<button 
  onClick={() => router.push(`/users/${user.userId}/live-history`)}
  style={{
    padding:'8px 14px',
    border:'1px solid #38a169',
    borderRadius:6,
    cursor:'pointer',
    fontSize:13,
    fontWeight:600,
    background:'white',
    color:'#38a169',
    transition:'all 0.2s'
  }}
>
  Live History
</button>
```

### Live History Page (`users/[userId]/live-history/page.tsx`)

#### Data Fetching
```tsx
// Fetch user details
const userRes = await axios.get(`/api/admin/users/${userId}`, {
  headers: { Authorization: `Bearer ${token}` }
});

// Fetch live history
const historyRes = await axios.get(`/api/app/live/history/${userId}`, {
  headers: { Authorization: `Bearer ${token}` }
});
```

#### Stats Calculation
```tsx
// Total Sessions
sessions.length

// Video Sessions
sessions.filter(s => s.type === 'VIDEO').length

// Audio Sessions
sessions.filter(s => s.type === 'AUDIO').length

// Total Viewers
sessions.reduce((sum, s) => sum + (s.viewerCount || 0), 0)
```

#### Duration Calculation
```tsx
const calculateDuration = (startDate: string, endDate: string) => {
  if (!startDate || !endDate) return 'N/A';
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  const durationMs = end - start;
  const minutes = Math.floor(durationMs / 60000);
  const seconds = Math.floor((durationMs % 60000) / 1000);
  return `${minutes}m ${seconds}s`;
};
```

## 📱 User Interface

### Page Header
```
← Back to Users
Live History - @username
View all live sessions for this user
```

### Stats Cards Layout
```
┌──────────────┬──────────────┬──────────────┬──────────────┐
│ Total        │ Video        │ Audio        │ Total        │
│ Sessions     │ Sessions     │ Sessions     │ Viewers      │
│    12        │     8        │     4        │    245       │
└──────────────┴──────────────┴──────────────┴──────────────┘
```

### Table Columns
1. **Session ID** - Truncated (first 8 chars)
2. **Title** - Session title
3. **Type** - Badge (VIDEO/AUDIO)
4. **Started** - Formatted date/time
5. **Ended** - Formatted date/time
6. **Duration** - Calculated (Xm Ys)
7. **Viewers** - Count
8. **Status** - Badge (LIVE/ENDED)

## 🎨 Visual Design

### Type Badges
- **VIDEO**: Blue background (#ebf8ff), blue text (#3182ce)
- **AUDIO**: Purple background (#f3e8ff), purple text (#805ad5)

### Status Badges
- **LIVE**: Green background (#f0fff4), green text (#38a169)
- **ENDED**: Gray background (#f7fafc), gray text (#718096)

### Stats Cards
- White background
- Border: #e2e8f0
- Shadow: 0 1px 3px rgba(0,0,0,0.1)
- Large numbers (32px, bold)
- Small labels (14px, gray)

## 🔄 User Flow

```
Admin Panel
    ↓
Users Page
    ↓
Click "Live History" button
    ↓
Live History Page
    ↓
View user's sessions
    ↓
Click "Back to Users"
    ↓
Return to Users Page
```

## 📊 Data Display

### Session Information
```
┌─────────────────────────────────────────────────────────┐
│ abc12345... │ My Live │ VIDEO │ Jan 15, 2:30 PM │ ...  │
│             │ Stream  │       │ Jan 15, 3:45 PM │ 1h15m│
│             │         │       │                 │  45  │
│             │         │       │                 │ ENDED│
└─────────────────────────────────────────────────────────┘
```

### Empty State
```
┌─────────────────────────┐
│          📹            │
│ No live sessions found  │
│ This user hasn't hosted │
│ any live sessions yet   │
└─────────────────────────┘
```

## 🎯 Features

✅ **View All Sessions** - Complete history of user's live streams
✅ **Session Details** - Title, type, dates, duration, viewers
✅ **Stats Overview** - Quick summary cards at the top
✅ **Type Filtering** - Visual distinction between video/audio
✅ **Status Tracking** - See which sessions are live or ended
✅ **Duration Calculation** - Automatic duration display
✅ **Back Navigation** - Easy return to users page

## 📝 API Endpoints Used

### Get User Details
```
GET /api/admin/users/${userId}
Headers: Authorization: Bearer ${token}
```

### Get Live History
```
GET /api/app/live/history/${userId}
Headers: Authorization: Bearer ${token}
```

## 🎨 Button Order in Users Page

```
View | Edit | Live History | Delete | Block/Unblock | Ban/Unban
```

## 📊 Stats Card Colors

| Stat | Color | Hex |
|------|-------|-----|
| Total Sessions | Black | #1a202c |
| Video Sessions | Blue | #3182ce |
| Audio Sessions | Purple | #805ad5 |
| Total Viewers | Green | #38a169 |

## 🔍 Session Details

### Date Format
```
Jan 15, 2024, 2:30 PM
```

### Duration Format
```
75m 30s  (75 minutes, 30 seconds)
```

### Session ID Display
```
abc12345...  (first 8 characters)
```

## 🎯 Use Cases

### 1. Monitor User Activity
Admin can see how active a user is with live streaming

### 2. Check Session Quality
View viewer counts to assess session popularity

### 3. Verify Compliance
Ensure users are following live streaming guidelines

### 4. Support Inquiries
Quickly access session history for support tickets

### 5. Analytics
Track video vs audio session preferences

## 🧪 Testing Checklist

- [x] Live History button appears in users table
- [x] Button navigates to correct page
- [x] User details load correctly
- [x] Live sessions display in table
- [x] Stats cards show correct counts
- [x] Duration calculates properly
- [x] Type badges display correctly
- [x] Status badges display correctly
- [x] Empty state shows when no sessions
- [x] Back button returns to users page
- [x] Responsive on different screen sizes

## 📱 Responsive Design

### Desktop
- Full table with all columns
- Stats cards in 4-column grid
- Comfortable spacing

### Tablet
- Horizontal scroll for table
- Stats cards in 2-column grid
- Maintained readability

### Mobile
- Horizontal scroll for table
- Stats cards in 1-column stack
- Touch-friendly buttons

## 🎉 Benefits

✅ **Complete Visibility** - See all user live sessions
✅ **Quick Access** - One click from users page
✅ **Detailed Information** - All session data in one place
✅ **Easy Navigation** - Back button for quick return
✅ **Visual Stats** - Quick overview with cards
✅ **Professional UI** - Clean, modern design

## 📝 Notes

- Sessions are sorted by creation date (newest first)
- Duration is calculated from start to end time
- Viewer count shows peak viewers during session
- Session ID is truncated for readability
- Empty state appears when user has no sessions

## 🎉 Complete!

Admins can now easily view and monitor user live streaming history! 🚀

### Quick Access
```
Users Page → Live History Button → User's Complete Live History
```
