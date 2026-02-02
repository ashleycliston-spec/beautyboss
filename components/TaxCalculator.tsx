import React, { useState, useEffect } from 'react';
import { US_STATES } from '../constants';
import { Calculator, AlertCircle, Edit2, Check } from 'lucide-react';

const TaxCalculator: React.FC = () => {
  const [income, setIncome] = useState<string>('');
  const [selectedStateIndex, setSelectedStateIndex] = useState<number>(() => {
      const saved = localStorage.getItem('salonSync_taxStateIndex');
      return saved ? parseInt(saved, 10) : 0;
  });
  
  const [isEditing, setIsEditing] = useState(false);
  
  useEffect(() => {
      localStorage.setItem('salonSync_taxStateIndex', selectedStateIndex.toString());
  }, [selectedStateIndex]);
  
  const selectedState = US_STATES[selectedStateIndex];
  const incomeValue = parseFloat(income) || 0;
  const estimatedTax = incomeValue * (selectedState.rate / 100);
  const netIncome = incomeValue - estimatedTax;

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-sm border border-stone-200 p-8">
      <div className="flex items-center gap-3 mb-6 border-b border-stone-100 pb-4">
        <div className="p-3 bg-emerald-50 rounded-full">
            <Calculator className="w-6 h-6 text-emerald-600" />
        </div>
        <div>
            <h2 className="text-xl font-bold text-stone-900">State Tax Estimator</h2>
            <p className="text-sm text-stone-500">Estimate your obligations based on sales volume</p>
        </div>
      </div>

      <div className="space-y-6">
        <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
                Total Gross Income ($)
            </label>
            <input
                type="number"
                value={income}
                onChange={(e) => setIncome(e.target.value)}
                placeholder="e.g. 75000"
                className="w-full px-4 py-3 rounded-lg border border-stone-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all bg-white text-black"
            />
        </div>

        <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
                Tax Jurisdiction
            </label>
            
            {isEditing ? (
                <div className="flex gap-2 animate-in fade-in zoom-in-95 duration-200">
                    <div className="relative flex-1">
                        <select
                            value={selectedStateIndex}
                            onChange={(e) => setSelectedStateIndex(Number(e.target.value))}
                            className="w-full px-4 py-3 rounded-lg border border-stone-300 bg-white text-black focus:ring-2 focus:ring-emerald-500 outline-none appearance-none"
                            autoFocus
                        >
                            {US_STATES.map((state, index) => (
                                <option key={state.name} value={index}>
                                    {state.name} ({state.rate}%)
                                </option>
                            ))}
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                            <svg className="w-4 h-4 text-stone-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                        </div>
                    </div>
                    <button 
                        onClick={() => setIsEditing(false)}
                        className="px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors flex items-center justify-center shadow-sm"
                        title="Save State"
                    >
                        <Check className="w-5 h-5" />
                    </button>
                </div>
            ) : (
                <div className="flex items-center justify-between bg-stone-50 p-4 rounded-lg border border-stone-200 group hover:border-emerald-200 transition-all">
                    <div className="flex flex-col">
                        <span className="font-bold text-stone-900 text-lg flex items-center gap-2">
                            {selectedState.name}
                        </span>
                        <span className="text-sm text-stone-500 font-medium">Sales Tax Rate: <span className="text-stone-800">{selectedState.rate}%</span></span>
                    </div>
                    <button 
                        onClick={() => setIsEditing(true)}
                        className="p-2 text-stone-400 hover:text-emerald-600 hover:bg-white rounded-lg transition-all border border-transparent hover:border-emerald-100 hover:shadow-sm"
                        title="Change State"
                    >
                        <Edit2 className="w-4 h-4" />
                    </button>
                </div>
            )}
        </div>

        <div className="bg-stone-50 rounded-lg p-6 border border-stone-100 mt-6 space-y-3">
            <div className="flex justify-between items-center text-sm">
                <span className="text-stone-500">State Tax Rate ({selectedState.name})</span>
                <span className="font-semibold text-stone-700">{selectedState.rate}%</span>
            </div>
            <div className="flex justify-between items-center text-sm">
                <span className="text-stone-500">Estimated Tax Amount</span>
                <span className="font-bold text-red-500">-${estimatedTax.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div className="h-px bg-stone-200 my-2"></div>
            <div className="flex justify-between items-center">
                <span className="font-medium text-stone-900">Estimated Net Income</span>
                <span className="text-xl font-bold text-green-600">${netIncome.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
        </div>

        <div className="flex items-start gap-2 text-xs text-stone-400 bg-blue-50/50 p-3 rounded border border-blue-100">
            <AlertCircle className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
            <p>This is an estimation tool only and does not constitute official tax advice. Please consult with a CPA for accurate filings.</p>
        </div>
      </div>
    </div>
  );
};

export default TaxCalculator;