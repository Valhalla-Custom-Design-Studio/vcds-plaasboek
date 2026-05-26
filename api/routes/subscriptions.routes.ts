import { Router } from 'express';
import { getPlans, subscribe, getSubscription } from '../controllers/subscriptions.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.get('/plans', getPlans);
router.get('/my', authenticate, getSubscription);
router.post('/subscribe', authenticate, subscribe);

export default router;
