# 🗄️ Bukar Data Sub — Ready-Made Production Database Suite

This directory contains pre-generated, production-ready databases for **Bukar Data Sub**. All 41 tables, indexes, constraints, services, plans, payment gateway configs, and the root super administrator account are fully configured.

---

## 📁 Available Files

| File | Type | Best For | Size |
|---|---|---|---|
| **[`bukardatasub_production.sqlite`](./bukardatasub_production.sqlite)** | SQLite Binary Database | Node.js backend, VPS, Docker, Desktop SQLite tools (DBeaver, TablePlus) | ~570 KB |
| **[`bukardatasub_production.sql`](./bukardatasub_production.sql)** | Universal SQL Dump | SQLite CLI, Cloud SQLite, automated CI/CD migration scripts | ~90 KB |
| **[`bukardatasub_mysql.sql`](./bukardatasub_mysql.sql)** | MySQL / MariaDB Dump | cPanel phpMyAdmin, MySQL 8+, MariaDB, Cloud RDS / Aiven | ~94 KB |

---

## ⚡ How to Import (Choose Your Environment)

### Option 1: Automatic 1-Click Import (Recommended for Node.js / VPS)
Run this command in the project root:
```bash
npm run db:import
```
This automatically backs up any existing database and drops the fresh ready-made database into `backend/data/platform.sqlite`.

---

### Option 2: Direct File Copy (Zero Commands)
If you are deploying on a server or VPS, simply copy:
```bash
cp database/bukardatasub_production.sqlite backend/data/platform.sqlite
```
Start your backend server:
```bash
npm start
```
The server will immediately recognize all tables and data.

---

### Option 3: SQLite Command Line (CLI)
To create or restore a fresh database using the SQL dump file:
```bash
sqlite3 backend/data/platform.sqlite < database/bukardatasub_production.sql
```

---

### Option 4: cPanel / phpMyAdmin (MySQL / MariaDB)
1. Open your cPanel and navigate to **phpMyAdmin**.
2. Select or create your database (e.g. `bukardatasub_db`).
3. Click on the **Import** tab at the top.
4. Click **Choose File** and select `database/bukardatasub_mysql.sql`.
5. Click **Import** (or **Go**).
6. All 42 tables, views (including reserveAccounts), indexes, and initial production records will be created instantly.

---

### Option 5: DBeaver / TablePlus / DB Browser for SQLite
- **SQLite GUI**: Open `database/bukardatasub_production.sqlite` directly in DB Browser for SQLite or TablePlus.
- **SQL Execute**: Open a SQL Editor in your GUI tool, paste the contents of `database/bukardatasub_production.sql`, and execute script.

---

## 🔐 Default Production Credentials

- **Super Administrator Email**: `admin@bukardatasub.com`
- **Default Password**: `BukarData#2026`
- **Default Transaction PIN**: `1234`
- **Account Tier**: Tier 3 (Super Admin, Unlimited Quota)
- **Root Wallet**: `₦0.00` (Pristine, zero fake balances)
- **Active Gateways Configured**:
- **Dedicated Reserved Accounts (reserveAccounts / reserved_accounts)**: 5 pre-configured dedicated virtual bank accounts for Wema Bank (035), Sterling Bank (232), Fidelity Bank (070), PalmPay MFB (999991), and Moniepoint MFB (50515). Monnify, Paystack, PalmPay, Flutterwave, Manual Corporate Transfer (Moniepoint MFB, Account: `9131797675`)
- **Active Telecom Plans**: MTN SME (500MB, 1GB, 2GB, 5GB, 10GB), Airtel CG (1GB, 2GB), Glo CG (1GB, 3GB), SunKing Solar PINs (1-Day, 7-Day, 30-Day)
- **Active Notifications**: All 39 system event templates with responsive HTML and SMS copy.
