const { encrypt_data, decrypt_data } = require("../middleware/Crypts");
const { random, authentication } = require("../middleware/PasswordConfig");
const {
  generateAccessToken,
  generateRefreshToken,
} = require("../middleware/TokenGen");
const Admin = require("../models/Admin");
const User = require("../models/User");
const jwt = require("jsonwebtoken");

require("dotenv").config();

// A function that refreshes the active access token for the user
const refreshToken = async (req, res) => {
  try {
    const { refresh_token } = req.body;

    jwt.verify(refresh_token, process.env.JWT_REFRESH_KEY, (err, decoded) => {
      if (err) return res.status(403).json({ error: "Invalid refresh token." });

      const accessToken = generateAccessToken(decoded.userId);

      return res.status(200).json({ accessToken });
    });
  } catch (err) {
    return res.status(500).json({
      message: "Internal server error.",
      error: err.message,
    });
  }
};

// To log in a normal user
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Invalid inputs.",
      });
    }

    const user = await User.findOne({ email }).select(
      "+authentication.salt +authentication.password"
    );

    if (!user) {
      return res.status(409).json({
        message: "Invalid credentials.",
      });
    }

    const expectedHash = authentication(user.authentication.salt, password);

    if (user.authentication.password !== expectedHash) {
      return res.status(409).json({
        message: "Invalid credentials.",
      });
    }

    const accessToken = generateAccessToken(user._id.toString());
    const refreshToken = generateRefreshToken(user._id.toString());

    user.authentication.sessionToken = refreshToken;
    await user.save();

    const userObject = {
      _id: user._id,
      firstname: encrypt_data(user.firstname),
      lastname: encrypt_data(user.lastname),
      email: encrypt_data(user.email),
      phonenumber: encrypt_data(user.phonenumber),
      isBanned: user.isBanned,
    };

    return res
      .status(200)
      .json({
        message: "Auth sucessful.",
        user: userObject,
        accessToken,
        refreshToken,
      })
      .end();
  } catch (error) {
    return res.status(406).json({
      message: "Auth failed.",
      error: error.message,
    });
  }
};

// To create a normal user's account
const createAccount = async (req, res) => {
  try {
    const { firstname, lastname, email, password, phonenumber } = req.body;

    if (!firstname || !lastname || !email || !password || !phonenumber) {
      return res.status(400).json({
        message: "Invalid inputs.",
      });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(409).json({ message: "User already exists." });
    }

    const salt = random();
    const user = await User.create({
      firstname,
      lastname,
      email,
      authentication: {
        salt,
        password: authentication(salt, password),
      },
      phonenumber,
    });

    const newUser = await user.save();

    if (!newUser) {
      return res.status(403).json({
        message: "User wasn't created.",
      });
    }

    const savedUser = {
      _id: newUser._id,
      email: encrypt_data(newUser.email),
      firstname: encrypt_data(newUser.firstname),
      lastname: encrypt_data(newUser.lastname),
      phonenumber: encrypt_data(newUser.phonenumber),
      isBanned: newUser.isBanned,
    };

    return res.status(201).json(savedUser).end();
  } catch (err) {
    return res.status(406).json({
      message: "Auth failed.",
      error: err.message,
    });
  }
};

// To log in admin user
const loginAdminUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Invalid inputs." });
    }

    const adminUser = await Admin.findOne({ email }).select(
      "+authentication.salt +authentication.password"
    );

    if (!adminUser) {
      return res.status(409).json({
        message: "Invalid credentials.",
      });
    }

    const expectedHash = authentication(
      adminUser.authentication.salt,
      password
    );

    if (adminUser.authentication.password !== expectedHash) {
      return res.status(409).json({
        message: "Invalid credentials",
      });
    }

    const accessToken = generateAccessToken(adminUser._id.toString());
    const refreshToken = generateRefreshToken(adminUser._id.toString());

    adminUser.authentication.sessionToken = refreshToken;
    await adminUser.save();

    const adminUserObject = {
      _id: adminUser._id,
      email: encrypt_data(adminUser.email),
      username: encrypt_data(adminUser.username),
    };

    return res
      .status(200)
      .json({
        message: "Auth successful.",
        adminUser: adminUserObject,
        accessToken,
        refreshToken,
      })
      .end();
  } catch (err) {
    return res.status(406).json({
      message: "Auth failed.",
      error: err.message,
    });
  }
};

// To create admin user's account
const createAdminUser = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: "Invalid inputs." });
    }

    const existingAdminUser = await Admin.findOne({ email });

    if (existingAdminUser) {
      return res.status(409).json({ message: "Admin already exists." });
    }

    const salt = random();
    const adminUser = await Admin.create({
      username,
      email,
      authentication: {
        salt,
        password: authentication(salt, password),
      },
    });

    const newAdminUser = await adminUser.save();

    if (!newAdminUser) {
      return res.status(403).json({ message: "Admin user wasn't created." });
    }

    const savedAdminUser = {
      _id: newAdminUser._id,
      email: encrypt_data(newAdminUser.email),
      username: encrypt_data(newAdminUser.username),
    };

    return res.status(201).json(savedAdminUser).end();
  } catch (err) {
    return res
      .status(406)
      .json({ message: "Auth failed.", error: err.message });
  }
};

// To ban a user
const banUser = async (req, res) => {
  try {
    const userId = req.params.userId;

    const userExist = await User.findById(userId);

    if (!userExist) {
      return res.status(404).json({ message: "User not found." });
    }

    if (userExist.isBanned) {
      return res.status(400).json({ message: "User is already banned." });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { isBanned: true },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(400).json({ message: "User not banned." });
    }

    const user = {
      _id: updatedUser._id,
      email: encrypt_data(updatedUser.email),
      firstname: encrypt_data(updatedUser.firstname),
      lastname: encrypt_data(updatedUser.lastname),
      phonenumber: encrypt_data(updatedUser.phonenumber),
      isBanned: updatedUser.isBanned,
    };

    return res
      .status(200)
      .json({ message: "User banned successfully.", user: user });
  } catch (err) {
    return res
      .status(500)
      .json({ message: "Error occured.", error: err.message });
  }
};

// To delete a user
const deleteUser = async (req, res) => {
  try {
    const userId = req.params.userId;

    const userExist = await User.findById(userId);

    if (!userExist) {
      return res.status(404).json({ message: "User not found" });
    }

    const deleteTheUser = await User.findByIdAndDelete(userId);

    if (!deleteTheUser) {
      return res.status(400).json({ message: "Not successful." });
    }

    return res.status(200).json({ message: "Deleted the user successfully." });
  } catch (err) {
    return res
      .status(500)
      .json({ message: "Error occured.", error: err.message });
  }
};

// To delete an admin user
const deleteAdminUser = async (req, res) => {
  try {
    const adminId = req.params.adminId;

    const adminExist = await Admin.findById(adminId);

    if (!adminExist) {
      return res.status(404).json({ message: "Admin User not found" });
    }

    const deleteTheAdmin = await Admin.findByIdAndDelete(adminId);

    if (!deleteTheAdmin) {
      return res.status(400).json({ message: "Not successful." });
    }

    return res.status(200).json({ message: "Deleted the admin successfully." });
  } catch (err) {
    return res
      .status(500)
      .json({ message: "Error occured.", error: err.message });
  }
};

// To edit user details
const editUserDetails = async (req, res) => {
  try {
    const userId = req.params.userId;

    const { firstname, lastname, email, phonenumber } = req.body;

    if (!firstname || !lastname || !email || !phonenumber) {
      return res.status(400).json({
        message: "Invalid inputs.",
      });
    }

    const existingUser = await User.findById(userId);

    if (!existingUser) {
      return res.status(409).json({ message: "User does not exists." });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        firstname: firstname,
        lastname: lastname,
        email: email,
        phonenumber: phonenumber,
      },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(400).json({ message: "User details not updated." });
    }

    const user = {
      _id: updatedUser._id,
      email: encrypt_data(updatedUser.email),
      firstname: encrypt_data(updatedUser.firstname),
      lastname: encrypt_data(updatedUser.lastname),
      phonenumber: encrypt_data(updatedUser.phonenumber),
      isBanned: updatedUser.isBanned,
    };

    return res.status(200).json({ message: "User updated.", user: user });
  } catch (err) {
    return res
      .status(500)
      .json({ message: "Error occured.", error: err.message });
  }
};

// To edit admin user details
const editAdminUserDetails = async (req, res) => {
  try {
    const adminId = req.params.adminId;

    const { email, username } = req.body;

    if (!email || !username) {
      return res.status(400).json({
        message: "Invalid inputs.",
      });
    }

    const existingAdminUser = await Admin.findById(adminId);

    if (!existingAdminUser) {
      return res.status(409).json({ message: "Admin User does not exists." });
    }

    const updatedAdminUser = await Admin.findByIdAndUpdate(
      adminId,
      {
        username: username,
        email: email,
      },
      { new: true }
    );

    if (!updatedAdminUser) {
      return res
        .status(400)
        .json({ message: "Admin User details not updated." });
    }

    const adminUser = {
      _id: updatedAdminUser._id,
      username: encrypt_data(updatedAdminUser.username),
      email: encrypt_data(updatedAdminUser.email),
    };

    return res
      .status(200)
      .json({ message: "Admin User updated.", adminUser: adminUser });
  } catch (err) {
    return res
      .status(500)
      .json({ message: "Error occured.", error: err.message });
  }
};

// Get all users
const getUsers = async (req, res) => {
  try {
    const getAllUsers = await User.find();

    if (getAllUsers.length <= 0) {
      return res.status(404).json({
        message: "No users found.",
      });
    }

    const users = getAllUsers.map((user) => {
      const { _id, firstname, lastname, email, phonenumber, isBanned } = user;

      return {
        _id: _id,
        email: encrypt_data(email),
        firstname: encrypt_data(firstname),
        lastname: encrypt_data(lastname),
        phonenumber: encrypt_data(phonenumber),
        isBanned: isBanned,
      };
    });

    return res.status(200).json(users);
  } catch (err) {
    return res
      .status(500)
      .json({ message: "Error occured.", error: err.message });
  }
};

// Get all admin users
const getAdminUsers = async (req, res) => {
  try {
    const getAllAdminUsers = await Admin.find();

    if (getAllAdminUsers.length <= 0) {
      return res.status(404).json({
        message: "No admin users found.",
      });
    }

    const adminUsers = getAllAdminUsers.map((admin) => {
      const { _id, email, username } = admin;

      return {
        _id: _id,
        email: encrypt_data(email),
        username: encrypt_data(username),
      };
    });

    return res.status(200).json(adminUsers);
  } catch (err) {
    return res
      .status(500)
      .json({ message: "Error occured.", error: err.message });
  }
};

module.exports = {
  loginUser,
  loginAdminUser,
  refreshToken,
  createAccount,
  createAdminUser,
  banUser,
  editUserDetails,
  deleteUser,
  getAdminUsers,
  getUsers,
  editAdminUserDetails,
  deleteAdminUser,
};
