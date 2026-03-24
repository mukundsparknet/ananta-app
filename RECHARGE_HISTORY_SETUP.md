# 🚀 Recharge History - Quick Setup Guide

## ✅ What Was Created

### New Page:
- **Recharge History** module with search, filters, and Excel export

### Features:
- ✅ Search by User ID or Username
- ✅ Filter by Status (Pending/Approved/Rejected)
- ✅ Filter by Date Range (Start Date - End Date)
- ✅ Export to Excel with all data
- ✅ Real-time statistics dashboard
- ✅ IST timezone display

---

## 📦 Installation

### Step 1: Install Dependencies
```bash
cd adminpanel
npm install
```

This installs the `xlsx` package for Excel export.

### Step 2: Start Admin Panel
```bash
npm run dev
```

### Step 3: Access the Page
Open browser: **http://localhost:3000/recharge-history**

---

## 🎯 How to Use

### 1. View Statistics
- Total Recharges
- Pending/Approved/Rejected counts
- Total Amount and Coins

### 2. Search
```
Type in search box: User ID or Username
Example: "AN123456" or "john"
```

### 3. Filter by Status
```
Select from dropdown:
- All Status
- Pending
- Approved
- Rejected
```

### 4. Filter by Date
```
Start Date: 2024-01-01
End Date: 2024-01-31
```

### 5. Export to Excel
```
Click "Export to Excel" button
File downloads automatically
Filename: Recharge_History_YYYY-MM-DD.xlsx
```

---

## 📊 Excel Export Includes

1. User ID
2. Username
3. Plan Name
4. Amount (₹)
5. Coins
6. Status
7. Recharge Date (IST)
8. Updated Date (IST)

---

## 🔍 Example Searches

### Find specific user:
```
Search: "AN123456"
```

### View pending recharges:
```
Status: Pending
```

### Monthly report:
```
Start Date: 2024-01-01
End Date: 2024-01-31
Click: Export to Excel
```

---

## 📁 Files Modified

1. **`adminpanel/app/recharge-history/page.tsx`** - New page
2. **`adminpanel/package.json`** - Added xlsx package
3. **`adminpanel/app/layout.tsx`** - Added menu item

---

## ✅ Verification

After installation, verify:

- [ ] Admin panel starts without errors
- [ ] "Recharge History" appears in sidebar
- [ ] Page loads at /recharge-history
- [ ] Statistics display correctly
- [ ] Search works
- [ ] Filters work
- [ ] Export button works
- [ ] Excel file downloads

---

## 🎉 Done!

Your Recharge History module is ready to use!

**URL:** http://localhost:3000/recharge-history

**Menu:** Sidebar → Recharge History

**Features:** Search, Filter, Export to Excel
