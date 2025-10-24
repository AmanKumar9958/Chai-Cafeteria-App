import React from 'react';
import { Toaster } from 'react-hot-toast';
import { NavLink, Routes, Route, Navigate } from 'react-router-dom';
import AddPage from './pages/AddPage';
import ListPage from './pages/ListPage';
import OrdersPage from './pages/OrdersPage';

const App = () => {
  return (
    <div className="min-h-screen bg-gray-100">
      <Toaster position="top-right" />
      <header className="bg-white/95 backdrop-blur border-b sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2">
            <img src="/logo.png" alt="Chai Cafeteria" className="h-48 w-auto" />
            <span className="sr-only">Chai Cafeteria Admin</span>
          </a>
          <nav className="flex items-center gap-2">
            <NavLink to="/add" className={({ isActive }) => `px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive ? 'bg-amber-500 text-white' : 'text-gray-700 hover:bg-gray-100'}`}>
              Add New
            </NavLink>
            <NavLink to="/list" className={({ isActive }) => `px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive ? 'bg-amber-500 text-white' : 'text-gray-700 hover:bg-gray-100'}`}>
              Manage Menu
            </NavLink>
            <NavLink to="/orders" className={({ isActive }) => `px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive ? 'bg-amber-500 text-white' : 'text-gray-700 hover:bg-gray-100'}`}>
              View Orders
            </NavLink>
          </nav>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-6">
        <Routes>
          <Route path="/" element={<Navigate to="/add" replace />} />
          <Route path="/add" element={<AddPage />} />
          <Route path="/list" element={<ListPage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="*" element={<Navigate to="/add" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
