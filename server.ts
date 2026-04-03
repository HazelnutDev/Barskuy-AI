import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import ngrok from "ngrok";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API to proxy search requests
  app.post("/api/search", async (req, res) => {
    const { query, provider, apiKey } = req.body;
    if (!query || !provider || !apiKey) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    if (provider === "serpapi") {
      try {
        const response = await fetch(`https://serpapi.com/search.json?q=${encodeURIComponent(query)}&api_key=${apiKey}`);
        const data = await response.json();
        res.json(data);
      } catch (error) {
        console.error("SerpApi proxy error:", error);
        res.status(500).json({ error: "Failed to fetch from SerpApi" });
      }
    } else {
      res.status(400).json({ error: "Unsupported search provider" });
    }
  });

  // API to save .env
  app.post("/api/save-env", (req, res) => {
    const { keys } = req.body;
    if (!keys || typeof keys !== "object") {
      return res.status(400).json({ error: "Invalid keys" });
    }

    try {
      let envContent = "";
      if (fs.existsSync(".env")) {
        envContent = fs.readFileSync(".env", "utf-8");
      }

      const envLines = envContent.split("\n");
      const keyMap: Record<string, string> = {};

      // Parse existing .env
      envLines.forEach(line => {
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
          keyMap[match[1].trim()] = match[2].trim();
        }
      });

      // Update with new keys
      Object.entries(keys).forEach(([key, value]) => {
        keyMap[key] = String(value);
      });

      // Reconstruct .env content
      const newEnvContent = Object.entries(keyMap)
        .map(([key, value]) => `${key}=${value}`)
        .join("\n");

      fs.writeFileSync(".env", newEnvContent);
      res.json({ success: true });
    } catch (error) {
      console.error("Error saving .env:", error);
      res.status(500).json({ error: "Failed to save .env" });
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
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", async () => {
    console.log(`Server running on http://localhost:${PORT}`);
    
    // Ngrok integration
    const authtoken = process.env.NGROK_AUTHTOKEN;
    const domain = process.env.NGROK_DOMAIN || 'asp-clear-perfectly.ngrok-free.app';

    if (authtoken) {
      try {
        const url = await ngrok.connect({
          addr: PORT,
          authtoken: authtoken,
          domain: domain,
        });
        console.log(`  ➜  Ngrok:   \x1b[36m${url}\x1b[0m`);
      } catch (ngrokError: any) {
        console.error('\n  ❌ Gagal menjalankan Ngrok:', ngrokError.message);
      }
    } else {
      console.warn('\n  ⚠️  NGROK_AUTHTOKEN tidak ditemukan di .env. Ngrok tidak akan dijalankan.');
    }
  });
}

startServer();
