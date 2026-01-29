# Deployment Guide

## Supabase (Recommended for Quick Setup)

### 1. Create Supabase Project
- Go to [supabase.com](https://supabase.com) and create a free account
- Create a new project (auto-creates PostgreSQL database)
- Go to **Settings** → **Database** → copy connection string

### 2. Update .env
```
DATABASE_URL=postgresql://postgres.xxxxx:password@db.supabase.co:5432/postgres
```

### 3. Run Migrations
```bash
npm run prisma:migrate
npm run seed
```

### 4. Deploy to Vercel
```bash
npm run build
git push  # Push to GitHub
```

Then:
- Go to [vercel.com](https://vercel.com)
- Import your GitHub repo
- Set `DATABASE_URL` environment variable
- Deploy

## Self-Hosted (VPS/Dedicated Server)

### Prerequisites
- Node.js 18+
- PostgreSQL 13+
- PM2 or systemd for process management

### 1. Install PostgreSQL
```bash
sudo apt-get install postgresql postgresql-contrib
```

### 2. Create Database
```bash
sudo -u postgres createdb lpg_db
sudo -u postgres psql -c "ALTER USER postgres WITH PASSWORD 'your_password';"
```

### 3. Clone & Setup
```bash
git clone <your-repo>
cd lpg-inventory-system
npm install
```

### 4. Configure .env
```
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/lpg_db
NODE_ENV=production
```

### 5. Run Migrations & Seed
```bash
npm run prisma:migrate
npm run seed
```

### 6. Build & Start
```bash
npm run build
npm start
```

Or with PM2:
```bash
pm2 start npm --name "lpg-system" -- start
pm2 save
pm2 startup
```

### 7. Setup Nginx Reverse Proxy
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 8. Enable HTTPS (Let's Encrypt)
```bash
sudo apt-get install certbot python3-certbot-nginx
sudo certbot certonly --nginx -d your-domain.com
```

## Docker Deployment

### Dockerfile
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### docker-compose.yml
```yaml
version: '3'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgresql://postgres:password@db:5432/lpg_db
    depends_on:
      - db
  
  db:
    image: postgres:15
    environment:
      POSTGRES_PASSWORD: password
      POSTGRES_DB: lpg_db
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

Run:
```bash
docker-compose up
```

## Production Checklist

- [ ] Set `NODE_ENV=production` in `.env`
- [ ] Use strong database password
- [ ] Enable SSL/HTTPS (Certbot or reverse proxy)
- [ ] Set up automated backups (Supabase or pg_dump)
- [ ] Monitor application logs (PM2, systemd journal)
- [ ] Set up error tracking (Sentry optional)
- [ ] Implement rate limiting on APIs
- [ ] Add authentication (Supabase auth recommended)
- [ ] Configure CORS if needed
- [ ] Test all workflows in production

## Database Backups

### Supabase (Automatic)
- Automatic daily backups included
- Access in Settings → Backups

### Manual PostgreSQL Backup
```bash
pg_dump postgresql://user:password@host:5432/lpg_db > backup.sql
```

### Restore
```bash
psql postgresql://user:password@host:5432/lpg_db < backup.sql
```

## Monitoring

### Database Size
```sql
SELECT pg_size_pretty(pg_database_size('lpg_db'));
```

### Active Connections
```sql
SELECT count(*) FROM pg_stat_activity WHERE datname = 'lpg_db';
```

### Slow Queries (add indexes if needed)
```sql
CREATE INDEX idx_sale_client_id ON "Sale"(clientId);
CREATE INDEX idx_sale_created_at ON "Sale"(createdAt);
CREATE INDEX idx_expense_created_at ON "Expense"(createdAt);
```

---

**Need help?** Check README.md or test-workflows.js for API examples.
