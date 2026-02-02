import React, { useState, useMemo } from 'react';
import { Transaction, Expense, Stylist } from '../types';
import { DollarSign, TrendingDown, TrendingUp, Calendar, FileText, Printer, ArrowDownRight, ArrowUpRight } from 'lucide-react';

interface ProfitLossProps {
    transactions: Transaction[];
    expenses: Expense[];
    currentUser: Stylist | 'OWNER';
}

type TimeRange = 'THIS_MONTH' | 'LAST_MONTH' | 'YTD' | 'LAST_YEAR' | 'ALL_TIME';

const ProfitLoss: React.FC<ProfitLossProps> = ({ transactions, expenses, currentUser }) => {
    const [timeRange, setTimeRange] = useState<TimeRange>('YTD');

    // Filter data based on user and time range
    const filteredData = useMemo(() => {
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth();

        const filterDate = (dateStr: string) => {
            const d = new Date(dateStr);
            const year = d.getFullYear();
            const month = d.getMonth();

            switch (timeRange) {
                case 'THIS_MONTH':
                    return year === currentYear && month === currentMonth;
                case 'LAST_MONTH':
                    // Handle January edge case
                    if (currentMonth === 0) return year === currentYear - 1 && month === 11;
                    return year === currentYear && month === currentMonth - 1;
                case 'YTD':
                    return year === currentYear;
                case 'LAST_YEAR':
                    return year === currentYear - 1;
                case 'ALL_TIME':
                    return true;
                default:
                    return true;
            }
        };

        // 1. Filter by User
        const userTrans = currentUser === 'OWNER' 
            ? transactions 
            : transactions.filter(t => t.stylistId === currentUser.id);
            
        const userExpenses = currentUser === 'OWNER'
            ? expenses
            : expenses.filter(e => e.stylistId === currentUser.id);

        // 2. Filter by Date
        return {
            transactions: userTrans.filter(t => filterDate(t.date)),
            expenses: userExpenses.filter(e => filterDate(e.date))
        };
    }, [transactions, expenses, currentUser, timeRange]);

    // Calculate Financials
    const financials = useMemo(() => {
        const { transactions: txs, expenses: exps } = filteredData;

        let serviceRevenue = 0;
        let productRevenue = 0;
        let tipRevenue = 0;

        txs.forEach(t => {
            serviceRevenue += t.amount;
            tipRevenue += t.tip;
            if (t.products) {
                t.products.forEach(p => {
                    productRevenue += (p.price * p.quantity);
                });
            }
        });

        const totalRevenue = serviceRevenue + productRevenue + tipRevenue;

        // Group Expenses by Category
        const expenseMap: Record<string, number> = {};
        let totalExpenses = 0;

        exps.forEach(e => {
            expenseMap[e.category] = (expenseMap[e.category] || 0) + e.amount;
            totalExpenses += e.amount;
        });

        const netIncome = totalRevenue - totalExpenses;
        const profitMargin = totalRevenue > 0 ? (netIncome / totalRevenue) * 100 : 0;

        return {
            serviceRevenue,
            productRevenue,
            tipRevenue,
            totalRevenue,
            expenseMap,
            totalExpenses,
            netIncome,
            profitMargin
        };
    }, [filteredData]);

    const formatCurrency = (val: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header / Controls */}
            <div className="flex flex-col md:flex-row justify-between items-center bg-white p-6 rounded-xl border border-stone-200 shadow-sm gap-4">
                <div>
                    <h2 className="text-xl font-bold text-stone-900 flex items-center gap-2">
                        <FileText className="w-6 h-6 text-emerald-600" />
                        Profit & Loss Statement
                    </h2>
                    <p className="text-stone-500 text-sm mt-1">Financial performance report</p>
                </div>
                
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 w-4 h-4" />
                        <select 
                            value={timeRange}
                            onChange={(e) => setTimeRange(e.target.value as TimeRange)}
                            className="pl-9 pr-4 py-2 border border-stone-200 rounded-lg text-sm bg-stone-50 font-medium outline-none focus:ring-2 focus:ring-emerald-500"
                        >
                            <option value="THIS_MONTH">This Month</option>
                            <option value="LAST_MONTH">Last Month</option>
                            <option value="YTD">Year to Date</option>
                            <option value="LAST_YEAR">Last Year</option>
                            <option value="ALL_TIME">All Time</option>
                        </select>
                    </div>
                    <button 
                        onClick={() => window.print()}
                        className="p-2 text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-colors print:hidden"
                        title="Print Report"
                    >
                        <Printer className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* High Level Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-emerald-50 rounded-xl p-6 border border-emerald-100">
                    <p className="text-xs font-bold text-emerald-600 uppercase mb-1">Total Revenue</p>
                    <div className="flex justify-between items-end">
                        <h3 className="text-2xl font-bold text-emerald-900">{formatCurrency(financials.totalRevenue)}</h3>
                        <ArrowUpRight className="w-5 h-5 text-emerald-500 mb-1" />
                    </div>
                </div>
                <div className="bg-red-50 rounded-xl p-6 border border-red-100">
                    <p className="text-xs font-bold text-red-600 uppercase mb-1">Total Expenses</p>
                    <div className="flex justify-between items-end">
                        <h3 className="text-2xl font-bold text-red-900">{formatCurrency(financials.totalExpenses)}</h3>
                        <ArrowDownRight className="w-5 h-5 text-red-500 mb-1" />
                    </div>
                </div>
                <div className={`rounded-xl p-6 border ${financials.netIncome >= 0 ? 'bg-stone-900 border-stone-800 text-white' : 'bg-white border-stone-200 text-stone-900'}`}>
                    <p className={`text-xs font-bold uppercase mb-1 ${financials.netIncome >= 0 ? 'text-stone-400' : 'text-stone-500'}`}>Net Income</p>
                    <div className="flex justify-between items-end">
                        <h3 className="text-2xl font-bold">{formatCurrency(financials.netIncome)}</h3>
                        <span className={`text-xs font-medium px-2 py-1 rounded ${financials.netIncome >= 0 ? 'bg-stone-800 text-emerald-400' : 'bg-red-100 text-red-600'}`}>
                            {financials.profitMargin.toFixed(1)}% Margin
                        </span>
                    </div>
                </div>
            </div>

            {/* Detailed Statement */}
            <div className="bg-white rounded-xl shadow-lg border border-stone-200 overflow-hidden print:shadow-none">
                <div className="bg-stone-50 px-8 py-6 border-b border-stone-200 text-center">
                    <h1 className="text-2xl font-serif font-bold text-stone-900">Financial Statement</h1>
                    <p className="text-stone-500 text-sm mt-1">
                        {timeRange === 'YTD' ? 'Year to Date' : timeRange.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                    </p>
                </div>

                <div className="p-8">
                    {/* Revenue Section */}
                    <div className="mb-8">
                        <h4 className="text-sm font-bold text-stone-400 uppercase tracking-widest border-b border-stone-100 pb-2 mb-4">Revenue</h4>
                        <div className="space-y-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-stone-700">Service Sales</span>
                                <span className="font-medium text-stone-900">{formatCurrency(financials.serviceRevenue)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-stone-700">Retail Product Sales</span>
                                <span className="font-medium text-stone-900">{formatCurrency(financials.productRevenue)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-stone-700">Tips & Gratuity</span>
                                <span className="font-medium text-stone-900">{formatCurrency(financials.tipRevenue)}</span>
                            </div>
                            <div className="flex justify-between text-base font-bold pt-3 border-t border-stone-200 mt-2">
                                <span className="text-stone-900">Total Revenue</span>
                                <span className="text-stone-900">{formatCurrency(financials.totalRevenue)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Expense Section */}
                    <div className="mb-8">
                        <h4 className="text-sm font-bold text-stone-400 uppercase tracking-widest border-b border-stone-100 pb-2 mb-4">Operating Expenses</h4>
                        <div className="space-y-3">
                            {Object.entries(financials.expenseMap).length > 0 ? (
                                Object.entries(financials.expenseMap).map(([category, amount]) => (
                                    <div key={category} className="flex justify-between text-sm">
                                        <span className="text-stone-700">{category}</span>
                                        <span className="font-medium text-stone-900">{formatCurrency(amount)}</span>
                                    </div>
                                ))
                            ) : (
                                <div className="text-stone-400 text-sm italic">No expenses recorded for this period.</div>
                            )}
                            
                            <div className="flex justify-between text-base font-bold pt-3 border-t border-stone-200 mt-2">
                                <span className="text-stone-900">Total Expenses</span>
                                <span className="text-red-600">({formatCurrency(financials.totalExpenses)})</span>
                            </div>
                        </div>
                    </div>

                    {/* Net Income Section */}
                    <div className="bg-stone-50 -mx-8 -mb-8 p-8 border-t border-stone-200">
                        <div className="flex justify-between items-center">
                            <div>
                                <h4 className="text-xl font-bold text-stone-900">Net Income</h4>
                                <p className="text-xs text-stone-500">Revenue less Expenses</p>
                            </div>
                            <div className={`text-2xl font-bold ${financials.netIncome >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                {formatCurrency(financials.netIncome)}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfitLoss;