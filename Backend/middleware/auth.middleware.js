const jwt = require("jsonwebtoken");

const authenticate = (req, res, next) => {
  try {
    const header = req.headers.authorization;

    if (!header || !header.startsWith("Bearer ")) {
      console.log("No token or invalid format");
      return res.status(401).json({ message: "No or invalid token" });
    }

    const token = header.split(" ")[1];
    console.log("Token received:", token.substring(0, 30) + "...");

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret123");

    // Attach user to request
    req.user = decoded;

    console.log("Token verified successfully");
    console.log("req.user:", req.user);
    console.log("req.user.role:", req.user?.role);

    next();
  } catch (error) {
    console.error("Auth error:", error.message);

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ message: "Invalid token" });
    }

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token expired" });
    }

    return res.status(401).json({ message: "Authentication failed" });
  }
};

module.exports = authenticate;
