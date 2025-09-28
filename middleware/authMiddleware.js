// middleware/authMiddleware.js
const jwt = require("jsonwebtoken");

// Middleware to protect routes
const requireAuth = (req, res, next) => {
  try {
    // Get token from cookies
    const { token } = req.cookies;

    if (!token) {
      return res.status(401).json({ error: "Unauthorized: No token provided" });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach user info to req
    req.user = {
      id: decoded.id,
      email: decoded.email,
      firstName: decoded.firstName,
    };

    next();
  } catch (err) {
    console.error("Auth middleware error:", err);
    return res.status(401).json({ error: "Unauthorized: Invalid token" });
  }
};

module.exports = requireAuth;
