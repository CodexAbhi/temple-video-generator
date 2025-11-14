// Add node-fetch for older Node versions if needed
// Netlify Functions use Node 18+ which has native fetch

exports.handler = async (event, context) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  };

  // Handle preflight request
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
    const payload = JSON.parse(event.body);
    
    console.log('Forwarding payload to n8n:', payload);

    // Forward the request to n8n
    const response = await fetch('https://thezyra.app.n8n.cloud/webhook-test/videoclips', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    console.log('n8n response status:', response.status);

    // Try to get response as text first
    let responseData = '';
    try {
      responseData = await response.text();
      console.log('n8n response:', responseData);
    } catch (e) {
      console.log('No response body from n8n');
    }

    // Return successful response
    return {
      statusCode: response.ok ? 200 : response.status,
      headers,
      body: responseData || JSON.stringify({ success: true }),
    };
  } catch (error) {
    console.error('Error forwarding to n8n:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Failed to forward request to n8n', 
        details: error.message 
      }),
    };
  }
};