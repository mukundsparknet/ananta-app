# 🚀 Gift History - Quick Setup Guide

## ✅ What Was Created

### New Module:
- **Gift History** page with search, filters, and Excel export
- Tracks all gifts sent during VIDEO and AUDIO live sessions

### Features:
- ✅ Search by sender, receiver, gift name, or session ID
- ✅ Filter by Date Range (Start Date - End Date)
- ✅ Export to Excel with all data
- ✅ Real-time statistics dashboard
- ✅ IST timezone display
- ✅ Session type tracking (VIDEO/AUDIO)

---

## 📦 Installation

### Step 1: Create Database Table
```bash
# Connect to PostgreSQL
psql -U postgres -d ananta_db

# Create the table
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

# Create indexes
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

### Step 4: Access the Page
Open browser: **http://localhost:3000/gift-history**

---

## 🎯 How to Use

### 1. View Statistics
- Total Gifts
- Total Value (coins)
- Video Live Gifts
- Audio Live Gifts
- Unique Senders
- Unique Receivers

### 2. Search
```
Type in search box: Username, Gift name, or Session ID
Example: "john" or "Rose" or "live_123"
```

### 3. Filter by Date
```
Start Date: 2024-01-01
End Date: 2024-01-31
```

### 4. Export to Excel
```
Click "Export to Excel" button
File downloads automatically
Filename: Gift_History_YYYY-MM-DD.xlsx
```

---

## 📊 Excel Export Includes

1. Gift ID
2. Gift Name
3. Gift Value (Coins)
4. Sent By User ID
5. Sent By Username
6. Sent To User ID
7. Sent To Username
8. Session Type (VIDEO/AUDIO)
9. Live Session ID
10. Status
11. Gift Date (IST)

---

## 🔍 Example Searches

### Find gifts from specific user:
```
Search: "john_doe"
```

### Find gifts in specific session:
```
Search: "live_abc123"
```

### Monthly report:
```
Start Date: 2024-01-01
End Date: 2024-01-31
Click: Export to Excel
```

---

## 📁 Files Created

### Backend:
1. **`GiftTransaction.java`** - Model
2. **`GiftTransactionRepository.java`** - Repository
3. **`AdminGiftHistoryController.java`** - API Controller
4. **`create_gift_transactions_table.sql`** - SQL script

### Backend Modified:
5. **`AppGiftController.java`** - Updated to save transactions

### Frontend:
6. **`adminpanel/app/gift-history/page.tsx`** - New page

### Frontend Modified:
7. **`adminpanel/app/layout.tsx`** - Added menu item

---

## ✅ Verification

After installation, verify:

- [ ] Database table created
- [ ] Backend builds successfully
- [ ] Backend starts without errors
- [ ] "Gift History" appears in sidebar
- [ ] Page loads at /gift-history
- [ ] Statistics display correctly
- [ ] Search works
- [ ] Filters work
- [ ] Export button works
- [ ] Excel file downloads
- [ ] Gifts save when sent in live sessions

---

## 🎉 Done!

Your Gift History module is ready to use!

**URL:** http://localhost:3000/gift-history

**Menu:** Sidebar → Gift History

**Features:** Search, Filter, Export to Excel, Live Session Tracking
