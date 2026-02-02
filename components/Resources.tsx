import React, { useState, useEffect } from 'react';
import { US_STATES } from '../constants';
import { BookOpen, ExternalLink, GraduationCap, Building, FileCheck, Search } from 'lucide-react';

const Resources: React.FC = () => {
  const [selectedStateIndex, setSelectedStateIndex] = useState<number>(() => {
      const saved = localStorage.getItem('salonSync_stateIndex');
      return saved ? parseInt(saved, 10) : 0;
  });
  
  const selectedState = US_STATES[selectedStateIndex];

  useEffect(() => {
      localStorage.setItem('salonSync_stateIndex', selectedStateIndex.toString());
  }, [selectedStateIndex]);

  // Helper to generate Google Search Query Links (More robust than hardcoding 200 urls that break)
  const getSearchLink = (query: string) => {
      const q = encodeURIComponent(`${selectedState.name} ${query}`);
      return `https://www.google.com/search?q=${q}`;
  };

  const resources = [
      {
          title: "License Renewal",
          icon: <FileCheck className="w-6 h-6 text-blue-500" />,
          desc: "Official state board license renewal portal.",
          link: getSearchLink("cosmetology license renewal official site")
      },
      {
          title: "Sales Tax Payment",
          icon: <Building className="w-6 h-6 text-green-500" />,
          desc: "State Department of Revenue sales tax filing.",
          link: getSearchLink("pay sales tax department of revenue official site")
      },
      {
          title: "Quarterly Federal Taxes",
          icon: <Building className="w-6 h-6 text-stone-500" />,
          desc: "IRS payment portal for estimated taxes.",
          link: "https://www.irs.gov/payments/direct-pay" // This is constant
      },
      {
          title: "Continuing Education",
          icon: <GraduationCap className="w-6 h-6 text-purple-500" />,
          desc: "Approved CE providers and hour requirements.",
          link: getSearchLink("cosmetology continuing education requirements and providers")
      }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8">
        <div className="bg-gradient-to-r from-emerald-900 to-emerald-950 rounded-2xl p-8 text-white shadow-xl">
            <h2 className="text-3xl font-bold mb-4 flex items-center gap-3">
                <BookOpen className="w-8 h-8 text-emerald-300" />
                Stylist Resources
            </h2>
            <p className="text-emerald-100 max-w-2xl text-lg">
                Quick access to essential compliance, tax, and education portals specific to your licensure state.
            </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6 md:p-8">
            <label className="block text-sm font-medium text-stone-700 mb-3">
                Select Your Licensing State
            </label>
            <div className="relative max-w-md">
                <select
                    value={selectedStateIndex}
                    onChange={(e) => setSelectedStateIndex(Number(e.target.value))}
                    className="w-full px-4 py-3 rounded-lg border border-stone-300 bg-white text-stone-900 focus:ring-2 focus:ring-emerald-500 outline-none appearance-none font-medium"
                >
                    {US_STATES.map((state, index) => (
                        <option key={state.name} value={index}>
                            {state.name}
                        </option>
                    ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-stone-500">
                    <Search className="w-4 h-4" />
                </div>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {resources.map((res) => (
                <a 
                    key={res.title}
                    href={res.link}
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="group bg-white p-6 rounded-xl border border-stone-200 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all flex items-start gap-4"
                >
                    <div className="p-3 bg-stone-50 rounded-lg group-hover:bg-emerald-50 transition-colors">
                        {res.icon}
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                            <h3 className="font-bold text-stone-900 group-hover:text-emerald-700 transition-colors">
                                {res.title}
                            </h3>
                            <ExternalLink className="w-4 h-4 text-stone-400 group-hover:text-emerald-400" />
                        </div>
                        <p className="text-sm text-stone-500 leading-relaxed">
                            {res.desc}
                        </p>
                        {res.title !== "Quarterly Federal Taxes" && (
                            <span className="inline-block mt-3 text-[10px] font-semibold text-stone-400 bg-stone-100 px-2 py-1 rounded">
                                {selectedState.name} Specific
                            </span>
                        )}
                    </div>
                </a>
            ))}
        </div>
    </div>
  );
};

export default Resources;