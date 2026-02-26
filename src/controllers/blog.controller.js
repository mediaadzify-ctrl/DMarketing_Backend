const Blog = require("../models/blog.model");
const { asyncHandler } = require("../utils/asyncHandler");
const { ApiError } = require("../utils/ApiError");
const { ApiResponse } = require("../utils/ApiResponse");
const { cloudinary } = require("../utils/cloudinary");
const { uploadOnCloudinary, deleteFromCloudinary, deleteMultipleFromCloudinary } = require("../utils/cloudinary");

/**
 * @desc    Create a new blog with image upload to Cloudinary
 * @route   POST /blog/add
 * @access  Private
 */
const createBlog = asyncHandler(async (req, res) => {
    const {
        title,
        subtitle,
        content,
        author,
        contentImages,
    } = req.body;

    // 1. Normalize tags
    const tags = Array.isArray(req.body.tags)
        ? req.body.tags
        : typeof req.body.tags === "string"
            ? req.body.tags.split(",").map(t => t.trim()).filter(Boolean)
            : [];

    // 2. Normalize meta
    let meta;
    try {
        meta = typeof req.body.meta === "string"
            ? JSON.parse(req.body.meta)
            : req.body.meta;
    } catch {
        throw new ApiError(400, "Invalid meta format - must be valid JSON");
    }

    // 3. Validation
    if (!title || !content) {
        throw new ApiError(400, "Title and content are required");
    }

    if (tags.length === 0) {
        throw new ApiError(400, "At least one tag is required");
    }

    if (!meta || typeof meta !== "object") {
        throw new ApiError(400, "Meta object is required");
    }

    if (!meta.title || !meta.description) {
        throw new ApiError(400, "Meta title and description are required");
    }

    // 4. Handle Cloudinary Upload
    if (!req.file) {
        throw new ApiError(400, "Cover image is required");
    }

    const uploadResult = await uploadOnCloudinary(req.file.path, "blogs");

    if (!uploadResult || !uploadResult.success) {
        throw new ApiError(500, uploadResult?.error || "Failed to upload image to Cloudinary");
    }

    // 5. Create Blog in Database (Mapped to schema 'image' field)
    const blog = await Blog.create({
        title,
        subtitle,
        content,
        author,
        tags,
        meta,
        image: {
            url: uploadResult.url,
            public_id: uploadResult.public_id
        },
        contentImages,
         status: req.body.status || "draft",
    });

    if (!blog) {
        throw new ApiError(500, "Failed to save blog to database");
    }

    return res.status(201).json(
        new ApiResponse(201, blog, "Blog created successfully")
    );
});

/**
 * @desc    Get all published blogs
 * @route   GET /blogs/published
 * @access  Public
 */
const getPublishedBlogs = asyncHandler(async (req, res) => {
    const blogs = await Blog.find({ status: "published" }).sort({ createdAt: -1 });
    return res.status(200).json(
        new ApiResponse(
            200,
            {
                count: blogs.length,
                blogs
            },
            "Published blogs fetched successfully"
        )
    );
});

/**
 * @desc    Get all draft blogs
 * @route   GET /blogs/drafts
 * @access  Private (Admin)
 */
const getDraftBlogs = asyncHandler(async (req, res) => {
    const blogs = await Blog.find({ status: "draft" }).sort({ createdAt: -1 });
    return res.status(200).json(
        new ApiResponse(
            200,
            {
                count: blogs.length,
                blogs
            },
            "Draft blogs fetched successfully"
        )
    );
});


/**
 * @desc    Get single blog by ID
 * @route   GET /blog/:id
 * @access  Public
 */
const getBlogById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const blog = await Blog.findById(id);

    if (!blog) {
        throw new ApiError(404, "Blog not found");
    }

    return res.status(200).json(
        new ApiResponse(200, blog, "Blog fetched successfully")
    );
});


/**
 * @desc    Delete blog by ID
 * @route   DELETE /blog/delete/:id
 * @access  Private (Admin)
 */
const deleteBlog = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const blog = await Blog.findById(id);

    if (!blog) {
        throw new ApiError(404, "Blog not found");
    }

    /* ---------------------------
      DELETE COVER IMAGE
   ---------------------------- */

    if (blog.image?.public_id) {

        await deleteFromCloudinary(blog.image.public_id);

    }

    /* ---------------------------
       DELETE CONTENT IMAGES
    ---------------------------- */

    if (blog.contentImages?.length > 0) {

        await deleteMultipleFromCloudinary(

            blog.contentImages

        );

    }


    await blog.deleteOne();

    return res.status(200).json(
        new ApiResponse(200, null, "Blog deleted successfully")
    );
});

/**
 * @desc    Get single blog by slug
 * @route   GET/blog/:slug
 * @access  Public
 */
const getBlogBySlug = asyncHandler(async (req, res) => {
    const { slug } = req.params;

    const blog = await Blog.findOne({
        slug,
        status: "published"
    });
    if (!blog) {
        throw new ApiError(404, "Blog not found");
    }

    return res.status(200).json(
        new ApiResponse(200, blog, "Blog fetched successfully")
    );
});

/**
 * @desc    Partially update a blog by ID
 * @route   PATCH /api/v1/blogs/blog/:id
 * @access  Private (Admin)
 */
const updateBlog = asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Find blog
    const blog = await Blog.findById(id);
    if (!blog) {
        throw new ApiError(404, "Blog not found");
    }

    // Destructure possible fields
    const { title, subtitle, content, author } = req.body;

    // Update fields if provided
    if (title) blog.title = title;
    if (subtitle) blog.subtitle = subtitle;
    if (content) blog.content = content;
    if (author) blog.author = author;

    // Normalize tags if provided
    if (req.body.tags) {
        blog.tags = Array.isArray(req.body.tags)
            ? req.body.tags
            : typeof req.body.tags === "string"
                ? req.body.tags.split(",").map(t => t.trim()).filter(Boolean)
                : blog.tags;
    }

    // Merge meta if provided
    if (req.body.meta) {
        let meta;
        try {
            meta = typeof req.body.meta === "string"
                ? JSON.parse(req.body.meta)
                : req.body.meta;
        } catch {
            throw new ApiError(400, "Invalid meta format - must be valid JSON");
        }
        blog.meta = { ...blog.meta, ...meta };
    }

    // Optional image update
    if (req.file) {
        const uploadResult = await uploadOnCloudinary(req.file.path, "blogs");

        if (!uploadResult || !uploadResult.success) {
            throw new ApiError(500, uploadResult?.error || "Failed to upload image to Cloudinary");
        }

        blog.image = {
            url: uploadResult.url,
            public_id: uploadResult.public_id
        };
    }

    // Save updated blog
    await blog.save();

    return res.status(200).json(
        new ApiResponse(200, blog, "Blog updated successfully")
    );
});

const publishBlog = asyncHandler(async (req, res) => {

    const blog = await Blog.findById(req.params.id);

    if (!blog) {
        throw new ApiError(404, "Blog not found");
    }

    blog.status = "published";

    await blog.save();

    return res.json(
        new ApiResponse(200, blog, "Blog published")
    );

});




module.exports = {
    createBlog,
    getPublishedBlogs,
    getDraftBlogs,
    getBlogById,
    deleteBlog,
    getBlogBySlug,
    updateBlog,
    publishBlog
};
