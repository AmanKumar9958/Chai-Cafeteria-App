import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [items, setItems] = useState([]); // { itemId, name, price, qty }
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
      const byId = new Map(prev.map(p => [String(p._id), { ...p }]));
      for (const it of incoming) {
        if (!it) continue;
        const idRaw = it._id ?? it.id ?? it.itemId ?? it.productId ?? it.menuItemId ?? it.sku ?? it.code ?? null;
        const id = idRaw ? String(idRaw) : `${String(it.name || 'item')}-${String(it.price ?? '')}`; // final fallback to name-price
        const addQty = Math.max(1, Number(it.qty ?? it.quantity ?? 1) || 1);
        const existing = byId.get(id);
        if (existing) {
          existing.qty = Math.max(1, Number(existing.qty || 0) + addQty);
          byId.set(id, existing);
        } else {
          byId.set(id, {
            _id: id,
            name: it.name ?? it.title ?? 'Item',
            price: Number(it.price ?? it.unitPrice ?? it.amount ?? 0),
            imageURL: it.imageURL ?? it.image ?? undefined,
            qty: addQty,
          });
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
