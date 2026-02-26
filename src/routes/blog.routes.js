const express = require("express");
const { createBlog, getPublishedBlogs, getDraftBlogs, updateBlog, deleteBlog, getBlogBySlug, getBlogById, publishBlog } = require("../controllers/blog.controller");
const { authMiddleware, authorize } = require("../middlewares/auth.middleware");
const { upload } = require("../middlewares/multer.middleware");

const router = express.Router();

// All routes here are already prefixed with /blogs in app.js

/**
 * @desc    Create a new blog post
 * @route   POST /blog/add
 * @access  Private (ADMIN, SUPERADMIN)
 */
router.post(
    "/blog/add",
    authMiddleware,
    upload.single("image"),
    createBlog
);

/**
 * @desc    Get all published blogs
 * @route   GET /blogs/published
 * @access  Public
 */
router.get("/blogs/published", getPublishedBlogs);

/**
 * @desc    Get all draft blogs
 * @route   GET /blogs/drafts
 * @access  Private (Admin)
 */
router.get("/blogs/drafts", authMiddleware, getDraftBlogs);


/**
 * @desc    Delete blog by ID
 * @route   DELETE /blog/:id
 * @access  Private
 */
router.delete(
    "/blog/delete/:id",
    authMiddleware,
    deleteBlog
);

/**
 * @desc    Get single blog by slug
 * @route   GET /blog/:slug
 * @access  Public
 */
router.get("/blog/:slug", getBlogBySlug);

/**
 * @desc    Partially update a blog by ID
 * @route   PATCH blog/update/:id
 * @access  Private (Admin)
 */
router.patch(
    "/blog/update/:id",
    authMiddleware,
    upload.single("image"), // optional
    updateBlog
);


/**
 * @desc    Partially update a blog by ID
 * @route   PATCH blogID/:id
 * @access  Private (Admin)
 */
router.get("/blogID/:id", getBlogById)


router.get("/publishByID/:id", authMiddleware, publishBlog)

module.exports = router;
