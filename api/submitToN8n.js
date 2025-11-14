export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const payload = req.body;
    
    console.log('Forwarding payload to n8n:', payload);

    // Forward the request to n8n
    const response = await fetch('https://thezyra.app.n8n.cloud/webhook/videoclips', {
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
    return res.status(response.ok ? 200 : response.status).send(
      responseData || JSON.stringify({ success: true })
    );
  } catch (error) {
    console.error('Error forwarding to n8n:', error);
    return res.status(500).json({ 
      error: 'Failed to forward request to n8n', 
      details: error.message 
    });
  }
}