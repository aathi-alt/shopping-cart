// LINE 1: Force environment variables to load first thing!
require('dotenv').config();

// DEBUG: Verify your Razorpay Key ID is loading correctly
console.log("DEBUG: Current Razorpay Key ID is:", process.env.RAZORPAY_KEY_ID);

const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const twilio = require('twilio');

// 1. Initialize Razorpay safely instead of Stripe
const Razorpay = require('razorpay');
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,     // e.g., rzp_test_...
    key_secret: process.env.RAZORPAY_KEY_SECRET // e.g., secret token
});

const app = express();
app.use(cors());
app.use(express.json());

// Database Connection Instance
const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
}).promise();

const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
let otpCache = new Map(); // Simple In-Memory Cache for OTP Verification

// --- WHATSAPP OTP ENDPOINTS ---
app.post('/api/auth/register', async (req, res) => {
    const { name, phone, password } = req.body;
    try {
        if (!name || !phone || !password) {
            return res.status(400).json({ success: false, message: 'All registration parameters are required.' });
        }
        await db.query('INSERT INTO users (name, phone, password, is_verified) VALUES (?, ?, ?, true)', [name, phone, password]);
        res.status(200).json({ success: true, message: 'User written to DB successfully.' });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ success: false, message: 'This phone number is already registered.' });
        }
        res.status(500).json({ success: false, message: err.message });
    }
});

app.post('/api/auth/login-request', async (req, res) => {
    const { phone, password } = req.body;
    try {
        const [users] = await db.query('SELECT * FROM users WHERE phone = ? AND password = ?', [phone, password]);
        
        if (users.length === 0) {
            return res.status(401).json({ success: false, message: 'Invalid phone number or password combination.' });
        }

        const user = users[0];
        const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
        
        otpCache.set(phone, { generatedOtp, name: user.name });

        await twilioClient.messages.create({
            from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
            body: `Your E-Shop login verification token is: ${generatedOtp}`,
            to: `whatsapp:${phone}`
        });

        res.status(200).json({ success: true, message: 'OTP Dispatched.' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.post('/api/auth/verify-otp', async (req, res) => {
    const { phone, otp } = req.body;
    const cachedData = otpCache.get(phone);

    if (!cachedData || cachedData.generatedOtp !== otp) {
        return res.status(400).json({ success: false, message: 'Invalid or expired OTP token confirmation context match.' });
    }

    const token = jwt.sign(
        { phone, name: cachedData.name }, 
        process.env.JWT_SECRET, 
        { expiresIn: '24h' }
    );
    
    otpCache.delete(phone);
    res.status(200).json({ success: true, token });
});

// --- PRODUCT DELIVERY ENDPOINTS ---
app.get('/api/products', async (req, res) => {
    try {
        const [products] = await db.query('SELECT * FROM products');
        res.json(products);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- RAZORPAY GATEWAY ONLINE CHECKOUT ENDPOINT ---
app.post('/api/payment/checkout', async (req, res) => {
    const { cartItems } = req.body;
    try {
        if (!cartItems || cartItems.length === 0) {
            return res.status(400).json({ success: false, error: 'Cart is empty.' });
        }

        const totalAmount = cartItems.reduce((sum, item) => {
            return sum + (item.price * item.quantity);
        }, 0);

        const options = {
            amount: Math.round(totalAmount * 100), // Tracks in Paise
            currency: 'INR',
            receipt: `receipt_order_${Date.now()}`
        };

        const order = await razorpay.orders.create(options);

        // Explicit structural return variables layout
        res.status(200).json({ 
            success: true, 
            order_id: order.id, 
            amount: order.amount, 
            key_id: process.env.RAZORPAY_KEY_ID 
        });
    } catch (err) {
        console.error("Razorpay order creation breakdown:", err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

// --- CASH ON DELIVERY (COD) ENTRY ENDPOINT (CLEANED UP DUPES) ---
app.post('/api/payment/cod-order', async (req, res) => {
    const { cartItems } = req.body;
    try {
        if (!cartItems || cartItems.length === 0) {
            return res.status(400).json({ success: false, message: 'Cart items cannot be empty.' });
        }

        const totalAmount = cartItems.reduce((sum, item) => {
            return sum + (item.price * item.quantity);
        }, 0);

        console.log(`[COD ORDER CREATED]: Received order totaling ₹${totalAmount.toFixed(2)}`);
        
        res.status(200).json({ 
            success: true, 
            message: 'Cash on delivery request successfully verified and logged.' 
        });

    } catch (err) {
        console.error("Backend COD placement failure:", err.message);
        res.status(500).json({ success: false, message: err.message });
    }
});

app.listen(process.env.PORT, () => console.log(`Server executing at port ${process.env.PORT}`));
