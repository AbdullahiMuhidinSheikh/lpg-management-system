# Quick Reference Guide

## 🚀 Common Tasks

### Task 1: Record a Sale
**Goal**: Sell 5 cylinders of 13kg to ABC Retail, Paid

**Steps**:
1. Go to **Sales** dashboard (`/dashboard`)
2. Select client: **ABC Retail**
3. Select cylinder: **13kg (Metal)**
4. Enter quantity: **5**
5. Delivery type: **Delivery**
6. Payment status: **Paid**
7. Click **Record Sale**

**API** (if using directly):
```bash
curl -X POST http://localhost:3000/api/sales \
  -H "Content-Type: application/json" \
  -d '{
    "clientId": 1,
    "cylinderSizeId": 2,
    "quantity": 5,
    "deliveryType": "DELIVERY",
    "paymentStatus": "PAID"
  }'
```

---

### Task 2: Record Empty Cylinder Return
**Goal**: Client returns 3 empty cylinders

**Steps**:
1. Go to **Ledger** (`/ledger`)
2. Click client: **ABC Retail**
3. In "Record Empty Cylinder Return" form:
   - Cylinder Size: **13kg (Metal)**
   - Qty Empty: **3**
4. Click **Record Return**

**Result**: System auto-updates debt = issued - returned

**API**:
```bash
curl -X POST http://localhost:3000/api/cylinder-returns \
  -H "Content-Type: application/json" \
  -d '{
    "clientId": 1,
    "cylinderSizeId": 2,
    "emptyQuantity": 3
  }'
```

---

### Task 3: Log an Expense
**Goal**: Log vehicle fuel expense of ₹500

**Steps**:
1. Go to **Sales** dashboard → **Expenses** tab
2. Expense Type: **Fuel**
3. Amount: **500**
4. Note: **Vehicle fuel** (optional)
5. Click **Log Expense**

**API**:
```bash
curl -X POST http://localhost:3000/api/expenses \
  -H "Content-Type: application/json" \
  -d '{
    "type": "FUEL",
    "amount": 500,
    "note": "Vehicle fuel"
  }'
```

---

### Task 4: Generate EOD Report
**Goal**: Close the day and see net cash

**Steps**:
1. Go to **Sales** dashboard → **EOD Report** tab
2. Click **Generate EOD Report**
3. Review:
   - Total Revenue
   - Paid vs. Unpaid
   - Expenses breakdown
   - **NET CASH** (key metric)

**API**:
```bash
TODAY=$(date +%Y-%m-%d)
curl "http://localhost:3000/api/eod-report?startDate=${TODAY}T00:00:00Z&endDate=${TODAY}T23:59:59Z"
```

---

### Task 5: Update Gas Price
**Goal**: Change rate from ₹75/kg to ₹80/kg

**Steps**:
1. Go to any form (Sales, Expenses)
2. In backend/API directly:

**API**:
```bash
curl -X POST http://localhost:3000/api/rates \
  -H "Content-Type: application/json" \
  -d '{
    "rate": 80,
    "note": "Market increase"
  }'
```

**Note**: All future sales will use the new rate automatically.

---

### Task 6: Check Client Credit Status
**Goal**: Can we deliver to ABC Retail?

**Steps**:
1. Go to **Admin** (`/admin`)
2. Click **Clients** tab
3. Look for ABC Retail:
   - **Credit Status**: Green = Can Deliver, Red = BLOCKED

**API**:
```bash
curl "http://localhost:3000/api/clients?id=1"

# Response includes:
{
  "id": 1,
  "name": "ABC Retail",
  "totalOwedAmount": 8500,
  "totalOwedCylinders": 3,
  "creditStatus": {
    "canDeliver": true,
    "exceedsMoneyLimit": false,
    "exceedsCylinderLimit": false
  }
}
```

---

### Task 7: Find Cheapest Supplier
**Goal**: Which supplier has the lowest price?

**Steps**:
1. Go to **Suppliers** (`/suppliers`)
2. See "💰 Best Price Award" at top
3. Scroll down for breakdown by cylinder size

**API**:
```bash
curl "http://localhost:3000/api/purchases"

# System calculates:
# - Average ₹/kg per supplier
# - Highlights cheapest
```

---

### Task 8: Register Hardware Serial
**Goal**: Track a new grill (prevent theft)

**Steps**:
1. Go to **Hardware** (`/hardware`)
2. Click **Register New Hardware**
3. Serial Number: **SN-2024-GRL-001**
4. Product Type: **Grill**
5. Status: **In Stock**
6. Click **Register**

**API**:
```bash
curl -X POST http://localhost:3000/api/hardware \
  -H "Content-Type: application/json" \
  -d '{
    "serial": "SN-2024-GRL-001",
    "productId": 7,
    "status": "IN_STOCK"
  }'
```

---

### Task 9: Assign Hardware to Client
**Goal**: Client ABC Retail takes the grill

**Steps**:
1. Update hardware status:

**API**:
```bash
curl -X PUT http://localhost:3000/api/hardware \
  -H "Content-Type: application/json" \
  -d '{
    "serial": "SN-2024-GRL-001",
    "status": "ASSIGNED",
    "clientId": 1
  }'
```

**Later, to return it**:
```bash
curl -X PUT http://localhost:3000/api/hardware \
  -H "Content-Type: application/json" \
  -d '{
    "serial": "SN-2024-GRL-001",
    "status": "IN_STOCK",
    "clientId": null
  }'
```

---

### Task 10: Record Supplier Purchase
**Goal**: Buy 20 cylinders from National Gas Ltd at ₹75/kg

**Steps**:
1. Go to backend/API directly:

**API**:
```bash
curl -X POST http://localhost:3000/api/purchases \
  -H "Content-Type: application/json" \
  -d '{
    "supplierId": 1,
    "cylinderSizeId": 2,
    "quantity": 20,
    "pricePerKg": 75
  }'

# Result: 
# - Inventory.fullStock += 20
# - Purchase record created (for cost analysis)
```

---

## 📊 Dashboard Routes

| Page | URL | Purpose |
|------|-----|---------|
| Home | `/` | Overview + navigation |
| Sales | `/dashboard` | Record sales, expenses, EOD |
| Admin | `/admin` | Metrics, alerts, client ledger |
| Ledger | `/ledger` | Cylinder debt per client |
| Suppliers | `/suppliers` | Price trends, cheapest vendor |
| Hardware | `/hardware` | Serial tracking by status |

---

## 🗂️ Database Quick Reference

### View Inventory
```bash
curl http://localhost:3000/api/inventory
```

Response:
```json
[
  {
    "id": 1,
    "cylinderSizeId": 1,
    "fullStock": 100,
    "emptyStock": 20,
    "cylinderSize": { "id": 1, "label": "6kg" }
  },
  ...
]
```

### View All Clients
```bash
curl http://localhost:3000/api/clients
```

Response:
```json
[
  {
    "id": 1,
    "name": "ABC Retail",
    "type": "RETAIL",
    "totalOwedCylinders": 3,
    "totalOwedAmount": 8500
  },
  ...
]
```

### View Recent Sales
```bash
curl http://localhost:3000/api/sales
```

### View Recent Expenses
```bash
curl "http://localhost:3000/api/expenses?startDate=2024-01-28T00:00:00Z&endDate=2024-01-28T23:59:59Z"
```

---

## 🔧 Database Commands

### Reset Everything (Development Only)
```bash
npm run prisma:migrate reset

# WARNING: Deletes all data and recreates schema
```

### Fresh Seed
```bash
npm run seed

# Populates sample data
```

### View Database
```bash
# Connect to Supabase or local Postgres
psql postgresql://user:password@localhost:5432/lpg_db

# List tables
\dt

# View specific table
SELECT * FROM "Inventory";
```

---

## 💡 Common Scenarios

### Scenario 1: Client Exceeds Credit
```
ABC Retail owes ₹15,000 (limit: ₹10,000)

Admin Dashboard → Clients tab:
  Status: ✗ BLOCKED (exceeds money limit by ₹5,000)

Action: 
  - Contact client for payment
  - Or increase credit limit
```

### Scenario 2: Low Stock Alert
```
13kg cylinders have only 5 left (threshold: 20)

Admin Dashboard → Alerts tab:
  ⚠️ Low Gas Stock Alert
  13kg (Metal): 5 full, 2 empty

Action:
  - Click Suppliers tab
  - Find cheapest supplier
  - Record purchase
```

### Scenario 3: Unpaid Sales
```
Manager records sale but payment is UNPAID

EOD Report shows:
  Paid: ₹12,000
  Unpaid: ₹3,000
  Net Cash: ₹11,000 (doesn't count unpaid)

Admin sees: Client now has 3000 debt (money + cylinders)
```

### Scenario 4: Hardware Lost
```
Grill SN-2024-GRL-001 assigned to client but not returned

Hardware page → Lost tab:
  Serial: SN-2024-GRL-001
  Status: LOST
  Client: ABC Retail

Action:
  - Contact client
  - Deduct cost from payment
  - Write off if unrecoverable
```

---

## 🐛 Troubleshooting

### Sales not saving?
1. Check browser console (F12) for errors
2. Verify client + cylinder size selected
3. Check database: `SELECT COUNT(*) FROM "Sale";`

### Inventory not updating?
1. Clear browser cache
2. Refresh inventory page
3. Check API response: `curl http://localhost:3000/api/inventory`

### EOD report shows 0?
1. Ensure sales were recorded with correct date
2. Check date range in report
3. Query database: `SELECT * FROM "Sale" WHERE createdAt > NOW() - INTERVAL '1 day';`

### Hardware serial already exists?
1. Use unique serial number
2. Check Hardware page for duplicates
3. Query: `SELECT serial FROM "HardwareSerial";`

---

## 📱 Mobile Tips

- Use **Sales** dashboard on tablet/phone for delivery
- Tap client name to quickly select
- Use landscape mode for better table view
- Tap "EOD Report" button to generate daily report

---

## 🔒 Security Notes

**Current System**: No authentication (add Supabase auth in production)

**Before Deployment**:
- [ ] Add user authentication
- [ ] Set environment variables (DATABASE_URL, etc.)
- [ ] Use HTTPS/SSL
- [ ] Restrict API access if needed
- [ ] Regular database backups
- [ ] Audit logs for critical operations

---

## 📞 Support Commands

### Run Tests
```bash
npm run test:workflows
```

### Check Environment
```bash
node -e "console.log(process.env.DATABASE_URL)"
```

### Rebuild Prisma Client
```bash
npm run prisma:generate
```

### Check Node Version
```bash
node --version
```

---

**Happy selling! Need help? Check README.md or ARCHITECTURE.md** 🏮
