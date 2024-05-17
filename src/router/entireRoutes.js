const express = require("express");
const {
  refreshToken,
  loginUser,
  createAccount,
  loginAdminUser,
  createAdminUser,
  banUser,
  deleteUser,
  editUserDetails,
  deleteAdminUser,
  editAdminUserDetails,
  getUsers,
  getAdminUsers,
} = require("../controllers/authentication");
const { CheckAuth } = require("../middleware/CheckAuth");
const router = express.Router();

/*

  AUTHENTICATION ROUTES

*/
router.post("/auth/refresh-token", CheckAuth, refreshToken);
router.post("/auth/login-user", loginUser);
router.post("/auth/create-account", createAccount);
router.post("/auth/login-admin-user", loginAdminUser);
router.post("/auth/create-admin-user", createAdminUser);
router.patch("/auth/ban-user/:userId", CheckAuth, banUser);
router.delete("/auth/delete-user/:userId", CheckAuth, deleteUser);
router.patch("/auth/edit-user-details/:userId", CheckAuth, editUserDetails);
router.delete("/auth/delete-admin-user/:adminId", CheckAuth, deleteAdminUser);
router.patch(
  "/auth/edit-admin-user-details/:adminId",
  CheckAuth,
  editAdminUserDetails
);
router.get("/auth/get-all-users", CheckAuth, getUsers);
router.get("/auth/get-admin-users", CheckAuth, getAdminUsers);
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
