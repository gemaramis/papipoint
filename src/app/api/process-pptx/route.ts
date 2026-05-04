import { NextResponse } from 'next/server';
import { parseOffice } from 'officeparser';

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

// Verified working models on OpenRouter (removed 404ing Claude)
const MODELS: Record<string, { id: string; isVision: boolean; label: string }> = {
  'gpt4o': { id: 'openai/gpt-4o', isVision: true, label: 'GPT-4o' },
  'gpt41': { id: 'openai/gpt-4.1', isVision: true, label: 'GPT-4.1' },
  'gemma': { id: 'google/gemma-3-27b-it:free', isVision: true, label: 'Gemma 3 27B' },
  'deepseek': { id: 'deepseek/deepseek-chat', isVision: false, label: 'DeepSeek V3' },
  'llama': { id: 'meta-llama/llama-3.3-70b-instruct:free', isVision: false, label: 'Llama 3.3 70B' },
  'nemotron': { id: 'nvidia/nemotron-nano-12b-v2-vl:free', isVision: true, label: 'Nemotron Nano' },
  'vision': { id: 'openai/gpt-4o', isVision: true, label: 'GPT-4o (Vision)' },
};

interface SlideData {
  title?: string;
  subtitle?: string;
  bullets?: string[];
  imagePrompt?: string;
}

interface AIResponse {
  title?: string;
  slides?: SlideData[];
  brandEssence?: {
    brandName: string;
    tagline: string;
    colors: string[];
    mood: string;
    style: string;
  };
}

interface BrandEssence {
  brandName: string;
  tagline: string;
  colors: string[];
  mood: string;
  style: string;
  values: string[];
  audience: string;
  industry: string;
}

const DEFAULT_MODEL = 'gpt4o';

// ── Helper: Call OpenRouter ──────────────────────────────────────────────
async function callOpenRouter(
  apiKey: string,
  modelId: string,
  systemPrompt: string,
  userPrompt: string,
  base64Image?: string
): Promise<string> {
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
      temperature: 0.9,
      response_format: { type: 'json_object' },
    }),
  });

  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`OpenRouter API error ${res.status}: ${errBody}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content?.trim() || '';
}

// ── Retry wrapper with model fallback (using callback pattern) ──────────────────
const FALLBACK_ORDER = ['gpt41', 'gemma', 'nemotron', 'deepseek', 'llama'];

async function callWithFallback(
  apiKey: string,
  preferredModelKey: string,
  apiCallFunction: (modelId: string) => Promise<any>
): Promise<any> {
  const order = [
    preferredModelKey,
    ...FALLBACK_ORDER.filter((k) => k !== preferredModelKey),
  ];

  let lastError = '';
  for (const modelKey of order) {
    const model = MODELS[modelKey];
    if (!model) continue;

    try {
      console.log(`[Papipoint] Trying model: ${model.id}`);
      const result = await apiCallFunction(model.id);
      if (result) return result;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      lastError = errorMessage;
      console.warn(`[Papipoint] Model ${model.id} failed:`, lastError);
    }
  }
  throw new Error(`All models failed. Last error: ${lastError}`);
}

// ── Step 1: Extract Brand Essence (IMPROVED) ────────────────────────────────
async function extractBrandEssence(apiKey: string, rawText: string, modelId: string): Promise<BrandEssence> {
  const systemPrompt = `You are a WORLD-CLASS brand strategist who has worked with Nike, Apple, and Tesla. Your job is to extract the EXACT brand name and essence from the content.

CRITICAL RULES:
- The brand name MUST be EXACT - look for logos, headers, footers, consistent text at top of slides
- If "Mercusuar" or garbled text appears, IGNORE IT - find the REAL brand name
- Look for: Logo text, header text that repeats, copyright notices, consistent branding

OUTPUT: Valid JSON only, no markdown.

JSON SCHEMA:
{
  "brandName": "EXACT brand name (e.g., 'Nike', 'Apple', 'Imajinari')",
  "tagline": "Powerful 5-8 word tagline that captures the brand's soul",
  "colors": ["#hexcolor1", "#hexcolor2", "#hexcolor3"],
  "mood": "2-3 words (e.g., 'Bold & Disruptive')",
  "style": "Visual style (e.g., 'Minimalist Luxury')",
  "values": ["value1", "value2", "value3"],
  "audience": "Who they target",
  "industry": "Specific industry"
}`;

  const userPrompt = `Find the REAL brand name and essence in this content. IGNORE garbled text like "Mercusuar" - find what's actually on their slides.

CONTENT:
${rawText.substring(0, 8000)}`;

  const res = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': 'https://papipoint.app',
      'X-Title': 'Papipoint Brand Analysis',
    },
    body: JSON.stringify({
      model: modelId,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' },
    }),
  });

  if (!res.ok) {
    throw new Error(`Brand extraction failed: ${res.status}`);
  }

  const data = await res.json();
  const rawJson = data.choices?.[0]?.message?.content?.trim() || '';

  try {
    return JSON.parse(rawJson) as BrandEssence;
  } catch {
    // Return defaults if parsing fails
    return {
      brandName: 'Brand',
      tagline: 'Innovation in Action',
      colors: ['#1a237e', '#ff6f61', '#ffffff'],
      mood: 'Professional & Bold',
      style: 'Modern Corporate',
      values: ['Innovation', 'Excellence', 'Trust'],
      audience: 'Business professionals',
      industry: 'Technology',
    };
  }
}

// ── Step 2: Design Slides (WILDLY CREATIVE) ───────────────────────────
async function designSlides(
  apiKey: string,
  rawText: string,
  brand: BrandEssence,
  modelId: string,
  persona: string
): Promise<AIResponse> {
  const personaGuides: Record<string, string> = {
    corporate: 'Formal, Polished, Authoritative. Executive-level vocabulary, ROI-focused.',
    creative: 'WILDLY CREATIVE. Use RICH METAPHORS, vivid imagery, cinematic language. Push boundaries!',
    tech: 'Disruptive, Edgy, Futuristic. ANTI-CORPORATE. Innovation-obsessed, tech-optimist.',
    minimalist: 'Clean, Direct, Essential. RADICAL minimalism. Bold white space, zero-fluff.',
  };

  const personaGuide = personaGuides[persona] || personaGuides.corporate;

  const systemPrompt = `You are a REBEL Creative Director who HATES boring templates. You create presentations that make audiences GASP.

THE OLD WAY: Boring templates, generic bullets, stock photos.
YOUR WAY: BREAK the mold. Shock. Inspire. TRANSFORM.

BRAND YOU MUST EMBODY (MEMORIZE THIS):
- Brand: ${brand.brandName}
- Tagline: ${brand.tagline}
- Core Values: ${brand.values.join(', ')}
- Colors: ${brand.colors.join(', ')}
- Mood: ${brand.mood}
- Style: ${brand.style}
- Industry: ${brand.industry}
- Audience: ${brand.audience}

YOUR SECRET WEAPONS:
1. NO TEMPLATES - Every slide is UNIQUE, custom-crafted
2. STEAL ATTENTION - Titles that STOP people mid-scroll
3. VISUAL STORYTELLING - Every slide tells a story
4. BRAND OBSESSION - Every pixel screams "${brand.brandName}"
5. COLOR DISCPLINE - ONLY use: ${brand.colors.join(', ')}

TITLE RULES (POWERFUL & SHORT):
✅ "Chaos → Clarity" ✅ "The $4B Mistake" ✅ "Why Everyone's Wrong"
❌ "Company Overview" ❌ "Q3 Results"

SUBTITLE RULES (ONE PUNCHY SENTENCE):
✅ "While competitors stagnate, we architect tomorrow"
✅ "Three shifts that'll redefine your entire industry"
❌ "A presentation about our goals"

BULLET RULES (3-5 MAX, ACTION-ORIENTED):
✅ "Orchestrate 340% ROI through AI engines"
✅ "Slash 89% overhead with autonomous workflows"
❌ "We provide good service"

IMAGE PROMPT RULES (CRITICAL - KEEP UNDER 150 CHARS!):
- Format: "[Subject], [2 colors MAX], [lighting], [mood], 16:9"
✅ "Futuristic glass office, navy blue + coral, golden hour, bold, 16:9"
✅ "Abstract geometric, white + navy, soft shadows, calm, 16:9"
❌ Long complex prompts that break URLs

OUTPUT: Valid JSON ONLY. Be RADICALLY creative while OBSESSING over brand: ${brand.brandName}

JSON SCHEMA:
{
  "title": "Master Title (brand-aligned, POWERFUL, 2-5 words)",
  "slides": [
    {
      "title": "Slide Title (MAX 5 words, POWERFUL)",
      "subtitle": "One punchy sentence (MAX 12 words)",
      "bullets": ["Point 1 (action verb!)", "Point 2", "Point 3"],
      "imagePrompt": "Simple visual, 2 colors MAX, lighting, mood, 16:9 (UNDER 150 chars!)"
    }
  ]
}`;

  const userPrompt = `You are designing for ${brand.brandName} - a ${brand.industry} company targeting ${brand.audience}.

THEIR ESSENCE:
- Tagline: "${brand.tagline}"
- Mood: ${brand.mood}
- Style: ${brand.style}
- Colors to USE: ${brand.colors.join(', ')}

PERSONA: ${personaGuide}

RAW CONTENT TO TRANSFORM (make it UNRECOGNIZABLE in a good way):
${rawText.substring(0, 14000)}

YOUR MISSION:
1. Create a NARRATIVE ARC (Title → Problem → Solution → Proof → Future → CTA)
2. Every slide MUST scream "${brand.brandName}" - colors ${brand.colors.join(', ')}, mood "${brand.mood}"
3. BREAK ALL TEMPLATES - be RADICALLY different
4. Image prompts: ONLY 2 colors from ${brand.colors.join(', ')} - KEEP UNDER 150 chars!

OUTPUT: Valid JSON only. No templates. Be WILDLY creative for ${brand.brandName}!`;

  const res = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': 'https://papipoint.app',
      'X-Title': 'Papipoint Slide Design',
    },
    body: JSON.stringify({
      model: modelId,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.95, // MAXIMUM creativity
      response_format: { type: 'json_object' },
    }),
  });

  if (!res.ok) {
    throw new Error(`Slide design failed: ${res.status}`);
  }

  const data = await res.json();
  let rawJson = data.choices?.[0]?.message?.content?.trim() || '';

  // Clean markdown wrappers
  rawJson = rawJson
    .replace(/^```(?:json)?[\s\n]*/gi, '')
    .replace(/[\s\n]*```$/g, '')
    .trim();

  // Handle double-encoded strings
  if (rawJson.startsWith('"')) {
    try { rawJson = JSON.parse(rawJson); } catch { /* ignore */ }
  }

  return JSON.parse(rawJson) as AIResponse;
}

// ── Main Route ────────────────────────────────────────────────────────
export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const mode = (formData.get('mode') as string) || 'reimagine';
    const aiModelKey = (formData.get('aiModel') as string) || DEFAULT_MODEL;
    const persona = (formData.get('persona') as string) || 'creative'; // Default to CREATIVE!
    const customApiKey = (formData.get('customApiKey') as string) || '';
    const referenceImage = formData.get('referenceImage') as File | null;

    // Validation
    if (!file) return NextResponse.json({ detail: 'No file uploaded' }, { status: 400 });

    const isPptx = file.name.endsWith('.pptx');
    const isPdf = file.name.endsWith('.pdf');
    if (!isPptx && !isPdf) {
      return NextResponse.json({ detail: 'Only .pptx and .pdf files are supported' }, { status: 400 });
    }

    const apiKey = customApiKey || process.env.OPENROUTER_API_KEY || '';
    if (mode === 'reimagine' && !apiKey) {
      return NextResponse.json({ detail: 'API key not configured. Please provide a custom key.' }, { status: 401 });
    }

    // Extract text from file
    const buffer = Buffer.from(await file.arrayBuffer());
    let rawText = '';

    try {
      if (isPptx) {
        const officeResult = await parseOffice(buffer);
        rawText = typeof officeResult === 'string' ? officeResult : JSON.stringify(officeResult);
      } else if (isPdf) {
        const pdfModule = await import('pdf-parse') as any;
        const pdfParse = pdfModule.default || pdfModule;
        const data = await pdfParse(buffer);
        rawText = data.text;
      }
    } catch {
      const fileType = isPptx ? 'PPTX' : 'PDF';
      return NextResponse.json({ detail: `Failed to extract text from ${fileType}.` }, { status: 400 });
    }

    if (!rawText?.trim()) {
      return NextResponse.json({ detail: 'No readable text found.' }, { status: 400 });
    }

    // Manual mode - no AI
    if (mode === 'manual') {
      const chunks = rawText.split(/\n\s*\n/).filter((c: string) => c.trim().length > 0);
      const slides = chunks.map((chunk: string, i: number) => {
        const lines = chunk.split('\n').filter((l: string) => l.trim().length > 0);
        return {
          title: lines[0] || `Slide ${i + 1}`,
          subtitle: '',
          bullets: lines.slice(1),
          imagePrompt: `Professional background for ${lines[0] || `slide ${i + 1}`}, 16:9`,
        };
      });
      return NextResponse.json({ title: file.name.replace(/\.(pptx|pdf)$/i, ''), slides });
    }

    // Reimagine mode - Orchestrated AI Process
    const selectedModelKey = MODELS[aiModelKey] ? aiModelKey : DEFAULT_MODEL;
    console.log('[Papipoint] Starting orchestrated redesign...');

    // STEP 1: Extract brand essence
    console.log('[Papipoint] Step 1: Extracting brand essence...');
    const brand = await callWithFallback(
      apiKey,
      selectedModelKey,
      (modelId: string) => extractBrandEssence(apiKey, rawText, modelId)
    ) as BrandEssence;
    console.log('[Papipoint] Brand:', brand.brandName, '| Colors:', brand.colors.join(', '));

    // STEP 2: Design slides with brand essence
    console.log('[Papipoint] Step 2: Designing WILDLY creative slides...');
    const slideDesign = await callWithFallback(
      apiKey,
      selectedModelKey,
      (modelId: string) => designSlides(apiKey, rawText, brand, modelId, persona)
    ) as AIResponse;

    // Ensure slides array exists
    if (!slideDesign.slides || !Array.isArray(slideDesign.slides)) {
      return NextResponse.json({ detail: 'AI response missing slides array.' }, { status: 500 });
    }

    // Add brand essence to response
    const result = {
      ...slideDesign,
      brandEssence: {
        brandName: brand.brandName,
        tagline: brand.tagline,
        colors: brand.colors,
        mood: brand.mood,
        style: brand.style,
      },
    };

    console.log('[Papipoint] Redesign complete! Brand:', brand.brandName);
    return NextResponse.json(result);

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    console.error('[Papipoint] API Error:', errorMessage);
    return NextResponse.json({ detail: errorMessage }, { status: 500 });
  }
}