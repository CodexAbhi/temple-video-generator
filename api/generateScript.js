const OpenAI = require('openai');

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // Validate API key
    if (!process.env.OPENAI_API_KEY) {
      console.error('Missing OpenAI API key');
      return res.status(500).json({
        error: 'Server configuration error',
        details: 'Missing OpenAI API key'
      });
    }

    const { templeName } = req.body;

    if (!templeName) {
      return res.status(400).json({ error: 'Temple name is required' });
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // --- New prompt integrated below ---
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert copywriter specializing in short-form video content for social media. Your task is to write an engaging, reel-style storytelling script about the given Temple. Your goal: Create a script that is captivating, informative, and makes the viewer feel like they are learning a hidden story."
        },
        {
          role: "user",
          content: `
Strict Requirements:
1.  **Format:** The output must be **pure text only**. Do NOT include any scene directions, camera cues, or formatting labels like \`(Scene: ...)\` or \`Script:\`.
2.  **Tone:** The script must be a **storytelling narrative**. It should be engaging and powerful, not dry or academic. Use strong hooks to grab attention immediately.
3.  **Content:** This must have a scroll stopping hook line, similar to viral instagram reels. You must weave together the temple's primary **legend**, its **historical significance**, and one or two **unique facts** (possible examples- its architecture, a famous ritual, or a mystery. You may choose other unique facts outside these examples based on how viral you think those facts might be if we are posting this on instagram). Always stick to facts, do not make up any fact.
4.  **Length:** The script must be approximately **100 words**.
5. **Language:** The Content of the script should be written in Romanian Hindi, i.e. The script should be hindi but written in english script.

Your Task:
Generate a script for the following temple: ${templeName}
`
        }
      ],
      temperature: 0.7,
      max_tokens: 250, // Reduced max_tokens as 100 words is ~200 tokens
    });
    // --- End of prompt integration ---

    return res.status(200).json({
      script: completion.choices[0].message.content
    });
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({
      error: 'Failed to generate script',
      details: error.message
    });
  }
}