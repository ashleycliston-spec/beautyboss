import React, { useEffect, useState, useMemo } from 'react';
import { Stylist, Transaction, Appointment } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { DollarSign, TrendingUp, Users, Wallet, X, Calendar, ArrowRight, Sparkles } from 'lucide-react';
import { getBusinessInsights } from '../services/geminiService';

interface DashboardProps {
  currentUser: Stylist | 'OWNER';
  transactions: Transaction[];
  appointments: Appointment[];
  stylists: Stylist[];
}

const Dashboard: React.FC<DashboardProps> = ({ currentUser, transactions, appointments, stylists }) => {
  const [insights, setInsights] = useState<string>("");
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [detailView, setDetailView] = useState<'REVENUE' | 'APPOINTMENTS' | 'TICKET' | null>(null);

  // Filter transactions based on role
  const relevantTransactions = useMemo(() => {
    if (currentUser === 'OWNER') return transactions;
    return transactions.filter(t => t.stylistId === currentUser.id);
  }, [currentUser, transactions]);

  const relevantAppointments = useMemo(() => {
      if (currentUser === 'OWNER') return appointments;
      return appointments.filter(a => a.stylistId === currentUser.id);
  }, [currentUser, appointments]);

  // Calculate Metrics
  const totalRevenue = relevantTransactions.reduce((acc, t) => acc + t.amount, 0);
  const totalTips = relevantTransactions.reduce((acc, t) => acc + t.tip, 0);
  const totalAppts = relevantTransactions.length; // Approximate based on transactions
  const avgTicket = totalAppts > 0 ? totalRevenue / totalAppts : 0;

  // Chart Data Preparation
  const chartData = useMemo(() => {
      const data: Record<string, number> = {};
      relevantTransactions.forEach(t => {
          // Group by day (simplified)
          const date = new Date(t.date).toLocaleDateString('en-US', { weekday: 'short' });
          data[date] = (data[date] || 0) + t.amount;
      });
      return Object.entries(data).map(([name, value]) => ({ name, value }));
  }, [relevantTransactions]);

  useEffect(() => {
      if (relevantTransactions.length > 0) {
          setLoadingInsights(true);
          const role = currentUser === 'OWNER' ? 'Salon Owner' : 'Stylist';
          getBusinessInsights(relevantTransactions, role)
              .then(text => {
                  setInsights(text || "No insights available.");
              })
              .finally(() => setLoadingInsights(false));
      }
  }, [relevantTransactions, currentUser]);

  const StatCard = ({ title, value, subtext, icon: Icon, color, onClick }: any) => (
      <div 
        onClick={onClick}
        className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm hover:shadow-md transition-all cursor-pointer group"
      >
          <div className="flex justify-between items-start mb-4">
              <div>
                  <p className="text-sm font-medium text-stone-500 mb-1">{title}</p>
                  <h3 className="text-2xl font-bold text-stone-900">{value}</h3>
              </div>
              <div className={`p-3 rounded-lg ${color} group-hover:scale-110 transition-transform`}>
                  <Icon className="w-5 h-5 text-white" />
              </div>
          </div>
          <div className="flex items-center gap-1 text-xs text-stone-400">
             {subtext} <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
      </div>
  );

  return (
    <div className="space-y-6">
        {/* Welcome Section */}
        <div className="flex flex-col md:flex-row justify-between items-end gap-4 bg-gradient-to-r from-emerald-900 to-emerald-950 p-6 rounded-2xl text-white shadow-xl">
            <div>
                <h2 className="text-3xl font-bold mb-2">
                    Hello, {currentUser === 'OWNER' ? 'Boss' : currentUser.name.split(' ')[0]}!
                </h2>
                <p className="text-emerald-100 max-w-xl">
                    Here's what's happening in your business today. You're tracking well against your weekly goals.
                </p>
            </div>
            <div className="hidden md:block">
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur px-4 py-2 rounded-lg text-sm border border-white/20">
                    <Calendar className="w-4 h-4" />
                    {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </div>
            </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard 
                title="Total Revenue" 
                value={`$${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`} 
                subtext="+12% from last week"
                icon={DollarSign}
                color="bg-emerald-500"
                onClick={() => setDetailView('REVENUE')}
            />
            <StatCard 
                title="Appointments" 
                value={totalAppts} 
                subtext={`${relevantAppointments.filter(a => a.status === 'confirmed').length} upcoming`}
                icon={Users}
                color="bg-blue-500"
                onClick={() => setDetailView('APPOINTMENTS')}
            />
            <StatCard 
                title="Avg. Ticket" 
                value={`$${avgTicket.toFixed(0)}`} 
                subtext="Target: $85"
                icon={TrendingUp}
                color="bg-purple-500"
                onClick={() => setDetailView('TICKET')}
            />
            <StatCard 
                title="Tips Earned" 
                value={`$${totalTips.toFixed(0)}`} 
                subtext="Keep up the great service!"
                icon={Wallet}
                color="bg-orange-400"
                onClick={() => {}}
            />
        </div>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Chart Section */}
            <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-stone-200 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-stone-800">Revenue Overview</h3>
                    <select className="text-xs bg-stone-100 border-none rounded-md px-2 py-1 outline-none text-stone-600">
                        <option>This Week</option>
                        <option>Last Week</option>
                        <option>This Month</option>
                    </select>
                </div>
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                            <XAxis 
                                dataKey="name" 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{fill: '#9CA3AF', fontSize: 12}} 
                                dy={10}
                            />
                            <YAxis 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{fill: '#9CA3AF', fontSize: 12}} 
                                tickFormatter={(value) => `$${value}`}
                            />
                            <Tooltip 
                                cursor={{fill: '#F3F4F6'}}
                                contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'}}
                            />
                            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#10B981' : '#34D399'} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* AI Insights Panel */}
            <div className="lg:col-span-1 bg-gradient-to-br from-stone-900 to-stone-800 p-6 rounded-xl text-white shadow-lg flex flex-col relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Sparkles className="w-24 h-24" />
                </div>
                
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2 relative z-10">
                    <Sparkles className="w-5 h-5 text-yellow-400" />
                    AI Business Coach
                </h3>

                <div className="flex-1 relative z-10">
                    {loadingInsights ? (
                        <div className="space-y-3 animate-pulse">
                            <div className="h-2 bg-white/20 rounded w-3/4"></div>
                            <div className="h-2 bg-white/20 rounded w-full"></div>
                            <div className="h-2 bg-white/20 rounded w-5/6"></div>
                        </div>
                    ) : (
                        <div className="text-sm text-stone-300 leading-relaxed space-y-2">
                             {insights.split('- ').map((line, i) => (
                                 line.trim() && <p key={i} className="flex gap-2">
                                     <span className="text-emerald-400">•</span>
                                     <span>{line.trim()}</span>
                                 </p>
                             ))}
                        </div>
                    )}
                </div>

                <div className="mt-6 pt-4 border-t border-white/10 text-xs text-stone-400 text-center">
                    Powered by Gemini 3 Flash
                </div>
            </div>
        </div>
    </div>
  );
};

export default Dashboard;