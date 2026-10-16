import resumeRoutes from "./routes/resumes.js";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import authRoutes from "./routes/auth.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

const corsOptions = {
  origin: "https://ai-resume-builder-project-xclz.vercel.app",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions)); // preflight requests ke liye
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
