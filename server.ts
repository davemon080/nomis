import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Paths
  const UPLOADS_DIR = path.join(process.cwd(), "public", "uploads");
  const DIST_UPLOADS_DIR = path.join(process.cwd(), "dist", "uploads");

  // Ensure uploads directories exist
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }

  // Raw body parser for binary video/image uploads up to 100MB
  app.post("/api/upload", express.raw({ type: ["video/*", "image/*"], limit: "100mb" }), (req, res) => {
    try {
      const contentType = req.headers["content-type"] || "video/mp4";
      const extension = req.headers["x-file-extension"] || contentType.split("/")[1] || "mp4";
      const filename = `${Date.now()}-${Math.random().toString(36).substring(2, 11)}.${extension}`;
      const filepath = path.join(UPLOADS_DIR, filename);

      fs.writeFile(filepath, req.body, (err) => {
        if (err) {
          console.error("Error writing upload file:", err);
          return res.status(500).json({ error: "Failed to save uploaded video file" });
        }

        // In production, sync to dist/uploads as well to make sure it's served
        if (process.env.NODE_ENV === "production") {
          if (!fs.existsSync(DIST_UPLOADS_DIR)) {
            fs.mkdirSync(DIST_UPLOADS_DIR, { recursive: true });
          }
          fs.writeFileSync(path.join(DIST_UPLOADS_DIR, filename), req.body);
        }

        console.log(`Successfully uploaded video: ${filename} (${req.body.length} bytes)`);
        res.json({ url: `/uploads/${filename}` });
      });
    } catch (err) {
      console.error("Upload handler error:", err);
      res.status(500).json({ error: "Internal server error during upload" });
    }
  });

  // Delete uploaded video files
  app.delete("/api/uploads", (req, res) => {
    try {
      const urlQuery = req.query.url as string;
      if (!urlQuery) {
        return res.status(400).json({ error: "URL query parameter is required" });
      }

      // Safeguard path traversal
      const filename = path.basename(urlQuery);
      if (!filename || filename.includes("..") || filename.includes("/") || filename.includes("\\")) {
        return res.status(400).json({ error: "Invalid filename" });
      }

      const filepath = path.join(UPLOADS_DIR, filename);
      const distFilepath = path.join(DIST_UPLOADS_DIR, filename);
      let deleted = false;

      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
        deleted = true;
      }
      if (fs.existsSync(distFilepath)) {
        fs.unlinkSync(distFilepath);
        deleted = true;
      }

      if (deleted) {
        console.log(`Deleted video file from server: ${filename}`);
        res.json({ success: true, message: "File deleted successfully" });
      } else {
        res.status(404).json({ error: "File not found" });
      }
    } catch (err) {
      console.error("Delete file handler error:", err);
      res.status(500).json({ error: "Failed to delete file" });
    }
  });

  // Serve uploads statically
  app.use("/uploads", express.static(UPLOADS_DIR));
  if (process.env.NODE_ENV === "production") {
    app.use("/uploads", express.static(DIST_UPLOADS_DIR));
  }

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

startServer();
