# 💳 Recharge History Module - Complete Documentation

## 🎯 Overview

The Recharge History module provides a comprehensive view of all recharge transactions in the ANANTA APP admin panel with advanced filtering, search, and Excel export capabilities.

---

## ✨ Features

### 1. **Statistics Dashboard**
- Total Recharges count
- Pending recharges count
- Approved recharges count
- Rejected recharges count
- Total Amount (₹)
- Total Coins distributed

### 2. **Advanced Filters**
- **Search**: Filter by User ID or Username
- **Status Filter**: All / Pending / Approved / Rejected
- **Date Range**: Start Date and End Date filters
- **Clear Filters**: Reset all filters with one click

### 3. **Data Display**
- User ID
- Username
- Plan Name (Recharge package name)
- Amount (₹)
- Coins
- Status (with color-coded badges)
- Recharge Date-Time (in IST format)

### 4. **Excel Export**
- Export filtered data to Excel (.xlsx)
- Includes all visible columns
- Automatic filename with current date
- Formatted columns with proper widths

---

## 📁 Files Created/Modified

### New Files:
1. **`adminpanel/app/recharge-history/page.tsx`**
   - Main Recharge History page component
   - Complete with filters, search, and export

### Modified Files:
1. **`adminpanel/package.json`**
   - Added `xlsx` package for Excel export

2. **`adminpanel/app/layout.tsx`**
   - Added "Recharge History" menu item to sidebar

---

## 🚀 Installation Steps

### Step 1: Install Dependencies
```bash
cd adminpanel
npm install
```

This will install the `xlsx` package for Excel export functionality.

### Step 2: Start Admin Panel
```bash
npm run dev
```

### Step 3: Access Recharge History
Navigate to: **http://localhost:3000/recharge-history**

---

## 📊 How to Use

### Viewing Recharge History

1. **Login to Admin Panel**
   - URL: http://localhost:3000
   - Email: admin@ananta.com
   - Password: Admin@123

2. **Navigate to Recharge History**
   - Click "Recharge History" in the sidebar menu

3. **View Statistics**
   - See total recharges, pending, approved, rejected
   - View total amount and coins

### Using Filters

#### Search by User ID or Username:
```
Type in search box: "AN123" or "john"
Results update automatically
```

#### Filter by Status:
```
Select from dropdown:
- All Status (default)
- Pending
- Approved
- Rejected
```

#### Filter by Date Range:
```
Start Date: 2024-01-01
End Date: 2024-01-31
Shows recharges between these dates
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
   - Filename: `Recharge_History_YYYY-MM-DD.xlsx`
   - Opens in Excel/LibreOffice/Google Sheets

---

## 📋 Excel Export Format

### Columns Included:
1. **User ID** - Unique user identifier
2. **Username** - User's display name
3. **Plan Name** - Recharge package name
4. **Amount (₹)** - Recharge amount in rupees
5. **Coins** - Coins credited
6. **Status** - PENDING / APPROVED / REJECTED
7. **Recharge Date** - Date and time in IST
8. **Updated Date** - Last update date and time in IST

### Example Excel Output:
```
| User ID    | Username | Plan Name    | Amount (₹) | Coins | Status   | Recharge Date              | Updated Date               |
|------------|----------|--------------|------------|-------|----------|----------------------------|----------------------------|
| AN123456   | john_doe | Premium Plan | 500        | 5000  | APPROVED | Jan 15, 2024, 02:30 PM IST | Jan 15, 2024, 02:35 PM IST |
| AN789012   | jane_doe | Basic Plan   | 100        | 1000  | PENDING  | Jan 16, 2024, 10:15 AM IST | Jan 16, 2024, 10:15 AM IST |
```

---

## 🎨 UI Components

### Statistics Cards
```
┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐
│ Total Recharges     │  │ Pending             │  │ Approved            │
│ 150                 │  │ 25                  │  │ 100                 │
└─────────────────────┘  └─────────────────────┘  └─────────────────────┘

┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐
│ Rejected            │  │ Total Amount        │  │ Total Coins         │
│ 25                  │  │ ₹75,000             │  │ 750,000             │
└─────────────────────┘  └─────────────────────┘  └─────────────────────┘
```

### Filters Section
```
┌──────────────────────────────────────────────────────────────────┐
│ Filters                                          [Clear Filters]  │
├──────────────────────────────────────────────────────────────────┤
│ [Search User ID/Username] [Status ▼] [Start Date] [End Date]    │
│                                                                   │
│ Showing 50 of 150 recharges                                      │
└──────────────────────────────────────────────────────────────────┘
```

### Data Table
```
┌────────────────────────────────────────────────────────────────────────────┐
│ User ID  │ Username │ Plan Name │ Amount │ Coins │ Status   │ Date        │
├────────────────────────────────────────────────────────────────────────────┤
│ AN123456 │ john_doe │ Premium   │ ₹500   │ 5000  │ APPROVED │ Jan 15, ... │
│ AN789012 │ jane_doe │ Basic     │ ₹100   │ 1000  │ PENDING  │ Jan 16, ... │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## 🔧 Technical Details

### API Endpoints Used

#### 1. Get All Recharges
```
GET /api/admin/recharges
Headers: Authorization: Bearer <token>
Response: { recharges: [...] }
```

#### 2. Get User Details
```
GET /api/admin/users/{userId}
Headers: Authorization: Bearer <token>
Response: { username: "john_doe", ... }
```

### Data Flow

```
┌─────────────────┐
│ Admin Panel     │
│ (React)         │
└────────┬────────┘
         │ GET /api/admin/recharges
         ▼
┌─────────────────┐
│ Backend API     │
│ (Spring Boot)   │
└────────┬────────┘
         │ SELECT * FROM daily_recharges
         ▼
┌─────────────────┐
│ PostgreSQL DB   │
│ (IST timezone)  │
└─────────────────┘
```

### State Management

```typescript
const [recharges, setRecharges] = useState<RechargeRecord[]>([]);
const [filteredRecharges, setFilteredRecharges] = useState<RechargeRecord[]>([]);
const [searchTerm, setSearchTerm] = useState('');
const [statusFilter, setStatusFilter] = useState<string>('ALL');
const [startDate, setStartDate] = useState('');
const [endDate, setEndDate] = useState('');
```

### Filter Logic

```typescript
// Search filter
if (searchTerm.trim()) {
  filtered = filtered.filter(r => 
    r.userId.toLowerCase().includes(search) ||
    r.username.toLowerCase().includes(search)
  );
}

// Status filter
if (statusFilter !== 'ALL') {
  filtered = filtered.filter(r => r.status === statusFilter);
}

// Date range filter
if (startDate) {
  filtered = filtered.filter(r => 
    new Date(r.createdAt) >= new Date(startDate)
  );
}
```

---

## 🎯 Use Cases

### Use Case 1: Find Specific User's Recharges
```
1. Enter User ID in search: "AN123456"
2. View all recharges for that user
3. Export to Excel for records
```

### Use Case 2: Review Pending Recharges
```
1. Select Status: "Pending"
2. Review all pending recharges
3. Process them in main Recharges page
```

### Use Case 3: Monthly Report
```
1. Set Start Date: 2024-01-01
2. Set End Date: 2024-01-31
3. Click "Export to Excel"
4. Generate monthly report
```

### Use Case 4: Audit Approved Recharges
```
1. Select Status: "Approved"
2. Set date range for audit period
3. Export to Excel
4. Share with finance team
```

---

## 📈 Statistics Calculation

### Total Recharges
```typescript
stats.total = filteredRecharges.length
```

### Pending Count
```typescript
stats.pending = filteredRecharges.filter(r => r.status === 'PENDING').length
```

### Total Amount
```typescript
stats.totalAmount = filteredRecharges.reduce((sum, r) => sum + r.amount, 0)
```

### Total Coins
```typescript
stats.totalCoins = filteredRecharges.reduce((sum, r) => sum + r.coins, 0)
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

## 🎨 Status Badge Colors

### Pending
- Background: `#fef5e7` (light yellow)
- Text: `#d69e2e` (dark yellow)
- Border: `#fbd38d` (yellow)

### Approved
- Background: `#f0fff4` (light green)
- Text: `#38a169` (dark green)
- Border: `#9ae6b4` (green)

### Rejected
- Background: `#fed7d7` (light red)
- Text: `#c53030` (dark red)
- Border: `#feb2b2` (red)

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
- Debounced search (instant feedback)

### Lazy Loading
- Usernames fetched in parallel
- Non-blocking UI updates
- Loading state while fetching

### Excel Export
- Processed client-side
- No server load
- Instant download

---

## ✅ Testing Checklist

- [ ] Page loads without errors
- [ ] Statistics display correctly
- [ ] Search filter works
- [ ] Status filter works
- [ ] Date filters work
- [ ] Clear filters button works
- [ ] Excel export works
- [ ] Exported file opens correctly
- [ ] All columns present in export
- [ ] IST timezone displayed correctly
- [ ] Responsive on mobile
- [ ] Loading state shows properly

---

## 🎉 Success!

Your Recharge History module is now complete with:

✅ Advanced search and filters  
✅ Date range filtering  
✅ Excel export functionality  
✅ IST timezone display  
✅ Real-time statistics  
✅ Professional UI design  
✅ Responsive layout  
✅ Complete documentation  

---

**Access URL:** http://localhost:3000/recharge-history

**Menu Location:** Sidebar → Recharge History

**Export Format:** Excel (.xlsx)

**Timezone:** IST (Indian Standard Time)
