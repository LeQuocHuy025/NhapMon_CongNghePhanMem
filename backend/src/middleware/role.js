// Tạo middleware kiểm tra role linh hoạt
// Dùng: router.get('/...', verifyToken, requireRole('admin','cb'), handler)
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: "Chưa xác thực" });

    if (!allowedRoles.includes(req.user.role))
      return res.status(403).json({ message: "Không có quyền thực hiện" });

    next();
  };
}

module.exports = { requireRole };
