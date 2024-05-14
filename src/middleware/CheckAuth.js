const jwt = require("jsonwebtoken");

require("dotenv").config();

const CheckAuth = (req, res, next) => {
  try {
    const accessToken = req.headers.authorization?.split(" ")[1];

    if (!accessToken) {
      return res.status(401).json({
        message: "Unauthorized: Token not provided.",
      });
    }

    const decoded = jwt.verify(accessToken, process.env.JWT_KEY);

    req.userData = decoded;

    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({
        message: "Unauthorized: Token expired.",
      });
    }

    if (err.name === "JsonWebTokenError") {
      return res.status(401).json({
        message: "Unauthorized: Invalid token.",
      });
    }

    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

module.exports = { CheckAuth };
