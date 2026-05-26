import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export async function listWorkers(req: Request, res: Response) {
  const userId = (req as any).user?.userId;
  const workers = await prisma.worker.findMany({ where: { farmOwnerId: userId } });
  return res.json(workers);
}

export async function createWorker(req: Request, res: Response) {
  const farmOwnerId = (req as any).user?.userId;
  const worker = await prisma.worker.create({ data: { ...req.body, farmOwnerId } });
  return res.status(201).json(worker);
}
