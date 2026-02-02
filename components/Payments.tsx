import React, { useState } from 'react';
import { Stylist, Transaction, Product, SoldProduct, Client } from '../types';
import { CreditCard, Smartphone, DollarSign, CheckCircle2, ScanLine, Wallet, Lock, CalendarCheck, ArrowRight, UserPlus, Bell, ShoppingBag, Plus, X, FlaskConical, NotebookPen, Users, Search, Check, Save } from 'lucide-react';

interface PaymentsProps {
  currentUser: Stylist | 'OWNER';
  inventory: Product[];
  clients: Client[];
  onAddTransaction: (t: Omit<Transaction, 'id' | 'date'>) => void;
  onUpsertClient: (c: Partial<Client>) => void;
  onNavigateToSchedule: () => void;
}

const Payments: React.FC<PaymentsProps> = ({ currentUser, inventory, clients, onAddTransaction, onUpsertClient, onNavigateToSchedule }) => {
  const [amount, setAmount] = useState('');
  const [tip, setTip] = useState('');
  const [description, setDescription] = useState('');
  const [success, setSuccess] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<Transaction['method'] | null>(null);
  const [processing, setProcessing] = useState(false);
  
  // Product Add-on State
  const [selectedProducts, setSelectedProducts] = useState<SoldProduct[]>([]);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);

  // Client Details State
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientAddress, setClientAddress] = useState('');
  const [clientNotes, setClientNotes] = useState('');
  const [clientFormulas, setClientFormulas] = useState('');
  const [parentId, setParentId] = useState('');
  
  // Search State
  const [clientSearchQuery, setClientSearchQuery] = useState('');
  const [isClientSearchOpen, setIsClientSearchOpen] = useState(false);
  const [saveClient, setSaveClient] = useState(true);

  // Parent Search State
  const [parentSearchQuery, setParentSearchQuery] = useState('');
  const [isParentSearchOpen, setIsParentSearchOpen] = useState(false);

  // Retention State
  const [showRetentionModal, setShowRetentionModal] = useState(false);
  const [reminderWeeks, setReminderWeeks] = useState(6);

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
      setClientPhone(formatted);
  };

  // Filter inventory for this user
  const myInventory = inventory.filter(p => currentUser === 'OWNER' ? true : p.stylistId === currentUser.id);
  const productTotal = selectedProducts.reduce((acc, p) => acc + (p.price * p.quantity), 0);
  const grandTotal = (Number(amount) || 0) + (Number(tip) || 0) + productTotal;
  
  const clientFullName = `${firstName} ${lastName}`.trim();

  // Filter clients for general search
  const filteredClients = clients.filter(c => {
      const fullName = `${c.firstName} ${c.lastName}`.toLowerCase();
      const phone = c.phone.replace(/\D/g, '');
      const search = clientSearchQuery.toLowerCase();
      return fullName.includes(search) || phone.includes(search);
  }).slice(0, 5);

  // Filter clients for parent search
  const filteredParents = clients.filter(c => {
      const fullName = `${c.firstName} ${c.lastName}`.toLowerCase();
      const phone = c.phone.replace(/\D/g, '');
      const search = parentSearchQuery.toLowerCase();
      return fullName.includes(search) || phone.includes(search);
  });

  const handleAddProduct = (product: Product) => {
      setSelectedProducts(prev => {
          const existing = prev.find(p => p.id === product.id);
          if (existing) {
              return prev.map(p => p.id === product.id ? { ...p, quantity: p.quantity + 1 } : p);
          }
          return [...prev, { id: product.id, name: product.name, price: product.price, quantity: 1 }];
      });
      setIsProductModalOpen(false);
  };

  const removeProduct = (id: string) => {
      setSelectedProducts(prev => prev.filter(p => p.id !== id));
  };

  const handlePayment = () => {
    if ((!amount && productTotal === 0) || !selectedMethod) return;
    
    setProcessing(true);
    
    // Save client data if name is provided and save is checked
    if (firstName && saveClient) {
        // Logic to append formulas and specific notes to client history
        let finalNotes = clientNotes;
        const today = new Date().toLocaleDateString();

        // If a formula is present, append it to the notes with a timestamp so it is logged
        if (clientFormulas) {
             const formulaEntry = `[${today}] Formula: ${clientFormulas}`;
             // Avoid duplicating if it was just added (simple check, not perfect)
             if (!finalNotes.includes(formulaEntry)) {
                 finalNotes = finalNotes ? `${finalNotes}\n${formulaEntry}` : formulaEntry;
             }
        }
        
        onUpsertClient({
            firstName,
            lastName,
            phone: clientPhone,
            email: clientEmail,
            address: clientAddress,
            notes: finalNotes, // Saves the history including the new formula
            formulas: clientFormulas, // Keeps the current formula field updated
            parentId: parentId || undefined
        });
    }

    setTimeout(() => {
        onAddTransaction({
            stylistId: currentUser === 'OWNER' ? '1' : currentUser.id,
            amount: Number(amount), // Service amount only
            tip: Number(tip) || 0,
            products: selectedProducts,
            method: selectedMethod,
            description: description || 'Service Payment',
            clientName: clientFullName || 'Walk-In'
        });

        setProcessing(false);
        setSuccess(true);
        
        // Show retention prompt shortly after success
        setTimeout(() => {
            setShowRetentionModal(true);
        }, 1000);

    }, 1500);
  };

  const handleRetentionAction = (action: 'REBOOK' | 'REMIND' | 'DISMISS') => {
      setShowRetentionModal(false);
      setSuccess(false);
      
      // Reset Form
      setAmount('');
      setTip('');
      setDescription('');
      setSelectedMethod(null);
      setFirstName('');
      setLastName('');
      setClientPhone('');
      setClientEmail('');
      setClientAddress('');
      setClientNotes('');
      setClientFormulas('');
      setParentId('');
      setParentSearchQuery('');
      setClientSearchQuery('');
      setSelectedProducts([]);
      setSaveClient(true);

      if (action === 'REBOOK') {
          onNavigateToSchedule();
      } else if (action === 'REMIND') {
          alert(`Reminder set! We will text ${clientFullName || 'the client'} in ${reminderWeeks} weeks.`);
      }
  };

  const handleSelectClient = (c: Client) => {
      setFirstName(c.firstName);
      setLastName(c.lastName);
      setClientPhone(c.phone);
      setClientEmail(c.email);
      setClientAddress(c.address);
      setClientNotes(c.notes || '');
      setClientFormulas(c.formulas || '');
      setParentId(c.parentId || '');
      
      // Close Search
      setClientSearchQuery('');
      setIsClientSearchOpen(false);
  };

  const getProviderUI = () => {
      if (!selectedMethod) return null;

      switch(selectedMethod) {
          case 'Square':
              return (
                  <div className="bg-stone-50 border border-stone-200 rounded-lg p-4 space-y-3 animate-in fade-in slide-in-from-bottom-2">
                      <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-semibold text-stone-700">Card Details</span>
                      </div>
                      <input disabled type="text" placeholder="•••• •••• •••• 4242" className="w-full bg-white border border-stone-300 rounded px-3 py-2 text-sm" />
                      <div className="flex gap-3">
                          <input disabled type="text" placeholder="MM/YY" className="w-1/2 bg-white border border-stone-300 rounded px-3 py-2 text-sm" />
                          <input disabled type="text" placeholder="CVC" className="w-1/2 bg-white border border-stone-300 rounded px-3 py-2 text-sm" />
                      </div>
                      <button onClick={handlePayment} disabled={processing} className="w-full bg-stone-900 text-white py-2 rounded font-medium hover:bg-black transition-colors flex items-center justify-center gap-2">
                          {processing ? 'Processing...' : `Charge $${grandTotal.toFixed(2)}`}
                      </button>
                  </div>
              );
          case 'PayPal':
          case 'Venmo':
          case 'Cash':
              return (
                  <div className={`rounded-lg p-6 flex flex-col items-center justify-center animate-in fade-in slide-in-from-bottom-2 ${selectedMethod === 'Cash' ? 'bg-emerald-50' : 'bg-blue-50'}`}>
                      <p className="font-semibold mb-4 text-sm">Total Due: ${grandTotal.toFixed(2)}</p>
                      <button onClick={handlePayment} disabled={processing} className={`w-full text-white font-bold py-2.5 rounded shadow-sm transition-all ${selectedMethod === 'Cash' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-blue-600 hover:bg-blue-700'}`}>
                          {processing ? 'Processing...' : `Confirm ${selectedMethod} Payment`}
                      </button>
                  </div>
              );
      }
  }

  return (
    <div className="max-w-5xl mx-auto relative">
       <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Transaction Details (7 cols) */}
            <div className="lg:col-span-7 space-y-6">
                    <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6">
                        <h2 className="text-lg font-bold text-stone-800 mb-4 flex items-center gap-2">
                            <Wallet className="w-5 h-5 text-emerald-600" />
                            Transaction & Client
                        </h2>
                        
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-stone-700 mb-2">Service Total</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 font-medium">$</span>
                                        <input 
                                            type="number" 
                                            value={amount}
                                            onChange={(e) => setAmount(e.target.value)}
                                            className="w-full pl-8 pr-4 py-3 text-2xl font-bold text-black bg-white border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-shadow"
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-stone-700 mb-2">Tip Amount</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 font-medium">$</span>
                                        <input 
                                            type="number" 
                                            value={tip}
                                            onChange={(e) => setTip(e.target.value)}
                                            className="w-full pl-8 pr-4 py-3 text-2xl font-bold text-black bg-white border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-shadow"
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Product Add-ons */}
                            <div className="border-t border-stone-100 pt-4">
                                <div className="flex justify-between items-center mb-3">
                                    <label className="block text-sm font-medium text-stone-700">Products</label>
                                    <button 
                                        onClick={() => setIsProductModalOpen(true)}
                                        className="text-xs flex items-center gap-1 text-emerald-600 font-medium hover:bg-emerald-50 px-2 py-1 rounded"
                                    >
                                        <Plus className="w-3 h-3" /> Add Product
                                    </button>
                                </div>
                                
                                {selectedProducts.length > 0 ? (
                                    <div className="space-y-2 mb-2">
                                        {selectedProducts.map(p => (
                                            <div key={p.id} className="flex justify-between items-center text-sm bg-stone-50 p-2 rounded border border-stone-100">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium text-stone-800">{p.name}</span>
                                                    <span className="text-stone-400 text-xs">x{p.quantity}</span>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className="font-semibold">${(p.price * p.quantity).toFixed(2)}</span>
                                                    <button onClick={() => removeProduct(p.id)} className="text-stone-400 hover:text-red-500"><X className="w-3 h-3" /></button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-4 border border-dashed border-stone-200 rounded-lg text-stone-400 text-sm mb-2">
                                        No products added
                                    </div>
                                )}
                            </div>

                            <div className="border-t border-stone-100 pt-4 mt-4">
                                <div className="flex justify-between items-center mb-3">
                                    <h3 className="text-sm font-medium text-stone-900 flex items-center gap-2">
                                        <UserPlus className="w-4 h-4 text-stone-500" />
                                        Client Profile
                                    </h3>
                                    
                                    <div className="flex items-center gap-2">
                                         <button 
                                            onClick={() => setSaveClient(!saveClient)}
                                            className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium transition-colors border ${saveClient ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-white border-stone-200 text-stone-500'}`}
                                         >
                                             {saveClient ? <Check className="w-3 h-3" /> : <Save className="w-3 h-3" />}
                                             Save Client
                                         </button>
                                    </div>
                                </div>
                                
                                {/* Client Search */}
                                <div className="relative mb-3">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 w-3.5 h-3.5" />
                                    <input 
                                        type="text"
                                        value={clientSearchQuery}
                                        onChange={(e) => {
                                            setClientSearchQuery(e.target.value);
                                            setIsClientSearchOpen(true);
                                        }}
                                        onFocus={() => setIsClientSearchOpen(true)}
                                        placeholder="Search existing client..."
                                        className="w-full pl-9 pr-4 py-2 border border-stone-300 rounded-lg text-sm bg-white text-black outline-none focus:ring-2 focus:ring-emerald-500"
                                    />
                                    {isClientSearchOpen && clientSearchQuery && (
                                        <div className="absolute z-20 w-full mt-1 bg-white border border-stone-200 rounded-lg shadow-xl max-h-48 overflow-y-auto">
                                            {filteredClients.length > 0 ? (
                                                filteredClients.map(c => (
                                                    <button
                                                        key={c.id}
                                                        onClick={() => handleSelectClient(c)}
                                                        className="w-full text-left px-3 py-2 text-sm hover:bg-emerald-50 flex items-center justify-between border-b border-stone-50 last:border-none"
                                                    >
                                                        <span className="font-medium text-stone-800">{c.firstName} {c.lastName}</span>
                                                        {c.phone && <span className="text-xs text-stone-400">{c.phone}</span>}
                                                    </button>
                                                ))
                                            ) : (
                                                <div className="px-3 py-2 text-sm text-stone-400 italic">No found clients</div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                                    <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="First Name" className="p-2 border border-stone-300 rounded text-sm bg-white text-black" />
                                    <input type="text" value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Last Name" className="p-2 border border-stone-300 rounded text-sm bg-white text-black" />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                                    <input type="tel" value={clientPhone} onChange={handlePhoneChange} placeholder="Phone Number" className="p-2 border border-stone-300 rounded text-sm bg-white text-black" />
                                    <input type="email" value={clientEmail} onChange={e => setClientEmail(e.target.value)} placeholder="Email Address" className="p-2 border border-stone-300 rounded text-sm bg-white text-black" />
                                </div>
                                <input type="text" value={clientAddress} onChange={e => setClientAddress(e.target.value)} placeholder="Home Address" className="p-2 border border-stone-300 rounded text-sm bg-white text-black w-full mb-3" />

                                {/* Parent Linking */}
                                <div className="mb-3 relative">
                                    <label className="block text-xs font-medium text-stone-500 mb-1 flex items-center gap-1">
                                        <Users className="w-3 h-3" /> Attach to Parent Account (Optional)
                                    </label>
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 w-3.5 h-3.5" />
                                        <input 
                                            type="text"
                                            value={parentSearchQuery}
                                            onChange={(e) => {
                                                setParentSearchQuery(e.target.value);
                                                setIsParentSearchOpen(true);
                                                if (!e.target.value) setParentId('');
                                            }}
                                            onFocus={() => setIsParentSearchOpen(true)}
                                            onBlur={() => {
                                                // Delay hiding to allow click event on options
                                                setTimeout(() => setIsParentSearchOpen(false), 200);
                                            }}
                                            placeholder="Search for parent account..."
                                            className="w-full pl-9 pr-8 p-2 border border-stone-300 rounded-lg text-sm bg-white text-black outline-none focus:ring-2 focus:ring-emerald-500"
                                        />
                                        {parentSearchQuery && (
                                            <button 
                                                onClick={() => {
                                                    setParentId('');
                                                    setParentSearchQuery('');
                                                }}
                                                className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 p-1"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        )}
                                    </div>
                                    
                                    {isParentSearchOpen && (
                                        <div className="absolute z-20 w-full mt-1 bg-white border border-stone-200 rounded-lg shadow-xl max-h-48 overflow-y-auto">
                                            {filteredParents.length > 0 ? (
                                                filteredParents.map(c => (
                                                    <button
                                                        key={c.id}
                                                        onMouseDown={(e) => {
                                                            // Use onMouseDown to fire before onBlur
                                                            e.preventDefault(); 
                                                            setParentId(c.id);
                                                            setParentSearchQuery(`${c.firstName} ${c.lastName}`);
                                                            setIsParentSearchOpen(false);
                                                        }}
                                                        className="w-full text-left px-3 py-2 text-sm hover:bg-emerald-50 flex items-center justify-between border-b border-stone-50 last:border-none"
                                                    >
                                                        <span className="font-medium text-stone-800">{c.firstName} {c.lastName}</span>
                                                        {c.phone && <span className="text-xs text-stone-400">{c.phone}</span>}
                                                    </button>
                                                ))
                                            ) : (
                                                <div className="px-3 py-2 text-sm text-stone-400 italic">No matching clients</div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Technical & Personal Notes */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                                    <div className="relative">
                                        <div className="flex items-center gap-1.5 mb-1.5 text-xs font-medium text-stone-600">
                                            <FlaskConical className="w-3.5 h-3.5 text-purple-600" />
                                            Color Formulas
                                        </div>
                                        <textarea 
                                            value={clientFormulas}
                                            onChange={e => setClientFormulas(e.target.value)}
                                            placeholder="e.g. 1/2 tube 6N + 1/2 tube 6G + 20 vol"
                                            className="w-full p-2 border border-stone-300 rounded-lg text-sm bg-white text-black min-h-[80px] text-xs resize-none focus:ring-2 focus:ring-purple-100 focus:border-purple-300 outline-none"
                                        />
                                    </div>
                                    <div className="relative">
                                        <div className="flex items-center gap-1.5 mb-1.5 text-xs font-medium text-stone-600">
                                            <NotebookPen className="w-3.5 h-3.5 text-blue-600" />
                                            Notes & Allergies
                                        </div>
                                        <textarea 
                                            value={clientNotes}
                                            onChange={e => setClientNotes(e.target.value)}
                                            placeholder="e.g. Sensitive scalp, prefers warm water"
                                            className="w-full p-2 border border-stone-300 rounded-lg text-sm bg-white text-black min-h-[80px] text-xs resize-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 outline-none"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
            </div>

            {/* Right Column: Payment Method (5 cols) */}
            <div className="lg:col-span-5 bg-white rounded-xl shadow-lg border border-stone-200 overflow-hidden flex flex-col h-fit">
                    <div className="bg-stone-50 p-4 border-b border-stone-200">
                        <h2 className="font-semibold text-stone-800">Payment Summary</h2>
                    </div>
                    
                    <div className="p-6 flex-1 flex flex-col">
                        <div className="space-y-2 mb-6 text-sm">
                            <div className="flex justify-between text-stone-500">
                                <span>Service</span>
                                <span>${(Number(amount) || 0).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-stone-500">
                                <span>Products</span>
                                <span>${productTotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-stone-500">
                                <span>Tip</span>
                                <span>${(Number(tip) || 0).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between font-bold text-stone-900 text-lg border-t pt-2 border-stone-100">
                                <span>Total</span>
                                <span>${grandTotal.toFixed(2)}</span>
                            </div>
                        </div>

                        {success && !showRetentionModal ? (
                            <div className="flex-1 flex flex-col items-center justify-center py-10 space-y-4 animate-in fade-in duration-300">
                                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center shadow-inner">
                                    <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                                </div>
                                <div className="text-center">
                                    <h3 className="text-lg font-bold text-emerald-700">Processed</h3>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="grid grid-cols-2 gap-3 mb-6">
                                    {['Square', 'PayPal', 'Venmo', 'Cash'].map(m => (
                                        <button 
                                            key={m}
                                            onClick={() => setSelectedMethod(m as any)}
                                            className={`flex flex-col items-center justify-center p-3 border rounded-lg transition-all ${selectedMethod === m ? 'bg-stone-900 border-stone-900 text-white' : 'border-stone-200 hover:border-stone-300 hover:bg-stone-50'}`}
                                        >
                                            <span className="text-xs font-medium">{m}</span>
                                        </button>
                                    ))}
                                </div>

                                <div className="flex-1 bg-stone-50 rounded-xl border border-stone-100 flex items-center justify-center relative min-h-[150px]">
                                    {selectedMethod ? (
                                        <div className="w-full p-2">
                                            {getProviderUI()}
                                        </div>
                                    ) : (
                                        <p className="text-stone-400 text-sm text-center px-4">Enter amount and select a payment method</p>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
            </div>
       </div>

       {/* Product Selection Modal */}
       {isProductModalOpen && (
           <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
               <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col">
                    <div className="p-4 border-b border-stone-200 flex justify-between items-center">
                        <h3 className="font-bold text-stone-800">Add Product to Sale</h3>
                        <button onClick={() => setIsProductModalOpen(false)}><X className="w-5 h-5 text-stone-400" /></button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2">
                        {myInventory.length === 0 ? (
                            <div className="text-center py-8 text-stone-400">
                                <ShoppingBag className="w-10 h-10 mx-auto mb-2 opacity-20" />
                                <p>No products in inventory.</p>
                            </div>
                        ) : (
                            myInventory.map(prod => (
                                <button 
                                    key={prod.id} 
                                    onClick={() => handleAddProduct(prod)}
                                    className="w-full flex justify-between items-center p-3 hover:bg-stone-50 border-b border-stone-50 last:border-none text-left"
                                >
                                    <div>
                                        <div className="font-semibold text-sm text-stone-800">{prod.name}</div>
                                        <div className="text-xs text-stone-500">{prod.brand}</div>
                                    </div>
                                    <div className="font-bold text-emerald-600 text-sm">${prod.price.toFixed(2)}</div>
                                </button>
                            ))
                        )}
                    </div>
               </div>
           </div>
       )}

       {/* Retention Modal */}
       {showRetentionModal && (
           <div className="fixed inset-0 z-50 flex items-center justify-center bg-emerald-950/80 backdrop-blur-sm p-4 animate-in fade-in duration-300">
               <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl p-6 md:p-8 text-center">
                   <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                       <CalendarCheck className="w-8 h-8 text-emerald-600" />
                   </div>
                   
                   <h2 className="text-2xl font-bold text-stone-900 mb-2">Prioritize Rebooking</h2>
                   <p className="text-stone-600 mb-8">Secure {clientFullName || 'the client'}s next slot now to ensure schedule consistency.</p>
                   
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       <button 
                           onClick={() => handleRetentionAction('REBOOK')}
                           className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white py-3 px-4 rounded-xl font-semibold transition-colors shadow-lg shadow-emerald-200"
                       >
                           Rebook Now <ArrowRight className="w-4 h-4" />
                       </button>

                       <div className="flex flex-col gap-2">
                            <button 
                                onClick={() => handleRetentionAction('REMIND')}
                                className="flex items-center justify-center gap-2 bg-white border-2 border-stone-200 hover:border-stone-300 text-stone-700 py-3 px-4 rounded-xl font-semibold transition-colors"
                            >
                                <Bell className="w-4 h-4" /> Send Reminder
                            </button>
                            <div className="flex items-center justify-center gap-2 text-xs text-stone-500">
                                <span>In</span>
                                <select 
                                    value={reminderWeeks}
                                    onChange={(e) => setReminderWeeks(Number(e.target.value))}
                                    className="bg-stone-100 rounded px-1 py-0.5 border border-stone-200 outline-none"
                                >
                                    {[4, 5, 6, 8, 10, 12].map(w => <option key={w} value={w}>{w}</option>)}
                                </select>
                                <span>weeks</span>
                            </div>
                       </div>
                   </div>

                   <button onClick={() => handleRetentionAction('DISMISS')} className="mt-6 text-sm text-stone-400 hover:text-stone-600">
                       Skip for now
                   </button>
               </div>
           </div>
       )}
    </div>
  );
};

export default Payments;