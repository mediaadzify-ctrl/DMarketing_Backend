const cloudinary = require("cloudinary").v2;
const fs = require("fs").promises;
const path = require("path");

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload a local file to Cloudinary (async-safe and structured)
 */
const uploadOnCloudinary = async (localFilePath, folder = "blogs") => {
    if (!localFilePath) {
        return { success: false, error: "No file path provided" };
    }

    try {
        // Check if file exists
        await fs.access(localFilePath);

        // Upload to Cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto",
            folder,
        });

        // Remove local temp file safely
        try {
            await fs.unlink(localFilePath);
        } catch (unlinkError) {
            console.warn("Failed to delete temp file:", unlinkError.message);
        }

        return {
            success: true,
            url: response.secure_url,
            public_id: response.public_id,
        };
    } catch (error) {
        // Attempt cleanup if upload failed
        try {
            await fs.unlink(localFilePath);
        } catch {}

        return {
            success: false,
            error: "Cloudinary upload failed",
            details: error.message,
        };
    }
};

/**
 * Delete a file from Cloudinary
 */
const deleteFromCloudinary = async (publicId) => {
    if (!publicId) return { success: false, error: "No publicId provided" };

    try {
        const result = await cloudinary.uploader.destroy(publicId, { resource_type: "auto" });
        return { success: result.result === "ok", result };
    } catch (error) {
        return { success: false, error: "Cloudinary delete failed", details: error.message };
    }
};

module.exports = { uploadOnCloudinary, deleteFromCloudinary };
