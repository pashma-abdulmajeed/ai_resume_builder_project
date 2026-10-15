import express from "express";
import mongoose from "mongoose";
import { GoogleGenAI } from "@google/genai";
import Resume from "../models/Resume.js";
import authenticateToken from "../middleware/auth.js";

const router = express.Router();

router.use(authenticateToken);

function getAI() {
  if (!process.env.GEMINI_API_KEY_11) {
    throw new Error("GEMINI_API_KEY is not configured on the server.");
  }

  return new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY_11 });
}

function cleanText(value, max = 5000) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function prepareResume(body = {}) {
  const personal = body.personal || {};

  return {
    title: cleanText(body.title, 120) || "My Resume",
    personal: {
      name: cleanText(personal.name, 120),
      email: cleanText(personal.email, 180),
      phone: cleanText(personal.phone, 50),
      location: cleanText(personal.location, 150),
      linkedin: cleanText(personal.linkedin, 300),
      website: cleanText(personal.website, 300),
    },
    summary: cleanText(body.summary, 3000),
    skills: cleanText(body.skills, 2000),
    education: Array.isArray(body.education)
      ? body.education.slice(0, 10).map((item) => ({
          institution: cleanText(item?.institution, 200),
          degree: cleanText(item?.degree, 200),
          year: cleanText(item?.year, 80),
        }))
      : [],
    experience: Array.isArray(body.experience)
      ? body.experience.slice(0, 10).map((item) => ({
          company: cleanText(item?.company, 200),
          role: cleanText(item?.role, 200),
          duration: cleanText(item?.duration, 100),
          description: cleanText(item?.description, 2000),
        }))
      : [],
  };
}

// List the current user's resumes
router.get("/", async (req, res) => {
  try {
    const resumes = await Resume.find({ userId: req.user.userId })
      .sort({ updatedAt: -1 })
      .select("title personal.name updatedAt createdAt");

    res.json({ success: true, resumes });
  } catch (error) {
    console.error("List resumes:", error.message);
    res.status(500).json({ success: false, message: "Could not load resumes." });
  }
});

// Create a resume
router.post("/", async (req, res) => {
  try {
    const data = prepareResume(req.body);

    if (!data.personal.name) {
      return res.status(400).json({
        success: false,
        message: "Enter your name before saving your resume.",
      });
    }

    const resume = await Resume.create({
      ...data,
      userId: req.user.userId,
    });

    res.status(201).json({ success: true, resume });
  } catch (error) {
    console.error("Create resume:", error.message);
    res.status(500).json({ success: false, message: "Could not save resume." });
  }
});

// Get one resume
router.get("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid resume ID." });
    }

    const resume = await Resume.findOne({
      _id: req.params.id,
      userId: req.user.userId,
    });

    if (!resume) {
      return res.status(404).json({ success: false, message: "Resume not found." });
    }

    res.json({ success: true, resume });
  } catch (error) {
    res.status(500).json({ success: false, message: "Could not load resume." });
  }
});

// Update a resume
router.put("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid resume ID." });
    }

    const data = prepareResume(req.body);

    if (!data.personal.name) {
      return res.status(400).json({
        success: false,
        message: "Enter your name before saving your resume.",
      });
    }

    const resume = await Resume.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.userId },
      data,
      { new: true, runValidators: true }
    );

    if (!resume) {
      return res.status(404).json({ success: false, message: "Resume not found." });
    }

    res.json({ success: true, resume });
  } catch (error) {
    console.error("Update resume:", error.message);
    res.status(500).json({ success: false, message: "Could not update resume." });
  }
});

// Delete a resume
router.delete("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid resume ID." });
    }

    const resume = await Resume.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.userId,
    });

    if (!resume) {
      return res.status(404).json({ success: false, message: "Resume not found." });
    }

    res.json({ success: true, message: "Resume deleted." });
  } catch (error) {
    res.status(500).json({ success: false, message: "Could not delete resume." });
  }
});

// Gemini AI: generate a professional summary or improve experience text
router.post("/ai/improve", async (req, res) => {
  try {
    const { type, content, role } = req.body;

    if (!["summary", "experience"].includes(type)) {
      return res.status(400).json({
        success: false,
        message: "Choose summary or experience improvement.",
      });
    }

    if (typeof content !== "string" || !content.trim() || content.length > 5000) {
      return res.status(400).json({
        success: false,
        message: "Enter text up to 5000 characters.",
      });
    }

    const prompt =
      type === "summary"
        ? `Write a professional resume summary based only on these details. Do not invent qualifications or achievements. Keep it to 3-5 sentences. Details: ${content}`
        : `Improve these resume experience bullet points for the role ${cleanText(role, 150) || "specified role"}. Use clear action verbs and concise professional language. Do not invent metrics, duties, or achievements. Preserve the facts provided. Return only the improved text. Original: ${content}`;

    const ai = getAI();
    const result = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
    });

    res.json({
      success: true,
      text: result.text?.trim() || "No suggestion was generated.",
    });
  } catch (error) {
    console.error("Resume AI error:", error.message);
    res.status(500).json({
      success: false,
      message: "AI writing failed. Check your Gemini API configuration and try again.",
    });
  }
});

export default router;
