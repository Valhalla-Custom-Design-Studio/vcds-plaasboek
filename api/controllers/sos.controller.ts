import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { sendPushNotification, sendSOSToFamily } from '../src/services/fcm.service';

const prisma = new PrismaClient();

export async function triggerFarmSOS(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.userId;
    const { lat, lng, type, attackType, farmId, description } = req.body;

    const sos = await prisma.farmSOS.create({
      data: { userId, lat: lat || 0, lng: lng || 0, type: type || 'attack', attackType, farmId, status: 'active', description },
    });

    const farmer = await prisma.user.findUnique({ where: { id: userId } });

    // Notify emergency contacts
    const contacts = await prisma.emergencyContact.findMany({ where: { userId } });
    const tokens = contacts.map(c => c.pushToken).filter(Boolean) as string[];

    if (tokens.length) {
      await sendSOSToFamily(tokens, farmer?.name || 'Boer', attackType || type || 'Farm Attack', { lat, lng });
    }

    return res.status(201).json({ sos, notified: tokens.length });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}

export async function cancelFarmSOS(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const sos = await prisma.farmSOS.update({
      where: { id },
      data: { status: 'cancelled', resolvedAt: new Date() },
    });
    return res.json(sos);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}

export async function getActiveFarmSOS(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.userId;
    const active = await prisma.farmSOS.findMany({
      where: { userId, status: 'active' },
      orderBy: { createdAt: 'desc' },
    });
    return res.json(active);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}
