# AI Resume Builder

An AI-powered resume builder that helps users create, improve, save, preview, and download professional resumes.

## Features

- User registration and login with JWT authentication
- Secure password hashing with bcrypt
- MongoDB storage for user accounts and resumes
- Create, edit, view, and delete saved resumes
- Gemini AI assistance for improving summaries and experience descriptions
- Live resume preview
- PDF resume export
- Responsive user interface

## Tech Stack

**Frontend**
- React
- Vite
- JavaScript
- CSS
- jsPDF

**Backend**
- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT
- bcryptjs
- Google Gemini API

## Project Structure

```text
ai-resume-builder/
├── frontend/
│   ├── src/
│   ├── .env.example
│   └── package.json
├── backend/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── .env.example
│   ├── .gitignore
│   ├── server.js
│   └── package.json
├── .gitignore
└── README.md
```

## Run Locally

### 1. Clone the repository

```bash
git clone https://github.com/pashma-abdulmajeed/ai_resume_builder_project.git
cd ai-resume-builder
```

### 2. Install backend dependencies

```bash
cd backend
npm install
```

Create a `.env` file using `.env.example` and configure your MongoDB connection, JWT secret, and Gemini API key.

### 3. Start the backend

```bash
npm run dev
```

The backend runs on `http://localhost:5000` by default.

### 4. Install frontend dependencies

Open another terminal:

```bash
cd frontend
npm install
```

Create the frontend `.env` file using `.env.example`.

### 5. Start the frontend

```bash
npm run dev
```

Open the local URL displayed by Vite in your terminal.

## Environment Variables

### Backend

- `PORT` — Backend port
- `MONGODB_URI` — MongoDB connection string
- `JWT_SECRET` — Secret used to sign JWTs
- `GEMINI_API_KEY` — Google Gemini API key
- `FRONTEND_URL` — Allowed frontend origin

### Frontend

- `VITE_API_URL` — Backend base URL

Never commit real environment files or secrets.

## Security Notes

- Passwords are hashed before being stored.
- Protected routes require authentication.
- Resume operations are restricted to the authenticated owner.
- AI-generated content should be reviewed before use.

## Future Improvements

- Additional resume templates
- Secure cookie-based authentication
- Rate limiting and stronger input validation
- Resume sharing and more export options

## Author

**Pashma Abdul Majeed**

GitHub: [Pashma Abdul Majeed](https://github.com/pashma-abdulmajeed)