const jwt = require("jsonwebtoken");

require("dotenv").config();

// To generate access token for user
const generateAccessToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_KEY, {
    expiresIn: "1h",
    algorithm: "HS256",
  });
};

// To generate a refresh token for the current user
const generateRefreshToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_REFRESH_KEY, {
    expiresIn: "1y",
    algorithm: "HS256",
  });
};

module.exports = { generateRefreshToken, generateAccessToken };
