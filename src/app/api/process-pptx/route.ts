import { NextResponse } from 'next/server';
import { parseOffice } from 'officeparser';

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

// Verified working models on OpenRouter
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

// ── Retry wrapper with model fallback ────────────────────────────────────────
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

// ── Step 1: Extract Brand Essence (FIXED - IGNORE GARBLED TEXT) ────────────────────────────────
async function extractBrandEssence(apiKey: string, rawText: string, modelId: string): Promise<BrandEssence> {
  const systemPrompt = `You are a WORLD-CLASS brand strategist. Your job is to find the EXACT brand name from the content.

🚨 CRITICAL RULES - READ CAREFULLY:
1. IGNORE any text with garbled characters like "Mercusuar", "Berkarya", "Mrcusr", etc.
2. These are OCR/PDF extraction ERRORS - they are NOT real brand names!
3. Look for CLEAN, readable text that repeats across slides
4. Look for: Logo text, header text, footer text, copyright notices
5. The brand name should be 1-3 CLEAN words (e.g., "Nike", "Apple", "Imajinari")

✅ GOOD examples: "Digital Vision", "Creative Agency", "Pacific Digital"
❌ BAD examples: "Mercusuar", "Berkarya", "Mrcusr", "0o44zQ"

OUTPUT: Valid JSON only, no markdown, no commentary.

JSON SCHEMA:
{
  "brandName": "CLEAN brand name (1-3 words, NO garbled characters!)",
  "tagline": "Powerful 5-8 word tagline",
  "colors": ["#hex1", "#hex2", "#hex3"],
  "mood": "2-3 words (e.g., 'Bold & Dynamic')",
  "style": "Visual style (e.g., 'Minimalist Luxury')",
  "values": ["value1", "value2", "value3"],
  "audience": "Target audience",
  "industry": "Specific industry"
}`;

  const userPrompt = `Find the REAL, CLEAN brand name in this content.

🚨 IGNORE garbled text like: "Mercusuar", "Berkarya", "Creative Berkarya", etc.
🚨 These are PDF/OCR errors - NOT real brand names!

Look for CLEAN, readable text that appears multiple times:
- Headers, footers, logos
- Copyright notices (© 2026 Brand Name)
- Consistent text across slides

If you see garbled text, SKIP IT and find the clean text!

RAW CONTENT:
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
    const parsed = JSON.parse(rawJson) as BrandEssence;
    // Validate: if brand name contains garbled characters, use fallback
    if (parsed.brandName && /[a-zA-Z\s]{3,}/.test(parsed.brandName)) {
      return parsed;
    }
    throw new Error('Garbled brand name detected');
  } catch {
    // Return defaults if parsing fails or garbled
    return {
      brandName: 'Digital Creative Agency',
      tagline: 'Transforming Visions Into Reality',
      colors: ['#1a237e', '#ff6f61', '#ffffff'],
      mood: 'Bold & Visionary',
      style: 'Modern Creative',
      values: ['Creativity', 'Innovation', 'Excellence'],
      audience: 'Businesses seeking creative services',
      industry: 'Digital Creative Agency',
    };
  }
}

// ── Step 2: Design Slides (EXTREMELY CREATIVE) ───────────────────────────
async function designSlides(
  apiKey: string,
  rawText: string,
  brand: BrandEssence,
  modelId: string,
  persona: string
): Promise<AIResponse> {
  const personaGuides: Record<string, string> = {
    corporate: 'Formal, Polished, Authoritative. Executive-level vocabulary, ROI-focused.',
    creative: 'WILDLY CREATIVE. Use RICH METAPHORS, vivid imagery, cinematic language. SHATTER expectations!',
    tech: 'Disruptive, Edgy, Futuristic. ANTI-CORPORATE. Innovation-obsessed, tech-optimist.',
    minimalist: 'Clean, Direct, Essential. RADICAL minimalism. Bold white space, zero-fluff.',
  };

  const personaGuide = personaGuides[persona] || personaGuides.corporate;

  const systemPrompt = `You are a REBEL Creative Director who HATES boring templates. You create presentations that make audiences GASP.

🚨 FORGET EVERYTHING YOU KNOW ABOUT "PRESENTATIONS" 🚨
This is NOT a presentation. It's a WEAPON. A MANIFESTO. A MOVEMENT.

BRAND YOU MUST BECOME (MEMORIZE THIS - IT'S YOUR DNA NOW):
- Brand: ${brand.brandName}
- Tagline: ${brand.tagline}
- Core Values: ${brand.values.join(', ')}
- Colors: ${brand.colors.join(', ')}
- Mood: ${brand.mood}
- Style: ${brand.style}
- Industry: ${brand.industry}
- Audience: ${brand.audience}

YOUR MISSION: DESTROY TEMPLATES FOREVER
❌ NO "Company Overview" slides
❌ NO "Q3 Results" slides  
❌ NO generic bullet points
❌ NO stock photo vibes
❌ NO corporate speak

✅ EVERY SLIDE IS A PUNCH TO THE GUT
✅ Titles that make people STOP SCROLLING
✅ Bullets that sound like WAR CRIES
✅ Visuals that BURN INTO MEMORY
✅ Words that HAUNT people at 3AM

TITLE RULES (2-4 WORDS MAX - MAKE THEM BLEED):
✅ "Chaos → Clarity" ✅ "The $4B Mistake" ✅ "Why Everyone's Wrong" ✅ "Die Trying"
❌ "Company Overview" ❌ "Our Services" ❌ "Q3 Results"

SUBTITLE RULES (ONE SENTENCE - MAKE IT HURT):
✅ "While competitors stagnate, we architect tomorrow"
✅ "Three shifts that'll redefine your entire industry"
✅ "The revolution starts when you stop apologizing"

BULLET RULES (3-4 MAX - ACTION VERBS ONLY):
✅ "Orchestrate 340% ROI through AI engines"
✅ "Slash 89% overhead with autonomous workflows"
✅ "Annihilate competitors with predictive algorithms"
❌ "We provide good service" ❌ "Our team is great"

IMAGE PROMPT RULES (KEEP UNDER 150 CHARS - ONLY 2 BRAND COLORS):
✅ "Futuristic glass office, navy blue + coral, golden hour, bold, 16:9"
✅ "Abstract geometric, white + navy, soft shadows, calm, 16:9"

NARRATIVE STRUCTURE (PICK ONE - COMMIT TO IT):
1. **The Hero's Journey**: Ordinary world → Call to adventure → Challenges → Transformation → New reality
2. **Problem-Solution**: Agitate pain → Diagnose root → Prescribe solution → Prove it works
3. **The Revelation**: Common myth → Evidence that destroys it → New paradigm → Call to action
4. **Future Back**: Vision of 2030 → Gap analysis → Bridge the divide → Start today

OUTPUT: Valid JSON ONLY. Be RADICALLY creative while OBSESSING over brand: ${brand.brandName}

JSON SCHEMA:
{
  "title": "Master Title (brand-aligned, POWERFUL, 2-5 words)",
  "slides": [
    {
      "title": "Slide Title (MAX 5 words, POWERFUL!)",
      "subtitle": "One punchy sentence (MAX 12 words)",
      "bullets": ["Point 1 (action verb!)", "Point 2", "Point 3"],
      "imagePrompt": "Simple visual, MAX 2 colors from ${brand.colors.join(', ')}, lighting, mood, 16:9 (UNDER 150 chars!)"
    }
  ]
}`;

  const userPrompt = `You are redesigning for ${brand.brandName} - a ${brand.industry} targeting ${brand.audience}.

THEIR ESSENCE:
- Tagline: "${brand.tagline}"
- Mood: ${brand.mood}
- Style: ${brand.style}
- Colors to USE EXCLUSIVELY: ${brand.colors.join(', ')}

PERSONA: ${personaGuide}

RAW CONTENT TO TRANSFORM (make it UNRECOGNIZABLE in a good way):
${rawText.substring(0, 14000)}

YOUR MISSION:
1. Create a COHESIVE NARRATIVE that RADICALLY transforms this content
2. Every slide MUST scream "${brand.brandName}" - colors ${brand.colors.join(', ')}, mood "${brand.mood}"
3. BREAK ALL TEMPLATES - be RADICALLY different for ${brand.brandName}
4. Image prompts: ONLY 2 colors from ${brand.colors.join(', ')} - KEEP UNDER 150 chars!
5. This must feel like ${brand.brandName}'s SOUL transformed into slides`;

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
      temperature: 1.0, // ABSOLUTE MAXIMUM creativity - no limits
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