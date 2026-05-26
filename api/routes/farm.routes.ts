import { Router } from 'express';
import { listAnimals, createAnimal, updateAnimal, deleteAnimal } from '../controllers/livestock.controller';
import { listRecords, createRecord } from '../controllers/records.controller';
import { listWorkers, createWorker } from '../controllers/workers.controller';
import { listExpenses, createExpense } from '../controllers/expenses.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();
router.use(authenticate);

router.get('/livestock', listAnimals);
router.post('/livestock', createAnimal);
router.patch('/livestock/:id', updateAnimal);
router.delete('/livestock/:id', deleteAnimal);

router.get('/records', listRecords);
router.post('/records', createRecord);

router.get('/workers', listWorkers);
router.post('/workers', createWorker);

router.get('/expenses', listExpenses);
router.post('/expenses', createExpense);

export default router;
