const mongoose = require("mongoose");
require("dotenv").config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB connected");
  } catch (error) {
    console.error("❌ MongoDB connection failed");
    console.error(error.message);
    process.exit(1);
  }
};

const runMigration = async () => {
  try {
    await connectDB();

    const Blog = require("../src/models/blog.model");

    // Update all documents that don't have a status field
    const result = await Blog.updateMany(
      { status: { $exists: false } },
      { $set: { status: "published" } }
    );

    console.log(`✅ Migration completed!`);
    console.log(`📊 Matched documents: ${result.matchedCount}`);
    console.log(`✏️ Modified documents: ${result.modifiedCount}`);

    // Show all blogs with their status
    const allBlogs = await Blog.find({}, { title: 1, status: 1 });
    console.log("\n📋 All blogs with status:");
    allBlogs.forEach((blog) => {
      console.log(`  - ${blog.title}: ${blog.status}`);
    });

    process.exit(0);
  } catch (error) {
    console.error("❌ Migration failed:", error.message);
    process.exit(1);
  }
};

runMigration();
