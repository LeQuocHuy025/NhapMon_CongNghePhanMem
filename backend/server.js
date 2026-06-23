require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();
const path = require("path");
// ── Middleware toàn cục ─────────────────────────────
// helmet disabled for development (allow external CDN)
app.use(
  cors({
    origin: "*", // production: thay bằng domain frontend
    methods: ["GET", "POST", "PUT", "DELETE"],
  }),
);

app.use(express.json());

// ── Routes ──────────────────────────────────────────
app.use("/api/auth", require("./src/routes/auth"));
app.use("/api/cuocthi", require("./src/routes/cuocthi"));
app.use("/api/dangky", require("./src/routes/dangky"));
app.use("/api/ketqua", require("./src/routes/ketqua"));
app.use("/api/sinhvien", require("./src/routes/sinhvien"));
app.use("/api/taikhoan", require("./src/routes/taikhoan"));
app.use("/api/phanquyen", require("./src/routes/phanquyen"));
app.use("/api/nhatky", require("./src/routes/nhatky"));
app.use("/api/dashboard", require("./src/routes/dashboard"));
app.use("/api/giangvien", require("./src/routes/giangvien"));
app.use("/api/baocao", require("./src/routes/baocao"));
app.use("/api/khoa", require("./src/routes/khoa"));
app.use(express.static(path.join(__dirname, "../frontend")));
// ── Global error handler ────────────────────────────
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: "Lỗi máy chủ nội bộ" });
});

// ── Khởi động server ────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server chạy tại http://localhost:${PORT}`);
});
