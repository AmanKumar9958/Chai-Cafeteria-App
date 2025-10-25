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

  // Add multiple items at once, preserving/incrementing quantities
  const addItemsBatch = (incoming = []) => {
    if (!Array.isArray(incoming) || incoming.length === 0) return;
    setItems(prev => {
      const byId = new Map(prev.map(p => [p._id, { ...p }]));
      for (const it of incoming) {
        if (!it) continue;
        const id = it._id || it.id;
        if (!id) continue;
        const addQty = Math.max(1, Number(it.qty ?? it.quantity ?? 1) || 1);
        const existing = byId.get(id);
        if (existing) {
          existing.qty = Math.max(1, Number(existing.qty || 0) + addQty);
          byId.set(id, existing);
        } else {
          byId.set(id, { ...it, _id: id, qty: addQty });
        }
      }
      return Array.from(byId.values());
    });
  };

  const clear = () => setItems([]);

  return (
    <CartContext.Provider value={{ items, addItem, addItemsBatch, removeItem, updateQty, clear }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
