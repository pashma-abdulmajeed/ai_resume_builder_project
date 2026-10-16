import resumeRoutes from "./routes/resumes.js";
import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import authRoutes from "./routes/auth.js";
import cors from "cors";
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

const allowedOrigins = [
  "https://ai-resume-builder-project-xclz.vercel.app",
];

app.use(
  cors({
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());

app.use("/api/resumes", resumeRoutes);

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "AI Resume Builder API is running!",
  });
});

app.use("/api/auth", authRoutes);

async function startServer() {
  if (!process.env.MONGODB_URI || !process.env.JWT_SECRET) {
    throw new Error("MONGODB_URI and JWT_SECRET must be configured in .env");
  }

  await mongoose.connect(process.env.MONGODB_URI);
  console.log("MongoDB connected successfully.");

  app.listen(PORT, () => {
    console.log(`Backend running at http://localhost:${PORT}`);
  });
}

startServer().catch((error) => {
  console.error("Server startup failed:", error.message);
  process.exit(1);
});

export default app;
