import express from "express";
import { readFileSync } from "node:fs";

const app = express();
app.use(express.json());

// Static app
app.get("/", (_req, res) => { res.sendFile("index.html", { root: "dist" }); });
app.get("/assets/:file", (_req, res) => { res.sendFile(`assets/${_req.params.file}`, { root: "dist" }); });

app.get("/api/channels", (req, res) => {
  const { page, pagesize: pageSize } = req.query;
  console.info({ page, pageSize });

  const cache = readFileSync(".cache/channels.json", "utf-8");
  try {
    const channels = JSON.parse(cache) as unknown[];
    const start = (Number(page) - 1) * Number(pageSize);
    const end = start + Number(pageSize);
    res.json(channels.slice(start, end));
  }
  catch (err: unknown) {
    console.error("Failed to parse channels.json", err);
    res.status(500).json({ error: "Failed to parse channels.json" });
  }

});

app.listen(3000, () => {
  console.log("Server is running on http://localhost:3000");
});