import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { CONFIG } from './config/index.js';
import { initializeDatabase } from './database/index.js';
import { auditLogger } from './middleware/audit.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import authRoutes from './routes/auth.js';
import walletRoutes from './routes/wallet.js';
import paymentRoutes from './routes/payment.js';
import vtuRoutes from './routes/vtu.js';
import airtimeToCashRoutes from './routes/airtimeToCash.js';
import savingsRoutes from './routes/savings.js';
import kycRoutes from './routes/kyc.js';
import simHostingRoutes from './routes/simHosting.js';
import providerRoutes from './routes/provider.js';
import notificationRoutes from './routes/notification.js';
import adminRoutes from './routes/admin.js';
import resellerRoutes from './routes/reseller.js';
import settingsRoutes from './routes/settings.js';
import withdrawalRoutes from './routes/withdrawal.js';
import referralRoutes from './routes/referrals.js';
import announcementRoutes from './routes/announcements.js';
import financialCommandRoutes from './routes/financialCommand.js';
import reconciliationRoutes from './routes/reconciliation.js';
import supportChatRoutes from './routes/supportChat.js';
import staffTaskRoutes from './routes/staffTasks.js';
import { maintenanceGuard } from './middleware/maintenance.js';

const app = express();

// Initialize Database & Seed
initializeDatabase();

// Security Middlewares
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));
app.use(cors({
  origin: CONFIG.CORS_ORIGIN,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Idempotency-Key', 'X-Idempotency-Key']
}));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// Audit Logging Middleware for mutating actions
app.use(auditLogger);

// Health Check Endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'HEALTHY',
    application: CONFIG.APP_NAME,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: 'CONNECTED_WAL_MODE'
  });
});

// Server-Side Scoped Maintenance Mode Guard
app.use(maintenanceGuard);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/vtu', vtuRoutes);
app.use('/api/airtime-to-cash', airtimeToCashRoutes);
app.use('/api/savings', savingsRoutes);
app.use('/api/kyc', kycRoutes);
app.use('/api/sim-hosting', simHostingRoutes);
app.use('/api/providers', providerRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/reseller', resellerRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/withdrawals', withdrawalRoutes);
app.use('/api/referrals', referralRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/admin/financial-command', financialCommandRoutes);
app.use('/api/admin/reconciliation', reconciliationRoutes);
app.use('/api/support/chat', supportChatRoutes);
app.use('/api/admin/tasks', staffTaskRoutes);

// Unified Production Frontend Serving (Single-Port Hosting)
const possibleDistPaths = [
  path.resolve(__dirname, '../../frontend/dist'),
  path.resolve(process.cwd(), '../frontend/dist'),
  path.resolve(process.cwd(), 'frontend/dist'),
  path.resolve(process.cwd(), 'dist')
];

let activeDistPath: string | null = null;
for (const p of possibleDistPaths) {
  if (fs.existsSync(p) && fs.existsSync(path.join(p, 'index.html'))) {
    activeDistPath = p;
    break;
  }
}

if (activeDistPath) {
  console.log(`📦 [STATIC] Production frontend active from: ${activeDistPath}`);
  app.use(express.static(activeDistPath));
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.method === 'GET' && !req.path.startsWith('/api')) {
      return res.sendFile(path.join(activeDistPath!, 'index.html'));
    }
    next();
  });
}

// Global Error Handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('[SERVER ERROR]', err);
  const statusCode = err.status || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'An internal server error occurred',
    ...(CONFIG.NODE_ENV !== 'production' && { stack: err.stack })
  });
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(CONFIG.PORT, () => {
    console.log(`=======================================================`);
    console.log(`🚀 ${CONFIG.APP_NAME} Central Authoritative Backend`);
    console.log(`🌐 Server running at: http://localhost:${CONFIG.PORT}`);
    console.log(`🔒 Security: Helmet, Double-Entry Ledger, Idempotency Active`);
    console.log(`💾 Database: SQLite WAL Synchronous Engine with Foreign Keys`);
    console.log(`=======================================================`);
  });
}

export default app;
