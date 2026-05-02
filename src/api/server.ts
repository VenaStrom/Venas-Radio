import { prisma } from "@/api/lib/prisma";
import express from "express";

const app = express();
app.use(express.json());

// Static app
app.get("/", (_req, res) => { res.sendFile("index.html", { root: "dist" }); });
app.get("/assets/:file", (_req, res) => { res.sendFile(`assets/${_req.params.file}`, { root: "dist" }); });

app.get("/api/channels", (req, res) => {
  const { page, pagesize: pageSize } = req.query;

  prisma.channel.findMany({
    skip: Number(page) * Number(pageSize),
    take: Number(pageSize),
  })
    .then((channels) => {
      res.json({ channels });
    })
    .catch((err: unknown) => {
      console.error({ err });
      res.status(500).json({ error: "An error occurred while fetching channels." });
    });
});

app.listen(3000, () => {
  console.log("Server is running on http://localhost:3000");
});