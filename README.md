# 💖 MoodyGF

**MoodyGF** is an AI-powered romantic voice chatbot that listens to your voice, understands your message, generates an emotion-based AI reply, and speaks it back with emotional depth.

---

## 🚀 Features

- 🎙️ Voice-based interaction using Web Speech API
- 🧠 AI-generated responses with mood tagging (happy, sad, flirty, etc.)//mostly it will be annoyed
- 🔊 Voice replies using ElevenLabs' text-to-speech
- 🌈 Dynamic animated orb reacting to "listening", "thinking", and "speaking" states
- 🧩 Full-stack app with Express.js (backend) & React.js (frontend)
- ⚙️ Redis and Quadrant DB setup via Docker for context-aware conversations

---

## 📂 Project Structure

moodygf/
├── backend/ # Node.js + Express backend
├── frontend/ # React.js + Vite frontend
└── README.md # You're here!

---

## 🧪 Prerequisites

Make sure you have the following installed:

- [Node.js](https://nodejs.org/) (v16 or higher)
- [npm](https://www.npmjs.com/)
- [Docker](https://www.docker.com/)
- [GEMIAI API Key](https://platform.openai.com/account/api-keys)
- [ElevenLabs API Key](https://www.elevenlabs.io/)

---

## 🐳 Run the Backend

```bash
cd backend
docker compose up -d       # Start Redis & Quadrant DB containers
npm install                # Install backend dependencies
npm run dev

## 🌐 Run the Frontend

cd frontend
npm install           # Install frontend dependencies
npm run dev           # Start frontend (usually runs at http://localhost:5173)


## 🛠️ Environment Variables
Create a .env file in the backend/ folder and add:
ELEVENLABS_API_KEY=your_elevenlabs_api_key
GOOGLE_API_KEY=your_gemiai_api_key



## ✅ How to Use
1 Make sure backend and frontend are running.

2 Open your browser at: http://localhost:5173

3 Click the Start Talking button to begin voice recognition.

4 Click Stop Listening to submit your speech.

5 The AI will:

6 Analyze your message.

7 Respond with a mood-tagged reply.

8 Speak the response back to you.

 ⚠️ Note: This project was built purely for learning purposes, with both the backend and frontend implemented in single files (index.js and App.jsx) for simplicity and experimentation.

```
