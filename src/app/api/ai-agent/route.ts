import { NextResponse } from 'next/server';

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

export async function POST(request: Request) {
  try {
    const { messages, aiModel, customApiKey, projectData } = await request.json();

    const apiKey = customApiKey || process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'API key not found' }, { status: 401 });
    }

    const systemPrompt = `You are the Papipoint AI Co-Pilot, an advanced presentation agent.
You help users refine their slides, brainstorm content, and perform bulk edits.

CURRENT PROJECT CONTEXT:
Title: ${projectData?.title || 'Untitled'}
Number of slides: ${projectData?.slides?.length || 0}

INSTRUCTIONS:
- You can suggest specific changes to slides.
- You can write new bullet points or titles.
- Be creative, professional, and proactive.
- If the user asks for a change, provide a "plan" first, then respond.
- You can output JSON commands if needed, but for now, focus on being a helpful assistant.`;

    const res = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://papipoint.app',
        'X-Title': 'Papipoint AI Agent',
      },
      body: JSON.stringify({
        model: aiModel || 'google/gemma-4-26b-a4b-it:free',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages
        ],
        temperature: 0.7,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ error: err }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data.choices[0].message);
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
