import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleGenAI, Modality } from "@google/genai";

// --- Configuration & Helpers ---

// Initialize AI Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Audio Helper for TTS
const playAudio = async (base64String: string) => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const binaryString = atob(base64String);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const audioBuffer = await audioContext.decodeAudioData(bytes.buffer);
    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioContext.destination);
    source.start(0);
  } catch (e) {
    console.error("Audio playback error", e);
  }
};

// --- Components ---

// 1. Navigation Bar
const NavBar = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: 'chat', label: 'Chat w/ Zzzip', icon: '🤖' },
    { id: 'journal', label: 'My Diary', icon: '📔' },
    { id: 'story', label: 'Dream Story', icon: '🌙' },
    { id: 'parents', label: 'Parents', icon: '👨‍👩‍👧' },
  ];

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-around',
      background: 'rgba(30, 41, 59, 0.95)',
      padding: '16px',
      borderTop: '1px solid rgba(255,255,255,0.1)',
      position: 'fixed',
      bottom: 0,
      width: '100%',
      backdropFilter: 'blur(10px)',
      zIndex: 100
    }}>
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          style={{
            background: 'none',
            border: 'none',
            color: activeTab === tab.id ? '#fbbf24' : '#94a3b8',
            fontSize: '12px',
            fontWeight: 'bold',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            cursor: 'pointer',
            transition: 'transform 0.2s',
            transform: activeTab === tab.id ? 'scale(1.1)' : 'scale(1)'
          }}
        >
          <span style={{ fontSize: '24px', marginBottom: '4px' }}>{tab.icon}</span>
          {tab.label}
        </button>
      ))}
    </div>
  );
};

// 2. Chat Component
const ChatView = ({ chatHistory, setChatHistory }) => {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Initial greeting if empty
  useEffect(() => {
    if (chatHistory.length === 0) {
      setChatHistory([{
        role: 'model',
        text: "Hi friend! I'm Zzzip. 🤖 I'm learning how to sleep better. Do you have trouble sleeping sometimes?"
      }]);
    }
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatHistory]);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMsg = { role: 'user', text: input };
    const newHistory = [...chatHistory, userMsg];
    setChatHistory(newHistory);
    setInput('');
    setLoading(true);

    try {
      // Construct prompt history
      // We format history for the model manually to ensure context is kept simple
      const conversation = newHistory.map(m => `${m.role === 'user' ? 'Kid' : 'Zzzip'}: ${m.text}`).join('\n');
      
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `
          System Instruction: You are Zzzip, a friendly, gentle robot designed to talk to children (ages 6-12) about their sleep. 
          Your goal is to gently identify potential sleep issues (nightmares, insomnia, restless legs, snoring, anxiety) by asking simple questions.
          Do NOT diagnose. Just listen and ask follow-up questions.
          Be empathetic, use emojis, and keep responses short (under 50 words).
          
          Conversation so far:
          ${conversation}
          
          Zzzip:
        `,
      });

      setChatHistory([...newHistory, { role: 'model', text: response.text }]);
    } catch (e) {
      console.error(e);
      setChatHistory([...newHistory, { role: 'model', text: "Oops, my circuits got tangled. Can you say that again?" }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', paddingBottom: '90px' }}>
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2 style={{ margin: 0, color: '#fbbf24' }}>Chat with Zzzip</h2>
        <p style={{ margin: '5px 0 0', opacity: 0.7, fontSize: '0.9rem' }}>Tell him about your night!</p>
      </div>
      
      <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '0 20px' }}>
        {chatHistory.map((msg, idx) => (
          <div key={idx} style={{
            display: 'flex',
            justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
            marginBottom: '16px'
          }}>
            <div style={{
              maxWidth: '80%',
              padding: '12px 16px',
              borderRadius: '20px',
              backgroundColor: msg.role === 'user' ? '#6366f1' : '#334155',
              color: 'white',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              borderBottomRightRadius: msg.role === 'user' ? '4px' : '20px',
              borderBottomLeftRadius: msg.role === 'model' ? '4px' : '20px',
            }}>
              {msg.text}
            </div>
          </div>
        ))}
        {loading && <div style={{ textAlign: 'center', opacity: 0.5 }}>Zzzip is thinking...</div>}
      </div>

      <div style={{ padding: '20px', display: 'flex', gap: '10px' }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Type here..."
          style={{
            flex: 1,
            padding: '12px',
            borderRadius: '25px',
            border: 'none',
            background: 'rgba(255,255,255,0.1)',
            color: 'white',
            outline: 'none'
          }}
        />
        <button 
          onClick={sendMessage}
          style={{
            background: '#fbbf24',
            border: 'none',
            borderRadius: '50%',
            width: '46px',
            height: '46px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '20px'
          }}
        >
          ➤
        </button>
      </div>
    </div>
  );
};

// 3. Journal Component
const JournalView = ({ entries, setEntries }) => {
  const [selectedMood, setSelectedMood] = useState<string | null>(null);

  const addEntry = (mood: string, label: string) => {
    const newEntry = {
      date: new Date().toLocaleDateString(),
      mood,
      label,
      time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
    };
    setEntries([newEntry, ...entries]);
    setSelectedMood(null);
  };

  const moods = [
    { emoji: '😴', label: 'Slept Great', color: '#10b981' },
    { emoji: '😐', label: 'Okay', color: '#f59e0b' },
    { emoji: '👻', label: 'Scary Dream', color: '#ef4444' },
    { emoji: '👀', label: 'Woke up a lot', color: '#8b5cf6' },
  ];

  return (
    <div style={{ padding: '20px', paddingBottom: '100px', height: '100%', overflowY: 'auto' }}>
      <h2 style={{ textAlign: 'center', color: '#fbbf24' }}>My Sleep Diary</h2>
      
      <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '16px', padding: '20px', marginBottom: '30px' }}>
        <p style={{ textAlign: 'center', marginBottom: '20px' }}>How did you sleep last night?</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
          {moods.map((m) => (
            <button
              key={m.label}
              onClick={() => addEntry(m.emoji, m.label)}
              style={{
                background: m.color,
                border: 'none',
                borderRadius: '12px',
                padding: '15px',
                color: 'white',
                fontWeight: 'bold',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '5px',
                transition: 'transform 0.1s'
              }}
            >
              <span style={{ fontSize: '30px' }}>{m.emoji}</span>
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <h3 style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px' }}>Past Nights</h3>
      {entries.length === 0 ? (
        <p style={{ opacity: 0.5, textAlign: 'center', marginTop: '40px' }}>No entries yet. Keep track to help Zzzip learn!</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {entries.map((entry, idx) => (
            <div key={idx} style={{ 
              display: 'flex', 
              alignItems: 'center', 
              background: 'rgba(255,255,255,0.05)', 
              padding: '12px', 
              borderRadius: '8px' 
            }}>
              <span style={{ fontSize: '24px', marginRight: '15px' }}>{entry.mood}</span>
              <div>
                <div style={{ fontWeight: 'bold' }}>{entry.label}</div>
                <div style={{ fontSize: '12px', opacity: 0.6 }}>{entry.date} at {entry.time}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// 4. Story Component
const StoryView = () => {
  const [topic, setTopic] = useState('');
  const [story, setStory] = useState<{title: string, text: string} | null>(null);
  const [loading, setLoading] = useState(false);
  const [playing, setPlaying] = useState(false);

  const generateStory = async () => {
    if (!topic) return;
    setLoading(true);
    setStory(null);
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Write a very short, soothing bedtime story (max 100 words) for a child about: ${topic}. Give it a title. Return JSON { "title": "...", "text": "..." }`,
        config: { responseMimeType: 'application/json' }
      });
      const data = JSON.parse(response.text);
      setStory(data);
    } catch (e) {
      console.error(e);
      alert("Could not make a story right now.");
    } finally {
      setLoading(false);
    }
  };

  const readStory = async () => {
    if (!story) return;
    setPlaying(true);
    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: story.text }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
          },
        },
      });
      
      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        await playAudio(base64Audio);
      }
    } catch (e) {
      console.error(e);
      alert("Could not play audio.");
    } finally {
      setPlaying(false);
    }
  };

  return (
    <div style={{ padding: '20px', paddingBottom: '100px', height: '100%', overflowY: 'auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <h2 style={{ color: '#fbbf24' }}>Dream Weaver</h2>
        <p style={{ opacity: 0.8 }}>What should your dream be about?</p>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '30px' }}>
        <input 
          type="text" 
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="e.g. A flying turtle, Space cats..."
          style={{
            flex: 1,
            padding: '12px',
            borderRadius: '8px',
            border: 'none',
            background: 'rgba(255,255,255,0.1)',
            color: 'white'
          }}
        />
        <button 
          onClick={generateStory}
          disabled={loading || !topic}
          style={{
            background: topic ? '#6366f1' : '#475569',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '0 20px',
            fontWeight: 'bold',
            cursor: topic ? 'pointer' : 'default'
          }}
        >
          {loading ? '...' : 'Create'}
        </button>
      </div>

      {story && (
        <div style={{ 
          background: 'rgba(255,255,255,0.05)', 
          padding: '24px', 
          borderRadius: '16px',
          border: '1px solid rgba(255,255,255,0.1)'
        }}>
          <h3 style={{ marginTop: 0, color: '#fbbf24' }}>{story.title}</h3>
          <p style={{ lineHeight: '1.6', fontSize: '1.1rem' }}>{story.text}</p>
          <button
            onClick={readStory}
            disabled={playing}
            style={{
              width: '100%',
              marginTop: '20px',
              padding: '12px',
              background: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 'bold',
              cursor: 'pointer',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            {playing ? 'Reading...' : '🔊 Read to me'}
          </button>
        </div>
      )}
    </div>
  );
};

// 5. Parent Dashboard
const ParentView = ({ chatHistory, journalEntries }) => {
  const [analysis, setAnalysis] = useState('');
  const [loading, setLoading] = useState(false);

  const analyzeData = async () => {
    setLoading(true);
    try {
      const chatText = chatHistory.map(m => `${m.role}: ${m.text}`).join('\n');
      const journalText = journalEntries.map(e => `${e.date} (${e.mood}): ${e.label}`).join('\n');

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `
          Analyze the following interaction data from a child using a sleep app.
          Identify any potential patterns indicating sleep disorders (Insomnia, Nightmares, Apnea, Anxiety, etc.).
          Provide a summary for the parent. Be professional but clear.
          
          Chat History:
          ${chatText}
          
          Journal Entries:
          ${journalText}
          
          Output as a bulleted list of observations and 1 suggestion.
        `
      });
      setAnalysis(response.text);
    } catch (e) {
      console.error(e);
      setAnalysis("Could not analyze data at this moment.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', paddingBottom: '100px', height: '100%', overflowY: 'auto' }}>
      <h2 style={{ color: '#fbbf24', borderBottom: '1px solid #475569', paddingBottom: '10px' }}>Parent Dashboard</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <h3>Data Overview</h3>
        <p>Chat Messages: {chatHistory.length}</p>
        <p>Journal Entries: {journalEntries.length}</p>
      </div>

      <button 
        onClick={analyzeData}
        disabled={loading}
        style={{
          background: '#6366f1',
          color: 'white',
          border: 'none',
          padding: '12px 24px',
          borderRadius: '8px',
          fontWeight: 'bold',
          cursor: 'pointer',
          width: '100%',
          opacity: loading ? 0.7 : 1
        }}
      >
        {loading ? 'Analyzing with AI...' : 'Analyze Sleep Patterns'}
      </button>

      {analysis && (
        <div style={{ 
          marginTop: '24px', 
          background: 'rgba(255,255,255,0.1)', 
          padding: '20px', 
          borderRadius: '12px',
          lineHeight: '1.6'
        }}>
          <h3>AI Insights</h3>
          <div dangerouslySetInnerHTML={{ __html: analysis.replace(/\n/g, '<br/>').replace(/\*/g, '&bull;') }} />
          <p style={{ marginTop: '20px', fontSize: '12px', opacity: 0.7, fontStyle: 'italic' }}>
            Disclaimer: This app is for informational purposes only and is not a medical diagnosis. Please consult a pediatrician for medical advice.
          </p>
        </div>
      )}
    </div>
  );
};

// --- Main App ---

const App = () => {
  const [activeTab, setActiveTab] = useState('chat');
  const [chatHistory, setChatHistory] = useState([]);
  const [journalEntries, setEntries] = useState([]);

  const renderContent = () => {
    switch(activeTab) {
      case 'chat': return <ChatView chatHistory={chatHistory} setChatHistory={setChatHistory} />;
      case 'journal': return <JournalView entries={journalEntries} setEntries={setEntries} />;
      case 'story': return <StoryView />;
      case 'parents': return <ParentView chatHistory={chatHistory} journalEntries={journalEntries} />;
      default: return <ChatView chatHistory={chatHistory} setChatHistory={setChatHistory} />;
    }
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        {renderContent()}
      </div>
      <NavBar activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
