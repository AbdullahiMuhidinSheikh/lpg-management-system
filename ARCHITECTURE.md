# System Architecture & Workflows

## Data Model Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      INVENTORY SYSTEM                        │
└─────────────────────────────────────────────────────────────┘

                           PRODUCTS
                              │
                              ├─ CylinderSize (6 sizes)
                              │   └─ Inventory (full/empty stock)
                              │
                              └─ HardwareSerial (grills, regulators)

                           CLIENTS
                              │
                              ├─ CylinderDebt (issued vs returned per size)
                              ├─ Sales (transactions)
                              └─ HardwareSerial (assigned items)

                         FINANCIALS
                              │
                              ├─ RatePerKg (daily gas pricing)
                              ├─ Purchase (supplier costs)
                              ├─ Sale (transaction totals)
                              └─ Expense (fuel, labor, repairs)
```

---

## Core Workflows

### 1️⃣ SALES ENTRY & INVENTORY UPDATE

**Scenario**: Manager records sale of 10 cylinders to client ABC Retail

**Request**:
```json
POST /api/sales
{
  "clientId": 1,
  "cylinderSizeId": 3,
  "quantity": 10,
  "deliveryType": "DELIVERY",
  "paymentStatus": "PAID"
}
```

**Processing Flow**:

```
1. Fetch current RatePerKg
   └─ rate = 75/kg

2. Fetch CylinderSize (id=3)
   └─ kg = 13

3. Calculate total
   └─ 10 cylinders × 13 kg × 75 = KES 9,750

4. Create Sale record
   └─ INSERT: Sale { clientId: 1, cylinderSizeId: 3, quantity: 10, total: 9750, paymentStatus: 'PAID' }

5. UPDATE Inventory
   └─ UPDATE Inventory SET fullStock = fullStock - 10 WHERE cylinderSizeId = 3

6. CREATE/UPDATE CylinderDebt
   └─ UPSERT: CylinderDebt { clientId: 1, cylinderSizeId: 3, issuedFull: 10, returnedEmpty: 0 }
```

**Response**:
```json
{
  "id": 42,
  "clientId": 1,
  "cylinderSizeId": 3,
  "quantity": 10,
  "total": 9750,
  "paymentStatus": "PAID",
  "ratePerKg": 75
}
```

**Database State After**:
```
Inventory:
├─ cylinderSizeId: 3
├─ fullStock: 90 (was 100, -10)
└─ emptyStock: 20 (unchanged)

CylinderDebt:
├─ clientId: 1
├─ cylinderSizeId: 3
├─ issuedFull: 10 ✓
└─ returnedEmpty: 0
```

---

### 2️⃣ EMPTY CYLINDER RETURN & DEBT UPDATE

**Scenario**: Client returns 7 empty cylinders (3 deficit remains)

**Request**:
```json
POST /api/cylinder-returns
{
  "clientId": 1,
  "cylinderSizeId": 3,
  "emptyQuantity": 7
}
```

**Processing Flow**:

```
1. UPDATE Inventory
   └─ UPDATE Inventory SET emptyStock = emptyStock + 7 WHERE cylinderSizeId = 3

2. UPSERT CylinderDebt
   └─ UPDATE CylinderDebt SET returnedEmpty = returnedEmpty + 7
      WHERE clientId = 1 AND cylinderSizeId = 3

3. Calculate debt
   └─ debt = issuedFull (10) - returnedEmpty (7) = 3 cylinders
```

**Response**:
```json
{
  "clientId": 1,
  "cylinderSizeId": 3,
  "issuedFull": 10,
  "returnedEmpty": 7,
  "debt": 3,
  "message": "Client owes 3 cylinders of 13kg (Metal)"
}
```

**Database State After**:
```
Inventory:
├─ cylinderSizeId: 3
├─ fullStock: 90
└─ emptyStock: 27 (was 20, +7)

CylinderDebt:
├─ clientId: 1
├─ cylinderSizeId: 3
├─ issuedFull: 10
├─ returnedEmpty: 7 ✓
└─ debt (computed): 3 ⚠️ FLAGGED
```

---

### 3️⃣ CREDIT LIMIT ENFORCEMENT

**Scenario**: Admin checks if client can receive new delivery

**Data**:
```
Client ABC Retail:
├─ creditLimitAmount: 10,000 (KES)
├─ creditLimitCylinders: 10 (units)
├─ totalOwedAmount: 8,500 (from unpaid sales)
└─ totalOwedCylinders: 3 (from CylinderDebt deficit)
```

**Calculation**:

```
Step 1: Sum unpaid sales
└─ SELECT SUM(total) FROM Sale 
   WHERE clientId = 1 AND paymentStatus = 'UNPAID'
   └─ Result: 8,500

Step 2: Sum cylinder debts (issued - returned per size)
└─ SELECT SUM(issuedFull - returnedEmpty) FROM CylinderDebt 
   WHERE clientId = 1
   └─ Result: 3 cylinders

Step 3: Check credit limits
├─ Money: 8,500 < 10,000 ✓
└─ Cylinders: 3 < 10 ✓

Step 4: Decision
└─ canDeliver = TRUE (both limits OK)
```

**If Exceeded**:
```
Scenario: Client already owes 10,500 (exceeds KES 10,000)

canDeliver = FALSE ✗

Admin Dashboard shows:
├─ Status: "BLOCKED"
├─ Reason: "Exceeds credit limit by KES 500"
└─ Action: Block new deliveries until debt resolved
```

---

### 4️⃣ DYNAMIC PRICING (Rate Per KG)

**Scenario**: Manager updates gas price from KES 75/kg to KES 80/kg

**Request**:
```json
POST /api/rates
{
  "rate": 80,
  "note": "Price increase due to market pressure"
}
```

**Effect on Future Sales**:

```
Before (rate = 75):
  Sale: 10 cylinders × 13kg × 75 = KES 9,750

After (rate = 80):
  Sale: 10 cylinders × 13kg × 80 = KES 10,400

Database:
├─ Old rate preserved in history (createdAt timestamp)
├─ New rate marked as latest
└─ All future sales use new rate automatically
```

**Price History (last 30 days)**:
```
GET /api/rates

Response:
{
  "latest": { "id": 5, "rate": 80, "createdAt": "2024-01-28T10:00:00Z" },
  "history": [
    { "id": 5, "rate": 80, "createdAt": "2024-01-28T10:00:00Z" },
    { "id": 4, "rate": 75, "createdAt": "2024-01-27T08:30:00Z" },
    { "id": 3, "rate": 72, "createdAt": "2024-01-26T09:00:00Z" },
    ...
  ]
}
```

---

### 5️⃣ EXPENSE TRACKING

**Scenario**: Manager logs fuel expense of KES 500

**Request**:
```json
POST /api/expenses
{
  "type": "FUEL",
  "amount": 500,
  "note": "Delivery vehicle fuel"
}
```

**Types Supported**:
- `FUEL` — Vehicle fuel
- `CASUAL_LABOR` — Daily worker wages
- `REPAIRS` — Equipment maintenance
- `OTHER` — Miscellaneous

**Aggregation (for EOD)**:
```
GET /api/eod-report

Expenses breakdown:
{
  "total": 1800,
  "breakdown": {
    "FUEL": 500,
    "CASUAL_LABOR": 1000,
    "REPAIRS": 300,
    "OTHER": 0
  }
}
```

---

### 6️⃣ END-OF-DAY (EOD) REPORT

**Scenario**: Manager closes the day (Jan 28, 2024)

**Request**:
```
GET /api/eod-report?startDate=2024-01-28T00:00:00Z&endDate=2024-01-28T23:59:59Z
```

**Calculation Logic**:

```
Step 1: Fetch all sales for the day
├─ Query: SELECT * FROM Sale WHERE createdAt BETWEEN start AND end
├─ Results: 15 transactions
└─ Total revenue: KES 15,000

Step 2: Separate by payment status
├─ Paid: 12 sales = KES 12,000
├─ Unpaid: 3 sales = KES 3,000
└─ Total: ₹15,000

Step 3: Fetch all expenses
├─ Query: SELECT * FROM Expense WHERE createdAt BETWEEN start AND end
├─ Total: ₹1,800
└─ Breakdown: Fuel=500, Labor=1000, Repairs=300

Step 4: Calculate NET CASH
├─ Formula: Paid Amount - Total Expenses
├─ Calculation: 12,000 - 1,800 = KES 10,200
└─ Result: NET CASH = KES 10,200
```

**Response**:
```json
{
  "period": {
    "startDate": "2024-01-28T00:00:00Z",
    "endDate": "2024-01-28T23:59:59Z"
  },
  "sales": {
    "count": 15,
    "totalRevenue": 15000,
    "paidCount": 12,
    "paidAmount": 12000,
    "unpaidCount": 3,
    "unpaidAmount": 3000
  },
  "expenses": {
    "total": 1800,
    "breakdown": {
      "FUEL": 500,
      "CASUAL_LABOR": 1000,
      "REPAIRS": 300
    }
  },
  "netCash": 10200,
  "generatedAt": "2024-01-28T18:30:00Z"
}
```

**Dashboard Display**:
```
┌─────────────────────────────────────────┐
│ TODAY'S EOD REPORT                      │
├─────────────────────────────────────────┤
│ Total Revenue:      ₹15,000              │
│ Paid:              ₹12,000               │
│ Unpaid:            ₹3,000                │
│ Total Expenses:    ₹1,800                │
├─────────────────────────────────────────┤
│ NET CASH:          ₹10,200 ✓             │
└─────────────────────────────────────────┘
```

---

### 7️⃣ SUPPLIER PRICE COMPARISON (Pro)

**Scenario**: Admin analyzes supplier costs over 30 days

**Request**:
```
GET /api/purchases
```

**Processing**:

```
1. Fetch all purchases from last 30 days
   └─ 20 purchase records across 3 suppliers

2. Group by supplier
   ├─ National Gas Ltd: 8 purchases
   ├─ City Petro Co: 7 purchases
   └─ Regional Energy: 5 purchases

3. Calculate averages per supplier
   ├─ National Gas: ₹75/kg (total cost: 2,400 / 32kg)
   ├─ City Petro: ₹78/kg (total cost: 1,950 / 25kg)
   └─ Regional: ₹80/kg (total cost: 1,200 / 15kg)

4. Find cheapest
   └─ Winner: National Gas Ltd (₹75/kg) 💰

5. Breakdown by cylinder size
   ├─ National Gas 13kg: ₹75/kg
   ├─ National Gas 35kg: ₹74/kg (bulk discount)
   ├─ City Petro 13kg: ₹79/kg
   ├─ City Petro 35kg: ₹76/kg
   └─ ...
```

**Dashboard Display**:
```
┌──────────────────────────────────┐
│ 💰 BEST PRICE AWARD              │
├──────────────────────────────────┤
│ National Gas Ltd                 │
│ Avg: ₹75/kg                      │
└──────────────────────────────────┘

Supplier Comparison:
┌─────────────────┬──────┬─────────┐
│ Supplier        │ Avgs │ Total   │
├─────────────────┼──────┼─────────┤
│ National Gas    │ ₹75  │ ₹2,400  │
│ City Petro      │ ₹78  │ ₹1,950  │
│ Regional Energy │ ₹80  │ ₹1,200  │
└─────────────────┴──────┴─────────┘
```

---

### 8️⃣ HARDWARE SERIAL TRACKING (Pro)

**Scenario**: Manager registers a grill by serial number

**Request**:
```json
POST /api/hardware
{
  "serial": "SN-2024-GRL-001",
  "productId": 7,
  "status": "IN_STOCK"
}
```

**Lifecycle**:

```
1. REGISTRATION
   └─ Status: IN_STOCK
      └─ Location: Warehouse

2. ASSIGNMENT (when delivered to client)
   └─ PUT /api/hardware
      ├─ Status: ASSIGNED
      ├─ clientId: 1 (ABC Retail)
      └─ In use at client's location

3. RETURN (when client returns it)
   └─ PUT /api/hardware
      ├─ Status: IN_STOCK
      ├─ clientId: null (removed assignment)
      └─ Back in warehouse

4. MAINTENANCE (if damaged)
   └─ PUT /api/hardware
      ├─ Status: MAINTENANCE
      └─ Awaiting repair

5. LOST (if theft/missing)
   └─ PUT /api/hardware
      ├─ Status: LOST
      └─ Flagged for write-off
```

**Database State**:
```
HardwareSerial:
├─ serial: "SN-2024-GRL-001"
├─ productId: 7 (Grill)
├─ status: "ASSIGNED"
├─ clientId: 1 (ABC Retail) ✓
└─ createdAt: "2024-01-20"

Total Hardware Stats:
├─ Total: 12 items
├─ In Stock: 8
├─ Assigned: 3
├─ Maintenance: 1
└─ Lost: 0
```

---

## Transaction Integrity

### Delivery Flow (Complete)

```
STEP 1: Manager records sale
  POST /api/sales
  ├─ Inventory.fullStock -= 10
  └─ CylinderDebt.issuedFull += 10 ✓

STEP 2: Later, client returns empties
  POST /api/cylinder-returns
  ├─ Inventory.emptyStock += 7
  └─ CylinderDebt.returnedEmpty += 7 ✓

STEP 3: Admin checks status
  GET /api/clients?id=1
  ├─ Debt computed: 10 - 7 = 3 cylinders
  ├─ Credit check: Can still deliver? YES/NO
  └─ Status: OK / BLOCKED ✓

STEP 4: Payment settles remaining debt
  POST /api/sales (payment receipt)
  └─ CylinderDebt.returnedEmpty += 3
      └─ Debt becomes: 10 - 10 = 0 ✓
```

---

## API Response Patterns

### Success (201 Created)
```json
{
  "id": 42,
  "clientId": 1,
  "cylinderSizeId": 3,
  "quantity": 10,
  "total": 9750,
  "createdAt": "2024-01-28T10:00:00Z"
}
```

### Success (200 OK)
```json
[
  { "id": 1, "name": "ABC Retail", "totalOwedCylinders": 3 },
  { "id": 2, "name": "XYZ Restaurant", "totalOwedCylinders": 0 }
]
```

### Error (400 Bad Request)
```json
{
  "error": "clientId is required"
}
```

### Error (404 Not Found)
```json
{
  "error": "Cylinder size not found"
}
```

### Error (500 Server Error)
```json
{
  "error": "Database connection failed"
}
```

---

## Performance Considerations

### Indexes (Recommended)
```sql
-- Fast sales lookup by date
CREATE INDEX idx_sale_created_at ON "Sale"(createdAt DESC);

-- Fast client queries
CREATE INDEX idx_sale_client_id ON "Sale"(clientId);

-- Fast expense reports
CREATE INDEX idx_expense_created_at ON "Expense"(createdAt DESC);

-- Fast debt lookups
CREATE INDEX idx_cylinder_debt_client ON "CylinderDebt"(clientId);

-- Fast purchase history
CREATE INDEX idx_purchase_created_at ON "Purchase"(createdAt DESC);
```

### Query Optimization
- Use `include: { relation }` in Prisma only when needed
- Paginate large result sets
- Use date filters for historical queries (EOD, expenses)

---

## Summary

| Workflow | Key Action | Database Update | Check |
|----------|-----------|-----------------|-------|
| Sale Entry | Create sale | Inventory -10, Debt +10 issued | Stock available? |
| Empty Return | Record return | Inventory +7, Debt +7 returned | Debt calculated |
| Credit Block | Check limits | None (read-only) | totalOwed < limit? |
| EOD Report | Summarize day | None (aggregation) | Revenue & expenses |
| Rate Update | Set new price | RatePerKg entry | Applied to future sales |
| Supplier Compare | Analyze costs | None (aggregation) | Cheapest vendor? |
| Hardware Track | Register item | HardwareSerial entry | Serial unique? |

---

**Architecture built for reliability, scalability, and ease of use.** ✨
