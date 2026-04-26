import { simpleGit } from "simple-git";
import { mkdtemp, rm, mkdir, writeFile, readFile, readdir, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import os from "node:os";
import { logger } from "./logger";

export type DeployState = "pending" | "pushing" | "building" | "success" | "failed";

export type DeployJob = {
  id: string;
  startedAt: string;
  finishedAt?: string | null;
  state: DeployState;
  spaceRepo: string;
  commitMessage?: string | null;
  commitSha?: string | null;
  message?: string | null;
  logs?: string | null;
};

const SPACE_REPO = process.env["HF_SPACE_REPO"] ?? "shrey77777/xyzzz";
const DEFAULT_BRANCH = process.env["HF_SPACE_BRANCH"] ?? "main";
const HF_USER = process.env["HF_USER"] ?? SPACE_REPO.split("/")[0];

const HISTORY: DeployJob[] = [];
let CURRENT: DeployJob | null = null;
let RUNTIME_STAGE: string | null = null;

export function getDeployConfig() {
  return {
    spaceRepo: SPACE_REPO,
    hasToken: Boolean(process.env["HF_TOKEN"]),
    defaultBranch: DEFAULT_BRANCH,
  };
}

export function getCurrentJob(): DeployJob | null {
  return CURRENT;
}

export function getHistory(): DeployJob[] {
  return [...HISTORY].sort((a, b) => b.startedAt.localeCompare(a.startedAt)).slice(0, 20);
}

export function getRuntimeStage(): string | null {
  return RUNTIME_STAGE;
}

export function getSpaceUrl(): string {
  return `https://huggingface.co/spaces/${SPACE_REPO}`;
}

function appendLog(job: DeployJob, line: string) {
  const ts = new Date().toISOString().split("T")[1].split(".")[0];
  job.logs = (job.logs ?? "") + `[${ts}] ${line}\n`;
}

async function copyTemplate(src: string, dest: string) {
  const entries = await readdir(src, { withFileTypes: true });
  for (const entry of entries) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      await mkdir(d, { recursive: true });
      await copyTemplate(s, d);
    } else if (entry.isFile()) {
      const buf = await readFile(s);
      await writeFile(d, buf);
    }
  }
}

function findTemplateDir(): string {
  // dev: artifacts/api-server/src/hf-space-template
  // built CJS: dist next to source — fall back through candidates
  const here = path.dirname(new URL(import.meta.url).pathname);
  const candidates = [
    // bundled dist: dist/hf-space-template (sibling of dist/index.mjs)
    path.resolve(here, "hf-space-template"),
    // dev source layout: artifacts/api-server/src/hf-space-template
    path.resolve(here, "..", "hf-space-template"),
    path.resolve(here, "..", "..", "src", "hf-space-template"),
    path.resolve(process.cwd(), "src", "hf-space-template"),
    path.resolve(process.cwd(), "artifacts", "api-server", "src", "hf-space-template"),
    path.resolve(process.cwd(), "artifacts", "api-server", "dist", "hf-space-template"),
  ];
  for (const c of candidates) {
    if (existsSync(c)) return c;
  }
  throw new Error(`HF Space template not found. Tried: ${candidates.join(", ")}`);
}

async function pollBuildStatus(job: DeployJob): Promise<void> {
  // HF Spaces API: GET /api/spaces/{repo} returns runtime.stage
  const token = process.env["HF_TOKEN"];
  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const deadline = Date.now() + 5 * 60 * 1000; // 5 min cap
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`https://huggingface.co/api/spaces/${SPACE_REPO}`, { headers });
      if (res.ok) {
        const data = (await res.json()) as { runtime?: { stage?: string } };
        const stage = data.runtime?.stage ?? null;
        RUNTIME_STAGE = stage;
        if (stage) appendLog(job, `HF runtime stage: ${stage}`);
        if (stage === "RUNNING") {
          job.state = "success";
          job.message = "Space is live and running";
          job.finishedAt = new Date().toISOString();
          appendLog(job, "Build succeeded.");
          return;
        }
        if (stage && /ERROR|FAILED|STOPPED/.test(stage)) {
          job.state = "failed";
          job.message = `Build ended with stage ${stage}`;
          job.finishedAt = new Date().toISOString();
          appendLog(job, `Build failed: ${stage}`);
          return;
        }
      } else {
        appendLog(job, `Status poll HTTP ${res.status}`);
      }
    } catch (err) {
      appendLog(job, `Status poll error: ${(err as Error).message}`);
    }
    await new Promise((r) => setTimeout(r, 4000));
  }
  // Timeout — leave as building (user can keep polling) or mark success best-effort
  job.state = "success";
  job.message = "Build polling timed out — check the Space URL for live status";
  job.finishedAt = new Date().toISOString();
  appendLog(job, "Polling timed out.");
}

async function ensureSpaceExists(): Promise<void> {
  const token = process.env["HF_TOKEN"];
  if (!token) return;
  // Check existence
  const check = await fetch(`https://huggingface.co/api/spaces/${SPACE_REPO}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (check.ok) return;
  if (check.status !== 404) return; // some other error — let push surface it
  // Try to create the Space (Docker SDK)
  await fetch("https://huggingface.co/api/repos/create", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      type: "space",
      name: SPACE_REPO.split("/")[1],
      organization: SPACE_REPO.split("/")[0],
      private: false,
      sdk: "docker",
    }),
  });
}

async function runDeploy(job: DeployJob, commitMessage: string): Promise<void> {
  const token = process.env["HF_TOKEN"];
  if (!token) {
    job.state = "failed";
    job.message = "HF_TOKEN not set";
    job.finishedAt = new Date().toISOString();
    appendLog(job, "Aborted: HF_TOKEN missing.");
    return;
  }

  let workDir: string | null = null;
  try {
    appendLog(job, "Verifying Hugging Face Space exists...");
    await ensureSpaceExists();

    job.state = "pushing";
    workDir = await mkdtemp(path.join(os.tmpdir(), "hf-deploy-"));
    appendLog(job, `Working dir: ${workDir}`);

    const remoteUrl = `https://${HF_USER}:${token}@huggingface.co/spaces/${SPACE_REPO}`;
    const git = simpleGit(workDir);

    appendLog(job, `Cloning ${SPACE_REPO}...`);
    try {
      await git.clone(remoteUrl, ".");
    } catch (err) {
      appendLog(job, `Clone failed (${(err as Error).message}), initializing fresh repo.`);
      await git.init();
      await git.addRemote("origin", remoteUrl);
      await git.checkoutLocalBranch(DEFAULT_BRANCH);
    }

    await git.addConfig("user.email", "ai-router@replit.local");
    await git.addConfig("user.name", "AI Router Bot");

    // Wipe everything except .git, then copy template in
    appendLog(job, "Syncing template files...");
    const entries = await readdir(workDir);
    for (const e of entries) {
      if (e === ".git") continue;
      await rm(path.join(workDir, e), { recursive: true, force: true });
    }
    const templateDir = findTemplateDir();
    await copyTemplate(templateDir, workDir);
    appendLog(job, `Copied template from ${templateDir}`);

    await git.add(".");
    const status = await git.status();
    if (status.files.length === 0) {
      appendLog(job, "No changes to commit. Forcing empty commit to trigger rebuild.");
      await git.commit(commitMessage, undefined, { "--allow-empty": null });
    } else {
      await git.commit(commitMessage);
    }
    const log = await git.log({ maxCount: 1 });
    job.commitSha = log.latest?.hash ?? null;
    appendLog(job, `Committed ${job.commitSha?.slice(0, 7) ?? "?"}: ${commitMessage}`);

    appendLog(job, `Pushing to ${SPACE_REPO}@${DEFAULT_BRANCH}...`);
    try {
      await git.push("origin", DEFAULT_BRANCH);
    } catch (err) {
      // first push or non-existent branch
      appendLog(job, `Push failed once (${(err as Error).message}), retrying with -u`);
      await git.push(["-u", "origin", DEFAULT_BRANCH]);
    }
    appendLog(job, "Push complete. Waiting for HF build...");

    job.state = "building";
    await pollBuildStatus(job);
  } catch (err) {
    job.state = "failed";
    job.message = (err as Error).message;
    job.finishedAt = new Date().toISOString();
    appendLog(job, `ERROR: ${(err as Error).message}`);
    logger.error({ err }, "Deploy failed");
  } finally {
    if (workDir) {
      await rm(workDir, { recursive: true, force: true }).catch(() => {});
    }
  }
}

export function startDeploy(commitMessage?: string): DeployJob {
  if (CURRENT && (CURRENT.state === "pending" || CURRENT.state === "pushing" || CURRENT.state === "building")) {
    return CURRENT;
  }
  const job: DeployJob = {
    id: `dep_${Date.now().toString(36)}`,
    startedAt: new Date().toISOString(),
    state: "pending",
    spaceRepo: SPACE_REPO,
    commitMessage: commitMessage ?? "Update from Replit AI Router",
    commitSha: null,
    message: null,
    logs: "",
  };
  CURRENT = job;
  HISTORY.push(job);
  appendLog(job, `Starting deploy to ${SPACE_REPO}...`);
  // fire-and-forget
  runDeploy(job, job.commitMessage!).catch((err) => {
    logger.error({ err }, "runDeploy crashed");
  });
  return job;
}
