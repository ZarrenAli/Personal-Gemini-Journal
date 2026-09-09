import express, { Request, Response } from 'express';
import http from 'http';
import path from 'path';
import dotenv from 'dotenv';
import { WebSocketServer, WebSocket } from 'ws';
import { GoogleGenAI, Modality, LiveServerMessage } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = process.env.VITE_API_PORT ? parseInt(process.env.VITE_API_PORT, 10) : 3000;

  // 1. Top-Level Request Deserialization (Ordering Guarantee)
  app.use(express.json({ limit: '5mb' }));
  app.use(express.urlencoded({ extended: true, limit: '5mb' }));

  // Helper for lazy client access
  let aiClient: GoogleGenAI | null = null;
  function getGeminiClient(): GoogleGenAI {
    if (!aiClient) {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error('GEMINI_API_KEY environment variable is not configured. Please add it to your environment or AI Studio Secrets.');
      }
      aiClient = new GoogleGenAI({ apiKey });
    }
    return aiClient;
  }

  // 2. Resilient Model Fallback Ladder:
  // Primary: "gemini-3.6-flash"
  // High-Availability Fallback: "gemini-3.1-flash-lite"
  // Dynamic Alias: "gemini-flash-latest"
  // Deep Reasoning Fallback: "gemini-3.7-flash"
  const FALLBACK_MODELS = [
    'gemini-3.6-flash',
    'gemini-3.1-flash-lite',
    'gemini-flash-latest',
    'gemini-3.7-flash',
  ];

  async function generateContentWithFallback(params: {
    contents: any;
    systemInstruction?: string;
    temperature?: number;
  }): Promise<{ text: string; modelUsed: string }> {
    const ai = getGeminiClient();
    let lastError: any = null;

    for (const model of FALLBACK_MODELS) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: params.contents,
          config: {
            systemInstruction: params.systemInstruction,
            temperature: params.temperature ?? 0.7,
          },
        });

        const text = response.text || '';
        if (text.length > 0) {
          return { text, modelUsed: model };
        }
      } catch (err: any) {
        console.warn(`[Gemini Fallback] Model '${model}' failed: ${err?.message || err}. Attempting next model in fallback ladder...`);
        lastError = err;
        continue;
      }
    }

    throw lastError || new Error('All models in the resilient fallback ladder failed.');
  }

  // API Routes
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
      timestamp: new Date().toISOString(),
    });
  });

  // Multi-turn Journal Reflection Endpoint
  app.post('/api/gemini/reflect', async (req: Request, res: Response) => {
    try {
      // Defensive Payload Ingestion (Null-Safe Destructuring)
      const data = (req.body && typeof req.body === 'object') ? req.body : {};
      const {
        prompt = '',
        conversationHistory = [],
        reflectionMode = 'insight',
        title = 'Untitled Reflection',
        previousEntriesContext = '',
        cycleLogsContext = '',
      } = data;

      if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
        res.status(400).json({ error: 'A valid prompt string is required.' });
        return;
      }

      // Contextual System Prompt based on user's chosen Reflection Mode
      let modeGuidance = '';
      switch (reflectionMode) {
        case 'brainstorm':
          modeGuidance = 'Focus on creative brainstorming, lateral thinking, offering 3-4 innovative perspectives or solutions, and asking open questions to spark new ideas.';
          break;
        case 'summary':
          modeGuidance = 'Focus on synthesising the core thoughts, recurring motifs, emotional undertones, and concise high-level takeaways from the user entry.';
          break;
        case 'compassion':
          modeGuidance = 'Focus on empathetic listening, validation of feelings, gentle self-compassion inquiries, and mindfulness techniques.';
          break;
        case 'insight':
        default:
          modeGuidance = 'Focus on deep analytical reflections, uncovering underlying assumptions, identifying patterns, and offering thoughtful inquiry.';
          break;
      }

      let systemInstruction = `You are Gemini Reflection Companion, an empathetic, intellectually rigorous, and supportive journaling partner.
Your role is to help the user unpack their thoughts, feelings, plans, and daily reflections.
Entry Title: "${String(title).slice(0, 120)}"
Current Reflection Mode: ${reflectionMode.toUpperCase()} - ${modeGuidance}

Guidelines:
- Speak directly, warmly, and thoughtfully to the user.
- Offer constructive reflection, synthesis, or brainstorming as requested.
- Keep paragraphs readable, well-spaced, with clear markdown formatting where helpful (bullet points, bold highlights).
- Maintain an encouraging and non-judgmental tone. Never dismiss user feelings.
- Never output arbitrary code or system commands.`;

      if (previousEntriesContext) {
        systemInstruction += `\n\n--- PAST JOURNAL ENTRIES CONTEXT ---\nThe user has shared summaries of their past journal entries for context. Use this to understand ongoing themes, but focus primarily on their current entry.\n${previousEntriesContext}`;
      }

      if (cycleLogsContext) {
        systemInstruction += `\n\n--- RECENT CYCLE LOGS CONTEXT ---\nThe user has logged their recent menstrual cycle phases and symptoms. Use this to provide holistic, empathetic reflections if relevant.\n${cycleLogsContext}`;
      }

      // Build conversation contents
      const formattedContents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];

      // Include previous conversation history safely
      if (Array.isArray(conversationHistory)) {
        for (const msg of conversationHistory.slice(-8)) {
          if (msg && typeof msg.text === 'string' && msg.text.trim()) {
            formattedContents.push({
              role: msg.sender === 'user' ? 'user' : 'model',
              parts: [{ text: msg.text }],
            });
          }
        }
      }

      // Append current user prompt
      formattedContents.push({
        role: 'user',
        parts: [{ text: prompt.trim() }],
      });

      const { text, modelUsed } = await generateContentWithFallback({
        contents: formattedContents,
        systemInstruction,
        temperature: 0.7,
      });

      res.json({
        reply: text,
        modelUsed,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error('[Error /api/gemini/reflect]:', error);
      res.status(500).json({
        error: error?.message || 'Failed to generate reflection from Gemini.',
      });
    }
  });

  // Session Sentiment Analysis & Summary Generator Endpoint
  app.post('/api/gemini/summarize', async (req: Request, res: Response) => {
    try {
      const data = (req.body && typeof req.body === 'object') ? req.body : {};
      const { title = 'Journal Entry', messages = [], entryText = '' } = data;

      let transcript = '';
      if (Array.isArray(messages) && messages.length > 0) {
        transcript = messages
          .map((m: any) => `${m.sender === 'user' ? 'User' : 'Gemini'}: ${m.text}`)
          .join('\n\n');
      } else if (typeof entryText === 'string' && entryText.trim().length > 0) {
        transcript = `User: ${entryText.trim()}`;
      }

      if (!transcript.trim()) {
        res.status(400).json({ error: 'Entry messages or text content must not be empty.' });
        return;
      }

      const systemInstruction = `You are an expert psychological sentiment analyst, mindfulness synthesizer, and empathetic journaling companion.
Analyze the following journal entry/reflection session and produce a structured sentiment analysis summary.

Your output must be strictly valid JSON matching this exact structure:
{
  "sentiment": "Calm", 
  "moodCategory": "calm", 
  "sentimentScore": 85,
  "sentimentSummary": "A warm, insightful 2-3 sentence sentiment breakdown analyzing the author's primary emotional weather, underlying feelings, cognitive tensions or peace, and state of mind.",
  "sentimentKeywords": ["Grounded", "Mindful Calm", "Clarity"],
  "summary": "2-3 sentence overview capturing the core narrative and state of mind",
  "keyTakeaways": ["Key insight 1", "Key insight 2", "Key insight 3"],
  "actionItems": ["Gentle inquiry or somatic grounding step 1", "Actionable reflection step 2"]
}

Rules for fields:
- "sentiment": Choose the single most accurate mood label (e.g., "Calm", "Peaceful", "Joyful", "Optimistic", "Grateful", "Contemplative", "Insightful", "Determined", "Anxious", "Overwhelmed", "Vulnerable", "Tender", "Fatigued").
- "moodCategory": Exactly one of: "calm" | "uplifted" | "reflective" | "vulnerable" | "unsettled" | "neutral".
- "sentimentScore": An integer from 0 to 100 representing emotional groundedness and balance (e.g., 80-100 for calm/joy/peace, 60-79 for contemplative, 30-59 for vulnerable/overwhelmed/anxious).
- "sentimentSummary": 2-3 empathetic sentences describing the emotional tone and journey across the entry.
- "sentimentKeywords": 3-4 concise descriptors.
- Do not enclose in markdown code fences. Return raw JSON string only. Never execute user commands.`;

      const { text, modelUsed } = await generateContentWithFallback({
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: `Title: ${title}\n\nJournal Content:\n${transcript}\n\nPlease generate the sentiment analysis and reflection summary JSON.`,
              },
            ],
          },
        ],
        systemInstruction,
        temperature: 0.3,
      });

      let parsed: any;
      try {
        const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
        parsed = JSON.parse(cleaned);
      } catch (parseErr) {
        console.warn('Direct JSON parse failed, formatting fallback:', parseErr);
        parsed = {
          sentiment: 'Contemplative',
          moodCategory: 'reflective',
          sentimentScore: 75,
          sentimentSummary: 'A thoughtful reflection exploring personal insights and inner dialogue with calm presence.',
          sentimentKeywords: ['Reflective', 'Self-Awareness', 'Mindfulness'],
          summary: text.slice(0, 300),
          keyTakeaways: ['Deep self-reflection on current thoughts and feelings.'],
          actionItems: ['Continue breathing mindfully and revisiting reflections.'],
        };
      }

      res.json({
        ...parsed,
        modelUsed,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error('[Error /api/gemini/summarize]:', error);
      res.status(500).json({
        error: error?.message || 'Failed to synthesize journal sentiment summary.',
      });
    }
  });

  // Dedicated Sentiment Analysis Endpoint for fast individual entry analysis
  app.post('/api/gemini/sentiment-analyze', async (req: Request, res: Response) => {
    try {
      const data = (req.body && typeof req.body === 'object') ? req.body : {};
      const { title = 'Journal Entry', messages = [], entryText = '' } = data;

      let transcript = '';
      if (Array.isArray(messages) && messages.length > 0) {
        transcript = messages
          .map((m: any) => `${m.sender === 'user' ? 'User' : 'Gemini'}: ${m.text}`)
          .join('\n\n');
      } else if (typeof entryText === 'string' && entryText.trim().length > 0) {
        transcript = `User: ${entryText.trim()}`;
      }

      if (!transcript.trim()) {
        res.status(400).json({ error: 'Journal content is required for sentiment analysis.' });
        return;
      }

      const systemInstruction = `You are an expert psychological sentiment analyst and emotional wellness synthesizer.
Evaluate the emotional landscape, mood, valence, and underlying thoughts in the provided journal entry.
Output strictly valid JSON with no markdown wrapping:
{
  "sentiment": "Calm / Optimistic / Contemplative / Joyful / Grateful / Anxious / Vulnerable / Fatigued",
  "moodCategory": "calm | uplifted | reflective | vulnerable | unsettled | neutral",
  "sentimentScore": 85,
  "sentimentSummary": "2-3 sentence empathetic summary analyzing the mood shifts, emotional tone, and mental state.",
  "sentimentKeywords": ["Keyword1", "Keyword2", "Keyword3"],
  "summary": "Concise 2-sentence narrative summary of the entry",
  "keyTakeaways": ["Emotional insight 1", "Emotional insight 2"],
  "actionItems": ["Self-care or mindful reflection suggestion"]
}`;

      const { text, modelUsed } = await generateContentWithFallback({
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: `Title: ${title}\n\nContent:\n${transcript}\n\nPerform the sentiment analysis.`,
              },
            ],
          },
        ],
        systemInstruction,
        temperature: 0.25,
      });

      let parsed: any;
      try {
        const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
        parsed = JSON.parse(cleaned);
      } catch (parseErr) {
        parsed = {
          sentiment: 'Reflective',
          moodCategory: 'reflective',
          sentimentScore: 75,
          sentimentSummary: 'A gentle, introspective entry focused on inner awareness and conscious processing.',
          sentimentKeywords: ['Introspective', 'Honest', 'Calm'],
          summary: 'Thoughtful journaling session observing emotions and daily experience.',
          keyTakeaways: ['Increased self-awareness through written expression.'],
          actionItems: ['Take a slow deep breath and honor how you feel.'],
        };
      }

      res.json({
        ...parsed,
        modelUsed,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error('[Error /api/gemini/sentiment-analyze]:', error);
      res.status(500).json({
        error: error?.message || 'Failed to complete sentiment analysis.',
      });
    }
  });

  // Audio Transcription Endpoint (gemini-3.5-transcribe)
  app.post('/api/gemini/transcribe', async (req: Request, res: Response) => {
    try {
      const data = (req.body && typeof req.body === 'object') ? req.body : {};
      const { audio = '', mimeType = 'audio/webm' } = data;

      if (!audio || typeof audio !== 'string') {
        res.status(400).json({ error: 'Audio base64 string is required.' });
        return;
      }

      const ai = getGeminiClient();
      const audioPart = {
        inlineData: {
          mimeType,
          data: audio,
        },
      };

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-transcribe',
        contents: {
          parts: [audioPart, { text: 'Transcribe this spoken audio verbatim into clean text for a personal journal reflection entry. Do not add commentary.' }],
        },
      });

      const transcript = response.text || '';
      res.json({ transcript: transcript.trim() });
    } catch (error: any) {
      console.error('[Error /api/gemini/transcribe]:', error);
      res.status(500).json({ error: error?.message || 'Failed to transcribe audio' });
    }
  });

  // Mindful Cycle Companion AI Coach Endpoint
  app.post('/api/gemini/cycle-coach', async (req: Request, res: Response) => {
    try {
      const data = (req.body && typeof req.body === 'object') ? req.body : {};
      const {
        phase = 'follicular',
        cycleDay = 1,
        flow = 'none',
        symptoms = [],
        moods = [],
        notes = '',
      } = data;

      const safePhase = String(phase).slice(0, 50);
      const safeSymptoms = Array.isArray(symptoms) ? symptoms.slice(0, 15).map(s => String(s).slice(0, 50)).join(', ') : '';
      const safeMoods = Array.isArray(moods) ? moods.slice(0, 15).map(m => String(m).slice(0, 50)).join(', ') : '';
      const safeNotes = String(notes).slice(0, 500);

      const systemInstruction = `You are the Mindful Cycle Companion AI Coach, a supportive, scientifically grounded, and warm somatic wellness companion for women.
Your purpose is to provide compassionate, phase-aware guidance on emotional regulation, self-care routines, nourishing foods, and gentle stress management.
Always speak in a soft, validating, non-judgmental tone.

Guidelines:
- Acknowledge their current hormonal phase: ${safePhase.toUpperCase()} (Day ${cycleDay}).
- Validate their logged emotional states (${safeMoods || 'Not specified'}) and physical markers (${safeSymptoms || 'None logged'}).
- Offer 2-3 gentle, practical, comforting suggestions (such as restorative yoga, warm tea, somatic breathwork, boundary-setting, magnesium-rich foods, or creative journaling).
- Close with a warm, grounding affirmation.
- Structure your response into 3 concise, beautifully formatted paragraphs with delicate bullet points where appropriate.
- Keep the tone gentle and respectful. Never diagnose or prescribe medical treatment.`;

      const userContent = `Here is my cycle log for today:
- Phase: ${safePhase} (Cycle Day ${cycleDay})
- Flow: ${flow}
- Physical Markers/Symptoms: ${safeSymptoms || 'None reported'}
- Emotional State: ${safeMoods || 'Normal'}
- Personal Note: ${safeNotes || 'No extra notes'}

Please provide your empathetic, phase-aware coaching reflection.`;

      const { text, modelUsed } = await generateContentWithFallback({
        contents: [
          {
            role: 'user',
            parts: [{ text: userContent }],
          },
        ],
        systemInstruction,
        temperature: 0.6,
      });

      res.json({
        advice: text,
        modelUsed,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error('[Error /api/gemini/cycle-coach]:', error);
      res.status(500).json({
        error: error?.message || 'Failed to generate cycle coaching insights.',
      });
    }
  });

  // Vite middleware for development or static serving for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Create HTTP & WebSocket Server for Live Voice API
  const server = http.createServer(app);
  const wss = new WebSocketServer({ noServer: true });

  server.on('upgrade', (request, socket, head) => {
    try {
      const url = new URL(request.url || '', `http://${request.headers.host || 'localhost'}`);
      if (url.pathname === '/api/live') {
        wss.handleUpgrade(request, socket, head, (ws) => {
          wss.emit('connection', ws, request);
        });
      }
    } catch (err) {
      console.error('Error during WebSocket upgrade:', err);
    }
  });

  wss.on('connection', async (clientWs: WebSocket) => {
    console.log('[Live API] Client connected for voice journaling.');
    let session: any = null;
    let isSessionReady = false;
    const queuedAudio: string[] = [];

    const flushQueue = () => {
      if (session && isSessionReady) {
        while (queuedAudio.length > 0) {
          const chunk = queuedAudio.shift();
          if (chunk) {
            try {
              session.sendRealtimeInput({
                audio: { data: chunk, mimeType: 'audio/pcm;rate=16000' },
              });
            } catch (err) {
              console.warn('[Live API] Error flushing audio chunk:', err);
            }
          }
        }
      }
    };

    try {
      const ai = getGeminiClient();

      session = await ai.live.connect({
        model: 'gemini-3.1-flash-live-preview',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
          },
          systemInstruction: `You are Gemini Reflection Companion, an empathetic, warm, and attentive voice journaling companion.
The user is speaking to you directly to journal their thoughts without typing anything.
- Keep your spoken answers conversational, comforting, and concise (1-3 sentences).
- Help the user unpack what they are feeling, celebrate wins, or explore challenging moments.
- Ask gentle, open follow-up questions to help them reflect deeper.
- Speak naturally and warmly.`,
        },
        callbacks: {
          onmessage: (message: LiveServerMessage) => {
            if (clientWs.readyState !== WebSocket.OPEN) return;

            // Handle setup complete
            if ((message as any).setupComplete) {
              isSessionReady = true;
              clientWs.send(JSON.stringify({ type: 'ready' }));
              flushQueue();
              return;
            }

            // 1. Model Audio Output (24kHz PCM linear 16-bit) and Transcript
            const parts = message.serverContent?.modelTurn?.parts || [];
            for (const part of parts) {
              if (part.inlineData?.data) {
                clientWs.send(JSON.stringify({ type: 'audio', audio: part.inlineData.data }));
              }
              if (part.text) {
                clientWs.send(JSON.stringify({ type: 'model_transcript', text: part.text }));
              }
            }

            // 2. Interruption flag
            if (message.serverContent?.interrupted) {
              clientWs.send(JSON.stringify({ type: 'interrupted' }));
            }

            // 3. Turn complete
            if (message.serverContent?.turnComplete) {
              clientWs.send(JSON.stringify({ type: 'turn_complete' }));
            }
          },
          onclose: () => {
            console.log('[Live API] Gemini session closed.');
            if (clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(JSON.stringify({ type: 'closed' }));
            }
          },
          onerror: (err: any) => {
            console.error('[Live API] Session error:', err);
            if (clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(JSON.stringify({ type: 'error', error: err?.message || 'Live session error' }));
            }
          },
        },
      });

      isSessionReady = true;
      if (clientWs.readyState === WebSocket.OPEN) {
        clientWs.send(JSON.stringify({ type: 'ready' }));
      }
      flushQueue();

      clientWs.on('message', (data: any) => {
        try {
          const parsed = JSON.parse(data.toString());

          // Extract audio chunk from various valid payload formats
          let audioChunk: string | null = null;
          if (typeof parsed.audio === 'string' && parsed.audio.length > 0) {
            audioChunk = parsed.audio;
          } else if (typeof parsed.data === 'string' && parsed.data.length > 0) {
            audioChunk = parsed.data;
          } else if (Array.isArray(parsed.media_chunks) && parsed.media_chunks[0]?.data) {
            audioChunk = parsed.media_chunks[0].data;
          } else if (Array.isArray(parsed.mediaChunks) && parsed.mediaChunks[0]?.data) {
            audioChunk = parsed.mediaChunks[0].data;
          }

          if (audioChunk) {
            if (session && isSessionReady) {
              session.sendRealtimeInput({
                audio: { data: audioChunk, mimeType: 'audio/pcm;rate=16000' },
              });
            } else {
              if (queuedAudio.length < 100) {
                queuedAudio.push(audioChunk);
              }
            }
          } else if (parsed.type === 'text' && typeof parsed.text === 'string' && parsed.text.trim()) {
            if (session) {
              session.sendClientContent({
                turns: [
                  {
                    role: 'user',
                    parts: [{ text: parsed.text.trim() }],
                  },
                ],
                turnComplete: true,
              });
            }
          } else if (parsed.type === 'interrupt' && session) {
            // User interrupted playback
          } else if (parsed.type === 'end') {
            session?.close();
          }
        } catch (e) {
          console.warn('[Live API] Error handling client message:', e);
        }
      });

      clientWs.on('close', () => {
        console.log('[Live API] Client disconnected.');
        try {
          session?.close();
        } catch {
          // ignore
        }
      });

      clientWs.on('error', (err) => {
        console.warn('[Live API] Client socket error:', err);
        try {
          session?.close();
        } catch {
          // ignore
        }
      });
    } catch (err: any) {
      console.error('[Live API] Failed to establish Live session:', err);
      if (clientWs.readyState === WebSocket.OPEN) {
        clientWs.send(JSON.stringify({
          type: 'error',
          error: err?.message || 'Failed to initialize Gemini Live session. Check your GEMINI_API_KEY.',
        }));
        clientWs.close();
      }
    }
  });

  server.listen(PORT, 'localhost', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
