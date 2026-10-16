import { useEffect, useState } from "react";
import ResumeDashboard from "./resumeDashboard";
import "./App.css";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

function App() {
  const [mode, setMode] = useState("register");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("resume_token");

    if (!token) return;

    fetch(`${API_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (response) => {
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Session expired.");
        }

        setUser(data.user);
      })
      .catch(() => {
        localStorage.removeItem("resume_token");
      });
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setNotice("");
    setLoading(true);

    try {
      const endpoint =
        mode === "register" ? "/register" : "/login";

      const payload =
        mode === "register"
          ? { name, email, password }
          : { email, password };

      const response = await fetch(`${API_URL}/api/auth${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Authentication failed.");
      }

      localStorage.setItem("resume_token", data.token);
      setUser(data.user);
      setPassword("");
      setNotice(data.message);
    } catch (err) {
      setError(
        err.message === "Failed to fetch"
          ? "Cannot connect to the server. Please check your backend."
          : err.message
      );
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    localStorage.removeItem("resume_token");
    setUser(null);
    setMode("login");
    setName("");
    setEmail("");
    setPassword("");
    setError("");
    setNotice("You have logged out.");
  }

  if (user) {
  return <ResumeDashboard user={user} onLogout={logout} />;
}

  return (
    <main className="auth-layout">
      <section className="intro-panel">
        <a className="brand" href="/">Resume<span>AI</span></a>

        <div className="intro-content">
          <div className="intro-badge">✦ AI-POWERED RESUME BUILDER</div>
          <h1>Your next opportunity starts with a better resume.</h1>
          <p>
            Build a professional resume, improve your writing with AI,
            and get ready for your next career move.
          </p>

          <div className="intro-points">
            <p>✓ Professional resume layouts</p>
            <p>✓ AI-assisted writing with Gemini</p>
            <p>✓ Saved resumes and PDF export</p>
          </div>
        </div>

        <p className="intro-footer">Build your story. Show your potential.</p>
      </section>

      <section className="form-panel">
        <div className="auth-card">
          <p className="eyebrow">
            {mode === "register" ? "CREATE YOUR ACCOUNT" : "WELCOME BACK"}
          </p>
          <h2>
            {mode === "register" ? "Get started" : "Sign in"}
          </h2>
          <p className="muted">
            {mode === "register"
              ? "Create your account to start building."
              : "Sign in to continue to your workspace."}
          </p>

          <div className="auth-tabs">
            <button
              className={mode === "register" ? "tab active" : "tab"}
              onClick={() => {
                setMode("register");
                setError("");
                setNotice("");
              }}
              type="button"
            >
              Sign up
            </button>
            <button
              className={mode === "login" ? "tab active" : "tab"}
              onClick={() => {
                setMode("login");
                setError("");
                setNotice("");
              }}
              type="button"
            >
              Log in
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            {mode === "register" && (
              <label>
                Full name
                <input
                  type="text"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={80}
                  autoComplete="name"
                  required
                />
              </label>
            )}

            <label>
              Email address
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </label>

            <label>
              Password
              <input
                type="password"
                placeholder="At least 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={8}
                maxLength={128}
                autoComplete={
                  mode === "register" ? "new-password" : "current-password"
                }
                required
              />
            </label>

            {error && <p className="form-error">{error}</p>}
            {notice && <p className="notice">{notice}</p>}

            <button className="primary-button" disabled={loading}>
              {loading
                ? "Please wait..."
                : mode === "register"
                  ? "Create account →"
                  : "Log in →"}
            </button>
          </form>

          <p className="form-footer">
            Your account is secured with password hashing and JWT
            authentication.
          </p>
        </div>
      </section>
    </main>
  );
}

export default App;
