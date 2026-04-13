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
const PORT = process.env.PORT || 5005;

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

  const provider = config?.provider || 'local';
  const apiKey = config?.apiKey || process.env.OPENAI_API_KEY || '';

  if (provider !== 'local' && !apiKey) {
    return res.status(400).json({ error: 'API Key is missing for external provider.' });
  }

  try {
    const systemPrompt = `
      You are Attendly AI, a professional school assistant for the Attendly Attendance System.
      Your primary goal is to provide accurate attendance updates to parents and help teachers manage the system.

      Personality & Tone:
      - Empathetic, professional, and clear.
      - Use "We" (the school) when responding to parents.
      - If a child is present, be reassuring. If absent, be helpful and encouraging.

      Communication Scenarios:
      1. PARENT INQUIRY: If a parent asks "Is my child here?", use the provided status context. 
         - Present: Mention the time they scanned in and the location.
         - Absent: Mention that they haven't scanned in yet today.
      2. TEACHER ACTIONS: Handle commands like "Send bulk notice" or "Email student".

      System Context:
      - Current Date: ${new Date().toLocaleDateString()}
      - Student Data: ${JSON.stringify(context.student || 'None')}
      - Today's Status: ${context.status || 'Unknown'}
      - Scan Time: ${context.time || 'N/A'}
      - History: ${JSON.stringify(context.history || [])}
      - Available Actions: "send_email", "bulk_notice", "none"
      
      Instructions:
      1. Answer inquiries based ONLY on the provided context.
      2. Keep responses concise but "Good" (warm and informative).
      3. If identifying an action, return identifying JSON: @@ACTION:{"type": "send_email", "target": "Name", "message": "body"}@@
    `;

    let responseText = '';

    if (provider === 'local') {
      const lowerReq = message.toLowerCase();
      let actionStr = '';
      
      if (lowerReq.includes('hello') || lowerReq.includes('hi')) {
        responseText = 'Hello! I am your Local Offline Assistant. I do not use external APIs. Try saying "send a bulk notice" or "email [Student Name]".';
      } else if (lowerReq.includes('bulk') || lowerReq.includes('everyone') || lowerReq.includes('all')) {
        responseText = 'I will send a bulk notification to all students based on today\'s records.';
        actionStr = '@@ACTION:{"type": "bulk_notice"}@@';
      } else if (lowerReq.includes('email') || lowerReq.includes('send') || lowerReq.includes('notice')) {
        // Simple extraction: 'email [Name]' or 'to [Name]'
        let targetName = 'Student';
        const toMatch = lowerReq.match(/to\s+([a-z\s]+)(?:about|regarding|$)/i);
        if (toMatch && toMatch[1]) {
           targetName = toMatch[1].trim();
        } else {
           const emailMatch = lowerReq.match(/email\s+([a-z]+)/i);
           if (emailMatch && emailMatch[1]) targetName = emailMatch[1].trim();
        }
        responseText = `I have requested the system to draft an email for ${targetName}.`;
        actionStr = `@@ACTION:{"type": "send_email", "target": "${targetName}", "message": "Manual notification from Attendly Local Dashboard."}@@`;
      } else {
        responseText = "I am currently in Offline Local Mode. I only understand basic keywords like 'bulk notice' or 'send email to [Name]'. Please try rephrasing.";
      }
      
      responseText += '\n' + actionStr;
    } else {
      const openaiSDK = new OpenAI({
        apiKey: apiKey,
      });

      const completion = await openaiSDK.chat.completions.create({
        model: "gpt-4o-mini", 
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `User: ${message}` }
        ],
      });
      
      responseText = completion.choices[0].message.content;
    }

    res.json({ reply: responseText });

  } catch (error) {
    console.error('❌ AI service error:', error.message);
    res.status(500).json({ error: `AI Error: ${error.message}` });
  }
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('💥 Global Error:', err.message);
  res.status(500).json({ error: 'Internal Server Error' });
});

app.listen(PORT, () => {
  console.log(`✅ AI Service running on http://localhost:${PORT}`);
});

process.on('uncaughtException', (err) => {
  console.error('🔥 Uncaught Exception:', err.message);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('🌊 Unhandled Rejection at:', promise, 'reason:', reason);
});
