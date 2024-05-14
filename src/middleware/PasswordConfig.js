require("dotenv").config();
const crypto = require("crypto");

const SECRET = process.env.SECRET;

const random = () => crypto.randomBytes(128).toString("base64");

const authentication = (salt, password) => {
  return crypto
    .createHmac("sha256", [salt, password].join("/"))
    .update(SECRET)
    .digest("hex");
};

module.exports = { random, authentication };
