const authMiddleware = require("./authMiddleware");

module.exports = function (req, res, next) {
  authMiddleware(req, res, () => {
    if (req.user.role !== "admin") {
      return res.status(401).json({ message: "Unauthorized" });
    }
    next();
  });
};
