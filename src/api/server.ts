import { prisma } from "@/api/lib/prisma";
import express from "express";

const app = express();
app.use(express.json());

// Static app
app.get("/", (_req, res) => { res.sendFile("index.html", { root: "dist" }); });
app.get("/assets/:file", (_req, res) => { res.sendFile(`assets/${_req.params.file}`, { root: "dist" }); });

app.get("/api/channels", async (req, res) => {
  const { page, pagesize: pageSize } = req.query;

  if (
    typeof page !== "string"
    || isNaN(Number(page)) || Number(page) < 1
    || typeof pageSize !== "string"
    || isNaN(Number(pageSize)) || Number(pageSize) < 1
  ) {
    res.status(400).json({ error: "Missing or invalid 'page' or 'pagesize' query parameters." });
    return;
  }

  const skip = (Number(page) - 1) * Number(pageSize);
  const take = Number(pageSize);

  if (isNaN(skip) || isNaN(take) || skip < 0 || take < 1) {
    res.status(400).json({ error: "Invalid 'page' or 'pagesize' query parameters." });
    return;
  }

  const total = await prisma.channel.count();
  const allIds = await prisma.channel.findMany({ select: { id: true } }).then(channels => channels.map(c => c.id));
  const takeChannels = await prisma.channel.findMany({ skip, take });

  const progress = skip + take >= total ? 1 : (skip / total);

  if (!Number.isFinite(progress) || progress < 0 || progress > 1) {
    res.status(500).json({ error: "Failed to calculate progress." });
    return;
  }

  res.json({
    channels: takeChannels,
    progress,
    total,
    allIds,
  });
});

app.listen(3000, () => {
  console.log("Server is running on http://localhost:3000");
});