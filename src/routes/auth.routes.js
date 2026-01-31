const express = require("express");
const router = express.Router();

const { login, logout, changePassword } = require("../controllers/auth.controller");
const {
    authMiddleware,
    authorize
} = require("../middlewares/auth.middleware");

router.post("/login", login);
router.post("/logout", authMiddleware, logout);

// SUPERADMIN ONLY
router.post(
    "/change-password",
    authMiddleware,
    authorize("SUPERADMIN"),
    changePassword
);

module.exports = router;
