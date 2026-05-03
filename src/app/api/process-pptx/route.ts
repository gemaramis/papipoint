import { NextResponse } from 'next/server';
import { parseOffice } from 'officeparser';

// ── OpenRouter Config ─────────────────────────────────────────────────────────
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

// Model registry — add/remove freely
// All `:free` models are completely free with an OpenRouter API key
const MODELS: Record<string, { id: string; isVision: boolean; label: string }> = {
  'sonnet': { id: 'anthropic/claude-3.5-sonnet', isVision: true, label: 'Claude 3.5 Sonnet' },
  'gpt4o': { id: 'openai/gpt-4o', isVision: true, label: 'GPT-4o' },
  'o1pro': { id: 'openai/o1-pro', isVision: true, label: 'OpenAI o1' },
  'deepseek': { id: 'deepseek/deepseek-chat', isVision: false, label: 'DeepSeek V3' },
  'kimi': { id: 'moonshotai/kimi-latest', isVision: false, label: 'Kimi Latest' },
  'gemma4': { id: 'google/gemma-4-26b-a4b-it:free', isVision: true, label: 'Gemma 4 26B' },
  'llama': { id: 'meta-llama/llama-3.3-70b-instruct:free', isVision: false, label: 'Llama 3.3 70B' },
  'qwen': { id: 'qwen/qwen3-next-80b-a3b-instruct:free', isVision: false, label: 'Qwen 3 Next' },
  'hunyuan': { id: 'tencent/hy3-preview:free', isVision: false, label: 'Hunyuan Hy3' },
  'nemotron': { id: 'nvidia/nemotron-nano-12b-v2-vl:free', isVision: true, label: 'Nemotron Nano' },
  // Vision fallback (used automatically when reference image is uploaded)
  'vision': { id: 'anthropic/claude-3.5-sonnet', isVision: true, label: 'Claude 3.5 Sonnet (Vision)' },
};

interface AIResponse {
  title?: string;
  slides?: Array<{
    title?: string;
    subtitle?: string;
    bullets?: string[];
    imagePrompt?: string;
  }>;
}

const DEFAULT_MODEL = 'sonnet';

// ── Prompt Builder ────────────────────────────────────────────────────────────
function buildSystemPrompt(): string {
  return `[ignoring loop detection]
You are a world-class presentation designer specializing in modern, minimalist, and visually impactful slides similar to Gamma, Canva, and SlidesGo.
Your goal is to transform raw PowerPoint text into a cohesive, professional presentation with consistent styling, clear visual hierarchy, and engaging content.

DESIGN PHILOSOPHY:
- Modern Aesthetics: Use clean lines, ample white space, and consistent typography (sans-serif, 24-32pt for titles, 16-20pt for body).
- Visual Consistency: Maintain a unified color palette (2-3 primary colors) across all slides. Avoid conflicting styles.
- Content Hierarchy: Titles should be bold, concise (max 6 words). Subtitles provide context (1 sentence max). Bullets are action-oriented, 3-5 per slide, no fluff.
- Narrative Flow: Follow a logical structure: Title → Introduction → Problem → Solution → Evidence → Future → Call to Action → Closing.
- Backgrounds: Use abstract, high-quality 16:9 images with no embedded text. Ensure readability with subtle overlays if needed.

TECHNICAL RULES:
- Output RAW JSON ONLY. No markdown, no commentary, no extra text.
- JSON must be strictly valid. Follow the required schema exactly.`;
}

function buildUserPrompt(goal: string, instructions: string, visionNote: string, rawText: string, persona: string): string {
  const personas: Record<string, string> = {
    'corporate': `STYLE: Formal, Polished, and Authoritative.
- Tone: Professional, direct, and high-trust.
- Language: Executive-level vocabulary, focus on ROI, scale, and stability.
- Titles: Clear and commanding.`,
    'creative': `STYLE: Evocative, Bold, and Story-driven.
- Tone: Inspirational, emotional, and boundary-pushing.
- Language: Rich metaphors, vivid imagery, and cinematic phrasing.
- Titles: "Hook" style headers that spark curiosity.`,
    'tech': `STYLE: Disruptive, Forward-leaning, and Edgy.
- Tone: High-energy, futuristic, and fast-paced.
- Language: Innovation-focused, data-driven but visionary, tech-optimist.
- Titles: Short, punchy, and impactful.`,
    'minimalist': `STYLE: Clean, Direct, and Essential.
- Tone: Sophisticated, quiet, and high-clarity.
- Language: Precise, minimal, and zero-fluff.
- Titles: Single powerful words or very short phrases.`
  };

  const personaGuideline = personas[persona] || personas.corporate;

  return `I am handing you raw text from a PowerPoint. 
Your mission: REIMAGINE this as a premium, high-production presentation.

${personaGuideline}

CORE GOAL: ${goal}
SPECIFIC CREATIVE DIRECTION: ${instructions}${visionNote}

EDITORIAL GUIDELINES:
- Title: Follow the persona style above. Max 6 words. Bold, clear hierarchy.
- Subtitle: One punchy sentence (max 12 words) that provides deeper insight or context.
- Bullets: 3-5 "Impact Points" per slide. Action-oriented, concise, no filler. Use parallel structure.
- imagePrompt: Create a high-quality, 16:9 background image prompt suitable for presentation slides (no text, no cluttered elements).
  * Use abstract or metaphorical visuals (e.g., "minimalist gradient blue background with floating geometric shapes").
  * Specify: [Subject/Style], [Color Palette], [Lighting], [Mood], [Resolution: 1920x1080].
  * Avoid stock photo clichés, text overlays, or busy patterns.

STRUCTURE:
1. Title Slide: A stunning, high-concept entry point.
2. Narrative Arc: Intro -> Problem -> Solution -> Evidence -> Future -> Call to Action.
3. Closing Slide: A memorable finale.

RAW EXTRACTED CONTENT:
${rawText.substring(0, 14000)}

REQUIRED JSON SCHEMA:
{
  "title": "The Master Presentation Title",
  "slides": [
    {
      "title": "Slide Title",
      "subtitle": "Slide Subtitle",
      "bullets": ["Point 1", "Point 2"],
      "imagePrompt": "Cinematic 16:9 [Metaphorical Subject], [Art Style], [Specific Lighting], [Mood]"
    }
  ]
}`;
}

// ── OpenRouter API Call (single attempt) ─────────────────────────────────────
async function callOpenRouter(
  apiKey: string,
  modelId: string,
  systemPrompt: string,
  userPrompt: string,
  base64Image?: string
): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userContent: any = base64Image
    ? [
      { type: 'text', text: userPrompt },
      { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${base64Image}` } },
    ]
    : userPrompt;

  const res = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': 'https://papipoint.app',
      'X-Title': 'Papipoint AI',
    },
    body: JSON.stringify({
      model: modelId,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContent },
      ],
      temperature: 0.7, // Even more creative
      response_format: { type: 'json_object' },
    }),
  });

  if (!res.ok) {
    const errBody = await res.text();
    console.error(`OpenRouter error ${res.status}:`, errBody);
    throw new Error(`OpenRouter API error ${res.status}: ${errBody}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content?.trim() || '';
}

// ── Retry wrapper with model fallback ────────────────────────────────────────
const FALLBACK_ORDER = ['sonnet', 'gpt4o', 'deepseek', 'gemma4', 'llama', 'qwen', 'kimi'];

async function callWithFallback(
  apiKey: string,
  preferredModelKey: string,
  systemPrompt: string,
  userPrompt: string,
  base64Image?: string
): Promise<string> {
  // Build attempt order: preferred first, then fallbacks
  const order = [
    preferredModelKey,
    ...FALLBACK_ORDER.filter((k) => k !== preferredModelKey),
  ];

  let lastError = '';
  for (const modelKey of order) {
    const model = MODELS[modelKey];
    if (!model) continue;
    // Skip non-vision models when image is provided
    if (base64Image && !model.isVision && modelKey !== order[0]) continue;

    try {
      console.log(`[Papipoint] Trying model: ${model.id}`);
      const result = await callOpenRouter(apiKey, model.id, systemPrompt, userPrompt, base64Image);
      if (result) return result;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      lastError = errorMessage;
      console.warn(`[Papipoint] Model ${model.id} failed:`, lastError);
      // Continue to next fallback
    }
  }
  throw new Error(`All models failed. Last error: ${lastError}`);
}

// ── Main Route ────────────────────────────────────────────────────────────────
export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const mode = (formData.get('mode') as string) || 'reimagine';
    const goal = (formData.get('goal') as string) || 'Professional & Modern';
    const instructions = (formData.get('instructions') as string) || 'None';
    const aiModelKey = (formData.get('aiModel') as string) || DEFAULT_MODEL;
    const persona = (formData.get('persona') as string) || 'corporate';
    const customApiKey = (formData.get('customApiKey') as string) || '';
    const referenceImage = formData.get('referenceImage') as File | null;

    // ── Validation ──────────────────────────────────────────
    if (!file) return NextResponse.json({ detail: 'No file uploaded' }, { status: 400 });
    if (!file.name.endsWith('.pptx')) return NextResponse.json({ detail: 'Only .pptx files are supported' }, { status: 400 });

    const apiKey = customApiKey || process.env.OPENROUTER_API_KEY || '';
    if (mode === 'reimagine' && !apiKey) {
      return NextResponse.json({ detail: 'API key not configured. Please provide a custom key or contact the admin.' }, { status: 401 });
    }

    // ── 1. Extract text from PPTX ───────────────────────────
    const buffer = Buffer.from(await file.arrayBuffer());
    let rawText: unknown = '';
    try {
      rawText = await parseOffice(buffer);
      if (typeof rawText !== 'string') {
        rawText = JSON.stringify(rawText);
      }
    } catch {
      return NextResponse.json({ detail: 'Failed to extract text from PPTX. The file may be corrupted.' }, { status: 400 });
    }

    const rawTextStr = rawText as string;
    if (!rawTextStr?.trim()) {
      return NextResponse.json({ detail: 'No readable text found in this presentation.' }, { status: 400 });
    }

    // ── 2a. Manual mode — no AI ─────────────────────────────
    if (mode === 'manual') {
      const chunks = rawTextStr.split(/\n\s*\n/).filter((c: string) => c.trim().length > 0);
      const slides = chunks.map((chunk: string, i: number) => {
        const lines = chunk.split('\n').filter((l: string) => l.trim().length > 0);
        return {
          title: lines[0] || `Slide ${i + 1}`,
          subtitle: '',
          bullets: lines.slice(1),
          imagePrompt: `Professional presentation slide background for topic: ${lines[0] || `slide ${i + 1}`}`,
        };
      });
      return NextResponse.json({ title: file.name.replace(/\.pptx$/i, ''), slides });
    }

    // ── 2b. Reimagine mode — call OpenRouter ────────────────
    let base64Image = '';
    let visionNote = '';
    let selectedModelKey = (MODELS[aiModelKey] ? aiModelKey : DEFAULT_MODEL);

    if (referenceImage) {
      base64Image = Buffer.from(await referenceImage.arrayBuffer()).toString('base64');
      visionNote = '\n\nVISION REFERENCE: I am providing a reference image. Analyse its colour palette, typography style, layout structure, and overall tone. Restructure the presentation to perfectly mimic that aesthetic.';
      // Auto-upgrade to a vision-capable model if the selected one isn't
      if (!MODELS[selectedModelKey].isVision) {
        selectedModelKey = 'vision';
      }
    }

    const systemPrompt = buildSystemPrompt();
    const userPrompt = buildUserPrompt(goal, instructions, visionNote, rawTextStr, persona);

    let rawJson = await callWithFallback(
      apiKey,
      selectedModelKey,
      systemPrompt,
      userPrompt,
      base64Image || undefined
    );

    // Clean stray markdown wrappers (some models ignore response_format)
    rawJson = rawJson
      .replace(/^```(?:json)?[\s\n]*/gi, '')
      .replace(/[\s\n]*```$/g, '')
      .trim();

    // Handle double-encoded strings
    if (rawJson.startsWith('"')) {
      try { rawJson = JSON.parse(rawJson); } catch { /* ignore */ }
    }

    let parsedJson: AIResponse;
    try {
      parsedJson = JSON.parse(rawJson) as AIResponse;
    } catch {
      console.error('AI returned invalid JSON:', rawJson.substring(0, 600));
      return NextResponse.json({
        detail: 'The AI returned a malformed response. Try again or switch models.',
      }, { status: 500 });
    }

    // Ensure slides array exists
    if (!parsedJson.slides || !Array.isArray(parsedJson.slides)) {
      return NextResponse.json({ detail: 'AI response missing slides array.' }, { status: 500 });
    }

    return NextResponse.json(parsedJson);

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    console.error('API Route Error:', error);
    return NextResponse.json({ detail: errorMessage }, { status: 500 });
  }
}
