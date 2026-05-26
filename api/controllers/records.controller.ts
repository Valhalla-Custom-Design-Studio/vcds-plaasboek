import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export async function listRecords(req: Request, res: Response) {
  const userId = (req as any).user?.userId;
  const { type } = req.query;
  const records = await prisma.farmRecord.findMany({ where: { ownerId: userId, ...(type ? { type: type as string } : {}) }, orderBy: { date: 'desc' } });
  return res.json(records);
}

export async function createRecord(req: Request, res: Response) {
  const ownerId = (req as any).user?.userId;
  const record = await prisma.farmRecord.create({ data: { ...req.body, ownerId } });
  return res.status(201).json(record);
}
