import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [items, setItems] = useState([]); // { itemId, name, price, qty }
  const { user } = useAuth();

  const storageKey = user?.id ? `cart_${user.id}` : 'cart_guest';

  useEffect(() => {
    // load cart for current user
    const load = async () => {
      try {
        const raw = await AsyncStorage.getItem(storageKey);
        if (raw) setItems(JSON.parse(raw));
        else setItems([]);
      } catch (e) {
        console.error('Failed to load cart', e);
      }
    };
    load();
  }, [storageKey]);

  useEffect(() => {
    // persist when items change
    const save = async () => {
      try {
        await AsyncStorage.setItem(storageKey, JSON.stringify(items));
      } catch (e) {
        console.error('Failed to save cart', e);
      }
    };
    save();
  }, [items, storageKey]);

  const addItem = (item) => {
    setItems(prev => {
      const found = prev.find(p => p._id === item._id);
      if (found) {
        return prev.map(p => p._id === item._id ? { ...p, qty: p.qty + 1 } : p);
      }
      return [...prev, { ...item, qty: 1 }];
    });
  };

  const removeItem = (itemId) => {
    setItems(prev => prev.filter(p => p._id !== itemId));
  };

  const updateQty = (itemId, qty) => {
    setItems(prev => prev.map(p => p._id === itemId ? { ...p, qty } : p));
  };

  const clear = () => setItems([]);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQty, clear }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
