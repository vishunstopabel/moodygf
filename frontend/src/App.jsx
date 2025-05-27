import React, { useRef, useState, useEffect } from "react";
import axios from "axios";
import Orb from "./components/Orb";
import { Mic, MicOff, VolumeX, Bot, User, Brain, Heart } from "lucide-react";

function App() {
  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognitionRef = useRef(null);

  const [appState, setAppState] = useState("Ready to talk");
  const [recognizing, setRecognizing] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState("");
  const [userSpeech, setUserSpeech] = useState("");
  const [responseMessage, setResponseMessage] = useState("");
  const [responseMood, setResponseMood] = useState("");
  const [audioObj, setAudioObj] = useState(null);

  useEffect(() => {
    if (SpeechRecognition && !recognitionRef.current) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;
      recognition.lang = "en-US";
      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current.onresult = null;
        recognitionRef.current.onend = null;
        recognitionRef.current.onerror = null;
      }
    };
  }, []);

  const startListening = () => {
    if (!recognitionRef.current) return;

    setAppState("Listening...");
    setUserSpeech("");
    setResponseMessage("");
    setResponseMood("");
    setInterimTranscript("");
    setRecognizing(true);

    const recognition = recognitionRef.current;
    let finalTranscriptBuffer = "";

    recognition.onresult = (event) => {
      let interim = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscriptBuffer += transcript + " ";
        } else {
          interim += transcript;
        }
      }

      setInterimTranscript(interim);
    };

    recognition.onerror = (event) => {
      console.error("Recognition error:", event.error);
      setAppState(`Error: ${event.error}`);
      setRecognizing(false);
    };

    recognition.onend = () => {
      setRecognizing(false);
      setAppState("Processing your message...");

      const spokenMessage = finalTranscriptBuffer.trim();
      setUserSpeech(spokenMessage);
      setInterimTranscript("");

      if (spokenMessage.length > 0) {
        sendMessage(spokenMessage);
      } else {
        setAppState("No input detected");
      }
    };

    recognition.start();
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setAppState("Stopped listening...");
    }
  };

  const stopSpeaking = () => {
    if (audioObj) {
      audioObj.pause();
      audioObj.currentTime = 0;
      setAppState("Stopped speaking");
      setAudioObj(null);
    }
  };

  const sendMessage = async (message) => {
    setAppState("Thinking...");
    try {
      const res = await axios.post("http://localhost:5000/chat", {
        message,
      });

      const { message: reply, mood, audio } = res.data;
      setResponseMessage(reply);
      setResponseMood(mood);
      setAppState("Speaking...");

      if (audio) {
        const newAudio = new Audio(`data:audio/mpeg;base64,${audio}`);
        setAudioObj(newAudio);
        newAudio.play();
        newAudio.onended = () => {
          setAppState("Ready to talk");
          setAudioObj(null);
        };
      } else {
        setAppState("Ready to talk");
      }
    } catch (err) {
      console.error("Error sending message:", err);
      setAppState("Server error occurred");
    }
  };

  return (
    <div className="bg-black min-h-screen flex flex-col justify-center items-center relative text-white px-4">
      <h1 className="text-4xl font-bold absolute top-4 text-center z-20 flex items-center gap-2">
        MOOdy AI GF
        <Heart className="text-red-500 mt-2" size={50} />
      </h1>

      <h2 className="text-2xl font-semibold absolute top-20 text-center z-10">
        {appState}
      </h2>

      <div className="w-full max-w-md h-[400px] relative mb-4">
        <Orb
          hoverIntensity={
            appState.includes("Speaking")
              ? 2
              : appState.includes("Listening")
              ? 1.5
              : 0.5
          }
          rotateOnHover={false}
          hue={0}
          forceHoverState={[
            "Listening...",
            "Thinking...",
            "Speaking...",
          ].includes(appState)}
        />
      </div>

      {/* Controls */}
      {!["Thinking...", "Speaking..."].includes(appState) && (
        <div className="flex flex-wrap justify-center gap-4 mb-4">
          {!recognizing && (
            <button
              onClick={startListening}
              className="bg-blue-600 px-6 py-2 rounded-md flex items-center gap-2 hover:bg-blue-700 transition"
            >
              <Mic size={20} />
              Start Talking
            </button>
          )}
          {recognizing && (
            <button
              onClick={stopListening}
              className="bg-red-600 px-6 py-2 rounded-md flex items-center gap-2 hover:bg-red-700 transition"
            >
              <MicOff size={20} />
              Stop Listening
            </button>
          )}
          {audioObj && (
            <button
              onClick={stopSpeaking}
              className="bg-red-600 px-6 py-2 rounded-md flex items-center gap-2 hover:bg-red-700 transition"
            >
              <VolumeX size={20} />
              Stop Speaking
            </button>
          )}
        </div>
      )}

      {recognizing && interimTranscript && (
        <div className="text-gray-400 mb-2 text-sm">
          Listening: {interimTranscript}
        </div>
      )}

      {userSpeech && (
        <div className="mt-4 w-full max-w-md text-left">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <User size={18} />
            You said:
          </h2>
          <p className="text-gray-300">{userSpeech}</p>
        </div>
      )}

      {responseMessage && (
        <div className="mt-4 w-full max-w-md text-left">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Bot size={18} />
            AI Response:
          </h2>
          <p className="text-green-400">{responseMessage}</p>
          {responseMood && (
            <p className="text-yellow-500 text-sm mt-1 flex items-center gap-1">
              <Brain size={14} />
              Mood: {responseMood}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
