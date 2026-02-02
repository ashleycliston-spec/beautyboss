import React, { useState, useRef } from 'react';
import { Expense, ExpenseCategory, Stylist } from '../types';
import { Camera, Receipt, Plus, DollarSign, Tag, Calendar, Trash2, Image as ImageIcon } from 'lucide-react';

interface ExpensesProps {
  currentUser: Stylist | 'OWNER';
  expenses: Expense[];
  onAddExpense: (expense: Omit<Expense, 'id'>) => void;
  onDeleteExpense: (id: string) => void;
}

const CATEGORIES: ExpenseCategory[] = ['Salon products', 'Supply store', 'Tools', 'Rent', 'Miscellaneous'];

const Expenses: React.FC<ExpensesProps> = ({ currentUser, expenses, onAddExpense, onDeleteExpense }) => {
  const [amount, setAmount] = useState('');
  const [vendor, setVendor] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('Salon products');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filter expenses for current user (Owner sees all? Or owner sees own? Usually owner sees salon expenses)
  // For now, if OWNER, see all. If Stylist, see their own.
  const myExpenses = currentUser === 'OWNER' 
    ? expenses 
    : expenses.filter(e => e.stylistId === currentUser.id);

  const totalExpenses = myExpenses.reduce((sum, e) => sum + e.amount, 0);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setReceiptPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleScanClick = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !vendor) return;

    onAddExpense({
      stylistId: currentUser === 'OWNER' ? '1' : currentUser.id, // Assign to '1' (first stylist/owner) if owner
      amount: parseFloat(amount),
      date,
      category,
      vendor,
      receiptUrl: receiptPreview || undefined
    });

    // Reset form
    setAmount('');
    setVendor('');
    setReceiptPreview(null);
    setCategory('Salon products');
  };

  return (
    <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* Left Column: Entry Form */}
      <div className="lg:col-span-1 space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
          <div className="bg-emerald-950 p-4 text-white flex items-center gap-2">
            <Plus className="w-5 h-5" />
            <h2 className="font-semibold">Add New Expense</h2>
          </div>
          
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Amount</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 font-bold">$</span>
                <input 
                  type="number" 
                  step="0.01"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full pl-8 pr-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none bg-white text-black"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Vendor / Description</label>
              <input 
                type="text" 
                required
                value={vendor}
                onChange={(e) => setVendor(e.target.value)}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none bg-white text-black"
                placeholder="e.g. Sally Beauty Supply"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Category</label>
              <div className="relative">
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 w-4 h-4" />
                <select 
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                  className="w-full pl-9 pr-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none bg-white text-black"
                >
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 w-4 h-4" />
                <input 
                  type="date" 
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none bg-white text-black"
                />
              </div>
            </div>

            {/* Scan Receipt Section */}
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">Receipt</label>
              <input 
                type="file" 
                accept="image/*" 
                capture="environment" // Triggers camera on mobile
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden" 
              />
              
              {!receiptPreview ? (
                <button 
                  type="button"
                  onClick={handleScanClick}
                  className="w-full border-2 border-dashed border-stone-300 rounded-xl p-4 flex flex-col items-center justify-center text-stone-500 hover:border-emerald-400 hover:bg-emerald-50 transition-colors"
                >
                  <Camera className="w-8 h-8 mb-2 text-stone-400" />
                  <span className="text-sm font-medium">Scan Receipt</span>
                  <span className="text-xs text-stone-400 mt-1">Use camera or upload</span>
                </button>
              ) : (
                <div className="relative rounded-xl overflow-hidden border border-stone-200">
                  <img src={receiptPreview} alt="Receipt Preview" className="w-full h-48 object-cover" />
                  <button 
                    type="button"
                    onClick={() => setReceiptPreview(null)}
                    className="absolute top-2 right-2 bg-red-600 text-white p-1.5 rounded-full shadow hover:bg-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-2 text-center">
                    Receipt Attached
                  </div>
                </div>
              )}
            </div>

            <button 
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl shadow-sm transition-all active:scale-95"
            >
              Save Expense
            </button>
          </form>
        </div>
      </div>

      {/* Right Column: List & Stats */}
      <div className="lg:col-span-2 space-y-6">
        
        {/* Summary Card */}
        <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-stone-500 uppercase tracking-wide">Total Expenses</h3>
              <p className="text-3xl font-bold text-stone-900 mt-1">${totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
            </div>
            <div className="bg-red-50 p-4 rounded-full">
              <Receipt className="w-8 h-8 text-red-500" />
            </div>
        </div>

        {/* Expenses List */}
        <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
          <div className="border-b border-stone-200 p-4 bg-stone-50 flex justify-between items-center">
            <h3 className="font-semibold text-stone-800">Expense History</h3>
            <span className="text-xs font-medium text-stone-500 bg-white px-2 py-1 rounded border border-stone-200">
              {myExpenses.length} Records
            </span>
          </div>

          <div className="divide-y divide-stone-100 max-h-[600px] overflow-y-auto">
            {myExpenses.length === 0 ? (
              <div className="p-8 text-center text-stone-400">
                <Tag className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p>No expenses recorded yet.</p>
              </div>
            ) : (
              myExpenses.map((expense) => (
                <div key={expense.id} className="p-4 hover:bg-stone-50 transition-colors flex items-center justify-between group">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center shrink-0 ${expense.receiptUrl ? 'bg-stone-200' : 'bg-stone-100'}`}>
                      {expense.receiptUrl ? (
                         <img src={expense.receiptUrl} alt="Thumb" className="w-full h-full object-cover rounded-lg" />
                      ) : (
                         <DollarSign className="w-5 h-5 text-stone-400" />
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-stone-800">{expense.vendor}</p>
                      <div className="flex items-center gap-2 text-xs text-stone-500 mt-0.5">
                        <span className="bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded">{expense.category}</span>
                        <span>•</span>
                        <span>{new Date(expense.date).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <span className="font-bold text-stone-900">${expense.amount.toFixed(2)}</span>
                    <button 
                      onClick={() => onDeleteExpense(expense.id)}
                      className="p-2 text-stone-300 hover:text-red-500 hover:bg-red-50 rounded transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

    </div>
  );
};

export default Expenses;