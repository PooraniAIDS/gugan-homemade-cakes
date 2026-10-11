import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, getDocs, addDoc } from 'firebase/firestore';

function App() {
  const [cakes, setCakes] = useState([]);
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [imageFile, setImageFile] = useState(null); // File handle storage
  const [imagePreview, setImagePreview] = useState(''); // Live thumbnail view
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

  // Convert uploaded image to Base64 (Text Format)
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // Size lock - 2MB
        alert("Image should be less than 2MB!");
        return;
      }
      setImageFile(file);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result); // Base64 direct source
      };
      reader.readAsDataURL(file);
    }
  };

  // Add Cake (Uploads Base64 image directly to Firebase)
  const handleAddCake = async (e) => {
    e.preventDefault();
    if (!title || !price || !imagePreview) return alert("All fields including Image are required!");
    
    try {
      await addDoc(collection(db, "cakes"), {
        title,
        price: Number(price),
        imageUrl: imagePreview // Safe Base64 string storage
      });
      alert("Own Cake Added Successful! 🎂🎉");
      // Form fields Reset
      setTitle('');
      setPrice('');
      setImageFile(null);
      setImagePreview('');
      setIsAdmin(false);
      window.location.reload(); // Refresh display screen
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
          <form onSubmit={handleAddCake} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Cake Name:</label>
              <input type="text" placeholder="Eg: Black Forest" value={title} onChange={e => setTitle(e.target.value)} style={{ padding: '8px', width: '97%' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Price (₹):</label>
              <input type="number" placeholder="Eg: 550" value={price} onChange={e => setPrice(e.target.value)} style={{ padding: '8px', width: '97%' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Cake Photo (Unga Image Upload Pannalam):</label>
              <input type="file" accept="image/*" onChange={handleImageChange} style={{ padding: '8px 0' }} />
              {imagePreview && (
                <div style={{ marginTop: '10px' }}>
                  <p style={{ fontSize: '12px', color: '#555' }}>Preview Upload:</p>
                  <img src={imagePreview} alt="Selected" style={{ width: '150px', height: '150px', objectFit: 'cover', borderRadius: '8px', border: '2px solid #e91e63' }} />
                </div>
              )}
            </div>
            <button type="submit" style={{ background: '#4CAF50', color: 'white', border: 'none', padding: '12px', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold', borderRadius: '5px' }}>Add Cake 🚀</button>
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
