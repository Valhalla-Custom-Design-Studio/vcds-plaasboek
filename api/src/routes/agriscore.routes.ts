import { Router, Request, Response } from "express";
import { calculateAgriScore } from "../services/AgriScoreService";

const router = Router();

router.post("/calculate", (req: Request, res: Response) => {
  try {
    const result = calculateAgriScore(req.body);
    return res.json({ success: true, data: result });
  } catch (err: unknown) {
    return res.status(500).json({ error: err instanceof Error ? err.message : "Unknown error" });
  }
});

export default router;
