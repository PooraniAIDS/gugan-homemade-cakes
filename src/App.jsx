import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, getDocs, addDoc, deleteDoc, doc } from 'firebase/firestore';

function App() {
  const [cakes, setCakes] = useState([]);
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [imagePreview, setImagePreview] = useState('');
  const [isAdmin, setIsAdmin] = useState(window.location.pathname === '/admin');

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
  }, []);

  // Convert uploaded image to Base64
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("Image should be less than 2MB!");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Add Cake
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
      fetchCakes(); // Refresh list
    } catch (err) {
      alert("Error adding cake: " + err.message);
    }
  };

  // Delete Cake Function 🗑️
  const handleDeleteCake = async (id, cakeTitle) => {
    const confirmDelete = window.confirm(`"${cakeTitle}" cake-a remove panna konjam confirm pannunga?`);
    if (confirmDelete) {
      try {
        await deleteDoc(doc(db, "cakes", id));
        alert("Cake Removed Successfully! 🗑️");
        fetchCakes(); // Refresh list immediately
      } catch (err) {
        alert("Error deleting cake: " + err.message);
      }
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
        <div style={{ marginTop: '30px' }}>
          <div style={{ background: '#fff0f5', padding: '20px', borderRadius: '8px', marginBottom: '30px' }}>
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
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Cake Photo:</label>
                <input type="file" accept="image/*" onChange={handleImageChange} style={{ padding: '8px 0' }} />
                {imagePreview && (
                  <div style={{ marginTop: '10px' }}>
                    <p style={{ fontSize: '12px', color: '#555' }}>Preview Upload:</p>
                    <img src={imagePreview} alt="Selected" style={{ width: '120px', height: '120px', objectFit: 'cover', borderRadius: '8px', border: '2px solid #e91e63' }} />
                  </div>
                )}
              </div>
              <button type="submit" style={{ background: '#4CAF50', color: 'white', border: 'none', padding: '12px', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold', borderRadius: '5px' }}>Add Cake 🚀</button>
            </form>
          </div>

          <h2>Manage Existing Cakes (Delete) 🗑️</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px' }}>
            {cakes.map(cake => (
              <div key={cake.id} style={{ border: '1px solid #ccc', borderRadius: '8px', overflow: 'hidden', padding: '10px', textAlign: 'center', background: '#fafafa' }}>
                <img src={cake.imageUrl} alt={cake.title} style={{ width: '100%', height: '130px', objectFit: 'cover', borderRadius: '5px' }} />
                <h3 style={{ margin: '10px 0 5px' }}>{cake.title}</h3>
                <p style={{ color: '#e91e63', fontWeight: 'bold', margin: '5px 0 10px' }}>₹{cake.price}</p>
                <button 
                  onClick={() => handleDeleteCake(cake.id, cake.title)} 
                  style={{ background: '#ff4d4d', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  Delete 🗑️
                </button>
              </div>
            ))}
          </div>
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