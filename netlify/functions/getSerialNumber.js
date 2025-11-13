const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');

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

  try {
    // Validate environment variables
    if (!process.env.GOOGLE_CLIENT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY || !process.env.GOOGLE_SHEET_ID) {
      console.error('Missing environment variables');
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: 'Server configuration error',
          details: 'Missing required environment variables'
        }),
      };
    }

    // Handle private key formatting
    let privateKey = process.env.GOOGLE_PRIVATE_KEY;
    // If the key doesn't have newlines, add them
    if (!privateKey.includes('\n')) {
      privateKey = privateKey.replace(/\\n/g, '\n');
    }

    // Initialize auth with service account
    const serviceAccountAuth = new JWT({
      email: process.env.GOOGLE_CLIENT_EMAIL,
      key: privateKey,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID, serviceAccountAuth);
    
    await doc.loadInfo();
    const sheet = doc.sheetsByIndex[0]; // First sheet
    const rows = await sheet.getRows();
    
    // Get the last serial number
    let lastSerialNumber = 0;
    if (rows.length > 0) {
      const lastRow = rows[rows.length - 1];
      lastSerialNumber = parseInt(lastRow.get('S No.')) || 0;
    }
    
    const newSerialNumber = lastSerialNumber + 1;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ serialNumber: newSerialNumber }),
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Failed to fetch serial number', 
        details: error.message 
      }),
    };
  }
};