# LPG Inventory & Debt Management System

A comprehensive Next.js (App Router) application for managing LPG cylinder inventory, sales, client debts, and supplier purchases. Built with Tailwind CSS, Prisma, and Supabase/PostgreSQL.

## Features

### Core Functionality
- **Sales Entry**: Record client type (Retail/Individual), delivery type, and payment status
- **Inventory Management**: Track "Full Stock" vs. "Empty Stock" separately by cylinder size (6kg, 13kg Metal, 13kg Plastic, 35kg, 45kg, 50kg)
- **Cylinder Debt Tracking**: Ledger showing issued vs. returned cylinders per client with automatic debt calculation
- **Dynamic Pricing**: Set rate per kg which auto-calculates prices for all cylinder sizes
- **Expense Tracking**: Log Fuel, Casual Labor, Repairs, and other expenses
- **End-of-Day (EOD) Reporting**: Automated daily summary showing sales, expenses, and net cash

### Dashboards
- **Staff/Manager Dashboard**: Sales entry forms, inventory snapshot, expense logging, and EOD reports
- **Admin Dashboard**: Total revenue, profit metrics, stock alerts for low inventory, and client debt overview
- **Cylinder Ledger**: Detailed view of issued vs. returned cylinders per retail client

### Pro Features (Enterprise Grade)
1. **Serialized Hardware Tracking**: Track expensive items (grills, regulators, burners) by serial number to prevent theft/loss
2. **Credit Limits**: Set maximum credit limits (money + cylinder count) per client; system blocks deliveries if exceeded
3. **Supplier Price Comparison**: 30-day price trend analysis showing cheapest suppliers and price history

### 🤖 AI & Machine Learning Features (NEW)
- **Expense Anomaly Detection**: Automatically flag unusual expense patterns that may indicate fraud
- **Demand Forecasting**: Predict demand for next 7 days per cylinder size with confidence intervals
- **Debt Risk Scoring**: Automatically calculate client credit risk scores for better collections
- **More coming soon**: Dynamic pricing, supplier analytics, client segmentation

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React 18, Tailwind CSS 4
- **Backend**: Next.js API routes, Prisma ORM
- **Database**: PostgreSQL (Supabase recommended)
- **Utilities**: decimal.js, clsx, ts-node

## Project Structure

```
├── app/
│   ├── page.tsx              # Home page
│   ├── dashboard/            # Staff/Manager dashboard (sales, expenses, EOD)
│   ├── admin/                # Admin metrics & alerts
│   ├── ledger/               # Cylinder ledger view
│   ├── suppliers/            # Supplier price trends (Pro)
│   ├── hardware/             # Hardware serial tracking (Pro)
│   ├── api/
│   │   ├── sales/            # POST/GET sales
│   │   ├── cylinder-returns/ # Record empty returns & debt updates
│   │   ├── inventory/        # GET inventory, PUT updates
│   │   ├── expenses/         # POST/GET expenses
│   │   ├── rates/            # POST/GET rate per kg
│   │   ├── eod-report/       # GET end-of-day reports
│   │   ├── purchases/        # POST/GET supplier purchases
│   │   ├── clients/          # POST/GET clients & ledger
│   │   └── hardware/         # POST/GET/PUT hardware serials
│   └── layout.tsx            # Root layout with navigation
├── components/
│   ├── Navigation.tsx        # Top nav with links
│   ├── Table.tsx             # Reusable table component
│   ├── SalesForm.tsx         # Sales entry form
│   └── ExpenseForm.tsx       # Expense logging form
├── lib/
│   └── prisma.ts             # Prisma singleton client
├── prisma/
│   ├── schema.prisma         # Data model (13 tables)
│   └── seed.ts               # Seed script with sample data
├── styles/
│   └── globals.css           # Tailwind directives
└── README.md                 # This file
```

## Quick Start

### 1. Setup Environment

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Set `DATABASE_URL` to your PostgreSQL connection string (use Supabase):

```
DATABASE_URL=postgresql://user:password@host:5432/lpg_db
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Generate Prisma Client & Run Migrations

```bash
npm run prisma:generate
npm run prisma:migrate
```

This will:
- Create all 13 tables
- Set up relations for cylinder debt, inventory, sales, etc.

### 4. Seed Sample Data

```bash
npm run seed
```

Populates with:
- 6 cylinder sizes
- 3 sample suppliers
- 3 sample clients (2 retail, 1 individual)
- 3 sample users (staff, manager, admin)
- Initial inventory (100 full + 20 empty per size)

### 5. Run Dev Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 6. (Optional) Setup AI Backend

For machine learning features (anomaly detection, demand forecasting):

**Windows:**
```bash
start-ai-backend.bat
```

**macOS/Linux:**
```bash
cd ai-backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python app.py
```

Then add to `.env.local`:
```
AI_BACKEND_URL=http://localhost:5000
```

See [AI_INTEGRATION.md](AI_INTEGRATION.md) for complete AI setup guide.

## Usage Guide

### For Staff/Managers: Sales Entry

1. Go to **Sales** tab in `/dashboard`
2. Select client (optional for walk-ins)
3. Choose cylinder size and quantity
4. Set delivery type (Delivery/Pickup) and payment status (Paid/Unpaid)
5. Submit — system auto-decrements full stock and updates client debt

### For Staff/Managers: Empty Cylinder Returns

1. Go to **Ledger** page (`/ledger`)
2. Select retail client
3. View issued vs. returned cylinders
4. Use "Record Empty Cylinder Return" form to accept empties
5. System auto-updates debt = issued - returned

### For Managers: EOD Report

1. Go to **Sales** tab → **EOD Report** section
2. Click "Generate EOD Report"
3. View:
   - Total sales revenue
   - Paid vs. Unpaid breakdown
   - Expenses by type
   - **Net Cash** (Paid - Expenses)

### For Admin/Boss: AI Insights Dashboard (`/ai-dashboard`)

1. Go to **AI** tab (🤖 icon in navbar)
2. **Expense Anomaly Detection**:
   - Click "Analyze Expenses"
   - System flags unusual spending patterns
   - See anomaly scores and recommendations
3. **7-Day Demand Forecast**:
   - Select cylinder size
   - Click "Generate Forecast"
   - View predicted demand with confidence intervals
   - Get actionable insights for inventory planning

### For Admin/Boss: Metrics & Alerts

1. Go to **Admin** page (`/admin`)
2. **Metrics** tab: Today's revenue, paid amount, expenses
3. **Suppliers** tab: Cheapest supplier analysis, avg price/kg
4. **Alerts** tab:
   - ⚠️ Low gas stock (< 20 units)
   - 💳 Client debt summary
5. **Clients** tab: All clients with credit status (can deliver or blocked)

### Pro Feature: Supplier Price Trends (`/suppliers`)

- View all supplier purchases in one place
- "💰 Best Price Award" highlights cheapest supplier overall
- Detailed breakdown by cylinder size
- Purchase history with dates

### Pro Feature: Hardware Serial Tracking (`/hardware`)

1. Go to **Hardware** page (`/hardware`)
2. Register items by serial (e.g., "SN-2024-GRL-001")
3. Track status: In Stock, Assigned to client, Maintenance, Lost
4. Prevent theft/loss of expensive grills, large regulators, burners

## Key Workflows

### 1. Sale & Debt Creation

**API**: `POST /api/sales`

```json
{
  "clientId": 1,
  "cylinderSizeId": 3,
  "quantity": 10,
  "deliveryType": "DELIVERY",
  "paymentStatus": "PAID"
}
```

**Result**:
- Inventory.fullStock -= 10
- CylinderDebt record created/updated: `issuedFull += 10`
- Sale record created with current rate/total

### 2. Empty Cylinder Return

**API**: `POST /api/cylinder-returns`

```json
{
  "clientId": 1,
  "cylinderSizeId": 3,
  "emptyQuantity": 7
}
```

**Result**:
- Inventory.emptyStock += 7
- CylinderDebt.returnedEmpty += 7
- Debt calculated: `issuedFull - returnedEmpty` (3 cylinders owed)

### 3. Credit Limit Enforcement

**Logic** (in `/api/clients`):

```typescript
const canDeliver = 
  (!client.creditLimitAmount || totalOwedAmount < creditLimitAmount) &&
  (!client.creditLimitCylinders || totalOwedCylinders < creditLimitCylinders)
```

If `canDeliver === false`, admin blocks new deliveries.

### 4. EOD Report

**API**: `GET /api/eod-report?startDate=2024-01-28T00:00:00Z&endDate=2024-01-28T23:59:59Z`

**Returns**:
```json
{
  "sales": { "count": 15, "totalRevenue": 5000, "paidAmount": 4000, "unpaidAmount": 1000 },
  "expenses": { "total": 500, "breakdown": { "FUEL": 300, "CASUAL_LABOR": 200 } },
  "netCash": 3500
}
```

## Data Model

### Core Tables

| Table | Purpose |
|-------|---------|
| `User` | Staff, managers, admin roles |
| `Product` | LPG Gas + Hardware items |
| `CylinderSize` | 6kg, 13kg Metal, 13kg Plastic, 35kg, 45kg, 50kg |
| `Inventory` | Full/Empty stock per cylinder size |
| `Client` | Retail stores, individuals with credit limits |
| `CylinderDebt` | Ledger: issued vs. returned per client/size |
| `RatePerKg` | Current gas pricing (updated daily) |
| `Sale` | Transaction record |
| `Expense` | Fuel, labor, repairs |
| `Supplier` | Vendor names |
| `Purchase` | Supplier purchase history with costs |
| `HardwareSerial` | Serial-tracked items (grills, regulators) |

### Relations

- Client → (CylinderDebt, Sale, HardwareSerial)
- CylinderSize → (CylinderDebt, Inventory, Sale, Purchase)
- Supplier → Purchase
- Product → (CylinderSize, HardwareSerial)

## API Endpoints

### Sales
- `POST /api/sales` — Create sale (auto updates inventory + debt)
- `GET /api/sales` — Get recent sales

### Inventory
- `GET /api/inventory` — Get all inventory
- `PUT /api/inventory` — Update stock manually

### Cylinder Debt & Returns
- `POST /api/cylinder-returns` — Record empty returns
- `GET /api/cylinder-returns?clientId=1` — Get client debt ledger

### Expenses
- `POST /api/expenses` — Log expense
- `GET /api/expenses?startDate=...&endDate=...` — Get daily/period expenses

### Pricing
- `POST /api/rates` — Set new rate per kg
- `GET /api/rates` — Get current + 30-day history

### EOD
- `GET /api/eod-report?startDate=...&endDate=...` — Generate daily report

### Clients
- `POST /api/clients` — Create client with credit limits
- `GET /api/clients` — Get all clients
- `GET /api/clients?id=1` — Get single client with full ledger

### Purchases
- `POST /api/purchases` — Record supplier purchase (auto-increments inventory)
- `GET /api/purchases?supplierId=1` — Get purchases by supplier

### Hardware (Pro)
- `POST /api/hardware` — Register serial
- `GET /api/hardware?status=IN_STOCK` — Get items by status
- `PUT /api/hardware` — Update serial status/client

## Mobile Responsive Design

All dashboards are mobile-first:
- Navigation collapses to icons on small screens
- Tables stack on mobile
- Forms adapt to single column
- Touch-friendly buttons and inputs

## Customization

### Add New Cylinder Size
Edit `prisma/seed.ts`:
```typescript
{ label: '20kg', kg: 20, isPlastic: false }
```

Run `npm run seed` again.

### Change Currency Symbol
Search `₹` in dashboard files, replace with `$`, `€`, etc.

### Adjust Credit Limits
Edit client in admin panel or directly in database.

### Add More Expense Types
Update `ExpenseType` enum in `schema.prisma`:
```prisma
enum ExpenseType {
  FUEL
  CASUAL_LABOR
  REPAIRS
  UTILITIES
  OTHER
}
```

## Future Enhancements

- Supabase auth integration (currently no auth)
- Real-time updates (Supabase realtime subscriptions)
- PDF export for EOD reports
- SMS notifications for low stock / debt alerts
- Barcode scanning for hardware serials
- Multi-branch support with branch-level analytics
- Profit margin alerts based on supplier cost vs. sale price

## Database Setup (Supabase)

1. Create Postgres database on [Supabase](https://supabase.com)
2. Copy connection string to `.env`:
   ```
   DATABASE_URL=postgresql://user:password@db.supabase.co:5432/postgres
   ```
3. Run migrations:
   ```bash
   npm run prisma:migrate
   ```

## Troubleshooting

**"no schema created"** → Run `npm run prisma:migrate`

**"Prisma client not found"** → Run `npm run prisma:generate`

**Sales not appearing** → Check `/api/sales` returns data

**Inventory not updating** → Verify API call succeeded, check database

## Support & License

This system is built as a complete starter for LPG/gas distribution businesses. Modify as needed for your use case.

---

**Happy selling! 🏮📊**
