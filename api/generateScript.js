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

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a knowledgeable guide who creates engaging, informative scripts about Hindu temples. Focus on history, architecture, spiritual significance, and interesting facts. Keep scripts concise for video format."
        },
        {
          role: "user",
          content: `Create an engaging 60-90 second video script about ${templeName}. Include its history, significance, architecture, and what makes it special. Make it conversational and suitable for a short video format.`
        }
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

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