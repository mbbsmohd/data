# 🚀 Bukar Data Sub — Single-File Database Deployment Guide

You now have a **single, ready-to-deploy database file** right in the root of your project:

👉 **[`database.sqlite`](./database.sqlite)** *(569 KB — 100% complete, zero configuration required)*

---

## 🌟 What is Inside this Single File?

This single file contains the **entire production backend database**:
- **All 41 tables and indexes** created and pre-indexed.
- **Root Super Admin Account**:
  - **Email**: `admin@bukardatasub.com`
  - **Password**: `BukarData#2026`
  - **Transaction PIN**: `1234`
  - **Role & Tier**: `super_admin` (Tier 3)
- **Official Branding**: Bukar Data Sub, `support@bukardatasub.com`, `09131797675`, `₦ (NGN)`.
- **Payment Gateways**: Monnify, Paystack, PalmPay, Flutterwave, and Direct Corporate Bank Deposit (`Moniepoint MFB - 9131797675 - BUKAR DATA SUB LTD`).
- **Telecom Services & Plans**: MTN SME (500MB, 1GB, 2GB, 5GB, 10GB), Airtel CG (1GB, 2GB), Glo CG (1GB, 3GB), SunKing Solar PINs (1-Day, 7-Day, 30-Day), Cable TV, Electricity, Airtime to Cash, Bulk SMS.
- **CMS & Landing Pages**: Pre-populated hero section, services promo, footer, legal & privacy policies.
- **Mobile Remote Config**: Live update flags and theme settings.
- **All 39 System Notification Templates**: Pre-configured HTML email layouts and SMS alerts.
- **Clean Ledger & Wallets**: Zero dummy users, zero fake transactions.

---

## ⚡ How to Deploy Online (Pick Your Option)

### Option A: Deploy with Node.js / VPS / Docker / Cloud (Easiest)
1. Upload your code to your server or VPS (or pull from GitHub: `https://github.com/mbbsmohd/data`).
2. The single file `database.sqlite` is already in the root folder.
3. Start your app:
   ```bash
   npm start
   ```
   *The system automatically detects and loads `database.sqlite`!*

---

### Option B: Deploying with Docker
The Docker container automatically uses `database.sqlite` when mounted or copied:
```bash
docker compose up -d
```

---

### Option C: If Your Online Host Requires a SQL Import (e.g., cPanel phpMyAdmin or MySQL)
If your online hosting requires an SQL text file instead of SQLite binary, use the companion single file:
👉 **[`database.sql`](./database.sql)**

To import in cPanel phpMyAdmin or MySQL:
1. Open **phpMyAdmin**.
2. Click **Import**.
3. Choose **`database.sql`** (or `database/bukardatasub_mysql.sql`).
4. Click **Go**!

---

## 🔍 How to Inspect the Single Database Locally

Run:
```bash
node scripts/inspect_single_db.js database.sqlite
```
You will see all 41 tables and 85 verified seed records confirmed instantly.
