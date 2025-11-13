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
    if (!privateKey.includes('\n')) {
      privateKey = privateKey.replace(/\\n/g, '\n');
    }

    console.log('Initializing Google Sheets connection...');

    // Initialize auth with service account
    const serviceAccountAuth = new JWT({
      email: process.env.GOOGLE_CLIENT_EMAIL,
      key: privateKey,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID, serviceAccountAuth);
    
    console.log('Loading document info...');
    await doc.loadInfo();
    console.log('Document title:', doc.title);
    
    const sheet = doc.sheetsByIndex[0]; // First sheet
    console.log('Sheet title:', sheet.title);
    
    // Load header row
    await sheet.loadHeaderRow();
    console.log('Sheet headers:', sheet.headerValues);
    
    // Get all rows
    const rows = await sheet.getRows();
    console.log('Total rows found:', rows.length);
    
    // Get the last serial number, start from 1000 if empty
    let lastSerialNumber = 1000;
    
    if (rows.length > 0) {
      const lastRow = rows[rows.length - 1];
      
      // Try multiple ways to get the serial number from column A
      let serialValue = null;
      
      // Method 1: Try exact header match
      if (sheet.headerValues.includes('S No.')) {
        serialValue = lastRow.get('S No.');
      }
      
      // Method 2: Try without period
      if (!serialValue && sheet.headerValues.includes('S No')) {
        serialValue = lastRow.get('S No');
      }
      
      // Method 3: Use raw data (first column)
      if (!serialValue) {
        serialValue = lastRow._rawData[0];
      }
      
      console.log('Raw serial value from sheet:', serialValue);
      
      const parsedValue = parseInt(serialValue);
      if (!isNaN(parsedValue) && parsedValue > 0) {
        lastSerialNumber = parsedValue;
      }
    }
    
    const newSerialNumber = lastSerialNumber + 1;
    console.log('Returning serial number:', newSerialNumber);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ serialNumber: newSerialNumber }),
    };
  } catch (error) {
    console.error('Detailed error:', error);
    console.error('Error stack:', error.stack);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Failed to fetch serial number', 
        details: error.message,
        stack: error.stack
      }),
    };
  }
};