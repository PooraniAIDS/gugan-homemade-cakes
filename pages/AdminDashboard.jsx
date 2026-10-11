import React, { useState, useEffect } from 'react';
import { db, storage, auth } from '../firebase';
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';

export default function AdminDashboard() {
  const [cakes, setCakes] = useState([]);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const fetchCakes = async () => {
    const querySnapshot = await getDocs(collection(db, "cakes"));
    setCakes(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  useEffect(() => { fetchCakes(); }, []);

  const handleAddCake = async (e) => {
    e.preventDefault();
    if (!image) return alert("Select a cake image");
    setLoading(true);

    const storageRef = ref(storage, `cakes/${Date.now()}_${image.name}`);
    await uploadBytes(storageRef, image);
    const imageUrl = await getDownloadURL(storageRef);

    await addDoc(collection(db, "cakes"), {
      name,
      price: Number(price),
      imageUrl,
      createdAt: new Date()
    });

    setName(''); setPrice(''); setImage(null);
    setLoading(false);
    fetchCakes();
  };

  const handleUpdatePrice = async (id) => {
    const newPrice = prompt("Enter new price (₹):");
    if (newPrice) {
      await updateDoc(doc(db, "cakes", id), { price: Number(newPrice) });
      fetchCakes();
    }
  };

  const handleDelete = async (id) => {
    if (confirm("Delete this cake item?")) {
      await deleteDoc(doc(db, "cakes", id));
      fetchCakes();
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/admin-login');
  };

  return (
    <div className="p-6 max-w-4xl mx-auto min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Gugan Homemade Cakes - Dashboard</h1>
        <button onClick={handleLogout} className="bg-gray-800 text-white px-4 py-2 rounded-lg">Logout</button>
      </div>
      
      <form onSubmit={handleAddCake} className="bg-white p-6 shadow-md rounded-xl mb-8 space-y-4">
        <h2 className="font-bold text-lg text-gray-700">Add New Cake</h2>
        <input type="text" placeholder="Cake Name" value={name} onChange={e => setName(e.target.value)} required className="w-full border p-2 rounded" />
        <input type="number" placeholder="Price (₹)" value={price} onChange={e => setPrice(e.target.value)} required className="w-full border p-2 rounded" />
        <input type="file" onChange={e => setImage(e.target.files[0])} accept="image/*" required className="w-full border p-2 rounded" />
        <button type="submit" disabled={loading} className="w-full bg-pink-600 text-white py-2 font-bold rounded hover:bg-pink-700">
          {loading ? "Uploading to Firebase..." : "Save Cake Item"}
        </button>
      </form>

      <h2 className="font-bold text-lg mb-4 text-gray-700">Current Cake Catalog</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {cakes.map(cake => (
          <div key={cake.id} className="border p-4 rounded-xl flex items-center justify-between bg-white shadow-sm">
            <img src={cake.imageUrl} alt={cake.name} className="w-16 h-16 object-cover rounded-lg" />
            <div className="flex-1 ml-4">
              <h3 className="font-bold">{cake.name}</h3>
              <p className="text-pink-600 font-bold">₹{cake.price}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => handleUpdatePrice(cake.id)} className="bg-blue-500 text-white text-sm px-3 py-1 rounded">Edit Price</button>
              <button onClick={() => handleDelete(cake.id)} className="bg-red-500 text-white text-sm px-3 py-1 rounded">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}