import { Router, type IRouter } from "express";
import { MODEL_CATALOG } from "../lib/models";

const router: IRouter = Router();

router.get("/models", (_req, res) => {
  res.json({ models: MODEL_CATALOG });
});

export default router;
