import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export async function listAnimals(req: Request, res: Response) {
  const userId = (req as any).user?.userId;
  const animals = await prisma.animal.findMany({ where: { ownerId: userId }, orderBy: { createdAt: 'desc' } });
  return res.json(animals);
}

export async function createAnimal(req: Request, res: Response) {
  const ownerId = (req as any).user?.userId;
  const data = req.body;
  const animal = await prisma.animal.create({ data: { ...data, ownerId } });
  return res.status(201).json(animal);
}

export async function updateAnimal(req: Request, res: Response) {
  const { id } = req.params;
  const animal = await prisma.animal.update({ where: { id }, data: req.body });
  return res.json(animal);
}

export async function deleteAnimal(req: Request, res: Response) {
  const { id } = req.params;
  await prisma.animal.delete({ where: { id } });
  return res.status(204).send();
}
