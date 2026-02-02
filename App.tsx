import React, { useState, useEffect, useRef } from 'react';
import { AppState, Stylist, Transaction, Appointment, Expense, Product, Client } from './types';
import { MOCK_STYLISTS, MOCK_CATALOG } from './constants';
import { generateAppointments, generateTransactions } from './services/mockDataService';
import Login from './components/Login';
import Schedule from './components/Schedule';
import Dashboard from './components/Dashboard';
import TaxCalculator from './components/TaxCalculator';
import Payments from './components/Payments';
import Resources from './components/Resources';
import Expenses from './components/Expenses';
import Inventory from './components/Inventory';
import Clients from './components/Clients';
import ProfitLoss from './components/ProfitLoss';
import { Calendar, LayoutDashboard, CreditCard, PieChart, Scissors, LogOut, Database, RefreshCw, BookOpen, Receipt, Package, Menu, X, UserPlus, Users, ChevronDown, ChevronRight, UserCircle, DollarSign, FileText } from 'lucide-react';

type Tab = 'SCHEDULE' | 'DASHBOARD' | 'PAYMENTS' | 'TAXES' | 'RESOURCES' | 'EXPENSES' | 'INVENTORY' | 'CLIENTS' | 'PROFIT_LOSS';

interface MenuItem {
    id: string;
    label: string;
    icon: React.FC<any>;
    children?: { id: Tab; label: string; icon: React.FC<any> }[];
}

const App: React.FC = () => {
  const [data, setData] = useState<AppState>({
    currentUser: null, // Start with null for Auth
    appointments: [],
    transactions: [],
    clients: [],
    expenses: [],
    inventory: [],
    stylists: MOCK_STYLISTS
  });
  
  // Ref to hold the latest data for synchronous access during page unload
  const dataRef = useRef(data);

  const [activeTab, setActiveTab] = useState<Tab>('SCHEDULE');
  const [isSyncing, setIsSyncing] = useState(false);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['CUSTOMER', 'FINANCE']);

  // Add Stylist Modal State
  const [isAddStylistOpen, setIsAddStylistOpen] = useState(false);
  const [newStylistName, setNewStylistName] = useState('');
  const [newStylistSpecialty, setNewStylistSpecialty] = useState('');
  const [newStylistPassword, setNewStylistPassword] = useState('');

  // Update ref whenever state changes
  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  // Initialize Data from LocalStorage or Mock & Check for Remembered User
  useEffect(() => {
    // 1. Load Data
    const savedData = localStorage.getItem('salonSyncData');
    if (savedData) {
        try {
            const parsed = JSON.parse(savedData);
            setData(prev => ({
                ...prev,
                appointments: parsed.appointments || [],
                transactions: parsed.transactions || [],
                clients: parsed.clients || [],
                expenses: parsed.expenses || [],
                inventory: parsed.inventory || [],
                stylists: parsed.stylists && parsed.stylists.length > 0 ? parsed.stylists : MOCK_STYLISTS
            }));
        } catch (e) {
            console.error("Failed to load local data", e);
        }
        setIsDataLoaded(true);
    } else {
        const initialAppointments = generateAppointments(MOCK_STYLISTS);
        const initialTransactions = generateTransactions(MOCK_STYLISTS);
        
        // Pre-populate Inventory with Milbon products for the owner
        const initialInventory: Product[] = MOCK_CATALOG.filter(item => item.brand === 'Milbon').map(item => ({
            ...item,
            stock: 12, // Default stock for demo
            stylistId: '1', // Owner
            cost: item.price * 0.5 // Estimate wholesale cost
        }));

        setData(prev => ({
            ...prev,
            appointments: initialAppointments,
            transactions: initialTransactions,
            clients: [],
            expenses: [],
            inventory: initialInventory,
            stylists: MOCK_STYLISTS
        }));
        localStorage.setItem('salonSyncData', JSON.stringify({
            appointments: initialAppointments,
            transactions: initialTransactions,
            clients: [],
            expenses: [],
            inventory: initialInventory,
            stylists: MOCK_STYLISTS
        }));
        setIsDataLoaded(true);
    }

    // 2. Load Remembered User
    const savedUser = localStorage.getItem('salonSync_currentUser');
    if (savedUser) {
        try {
            const parsedUser = JSON.parse(savedUser);
            setData(prev => ({ ...prev, currentUser: parsedUser }));
        } catch (e) {
            console.error("Failed to restore session", e);
            localStorage.removeItem('salonSync_currentUser');
        }
    }
  }, []);

  // Auto-Save Effect (Debounced)
  useEffect(() => {
    if (!isDataLoaded) return;

    setIsSyncing(true);
    const timer = setTimeout(() => {
        localStorage.setItem('salonSyncData', JSON.stringify({
            appointments: data.appointments,
            transactions: data.transactions,
            clients: data.clients,
            expenses: data.expenses,
            inventory: data.inventory,
            stylists: data.stylists
        }));
        setIsSyncing(false);
    }, 500); 
    return () => clearTimeout(timer);
  }, [data.appointments, data.transactions, data.clients, data.expenses, data.inventory, data.stylists, isDataLoaded]);

  // Force Save on Refresh/Close (beforeunload)
  useEffect(() => {
    const handleBeforeUnload = () => {
        if (!isDataLoaded) return;
        
        // Use the Ref to get the absolute latest state synchronously
        localStorage.setItem('salonSyncData', JSON.stringify({
            appointments: dataRef.current.appointments,
            transactions: dataRef.current.transactions,
            clients: dataRef.current.clients,
            expenses: dataRef.current.expenses,
            inventory: dataRef.current.inventory,
            stylists: dataRef.current.stylists
        }));
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDataLoaded]);

  const handleLogin = (user: Stylist | 'OWNER', remember: boolean) => {
      setData(prev => ({ ...prev, currentUser: user }));
      // Default to Schedule view on Login
      setActiveTab('SCHEDULE');

      if (remember) {
          localStorage.setItem('salonSync_currentUser', JSON.stringify(user));
      } else {
          localStorage.removeItem('salonSync_currentUser');
      }
  };

  const handleLogout = () => {
      // Force save state before clearing user to prevent race conditions
      localStorage.setItem('salonSyncData', JSON.stringify({
          appointments: data.appointments,
          transactions: data.transactions,
          clients: data.clients,
          expenses: data.expenses,
          inventory: data.inventory,
          stylists: data.stylists
      }));
      
      setData(prev => ({ ...prev, currentUser: null }));
      localStorage.removeItem('salonSync_currentUser');
  };

  const handleRoleSwitch = (role: 'OWNER' | string) => {
      if (role === 'OWNER') {
          setData(prev => ({ ...prev, currentUser: 'OWNER' }));
      } else {
          const stylist = data.stylists.find(s => s.id === role);
          if (stylist) {
              setData(prev => ({ ...prev, currentUser: stylist }));
          }
      }
  };

  const handleAddStylist = (e: React.FormEvent) => {
      e.preventDefault();
      if (!newStylistName) return;

      const newStylist: Stylist = {
          id: Math.random().toString(36).substr(2, 9),
          name: newStylistName,
          email: `${newStylistName.toLowerCase().replace(/\s/g, '.')}@salon.com`,
          specialty: newStylistSpecialty || 'Stylist',
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(newStylistName)}&background=random`,
          password: newStylistPassword || 'password'
      };

      setData(prev => ({
          ...prev,
          stylists: [...prev.stylists, newStylist]
      }));

      setNewStylistName('');
      setNewStylistSpecialty('');
      setNewStylistPassword('');
      setIsAddStylistOpen(false);
  };

  const handleAddTransaction = (newTx: Omit<Transaction, 'id' | 'date'>) => {
      const tx: Transaction = {
          ...newTx,
          id: Math.random().toString(36).substr(2, 9),
          date: new Date().toISOString()
      };
      setData(prev => ({
          ...prev,
          transactions: [tx, ...prev.transactions]
      }));
  };

  const handleAddAppointment = (newAppt: Omit<Appointment, 'id' | 'status'> & { status?: 'confirmed' | 'blocked' }) => {
      const appt: Appointment = {
          ...newAppt,
          id: Math.random().toString(36).substr(2, 9),
          status: newAppt.status || 'confirmed',
          date: newAppt.date || new Date().toISOString().split('T')[0], // Fallback if missing
          price: newAppt.price || 0
      };
      setData(prev => ({
          ...prev,
          appointments: [...prev.appointments, appt]
      }));
  };

  const handleUpdateAppointment = (updatedAppt: Appointment) => {
      setData(prev => ({
          ...prev,
          appointments: prev.appointments.map(a => a.id === updatedAppt.id ? updatedAppt : a)
      }));
  };

  const handleDeleteAppointment = (id: string) => {
      setData(prev => ({
          ...prev,
          appointments: prev.appointments.filter(a => a.id !== id)
      }));
  };

  const handleUpsertClient = (clientData: Partial<Client>) => {
      // Don't validate firstName here anymore to allow partial updates (like notes) for existing clients
      
      setData(prev => {
          // Check by ID first, then by Phone, then by Email
          const existingIndex = prev.clients.findIndex(c => 
              (clientData.id && c.id === clientData.id) ||
              (clientData.phone && c.phone && clientData.phone && c.phone.replace(/\D/g, '') === clientData.phone.replace(/\D/g, '')) ||
              (clientData.email && c.email && clientData.email && c.email === clientData.email)
          );

          if (existingIndex >= 0) {
              const updatedClients = [...prev.clients];
              updatedClients[existingIndex] = { ...updatedClients[existingIndex], ...clientData };
              return { ...prev, clients: updatedClients };
          } else {
              // Ensure we have a name for NEW clients
              if (!clientData.firstName) return prev;

              const newClient: Client = {
                  id: clientData.id || Math.random().toString(36).substr(2, 9),
                  firstName: clientData.firstName || '',
                  lastName: clientData.lastName || '',
                  phone: clientData.phone || '',
                  email: clientData.email || '',
                  address: clientData.address || '',
                  notes: clientData.notes,
                  formulas: clientData.formulas,
                  parentId: clientData.parentId,
                  lastVisit: new Date().toISOString()
              };
              return { ...prev, clients: [...prev.clients, newClient] };
          }
      });
  };

  const handleAddExpense = (newExpense: Omit<Expense, 'id'>) => {
      const expense: Expense = {
          ...newExpense,
          id: Math.random().toString(36).substr(2, 9)
      };
      setData(prev => ({
          ...prev,
          expenses: [expense, ...prev.expenses]
      }));
  };

  const handleDeleteExpense = (id: string) => {
      setData(prev => ({
          ...prev,
          expenses: prev.expenses.filter(e => e.id !== id)
      }));
  };

  const handleAddProduct = (product: Product) => {
      setData(prev => ({
          ...prev,
          inventory: [...prev.inventory, product]
      }));
  };

  const handleUpdateProduct = (updatedProduct: Product) => {
      setData(prev => ({
          ...prev,
          inventory: prev.inventory.map(p => p.id === updatedProduct.id ? updatedProduct : p)
      }));
  };

  const toggleMenu = (id: string) => {
    setExpandedMenus(prev => 
        prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  if (!data.currentUser) {
      return <Login stylists={data.stylists} onLogin={handleLogin} />;
  }

  const menuItems: MenuItem[] = [
      { id: 'SCHEDULE', label: 'Schedule', icon: Calendar },
      { 
          id: 'CUSTOMER', 
          label: 'Customer', 
          icon: UserCircle,
          children: [
            { id: 'CLIENTS', label: 'Clients', icon: Users },
            { id: 'PAYMENTS', label: 'Payments', icon: CreditCard },
          ]
      },
      {
          id: 'FINANCE',
          label: 'Finance',
          icon: DollarSign,
          children: [
              { id: 'PROFIT_LOSS', label: 'P&L Statement', icon: FileText },
              { id: 'EXPENSES', label: 'Expenses', icon: Receipt },
              { id: 'TAXES', label: 'Taxes', icon: PieChart },
          ]
      },
      { id: 'DASHBOARD', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'INVENTORY', label: 'Inventory', icon: Package },
      { id: 'RESOURCES', label: 'Resources', icon: BookOpen },
  ];

  const getPageTitle = (tab: Tab) => {
      for (const item of menuItems) {
          if (item.children) {
              const found = item.children.find(child => child.id === tab);
              if (found) return found.label;
          }
          if (item.id === tab) {
              return item.label;
          }
      }
      return 'SalonSync';
  };

  return (
    <div className="flex h-screen bg-stone-50 overflow-hidden font-sans text-stone-900">
        {/* Sidebar */}
        <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-stone-900 text-white transform transition-transform duration-300 ease-in-out ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 md:relative flex flex-col`}>
            <div className="p-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="bg-emerald-600 p-2 rounded-lg">
                        <Scissors className="w-6 h-6 text-white" />
                    </div>
                    <h1 className="text-xl font-bold tracking-tight">SalonSync</h1>
                </div>
                <button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden text-stone-400 hover:text-white">
                    <X className="w-6 h-6" />
                </button>
            </div>

            <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
                {menuItems.map(item => {
                    if (item.children) {
                        const isExpanded = expandedMenus.includes(item.id);
                        const isActiveChild = item.children.some(child => child.id === activeTab);
                        
                        return (
                            <div key={item.id} className="space-y-1">
                                <button
                                    onClick={() => toggleMenu(item.id)}
                                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${isActiveChild ? 'text-white' : 'text-stone-400 hover:bg-stone-800 hover:text-white'}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <item.icon className="w-5 h-5" />
                                        {item.label}
                                    </div>
                                    {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                                </button>
                                
                                {isExpanded && (
                                    <div className="pl-4 space-y-1">
                                        {item.children.map(child => (
                                            <button
                                                key={child.id}
                                                onClick={() => { setActiveTab(child.id); setIsMobileMenuOpen(false); }}
                                                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-all ${activeTab === child.id ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/20 font-semibold' : 'text-stone-400 hover:bg-stone-800 hover:text-white'}`}
                                            >
                                                <child.icon className="w-4 h-4" />
                                                {child.label}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    }

                    return (
                        <button
                            key={item.id}
                            onClick={() => { setActiveTab(item.id as Tab); setIsMobileMenuOpen(false); }}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === item.id ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/20 font-semibold' : 'text-stone-400 hover:bg-stone-800 hover:text-white'}`}
                        >
                            <item.icon className="w-5 h-5" />
                            {item.label}
                        </button>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-stone-800">
                <div className="flex items-center gap-3 mb-4 px-2">
                    <div className="w-10 h-10 rounded-full bg-stone-700 overflow-hidden border-2 border-stone-600">
                        {data.currentUser !== 'OWNER' && (
                            <img src={data.currentUser.avatar} alt="Profile" className="w-full h-full object-cover" />
                        )}
                        {data.currentUser === 'OWNER' && (
                            <div className="w-full h-full flex items-center justify-center text-xs font-bold text-stone-300">
                                OWNER
                            </div>
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-white truncate">
                            {data.currentUser === 'OWNER' ? 'Salon Owner' : data.currentUser.name}
                        </p>
                        <p className="text-xs text-stone-500 truncate">
                            {data.currentUser === 'OWNER' ? 'Administrator' : data.currentUser.specialty}
                        </p>
                    </div>
                </div>

                {data.currentUser === 'OWNER' && (
                     <div className="mb-4">
                         <label className="text-xs text-stone-500 font-bold uppercase mb-2 block px-2">View As</label>
                         <select 
                            className="w-full bg-stone-800 text-stone-300 text-xs rounded-lg p-2 border border-stone-700 outline-none focus:border-emerald-500"
                            onChange={(e) => handleRoleSwitch(e.target.value)}
                            value="OWNER"
                         >
                             <option value="OWNER">Owner (Admin)</option>
                             {data.stylists.filter(s => s.id !== '1').map(s => (
                                 <option key={s.id} value={s.id}>{s.name}</option>
                             ))}
                         </select>
                         
                         <button 
                            onClick={() => setIsAddStylistOpen(true)}
                            className="w-full mt-2 flex items-center justify-center gap-2 bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs py-2 rounded-lg transition-colors border border-stone-700 border-dashed"
                         >
                             <UserPlus className="w-3 h-3" /> Add Stylist
                         </button>
                     </div>
                )}

                <button 
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 text-stone-400 hover:text-red-400 px-2 py-2 text-sm transition-colors rounded-lg hover:bg-stone-800"
                >
                    <LogOut className="w-4 h-4" /> Sign Out
                </button>
            </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col h-full relative overflow-hidden">
            {/* Mobile Header */}
            <div className="md:hidden bg-white border-b border-stone-200 p-4 flex items-center justify-between z-20">
                <div className="flex items-center gap-2">
                    <button onClick={() => setIsMobileMenuOpen(true)} className="text-stone-600">
                        <Menu className="w-6 h-6" />
                    </button>
                    <span className="font-bold text-stone-800">{getPageTitle(activeTab)}</span>
                </div>
                <div className="flex items-center gap-2">
                    {isSyncing && <RefreshCw className="w-4 h-4 text-stone-400 animate-spin" />}
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-auto p-4 md:p-8 bg-stone-50/50">
                <div className="max-w-7xl mx-auto h-full">
                    {activeTab === 'SCHEDULE' && (
                        <Schedule 
                            stylists={data.stylists}
                            appointments={data.appointments}
                            clients={data.clients}
                            currentUser={data.currentUser}
                            onAddAppointment={handleAddAppointment}
                            onUpdateAppointment={handleUpdateAppointment}
                            onUpsertClient={handleUpsertClient}
                            onDeleteAppointment={handleDeleteAppointment}
                        />
                    )}
                    {activeTab === 'CLIENTS' && (
                        <Clients 
                            clients={data.clients}
                            appointments={data.appointments}
                            transactions={data.transactions}
                            onUpsertClient={handleUpsertClient}
                        />
                    )}
                    {activeTab === 'DASHBOARD' && (
                        <Dashboard 
                            currentUser={data.currentUser}
                            transactions={data.transactions}
                            appointments={data.appointments}
                            stylists={data.stylists}
                        />
                    )}
                    {activeTab === 'PAYMENTS' && (
                        <Payments 
                            currentUser={data.currentUser}
                            inventory={data.inventory}
                            clients={data.clients}
                            onAddTransaction={handleAddTransaction}
                            onUpsertClient={handleUpsertClient}
                            onNavigateToSchedule={() => setActiveTab('SCHEDULE')}
                        />
                    )}
                    {activeTab === 'PROFIT_LOSS' && (
                        <ProfitLoss 
                            currentUser={data.currentUser}
                            transactions={data.transactions}
                            expenses={data.expenses}
                        />
                    )}
                    {activeTab === 'EXPENSES' && (
                        <Expenses 
                            currentUser={data.currentUser}
                            expenses={data.expenses}
                            onAddExpense={handleAddExpense}
                            onDeleteExpense={handleDeleteExpense}
                        />
                    )}
                    {activeTab === 'INVENTORY' && (
                        <Inventory 
                            currentUser={data.currentUser}
                            inventory={data.inventory}
                            onAddProduct={handleAddProduct}
                            onUpdateProduct={handleUpdateProduct}
                        />
                    )}
                    {activeTab === 'TAXES' && <TaxCalculator />}
                    {activeTab === 'RESOURCES' && <Resources />}
                </div>
            </div>

            {/* Sync Indicator (Desktop) */}
            <div className="hidden md:flex absolute top-4 right-4 items-center gap-2 px-3 py-1.5 bg-white/80 backdrop-blur rounded-full shadow-sm text-xs font-medium text-stone-500 border border-stone-200 pointer-events-none">
                {isSyncing ? (
                    <>
                        <RefreshCw className="w-3 h-3 animate-spin text-emerald-500" />
                        Syncing...
                    </>
                ) : (
                    <>
                        <Database className="w-3 h-3 text-stone-400" />
                        Saved locally
                    </>
                )}
            </div>
        </main>

        {/* Add Stylist Modal */}
        {isAddStylistOpen && (
            <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95">
                    <div className="bg-stone-900 p-4 flex justify-between items-center text-white">
                        <h3 className="font-bold flex items-center gap-2">
                            <UserPlus className="w-5 h-5" /> Add New Stylist
                        </h3>
                        <button onClick={() => setIsAddStylistOpen(false)} className="text-stone-400 hover:text-white">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    <form onSubmit={handleAddStylist} className="p-6 space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-stone-500 uppercase mb-1">Full Name</label>
                            <input 
                                required
                                value={newStylistName}
                                onChange={e => setNewStylistName(e.target.value)}
                                className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" 
                                placeholder="e.g. Sarah Smith"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-stone-500 uppercase mb-1">Specialty</label>
                            <input 
                                value={newStylistSpecialty}
                                onChange={e => setNewStylistSpecialty(e.target.value)}
                                className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" 
                                placeholder="e.g. Color Specialist"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-stone-500 uppercase mb-1">Temporary Password</label>
                            <input 
                                value={newStylistPassword}
                                onChange={e => setNewStylistPassword(e.target.value)}
                                className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" 
                                placeholder="Default: password"
                            />
                        </div>
                        <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition-colors">
                            Create Account
                        </button>
                    </form>
                </div>
            </div>
        )}
    </div>
  );
};

export default App;