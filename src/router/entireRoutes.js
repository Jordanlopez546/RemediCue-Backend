const express = require("express");
const {
  refreshToken,
  loginUser,
  createAccount,
  loginAdminUser,
  createAdminUser,
} = require("../controllers/authentication");
const { CheckAuth } = require("../middleware/CheckAuth");
const router = express.Router();

/*

  AUTHENTICATION ROUTES

*/
router.post("/auth/refresh-token", refreshToken);
router.post("/auth/login-user", loginUser);
router.post("/auth/create-account", createAccount);
router.post("/auth/login-admin-user", loginAdminUser);
router.post("/auth/create-admin-user", createAdminUser);

/*

  USER ROUTES

*/

/*

  ADMIN ROUTES

*/

/*

  MEDICATIONS ROUTES

*/

/*

  CONFIRMATION ROUTES

*/

/*

  REMINDERS ROUTES

*/

module.exports = router;
