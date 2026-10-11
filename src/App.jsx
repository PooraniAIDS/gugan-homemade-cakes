import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, getDocs, addDoc, deleteDoc, doc } from 'firebase/firestore';

function App() {
  const [cakes, setCakes] = useState([]);
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [imagePreview, setImagePreview] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Detect path /admin
  const [isAdmin, setIsAdmin] = useState(window.location.pathname === '/admin');

  // Unga WhatsApp Number (With Country Code 91)
  const PHONE_NUMBER = "919876543210";

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

  // Convert image to Base64
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("Image size should be less than 2MB!");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // ADD CAKE
  const handleAddCake = async (e) => {
    e.preventDefault();
    if (!title || !price || !imagePreview) return alert("All fields including Image are required!");
    
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

  // DELETE CAKE
  const handleDeleteCake = async (id, cakeTitle) => {
    const confirmDelete = window.confirm(`"${cakeTitle}" cake-a delete panna confirm pannunga?`);
    if (confirmDelete) {
      try {
        await deleteDoc(doc(db, "cakes", id));
        alert("Cake Removed Successfully! 🗑️");
        fetchCakes();
      } catch (err) {
        alert("Error deleting cake: " + err.message);
      }
    }
  };

  // Router Helper
  const navigateTo = (path) => {
    window.history.pushState({}, '', path);
    setIsAdmin(path === '/admin');
  };

  // WhatsApp Redirect
  const handleOrderWhatsApp = (cakeTitle, cakePrice) => {
    const message = `Hello Gugan Homemade Cakes! 👋\nI would like to order: *${cakeTitle}*\nPrice: *₹${cakePrice}*.\nPlease let me know availability!`;
    const whatsappUrl = `https://wa.me/${PHONE_NUMBER}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  // Search Filter
  const filteredCakes = cakes.filter(cake => 
    cake.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ fontFamily: "'Poppins', 'Segoe UI', sans-serif", padding: '20px', maxWidth: '900px', margin: '0 auto', color: '#333', minHeight: '90vh', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      
      {/* 1. CUSTOMER PAGE VIEW */}
      {!isAdmin ? (
        <div>
          <header style={{ textAlign: 'center', borderBottom: '2px dashed #f48fb1', paddingBottom: '20px', marginBottom: '25px' }}>
            <h1 style={{ color: '#d81b60', margin: 0, fontSize: '32px', fontWeight: 'bold' }}>Gugan Homemade Cakes 🎂</h1>
            <p style={{ margin: '8px 0 0', color: '#888', fontSize: '15px' }}>Freshly Baked Pure Homemade Goodness ❤️</p>
          </header>

          <div style={{ marginBottom: '25px', display: 'flex', justifyContent: 'center' }}>
            <input 
              type="text" 
              placeholder="🔍 Search delicious cakes..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '100%', maxWidth: '500px', padding: '12px 20px', borderRadius: '30px', border: '2px solid #f48fb1', fontSize: '15px', outline: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
            />
          </div>

          <h2 style={{ color: '#444', fontSize: '22px', marginBottom: '20px' }}>Our Cake Menu 😋</h2>
          
          {filteredCakes.length === 0 ? (
            <p style={{ color: '#777', fontStyle: 'italic', textAlign: 'center', margin: '40px 0' }}>No cakes available right now!</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '25px' }}>
              {filteredCakes.map(cake => (
                <div key={cake.id} style={{ border: '1px solid #f0f0f0', borderRadius: '15px', overflow: 'hidden', padding: '15px', textAlign: 'center', background: '#fff', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
                  <img src={cake.imageUrl} alt={cake.title} style={{ width: '100%', height: '180px', objectFit: 'cover', borderRadius: '10px' }} />
                  <h3 style={{ margin: '12px 0 6px', fontSize: '18px', color: '#222' }}>{cake.title}</h3>
                  <p style={{ color: '#d81b60', fontWeight: 'bold', fontSize: '20px', margin: '0 0 15px' }}>₹{cake.price}</p>
                  <button 
                    onClick={() => handleOrderWhatsApp(cake.title, cake.price)}
                    style={{ background: '#25D366', color: 'white', border: 'none', padding: '12px', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold', width: '100%', fontSize: '15px', boxShadow: '0 2px 6px rgba(37,211,102,0.3)' }}
                  >
                    Order via WhatsApp 💬
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (

        /* 2. SECRET ADMIN PANEL VIEW */
        <div>
          <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '3px solid #d81b60', paddingBottom: '12px', marginBottom: '25px' }}>
            <h1 style={{ color: '#d81b60', margin: 0, fontSize: '24px' }}>🔒 Secret Admin Dashboard</h1>
            <button 
              onClick={() => navigateTo('/')}
              style={{ background: '#333', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer' }}
            >
              Exit to Live Site 🌐
            </button>
          </header>

          <div style={{ background: '#fff0f5', padding: '20px', borderRadius: '12px', marginBottom: '35px', border: '1px solid #f8bbd0' }}>
            <h2 style={{ color: '#c2185b', marginTop: 0 }}>Add New Cake to Menu ➕</h2>
            <form onSubmit={handleAddCake} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Cake Name:</label>
                <input type="text" placeholder="Eg: Pineapple Cake" value={title} onChange={e => setTitle(e.target.value)} style={{ padding: '10px', width: '97%', borderRadius: '6px', border: '1px solid #ccc' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Price (₹):</label>
                <input type="number" placeholder="Eg: 500" value={price} onChange={e => setPrice(e.target.value)} style={{ padding: '10px', width: '97%', borderRadius: '6px', border: '1px solid #ccc' }} />
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

      {/* FOOTER WITH SECRET TRIGGER */}
      <footer style={{ textAlign: 'center', marginTop: '40px', paddingTop: '20px', borderTop: '1px solid #eee', color: '#888', fontSize: '13px' }}>
        <span>© 2026 Gugan Homemade Cakes. All rights reserved</span>
        <span 
          onClick={() => navigateTo(isAdmin ? '/' : '/admin')} 
          style={{ cursor: 'pointer', userSelect: 'none', paddingLeft: '2px' }}
        >
          .
        </span>
      </footer>

    </div>
  );
}

export default App;
