import { NextRequest, NextResponse } from 'next/server'

console.log("AI ROUTE RUNNING", process.env.AI_API_KEY)

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json()

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
    }

    const apiKey = process.env.AI_API_KEY
    console.log("API KEY EXISTS:", !!apiKey)
    if (!apiKey) {
      return NextResponse.json({ error: 'AI API key not configured' }, { status: 500 })
    }

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 500,
        temperature: 0.7,
      }),
    })

  const raw = await response.text()
console.log("GROQ RAW:", raw)

if (!response.ok) {
  return NextResponse.json({ error: raw }, { status: 500 })
}

const data = JSON.parse(raw)
const text = data.choices?.[0]?.message?.content || 'No response generated.'

return NextResponse.json({ text })

  } catch (error) {
    console.error('AI route error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}