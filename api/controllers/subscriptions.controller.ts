import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const TIERS = {
  world: { price: 0, name: 'World' },
  sa: { price: 99, name: 'SA' },
  platinum: { price: 299, name: 'Platinum' },
};

export async function getPlans(_req: Request, res: Response) {
  return res.json(TIERS);
}

export async function subscribe(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.userId;
    const { tier } = req.body;
    if (!['world', 'sa', 'platinum'].includes(tier)) {
      return res.status(400).json({ error: 'Invalid tier' });
    }
    const user = await prisma.user.update({ where: { id: userId }, data: { tier } });
    return res.json({ success: true, tier: user.tier });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}

export async function getSubscription(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.userId;
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { tier: true } });
    return res.json({ tier: user?.tier || 'world' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}
