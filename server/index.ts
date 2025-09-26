import express from "express";
import { createServer } from "http";
import { setupVite } from "./vite";

const app = express();
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

async function start() {
  const PORT = 5001;
  const server = createServer(app);
  
  await setupVite(app, server);
  
  server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

start();