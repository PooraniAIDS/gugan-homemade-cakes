import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, getDocs, addDoc, deleteDoc, doc } from 'firebase/firestore';

function App() {
  const [cakes, setCakes] = useState([]);
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [imagePreview, setImagePreview] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Cart State
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [customerInfo, setCustomerInfo] = useState({ 
    name: '', 
    phone: '', 
    address: '', 
    notes: '',
    paymentMethod: 'UPI Request (GPay/PhonePe)' 
  });

  // Admin Security State
  const [isAdmin, setIsAdmin] = useState(window.location.pathname === '/admin');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Business WhatsApp Number (88258 35532)
  const BUSINESS_PHONE = "918825835532"; 

  // Fetch Cakes from Firestore
  const fetchCakes = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "cakes"));
      const cakeList = querySnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setCakes(cakeList);
    } catch (err) {
      console.error("Error fetching cakes:", err);
    }
  };

  useEffect(() => {
    fetchCakes();

    const handlePopState = () => {
      setIsAdmin(window.location.pathname === '/admin');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Base64 Image Converter
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("Image size should be less than 2MB!");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  // ADD CAKE (Admin)
  const handleAddCake = async (e) => {
    e.preventDefault();
    if (!title || !price || !imagePreview) return alert("All fields are required!");
    
    try {
      await addDoc(collection(db, "cakes"), {
        title,
        price: Number(price),
        imageUrl: imagePreview
      });
      alert("Cake Added Successfully! 🎂🎉");
      setTitle('');
      setPrice('');
      setImagePreview('');
      fetchCakes();
    } catch (err) {
      alert("Error adding cake: " + err.message);
    }
  };

  // DELETE CAKE (Admin)
  const handleDeleteCake = async (id, cakeTitle) => {
    if (window.confirm(`Delete "${cakeTitle}"?`)) {
      try {
        await deleteDoc(doc(db, "cakes", id));
        alert("Cake Removed! 🗑️");
        fetchCakes();
      } catch (err) {
        alert("Error deleting cake: " + err.message);
      }
    }
  };

  // LOGIN VALIDATION
  const handleLoginSubmit = (e) => {
    e.preventDefault();
    if (loginEmail === "gugan@cakes.com" && loginPassword === "GuganCakes123") {
      setIsLoggedIn(true);
      alert("Welcome Admin! 🔓");
    } else {
      alert("Unauthorized Access! Redirecting to Customer Menu... ❌");
      setLoginEmail('');
      setLoginPassword('');
      navigateTo('/');
    }
  };

  // CART FUNCTIONS
  const addToCart = (cake) => {
    setCart(prevCart => {
      const existing = prevCart.find(item => item.id === cake.id);
      if (existing) {
        return prevCart.map(item => item.id === cake.id ? { ...item, qty: item.qty + 1 } : item);
      }
      return [...prevCart, { ...cake, qty: 1 }];
    });
    setIsCartOpen(true);
  };

  const updateQty = (id, delta) => {
    setCart(prevCart => prevCart.map(item => {
      if (item.id === id) {
        const newQty = item.qty + delta;
        return newQty > 0 ? { ...item, qty: newQty } : null;
      }
      return item;
    }).filter(Boolean));
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);

  // WHATSAPP CHECKOUT WITH PAYMENT OPTION
  const handleCheckoutWhatsApp = (e) => {
    e.preventDefault();
    if (cart.length === 0) return alert("Your cart is empty!");
    if (!customerInfo.name || !customerInfo.phone || !customerInfo.address) {
      return alert("Please fill Name, Phone, and Delivery Address!");
    }

    let itemsList = cart.map((item, index) => `${index + 1}. ${item.title} x ${item.qty} = ₹${item.price * item.qty}`).join('\n');

    const message = `🎂 *NEW ORDER - GUGAN HOMEMADE CAKES* 🎂\n\n` +
      `👤 *Customer Name:* ${customerInfo.name}\n` +
      `📞 *Phone:* ${customerInfo.phone}\n` +
      `🏠 *Delivery Address:* ${customerInfo.address}\n` +
      `💳 *Payment Preference:* ${customerInfo.paymentMethod}\n` +
      (customerInfo.notes ? `📝 *Notes:* ${customerInfo.notes}\n` : '') +
      `\n🛒 *ORDER ITEMS:*\n${itemsList}\n\n` +
      `💰 *GRAND TOTAL:* ₹${cartTotal}\n\n` +
      `Please confirm order availability & share payment details (${customerInfo.paymentMethod})! ❤️`;

    window.open(`https://wa.me/${BUSINESS_PHONE}?text=${encodeURIComponent(message)}`, '_blank');
  };

  // GENERAL ENQUIRY CHAT
  const handleGeneralChat = () => {
    const chatMessage = `Hello Gugan Homemade Cakes! 👋\nI have a query regarding cake designs and availability. Can we chat?`;
    window.open(`https://wa.me/${BUSINESS_PHONE}?text=${encodeURIComponent(chatMessage)}`, '_blank');
  };

  // Router Helper
  const navigateTo = (path) => {
    window.history.pushState({}, '', path);
    setIsAdmin(path === '/admin');
  };

  const filteredCakes = cakes.filter(cake => 
    cake.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ fontFamily: "'Poppins', sans-serif", padding: '20px', maxWidth: '950px', margin: '0 auto', color: '#333', minHeight: '90vh', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      
      {/* 1. CUSTOMER PAGE */}
      {!isAdmin ? (
        <div>
          {/* HEADER */}
          <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px dashed #f48fb1', paddingBottom: '15px', marginBottom: '25px', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h1 style={{ color: '#d81b60', margin: 0, fontSize: '28px', fontWeight: 'bold' }}>Gugan Homemade Cakes 🎂</h1>
              <p style={{ margin: '4px 0 0', color: '#888', fontSize: '14px' }}>Freshly Baked Pure Goodness ❤️</p>
            </div>
            
            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                onClick={handleGeneralChat}
                style={{ background: '#25D366', color: '#fff', border: 'none', padding: '10px 15px', borderRadius: '25px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }}
              >
                Chat / Enquire 💬
              </button>
              <button 
                onClick={() => setIsCartOpen(!isCartOpen)}
                style={{ background: '#d81b60', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: '25px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }}
              >
                🛒 Cart ({cart.reduce((sum, i) => sum + i.qty, 0)})
              </button>
            </div>
          </header>

          {/* SEARCH BAR */}
          <div style={{ marginBottom: '25px', display: 'flex', justifyContent: 'center' }}>
            <input 
              type="text" 
              placeholder="🔍 Search delicious cakes..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '100%', maxWidth: '500px', padding: '12px 20px', borderRadius: '30px', border: '2px solid #f48fb1', fontSize: '15px', outline: 'none' }}
            />
          </div>

          <h2 style={{ color: '#444', fontSize: '22px', marginBottom: '20px' }}>Our Homemade Menu 😋</h2>
          
          {/* CAKES GRID */}
          {filteredCakes.length === 0 ? (
            <p style={{ color: '#777', fontStyle: 'italic', textAlign: 'center', margin: '40px 0' }}>No cakes available right now!</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: '25px' }}>
              {filteredCakes.map(cake => (
                <div key={cake.id} style={{ border: '1px solid #f0f0f0', borderRadius: '15px', overflow: 'hidden', padding: '15px', textAlign: 'center', background: '#fff', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
                  <img src={cake.imageUrl} alt={cake.title} style={{ width: '100%', height: '170px', objectFit: 'cover', borderRadius: '10px' }} />
                  <h3 style={{ margin: '12px 0 6px', fontSize: '18px', color: '#222' }}>{cake.title}</h3>
                  <p style={{ color: '#d81b60', fontWeight: 'bold', fontSize: '20px', margin: '0 0 15px' }}>₹{cake.price}</p>
                  <button 
                    onClick={() => addToCart(cake)}
                    style={{ background: '#e91e63', color: 'white', border: 'none', padding: '10px', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold', width: '100%', fontSize: '14px' }}
                  >
                    🛒 Add To Cart
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* SLIDING CART DRAWER */}
          {isCartOpen && (
            <div style={{ position: 'fixed', top: 0, right: 0, width: '100%', maxWidth: '420px', height: '100vh', background: '#fff', boxShadow: '-5px 0 25px rgba(0,0,0,0.2)', padding: '20px', zIndex: 1000, overflowY: 'auto', boxSizing: 'border-box' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>
                <h2 style={{ margin: 0, color: '#d81b60' }}>Shopping Cart 🛒</h2>
                <button onClick={() => setIsCartOpen(false)} style={{ background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer' }}>❌</button>
              </div>

              {cart.length === 0 ? (
                <div style={{ textAlign: 'center', marginTop: '40px' }}>
                  <p style={{ color: '#777' }}>Your cart is empty!</p>
                  <button onClick={handleGeneralChat} style={{ background: '#25D366', color: 'white', border: 'none', padding: '10px 15px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', marginTop: '10px' }}>
                    Direct Chat via WhatsApp 💬
                  </button>
                </div>
              ) : (
                <>
                  <div style={{ marginTop: '15px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {cart.map(item => (
                      <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f0f0f0', paddingBottom: '10px' }}>
                        <div>
                          <h4 style={{ margin: '0 0 4px', fontSize: '15px' }}>{item.title}</h4>
                          <span style={{ color: '#d81b60', fontWeight: 'bold' }}>₹{item.price * item.qty}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <button onClick={() => updateQty(item.id, -1)} style={{ padding: '2px 8px', borderRadius: '4px', border: '1px solid #ccc', cursor: 'pointer' }}>-</button>
                          <span>{item.qty}</span>
                          <button onClick={() => updateQty(item.id, 1)} style={{ padding: '2px 8px', borderRadius: '4px', border: '1px solid #ccc', cursor: 'pointer' }}>+</button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <h3 style={{ textAlign: 'right', color: '#d81b60', margin: '20px 0 15px' }}>Total Amount: ₹{cartTotal}</h3>

                  {/* CUSTOMER CHECKOUT & PAYMENT SELECTION */}
                  <form onSubmit={handleCheckoutWhatsApp} style={{ display: 'flex', flexDirection: 'column', gap: '10px', background: '#fff0f5', padding: '15px', borderRadius: '10px' }}>
                    <h4 style={{ margin: '0 0 5px', color: '#c2185b' }}>Delivery & Payment Details 🏠</h4>
                    
                    <input type="text" placeholder="Your Name *" required value={customerInfo.name} onChange={e => setCustomerInfo({...customerInfo, name: e.target.value})} style={{ padding: '8px', borderRadius: '5px', border: '1px solid #ccc' }} />
                    <input type="tel" placeholder="Phone Number *" required value={customerInfo.phone} onChange={e => setCustomerInfo({...customerInfo, phone: e.target.value})} style={{ padding: '8px', borderRadius: '5px', border: '1px solid #ccc' }} />
                    <textarea placeholder="Full Delivery Address *" required rows="2" value={customerInfo.address} onChange={e => setCustomerInfo({...customerInfo, address: e.target.value})} style={{ padding: '8px', borderRadius: '5px', border: '1px solid #ccc' }}></textarea>
                    
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '4px', color: '#444' }}>Payment Preference:</label>
                      <select 
                        value={customerInfo.paymentMethod} 
                        onChange={e => setCustomerInfo({...customerInfo, paymentMethod: e.target.value})}
                        style={{ width: '100%', padding: '8px', borderRadius: '5px', border: '1px solid #ccc', background: '#fff' }}
                      >
                        <option value="UPI Request (GPay/PhonePe)">Request UPI ID / QR Code</option>
                        <option value="Pay via WhatsApp">Pay via WhatsApp Payment</option>
                      </select>
                    </div>

                    <input type="text" placeholder="Notes (Eggless / Wording on cake)" value={customerInfo.notes} onChange={e => setCustomerInfo({...customerInfo, notes: e.target.value})} style={{ padding: '8px', borderRadius: '5px', border: '1px solid #ccc' }} />

                    <button type="submit" style={{ background: '#25D366', color: 'white', border: 'none', padding: '12px', borderRadius: '8px', fontWeight: 'bold', fontSize: '15px', cursor: 'pointer', marginTop: '10px' }}>
                      Order via WhatsApp 💬
                    </button>
                  </form>
                </>
              )}
            </div>
          )}
        </div>
      ) : (

        /* 2. ADMIN SECTION */
        <div>
          {!isLoggedIn ? (
            /* ADMIN LOGIN SCREEN */
            <div style={{ maxWidth: '380px', margin: '60px auto', padding: '30px', background: '#fff0f5', borderRadius: '15px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', border: '1px solid #f8bbd0', textAlign: 'center' }}>
              <h2 style={{ color: '#d81b60', marginTop: 0 }}>🔒 Admin Access</h2>
              <p style={{ color: '#666', fontSize: '13px' }}>Enter credentials to manage cakes menu</p>
              
              <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px' }}>
                <input 
                  type="email" 
                  placeholder="Admin Email" 
                  required 
                  value={loginEmail} 
                  onChange={e => setLoginEmail(e.target.value)} 
                  style={{ padding: '12px', borderRadius: '8px', border: '1px solid #ccc', outline: 'none' }} 
                />
                <input 
                  type="password" 
                  placeholder="Password" 
                  required 
                  value={loginPassword} 
                  onChange={e => setLoginPassword(e.target.value)} 
                  style={{ padding: '12px', borderRadius: '8px', border: '1px solid #ccc', outline: 'none' }} 
                />
                <button type="submit" style={{ background: '#d81b60', color: 'white', border: 'none', padding: '12px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '15px' }}>
                  Login to Admin 🔑
                </button>
              </form>
              <button onClick={() => navigateTo('/')} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', marginTop: '15px', fontSize: '13px', textDecoration: 'underline' }}>
                Back to Customer Site
              </button>
            </div>
          ) : (
            /* ADMIN DASHBOARD */
            <div>
              <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '3px solid #d81b60', paddingBottom: '12px', marginBottom: '25px' }}>
                <h1 style={{ color: '#d81b60', margin: 0, fontSize: '24px' }}>🔒 Admin Dashboard</h1>
                <button 
                  onClick={() => { setIsLoggedIn(false); navigateTo('/'); }}
                  style={{ background: '#333', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  Logout 🚪
                </button>
              </header>

              {/* ADD CAKE FORM */}
              <div style={{ background: '#fff0f5', padding: '20px', borderRadius: '12px', marginBottom: '35px', border: '1px solid #f8bbd0' }}>
                <h2 style={{ color: '#c2185b', marginTop: 0 }}>Add New Cake to Menu ➕</h2>
                <form onSubmit={handleAddCake} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Cake Name:</label>
                    <input type="text" placeholder="Eg: Chocolate Truffle Cake" value={title} onChange={e => setTitle(e.target.value)} style={{ padding: '10px', width: '97%', borderRadius: '6px', border: '1px solid #ccc' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Price (₹):</label>
                    <input type="number" placeholder="Eg: 650" value={price} onChange={e => setPrice(e.target.value)} style={{ padding: '10px', width: '97%', borderRadius: '6px', border: '1px solid #ccc' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Browse Cake Photo:</label>
                    <input type="file" accept="image/*" onChange={handleImageChange} style={{ padding: '8px 0' }} />
                    {imagePreview && (
                      <div style={{ marginTop: '10px' }}>
                        <p style={{ fontSize: '12px', color: '#555' }}>Image Preview:</p>
                        <img src={imagePreview} alt="Selected" style={{ width: '120px', height: '120px', objectFit: 'cover', borderRadius: '8px', border: '2px solid #d81b60' }} />
                      </div>
                    )}
                  </div>
                  <button type="submit" style={{ background: '#4CAF50', color: 'white', border: 'none', padding: '12px', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold', borderRadius: '6px' }}>Publish Cake To Website 🚀</button>
                </form>
              </div>

              {/* DELETE CAKES */}
              <h2>Manage Existing Cakes (Delete) 🗑️</h2>
              {cakes.length === 0 ? (
                <p>No cakes added yet.</p>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px' }}>
                  {cakes.map(cake => (
                    <div key={cake.id} style={{ border: '1px solid #eee', borderRadius: '10px', overflow: 'hidden', padding: '12px', textAlign: 'center', background: '#fff' }}>
                      <img src={cake.imageUrl} alt={cake.title} style={{ width: '100%', height: '140px', objectFit: 'cover', borderRadius: '8px' }} />
                      <h3 style={{ margin: '10px 0 5px', fontSize: '16px' }}>{cake.title}</h3>
                      <p style={{ color: '#d81b60', fontWeight: 'bold', fontSize: '18px', margin: '5px 0 10px' }}>₹{cake.price}</p>
                      <button 
                        onClick={() => handleDeleteCake(cake.id, cake.title)} 
                        style={{ background: '#ff4d4d', color: 'white', border: 'none', padding: '8px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', width: '100%' }}
                      >
                        Delete Cake 🗑️
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* FOOTER WITH SECRET DOT */}
      <footer style={{ textAlign: 'center', marginTop: '40px', paddingTop: '20px', borderTop: '1px solid #eee', color: '#888', fontSize: '13px' }}>
        <span>© 2026 Gugan Homemade Cakes. All rights reserved</span>
        <span 
          onClick={() => navigateTo('/admin')} 
          style={{ cursor: 'pointer', userSelect: 'none', paddingLeft: '2px' }}
        >
          .
        </span>
      </footer>

    </div>
  );
}

export default App;