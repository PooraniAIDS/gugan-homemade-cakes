import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, getDocs, addDoc, deleteDoc, updateDoc, doc } from 'firebase/firestore';

function App() {
  const [cakes, setCakes] = useState([]);
  
  // Form States
  const [editingId, setEditingId] = useState(null);
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [weight, setWeight] = useState('1/2 kg');
  const [category, setCategory] = useState('Cakes');
  const [eggType, setEggType] = useState('Eggless');
  const [imagePreview, setImagePreview] = useState('');

  // Filter & UI States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedEggType, setSelectedEggType] = useState('All');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeModalPage, setActiveModalPage] = useState(null);

  // Cart & Checkout
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [customerInfo, setCustomerInfo] = useState({ 
    name: '', 
    phone: '', 
    address: '', 
    locationZone: 'Chennai',
    notes: '' 
  });

  // Admin Security
  const [isAdmin, setIsAdmin] = useState(window.location.pathname === '/admin');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const BUSINESS_PHONE = "918825835532";
  const ADMIN_NAME = "Gayathri Devi";

  // Fetch Cakes
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
    const handlePopState = () => setIsAdmin(window.location.pathname === '/admin');
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Image Upload Handler
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) return alert("Image size should be less than 2MB!");
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  // ADD or EDIT CAKE
  const handleSaveCake = async (e) => {
    e.preventDefault();
    if (!title || !price || !imagePreview) return alert("All fields are required!");

    try {
      if (editingId) {
        await updateDoc(doc(db, "cakes", editingId), {
          title,
          price: Number(price),
          quantity: Number(quantity),
          weight,
          category,
          eggType,
          imageUrl: imagePreview
        });
        alert("Cake Details Updated Successfully! ✨");
      } else {
        await addDoc(collection(db, "cakes"), {
          title,
          price: Number(price),
          quantity: Number(quantity),
          weight,
          category,
          eggType,
          imageUrl: imagePreview
        });
        alert("New Cake Added To Menu! 🎂🎉");
      }

      // Reset Form
      setEditingId(null);
      setTitle('');
      setPrice('');
      setQuantity('1');
      setWeight('1/2 kg');
      setCategory('Cakes');
      setEggType('Eggless');
      setImagePreview('');
      fetchCakes();
    } catch (err) {
      alert("Error saving cake: " + err.message);
    }
  };

  // EDIT CLICK
  const handleEditClick = (cake) => {
    setEditingId(cake.id);
    setTitle(cake.title);
    setPrice(cake.price);
    setQuantity(cake.quantity || 1);
    setWeight(cake.weight || '1/2 kg');
    setCategory(cake.category || 'Cakes');
    setEggType(cake.eggType || 'Eggless');
    setImagePreview(cake.imageUrl);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // DELETE CAKE
  const handleDeleteCake = async (id, cakeTitle) => {
    if (window.confirm(`Delete "${cakeTitle}" from menu?`)) {
      try {
        await deleteDoc(doc(db, "cakes", id));
        alert("Cake Removed! 🗑️");
        fetchCakes();
      } catch (err) {
        alert("Error deleting cake: " + err.message);
      }
    }
  };

  // LOGIN ADMIN
  const handleLoginSubmit = (e) => {
    e.preventDefault();
    if (loginEmail === "gugan@cakes.com" && loginPassword === "GuganCakes123") {
      setIsLoggedIn(true);
      alert(`Welcome Back, ${ADMIN_NAME}! 🔑`);
    } else {
      alert("Unauthorized Admin Credentials!");
    }
  };

  // CART LOGIC
  const addToCart = (cake) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === cake.id);
      if (existing) {
        return prev.map(item => item.id === cake.id ? { ...item, qty: item.qty + 1 } : item);
      }
      return [...prev, { ...cake, qty: 1 }];
    });
    setIsCartOpen(true);
  };

  const updateQty = (id, delta) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = item.qty + delta;
        return newQty > 0 ? { ...item, qty: newQty } : null;
      }
      return item;
    }).filter(Boolean));
  };

  const cartItemsSubtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);

  // EXACT COURIER CHARGE MATRIX
  const calculateCourierCharge = () => {
    if (cart.length === 0) return 0;
    
    const zone = customerInfo.locationZone;
    const sampleWeight = cart[0]?.weight || '1/2 kg';

    const matrix = {
      'Chennai': { '1/4 kg': 40, '1/2 kg': 60, '1 kg': 80, '1.5 kg': 100, '2 kg': 150 },
      'Tamil Nadu': { '1/4 kg': 60, '1/2 kg': 80, '1 kg': 100, '1.5 kg': 150, '2 kg': 200 },
      'AP / KAR / KER': { '1/4 kg': 80, '1/2 kg': 110, '1 kg': 150, '1.5 kg': 190, '2 kg': 230 }
    };

    return matrix[zone]?.[sampleWeight] || 60;
  };

  const courierCharge = calculateCourierCharge();
  const grandTotal = cartItemsSubtotal + courierCharge;

  // WHATSAPP CHECKOUT
  const handleCheckoutWhatsApp = (e) => {
    e.preventDefault();
    if (cart.length === 0) return alert("Your cart is empty!");
    if (!customerInfo.name || !customerInfo.phone || !customerInfo.address) {
      return alert("Please fill Name, Phone, and Delivery Address!");
    }

    let itemsList = cart.map((item, index) => `${index + 1}. ${item.title} (${item.weight || '1/2 kg'}, ${item.eggType || 'Eggless'}) x ${item.qty} = ₹${item.price * item.qty}`).join('\n');

    const message = `🎂 *NEW ORDER - GUGAN HOMEMADE CAKES* 🎂\n\n` +
      `👤 *Customer Name:* ${customerInfo.name}\n` +
      `📞 *Phone:* ${customerInfo.phone}\n` +
      `🏠 *Delivery Address:* ${customerInfo.address}\n` +
      `📍 *Location Zone:* ${customerInfo.locationZone}\n` +
      (customerInfo.notes ? `📝 *Notes:* ${customerInfo.notes}\n` : '') +
      `\n🛒 *ITEMS ORDERED:*\n${itemsList}\n\n` +
      `📦 *Items Total:* ₹${cartItemsSubtotal}\n` +
      `🚚 *Courier Charge (${customerInfo.locationZone}):* ₹${courierCharge}\n` +
      `💰 *GRAND TOTAL:* ₹${grandTotal}\n\n` +
      `Please confirm order and send payment details! ❤️`;

    window.open(`https://wa.me/${BUSINESS_PHONE}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const navigateTo = (path) => {
    window.history.pushState({}, '', path);
    setIsAdmin(path === '/admin');
    setIsSidebarOpen(false);
  };

  // FILTERED CAKES
  const filteredCakes = cakes.filter(cake => {
    const matchesSearch = cake.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || cake.category === selectedCategory;
    const matchesEgg = selectedEggType === 'All' || cake.eggType === selectedEggType;
    return matchesSearch && matchesCategory && matchesEgg;
  });

  return (
    <div style={{ fontFamily: "'Poppins', sans-serif", background: '#fafafa', minHeight: '100vh', color: '#333' }}>
      
      {/* 1. CUSTOMER STOREFRONT */}
      {!isAdmin ? (
        <div>
          {/* HEADER */}
          <header style={{ background: '#fff', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', padding: '12px 20px', position: 'sticky', top: 0, zIndex: 100, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <button onClick={() => setIsSidebarOpen(true)} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' }}>☰</button>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '45px', height: '45px', borderRadius: '50%', background: '#f8bbd0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#d81b60', border: '2px solid #d81b60' }}>GHC</div>
                <div>
                  <h2 style={{ margin: 0, fontSize: '18px', color: '#d81b60', fontWeight: 'bold' }}>Gugan Homemade Cakes</h2>
                  <p style={{ margin: 0, fontSize: '11px', color: '#777' }}>By Gayathri Devi</p>
                </div>
              </div>
            </div>

            <button 
              onClick={() => setIsCartOpen(true)}
              style={{ background: '#d81b60', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '20px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              🛒 <span>{cart.reduce((s, i) => s + i.qty, 0)}</span>
            </button>
          </header>

          {/* SIDEBAR NAVIGATION (DRAWER LIKE SCREENSHOT) */}
          {isSidebarOpen && (
            <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100vh', background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex' }}>
              <div style={{ width: '280px', background: '#fff', height: '100%', padding: '20px', boxSizing: 'border-box', overflowY: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee', paddingBottom: '15px', marginBottom: '15px' }}>
                  <h3 style={{ margin: 0, color: '#d81b60' }}>Menu</h3>
                  <button onClick={() => setIsSidebarOpen(false)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}>✕</button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '15px' }}>
                  <div onClick={() => setIsSidebarOpen(false)} style={{ padding: '8px 0', cursor: 'pointer', color: '#d81b60', fontWeight: 'bold' }}>Home</div>
                  <div onClick={() => setIsSidebarOpen(false)} style={{ padding: '8px 0', cursor: 'pointer' }}>Shop</div>
                  
                  <div style={{ borderTop: '1px solid #eee', paddingTop: '10px', marginTop: '5px', color: '#888', fontSize: '12px', fontWeight: 'bold' }}>CATEGORIES</div>
                  {['All', 'Cakes', 'Brownies', 'Assorted Tub', 'Birthday Slabs', 'Blondie'].map(cat => (
                    <div 
                      key={cat} 
                      onClick={() => { setSelectedCategory(cat); setIsSidebarOpen(false); }}
                      style={{ padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', background: selectedCategory === cat ? '#fff0f5' : 'transparent', color: selectedCategory === cat ? '#d81b60' : '#444' }}
                    >
                      {cat}
                    </div>
                  ))}

                  <div style={{ borderTop: '1px solid #eee', paddingTop: '10px', marginTop: '10px', color: '#888', fontSize: '12px', fontWeight: 'bold' }}>POLICIES & ABOUT</div>
                  <div onClick={() => { setActiveModalPage('Terms & Conditions'); setIsSidebarOpen(false); }} style={{ padding: '6px 0', cursor: 'pointer', color: '#555' }}>Terms & Conditions</div>
                  <div onClick={() => { setActiveModalPage('Privacy Policy'); setIsSidebarOpen(false); }} style={{ padding: '6px 0', cursor: 'pointer', color: '#555' }}>Privacy Policy</div>
                  <div onClick={() => { setActiveModalPage('Shipping Policy'); setIsSidebarOpen(false); }} style={{ padding: '6px 0', cursor: 'pointer', color: '#555' }}>Shipping Policy</div>
                  <div onClick={() => { setActiveModalPage('Refund & Cancellation Policy'); setIsSidebarOpen(false); }} style={{ padding: '6px 0', cursor: 'pointer', color: '#555' }}>Refund & Cancellation Policy</div>
                  <div onClick={() => { setActiveModalPage('About Us'); setIsSidebarOpen(false); }} style={{ padding: '6px 0', cursor: 'pointer', color: '#555' }}>About Us</div>
                  <div onClick={() => { setActiveModalPage('Contact Us'); setIsSidebarOpen(false); }} style={{ padding: '6px 0', cursor: 'pointer', color: '#555' }}>Contact Us</div>
                </div>
              </div>
              <div style={{ flex: 1 }} onClick={() => setIsSidebarOpen(false)}></div>
            </div>
          )}

          {/* MAIN PAGE SEARCH & FILTERS */}
          <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto' }}>
            <div style={{ background: '#fff', padding: '15px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', marginBottom: '20px' }}>
              <input 
                type="text" 
                placeholder="🔍 Search for brownies, cakes, flavors..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{ width: '96%', padding: '12px', borderRadius: '25px', border: '1px solid #f8bbd0', fontSize: '14px', outline: 'none' }}
              />

              <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', marginTop: '15px', paddingBottom: '5px' }}>
                {['All', 'Cakes', 'Brownies', 'Assorted Tub', 'Birthday Slabs', 'Blondie'].map(cat => (
                  <button 
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    style={{ background: selectedCategory === cat ? '#d81b60' : '#f5f5f5', color: selectedCategory === cat ? '#fff' : '#555', border: 'none', padding: '6px 14px', borderRadius: '20px', cursor: 'pointer', fontSize: '13px', whiteSpace: 'nowrap' }}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                {['All', 'Eggless', 'Contains Egg'].map(type => (
                  <button 
                    key={type}
                    onClick={() => setSelectedEggType(type)}
                    style={{ background: selectedEggType === type ? '#4CAF50' : '#f0f0f0', color: selectedEggType === type ? '#fff' : '#666', border: 'none', padding: '4px 12px', borderRadius: '15px', fontSize: '12px', cursor: 'pointer' }}
                  >
                    {type === 'Eggless' ? '🌱 Eggless' : type === 'Contains Egg' ? '🥚 Contains Egg' : 'All Types'}
                  </button>
                ))}
              </div>
            </div>

            {/* PRODUCT GRID */}
            <h3 style={{ color: '#444', marginBottom: '15px' }}>Freshly Baked Collection 😋</h3>
            
            {filteredCakes.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#777', margin: '40px 0' }}>No products found!</p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '20px' }}>
                {filteredCakes.map(cake => (
                  <div key={cake.id} style={{ background: '#fff', borderRadius: '12px', overflow: 'hidden', padding: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <img src={cake.imageUrl} alt={cake.title} style={{ width: '100%', height: '160px', objectFit: 'cover', borderRadius: '8px' }} />
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                        <span style={{ fontSize: '11px', background: '#fff0f5', color: '#d81b60', padding: '2px 8px', borderRadius: '10px', fontWeight: 'bold' }}>{cake.category || 'Cakes'}</span>
                        <span style={{ fontSize: '11px', color: '#4CAF50', fontWeight: 'bold' }}>{cake.eggType || 'Eggless'}</span>
                      </div>
                      <h4 style={{ margin: '8px 0 4px', fontSize: '16px' }}>{cake.title}</h4>
                      <p style={{ color: '#888', fontSize: '12px', margin: '0 0 8px' }}>Weight: {cake.weight || '1/2 kg'}</p>
                    </div>

                    <div>
                      <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#d81b60', marginBottom: '10px' }}>₹{cake.price}</div>
                      <button 
                        onClick={() => addToCart(cake)}
                        style={{ background: '#d81b60', color: '#fff', border: 'none', padding: '10px', borderRadius: '8px', width: '100%', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}
                      >
                        🛒 Add To Cart
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* CART DRAWER & COURIER CHARGE MATRIX */}
          {isCartOpen && (
            <div style={{ position: 'fixed', top: 0, right: 0, width: '100%', maxWidth: '420px', height: '100vh', background: '#fff', boxShadow: '-5px 0 25px rgba(0,0,0,0.2)', padding: '20px', zIndex: 1000, overflowY: 'auto', boxSizing: 'border-box' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>
                <h3 style={{ margin: 0, color: '#d81b60' }}>Your Cart 🛒</h3>
                <button onClick={() => setIsCartOpen(false)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}>✕</button>
              </div>

              {cart.length === 0 ? (
                <p style={{ marginTop: '30px', color: '#777' }}>Your cart is empty!</p>
              ) : (
                <>
                  <div style={{ marginTop: '15px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {cart.map(item => (
                      <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f0f0f0', paddingBottom: '8px' }}>
                        <div>
                          <h5 style={{ margin: '0 0 2px', fontSize: '14px' }}>{item.title} ({item.weight || '1/2 kg'})</h5>
                          <span style={{ color: '#d81b60', fontWeight: 'bold', fontSize: '13px' }}>₹{item.price * item.qty}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <button onClick={() => updateQty(item.id, -1)} style={{ padding: '2px 6px' }}>-</button>
                          <span>{item.qty}</span>
                          <button onClick={() => updateQty(item.id, 1)} style={{ padding: '2px 6px' }}>+</button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* CUSTOMER ADDRESS & COURIER CALCULATION */}
                  <form onSubmit={handleCheckoutWhatsApp} style={{ marginTop: '20px', background: '#fff0f5', padding: '15px', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <h4 style={{ margin: '0 0 5px', color: '#c2185b' }}>Delivery & Courier Details 🚚</h4>

                    <input type="text" placeholder="Full Name *" required value={customerInfo.name} onChange={e => setCustomerInfo({...customerInfo, name: e.target.value})} style={{ padding: '8px', borderRadius: '5px', border: '1px solid #ccc' }} />
                    <input type="tel" placeholder="Phone Number *" required value={customerInfo.phone} onChange={e => setCustomerInfo({...customerInfo, phone: e.target.value})} style={{ padding: '8px', borderRadius: '5px', border: '1px solid #ccc' }} />
                    <textarea placeholder="Full Delivery Address *" required rows="2" value={customerInfo.address} onChange={e => setCustomerInfo({...customerInfo, address: e.target.value})} style={{ padding: '8px', borderRadius: '5px', border: '1px solid #ccc' }}></textarea>

                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '3px' }}>Courier Zone:</label>
                      <select 
                        value={customerInfo.locationZone} 
                        onChange={e => setCustomerInfo({...customerInfo, locationZone: e.target.value})}
                        style={{ width: '100%', padding: '8px', borderRadius: '5px', border: '1px solid #ccc', background: '#fff' }}
                      >
                        <option value="Chennai">Chennai Zone</option>
                        <option value="Tamil Nadu">Rest of Tamil Nadu</option>
                        <option value="AP / KAR / KER">AP / Karnataka / Kerala</option>
                      </select>
                    </div>

                    <div style={{ background: '#fff', padding: '10px', borderRadius: '6px', border: '1px dashed #f8bbd0', marginTop: '5px', fontSize: '13px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Items Subtotal:</span>
                        <span>₹{cartItemsSubtotal}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#d81b60', marginTop: '4px' }}>
                        <span>Courier Charge ({customerInfo.locationZone}):</span>
                        <span>+ ₹{courierCharge}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '15px', marginTop: '8px', borderTop: '1px solid #eee', paddingTop: '6px', color: '#4CAF50' }}>
                        <span>Grand Total:</span>
                        <span>₹{grandTotal}</span>
                      </div>
                    </div>

                    <button type="submit" style={{ background: '#25D366', color: 'white', border: 'none', padding: '12px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', marginTop: '5px' }}>
                      Order via WhatsApp 💬
                    </button>
                  </form>
                </>
              )}
            </div>
          )}

          {/* POLICY MODALS */}
          {activeModalPage && (
            <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100vh', background: 'rgba(0,0,0,0.6)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
              <div style={{ background: '#fff', borderRadius: '12px', padding: '25px', maxWidth: '500px', width: '100%', maxHeight: '80vh', overflowY: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                  <h3 style={{ margin: 0, color: '#d81b60' }}>{activeModalPage}</h3>
                  <button onClick={() => setActiveModalPage(null)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}>✕</button>
                </div>
                <p style={{ color: '#555', fontSize: '14px', lineHeight: '1.6' }}>
                  Welcome to <strong>Gugan Homemade Cakes</strong> by Gayathri Devi! We prepare fresh 100% hygienic, egg & eggless cakes, brownies and slabs with love. Express shipping available across Chennai, Tamil Nadu, and South India.
                </p>
              </div>
            </div>
          )}
        </div>
      ) : (

        /* 2. ADMIN DASHBOARD FOR GAYATHRI DEVI */
        <div>
          {!isLoggedIn ? (
            <div style={{ maxWidth: '380px', margin: '60px auto', padding: '30px', background: '#fff0f5', borderRadius: '15px', border: '1px solid #f8bbd0', textAlign: 'center' }}>
              <h2 style={{ color: '#d81b60', marginTop: 0 }}>🔒 Admin Access</h2>
              <p style={{ color: '#666', fontSize: '13px' }}>Owner: <strong>Gayathri Devi</strong></p>
              
              <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px' }}>
                <input type="email" placeholder="Admin Email" required value={loginEmail} onChange={e => setLoginEmail(e.target.value)} style={{ padding: '12px', borderRadius: '8px', border: '1px solid #ccc' }} />
                <input type="password" placeholder="Password" required value={loginPassword} onChange={e => setLoginPassword(e.target.value)} style={{ padding: '12px', borderRadius: '8px', border: '1px solid #ccc' }} />
                <button type="submit" style={{ background: '#d81b60', color: 'white', border: 'none', padding: '12px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>Login 🔑</button>
              </form>
            </div>
          ) : (
            <div style={{ maxWidth: '900px', margin: '0 auto', padding: '20px' }}>
              <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '3px solid #d81b60', paddingBottom: '12px', marginBottom: '25px' }}>
                <div>
                  <h2 style={{ color: '#d81b60', margin: 0 }}>🔒 Admin Dashboard</h2>
                  <p style={{ margin: 0, fontSize: '13px', color: '#666' }}>Owner: <strong>{ADMIN_NAME}</strong></p>
                </div>
                <button onClick={() => { setIsLoggedIn(false); navigateTo('/'); }} style={{ background: '#333', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>Logout 🚪</button>
              </header>

              {/* ADD / EDIT FORM */}
              <div style={{ background: '#fff0f5', padding: '20px', borderRadius: '12px', marginBottom: '35px', border: '1px solid #f8bbd0' }}>
                <h3 style={{ color: '#c2185b', marginTop: 0 }}>{editingId ? 'Edit Product Details ✏️' : 'Add New Cake / Product ➕'}</h3>
                
                <form onSubmit={handleSaveCake} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold', fontSize: '13px' }}>Item Name:</label>
                      <input type="text" placeholder="Eg: Ferrero Rocher Brownie" value={title} onChange={e => setTitle(e.target.value)} style={{ padding: '10px', width: '90%', borderRadius: '6px', border: '1px solid #ccc' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold', fontSize: '13px' }}>Price (₹):</label>
                      <input type="number" placeholder="Eg: 510" value={price} onChange={e => setPrice(e.target.value)} style={{ padding: '10px', width: '90%', borderRadius: '6px', border: '1px solid #ccc' }} />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold', fontSize: '13px' }}>Quantity Available:</label>
                      <input type="number" value={quantity} onChange={e => setQuantity(e.target.value)} style={{ padding: '10px', width: '80%', borderRadius: '6px', border: '1px solid #ccc' }} />
                    </div>

                    <div>
                      <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold', fontSize: '13px' }}>Category:</label>
                      <select value={category} onChange={e => setCategory(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}>
                        <option value="Cakes">Cakes</option>
                        <option value="Brownies">Brownies</option>
                        <option value="Assorted Tub">Assorted Tub</option>
                        <option value="Birthday Slabs">Birthday Slabs</option>
                        <option value="Blondie">Blondie</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold', fontSize: '13px' }}>Weight:</label>
                      <select value={weight} onChange={e => setWeight(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}>
                        <option value="1/4 kg">1/4 kg</option>
                        <option value="1/2 kg">1/2 kg</option>
                        <option value="1 kg">1 kg</option>
                        <option value="1.5 kg">1.5 kg</option>
                        <option value="2 kg">2 kg</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold', fontSize: '13px' }}>Type:</label>
                      <select value={eggType} onChange={e => setEggType(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}>
                        <option value="Eggless">Eggless 🌱</option>
                        <option value="Contains Egg">Contains Egg 🥚</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold', fontSize: '13px' }}>Product Photo:</label>
                    <input type="file" accept="image/*" onChange={handleImageChange} style={{ padding: '5px 0' }} />
                    {imagePreview && (
                      <img src={imagePreview} alt="Preview" style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '8px', marginTop: '10px', border: '2px solid #d81b60' }} />
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button type="submit" style={{ background: '#4CAF50', color: 'white', border: 'none', padding: '12px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', flex: 1 }}>
                      {editingId ? 'Update Item Details ✏️' : 'Add To Menu 🚀'}
                    </button>
                    {editingId && (
                      <button type="button" onClick={() => setEditingId(null)} style={{ background: '#777', color: 'white', border: 'none', padding: '12px', borderRadius: '6px', cursor: 'pointer' }}>
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
              </div>

              {/* LIST PRODUCTS WITH EDIT & DELETE */}
              <h3>Existing Menu Items (Edit / Delete)</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '15px' }}>
                {cakes.map(cake => (
                  <div key={cake.id} style={{ border: '1px solid #eee', borderRadius: '10px', padding: '10px', background: '#fff', textAlign: 'center' }}>
                    <img src={cake.imageUrl} alt={cake.title} style={{ width: '100%', height: '130px', objectFit: 'cover', borderRadius: '8px' }} />
                    <h4 style={{ margin: '8px 0 4px', fontSize: '15px' }}>{cake.title}</h4>
                    <p style={{ color: '#d81b60', fontWeight: 'bold', margin: '0 0 10px' }}>₹{cake.price} ({cake.weight}) | Qty: {cake.quantity || 1}</p>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button onClick={() => handleEditClick(cake)} style={{ background: '#2196F3', color: 'white', border: 'none', padding: '6px', borderRadius: '4px', cursor: 'pointer', flex: 1, fontSize: '12px', fontWeight: 'bold' }}>Edit ✏️</button>
                      <button onClick={() => handleDeleteCake(cake.id, cake.title)} style={{ background: '#ff4d4d', color: 'white', border: 'none', padding: '6px', borderRadius: '4px', cursor: 'pointer', flex: 1, fontSize: '12px', fontWeight: 'bold' }}>Delete 🗑️</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* FOOTER */}
      <footer style={{ textAlign: 'center', padding: '20px', color: '#888', fontSize: '12px', borderTop: '1px solid #eee', marginTop: '40px' }}>
        <span>© 2026 Gugan Homemade Cakes. All rights reserved</span>
        <span onClick={() => navigateTo('/admin')} style={{ cursor: 'pointer', paddingLeft: '2px' }}>.</span>
      </footer>

    </div>
  );
}

export default App;