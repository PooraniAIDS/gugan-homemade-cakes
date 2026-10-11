import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, getDocs, addDoc } from 'firebase/firestore';

function App() {
  const [cakes, setCakes] = useState([]);
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isAdmin, setIsAdmin] = useState(window.location.pathname === '/admin');

  // Fetch Cakes from Firestore
  useEffect(() => {
    const fetchCakes = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "cakes"));
        const cakeList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setCakes(cakeList);
      } catch (err) {
        console.error("Error fetching cakes:", err);
      }
    };
    fetchCakes();
  }, []);

  // Add Cake (Admin Function)
  const handleAddCake = async (e) => {
    e.preventDefault();
    if (!title || !price || !imageUrl) return alert("Fill all fields!");
    
    try {
      await addDoc(collection(db, "cakes"), {
        title,
        price: Number(price),
        imageUrl
      });
      alert("Cake added successfully! 🎉");
      window.location.href = "/";
    } catch (err) {
      alert("Error adding cake: " + err.message);
    }
  };

  return (
    <div style={{ fontFamily: 'sans-serif', padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #e91e63', paddingBottom: '10px' }}>
        <h1 style={{ color: '#e91e63', margin: 0 }}>Gugan Homemade Cakes 🎂</h1>
        <button 
          onClick={() => {
            const nextState = !isAdmin;
            setIsAdmin(nextState);
            window.history.pushState({}, '', nextState ? '/admin' : '/');
          }}
          style={{ background: '#e91e63', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '5px', cursor: 'pointer' }}
        >
          {isAdmin ? 'View Home' : 'Admin Panel'}
        </button>
      </header>

      {isAdmin ? (
        <div style={{ marginTop: '30px', background: '#fff0f5', padding: '20px', borderRadius: '8px' }}>
          <h2>Admin Panel - Add New Cake</h2>
          <form onSubmit={handleAddCake} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <input type="text" placeholder="Cake Name" value={title} onChange={e => setTitle(e.target.value)} style={{ padding: '8px' }} />
            <input type="number" placeholder="Price (₹)" value={price} onChange={e => setPrice(e.target.value)} style={{ padding: '8px' }} />
            <input type="url" placeholder="Image Direct Link URL" value={imageUrl} onChange={e => setImageUrl(e.target.value)} style={{ padding: '8px' }} />
            <button type="submit" style={{ background: '#4CAF50', color: 'white', border: 'none', padding: '10px', cursor: 'pointer' }}>Add Cake</button>
          </form>
        </div>
      ) : (
        <div style={{ marginTop: '30px' }}>
          <h2>Delicious Homemade Menu</h2>
          {cakes.length === 0 ? (
            <p>No cakes available yet! Click 'Admin Panel' to add one.</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px' }}>
              {cakes.map(cake => (
                <div key={cake.id} style={{ border: '1px solid #ccc', borderRadius: '8px', overflow: 'hidden', padding: '10px', textAlign: 'center' }}>
                  <img src={cake.imageUrl} alt={cake.title} style={{ width: '100%', height: '150px', objectFit: 'cover', borderRadius: '5px' }} />
                  <h3 style={{ margin: '10px 0 5px' }}>{cake.title}</h3>
                  <p style={{ color: '#e91e63', fontWeight: 'bold' }}>₹{cake.price}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;