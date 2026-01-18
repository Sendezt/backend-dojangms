exports.isAdmin = (req, res, next) => {
  if (!req.user.roles.includes("admin")) {
    return res.status(403).json({
      message: "Akses ditolak, hanya admin",
    });
  }
  next();
};
