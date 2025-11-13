const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

exports.handler = async (event, context) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { 
      statusCode: 405, 
      headers,
      body: JSON.stringify({ error: 'Method Not Allowed' }) 
    };
  }

  try {
    const { templeName } = JSON.parse(event.body);

    if (!templeName) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Temple name is required' }),
      };
    }

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

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ script: completion.choices[0].message.content }),
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to generate script', details: error.message }),
    };
  }
};