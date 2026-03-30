/**
 * Hocuspocus Collaboration Server
 *
 * Run: npx tsx server/collaboration.ts
 *
 * This provides real-time collaborative editing via WebSocket.
 * Room name = session publicToken
 * Each file in the workspace maps to a Y.Text: ydoc.getText(`file:${filePath}`)
 */

import { Server } from "@hocuspocus/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const PORT = Number(process.env.PORT || process.env.COLLAB_PORT) || 3002;

const server = new Server({
  port: PORT,

  async onAuthenticate({ token, documentName }) {
    const session = await prisma.interviewSession.findUnique({
      where: { publicToken: documentName },
    });

    if (!session) throw new Error("Session not found");
    if (session.status === "cancelled") throw new Error("Session cancelled");

    return {
      user: {
        token,
        sessionId: session.id,
        sessionStatus: session.status,
      },
    };
  },

  async onLoadDocument({ document, documentName }) {
    const session = await prisma.interviewSession.findUnique({
      where: { publicToken: documentName },
      include: { scenario: true },
    });

    if (!session) return;

    const metaText = document.getText("__meta__");
    if (metaText.toString().length > 0) return;

    const workspacePath = `workspaces/${session.id}`;
    try {
      const fs = await import("fs");
      const path = await import("path");

      function loadDir(dirPath: string, prefix: string) {
        if (!fs.existsSync(dirPath)) return;
        const entries = fs.readdirSync(dirPath, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = path.join(dirPath, entry.name);
          const relativePath = prefix ? `${prefix}/${entry.name}` : entry.name;
          if (entry.isDirectory()) {
            if (entry.name === "node_modules" || entry.name === ".git") continue;
            loadDir(fullPath, relativePath);
          } else {
            try {
              const content = fs.readFileSync(fullPath, "utf-8");
              const ytext = document.getText(`file:${relativePath}`);
              ytext.insert(0, content);
            } catch {
              // Skip binary files
            }
          }
        }
      }

      loadDir(workspacePath, "");
      metaText.insert(0, JSON.stringify({ initialized: true, sessionId: session.id }));
    } catch (err) {
      console.error("Failed to load workspace files:", err);
    }
  },

  async onStoreDocument({ document, documentName }) {
    const session = await prisma.interviewSession.findUnique({
      where: { publicToken: documentName },
    });

    if (!session) return;

    const workspacePath = `workspaces/${session.id}`;
    const fs = await import("fs");
    const path = await import("path");

    const state = document.toJSON();
    for (const [key, value] of Object.entries(state)) {
      if (!key.startsWith("file:")) continue;
      const filePath = key.slice(5);
      const fullPath = path.join(workspacePath, filePath);

      try {
        const dir = path.dirname(fullPath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(fullPath, String(value), "utf-8");
      } catch (err) {
        console.error(`Failed to persist ${filePath}:`, err);
      }
    }
  },

  async onDisconnect({ documentName, context }) {
    const user = context as any;
    if (user?.user?.sessionId) {
      await prisma.event.create({
        data: {
          sessionId: user.user.sessionId,
          type: "COLLAB_DISCONNECT",
          payload: { time: new Date().toISOString() },
        },
      });
    }
  },
});

server.listen().then(() => {
  console.log(`Collaboration server running on port ${PORT}`);
});
