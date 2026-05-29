import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'changeme';

export async function register(req: Request, res: Response) {
  try {
    const { email, password, name, phone } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ message: 'Naam, e-pos en wagwoord is verpligtend.' });
    }
    if (password.length < 8) {
      return res.status(400).json({ message: 'Wagwoord moet minstens 8 karakters wees.' });
    }
    const existingEmail = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
    if (existingEmail) {
      return res.status(409).json({ message: 'Hierdie e-posadres is al geregistreer. Teken eerder in.' });
    }
    if (phone) {
      const existingPhone = await prisma.user.findFirst({ where: { phone } });
      if (existingPhone) {
        return res.status(409).json({ message: 'Hierdie selfoonnommer is al geregistreer.' });
      }
    }
    const hash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { email: email.trim().toLowerCase(), password: hash, name, phone: phone || null },
    });
    const access_token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    return res.status(201).json({
      data: { access_token, user: { id: user.id, email: user.email, name: user.name, tier: user.tier ?? 'free' } },
    });
  } catch (err: any) {
    if (err.code === 'P2002') {
      const field = err.meta?.target?.includes('email') ? 'e-posadres' : 'selfoonnommer';
      return res.status(409).json({ message: `Hierdie ${field} is al geregistreer.` });
    }
    return res.status(500).json({ message: err.message });
  }
}

export async function login(req: Request, res: Response) {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
    if (!user) return res.status(401).json({ message: 'Ongeldige e-pos of wagwoord.' });
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ message: 'Ongeldige e-pos of wagwoord.' });
    const access_token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    return res.json({ data: { access_token, user: { id: user.id, email: user.email, name: user.name, tier: user.tier ?? 'free' } } });
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
}

export async function me(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.userId;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, tier: true, createdAt: true, phone: true },
    });
    if (!user) return res.status(404).json({ message: 'Gebruiker nie gevind nie.' });
    return res.json({ data: { user } });
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
}
