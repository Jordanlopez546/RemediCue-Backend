const { random, authentication } = require("../middleware/PasswordConfig");
const Admin = require("../models/Admin");
const User = require("../models/User");
const jwt = require("jsonwebtoken");

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

// A function that refreshes the active access token for the user
const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    jwt.verify(refreshToken, process.env.JWT_REFRESH_KEY, (err, decoded) => {
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
      firstname: user.firstname,
      lastname: user.lastname,
      email: user.email,
      phonenumber: user.phonenumber,
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
      email: newUser.email,
      firstname: newUser.firstname,
      lastname: newUser.lastname,
      phonenumber: newUser.phonenumber,
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
      email: adminUser.email,
      username: adminUser.username,
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
      email: newAdminUser.email,
      username: newAdminUser.username,
    };

    return res.status(201).json(savedAdminUser).end();
  } catch (err) {
    return res
      .status(406)
      .json({ message: "Auth failed.", error: err.message });
  }
};

module.exports = {
  loginUser,
  loginAdminUser,
  refreshToken,
  createAccount,
  createAdminUser,
};
