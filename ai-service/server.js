/**
 * ============================================================
 *  ATTENDLY AI SERVICE v1.0
 *  Handles Natural Language Processing and commands.
 * ============================================================
 */

const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const OpenAI = require('openai');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5002;

app.use(cors());
app.use(express.json());

// ── HEALTH CHECK ──────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({ service: 'Attendly AI Service', status: 'running' });
});

// ── CHAT ENDPOINT ─────────────────────────────────────────
app.post('/api/chat', async (req, res) => {
  const { message, context, config } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  const { provider: bodyProvider, apiKey: bodyApiKey } = config || {};
  
  // Prioritize .env keys if available, otherwise use keys from the request body
  const provider = bodyProvider || 'gemini';
  const apiKey = (provider === 'gemini' ? process.env.GEMINI_API_KEY : process.env.OPENROUTER_API_KEY) || bodyApiKey;

  if (!apiKey) {
    return res.status(400).json({ error: 'API Key is missing. Please add it to the .env file or settings.' });
  }

  try {
    let responseText = '';

    if (provider === 'gemini') {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      
      const prompt = `
        You are Attendly AI, a smart assistant for the Attendly Attendance System.
        Your goal is to help the user manage students and attendance records.
        
        System Context:
        - Current Date: ${new Date().toLocaleDateString()}
        - Total Students: ${context.students?.length || 0}
        - Recent Attendance Records (Last 100): ${JSON.stringify(context.attendance?.slice(0, 50) || [])}
        - Available Actions: "send_email", "bulk_notice", "none"
        
        Instructions:
        1. Answer user questions based on the context.
        2. If the user wants to send an email, identify the target student and the message.
        3. If you identify an action, return a special JSON object at the end of your message in this format: 
           @@ACTION:{"type": "send_email", "target": "Student Name", "message": "Email body"}@@
        
        User: ${message}
      `;

      const result = await model.generateContent(prompt);
      responseText = result.response.text();
    } 
    else if (provider === 'openrouter') {
      const openai = new OpenAI({
        baseURL: "https://openrouter.ai/api/v1",
        apiKey: apiKey,
      });

      const completion = await openai.chat.completions.create({
        model: "google/gemini-pro-1.5-exp-0827:free", // Default to free tier
        messages: [
          { role: "system", content: "You are Attendly AI. Help the user manage attendance records." },
          { role: "user", content: `Context: ${JSON.stringify(context)}\n\nUser: ${message}` }
        ],
      });
      responseText = completion.choices[0].message.content;
    }
    else {
      return res.status(400).json({ error: 'Unsupported provider' });
    }

    res.json({ reply: responseText });

  } catch (error) {
    console.error('❌ AI service error:', error.message);
    res.status(500).json({ error: `AI Error: ${error.message}` });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ AI Service running on http://localhost:${PORT}`);
});
