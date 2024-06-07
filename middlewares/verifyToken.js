const jwt = require("jsonwebtoken");
require("dotenv").config();
function verifyToken(req, res, next) {
  const authToken = req.headers.authorization;
  if (authToken) {
    const token = authToken.split(" ")[1];
    try {
      const decodedPayload = jwt.verify(token, process.env.SECRET);
      req.user = decodedPayload;
      next();
    } catch (error) {
      return res.status(401).json({ message: "Invalide token, access denied" });
    }
  } else {
    return res.status(401).json({ message: "No token privded, access denied" });
  }
}
function verifyTokenAndAdmin(req, res, next) {
  verifyToken(req, res, () => {
    if (req.user.role === 1) {
      next();
    } else {
      return res.status(403).json({ message: "Not allowed, Only for admin" });
    }
  });
}
function verifyTokenAndAdminAndManager(req, res, next) {
  verifyToken(req, res, () => {
    if (req.user.role === 2 || req.user.role === 1) {
      next();
    } else {
      return res.status(403).json({ message: "Not allowed, Only for manager" });
    }
  });
}
function verifyTokenAndOnlyUser(req, res, next) {
  verifyToken(req, res, () => {
    if (req.user.id === req.params.id) {
      next();
    } else {
      return res
        .status(403)
        .json({ message: "Not allowed, Only for user himself" });
    }
  });
}
function verifyTokenAndAuthorization(req, res, next) {
  verifyToken(req, res, () => {
    if (req.user.id === req.params.id || req.user.role === 1) {
      next();
    } else {
      return res
        .status(403)
        .json({ message: "Not allowed, Only for user himself or admin " });
    }
  });
}
module.exports = {
  verifyToken,
  verifyTokenAndAdmin,
  verifyTokenAndAdminAndManager,
  verifyTokenAndOnlyUser,
  verifyTokenAndAuthorization,
};
