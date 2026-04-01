import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs/promises";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import { exec, spawn } from "child_process";
import { promisify } from "util";
import OpenAI from "openai";

const execAsync = promisify(exec);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API: List files in the project
  app.get("/api/files", async (req, res) => {
    try {
      const root = process.cwd();
      const files = await getFiles(root);
      res.json(files);
    } catch (error) {
      res.status(500).json({ error: "Failed to list files" });
    }
  });

  // API: Read a file
  app.get("/api/file", async (req, res) => {
    const filePath = req.query.path as string;
    if (!filePath) return res.status(400).json({ error: "Path required" });
    try {
      const absolutePath = path.resolve(process.cwd(), filePath);
      if (!absolutePath.startsWith(process.cwd())) {
        return res.status(403).json({ error: "Access denied" });
      }
      const content = await fs.readFile(absolutePath, "utf-8");
      res.json({ content });
    } catch (error) {
      res.status(500).json({ error: "Failed to read file" });
    }
  });

  // API: Write a file
  app.post("/api/file", async (req, res) => {
    const { path: filePath, content } = req.body;
    if (!filePath || content === undefined) return res.status(400).json({ error: "Path and content required" });
    try {
      const absolutePath = path.resolve(process.cwd(), filePath);
      if (!absolutePath.startsWith(process.cwd())) {
        return res.status(403).json({ error: "Access denied" });
      }
      // Ensure directory exists
      await fs.mkdir(path.dirname(absolutePath), { recursive: true });
      await fs.writeFile(absolutePath, content, "utf-8");
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to write file" });
    }
  });

  // API: Search files (grep)
  app.get("/api/search", async (req, res) => {
    const query = req.query.q as string;
    if (!query) return res.status(400).json({ error: "Query required" });
    try {
      // Simple grep implementation
      const { stdout } = await execAsync(`grep -rIn "${query.replace(/"/g, '\\"')}" . --exclude-dir={node_modules,.git,dist}`);
      res.json({ results: stdout });
    } catch (error: any) {
      // grep returns 1 if no matches found
      if (error.code === 1) return res.json({ results: "" });
      res.status(500).json({ error: "Search failed" });
    }
  });

  // API: List documentation files
  app.get("/api/docs", async (req, res) => {
    try {
      const docsDir = path.join(process.cwd(), "docs");
      const entries = await fs.readdir(docsDir, { withFileTypes: true });
      const docs = entries
        .filter(e => e.isFile() && e.name.endsWith(".md"))
        .map(e => ({ name: e.name, path: path.join("docs", e.name) }));
      res.json(docs);
    } catch (error) {
      res.json([]);
    }
  });

  // API: Ollama Pull Model
  app.post("/api/ollama/pull", async (req, res) => {
    const { model } = req.body;
    if (!model) return res.status(400).json({ error: "Model name required" });
    
    try {
      // Use spawn to see progress if we wanted to stream, but for now just exec
      const { stdout } = await execAsync(`ollama pull ${model}`);
      res.json({ success: true, output: stdout });
    } catch (error: any) {
      res.status(500).json({ error: "Failed to pull model", details: error.message });
    }
  });

  // API: Ollama List Models
  app.get("/api/ollama/models", async (req, res) => {
    try {
      const response = await fetch("http://localhost:11434/api/tags");
      if (!response.ok) throw new Error("Ollama not reachable");
      const data = await response.json();
      res.json(data.models || []);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to fetch Ollama models", details: error.message });
    }
  });

  // API: OpenAI Proxy
  app.post("/api/chat/openai", async (req, res) => {
    const { apiKey, model, messages } = req.body;
    if (!apiKey || !model || !messages) return res.status(400).json({ error: "Missing required fields" });

    const openai = new OpenAI({ apiKey });
    try {
      const response = await openai.chat.completions.create({
        model,
        messages,
      });
      res.json(response);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // API: DeepSeek Proxy (OpenAI compatible)
  app.post("/api/chat/deepseek", async (req, res) => {
    const { apiKey, model, messages } = req.body;
    if (!apiKey || !model || !messages) return res.status(400).json({ error: "Missing required fields" });

    const openai = new OpenAI({ 
      apiKey,
      baseURL: "https://api.deepseek.com"
    });
    try {
      const response = await openai.chat.completions.create({
        model,
        messages,
      });
      res.json(response);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Proxy for local LLMs (optional, but useful if client hits CORS)
  app.post("/api/local-llm", async (req, res) => {
    const { url, body } = req.body;
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: "Local LLM request failed" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

async function getFiles(dir: string, baseDir: string = dir): Promise<any[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const fullPath = path.join(dir, entry.name);
      const relativePath = path.relative(baseDir, fullPath);
      
      if (entry.name === "node_modules" || entry.name === ".git" || entry.name === "dist") {
        return null;
      }

      if (entry.isDirectory()) {
        return {
          name: entry.name,
          path: relativePath,
          type: "directory",
          children: await getFiles(fullPath, baseDir),
        };
      }
      return {
        name: entry.name,
        path: relativePath,
        type: "file",
      };
    })
  );
  return files.filter(Boolean);
}

startServer();
