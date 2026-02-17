import fs from "fs/promises";
import path from "path";

const SEED_ROOT = path.join(process.cwd(), "seeds", "scenarios");
const WORK_ROOT = "/tmp";

export function getWorkspacePath(sessionId: string) {
  return path.join(WORK_ROOT, `vbescore-session-${sessionId}`);
}

export async function ensureWorkspace(sessionId: string, scenarioSlug: string) {
  const workspace = getWorkspacePath(sessionId);
  try {
    await fs.access(workspace);
    return workspace;
  } catch {
    const source = path.join(SEED_ROOT, scenarioSlug);
    await copyDir(source, workspace);
    return workspace;
  }
}

async function copyDir(src: string, dest: string) {
  await fs.mkdir(dest, { recursive: true });
  const entries = await fs.readdir(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      await copyDir(srcPath, destPath);
    } else {
      await fs.copyFile(srcPath, destPath);
    }
  }
}

export async function listFiles(root: string) {
  const results: string[] = [];
  async function walk(dir: string) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        await walk(full);
      } else {
        results.push(path.relative(root, full));
      }
    }
  }
  await walk(root);
  return results.sort();
}

export function safePath(root: string, relativePath: string) {
  const resolved = path.resolve(root, relativePath);
  if (!resolved.startsWith(root)) {
    throw new Error("Invalid path");
  }
  return resolved;
}
