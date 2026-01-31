const bcrypt = require("bcryptjs");
const User = require("../models/user.model");
const { generateToken } = require("../utils/jwt");

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Basic validation
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Generate JWT
    const token = generateToken({
      userId: user._id,
      email: user.email,
      role: user.role
    });

    return res.status(200).json({
      token,
      user: {
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

const logout = async (req, res) => {
  // Stateless JWT — frontend handles token removal
  return res.status(200).json({ message: "Logged out successfully" });
};

const changePassword = async (req, res) => {
  try {
    const { targetEmail, newPassword } = req.body;

    if (!targetEmail || !newPassword) {
      return res.status(400).json({ message: "targetEmail and newPassword are required" });
    }

    // Only SUPERADMIN allowed (extra safety even though middleware checks)
    if (req.user.role !== "SUPERADMIN") {
      return res.status(403).json({ message: "Only superadmin can change passwords" });
    }

    const user = await User.findOne({ email: targetEmail });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    user.password = hashedPassword;
    await user.save();

    return res.status(200).json({
      message: `Password updated successfully for ${user.email}`
    });
  } catch (error) {
    console.error("Change password error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};


module.exports = {
  login,
  logout,
  changePassword
};

