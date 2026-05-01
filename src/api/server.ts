import express from "express";

const app = express();
app.use(express.json());

// Static app
app.get("/", (_req, res) => { res.sendFile("index.html", { root: "dist" }); });
app.get("/assets/:file", (_req, res) => { res.sendFile(`assets/${_req.params.file}`, { root: "dist" }); });


app.listen(3000, () => {
  console.log("Server is running on http://localhost:3000");
});