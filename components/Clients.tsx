import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Client, Appointment, Transaction } from '../types';
import { Search, UserPlus, Phone, Mail, Calendar, DollarSign, ArrowUpDown, Filter, X, Save, Clock, StickyNote, Send } from 'lucide-react';

interface ClientsProps {
  clients: Client[];
  appointments: Appointment[];
  transactions: Transaction[];
  onUpsertClient: (client: Partial<Client>) => void;
}

const Clients: React.FC<ClientsProps> = ({ clients, appointments, transactions, onUpsertClient }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

  // Form State
  const [formFirst, setFormFirst] = useState('');
  const [formLast, setFormLast] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  
  // Note State
  const [newNote, setNewNote] = useState('');
  const [notesHistory, setNotesHistory] = useState('');
  const notesEndRef = useRef<HTMLDivElement>(null);

  // Helper for phone formatting
  const formatPhoneNumber = (value: string) => {
    if (!value) return value;
    const phoneNumber = value.replace(/[^\d]/g, '');
    const phoneNumberLength = phoneNumber.length;
    if (phoneNumberLength < 4) return phoneNumber;
    if (phoneNumberLength < 7) {
      return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3)}`;
    }
    return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6, 10)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const formatted = formatPhoneNumber(e.target.value);
      setFormPhone(formatted);
  };

  // Helper to get client stats
  const clientStats = useMemo(() => {
    const stats = new Map<string, { nextAppt: string | null, lastAppt: string | null, ytdSpend: number }>();
    const today = new Date();
    const currentYear = today.getFullYear();

    clients.forEach(client => {
        const clientFullName = `${client.firstName} ${client.lastName}`;
        
        // Find Appointments (match by ID or Name)
        const clientAppts = appointments.filter(a => 
            a.clientId === client.id || a.clientName.toLowerCase() === clientFullName.toLowerCase()
        ).sort((a, b) => new Date(a.date + 'T' + a.startTime).getTime() - new Date(b.date + 'T' + b.startTime).getTime());

        // Find Transactions (match by Name usually in this system)
        const clientTrans = transactions.filter(t => 
            t.clientName.toLowerCase() === clientFullName.toLowerCase()
        );

        // Calculate Next & Last
        const futureAppts = clientAppts.filter(a => new Date(a.date) >= today && a.status !== 'cancelled');
        const pastAppts = clientAppts.filter(a => new Date(a.date) < today && a.status !== 'cancelled');
        
        const nextAppt = futureAppts.length > 0 ? futureAppts[0].date : null;
        const lastAppt = pastAppts.length > 0 ? pastAppts[pastAppts.length - 1].date : null;

        // Calculate YTD Spend
        const ytdSpend = clientTrans.reduce((sum, t) => {
            const tDate = new Date(t.date);
            if (tDate.getFullYear() === currentYear) {
                return sum + t.amount + t.tip;
            }
            return sum;
        }, 0);

        stats.set(client.id, { nextAppt, lastAppt, ytdSpend });
    });

    return stats;
  }, [clients, appointments, transactions]);

  // Filter and Sort Clients
  const processedClients = useMemo(() => {
      let filtered = clients.filter(c => {
          const search = searchQuery.toLowerCase();
          return (
              c.firstName.toLowerCase().includes(search) ||
              c.lastName.toLowerCase().includes(search) ||
              c.phone.includes(search) ||
              c.email.toLowerCase().includes(search)
          );
      });

      if (sortConfig) {
          filtered.sort((a, b) => {
              let aValue: any = a[sortConfig.key as keyof Client];
              let bValue: any = b[sortConfig.key as keyof Client];
              
              // Handle computed fields
              if (sortConfig.key === 'ytdSpend') {
                  aValue = clientStats.get(a.id)?.ytdSpend || 0;
                  bValue = clientStats.get(b.id)?.ytdSpend || 0;
              }

              if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
              if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
              return 0;
          });
      }

      return filtered;
  }, [clients, searchQuery, sortConfig, clientStats]);

  const handleSort = (key: string) => {
      let direction: 'asc' | 'desc' = 'asc';
      if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
          direction = 'desc';
      }
      setSortConfig({ key, direction });
  };

  const openAddModal = () => {
      setFormFirst('');
      setFormLast('');
      setFormPhone('');
      setFormEmail('');
      setNotesHistory('');
      setNewNote('');
      setEditingClient(null);
      setIsAddModalOpen(true);
  };

  const openEditModal = (client: Client) => {
      setFormFirst(client.firstName);
      setFormLast(client.lastName);
      setFormPhone(client.phone);
      setFormEmail(client.email);
      setNotesHistory(client.notes || '');
      setEditingClient(client);
      setNewNote('');
      setIsAddModalOpen(true);
  };

  const handleSaveClient = (e: React.FormEvent) => {
      e.preventDefault();
      
      const clientData: Partial<Client> = {
          firstName: formFirst,
          lastName: formLast,
          phone: formPhone,
          email: formEmail,
          notes: notesHistory,
      };

      if (editingClient) {
          // Editing existing
          onUpsertClient({
              ...editingClient,
              ...clientData
          });
      } else {
          // Adding new
          onUpsertClient({
              ...clientData,
              id: Math.random().toString(36).substr(2, 9)
          });
      }

      setIsAddModalOpen(false);
      setFormFirst('');
      setFormLast('');
      setFormPhone('');
      setFormEmail('');
      setNotesHistory('');
      setEditingClient(null);
  };

  const handleAddNote = () => {
      if (!newNote.trim()) return;

      const timestamp = new Date().toLocaleString('en-US', { 
          month: 'numeric', day: 'numeric', year: '2-digit', 
          hour: 'numeric', minute: '2-digit' 
      });
      
      const noteEntry = `[${timestamp}] ${newNote.trim()}`;
      const updatedNotes = notesHistory 
          ? `${notesHistory}\n${noteEntry}`
          : noteEntry;
      
      setNotesHistory(updatedNotes);
      setNewNote('');
      
      // Scroll to bottom of notes
      setTimeout(() => {
          notesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
  };

  const formatCurrency = (val: number) => {
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
  };

  const formatDate = (dateStr: string | null) => {
      if (!dateStr) return '-';
      return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' });
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-6 rounded-xl border border-stone-200 shadow-sm">
            <div>
                <h2 className="text-xl font-bold text-stone-800 flex items-center gap-2">
                    <UserPlus className="w-6 h-6 text-emerald-600" />
                    Client Master List
                </h2>
                <p className="text-stone-500 text-sm mt-1">
                    Manage customer details, view history, and track spending. Click a client to edit.
                </p>
            </div>
            <button 
                onClick={openAddModal}
                className="bg-stone-900 hover:bg-black text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 shadow-lg transition-all"
            >
                <UserPlus className="w-4 h-4" /> Add New Client
            </button>
        </div>

        {/* Toolbar */}
        <div className="flex gap-4">
            <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 w-5 h-5" />
                <input 
                    type="text" 
                    placeholder="Search by name, phone, or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-stone-300 bg-white text-stone-900 placeholder-stone-400 focus:ring-2 focus:ring-emerald-500 outline-none shadow-sm"
                />
            </div>
        </div>

        {/* Spreadsheet Table */}
        <div className="flex-1 bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden flex flex-col">
            <div className="overflow-auto flex-1">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-stone-50 sticky top-0 z-10">
                        <tr>
                            {[
                                { key: 'firstName', label: 'First Name' },
                                { key: 'lastName', label: 'Last Name' },
                                { key: 'phone', label: 'Phone' },
                                { key: 'email', label: 'Email' },
                                { key: 'nextAppt', label: 'Next Appt' },
                                { key: 'lastAppt', label: 'Last Appt' },
                                { key: 'ytdSpend', label: 'YTD Spend' },
                            ].map((col) => (
                                <th 
                                    key={col.key}
                                    onClick={() => handleSort(col.key)}
                                    className="p-4 text-xs font-bold text-stone-500 uppercase tracking-wider cursor-pointer hover:bg-stone-100 transition-colors border-b border-stone-200"
                                >
                                    <div className="flex items-center gap-1">
                                        {col.label}
                                        <ArrowUpDown className="w-3 h-3 opacity-30" />
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                        {processedClients.length === 0 ? (
                             <tr>
                                 <td colSpan={7} className="p-8 text-center text-stone-400">
                                     No clients found matching your search.
                                 </td>
                             </tr>
                        ) : (
                            processedClients.map(client => {
                                const stats = clientStats.get(client.id);
                                return (
                                    <tr 
                                        key={client.id} 
                                        onClick={() => openEditModal(client)}
                                        className="hover:bg-emerald-50/50 cursor-pointer transition-colors group"
                                    >
                                        <td className="p-4 text-sm font-semibold text-stone-900 group-hover:text-emerald-700">{client.firstName}</td>
                                        <td className="p-4 text-sm font-semibold text-stone-900 group-hover:text-emerald-700">{client.lastName}</td>
                                        <td className="p-4 text-sm text-stone-600 font-mono">{client.phone}</td>
                                        <td className="p-4 text-sm text-stone-600">{client.email || '-'}</td>
                                        <td className="p-4 text-sm text-emerald-600 font-medium">
                                            {formatDate(stats?.nextAppt || null)}
                                        </td>
                                        <td className="p-4 text-sm text-stone-500">
                                            {formatDate(stats?.lastAppt || null)}
                                        </td>
                                        <td className="p-4 text-sm font-bold text-stone-800">
                                            {formatCurrency(stats?.ytdSpend || 0)}
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
            <div className="bg-stone-50 p-3 border-t border-stone-200 text-xs text-stone-500 flex justify-between">
                <span>Total Clients: {processedClients.length}</span>
            </div>
        </div>

        {/* Edit / Add Client Modal */}
        {isAddModalOpen && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 flex flex-col max-h-[90vh]">
                    <div className="bg-white text-stone-900 border-b border-stone-200 p-4 flex justify-between items-center shrink-0">
                        <h3 className="font-bold flex items-center gap-2">
                            {editingClient ? <StickyNote className="w-5 h-5 text-emerald-600" /> : <UserPlus className="w-5 h-5 text-emerald-600" />} 
                            {editingClient ? 'Edit Client Profile' : 'Add New Client'}
                        </h3>
                        <button onClick={() => setIsAddModalOpen(false)} className="text-stone-400 hover:text-stone-600 transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-6">
                        <form id="clientForm" onSubmit={handleSaveClient} className="space-y-6">
                            {/* Editable Headers Section */}
                            <div className="bg-stone-50 p-4 rounded-xl border border-stone-200">
                                <h4 className="text-xs font-bold text-stone-500 uppercase mb-3 flex items-center gap-1">
                                    <UserPlus className="w-3 h-3" /> Client Details
                                </h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-medium text-stone-600 mb-1">First Name</label>
                                        <input 
                                            required
                                            value={formFirst}
                                            onChange={e => setFormFirst(e.target.value)}
                                            className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-stone-900 bg-white" 
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-stone-600 mb-1">Last Name</label>
                                        <input 
                                            required
                                            value={formLast}
                                            onChange={e => setFormLast(e.target.value)}
                                            className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-stone-900 bg-white" 
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-stone-600 mb-1">Phone Number</label>
                                        <div className="relative">
                                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 w-3 h-3" />
                                            <input 
                                                required
                                                type="tel"
                                                value={formPhone}
                                                onChange={handlePhoneChange}
                                                className="w-full pl-8 pr-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-stone-900 bg-white" 
                                                placeholder="(555) 123-4567"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-stone-600 mb-1">Email Address</label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 w-3 h-3" />
                                            <input 
                                                type="email"
                                                value={formEmail}
                                                onChange={e => setFormEmail(e.target.value)}
                                                className="w-full pl-8 pr-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-stone-900 bg-white" 
                                                placeholder="client@email.com"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Notes Section - Always Visible */}
                            <div className="bg-yellow-50/50 p-4 rounded-xl border border-yellow-100 flex flex-col h-64">
                                <h4 className="text-xs font-bold text-yellow-700 uppercase mb-2 flex items-center gap-1">
                                    <StickyNote className="w-3 h-3" /> Client Notes
                                </h4>
                                
                                <div className="flex-1 bg-white border border-stone-200 rounded-lg p-3 overflow-y-auto mb-3 text-sm font-mono text-stone-600 whitespace-pre-wrap shadow-inner">
                                    {notesHistory ? notesHistory : <span className="text-stone-300 italic">No notes yet...</span>}
                                    <div ref={notesEndRef} />
                                </div>

                                <div className="flex gap-2">
                                    <input 
                                        value={newNote}
                                        onChange={e => setNewNote(e.target.value)}
                                        onKeyDown={e => {
                                            if(e.key === 'Enter') {
                                                e.preventDefault();
                                                handleAddNote();
                                            }
                                        }}
                                        placeholder="Type a new note (Enter to add)..."
                                        className="flex-1 px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-yellow-400 outline-none text-sm bg-white text-stone-900"
                                    />
                                    <button 
                                        type="button"
                                        onClick={handleAddNote}
                                        className="bg-yellow-100 hover:bg-yellow-200 text-yellow-800 px-3 py-2 rounded-lg transition-colors"
                                    >
                                        <Send className="w-4 h-4" />
                                    </button>
                                </div>
                                <p className="text-[10px] text-stone-400 mt-1 pl-1">Notes are automatically timestamped when added.</p>
                            </div>

                        </form>
                    </div>

                    <div className="p-4 bg-stone-50 border-t border-stone-200 flex gap-3 shrink-0">
                        <button 
                            type="button"
                            onClick={() => setIsAddModalOpen(false)}
                            className="flex-1 bg-white border border-stone-300 hover:bg-stone-50 text-stone-700 font-bold py-3 rounded-xl transition-colors"
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit"
                            form="clientForm"
                            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
                        >
                            <Save className="w-4 h-4" /> Save Client
                        </button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default Clients;