import React, { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { api } from '../services/api';

const COLORS = {
  OPEN: '#EF4444', 
  IN_PROGRESS: '#F59E0B', 
  RESOLVED: '#10B981', 
  CLOSED: '#6B7280'
};

export default function TicketAnalytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await api.getTicketAnalytics();
        setData(result);
      } catch (err) {
        console.error('Failed to load analytics', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="card text-center text-muted">Loading Analytics...</div>;
  if (!data) return <div className="card text-center text-muted">No Analytics Data Available</div>;

  const pieData = [
    { name: 'Open', value: data.openTickets, color: COLORS.OPEN },
    { name: 'In Progress', value: data.inProgressTickets, color: COLORS.IN_PROGRESS },
    { name: 'Resolved', value: data.resolvedTickets, color: COLORS.RESOLVED },
    { name: 'Closed', value: data.closedTickets, color: COLORS.CLOSED },
  ].filter(item => item.value > 0);

  const barData = Object.entries(data.ticketsByCategory || {}).map(([key, val]) => ({
    name: key.replace('_', ' '),
    tickets: val
  }));

  return (
    <div className="grid gap-6 mb-6 animate-fade">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card" style={{ padding: '1.25rem', borderTop: `4px solid ${COLORS.OPEN}` }}>
            <h4 className="text-muted" style={{ margin: 0, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Open</h4>
            <span style={{ fontSize: '2rem', fontWeight: '800', color: '#111827' }}>{data.openTickets}</span>
        </div>
        <div className="card" style={{ padding: '1.25rem', borderTop: `4px solid ${COLORS.IN_PROGRESS}` }}>
            <h4 className="text-muted" style={{ margin: 0, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>In Progress</h4>
            <span style={{ fontSize: '2rem', fontWeight: '800', color: '#111827' }}>{data.inProgressTickets}</span>
        </div>
        <div className="card" style={{ padding: '1.25rem', borderTop: `4px solid ${COLORS.RESOLVED}` }}>
            <h4 className="text-muted" style={{ margin: 0, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Resolved</h4>
            <span style={{ fontSize: '2rem', fontWeight: '800', color: '#111827' }}>{data.resolvedTickets}</span>
        </div>
        <div className="card" style={{ padding: '1.25rem', borderTop: `4px solid ${COLORS.CLOSED}` }}>
            <h4 className="text-muted" style={{ margin: 0, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Closed</h4>
            <span style={{ fontSize: '2rem', fontWeight: '800', color: '#111827' }}>{data.closedTickets}</span>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="card">
          <h3 style={{ marginBottom: '1.5rem', fontSize: '1.1rem' }}>Tickets by Status</h3>
          <div style={{ height: 260 }}>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : <p className="text-muted text-center mt-6">No Data</p>}
          </div>
        </div>

        <div className="card">
          <h3 style={{ marginBottom: '1.5rem', fontSize: '1.1rem' }}>Tickets by Category</h3>
          <div style={{ height: 260 }}>
            {barData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ left: -20, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6b7280' }} />
                  <YAxis axisLine={false} tickLine={false} allowDecimals={false} tick={{ fontSize: 11, fill: '#6b7280' }} />
                  <Tooltip 
                    cursor={{ fill: '#f8fafc' }} 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}
                  />
                  <Bar dataKey="tickets" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            ) : <p className="text-muted text-center mt-6">No Data</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
