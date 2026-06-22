const jwt = require("jsonwebtoken");

// Xác thực token – dùng cho mọi route cần login
function verifyToken(req, res, next) {
  const header = req.headers["authorization"];
  const token = header && header.split(" ")[1]; // "Bearer <token>"

  if (!token) return res.status(401).json({ message: "Chưa đăng nhập" });

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ message: "Token không hợp lệ hoặc hết hạn" });
  }
}

module.exports = { verifyToken };
