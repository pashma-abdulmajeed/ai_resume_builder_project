import { useEffect, useState } from "react";
import { generateResumePDF } from "./generateResumePDF";

const API_URL = import.meta.env.VITE_API_URL;

fetch(`/api/auth/register`, {
  // method, headers, body...
});

const emptyResume = () => ({
  title: "My Resume",
  personal: {
    name: "",
    email: "",
    phone: "",
    location: "",
    linkedin: "",
    website: "",
  },
  summary: "",
  education: [{ institution: "", degree: "", year: "" }],
  experience: [{ company: "", role: "", duration: "", description: "" }],
  skills: "",
});

export default function ResumeDashboard({ user, onLogout }) {
  const [resume, setResume] = useState(emptyResume);
  const [resumeId, setResumeId] = useState(null);
  const [savedResumes, setSavedResumes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const token = () => localStorage.getItem("resume_token");

  async function api(path, options = {}) {
    const response = await fetch(`${API_URL}/api/resumes${path}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${token()}`,
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...options.headers,
      },
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || "Request failed.");
    }

    return data;
  }

  async function loadSavedResumes() {
    try {
      const data = await api("");
      setSavedResumes(data.resumes);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    loadSavedResumes();
  }, []);

  function updateField(field, value) {
    setResume((previous) => ({ ...previous, [field]: value }));
  }

  function updatePersonal(field, value) {
    setResume((previous) => ({
      ...previous,
      personal: { ...previous.personal, [field]: value },
    }));
  }

  function updateList(section, index, field, value) {
    setResume((previous) => ({
      ...previous,
      [section]: previous[section].map((item, i) =>
        i === index ? { ...item, [field]: value } : item,
      ),
    }));
  }

  function addItem(section) {
    const blank =
      section === "education"
        ? { institution: "", degree: "", year: "" }
        : { company: "", role: "", duration: "", description: "" };

    setResume((previous) => ({
      ...previous,
      [section]: [...previous[section], blank],
    }));
  }

  function removeItem(section, index) {
    setResume((previous) => ({
      ...previous,
      [section]: previous[section].filter((_, i) => i !== index),
    }));
  }

  function newResume() {
    setResume(emptyResume());
    setResumeId(null);
    setError("");
    setNotice("New resume ready.");
  }

  async function saveResume(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setNotice("");

    try {
      const data = await api(resumeId ? `/${resumeId}` : "", {
        method: resumeId ? "PUT" : "POST",
        body: JSON.stringify(resume),
      });

      setResume(data.resume);
      setResumeId(data.resume._id);
      setNotice("Resume saved successfully.");
      await loadSavedResumes();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function openResume(id) {
    setLoading(true);
    setError("");
    setNotice("");

    try {
      const data = await api(`/${id}`);
      setResume(data.resume);
      setResumeId(data.resume._id);
      setNotice("Saved resume loaded.");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function deleteResume(id) {
    if (!window.confirm("Delete this saved resume?")) return;

    setError("");
    setNotice("");

    try {
      await api(`/${id}`, { method: "DELETE" });

      if (resumeId === id) newResume();

      setNotice("Resume deleted.");
      await loadSavedResumes();
    } catch (err) {
      setError(err.message);
    }
  }

  async function improveWithAI(type, content, role = "") {
    if (!content.trim()) {
      setError("Enter some text before using AI.");
      return;
    }

    setAiLoading(true);
    setError("");
    setNotice("");

    try {
      const data = await api("/ai/improve", {
        method: "POST",
        body: JSON.stringify({ type, content, role }),
      });

      if (type === "summary") {
        updateField("summary", data.text);
      } else {
        const index = Number(role.split("::")[0]);
        updateList("experience", index, "description", data.text);
      }

      setNotice("AI suggestion added. Review it before saving.");
    } catch (err) {
      setError(err.message);
    } finally {
      setAiLoading(false);
    }
  }

  const personal = resume.personal || {};
  const education = resume.education || [];
  const experience = resume.experience || [];

  return (
    <main className="resume-app">
      <header className="resume-topbar">
        <a className="brand" href="/">
          Resume<span>AI</span>
        </a>
        <div className="topbar-actions">
          <span className="welcome-user">Hi, {user.name}</span>
          <button className="secondary-button" onClick={onLogout}>
            Log out
          </button>
        </div>
      </header>

      <section className="resume-heading">
        <div>
          <p className="eyebrow">YOUR CAREER WORKSPACE</p>
          <h1>Build your resume</h1>
          <p className="muted">
            Add your details, improve your writing with AI, and save your work.
          </p>
        </div>
        <button className="secondary-button" onClick={newResume}>
          + New resume
        </button>
      </section>

      <div className="resume-layout">
        <section className="editor-panel">
          <form onSubmit={saveResume}>
            <div className="section-heading">
              <h2>Resume details</h2>
              <span>{resumeId ? "Editing saved resume" : "New resume"}</span>
            </div>

            <label>
              Resume title
              <input
                value={resume.title}
                maxLength={120}
                onChange={(e) => updateField("title", e.target.value)}
                placeholder="e.g. Frontend Developer Resume"
              />
            </label>

            <h3>Personal information</h3>
            <div className="form-grid">
              <label>
                Full name *
                <input
                  required
                  value={personal.name || ""}
                  onChange={(e) => updatePersonal("name", e.target.value)}
                  placeholder="Your full name"
                />
              </label>
              <label>
                Email
                <input
                  type="email"
                  value={personal.email || ""}
                  onChange={(e) => updatePersonal("email", e.target.value)}
                  placeholder="you@example.com"
                />
              </label>
              <label>
                Phone
                <input
                  value={personal.phone || ""}
                  onChange={(e) => updatePersonal("phone", e.target.value)}
                  placeholder="+92..."
                />
              </label>
              <label>
                City / Location
                <input
                  value={personal.location || ""}
                  onChange={(e) => updatePersonal("location", e.target.value)}
                  placeholder="Your location"
                />
              </label>
              <label>
                LinkedIn URL
                <input
                  value={personal.linkedin || ""}
                  onChange={(e) => updatePersonal("linkedin", e.target.value)}
                  placeholder="https://linkedin.com/in/..."
                />
              </label>
              <label>
                Portfolio URL
                <input
                  value={personal.website || ""}
                  onChange={(e) => updatePersonal("website", e.target.value)}
                  placeholder="https://..."
                />
              </label>
            </div>

            <div className="editor-section">
              <div className="section-heading">
                <h3>Professional summary</h3>
                <button
                  type="button"
                  className="ai-button"
                  disabled={aiLoading}
                  onClick={() => improveWithAI("summary", resume.summary)}
                >
                  ✦ {aiLoading ? "Working..." : "Improve with AI"}
                </button>
              </div>
              <textarea
                rows={4}
                value={resume.summary}
                onChange={(e) => updateField("summary", e.target.value)}
                placeholder="Describe your professional background and strengths..."
              />
            </div>

            <div className="editor-section">
              <div className="section-heading">
                <h3>Education</h3>
                <button
                  type="button"
                  className="text-button"
                  onClick={() => addItem("education")}
                >
                  + Add
                </button>
              </div>

              {education.map((item, index) => (
                <div className="repeat-card" key={`education-${index}`}>
                  <label>
                    Institution
                    <input
                      value={item.institution || ""}
                      onChange={(e) =>
                        updateList(
                          "education",
                          index,
                          "institution",
                          e.target.value,
                        )
                      }
                      placeholder="University or college"
                    />
                  </label>
                  <label>
                    Degree
                    <input
                      value={item.degree || ""}
                      onChange={(e) =>
                        updateList("education", index, "degree", e.target.value)
                      }
                      placeholder="BS Computer Science"
                    />
                  </label>
                  <label>
                    Year
                    <input
                      value={item.year || ""}
                      onChange={(e) =>
                        updateList("education", index, "year", e.target.value)
                      }
                      placeholder="2023–2027"
                    />
                  </label>
                  {education.length > 1 && (
                    <button
                      type="button"
                      className="remove-button"
                      onClick={() => removeItem("education", index)}
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="editor-section">
              <div className="section-heading">
                <h3>Work experience</h3>
                <button
                  type="button"
                  className="text-button"
                  onClick={() => addItem("experience")}
                >
                  + Add
                </button>
              </div>

              {experience.map((item, index) => (
                <div className="repeat-card" key={`experience-${index}`}>
                  <label>
                    Job title
                    <input
                      value={item.role || ""}
                      onChange={(e) =>
                        updateList("experience", index, "role", e.target.value)
                      }
                      placeholder="e.g. Web Developer Intern"
                    />
                  </label>
                  <label>
                    Company
                    <input
                      value={item.company || ""}
                      onChange={(e) =>
                        updateList(
                          "experience",
                          index,
                          "company",
                          e.target.value,
                        )
                      }
                      placeholder="Company name"
                    />
                  </label>
                  <label>
                    Duration
                    <input
                      value={item.duration || ""}
                      onChange={(e) =>
                        updateList(
                          "experience",
                          index,
                          "duration",
                          e.target.value,
                        )
                      }
                      placeholder="Jun 2025 – Aug 2025"
                    />
                  </label>
                  <label>
                    Responsibilities and achievements
                    <textarea
                      rows={3}
                      value={item.description || ""}
                      onChange={(e) =>
                        updateList(
                          "experience",
                          index,
                          "description",
                          e.target.value,
                        )
                      }
                      placeholder="Describe what you did and achieved..."
                    />
                  </label>
                  <div className="repeat-actions">
                    <button
                      type="button"
                      className="ai-button"
                      disabled={aiLoading}
                      onClick={() =>
                        improveWithAI(
                          "experience",
                          item.description || "",
                          `${index}::${item.role || ""}`,
                        )
                      }
                    >
                      ✦ Improve with AI
                    </button>
                    {experience.length > 1 && (
                      <button
                        type="button"
                        className="remove-button"
                        onClick={() => removeItem("experience", index)}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="editor-section">
              <h3>Skills</h3>
              <textarea
                rows={3}
                value={resume.skills}
                onChange={(e) => updateField("skills", e.target.value)}
                placeholder="React, JavaScript, Node.js, MongoDB..."
              />
              <p className="helper-text">Separate skills with commas.</p>
            </div>

            {error && <p className="form-error">{error}</p>}
            {notice && <p className="notice">{notice}</p>}

            <button className="primary-button save-button" disabled={loading}>
              {loading ? "Saving..." : "Save resume"}
            </button>

            <button
              type="button"
              className="pdf-button"
              onClick={() => {
                if (!resume.personal?.name?.trim()) {
                  alert(
                    "Please enter your name before downloading your resume.",
                  );
                  return;
                }

                generateResumePDF(resume);
              }}
            >
              Download PDF
            </button>
          </form>

          <div className="saved-section">
            <h2>Saved resumes</h2>
            {savedResumes.length === 0 && (
              <p className="muted">Your saved resumes will appear here.</p>
            )}
            {savedResumes.map((item) => (
              <div className="saved-item" key={item._id}>
                <button
                  className="saved-title"
                  onClick={() => openResume(item._id)}
                >
                  <strong>{item.title}</strong>
                  <span>{item.personal?.name || "Untitled"}</span>
                </button>
                <button
                  className="remove-button"
                  onClick={() => deleteResume(item._id)}
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        </section>

        <aside className="preview-panel">
          <div className="preview-toolbar">
            <div>
              <p className="eyebrow">LIVE PREVIEW</p>
              <h2>{resume.title || "My Resume"}</h2>
            </div>
            <span className="preview-status">Preview</span>
          </div>

          <article className="resume-paper">
            <header className="paper-header">
              <h1>{personal.name || "Your Name"}</h1>
              <p>
                {[personal.email, personal.phone, personal.location]
                  .filter(Boolean)
                  .join("  •  ") || "Email • Phone • Location"}
              </p>
              <p className="paper-links">
                {[personal.linkedin, personal.website]
                  .filter(Boolean)
                  .join("  •  ")}
              </p>
            </header>

            <section className="paper-section">
              <h2>PROFESSIONAL SUMMARY</h2>
              <p>
                {resume.summary ||
                  "Your professional summary will appear here."}
              </p>
            </section>

            <section className="paper-section">
              <h2>EDUCATION</h2>
              {education
                .filter((item) => item.institution || item.degree)
                .map((item, i) => (
                  <div key={i} className="paper-entry">
                    <strong>{item.institution || "Institution"}</strong>
                    <p>
                      {item.degree} {item.year && `• ${item.year}`}
                    </p>
                  </div>
                ))}
              {!education.some((item) => item.institution || item.degree) && (
                <p>Add your education details.</p>
              )}
            </section>

            <section className="paper-section">
              <h2>EXPERIENCE</h2>
              {experience
                .filter((item) => item.role || item.company)
                .map((item, i) => (
                  <div key={i} className="paper-entry">
                    <strong>{item.role || "Job title"}</strong>
                    <p>
                      {item.company} {item.duration && `• ${item.duration}`}
                    </p>
                    <p className="paper-description">{item.description}</p>
                  </div>
                ))}
              {!experience.some((item) => item.role || item.company) && (
                <p>Add your work or internship experience.</p>
              )}
            </section>

            <section className="paper-section">
              <h2>SKILLS</h2>
              <p>{resume.skills || "Your skills will appear here."}</p>
            </section>
          </article>
        </aside>
      </div>
    </main>
  );
}
