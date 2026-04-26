import { Router, type IRouter } from "express";
import {
  getDeployConfig,
  startDeploy,
  getCurrentJob,
  getHistory,
  getRuntimeStage,
  getSpaceUrl,
} from "../lib/deploy";

const router: IRouter = Router();

router.get("/deploy/config", (_req, res) => {
  res.json(getDeployConfig());
});

router.post("/deploy/push", (req, res) => {
  const commitMessage =
    typeof req.body?.commitMessage === "string" && req.body.commitMessage.trim().length > 0
      ? req.body.commitMessage.trim()
      : undefined;
  const job = startDeploy(commitMessage);
  res.json(job);
});

router.get("/deploy/status", (_req, res) => {
  const job = getCurrentJob();
  if (!job) {
    return res.status(404).json({ error: "No deployment has been triggered yet." });
  }
  res.json({
    job,
    spaceUrl: getSpaceUrl(),
    runtimeStage: getRuntimeStage(),
  });
});

router.get("/deploy/history", (_req, res) => {
  res.json({ jobs: getHistory() });
});

export default router;
