import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, getDocs, addDoc, deleteDoc, updateDoc, doc } from 'firebase/firestore';

function App() {
  const [cakes, setCakes] = useState([]);
  const [categories, setCategories] = useState(['Offers', '300gms Brownies', 'Assorted Tub', 'Birthday Slabs', 'Blondie']);
  const [offersList, setOffersList] = useState(['Diwali Special - 10% OFF', 'Free Shipping on orders above ₹1500']);
  const [customPages, setCustomPages] = useState(['Festival Specials', 'Bulk Gifting']);
  const [ordersList, setOrdersList] = useState([]);

  // Product Inputs (Admin)
  const [editingId, setEditingId] = useState(null);
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [weight, setWeight] = useState('');
  const [category, setCategory] = useState('');
  const [eggType, setEggType] = useState('Eggless');
  const [imagePreview, setImagePreview] = useState('');

  // Admin Dynamic Custom Fields
  const [editingCatIndex, setEditingCatIndex] = useState(null);
  const [categoryInput, setCategoryInput] = useState('');

  const [editingOfferIndex, setEditingOfferIndex] = useState(null);
  const [offerInput, setOfferInput] = useState('');

  const [editingPageIndex, setEditingPageIndex] = useState(null);
  const [pageInput, setPageInput] = useState('');

  // Search & Navigation States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedEggType, setSelectedEggType] = useState('All');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);
  const [currentPageView, setCurrentPageView] = useState('shop');

  // Customer Account Database & Auth States
  const [registeredUsers, setRegisteredUsers] = useState(() => {
    const saved = localStorage.getItem('ghc_users');
    return saved ? JSON.parse(saved) : [];
  });
  const [currentUser, setCurrentUser] = useState(() => {
    const savedSession = localStorage.getItem('ghc_active_session');
    return savedSession ? JSON.parse(savedSession) : null;
  });

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'register'
  const [authName, setAuthName] = useState('');
  const [authPhone, setAuthPhone] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');

  // Cart, Wishlist & Checkout
  const [cart, setCart] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [customerInfo, setCustomerInfo] = useState({ 
    name: '', phone: '', address: '', locationZone: 'Chennai', notes: '' 
  });

  // Admin Security
  const [viewMode, setViewMode] = useState('customer');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const BUSINESS_PHONE = "918825835532";
  const ADMIN_NAME = "Gayathri Devi";

  const fetchData = async () => {
    try {
      const cakeDocs = await getDocs(collection(db, "cakes"));
      setCakes(cakeDocs.docs.map(d => ({ id: d.id, ...d.data() })));

      const orderDocs = await getDocs(collection(db, "orders"));
      setOrdersList(orderDocs.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error("Error fetching data:", err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Save Registered Users
  useEffect(() => {
    localStorage.setItem('ghc_users', JSON.stringify(registeredUsers));
  }, [registeredUsers]);

  // Save Active Session
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('ghc_active_session', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('ghc_active_session');
    }
  }, [currentUser]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) return alert("Image size should be less than 2MB!");
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  // PRODUCT CRUD
  const handleSaveCake = async (e) => {
    e.preventDefault();
    if (!title || !price || !category || !weight || !imagePreview) return alert("Fill all product details!");

    try {
      if (editingId) {
        await updateDoc(doc(db, "cakes", editingId), {
          title, price: Number(price), quantity: Number(quantity), weight, category, eggType, imageUrl: imagePreview
        });
        alert("Product Updated Successfully! ✨");
      } else {
        await addDoc(collection(db, "cakes"), {
          title, price: Number(price), quantity: Number(quantity), weight, category, eggType, imageUrl: imagePreview
        });
        alert("New Product Added To Menu! 🎂🎉");
      }

      setEditingId(null); setTitle(''); setPrice(''); setQuantity('1'); setWeight(''); setCategory(''); setImagePreview('');
      fetchData();
    } catch (err) {
      alert("Error saving item: " + err.message);
    }
  };

  const handleDeleteCake = async (id, cakeTitle) => {
    if (window.confirm(`Delete "${cakeTitle}" from menu?`)) {
      await deleteDoc(doc(db, "cakes", id));
      alert("Item Removed! 🗑️");
      fetchData();
    }
  };

  // DYNAMIC CATEGORY CRUD
  const handleSaveCategory = (e) => {
    e.preventDefault();
    if (!categoryInput.trim()) return;
    if (editingCatIndex !== null) {
      const updated = [...categories];
      updated[editingCatIndex] = categoryInput.trim();
      setCategories(updated);
      setEditingCatIndex(null);
    } else {
      setCategories([...categories, categoryInput.trim()]);
    }
    setCategoryInput('');
  };

  // DYNAMIC OFFER CRUD
  const handleSaveOffer = (e) => {
    e.preventDefault();
    if (!offerInput.trim()) return;
    if (editingOfferIndex !== null) {
      const updated = [...offersList];
      updated[editingOfferIndex] = offerInput.trim();
      setOffersList(updated);
      setEditingOfferIndex(null);
    } else {
      setOffersList([...offersList, offerInput.trim()]);
    }
    setOfferInput('');
  };

  // DYNAMIC MENU PAGE CRUD
  const handleSaveCustomPage = (e) => {
    e.preventDefault();
    if (!pageInput.trim()) return;
    if (editingPageIndex !== null) {
      const updated = [...customPages];
      updated[editingPageIndex] = pageInput.trim();
      setCustomPages(updated);
      setEditingPageIndex(null);
    } else {
      setCustomPages([...customPages, pageInput.trim()]);
    }
    setPageInput('');
  };

  // REAL AUTHENTICATED CUSTOMER LOGIN / REGISTER
  const handleAuthSubmit = (e) => {
    e.preventDefault();
    const cleanEmail = authEmail.trim().toLowerCase();

    if (authMode === 'register') {
      const existingUser = registeredUsers.find(u => u.email === cleanEmail);
      if (existingUser) {
        return alert("An account with this email already exists! Please Login.");
      }

      const newUser = { 
        id: Date.now(),
        name: authName.trim(), 
        phone: authPhone.trim(),
        email: cleanEmail, 
        password: authPassword, 
        orderHistory: [] 
      };

      setRegisteredUsers(prev => [...prev, newUser]);
      setCurrentUser(newUser);
      alert(`Registration Successful! Welcome ${newUser.name} 🎉`);
      setIsAuthModalOpen(false);
      setAuthName(''); setAuthPhone(''); setAuthEmail(''); setAuthPassword('');

    } else {
      // LOGIN VALIDATION
      const matchedUser = registeredUsers.find(u => u.email === cleanEmail);
      if (!matchedUser) {
        return alert("Account not found! Please Click 'Register Here' to create a new account.");
      }
      if (matchedUser.password !== authPassword) {
        return alert("Incorrect Password! Please try again.");
      }

      setCurrentUser(matchedUser);
      alert(`Welcome Back, ${matchedUser.name}! 🔑`);
      setIsAuthModalOpen(false);
      setAuthEmail(''); setAuthPassword('');
    }
  };

  // ADMIN LOGIN
  const handleAdminLogin = (e) => {
    e.preventDefault();
    if (loginEmail === "gugan@cakes.com" && loginPassword === "GuganCakes123") {
      setIsLoggedIn(true);
    } else {
      alert("Invalid Admin Credentials!");
    }
  };

  // WISHLIST TOGGLE
  const toggleWishlist = (cake) => {
    if (!currentUser) {
      alert("Please Login or Register to save items to your Favorites!");
      return setIsAuthModalOpen(true);
    }
    setWishlist(prev => {
      const exists = prev.find(item => item.id === cake.id);
      if (exists) return prev.filter(item => item.id !== cake.id);
      return [...prev, cake];
    });
  };

  // CART & COURIER CALCULATION
  const addToCart = (cake) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === cake.id);
      if (existing) return prev.map(item => item.id === cake.id ? { ...item, qty: item.qty + 1 } : item);
      return [...prev, { ...cake, qty: 1 }];
    });
    setIsCartOpen(true);
  };

  const updateQty = (id, delta) => {
    setCart(prev => prev.map(item => item.id === id ? { ...item, qty: item.qty + delta } : item).filter(i => i.qty > 0));
  };

  const cartItemsSubtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);

  const calculateCourierCharge = () => {
    if (cart.length === 0) return 0;
    const zone = customerInfo.locationZone;
    const sampleWeight = (cart[0]?.weight || '').toLowerCase();

    let slab = '1/2 kg';
    if (sampleWeight.includes('250') || sampleWeight.includes('1/4')) slab = '1/4 kg';
    else if (sampleWeight.includes('1.5')) slab = '1.5 kg';
    else if (sampleWeight.includes('2')) slab = '2 kg';
    else if (sampleWeight.includes('1 kg') || sampleWeight.includes('1000')) slab = '1 kg';

    const matrix = {
      'Chennai': { '1/4 kg': 40, '1/2 kg': 60, '1 kg': 80, '1.5 kg': 100, '2 kg': 150 },
      'Tamil Nadu': { '1/4 kg': 60, '1/2 kg': 80, '1 kg': 100, '1.5 kg': 150, '2 kg': 200 },
      'AP / KAR / KER': { '1/4 kg': 80, '1/2 kg': 110, '1 kg': 150, '1.5 kg': 190, '2 kg': 230 }
    };
    return matrix[zone]?.[slab] || 60;
  };

  const courierCharge = calculateCourierCharge();
  const grandTotal = cartItemsSubtotal + courierCharge;

  const handleCheckoutWhatsApp = async (e) => {
    e.preventDefault();
    if (cart.length === 0) return alert("Your cart is empty!");
    if (!customerInfo.name || !customerInfo.phone || !customerInfo.address) return alert("Please fill contact details!");

    const orderData = {
      customerName: customerInfo.name, phone: customerInfo.phone, address: customerInfo.address,
      zone: customerInfo.locationZone, items: cart, subtotal: cartItemsSubtotal, courierCharge, grandTotal, date: new Date().toLocaleDateString()
    };

    try {
      await addDoc(collection(db, "orders"), orderData);
      if (currentUser) {
        const updatedUser = { 
          ...currentUser, 
          orderHistory: [...(currentUser.orderHistory || []), orderData] 
        };
        setCurrentUser(updatedUser);
        setRegisteredUsers(prev => prev.map(u => u.id === currentUser.id ? updatedUser : u));
      }
    } catch (err) { console.error("Error saving order:", err); }

    let itemsList = cart.map((item, idx) => `${idx + 1}. ${item.title} (${item.weight}) x ${item.qty} = ₹${item.price * item.qty}`).join('\n');
    const message = `🎂 *NEW ORDER - GUGAN HOMEMADE CAKES* 🎂\n\n👤 *Name:* ${customerInfo.name}\n📞 *Phone:* ${customerInfo.phone}\n🏠 *Address:* ${customerInfo.address}\n📍 *Zone:* ${customerInfo.locationZone}\n\n🛒 *ITEMS:*\n${itemsList}\n\n📦 Subtotal: ₹${cartItemsSubtotal}\n🚚 Courier: ₹${courierCharge}\n💰 *GRAND TOTAL: ₹${grandTotal}*`;

    window.open(`https://wa.me/${BUSINESS_PHONE}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const allDynamicCategories = ['All', ...Array.from(new Set([...categories, ...cakes.map(c => c.category).filter(Boolean)]))];

  const filteredCakes = cakes.filter(cake => {
    const matchesSearch = cake.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || cake.category === selectedCategory;
    const matchesEgg = selectedEggType === 'All' || cake.eggType === selectedEggType;
    return matchesSearch && matchesCategory && matchesEgg;
  });

  const navigateToPage = (pageName) => {
    setCurrentPageView(pageName);
    setIsSidebarOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div style={{ fontFamily: "'Poppins', sans-serif", background: '#fafafa', minHeight: '100vh', color: '#333' }}>
      
      {/* 1. CUSTOMER STOREFRONT */}
      {viewMode === 'customer' ? (
        <div>
          {/* HEADER WITH LOGO FALLBACK */}
          <header style={{ background: '#fff', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', padding: '12px 20px', position: 'sticky', top: 0, zIndex: 100, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <button onClick={() => setIsSidebarOpen(true)} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' }}>☰</button>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }} onClick={() => navigateToPage('shop')}>
                <img 
                  src="/logo.png.jpeg" 
                  alt="Gugan Cakes Logo" 
                  onError={(e) => { 
                    e.target.onerror = null; 
                    e.target.src = '/logo.png'; 
                  }} 
                  style={{ width: '48px', height: '48px', borderRadius: '50%', border: '2px solid #d81b60', objectFit: 'cover' }} 
                />
                <div>
                  <h2 style={{ margin: 0, fontSize: '18px', color: '#d81b60', fontWeight: 'bold' }}>Gugan Homemade Cakes</h2>
                  <p style={{ margin: 0, fontSize: '11px', color: '#777' }}>By Gayathri Devi</p>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              {currentUser ? (
                <button onClick={() => setIsProfileOpen(true)} style={{ background: '#fff0f5', border: '1px solid #d81b60', color: '#d81b60', padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}>
                  👤 {currentUser.name}
                </button>
              ) : (
                <button onClick={() => { setAuthMode('login'); setIsAuthModalOpen(true); }} style={{ background: 'none', border: '1px solid #d81b60', color: '#d81b60', padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}>
                  Login / Register
                </button>
              )}

              <button onClick={() => setIsCartOpen(true)} style={{ background: '#d81b60', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '20px', fontWeight: 'bold', cursor: 'pointer' }}>
                🛒 {cart.reduce((s, i) => s + i.qty, 0)}
              </button>
            </div>
          </header>

          {/* SIDEBAR HAMBURGER MENU DRAWER */}
          {isSidebarOpen && (
            <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100vh', background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex' }}>
              <div style={{ width: '290px', background: '#fff', height: '100%', padding: '20px', boxSizing: 'border-box', overflowY: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                  <h3 style={{ margin: 0, color: '#d81b60' }}>Gugan Cakes</h3>
                  <button onClick={() => setIsSidebarOpen(false)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}>✕</button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '15px' }}>
                  <div onClick={() => navigateToPage('shop')} style={{ padding: '6px 0', cursor: 'pointer', color: currentPageView === 'shop' ? '#d81b60' : '#333', fontWeight: 'bold' }}>Home</div>
                  <div onClick={() => navigateToPage('shop')} style={{ padding: '6px 0', cursor: 'pointer' }}>Shop</div>

                  {/* MORE DROPDOWN */}
                  <div style={{ borderTop: '1px solid #eee', paddingTop: '8px' }}>
                    <div onClick={() => setIsMoreOpen(!isMoreOpen)} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', cursor: 'pointer', fontWeight: 'bold' }}>
                      <span>More</span>
                      <span>{isMoreOpen ? '▲' : '▼'}</span>
                    </div>

                    {isMoreOpen && (
                      <div style={{ paddingLeft: '12px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px', color: '#555', marginTop: '4px' }}>
                        <div onClick={() => navigateToPage('Terms & Conditions')} style={{ cursor: 'pointer', color: currentPageView === 'Terms & Conditions' ? '#d81b60' : '#555' }}>Terms & Conditions</div>
                        <div onClick={() => navigateToPage('Privacy Policy')} style={{ cursor: 'pointer', color: currentPageView === 'Privacy Policy' ? '#d81b60' : '#555' }}>Privacy Policy</div>
                        <div onClick={() => navigateToPage('Shipping Policy')} style={{ cursor: 'pointer', color: currentPageView === 'Shipping Policy' ? '#d81b60' : '#555' }}>Shipping Policy</div>
                        <div onClick={() => navigateToPage('About Us')} style={{ cursor: 'pointer', color: currentPageView === 'About Us' ? '#d81b60' : '#555' }}>About Us</div>
                        <div onClick={() => navigateToPage('Contact Us')} style={{ cursor: 'pointer', color: currentPageView === 'Contact Us' ? '#d81b60' : '#555' }}>Contact Details</div>
                        
                        {customPages.map(cp => (
                          <div key={cp} onClick={() => navigateToPage(cp)} style={{ cursor: 'pointer', color: currentPageView === cp ? '#d81b60' : '#d81b60', fontWeight: 'bold' }}>✨ {cp}</div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* CATEGORIES DROPDOWN */}
                  <div style={{ borderTop: '1px solid #eee', paddingTop: '8px' }}>
                    <div onClick={() => setIsCategoriesOpen(!isCategoriesOpen)} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', cursor: 'pointer', fontWeight: 'bold' }}>
                      <span>Categories</span>
                      <span>{isCategoriesOpen ? '▲' : '▼'}</span>
                    </div>

                    {isCategoriesOpen && (
                      <div style={{ paddingLeft: '12px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', color: '#666' }}>
                        {allDynamicCategories.map(cat => (
                          <div key={cat} onClick={() => { setSelectedCategory(cat); navigateToPage('shop'); }}>{cat}</div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* LOGIN / REGISTER IN DRAWER */}
                  <div style={{ borderTop: '1px solid #eee', paddingTop: '15px', marginTop: '10px' }}>
                    {!currentUser ? (
                      <button onClick={() => { setIsAuthModalOpen(true); setIsSidebarOpen(false); }} style={{ width: '100%', background: '#d81b60', color: 'white', border: 'none', padding: '10px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
                        Login / Register 🔑
                      </button>
                    ) : (
                      <button onClick={() => { setIsProfileOpen(true); setIsSidebarOpen(false); }} style={{ width: '100%', background: '#fff0f5', color: '#d81b60', border: '1px solid #d81b60', padding: '10px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
                        My Account & History 👤
                      </button>
                    )}
                  </div>
                </div>
              </div>
              <div style={{ flex: 1 }} onClick={() => setIsSidebarOpen(false)}></div>
            </div>
          )}

          {/* MAIN PAGE CATALOG */}
          <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto' }}>
            {currentPageView === 'shop' && (
              <div>
                {offersList.length > 0 && (
                  <div style={{ background: '#fff0f5', border: '1px dashed #d81b60', padding: '10px 15px', borderRadius: '10px', marginBottom: '20px', color: '#c2185b', fontSize: '13px', fontWeight: 'bold' }}>
                    🎁 Special Offers: {offersList.join(' | ')}
                  </div>
                )}

                <div style={{ background: '#fff', padding: '15px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', marginBottom: '20px' }}>
                  <input 
                    type="text" 
                    placeholder="🔍 Search for brownies, cakes, flavors..." 
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    style={{ width: '96%', padding: '10px', borderRadius: '20px', border: '1px solid #f8bbd0', outline: 'none' }}
                  />

                  <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', marginTop: '12px', paddingBottom: '5px' }}>
                    {allDynamicCategories.map(cat => (
                      <button 
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        style={{ background: selectedCategory === cat ? '#d81b60' : '#f5f5f5', color: selectedCategory === cat ? '#fff' : '#555', border: 'none', padding: '6px 14px', borderRadius: '20px', cursor: 'pointer', fontSize: '13px', whiteSpace: 'nowrap' }}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                <h3 style={{ color: '#444', marginBottom: '15px' }}>Freshly Baked Collection 😋</h3>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '20px' }}>
                  {filteredCakes.map(cake => {
                    const isFav = wishlist.some(w => w.id === cake.id);
                    return (
                      <div key={cake.id} style={{ background: '#fff', borderRadius: '12px', padding: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative' }}>
                        <button onClick={() => toggleWishlist(cake)} style={{ position: 'absolute', top: '18px', right: '18px', background: 'rgba(255,255,255,0.9)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', fontSize: '16px' }}>
                          {isFav ? '❤️' : '🤍'}
                        </button>
                        <div>
                          <img src={cake.imageUrl} alt={cake.title} style={{ width: '100%', height: '160px', objectFit: 'cover', borderRadius: '8px' }} />
                          <h4 style={{ margin: '8px 0 4px', fontSize: '16px' }}>{cake.title}</h4>
                          <p style={{ color: '#888', fontSize: '12px' }}>Weight: {cake.weight}</p>
                        </div>
                        <div>
                          <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#d81b60', margin: '8px 0' }}>₹{cake.price}</div>
                          <button onClick={() => addToCart(cake)} style={{ background: '#d81b60', color: '#fff', border: 'none', padding: '10px', borderRadius: '8px', width: '100%', fontWeight: 'bold', cursor: 'pointer' }}>
                            🛒 Add To Cart
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* FULL PAGE CONTENT */}
            {currentPageView !== 'shop' && (
              <div style={{ background: '#fff', padding: '30px', borderRadius: '15px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', minHeight: '60vh' }}>
                <button onClick={() => navigateToPage('shop')} style={{ background: '#fff0f5', color: '#d81b60', border: '1px solid #d81b60', padding: '8px 16px', borderRadius: '20px', fontWeight: 'bold', cursor: 'pointer', marginBottom: '20px' }}>
                  ← Back to Shop
                </button>
                <h2 style={{ color: '#d81b60', borderBottom: '2px solid #f8bbd0', paddingBottom: '10px', marginTop: 0 }}>{currentPageView}</h2>

                {currentPageView === 'About Us' && (
                  <div style={{ fontSize: '15px', lineHeight: '1.8', color: '#444' }}>
                    <h3 style={{ color: '#d81b60' }}>Our Story 📖</h3>
                    <p>From a single home kitchen to doorsteps across India! Every brownie and treat is handcrafted with care by <strong>Gayathri Devi</strong>.</p>
                  </div>
                )}
                {currentPageView === 'Contact Us' && (
                  <div style={{ fontSize: '15px', lineHeight: '1.8', color: '#444' }}>
                    <p><strong>Owner:</strong> Gayathri Devi</p>
                    <p><strong>Phone / WhatsApp:</strong> +91 88258 35532</p>
                  </div>
                )}
                {!['About Us', 'Contact Us'].includes(currentPageView) && (
                  <p style={{ color: '#555', fontSize: '14px' }}>Detailed information for <strong>{currentPageView}</strong>.</p>
                )}
              </div>
            )}
          </div>

          {/* SECURED CUSTOMER AUTHENTICATION MODAL */}
          {isAuthModalOpen && (
            <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100vh', background: 'rgba(0,0,0,0.6)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ background: '#fff', borderRadius: '12px', padding: '25px', maxWidth: '380px', width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                  <h3 style={{ margin: 0, color: '#d81b60' }}>{authMode === 'login' ? 'Customer Login 🔑' : 'Register Account 🚀'}</h3>
                  <button onClick={() => setIsAuthModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}>✕</button>
                </div>

                <form onSubmit={handleAuthSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {authMode === 'register' && (
                    <>
                      <input type="text" placeholder="Full Name *" required value={authName} onChange={e => setAuthName(e.target.value)} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }} />
                      <input type="tel" placeholder="Mobile Phone Number *" required value={authPhone} onChange={e => setAuthPhone(e.target.value)} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }} />
                    </>
                  )}

                  <input type="email" placeholder="Email Address *" required value={authEmail} onChange={e => setAuthEmail(e.target.value)} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }} />
                  <input type="password" placeholder="Password *" required value={authPassword} onChange={e => setAuthPassword(e.target.value)} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }} />
                  
                  <button type="submit" style={{ background: '#d81b60', color: 'white', border: 'none', padding: '12px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', marginTop: '5px' }}>
                    {authMode === 'login' ? 'Login To Account' : 'Create Account'}
                  </button>
                </form>

                <div style={{ textAlign: 'center', fontSize: '13px', marginTop: '15px', borderTop: '1px solid #eee', paddingTop: '10px' }}>
                  {authMode === 'login' ? (
                    <p style={{ margin: 0 }}>
                      New customer? <span onClick={() => { setAuthMode('register'); setAuthEmail(''); setAuthPassword(''); }} style={{ color: '#d81b60', fontWeight: 'bold', cursor: 'pointer', textDecoration: 'underline' }}>Register Here</span>
                    </p>
                  ) : (
                    <p style={{ margin: 0 }}>
                      Already have an account? <span onClick={() => { setAuthMode('login'); setAuthEmail(''); setAuthPassword(''); }} style={{ color: '#d81b60', fontWeight: 'bold', cursor: 'pointer', textDecoration: 'underline' }}>Login Here</span>
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* CUSTOMER PROFILE & HISTORY MODAL */}
          {isProfileOpen && currentUser && (
            <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100vh', background: 'rgba(0,0,0,0.6)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
              <div style={{ background: '#fff', borderRadius: '12px', padding: '25px', maxWidth: '500px', width: '100%', maxHeight: '80vh', overflowY: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                  <h3 style={{ margin: 0, color: '#d81b60' }}>My Account 👤</h3>
                  <button onClick={() => setIsProfileOpen(false)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}>✕</button>
                </div>

                <div style={{ background: '#fff0f5', padding: '12px', borderRadius: '8px', marginBottom: '15px' }}>
                  <p style={{ margin: '0 0 4px' }}><strong>Name:</strong> {currentUser.name}</p>
                  <p style={{ margin: '0 0 4px' }}><strong>Email:</strong> {currentUser.email}</p>
                  {currentUser.phone && <p style={{ margin: 0 }}><strong>Phone:</strong> {currentUser.phone}</p>}
                </div>

                <h4>Order History & Re-Buy 📦</h4>
                {(!currentUser.orderHistory || currentUser.orderHistory.length === 0) ? (
                  <p style={{ color: '#777', fontSize: '13px' }}>No previous orders found.</p>
                ) : (
                  <div>
                    {currentUser.orderHistory.map((ord, idx) => (
                      <div key={idx} style={{ border: '1px solid #f8bbd0', padding: '10px', borderRadius: '8px', marginBottom: '10px' }}>
                        <div style={{ fontSize: '12px', color: '#666' }}>Date: {ord.date} | Total: ₹{ord.grandTotal}</div>
                        <div style={{ fontWeight: 'bold', fontSize: '13px', margin: '4px 0' }}>{ord.items.map(i => i.title).join(', ')}</div>
                        <button onClick={() => { ord.items.forEach(i => addToCart(i)); alert("Items added to cart!"); }} style={{ background: '#4CAF50', color: 'white', border: 'none', padding: '4px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>
                          🔁 Re-Buy / Order Again
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <button onClick={() => { setCurrentUser(null); setIsProfileOpen(false); }} style={{ marginTop: '20px', background: '#333', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer' }}>
                  Logout Account 🚪
                </button>
              </div>
            </div>
          )}

          {/* CART DRAWER */}
          {isCartOpen && (
            <div style={{ position: 'fixed', top: 0, right: 0, width: '100%', maxWidth: '420px', height: '100vh', background: '#fff', boxShadow: '-5px 0 25px rgba(0,0,0,0.2)', padding: '20px', zIndex: 1000, overflowY: 'auto', boxSizing: 'border-box' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>
                <h3 style={{ margin: 0, color: '#d81b60' }}>Your Cart 🛒</h3>
                <button onClick={() => setIsCartOpen(false)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}>✕</button>
              </div>

              {cart.map(item => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #eee' }}>
                  <div>
                    <h5 style={{ margin: 0 }}>{item.title} ({item.weight})</h5>
                    <span style={{ color: '#d81b60', fontWeight: 'bold' }}>₹{item.price * item.qty}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <button onClick={() => updateQty(item.id, -1)}>-</button>
                    <span>{item.qty}</span>
                    <button onClick={() => updateQty(item.id, 1)}>+</button>
                  </div>
                </div>
              ))}

              <form onSubmit={handleCheckoutWhatsApp} style={{ marginTop: '20px', background: '#fff0f5', padding: '15px', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <h4 style={{ margin: 0, color: '#c2185b' }}>Delivery Details 🚚</h4>
                <input type="text" placeholder="Full Name *" required value={customerInfo.name} onChange={e => setCustomerInfo({...customerInfo, name: e.target.value})} style={{ padding: '8px' }} />
                <input type="tel" placeholder="Phone Number *" required value={customerInfo.phone} onChange={e => setCustomerInfo({...customerInfo, phone: e.target.value})} style={{ padding: '8px' }} />
                <textarea placeholder="Address *" required value={customerInfo.address} onChange={e => setCustomerInfo({...customerInfo, address: e.target.value})} style={{ padding: '8px' }}></textarea>

                <select value={customerInfo.locationZone} onChange={e => setCustomerInfo({...customerInfo, locationZone: e.target.value})} style={{ padding: '8px' }}>
                  <option value="Chennai">Chennai Zone</option>
                  <option value="Tamil Nadu">Rest of Tamil Nadu</option>
                  <option value="AP / KAR / KER">AP / Karnataka / Kerala</option>
                </select>

                <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#d81b60', marginTop: '5px' }}>
                  Grand Total: ₹{grandTotal} (Courier: ₹{courierCharge})
                </div>

                <button type="submit" style={{ background: '#25D366', color: 'white', border: 'none', padding: '12px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
                  Order via WhatsApp 💬
                </button>
              </form>
            </div>
          )}
        </div>
      ) : (

        /* 2. ADMIN DASHBOARD FOR GAYATHRI DEVI */
        <div style={{ maxWidth: '950px', margin: '0 auto', padding: '20px' }}>
          {!isLoggedIn ? (
            <div style={{ maxWidth: '380px', margin: '60px auto', padding: '30px', background: '#fff0f5', borderRadius: '15px', textAlign: 'center' }}>
              <h2 style={{ color: '#d81b60' }}>🔒 Admin Access</h2>
              <form onSubmit={handleAdminLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <input type="email" placeholder="Admin Email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} style={{ padding: '10px' }} />
                <input type="password" placeholder="Password" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} style={{ padding: '10px' }} />
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button type="submit" style={{ background: '#d81b60', color: 'white', border: 'none', padding: '10px', borderRadius: '6px', fontWeight: 'bold', flex: 1 }}>Login</button>
                  <button type="button" onClick={() => setViewMode('customer')} style={{ background: '#777', color: 'white', border: 'none', padding: '10px', borderRadius: '6px', flex: 1 }}>Back</button>
                </div>
              </form>
            </div>
          ) : (
            <div>
              <header style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '3px solid #d81b60', paddingBottom: '10px', marginBottom: '20px' }}>
                <h2>🔒 Admin Dashboard ({ADMIN_NAME})</h2>
                <button onClick={() => { setIsLoggedIn(false); setViewMode('customer'); }} style={{ background: '#333', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px' }}>Exit Admin</button>
              </header>

              {/* DYNAMIC CATEGORIES, OFFERS & MENU BUILDER */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', marginBottom: '25px' }}>
                <div style={{ background: '#fff0f5', padding: '15px', borderRadius: '10px' }}>
                  <h4 style={{ margin: '0 0 8px', color: '#d81b60' }}>Manage Categories 🏷️</h4>
                  <form onSubmit={handleSaveCategory} style={{ display: 'flex', gap: '5px' }}>
                    <input type="text" placeholder="Category Name" value={categoryInput} onChange={e => setCategoryInput(e.target.value)} style={{ padding: '6px', width: '65%' }} />
                    <button type="submit" style={{ background: '#4CAF50', color: 'white', border: 'none', padding: '6px', borderRadius: '4px' }}>{editingCatIndex !== null ? 'Update' : 'Add'}</button>
                  </form>
                  <div style={{ fontSize: '11px', marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {categories.map((c, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', background: '#fff', padding: '4px 8px', borderRadius: '4px' }}>
                        <span>{c}</span>
                        <div>
                          <span onClick={() => { setEditingCatIndex(i); setCategoryInput(c); }} style={{ color: '#2196F3', cursor: 'pointer', marginRight: '6px' }}>✏️</span>
                          <span onClick={() => setCategories(categories.filter((_, idx) => idx !== i))} style={{ color: 'red', cursor: 'pointer' }}>🗑️</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ background: '#fff0f5', padding: '15px', borderRadius: '10px' }}>
                  <h4 style={{ margin: '0 0 8px', color: '#d81b60' }}>Manage Special Offers 🎁</h4>
                  <form onSubmit={handleSaveOffer} style={{ display: 'flex', gap: '5px' }}>
                    <input type="text" placeholder="Offer Text" value={offerInput} onChange={e => setOfferInput(e.target.value)} style={{ padding: '6px', width: '65%' }} />
                    <button type="submit" style={{ background: '#4CAF50', color: 'white', border: 'none', padding: '6px', borderRadius: '4px' }}>{editingOfferIndex !== null ? 'Update' : 'Add'}</button>
                  </form>
                  <div style={{ fontSize: '11px', marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {offersList.map((o, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', background: '#fff', padding: '4px 8px', borderRadius: '4px' }}>
                        <span>{o}</span>
                        <div>
                          <span onClick={() => { setEditingOfferIndex(i); setOfferInput(o); }} style={{ color: '#2196F3', cursor: 'pointer', marginRight: '6px' }}>✏️</span>
                          <span onClick={() => setOffersList(offersList.filter((_, idx) => idx !== i))} style={{ color: 'red', cursor: 'pointer' }}>🗑️</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ background: '#fff0f5', padding: '15px', borderRadius: '10px' }}>
                  <h4 style={{ margin: '0 0 8px', color: '#d81b60' }}>Manage Hamburger Pages ☰</h4>
                  <form onSubmit={handleSaveCustomPage} style={{ display: 'flex', gap: '5px' }}>
                    <input type="text" placeholder="Menu Page Title" value={pageInput} onChange={e => setPageInput(e.target.value)} style={{ padding: '6px', width: '65%' }} />
                    <button type="submit" style={{ background: '#4CAF50', color: 'white', border: 'none', padding: '6px', borderRadius: '4px' }}>{editingPageIndex !== null ? 'Update' : 'Add'}</button>
                  </form>
                  <div style={{ fontSize: '11px', marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {customPages.map((cp, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', background: '#fff', padding: '4px 8px', borderRadius: '4px' }}>
                        <span>{cp}</span>
                        <div>
                          <span onClick={() => { setEditingPageIndex(i); setPageInput(cp); }} style={{ color: '#2196F3', cursor: 'pointer', marginRight: '6px' }}>✏️</span>
                          <span onClick={() => setCustomPages(customPages.filter((_, idx) => idx !== i))} style={{ color: 'red', cursor: 'pointer' }}>🗑️</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* PRODUCT CREATION FORM */}
              <div style={{ background: '#fff0f5', padding: '20px', borderRadius: '12px', marginBottom: '25px' }}>
                <h3 style={{ color: '#c2185b', marginTop: 0 }}>{editingId ? 'Edit Product Details ✏️' : 'Add New Cake / Product ➕'}</h3>
                <form onSubmit={handleSaveCake} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <input type="text" placeholder="Product Title" value={title} onChange={e => setTitle(e.target.value)} style={{ padding: '8px' }} />
                    <input type="number" placeholder="Price (₹)" value={price} onChange={e => setPrice(e.target.value)} style={{ padding: '8px' }} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                    <input type="text" placeholder="Category" value={category} onChange={e => setCategory(e.target.value)} style={{ padding: '8px' }} />
                    <input type="text" placeholder="Weight / Grams" value={weight} onChange={e => setWeight(e.target.value)} style={{ padding: '8px' }} />
                    <select value={eggType} onChange={e => setEggType(e.target.value)} style={{ padding: '8px' }}>
                      <option value="Eggless">Eggless 🌱</option>
                      <option value="Contains Egg">Contains Egg 🥚</option>
                    </select>
                  </div>
                  <input type="file" accept="image/*" onChange={handleImageChange} />
                  {imagePreview && <img src={imagePreview} alt="Preview" style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '6px' }} />}
                  <button type="submit" style={{ background: '#4CAF50', color: 'white', border: 'none', padding: '10px', borderRadius: '6px', fontWeight: 'bold' }}>Save Product</button>
                </form>
              </div>

              {/* RECEIVED ORDERS TRACKER */}
              <h3>Received Customer Orders 📦</h3>
              {ordersList.length === 0 ? <p style={{ color: '#777' }}>No orders recorded yet.</p> : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '30px' }}>
                  {ordersList.map(ord => (
                    <div key={ord.id} style={{ background: '#fff', border: '1px solid #ddd', padding: '12px', borderRadius: '8px' }}>
                      <div style={{ fontWeight: 'bold', color: '#d81b60' }}>Customer: {ord.customerName} ({ord.phone})</div>
                      <div style={{ fontSize: '12px', color: '#666' }}>Address: {ord.address} | Zone: {ord.zone}</div>
                      <div style={{ fontSize: '13px', margin: '4px 0' }}>Items: {ord.items.map(i => `${i.title} (${i.qty})`).join(', ')}</div>
                      <div style={{ fontWeight: 'bold', fontSize: '13px', color: '#4CAF50' }}>Grand Total: ₹{ord.grandTotal}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* PRODUCT LIST */}
              <h3>Existing Menu Items</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px' }}>
                {cakes.map(cake => (
                  <div key={cake.id} style={{ border: '1px solid #eee', borderRadius: '8px', padding: '8px', background: '#fff', textAlign: 'center' }}>
                    <img src={cake.imageUrl} alt={cake.title} style={{ width: '100%', height: '110px', objectFit: 'cover', borderRadius: '6px' }} />
                    <h5 style={{ margin: '6px 0 2px' }}>{cake.title}</h5>
                    <div style={{ fontSize: '12px', color: '#d81b60', fontWeight: 'bold' }}>₹{cake.price} ({cake.weight})</div>
                    <div style={{ display: 'flex', gap: '4px', marginTop: '6px' }}>
                      <button onClick={() => { setEditingId(cake.id); setTitle(cake.title); setPrice(cake.price); setWeight(cake.weight); setCategory(cake.category); setImagePreview(cake.imageUrl); }} style={{ flex: 1, background: '#2196F3', color: 'white', border: 'none', padding: '4px', borderRadius: '4px', fontSize: '11px' }}>Edit ✏️</button>
                      <button onClick={() => handleDeleteCake(cake.id, cake.title)} style={{ flex: 1, background: '#ff4d4d', color: 'white', border: 'none', padding: '4px', borderRadius: '4px', fontSize: '11px' }}>Delete 🗑️</button>
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
        <span onClick={() => setViewMode('admin')} style={{ cursor: 'pointer', paddingLeft: '5px', color: '#aaa' }}>.</span>
      </footer>

    </div>
  );
}

export default App;