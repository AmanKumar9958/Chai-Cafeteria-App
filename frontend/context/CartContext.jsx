import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';
import { getSuggestions } from '../utils/suggestionEngine';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [items, setItems] = useState([]); // { itemId, name, price, qty }
  const [suggestions, setSuggestions] = useState([]);
  const { user } = useAuth();

  // Build a stable per-user storage key; fallback to guest
  const userKey = user?._id || user?.id || user?.uid || user?.email || 'guest';
  const storageKey = `cart_${String(userKey)}`;

  useEffect(() => {
    // load cart for current user; if this user never had a cart but a legacy guest cart exists,
    // migrate it once and clear the guest key to prevent leaks between accounts.
    const load = async () => {
      try {
        const current = await AsyncStorage.getItem(storageKey);
        if (current) {
          setItems(JSON.parse(current));
          return;
        }
        // Migration path: move from cart_guest -> user-specific cart on first login
        if (userKey !== 'guest') {
          const legacy = await AsyncStorage.getItem('cart_guest');
          if (legacy) {
            await AsyncStorage.setItem(storageKey, legacy);
            await AsyncStorage.removeItem('cart_guest');
            setItems(JSON.parse(legacy));
            return;
          }
        }
        setItems([]);
      } catch (e) {
        console.error('Failed to load cart', e);
        setItems([]);
      }
    };
    load();
  }, [storageKey, userKey]);

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
      const itemPortion = item.portion || null;
      const found = prev.find(p => p._id === item._id && (p.portion || null) === itemPortion);
      if (found) {
        return prev.map(p => (p._id === item._id && (p.portion || null) === itemPortion) ? { ...p, qty: p.qty + 1 } : p);
      }
      return [...prev, { ...item, qty: 1, portion: itemPortion }];
    });
  };

  const removeItem = (itemId, portion = null) => {
    setItems(prev => prev.filter(p => !(p._id === itemId && (p.portion || null) === portion)));
  };

  const updateQty = (itemId, qty, portion = null) => {
    setItems(prev => prev.map(p => (p._id === itemId && (p.portion || null) === portion) ? { ...p, qty } : p));
  };

  // Add multiple items at once, preserving/incrementing quantities
  const addItemsBatch = (incoming = []) => {
    if (!Array.isArray(incoming) || incoming.length === 0) return;
    setItems(prev => {
      const byId = new Map(prev.map(p => [String(p._id) + (p.portion || ''), { ...p }]));
      for (const it of incoming) {
        if (!it) continue;
        const idRaw = it._id ?? it.id ?? it.itemId ?? it.productId ?? it.menuItemId ?? it.sku ?? it.code ?? null;
        const id = idRaw ? String(idRaw) : `${String(it.name || 'item')}-${String(it.price ?? '')}`; // final fallback to name-price
        const portion = it.portion || '';
        const key = id + portion;

        const addQty = Math.max(1, Number(it.qty ?? it.quantity ?? 1) || 1);
        const existing = byId.get(key);
        if (existing) {
          existing.qty = Math.max(1, Number(existing.qty || 0) + addQty);
          byId.set(key, existing);
        } else {
          byId.set(key, {
            _id: id,
            name: it.name ?? it.title ?? 'Item',
            price: Number(it.price ?? it.unitPrice ?? it.amount ?? 0),
            imageURL: it.imageURL ?? it.image ?? undefined,
            qty: addQty,
            portion: it.portion || undefined,
          });
        }
      }
      return Array.from(byId.values());
    });
  };

  const clear = () => setItems([]);

  const updateSuggestions = (allMenuItems) => {
    const newSuggestions = getSuggestions(items, allMenuItems);
    setSuggestions(newSuggestions);
  };

  return (
    <CartContext.Provider value={{ items, addItem, addItemsBatch, removeItem, updateQty, clear, suggestions, updateSuggestions }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
