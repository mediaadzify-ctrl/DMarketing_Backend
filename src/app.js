const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth.routes");
const blogRoutes = require("./routes/blog.routes");

const { errorHandler } = require("./middlewares/error.middleware");

const app = express();

app.use(cors({
  origin: [
    "http://localhost:3000",
    "https://d-marketing.vercel.app",
    "https://adzifymedia.com",
  ],
  credentials: true
}));

app.use(express.json());

// Routes
app.use(authRoutes);
app.use(blogRoutes);

// Health check
app.get("/", (req, res) => {
  res.send("API is running");
});

// Error handling middleware
app.use(errorHandler);

module.exports = app;
