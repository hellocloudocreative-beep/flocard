/* ==========================================================================
   FLOCARD AI CONCIERGE — SECURE SERVER-SIDE HANDLER
   Communicates with real AI providers (Gemini, OpenAI, Groq, Anthropic)
   strictly on the server. Never exposes API keys to client-side bundles.
   Includes in-memory rate limiting, payload validation, and strict catalog adherence.
   ========================================================================== */

import { EDITIONS, TEMPLATES, BRAND } from '../lib/constants.js';

// In-memory rate limiting map: ip -> { count, resetTime }
const rateLimitMap = new Map();
const RATE_LIMIT_MAX = 30; // max 30 requests per minute
const RATE_LIMIT_WINDOW = 60 * 1000;

function checkRateLimit(ip) {
  const now = Date.now();
  const record = rateLimitMap.get(ip) || { count: 0, resetTime: now + RATE_LIMIT_WINDOW };

  if (now > record.resetTime) {
    record.count = 1;
    record.resetTime = now + RATE_LIMIT_WINDOW;
    rateLimitMap.set(ip, record);
    return true;
  }

  if (record.count >= RATE_LIMIT_MAX) {
    return false;
  }

  record.count += 1;
  rateLimitMap.set(ip, record);
  return true;
}

export function getAiConfigStatus() {
  const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;
  const groqKey = process.env.GROQ_API_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;

  if (geminiKey) return { configured: true, provider: 'Google Gemini' };
  if (openaiKey) return { configured: true, provider: 'OpenAI' };
  if (groqKey) return { configured: true, provider: 'Groq' };
  if (anthropicKey && anthropicKey !== 'omniroute') return { configured: true, provider: 'Anthropic' };

  return {
    configured: false,
    provider: null,
    message: 'AI provider is not configured. Add GEMINI_API_KEY or OPENAI_API_KEY to your .env file or server environment variables.'
  };
}

const SYSTEM_PROMPT = `You are the official FLOCARD AI Concierge, a knowledgeable, sophisticated assistant for FLOCARD (flocard.in) — the luxury NFC smart business card and digital identity platform.

FLOCARD BRAND PHILOSOPHY:
- Tagline: "One Tap. Every Connection."
- Aesthetics: Luxury Cosmic Obsidian, Deep Violet, Luminous Purple, Matte Finishes.
- Chip: NXP NTAG216 High Frequency 13.56 MHz (888 Bytes usable EEPROM, waterproof IP68, 100,000 tap cycles).
- No app needed for recipients: One tap on any iPhone/Android opens their verified profile and vCard.

ACTUAL FLOCARD CATALOG EDITIONS:
1. "purple" (Purple Edition - Signature):
   - Tagline: "Our signature theme with a luminous deep-purple & obsidian finish."
   - Surface: Matte Obsidian with Ultraviolet UV Gloss Accent.
   - Persona: Modern, creative, technology-oriented, innovators, founders, digital leaders.
   - Colors: Primary #A855F7, Secondary #6B00FF, Text #FFFFFF.
2. "gold" (Gold Edition - Luxury):
   - Tagline: "A bold and luxurious design for professionals who stand out."
   - Surface: Obsidian Matte Polymer with 24K Gold Edge Foil & Dual-Tone Brushed Metal.
   - Persona: Premium, executive, luxury-oriented, partners, real estate directors, private wealth advisors.
   - Colors: Primary #D4AF37, Secondary #AA820A, Text #F5E6BE.
3. "platinum" (Platinum Edition - Modern):
   - Tagline: "A sleek and modern look for forward-thinking professionals."
   - Surface: Satin Stainless Steel & Polymer Hybrid with Precision Laser Etched Frosted Luster.
   - Persona: Understated, minimal, professional, engineers, architects, medical specialists, corporate executives.
   - Colors: Primary #E2E8F0, Secondary #94A3B8, Text #FFFFFF.

CARD TEMPLATES:
- "standard": Standard FLOCARD Design (Without Customer Logo). Clean front with Name, Role, Tagline, NFC icon. Back with FLOCARD logo & QR code.
- "customer_logo": Customer Logo Design (With Customer Logo). Prominent Customer Logo emblem, NFC icon, Tagline on front. Name, Role, FLOCARD logo, and QR on back.

APPROVED FONT SELECTION:
- 'Space Grotesk' (Modern Tech & Bold)
- 'Sora' (Geometric Luxury)
- 'Inter' (Ultra Clean & Minimal)
- 'Outfit' (Contemporary Editorial)
- 'Plus Jakarta Sans' (Sleek Corporate)
- 'Cinzel' (Regal Roman Classical)
- 'Playfair Display' (Luxury Serif)
- 'Montserrat' (Geometric Bold)

STRICT RULES:
1. Only recommend editions, finishes, and specs from the genuine catalog above. Never invent materials or specs.
2. When asked for bios/taglines, provide editable drafts. Never invent fake qualifications, degrees, or awards. Handle missing details gracefully.
3. Provide answers in conversational, helpful, and concise language.
4. When relevant, you can include structured JSON suggestions in a markdown code block tagged \`\`\`json:flocard_suggestion ... \`\`\` containing:
{
  "recommendation": {
    "edition": "purple" | "gold" | "platinum",
    "templateType": "standard" | "customer_logo",
    "explanation": "Why this edition and template fits their profession/goal"
  },
  "bio": {
    "shortBio": "Editable 2-sentence bio",
    "profileIntro": "Engaging profile opening",
    "businessDescription": "What their company/practice does",
    "tagline": "Short professional punchline",
    "serviceDescriptions": ["Service 1", "Service 2"],
    "cardTagline": "One Tap Every Connection or custom"
  },
  "designSuggestions": {
    "edition": "purple" | "gold" | "platinum",
    "templateType": "standard" | "customer_logo",
    "fontFamily": "Space Grotesk",
    "roleFontFamily": "Inter",
    "tagline": "...",
    "showTagline": true,
    "customerLogoSize": 100,
    "flocardLogoPosition": "bottom-right",
    "nfcPosition": "top-right"
  }
}
`;

export async function handleAiConciergeRequest(req, res) {
  // Read client IP for rate limiting
  const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '127.0.0.1';
  if (!checkRateLimit(ip)) {
    res.statusCode = 429;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      error: 'Rate limit exceeded. Please wait a moment before sending more messages to the AI Concierge.'
    }));
    return;
  }

  // Process payload
  const handlePayload = async (rawInput) => {
    try {
      const payload = typeof rawInput === 'object' && rawInput !== null ? rawInput : (rawInput ? JSON.parse(rawInput) : {});
      const {
        action = 'chat',
        message = '',
        history = [],
        profileInputs = null,
        designContext = null
      } = payload;

      if (action === 'chat' && !message && !profileInputs) {
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'Missing required message or inputs in request payload.' }));
        return;
      }

      const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
      const openaiKey = process.env.OPENAI_API_KEY;
      const groqKey = process.env.GROQ_API_KEY;
      const anthropicKey = process.env.ANTHROPIC_API_KEY;

      const isConfigured = Boolean(geminiKey || openaiKey || groqKey || (anthropicKey && anthropicKey !== 'omniroute'));

      if (!isConfigured) {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({
          configured: false,
          provider: null,
          error: 'FLOCARD AI Concierge is not configured with an API key. Please add GEMINI_API_KEY or OPENAI_API_KEY to your .env file.',
          setupInstructions: [
            '1. Get a Gemini API key at https://aistudio.google.com/app/apikey (free tier available)',
            '2. Add GEMINI_API_KEY=your_key_here to the .env file in project root',
            '3. Restart the server. The AI Concierge will automatically activate.'
          ]
        }));
        return;
      }

      // Construct prompt based on action
      let userPrompt = message;
      if (action === 'generate_bio' && profileInputs) {
        userPrompt = `Please generate professional digital bio assets for me based on these inputs:
Name: ${profileInputs.name || 'Not specified'}
Profession: ${profileInputs.profession || 'Professional'}
Company: ${profileInputs.company || 'Not specified'}
Skills/Specialties: ${profileInputs.skills || 'Not specified'}
Target Audience: ${profileInputs.targetAudience || 'Clients & Colleagues'}
Preferred Tone: ${profileInputs.tone || 'Professional'}

Generate:
1. A concise, polished short bio (2-3 sentences).
2. A digital profile introduction.
3. A business/service description.
4. Two service bullet points.
5. A punchy card tagline (max 6-8 words).

Include the json:flocard_suggestion block with the "bio" field populated so I can review, edit, and apply it directly.`;
      } else if (action === 'recommend' || action === 'design_suggestions') {
        userPrompt = `${message || 'Recommend the ideal FLOCARD edition, template, and design combination based on my needs.'}
Current design context: ${JSON.stringify(designContext || {})}.
Include the json:flocard_suggestion block with "recommendation" and "designSuggestions" fields so I can review and apply them directly.`;
      }

      // Call configured provider
      let aiResponseText = '';
      let providerName = '';

      if (geminiKey) {
        providerName = 'Google Gemini';
        aiResponseText = await callGemini(geminiKey, SYSTEM_PROMPT, history, userPrompt);
      } else if (groqKey) {
        providerName = 'Groq';
        aiResponseText = await callOpenAiCompatible('https://api.groq.com/openai/v1/chat/completions', groqKey, 'llama-3.3-70b-versatile', SYSTEM_PROMPT, history, userPrompt);
      } else if (openaiKey) {
        providerName = 'OpenAI';
        aiResponseText = await callOpenAiCompatible('https://api.openai.com/v1/chat/completions', openaiKey, 'gpt-4o-mini', SYSTEM_PROMPT, history, userPrompt);
      } else if (anthropicKey) {
        providerName = 'Anthropic';
        aiResponseText = await callAnthropic(anthropicKey, SYSTEM_PROMPT, history, userPrompt);
      }

      // Parse structured suggestion if embedded in response
      let parsedSuggestion = null;
      const jsonMatch = aiResponseText.match(/```json:flocard_suggestion\s*([\s\S]*?)\s*```/) ||
                         aiResponseText.match(/```json\s*(\{[\s\S]*?"recommendation"[\s\S]*?\})\s*```/);
      if (jsonMatch && jsonMatch[1]) {
        try {
          parsedSuggestion = JSON.parse(jsonMatch[1]);
        } catch {
          // Ignore parsing error
        }
      }

      // Clean display text (remove raw codeblock from conversational bubble if parsed)
      const cleanText = aiResponseText.replace(/```json:flocard_suggestion[\s\S]*?```/g, '').trim();

      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({
        success: true,
        configured: true,
        provider: providerName,
        text: cleanText || aiResponseText,
        suggestion: parsedSuggestion,
        rawResponse: aiResponseText
      }));
    } catch (err) {
      console.error('[AI Concierge Server Error]', err);
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({
        configured: true,
        error: `AI provider encountered an error: ${err.message || 'Request failed'}`
      }));
    }
  };

  if (req.body) {
    handlePayload(req.body);
    return;
  }

  let body = '';
  req.on('data', chunk => {
    body += chunk;
    if (body.length > 1e6) {
      req.destroy();
    }
  });

  req.on('end', () => {
    handlePayload(body);
  });

  req.on('error', err => {
    console.error('[AI Concierge Request Error]', err);
    if (!res.headersSent) {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Failed to read request stream.' }));
    }
  });
}

// Provider Helpers
async function callGemini(apiKey, systemPrompt, history, prompt) {
  const models = ['gemini-2.5-flash-lite', 'gemini-flash-latest', 'gemini-3.8-flash'];

  const contents = [];
  // Add system instruction as first user/model turn
  contents.push({
    role: 'user',
    parts: [{ text: `SYSTEM INSTRUCTIONS:\n${systemPrompt}` }]
  });
  contents.push({
    role: 'model',
    parts: [{ text: "Understood. I am the FLOCARD AI Concierge and will assist clients with precision, using FLOCARD's real product options and generating editable drafts." }]
  });

  // Recent history
  if (Array.isArray(history)) {
    history.slice(-6).forEach(msg => {
      contents.push({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content || msg.text || '' }]
      });
    });
  }

  // Current turn
  contents.push({
    role: 'user',
    parts: [{ text: prompt }]
  });

  let lastError = null;
  for (const modelName of models) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          contents,
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1024
          }
        })
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData?.error?.message || `Gemini API returned status ${response.status}`);
      }

      const data = await response.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) {
        return text;
      }
    } catch (err) {
      lastError = err;
      console.warn(`[FLOCARD AI Concierge] Gemini model ${modelName} failed, trying fallback:`, err.message);
    }
  }

  throw lastError || new Error('No content returned from Gemini models.');
}

async function callOpenAiCompatible(endpoint, apiKey, model, systemPrompt, history, prompt) {
  const messages = [
    { role: 'system', content: systemPrompt }
  ];

  if (Array.isArray(history)) {
    history.slice(-6).forEach(msg => {
      messages.push({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content || msg.text || ''
      });
    });
  }

  messages.push({ role: 'user', content: prompt });

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.7,
      max_tokens: 1024
    })
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData?.error?.message || `API error ${response.status}`);
  }

  const data = await response.json();
  return data?.choices?.[0]?.message?.content || '';
}

async function callAnthropic(apiKey, systemPrompt, history, prompt) {
  const messages = [];
  if (Array.isArray(history)) {
    history.slice(-6).forEach(msg => {
      messages.push({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content || msg.text || ''
      });
    });
  }
  messages.push({ role: 'user', content: prompt });

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-20241022',
      system: systemPrompt,
      messages,
      max_tokens: 1024
    })
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData?.error?.message || `Anthropic API error ${response.status}`);
  }

  const data = await response.json();
  return data?.content?.[0]?.text || '';
}
