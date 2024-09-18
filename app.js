const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json());

// Your provided details
const passKey = 'bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919';
const consumerKey = 'imcYRrOHYGHbaTAAg5S3zwuD2gdSrv5e9FAfz5U9AZfOW4nK';
const consumerSecret = 'HOE8IwjzuZBVFi7a6S246u8GQpsQOxLS30wGBrPq5QO6dFychKW6mM8R4OcbXgMv';
const shortCode = '174379';
const callbackURL = '/callback';

// Function to generate a timestamp (format: YYYYMMDDHHmmss)
const generateTimestamp = () => {
  const now = new Date();
  return `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;
};

// Function to generate an access token
const generateAccessToken = async () => {
  try {
    const response = await axios.get('https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials', {
      auth: {
        username: consumerKey,
        password: consumerSecret,
      },
    });
    return response.data.access_token;
  } catch (error) {
    throw new Error('Failed to get access token: ' + error.message);
  }
};

// Function to initiate the Lipa Na M-Pesa payment
const initiatePayment = async (accessToken, phone, amount) => {
  const timestamp = generateTimestamp();
  const password = Buffer.from(shortCode + passKey + timestamp).toString('base64');

  const paymentRequest = {
    BusinessShortCode: shortCode,
    Password: password,
    Timestamp: timestamp,
    TransactionType: 'CustomerPayBillOnline',
    Amount: amount,
    PartyA: phone,
    PartyB: shortCode,
    PhoneNumber: phone,
    CallBackURL: callbackURL,
    AccountReference: 'Order123',
    TransactionDesc: 'Payment for Order123',
  };

  try {
    const response = await axios.post('https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest', paymentRequest, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      timeout: 5000 // Set a timeout for the request
    });
    return response.data;
  } catch (error) {
    console.error('Failed to initiate payment:', error.response ? error.response.data : error.message);
    throw new Error('Failed to initiate payment: ' + (error.response ? error.response.data : error.message));
  }
};

// Endpoint to initiate payment
app.post('/lipa', async (req, res) => {
  const { phone, amount } = req.body;

  try {
    const accessToken = await generateAccessToken();
    const paymentResponse = await initiatePayment(accessToken, phone, amount);
    res.status(200).json({ message: 'Payment initiated successfully', data: paymentResponse });
  
} catch (error) {
  console.error('Failed to initiate payment:', error.response ? error.response.data : error.message);
  throw new Error('Failed to initiate payment: ' + (error.response ? error.response.data : error.message));
}

});
app.post('/callback', (req, res) => {
  console.log("Callback received:", JSON.stringify(req.body, null, 2));
  // Process the callback data
  res.status(200).json("success");
});


// Start the server
const port = process.env.PORT || 9000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
