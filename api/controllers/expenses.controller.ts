import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export async function listExpenses(req: Request, res: Response) {
  const userId = (req as any).user?.userId;
  const { from, to } = req.query;
  const expenses = await prisma.expense.findMany({
    where: { ownerId: userId, ...(from && to ? { date: { gte: new Date(from as string), lte: new Date(to as string) } } : {}) },
    orderBy: { date: 'desc' }
  });
  return res.json(expenses);
}

export async function createExpense(req: Request, res: Response) {
  const ownerId = (req as any).user?.userId;
  const expense = await prisma.expense.create({ data: { ...req.body, ownerId } });
  return res.status(201).json(expense);
}
