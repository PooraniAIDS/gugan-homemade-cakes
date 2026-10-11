import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';

export default function Home() {
  const [cakes, setCakes] = useState([]);
  const [cart, setCart] = useState([]);
  const [customerName, setCustomerName] = useState('');
  const [address, setAddress] = useState('');

  useEffect(() => {
    const fetchCakes = async () => {
      const snapshot = await getDocs(collection(db, "cakes"));
      setCakes(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };
    fetchCakes();
  }, []);

  const addToCart = (cake) => {
    setCart([...cart, cake]);
  };

  const removeFromCart = (indexToRemove) => {
    setCart(cart.filter((_, index) => index !== indexToRemove));
  };

  const sendWhatsAppOrder = () => {
    if (!customerName || !address) {
      alert("Please fill in your Name and Address");
      return;
    }

    const phone = "919876543210"; // Gugan's WhatsApp Business Number
    let msg = `🎂 *NEW ORDER - GUGAN HOMEMADE CAKES* 🎂\n\n`;
    msg += `*Customer:* ${customerName}\n*Delivery Address:* ${address}\n\n*Order Items:*\n`;
    
    let total = 0;
    cart.forEach((item, index) => {
      msg += `${index + 1}. ${item.name} - ₹${item.price}\n`;
      total += item.price;
    });

    msg += `\n*Total Amount:* ₹${total}\n\nHi Gugan, please confirm my order and share payment QR!`;

    const url = `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="min-h-screen bg-pink-50 pb-10">
      <header className="bg-pink-600 text-white p-5 text-center font-bold text-2xl shadow-lg">
        Gugan Homemade Cakes 🎂
      </header>

      <main className="p-6 max-w-5xl mx-auto">
        <h2 className="text-xl font-bold mb-4 text-pink-900">Delicious Homemade Menu</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {cakes.map(cake => (
            <div key={cake.id} className="bg-white rounded-xl shadow-md overflow-hidden flex flex-col justify-between">
              <img src={cake.imageUrl} alt={cake.name} className="h-48 w-full object-cover" />
              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-lg text-gray-800">{cake.name}</h3>
                  <p className="text-pink-600 font-bold mt-1 text-xl">₹{cake.price}</p>
                </div>
                <button 
                  onClick={() => addToCart(cake)} 
                  className="mt-4 w-full bg-pink-600 text-white font-semibold py-2 rounded-lg hover:bg-pink-700 transition"
                >
                  Add to Cart
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Cart Section */}
        {cart.length > 0 && (
          <div className="bg-white p-6 rounded-2xl shadow-xl max-w-lg mx-auto border border-pink-100">
            <h3 className="text-xl font-bold mb-4 text-gray-800 border-b pb-2">Your Shopping Cart ({cart.length})</h3>
            
            <div className="space-y-3 mb-6">
              {cart.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center border-b pb-2">
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-gray-500">₹{item.price}</p>
                  </div>
                  <button 
                    onClick={() => removeFromCart(idx)}
                    className="text-red-500 text-sm font-semibold hover:underline"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>

            <div className="space-y-3 mb-6">
              <input 
                type="text" 
                placeholder="Your Full Name" 
                value={customerName} 
                onChange={e => setCustomerName(e.target.value)} 
                className="w-full border p-3 rounded-lg focus:outline-pink-500" 
              />
              <textarea 
                placeholder="Full Delivery Address & Date" 
                value={address} 
                onChange={e => setAddress(e.target.value)} 
                className="w-full border p-3 rounded-lg focus:outline-pink-500" 
              />
            </div>

            <button 
              onClick={sendWhatsAppOrder} 
              className="w-full bg-green-500 text-white font-bold py-3 rounded-xl hover:bg-green-600 transition flex items-center justify-center gap-2 text-lg shadow-lg"
            >
              Order via WhatsApp 💬
            </button>
          </div>
        )}
      </main>
    </div>
  );
}