import React, { useEffect, useState } from 'react';
import API from '../api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const res = await API.get('/admin/dashboard');
        setStats(res.data);
      } catch (err) {
        console.error('Failed to fetch dashboard stats', err);
      } finally {
        setLoading(false);
      }
    }
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  if (!stats) {
    return <div className="text-center mt-10 text-red-500">Failed to load dashboard data.</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Dashboard Overview</h2>
      
      {/* Top Cards for Today's Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Today's Orders" value={stats.todayOrders} color="blue" />
        <StatCard title="Today's Completed" value={stats.todayCompleted} color="green" />
        <StatCard title="Today's Pending" value={stats.todayPending} color="amber" />
        <StatCard title="Today's Sales" value={`₹${stats.todaySellPrice.toFixed(2)}`} color="indigo" />
      </div>

      {/* Cards for This Month's Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <StatCard title="This Month's Orders" value={stats.thisMonthOrders} color="blue" />
        <StatCard title="This Month's Sales" value={`₹${stats.thisMonthSellPrice?.toFixed(2) || 0}`} color="green" />
      </div>

      {/* Top Cards for All-time Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <StatCard title="Total Orders (All Time)" value={stats.totalOrders} color="gray" />
        <StatCard title="Total Sales (All Time)" value={`₹${stats.totalSellPrice?.toFixed(2) || 0}`} color="gray" />
      </div>

      {/* Monthly Report Chart */}
      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-6">Monthly Report (Sales & Orders)</h3>
        
        {stats.monthlyReport && stats.monthlyReport.length > 0 ? (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.monthlyReport} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis yAxisId="left" orientation="left" stroke="#4f46e5" />
                <YAxis yAxisId="right" orientation="right" stroke="#16a34a" />
                <Tooltip />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="sales" name="Sales (₹)" stroke="#4f46e5" activeDot={{ r: 8 }} />
                <Line yAxisId="right" type="monotone" dataKey="orders" name="Orders" stroke="#16a34a" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="text-gray-500 text-center py-10">No monthly data available yet.</div>
        )}
      </div>
    </div>
  );
}

function StatCard({ title, value, color }) {
  const colorMap = {
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    green: 'bg-green-50 text-green-700 border-green-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    gray: 'bg-gray-50 text-gray-700 border-gray-200',
  };

  return (
    <div className={`p-5 rounded-lg border ${colorMap[color]} flex flex-col items-start justify-center`}>
      <div className="text-sm font-medium opacity-80 uppercase tracking-wider">{title}</div>
      <div className="text-2xl font-bold mt-1">{value}</div>
    </div>
  );
}
