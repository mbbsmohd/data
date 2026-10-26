# 🌐 BUKAR DATA SUB — PRODUCTION LIVE HOSTING DEPLOYMENT GUIDE

Welcome to the official deployment and operations manual for **Bukar Data Sub** (`bukardatasub.com`). This guide provides verified, production-grade instructions for hosting the full-stack platform live on any standard cloud infrastructure, Virtual Private Server (VPS), containerized engine, or managed PaaS.

---

## 🏗️ Architecture Overview

| Component | Technology | Description |
|---|---|---|
| **Frontend** | React 18, Vite 6, Tailwind CSS, Lucide Icons | Responsive SPA with Ambient Glow theme, modern cards, and live animations |
| **Backend** | Node.js (v20+ / v22+), Express 5, TypeScript | Authoritative REST API, Double-Entry Ledger, Idempotency Engine, 105 Surity Rules |
| **Database** | SQLite 3 (Node.js native `DatabaseSync` in WAL Mode) | Fast, embedded ACID database with write-ahead logging and zero-latency transactions |
| **Unified Hosting** | Single-Port Architecture | Express automatically serves prebuilt static assets (`frontend/dist`) with client-side SPA routing fallback |
| **Port** | `5000` (configurable via `PORT` environment variable) | Reverse proxied to `80` (HTTP) & `443` (HTTPS / TLS) via Nginx or Cloudflare |

---

## 🚀 Quick Verification (Local Production Test)

Before deploying to your live server, verify the unified build on your local machine:

```bash
# 1. Build the modern React frontend
npm run build:frontend

# 2. Run the platform test suite (verifies 105 Surity rules & double-entry ledger)
npm run test

# 3. Launch the single-port production server
npm start
```
Open **`http://localhost:5000`** in your browser. Both the customer web app and the administrative command center (`/#/admin/login`) will be live on port 5000.

---

## 🖥️ Option 1: VPS Live Hosting (Ubuntu 22.04 / 24.04 LTS — Recommended)

This is the most cost-effective and high-performance method for production (Hostinger, DigitalOcean Droplet, Hetzner, AWS EC2, or Linode).

### Step 1: Server Provisioning & Dependencies
Log into your server via SSH as `root` or `sudo` user:

```bash
# Update Ubuntu package manager
sudo apt update && sudo apt upgrade -y

# Install Node.js 22 LTS
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs nginx git certbot python3-certbot-nginx ufw

# Install PM2 Process Manager globally
sudo npm install -g pm2
```

### Step 2: Clone or Upload the Codebase
```bash
# Create application directory
sudo mkdir -p /var/www/bukar-data-sub
sudo chown -R $USER:$USER /var/www/bukar-data-sub

# Clone repository or copy project files into /var/www/bukar-data-sub
cd /var/www/bukar-data-sub

# Install dependencies and build frontend
cd backend && npm ci --omit=dev && cd ..
cd frontend && npm ci && npm run build && cd ..
```

### Step 3: Configure Production Environment (`.env`)
Create `backend/.env` based on `backend/.env.production.example`:

```bash
cat << 'EOF' > backend/.env
NODE_ENV=production
PORT=5000
APP_NAME="Bukar Data Sub"
SUPPORT_EMAIL=support@bukardatasub.com
DEFAULT_CURRENCY=NGN
DB_PATH=/var/www/bukar-data-sub/backend/data/platform.sqlite
BACKUP_DIR=/var/www/bukar-data-sub/backend/data/backups

# Security Keys (Generate high-entropy random keys)
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
ENCRYPTION_KEY=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
CORS_ORIGIN=https://bukardatasub.com,https://www.bukardatasub.com

# Payment Gateway Live Credentials (Add when ready)
PAYSTACK_SECRET_KEY=bds_paystack_secret_key_placeholder
PALMPAY_APP_ID=xxxx
PALMPAY_APP_SECRET=xxxx
EOF
```

### Step 4: Start with PM2 Process Manager
```bash
# Start Bukar Data Sub using PM2 ecosystem file
pm2 start ecosystem.config.cjs --env production

# Save process list to auto-start on server reboot
pm2 save
pm2 startup
```

### Step 5: Configure Nginx Reverse Proxy & Free Let's Encrypt SSL
Create Nginx configuration:
```bash
sudo nano /etc/nginx/sites-available/bukardatasub.com
```

Paste the following configuration:
```nginx
server {
    server_name bukardatasub.com www.bukardatasub.com;

    client_max_body_size 25M;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable site and install SSL certificate:
```bash
sudo ln -s /etc/nginx/sites-available/bukardatasub.com /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Obtain free automatic SSL certificate via Let's Encrypt
sudo certbot --nginx -d bukardatasub.com -d www.bukardatasub.com --non-interactive --agree-tos -m admin@bukardatasub.com --redirect
```

### Step 6: Enable UFW Firewall
```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

---

## 🐳 Option 2: Docker & Docker Compose Hosting

For zero-dependency deployment on any Docker-compatible server or cloud VM:

```bash
# 1. Build and start containers in detached mode
docker compose up -d --build

# 2. Check running status
docker compose ps

# 3. View live server logs
docker compose logs -f bukar-data-sub
```

The database is persisted in the Docker volume `bds-data` and will never be lost on container restarts or upgrades.

---

## ☁️ Option 3: Managed Cloud PaaS (Render, Railway, Fly.io)

### Render (render.com)
1. Fork or push your codebase to GitHub/GitLab.
2. In the Render Dashboard, create a **New Web Service**.
3. Configure the service:
   - **Environment**: Node
   - **Build Command**: `npm run build:frontend && cd backend && npm install`
   - **Start Command**: `node --import tsx backend/src/server.ts`
4. Add a **Persistent Disk** (Mount Path: `/app/backend/data`, Size: 5 GB or larger) to retain the SQLite database.
5. Set Environment Variables:
   - `NODE_ENV`: `production`
   - `PORT`: `10000` (Render default)
   - `JWT_SECRET`: *(Generate a 64-char random hex string)*
   - `DB_PATH`: `/app/backend/data/platform.sqlite`

### Railway (railway.app)
1. Create a New Project from GitHub Repo.
2. Add a **Volume** mounted to `/app/backend/data`.
3. Add the build & start commands:
   - Build: `npm run build:frontend && cd backend && npm ci`
   - Start: `node --import tsx backend/src/server.ts`

---

## 📁 Option 4: cPanel Shared Hosting (with Node.js Selector)

1. In cPanel, navigate to **Setup Node.js App**.
2. Click **Create Application**:
   - **Node.js version**: `20.x` or `22.x`
   - **Application mode**: `Production`
   - **Application root**: `bukar_data_sub`
   - **Application URL**: `bukardatasub.com`
   - **Application startup file**: `backend/src/server.ts`
3. Upload all project files into `public_html/bukar_data_sub`.
4. Run `npm install` and `npm run build` in frontend.
5. In the cPanel terminal, launch the application.

---

## 🗄️ Clean Production Database State

The platform is delivered in a 100% pristine, fresh production state with **zero mock, seed, or test data**:
- **Total Registered Customers**: 0 *(Zero dummy accounts; real registrations will populate organically)*
- **Total Customer Balances**: ₦0.00
- **Total Historical Transactions**: 0 *(Zero fake purchases or simulated receipts)*
- **Total Inflows, Gross Volume & Profit**: ₦0.00
- **Sole Active User**: Super Administrator (`admin@bukardatasub.com`) with initial ₦0.00 wallet
- **Real Service Catalogue**: 12 active VTU categories (Data, Airtime, SunKing Solar, Electricity, Cable TV, etc.)
- **Real Telecom Data Plans**: 22 authentic Nigerian data bundles (MTN SME, Airtel Corporate Gifting, Glo CG, etc.)
- **Official Payment Gateways**: Monnify, Paystack, PalmPay, and Direct Bank Transfer set to `BUKAR DATA SUB LTD`
- **Official System Settings**: Branded to `Bukar Data Sub` (`support@bukardatasub.com`)

### Database Management Commands
```bash
# View real-time row counts across all 38 tables
npm run db:inspect

# Execute a fresh production reset at any time (purges all activity and resets Super Admin)
npm run db:reset
```

---

## 🔐 Administrative & Staff Access Credentials

Bukar Data Sub enforces strict Role-Based Access Control (RBAC):
- **Customer Portal**: Customers sign in via the home modal. Administrators are strictly forbidden here and redirected.
- **Dedicated Staff Portal**: `https://bukardatasub.com/#/admin/login` (accessible only to authorized administrative roles).

### Default Initial Super Admin Credentials
- **Portal URL**: `/#/admin/login`
- **Username / Email**: `admin@bukardatasub.com` *(or `admin@abkdata.com` for legacy compatibility)*
- **Default Password**: `BukarData#2026` *(or `Admin@DataApp2026!`)*
- **Security Check**: Enforced by Surity 105-rule validation engine. Change password upon initial live deployment via the Admin Security Tab.

---

## 🛡️ Live Security Verification Checklist

- [x] **Double-Entry Ledger Active**: Credits matched by counter ledger entries; balance overdraws blocked.
- [x] **105 Surity Rules Enforced**: Email, NUBAN, Tier limits, MSISDN normalization, XSS escaping, Brute-force throttling.
- [x] **Separate Administrative Login**: Administrators cannot use customer login, and normal users are blocked from admin portal.
- [x] **SQLite WAL Synchronous Mode**: Concurrent readers do not block writes; zero transaction corruption.
- [x] **Automated Encrypted Backups**: Scheduled SHA-256 verified SQLite snapshots stored in `backend/data/backups/`.
- [x] **Zero Plaintext Secrets**: Gateways, provider secrets, and passwords masked in both API and UI responses.

---

## 📞 Support & Maintenance Desk

- **Platform Email**: `support@bukardatasub.com`
- **Technical Operator**: Bukar Data Sub Engineering Team
- **Disaster Recovery**: Run `npm run test:surity` at any time to execute full compliance health diagnostics.
