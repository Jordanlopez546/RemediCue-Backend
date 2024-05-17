const crypto = require("crypto");

require("dotenv").config();

// Customizations
const encryptionMethod = process.env.ENCRYPTION_METHOD;
const key = crypto
  .createHash("sha512")
  .update(process.env.CRYPT_SECRET_KEY, "utf-8")
  .digest("hex")
  .substr(0, 32);

const iv = crypto
  .createHash("sha512")
  .update(process.env.CRYPT_SECRET_IV, "utf-8")
  .digest("hex")
  .substr(0, 16);

// Operations
const encrypt_data = (data) => {
  const encryptor = crypto.createCipheriv(encryptionMethod, key, iv);
  const encrypted =
    encryptor.update(data, "utf8", "base64") + encryptor.final("base64");
  return Buffer.from(encrypted).toString("base64");
};

const decrypt_data = (enc_data) => {
  const buff = Buffer.from(enc_data, "base64");
  enc_data = buff.toString("utf-8");
  const decryptor = crypto.createDecipheriv(encryptionMethod, key, iv);
  return decryptor.update(enc_data, "base64", "utf8") + decryptor.final("utf8");
};

module.exports = { encrypt_data, decrypt_data };
