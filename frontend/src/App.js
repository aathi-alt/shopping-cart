import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import QRCode from 'qrcode';
import axios from 'axios';

const API = axios.create({ baseURL: 'http://localhost:5000/api' });

export default function App() {
  const [cart, setCart] = useState([]);
  const [user, setUser] = useState(null);

  // Check for an active login token session on component mount
  useEffect(() => {
    const parseUserToken = () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          // Decode the middle section of the JWT token string safely
          const payload = JSON.parse(atob(token.split('.')[1]));
          setUser({ name: payload.name || "Customer", phone: payload.phone });
        } catch (e) {
          localStorage.removeItem('token');
          setUser(null);
        }
      } else {
        setUser(null);
      }
    };
    parseUserToken();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    alert('Logged out successfully.');
    window.location.href = "/"; // Force a safe state navigation context refresh
  };

  const addToCart = (product) => {
    setCart((prev) => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  return (
    <Router>
      <nav style={{ padding: '15px 30px', background: '#232f3e', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
          <Link to="/" style={{ color: 'white', textDecoration: 'none', fontWeight: 'bold', fontSize: '18px' }}>&#128722; Zentro Vault</Link>
          <Link to="/" style={{ color: 'white', textDecoration: 'none' }}>Products</Link>
          <Link to="/cart" style={{ color: 'white', textDecoration: 'none' }}>Cart ({cart.reduce((a,c) => a + c.quantity, 0)})</Link>
        </div>
        
        <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
{user ? (
  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
    {/* REQUIREMENT: Custom message greeting structural requirement format */}
    <span style={{ color: '#fcd200', fontSize: '14px', marginRight: '10px' }}>
      Welcome, {user.name}
    </span>
    <button onClick={handleLogout} style={{ background: '#cc0000', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' }}>
      Logout
    </button>
  </div>
) : (
  <>
    <Link to="/register" style={{ color: 'white' }}>Register</Link>
    <Link to="/login" style={{ color: 'white' }}>Login</Link>
  </>
)}

        </div>
      </nav>
      <div style={{ padding: 40, maxWidth: '1200px', margin: '0 auto', fontFamily: 'system-ui, sans-serif' }}>
        <Routes>
          <Route path="/" element={<ProductPage onAdd={addToCart} />} />
<Route path="/cart" element={<CartPage cart={cart} setCart={setCart} onRemove={(id) => setCart(prev => prev.filter(item => item.id !== id))} />} />

          <Route path="/register" element={<AuthPage isLogin={false} />} />
          <Route path="/login" element={<AuthPage isLogin={true} />} />
<Route path="/success" element={<SuccessPage />} />        </Routes>
      </div>
    </Router>
  );
}

// --- HOVER CARD WRAPPER ENGINE ---
function ProductCard({ p, onAdd }) {
  const [hover, setHover] = useState(false);
  
  // 🟢 FIXED: Added this hook right here so navigate can be used inside this component!
  const navigate = useNavigate(); 

  // Track the local heart status dynamically for this product
  const [isSaved, setIsSaved] = useState(() => {
    const list = localStorage.getItem('wishlist_items');
    return list ? JSON.parse(list).includes(p.id || p._id) : false;
  });

  const cardStyle = {
    border: '1px solid #ddd',
    padding: '20px',
    borderRadius: '12px',
    background: '#fff',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    boxShadow: hover ? '0 12px 24px rgba(0,0,0,0.12)' : '0 4px 8px rgba(0,0,0,0.04)',
    transform: hover ? 'translateY(-6px)' : 'translateY(0)',
    transition: 'transform 0.25s ease, box-shadow 0.25s ease'
  };

  const handleWishlistToggle = () => {
    const token = localStorage.getItem('token');
    
    // Check for active session before allowing wishlist modifications
    if (!token) {
      alert('Login Required: Please login or create an account via WhatsApp OTP to save items.');
      navigate('/login');
      return;
    }

    const rawData = localStorage.getItem('wishlist_items');
    let currentList = rawData ? JSON.parse(rawData) : [];
    const productId = p.id || p._id; // Accommodates both standard schema models securely

    if (currentList.includes(productId)) {
      currentList = currentList.filter(id => id !== productId);
      setIsSaved(false);
      alert('Removed from saved items!');
    } else {
      currentList.push(productId);
      setIsSaved(true);
      alert('Saved for later checkout!');
    }
    localStorage.setItem('wishlist_items', JSON.stringify(currentList));
  };

  return (
    <div 
      style={cardStyle}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div style={{ textAlign: 'center', marginBottom: '15px' }}>
        <img src={p.image_url} alt={p.title} style={{ width: '100%', height: '180px', objectFit: 'contain' }} />
      </div>
      <div>
        <h3 style={{ fontSize: '16px', margin: '10px 0', color: '#333' }}>{p.title}</h3>
        <p style={{ color: '#B12704', fontSize: '18px', fontWeight: 'bold', margin: '5px 0 15px 0' }}>₹{p.price}</p>
        
        {/* 1. FLEX CONTAINER TO ALIGN BUTTONS IN A SINGLE LINE */}
        <div style={{ display: 'flex', gap: '8px', width: '100%', alignItems: 'center' }}>
          
          {/* YOUR EXACT ADD TO CART BUTTON (UNCHANGED LOGIC) */}
          <button 
            onClick={() => {
              const token = localStorage.getItem('token');
              if (!token) {
                alert('Login Required: Please login or create an account via WhatsApp OTP to add items to your cart.');
                navigate('/login'); 
                return;
              }
              onAdd(p); 
            }} 
            style={{ 
              background: '#f0c14b', 
              padding: '10px 8px', 
              cursor: 'pointer', 
              flex: 1, // Makes it stretch and occupy the left room dynamically
              border: '1px solid #a88734', 
              borderRadius: '4px', 
              fontWeight: '500',
              fontSize: '14px',
              height: '40px'
            }}
          >
            Add to Cart
          </button>

          {/* 2. THE NEW COMPACT WISHLIST BUTTON */}
          <button 
            onClick={handleWishlistToggle}
            style={{ 
              width: '40px', 
              height: '40px', 
              background: isSaved ? '#fff0f2' : '#f8f9fa', 
              border: isSaved ? '1px solid #ffc9cf' : '1px solid #ced4da', 
              borderRadius: '4px', 
              cursor: 'pointer', 
              fontSize: '18px', 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center',
              boxSizing: 'border-box'
            }}
            title="Save for later"
          >
            {isSaved ? '❤️' : '🤍'}
          </button>

        </div>
      </div>
    </div>
  );
}


// --- UPDATED PRODUCT CATALOG CONTAINER WITH DYNAMIC FILTERING ---
function ProductPage({ onAdd }) {
  const [products, setProducts] = useState([]);
  const [activeCategory, setActiveCategory] = useState('All'); // Tracks 'All', 'Laptop', 'Watch', etc.

  useEffect(() => { 
    API.get('/products').then(res => setProducts(res.data)); 
  }, []);

  // Filter logic: checks if the product title contains the active category keyword
  const filteredProducts = products.filter(product => {
    if (activeCategory === 'All') return true;
    
    // Case-insensitive matching (e.g., looks for "laptop" inside "HP Pavilion Laptop")
    return product.title.toLowerCase().includes(activeCategory.toLowerCase());
  });

  // Filter Button Styling Helper
  const getButtonStyle = (categoryName) => ({
    padding: '10px 20px',
    background: activeCategory === categoryName ? '#232f3e' : '#f0f2f5',
    color: activeCategory === categoryName ? 'white' : '#333',
    border: activeCategory === categoryName ? '1px solid #232f3e' : '1px solid #ddd',
    borderRadius: '20px', // Rounded pill style
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '14px',
    transition: 'all 0.2s ease'
  });

  return (
    <div>
      <h2 style={{ marginBottom: '15px', color: '#222' }}>Explore Products</h2>

      {/* 🔍 NEW: HORIZONTAL FILTER BAR LAYER */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '30px', flexWrap: 'wrap' }}>
        <button onClick={() => setActiveCategory('All')} style={getButtonStyle('All')}>
          🌐 All Items
        </button>
        <button onClick={() => setActiveCategory('Laptop')} style={getButtonStyle('Laptop')}>
          💻 Laptops
        </button>
        <button onClick={() => setActiveCategory('Watch')} style={getButtonStyle('Watch')}>
          ⌚ Watches
        </button>
        <button onClick={() => setActiveCategory('Phone')} style={getButtonStyle('Phone')}>
          📱 Phones
        </button>
      </div>

      {/* RENDER GRID MODULE */}
      {filteredProducts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
          No products found matching the "{activeCategory}" filter category keyword details.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '30px' }}>
          {filteredProducts.map(p => (
            <ProductCard key={p.id || p._id} p={p} onAdd={onAdd} />
          ))}
        </div>
      )}
    </div>
  );
}


// --- USER AUTHENTICATION WITH WHATSAPP OTP SYSTEM ---
function AuthPage({ isLogin }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ name: '', phone: '', password: '', confirmPassword: '', otp: '' });
  const qrCanvasRef = useRef(null); // Reference hook to hold the canvas element
  const navigate = useNavigate();

  // Your Twilio Sandbox configuration parameters
  const twilioNumber = "14155238886"; 
  const sandboxKeyword = "join police-jump";

  useEffect(() => {
    setStep(1);
    setForm({ name: '', phone: '', password: '', confirmPassword: '', otp: '' });
  }, [isLogin]);

  // Automatically render the QR code on canvas when step or login mode changes
  useEffect(() => {
    if (isLogin && qrCanvasRef.current) {
      const whatsappUrl = `https://wa.me{twilioNumber}?text=${encodeURIComponent(sandboxKeyword)}`;
      QRCode.toCanvas(qrCanvasRef.current, whatsappUrl, {
        width: 150,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#ffffff'
        }
      }, (error) => {
        if (error) console.error("Error drawing sandbox QR code:", error);
      });
    }
  }, [isLogin, step]); // Tracks step transitions to re-render if needed

  // Handle account registration
  const handleRegister = async () => {
    if (!form.name.trim() || !form.phone.trim() || !form.password.trim() || !form.confirmPassword.trim()) {
      alert('Validation Error: All fields are required.');
      return;
    }
    if (!form.phone.startsWith('+')) {
      alert('Validation Error: Phone number must include country code starting with "+" (e.g., +919876543210)');
      return;
    }
    if (form.password !== form.confirmPassword) {
      alert('Validation Error: Passwords do not match.');
      return;
    }

    try {
      const res = await API.post('/auth/register', {
        name: form.name,
        phone: form.phone,
        password: form.password
      });
      
      if (res.data.success) {
        alert('Registration successful!');
        navigate('/login');
      }
    } catch (error) {
      alert(`Registration Failed: ${error.response?.data?.message || error.message}`);
    }
  };

  // Handle initial login validation check and request WhatsApp OTP
  const handleLoginSubmit = async () => {
    if (!form.phone.trim() || !form.password.trim()) {
      alert('Validation Error: Phone number and password are required.');
      return;
    }

    try {
      const res = await API.post('/auth/login-request', {
        phone: form.phone,
        password: form.password
      });

      if (res.data.success) {
        setStep(2); // Advance to the OTP entry screen
        alert('Credentials matched! OTP sent via WhatsApp successfully.');
      }
    } catch (error) {
      alert(`Login Failed: ${error.response?.data?.message || error.message}`);
    }
  };

  // Finalize access token validation using OTP challenge token strings
  const verifyOtp = async () => {
    if (!form.otp.trim()) {
      alert('Please input your 6-digit WhatsApp OTP verification token.');
      return;
    }

    try {
      const res = await API.post('/auth/verify-otp', {
        phone: form.phone,
        otp: form.otp
      });

      if (res.data.token) {
        localStorage.setItem('token', res.data.token);
        alert('Authentication Successful!');
        window.location.href = "/"; // Instantly updates greeting context flags across layouts
      }
    } catch (error) {
      alert(`Verification failure: ${error.response?.data?.message || 'Invalid or expired OTP token.'}`);
    }
  };

  return (
    <div style={{ maxWidth: '350px', margin: '60px auto', padding: '30px', border: '1px solid #ddd', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', background: '#fff' }}>
      
      {/* Sandbox instructions rendered on top strictly when user is logging in */}
      {isLogin && (
        <div style={{ backgroundColor: '#e3f2fd', borderLeft: '5px solid #2196f3', padding: '12px', marginBottom: '20px', borderRadius: '4px', textAlign: 'left', fontSize: '13px', lineHeight: '1.4' }}>
          <div style={{ fontWeight: 'bold', color: '#0d47a1', marginBottom: '5px' }}>⚠️ First Time Sign In?</div>
          Scan the QR code below and send the message: <span style={{ fontFamily: 'monospace', background: '#ffebee', color: '#c62828', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>{sandboxKeyword} </span>to recieve OTP via WhatsApp. This is required to link your sandbox instance for authentication.
        </div>
      )}

      <h2 style={{ marginTop: 0, marginBottom: '20px', textAlign: 'center' }}>{isLogin ? 'Login Dashboard' : 'User Registration'}</h2>
      
      {step === 1 ? (
        <div>
          {!isLogin && (
            <input 
              type="text" 
              placeholder="Your Full Name" 
              value={form.name}
              onChange={e => setForm({...form, name: e.target.value})} 
              style={{ width: '100%', marginBottom: '15px', padding: '10px', boxSizing: 'border-box', borderRadius: '4px', border: '1px solid #ccc' }} 
            />
          )}
          
          <input 
            type="text" 
            placeholder="Phone (e.g. +919876543210)" 
            value={form.phone}
            onChange={e => setForm({...form, phone: e.target.value})} 
            style={{ width: '100%', marginBottom: '15px', padding: '10px', boxSizing: 'border-box', borderRadius: '4px', border: '1px solid #ccc' }} 
          />

          <input 
            type="password" 
            placeholder="Password" 
            value={form.password}
            onChange={e => setForm({...form, password: e.target.value})} 
            style={{ width: '100%', marginBottom: '15px', padding: '10px', boxSizing: 'border-box', borderRadius: '4px', border: '1px solid #ccc' }} 
          />

          {!isLogin && (
            <input 
              type="password" 
              placeholder="Confirm Password" 
              value={form.confirmPassword}
              onChange={e => setForm({...form, confirmPassword: e.target.value})} 
              style={{ width: '100%', marginBottom: '15px', padding: '10px', boxSizing: 'border-box', borderRadius: '4px', border: '1px solid #ccc' }} 
            />
          )}

          {/* Render the actual physical layout QR code box under fields inside step 1 login view */}
          {isLogin && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '15px 0 20px 0' }}>
              <canvas ref={qrCanvasRef} style={{ border: '1px solid #eee', borderRadius: '4px', boxShadow: '0 2px 6px rgba(0,0,0,0.05)' }}></canvas>
              <span style={{ fontSize: '11px', color: '#888', marginTop: '6px' }}>Scan to link sandbox instance</span>
            </div>
          )}

          <button 
            onClick={isLogin ? handleLoginSubmit : handleRegister} 
            style={{ width: '100%', padding: '12px', background: isLogin ? '#007bff' : '#25D366', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }}
          >
            {isLogin ? 'Verify Credentials & Send OTP' : 'Register Account'}
          </button>
        </div>
      ) : (
        <div>
          <p style={{ fontSize: '13px', color: '#555', marginBottom: '15px' }}>OTP token dispatched to: <strong>{form.phone}</strong></p>
          <input 
            type="text" 
            placeholder="Enter 6-Digit OTP Token" 
            value={form.otp}
            onChange={e => setForm({...form, otp: e.target.value})} 
            style={{ width: '100%', marginBottom: '15px', padding: '10px', boxSizing: 'border-box', borderRadius: '4px', border: '1px solid #ccc' }} 
          />
          <button onClick={verifyOtp} style={{ width: '100%', padding: '12px', background: '#25D366', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }}>
            Confirm & Validate Access
          </button>
          <button onClick={() => setStep(1)} style={{ width: '100%', marginTop: '15px', background: 'transparent', border: 'none', color: '#0066c0', textDecoration: 'none', cursor: 'pointer', fontSize: '13px' }}>
            Back to credentials
          </button>
        </div>
      )}
    </div>
  );
}


// --- COMPLETE CART VIEW WITH ADDRESS HANDLING & AUTO-CLEAR ---
function CartPage({ cart, onRemove, setCart }) { // ️️✔️ Added setCart prop here to clean cart
  const navigate = useNavigate();
  const [paymentMethod, setPaymentMethod] = useState('online'); 
  
  // ⚠️ NEW: Shipping details state handlers
  const [shippingAddress, setShippingAddress] = useState({ address: '', city: '', pincode: '' });

  const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  // Address change traffic tracker
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setShippingAddress(prev => ({ ...prev, [name]: value }));
  };

  // Input validation loop
  const isAddressValid = () => {
    return shippingAddress.address.trim() && shippingAddress.city.trim() && shippingAddress.pincode.trim();
  };

  // --- ONLINE RAZORPAY HANDLER ---
  const handleOnlineCheckout = async () => {
    if (!window.Razorpay) {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      document.body.appendChild(script);
      await new Promise((resolve) => { script.onload = () => resolve(true); });
    }

    try {
      const res = await API.post('/payment/checkout', { 
        cartItems: cart,
        shipping: shippingAddress // Pass physical profile context to server
      });
      const data = res.data;

      if (!data.success) return alert("Gateway init failed: " + data.error);

      const options = {
        key: data.key_id, 
        amount: data.amount, 
        currency: "INR",
        name: "Zentro Vault",
        description: "Secure Checkout Portal",
        order_id: data.order_id, 
        handler: function (response) {
          alert(`Payment Successful! ID: ${response.razorpay_payment_id}`);
          
          // ️️✔️ FIXED: Emptying your shopping cart arrays globally
          if (setCart) setCart([]); 
          localStorage.removeItem('cart_items'); // If you save cart to localStorage, wipe it too
          
          navigate('/success'); 
        },
        prefill: { name: "Customer", email: "buyer@example.com" },
        theme: { color: "#232f3e" }
      };
      const rzpInstance = new window.Razorpay(options);
      rzpInstance.open();
    } catch (error) {
      console.error(error);
      alert('Online payment system error.');
    }
  };

  // --- CASH ON DELIVERY (COD) HANDLER ---
  const handleCodCheckout = async () => {
    try {
      const res = await API.post('/payment/cod-order', { 
        cartItems: cart,
        shipping: shippingAddress // Pass physical profile context to server
      });
      
      if (res.data.success) {
        alert('Order Placed Successfully via Cash on Delivery! Pay ₹' + totalPrice.toFixed(2) + ' at your doorstep.');
        
        // ️️✔️ FIXED: Emptying your shopping cart arrays globally on COD success
        if (setCart) setCart([]); 
        localStorage.removeItem('cart_items'); 
        
        navigate('/success');
      } else {
        alert('Failed to save order: ' + res.data.message);
      }
    } catch (error) {
      console.error('COD placement breakdown:', error);
      alert('Could not submit COD order to server.');
    }
  };

  const handleFinalAction = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Authentication required: Please log in to complete your order.');
      navigate('/login');
      return;
    }

    // ⚠️ Strict Address Validation Enforcement
    if (!isAddressValid()) {
      alert('Missing Information: Please complete all shipping address fields before placing your order.');
      return;
    }

    if (paymentMethod === 'cod') {
      handleCodCheckout();
    } else {
      handleOnlineCheckout();
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', fontFamily: '"Segoe UI", sans-serif' }}>
      <h2>Your Cart Summary</h2>
      
      {!cart || cart.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '30px 0' }}>
          <p>Your shopping cart workspace tracking ledger is empty.</p>
          <button onClick={() => navigate('/')} style={{ marginTop: '15px', padding: '10px 20px', background: '#232f3e', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
            Go Back to Products
          </button>
        </div>
      ) : (
        <div>
          {cart.map(item => (
            <div key={item.id || item._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #ddd' }}>
              <div>
                <span style={{ fontWeight: '500' }}>{item.title}</span>
                <span style={{ marginLeft: '8px', color: '#666', fontSize: '14px' }}>(x{item.quantity})</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <span style={{ fontWeight: 'bold' }}>₹{(item.price * item.quantity).toFixed(2)}</span>
                <button onClick={() => onRemove && onRemove(item.id || item._id)} style={{ background: '#dc3545', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}>
                  Delete
                </button>
              </div>
            </div>
          ))}
          
          <h3 style={{ marginTop: '20px' }}>Total Checkout Value: ₹{totalPrice.toFixed(2)}</h3>

          {/* ⚠️ NEW: SHIPPING ADDRESS COLLECTION FORM MODULE */}
          <div style={{ marginTop: '25px', padding: '20px', background: '#f4f6f8', borderRadius: '8px', border: '1px solid #ccd1d9' }}>
            <h4 style={{ margin: '0 0 15px 0', color: '#232f3e' }}>📍 Shipping & Delivery Address</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input type="text" name="address" placeholder="Flat, House no., Building, Company, Apartment, Street" value={shippingAddress.address} onChange={handleInputChange} style={{ width: '100%', padding: '10px', boxSizing: 'border-box', border: '1px solid #aab2bd', borderRadius: '4px' }} required />
              <div style={{ display: 'flex', gap: '12px' }}>
                <input type="text" name="city" placeholder="Town/City" value={shippingAddress.city} onChange={handleInputChange} style={{ flex: 1, padding: '10px', boxSizing: 'border-box', border: '1px solid #aab2bd', borderRadius: '4px' }} required />
                <input type="text" name="pincode" placeholder="6-Digit Pincode" maxLength="6" value={shippingAddress.pincode} onChange={handleInputChange} style={{ flex: 1, padding: '10px', boxSizing: 'border-box', border: '1px solid #aab2bd', borderRadius: '4px' }} required />
              </div>
            </div>
          </div>

          {/* PAYMENT METHOD SELECTION BOX LAYOUT */}
          <div style={{ marginTop: '20px', padding: '15px', background: '#f9f9f9', borderRadius: '6px', border: '1px solid #ddd' }}>
            <h4 style={{ margin: '0 0 10px 0' }}>Select Payment Option:</h4>
            <div style={{ display: 'flex', gap: '20px' }}>
              <label style={{ cursor: 'pointer', fontWeight: '500' }}>
                <input type="radio" name="payMethod" value="online" checked={paymentMethod === 'online'} onChange={() => setPaymentMethod('online')} style={{ marginRight: '8px' }} />
                💳 Pay Online (UPI, Cards)
              </label>
              <label style={{ cursor: 'pointer', fontWeight: '500' }}>
                <input type="radio" name="payMethod" value="cod" checked={paymentMethod === 'cod'} onChange={() => setPaymentMethod('cod')} style={{ marginRight: '8px' }} />
                💵 Cash on Delivery (COD)
              </label>
            </div>
          </div>

          {/* ACTION BUTTONS */}
          <div style={{ display: 'flex', gap: '15px', marginTop: '20px' }}>
            <button onClick={() => navigate('/')} style={{ flex: 1, padding: '12px', background: '#f0f0f0', border: '1px solid #ccc', color: '#333', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
              ⬅️ Keep Browsing
            </button>
            <button onClick={handleFinalAction} style={{ flex: 2, padding: '12px', background: paymentMethod === 'cod' ? '#21ba45' : '#2185d0', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 'bold', borderRadius: '4px' }}>
              {paymentMethod === 'cod' ? '🛒 Place Order (COD)' : 'Proceed to Online Payment'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// --- DYNAMIC POST-CHECKOUT ARRIVAL SUMMARY VIEW ---
function SuccessPage() {
  const navigate = useNavigate();

  // Dynamically compile calendar metrics exactly 4 days from right now
  const computeDeliveryTimeline = () => {
    const projectedArrival = new Date();
    projectedArrival.setDate(projectedArrival.getDate() + 4); // Standard 4-day delivery target

    // Format options to return a readable string layout (e.g., "Monday, June 29")
    const renderingOptions = { weekday: 'long', month: 'long', day: 'numeric' };
    return projectedArrival.toLocaleDateString('en-IN', renderingOptions);
  };

  const containerLayout = {
    maxWidth: '500px',
    margin: '60px auto',
    padding: '30px',
    border: '1px solid #c2ffd1',
    borderRadius: '12px',
    background: '#f2fff5', // Light green success theme card background
    textAlign: 'center',
    boxShadow: '0 8px 16px rgba(0,0,0,0.04)',
    fontFamily: '"Segoe UI", sans-serif'
  };

  return (
    <div style={containerLayout}>
      <span style={{ fontSize: '48px' }}>🎉</span>
      <h2 style={{ color: '#1eb53a', margin: '15px 0 10px 0' }}>Order Placed Successfully!</h2>
      <p style={{ color: '#555', fontSize: '15px', lineHeight: '1.5' }}>
        Thank you for shopping with us! Your transaction record tracking context has been verified.
      </p>

      {/* 📦 EXPECTED ARRIVAL TIME DISPLAY MODULE */}
      <div style={{ background: '#ffffff', border: '1px solid #d4ebd9', padding: '15px', borderRadius: '8px', margin: '20px 0' }}>
        <span style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#777', fontWeight: 'bold' }}>
          Estimated Delivery Date
        </span>
        <h3 style={{ margin: '5px 0 0 0', color: '#232f3e', fontSize: '20px', fontWeight: 'bold' }}>
          📅 {computeDeliveryTimeline()}
        </h3>
      </div>

      <button
        onClick={() => navigate('/')}
        style={{ width: '100%', padding: '12px', background: '#232f3e', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px', marginTop: '10px' }}
      >
        Continue Shopping
      </button>
    </div>
  );
}


