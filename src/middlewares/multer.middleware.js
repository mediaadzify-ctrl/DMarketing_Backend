const multer = require("multer");
const path = require("path");
const fs = require("fs").promises;

// Temp directory
const tempDir = path.join(process.cwd(), "temp", "uploads");

// Ensure temp folder exists asynchronously at server start
(async () => {
    try {
        await fs.mkdir(tempDir, { recursive: true });
    } catch (err) {
        console.error("Failed to create temp folder:", err);
        process.exit(1);
    }
})();

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, tempDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
        cb(null, true);
    } else {
        cb(new Error("Only image files are allowed"));
    }
};

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter
});

module.exports = { upload, tempDir };
