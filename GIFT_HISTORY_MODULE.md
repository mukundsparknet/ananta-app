# 🎁 Gift History Module - Complete Documentation

## 🎯 Overview

The Gift History module provides a comprehensive view of all gift transactions sent during live sessions (video and audio) in the ANANTA APP admin panel with advanced filtering, search, and Excel export capabilities.

---

## ✨ Features

### 1. **Statistics Dashboard**
- Total Gifts count
- Total Value (in coins)
- Video Live Gifts count
- Audio Live Gifts count
- Unique Senders count
- Unique Receivers count

### 2. **Advanced Filters**
- **Search**: Filter by sender username, receiver username, gift name, or session ID
- **Date Range**: Start Date and End Date filters
- **Clear Filters**: Reset all filters with one click

### 3. **Data Display**
- Gift ID
- Gift Name
- Sent By (Username + User ID)
- Sent To (Username + User ID)
- Gift Value (in coins)
- Session Type (VIDEO/AUDIO badge)
- Live Session ID
- Status (COMPLETED badge)
- Gift Date-Time (in IST format)

### 4. **Excel Export**
- Export filtered data to Excel (.xlsx)
- Includes all visible columns
- Automatic filename with current date
- Formatted columns with proper widths

---

## 📁 Files Created/Modified

### New Backend Files:
1. **`GiftTransaction.java`** - Model for gift transactions
2. **`GiftTransactionRepository.java`** - Repository for database operations
3. **`AdminGiftHistoryController.java`** - API endpoint for gift history
4. **`create_gift_transactions_table.sql`** - SQL script to create table

### Modified Backend Files:
5. **`AppGiftController.java`** - Updated to save gift transactions

### New Frontend Files:
6. **`adminpanel/app/gift-history/page.tsx`** - Gift History page

### Modified Frontend Files:
7. **`adminpanel/app/layout.tsx`** - Added Gift History menu item

---

## 🚀 Installation Steps

### Step 1: Create Database Table
```bash
# Connect to PostgreSQL
psql -U postgres -d ananta_db

# Run the SQL script
\i /var/www/ANANTA-APP/adminpanel/backend/create_gift_transactions_table.sql

# Or copy-paste the SQL:
CREATE TABLE IF NOT EXISTS gift_transactions (
    id BIGSERIAL PRIMARY KEY,
    gift_id BIGINT NOT NULL,
    gift_name VARCHAR(255) NOT NULL,
    gift_value INTEGER NOT NULL,
    from_user_id VARCHAR(255) NOT NULL,
    from_username VARCHAR(255),
    to_user_id VARCHAR(255) NOT NULL,
    to_username VARCHAR(255),
    session_id VARCHAR(255),
    session_type VARCHAR(50),
    status VARCHAR(50) NOT NULL DEFAULT 'COMPLETED',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_gift_transactions_from_user ON gift_transactions(from_user_id);
CREATE INDEX idx_gift_transactions_to_user ON gift_transactions(to_user_id);
CREATE INDEX idx_gift_transactions_session ON gift_transactions(session_id);
CREATE INDEX idx_gift_transactions_created_at ON gift_transactions(created_at DESC);
```

### Step 2: Rebuild Backend
```bash
cd /var/www/ANANTA-APP/adminpanel/backend
sudo systemctl stop ananta-backend
./apache-maven-3.9.6/bin/mvn clean package -DskipTests
sudo systemctl start ananta-backend
```

### Step 3: Restart Admin Panel
```bash
cd adminpanel
npm install
npm run dev
```

### Step 4: Access Gift History
Navigate to: **http://localhost:3000/gift-history**

---

## 📊 How to Use

### Viewing Gift History

1. **Login to Admin Panel**
   - URL: http://localhost:3000
   - Email: admin@ananta.com
   - Password: Admin@123

2. **Navigate to Gift History**
   - Click "Gift History" in the sidebar menu

3. **View Statistics**
   - Total gifts sent
   - Total value in coins
   - Video vs Audio live gifts
   - Unique senders and receivers

### Using Filters

#### Search:
```
Type in search box: Username, Gift name, or Session ID
Example: "john" or "Rose" or "live_123"
Results update automatically
```

#### Filter by Date Range:
```
Start Date: 2024-01-01
End Date: 2024-01-31
Shows gifts sent between these dates
```

#### Clear All Filters:
```
Click "Clear Filters" button
All filters reset to default
```

### Exporting to Excel

1. **Apply Filters** (optional)
   - Filter data as needed
   - Only filtered data will be exported

2. **Click "Export to Excel"**
   - Button is at top-right of table
   - Disabled if no data available

3. **File Downloads Automatically**
   - Filename: `Gift_History_YYYY-MM-DD.xlsx`
   - Opens in Excel/LibreOffice/Google Sheets

---

## 📋 Excel Export Format

### Columns Included:
1. **Gift ID** - Unique gift identifier
2. **Gift Name** - Name of the gift
3. **Gift Value (Coins)** - Value in coins
4. **Sent By User ID** - Sender's user ID
5. **Sent By Username** - Sender's username
6. **Sent To User ID** - Receiver's user ID
7. **Sent To Username** - Receiver's username
8. **Session Type** - VIDEO or AUDIO
9. **Live Session ID** - Session identifier
10. **Status** - COMPLETED
11. **Gift Date** - Date and time in IST

### Example Excel Output:
```
| Gift ID | Gift Name | Value | Sent By ID | Sent By    | Sent To ID | Sent To    | Type  | Session ID | Status    | Date                       |
|---------|-----------|-------|------------|------------|------------|------------|-------|------------|-----------|----------------------------|
| 1       | Rose      | 100   | AN123456   | john_doe   | AN789012   | jane_host  | VIDEO | live_abc   | COMPLETED | Jan 15, 2024, 02:30 PM IST |
| 2       | Diamond   | 500   | AN345678   | mike_user  | AN789012   | jane_host  | AUDIO | live_xyz   | COMPLETED | Jan 16, 2024, 10:15 AM IST |
```

---

## 🎨 UI Components

### Statistics Cards
```
┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐
│ Total Gifts         │  │ Total Value         │  │ Video Live Gifts    │
│ 250                 │  │ 125,000 💎          │  │ 180                 │
└─────────────────────┘  └─────────────────────┘  └─────────────────────┘

┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐
│ Audio Live Gifts    │  │ Unique Senders      │  │ Unique Receivers    │
│ 70                  │  │ 45                  │  │ 12                  │
└─────────────────────┘  └─────────────────────┘  └─────────────────────┘
```

### Filters Section
```
┌──────────────────────────────────────────────────────────────────┐
│ Filters                                          [Clear Filters]  │
├──────────────────────────────────────────────────────────────────┤
│ [Search User/Gift/Session] [Start Date] [End Date]              │
│                                                                   │
│ Showing 50 of 250 gift transactions                              │
└──────────────────────────────────────────────────────────────────┘
```

### Data Table
```
┌────────────────────────────────────────────────────────────────────────────────────┐
│ Gift ID │ Name   │ Sent By  │ Sent To  │ Value │ Type  │ Session │ Status │ Date  │
├────────────────────────────────────────────────────────────────────────────────────┤
│ #1      │ Rose   │ john_doe │ jane_doe │ 100💎 │ VIDEO │ live... │ ✓      │ Jan.. │
│ #2      │ Diamond│ mike_usr │ jane_doe │ 500💎 │ AUDIO │ live... │ ✓      │ Jan.. │
└────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 🔧 Technical Details

### API Endpoints

#### 1. Get All Gift Transactions
```
GET /api/admin/gift-history
Headers: Authorization: Bearer <token>
Response: { transactions: [...] }
```

#### 2. Send Gift (Updated)
```
POST /api/app/gifts/send
Headers: Authorization: Bearer <token>
Body: {
  fromUserId: "AN123456",
  toUserId: "AN789012",
  giftId: 1,
  sessionId: "live_abc123",
  sessionType: "VIDEO"
}
Response: { fromBalance, toBalance, ... }
```

### Database Schema

```sql
CREATE TABLE gift_transactions (
    id BIGSERIAL PRIMARY KEY,
    gift_id BIGINT NOT NULL,
    gift_name VARCHAR(255) NOT NULL,
    gift_value INTEGER NOT NULL,
    from_user_id VARCHAR(255) NOT NULL,
    from_username VARCHAR(255),
    to_user_id VARCHAR(255) NOT NULL,
    to_username VARCHAR(255),
    session_id VARCHAR(255),
    session_type VARCHAR(50),
    status VARCHAR(50) DEFAULT 'COMPLETED',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Data Flow

```
┌─────────────────┐
│ Mobile App      │
│ (Live Session)  │
└────────┬────────┘
         │ POST /api/app/gifts/send
         │ { fromUserId, toUserId, giftId, sessionId, sessionType }
         ▼
┌─────────────────┐
│ Backend API     │
│ (Spring Boot)   │
└────────┬────────┘
         │ 1. Deduct coins from sender
         │ 2. Add coins to receiver
         │ 3. Save gift_transaction record
         ▼
┌─────────────────┐
│ PostgreSQL DB   │
│ (IST timezone)  │
└─────────────────┘
         │
         │ GET /api/admin/gift-history
         ▼
┌─────────────────┐
│ Admin Panel     │
│ (React)         │
└─────────────────┘
```

---

## 🎯 Use Cases

### Use Case 1: Track Top Gift Senders
```
1. View statistics: "Unique Senders"
2. Search by specific username
3. Export to Excel for analysis
```

### Use Case 2: Monitor Live Session Gifts
```
1. Search by Session ID
2. View all gifts sent in that session
3. See total value and participants
```

### Use Case 3: Monthly Gift Report
```
1. Set Start Date: 2024-01-01
2. Set End Date: 2024-01-31
3. Click "Export to Excel"
4. Generate monthly report
```

### Use Case 4: Audit Video vs Audio Gifts
```
1. View statistics cards
2. Compare Video Live Gifts vs Audio Live Gifts
3. Export data for analysis
```

---

## 🌍 Timezone Handling

All dates are displayed in **IST (Indian Standard Time)**:

```typescript
const formatDateTime = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Kolkata'
  }) + ' IST';
};
```

**Example Output:** `Jan 15, 2024, 02:30 PM IST`

---

## 🎨 Badge Colors

### Session Type Badges

#### VIDEO
- Background: `#ebf8ff` (light blue)
- Text: `#3182ce` (dark blue)
- Border: `#bee3f8` (blue)

#### AUDIO
- Background: `#f3e8ff` (light purple)
- Text: `#805ad5` (dark purple)
- Border: `#d6bcfa` (purple)

### Status Badge

#### COMPLETED
- Background: `#f0fff4` (light green)
- Text: `#38a169` (dark green)
- Border: `#9ae6b4` (green)

---

## 🔒 Security

### Authentication Required
- All API calls require JWT token
- Token stored in localStorage
- Automatically included in headers

### Authorization
- Only admin users can access
- Protected by backend authentication

---

## 📱 Responsive Design

The page is fully responsive:
- **Desktop**: Full table view with all columns
- **Tablet**: Horizontal scroll for table
- **Mobile**: Horizontal scroll with optimized padding

---

## 🚀 Performance Optimization

### Efficient Filtering
- Client-side filtering for instant results
- No API calls on filter changes
- Real-time search feedback

### Database Indexes
- Indexed on from_user_id
- Indexed on to_user_id
- Indexed on session_id
- Indexed on created_at (DESC)

### Excel Export
- Processed client-side
- No server load
- Instant download

---

## ✅ Testing Checklist

- [ ] Database table created successfully
- [ ] Backend builds without errors
- [ ] Backend starts successfully
- [ ] Page loads without errors
- [ ] Statistics display correctly
- [ ] Search filter works
- [ ] Date filters work
- [ ] Clear filters button works
- [ ] Excel export works
- [ ] Exported file opens correctly
- [ ] All columns present in export
- [ ] IST timezone displayed correctly
- [ ] Responsive on mobile
- [ ] Loading state shows properly
- [ ] Gift transactions save correctly
- [ ] Session ID and type captured

---

## 🎉 Success!

Your Gift History module is now complete with:

✅ Comprehensive gift tracking  
✅ Live session integration  
✅ Advanced search and filters  
✅ Date range filtering  
✅ Excel export functionality  
✅ IST timezone display  
✅ Real-time statistics  
✅ Professional UI design  
✅ Responsive layout  
✅ Complete documentation  

---

**Access URL:** http://localhost:3000/gift-history

**Menu Location:** Sidebar → Gift History

**Export Format:** Excel (.xlsx)

**Timezone:** IST (Indian Standard Time)

**Data Tracked:** Gift ID, Name, Sender, Receiver, Value, Session Type, Session ID, Status, Date
