import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth.js';
import { KYCVerificationService } from '../services/kycVerificationService.js';
import { requireRole } from '../middleware/rbac.js';

const router = Router();

/**
 * Get Verification Tasks (Matching Screenshot 3 UI)
 */
router.get('/tasks', authenticate, (req: Request, res: Response): void => {
  try {
    const status = req.query.status as string | undefined;
    const search = req.query.search as string | undefined;

    const data = KYCVerificationService.getTasks(status, search);
    res.json({ success: true, ...data });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * Submit Verification Task (e.g. CAC / NIN / BVN)
 */
router.post('/submit', authenticate, (req: Request, res: Response): void => {
  try {
    const { taskType, subjectName, regNumber, location, documentUrl } = req.body;
    if (!taskType || !subjectName || !regNumber || !location) {
      res.status(400).json({ success: false, message: 'All fields are required for verification task' });
      return;
    }

    const task = KYCVerificationService.submitTask(
      req.user!.id,
      taskType,
      subjectName,
      regNumber,
      location,
      documentUrl
    );

    res.json({ success: true, message: 'Verification task submitted for review', task });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

/**
 * Admin Review Task (Approve, Reject, or Cancel)
 */
router.post('/review/:id', authenticate, requireRole('super_admin', 'sub_admin'), (req: Request, res: Response): void => {
  try {
    const { id } = req.params;
    const { decision, reason } = req.body;
    if (!decision || !['COMPLETED', 'REJECTED', 'CANCELLED'].includes(decision)) {
      res.status(400).json({ success: false, message: 'Valid decision (COMPLETED, REJECTED, CANCELLED) is required' });
      return;
    }

    const result = KYCVerificationService.reviewTask(id, req.user!.email, decision, reason);
    res.json({ success: true, message: `Task marked as ${decision}`, ...result });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

export default router;
