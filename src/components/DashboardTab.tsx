import React, { useMemo } from 'react';
import { useData } from '../context/DataContext';
import { MONTHS, formatCurrency, formatDate } from '../types';
import { ArrowDownCircle, ArrowUpCircle, Wallet, Inbox, ArrowDown, ArrowUp, Calendar } from 'lucide-react';

interface DashboardTabProps {
  selectedMonth: number;
  selectedYear: number;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onTabChange: (tab: string) => void;
}

export default function DashboardTab({
  selectedMonth,
  selectedYear,
  onPrevMonth,
  onNextMonth,
  onTabChange,
}: DashboardTabProps) {
  const { payments, expenses, residents } = useData();

  // Filter payments for this month
  const monthPayments = useMemo(() => {
    return payments.filter((p) => {
      const d = new Date(p.date);
      return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
    });
  }, [payments, selectedMonth, selectedYear]);

  // Filter expenses for this month
  const monthExpenses = useMemo(() => {
    return expenses.filter((e) => {
      const d = new Date(e.date);
      return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
    });
  }, [expenses, selectedMonth, selectedYear]);

  // Calculations
  const totalIncome = useMemo(() => {
    return monthPayments.reduce((sum, p) => sum + p.amount, 0);
  }, [monthPayments]);

  const totalExpenses = useMemo(() => {
    return monthExpenses.reduce((sum, e) => sum + e.amount, 0);
  }, [monthExpenses]);

  const balance = totalIncome - totalExpenses;
  const activeResidentsCount = useMemo(() => {
    return residents.filter((r) => r.active).length;
  }, [residents]);

  const recentActivity = useMemo(() => {
    const inc = monthPayments.map((p) => ({
      id: p.id,
      label: p.description,
      amount: p.amount,
      date: p.date,
      type: 'income' as const,
    }));
    const exp = monthExpenses.map((e) => ({
      id: e.id,
      label: `${e.subCategory}${e.notes ? ` (${e.notes})` : ''}`,
      amount: e.amount,
      date: e.date,
      type: 'expense' as const,
    }));
    return [...inc, ...exp]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10);
  }, [monthPayments, monthExpenses]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Header Row with Month Navigation */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs gap-4">
        <div>
          <span className="text-xs font-bold tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 uppercase">EKAM HOMES DOON</span>
          <h2 className="text-xl font-bold text-slate-800 mt-1">Financial Terminal</h2>
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <button
            onClick={onPrevMonth}
            className="flex items-center justify-center p-2 rounded-lg bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-colors text-slate-600 focus:outline-hidden cursor-pointer"
          >
            ←
          </button>
          <div className="flex items-center justify-center space-x-2 bg-slate-50 border border-slate-200 px-4 py-2 rounded-lg min-w-[200px] text-center">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span className="text-sm font-semibold text-slate-700">
              {MONTHS[selectedMonth]} {selectedYear}
            </span>
          </div>
          <button
            onClick={onNextMonth}
            className="flex items-center justify-center p-2 rounded-lg bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-colors text-slate-600 focus:outline-hidden cursor-pointer"
          >
            →
          </button>
        </div>
      </div>

      {/* Summary Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Income Card */}
        <div className="bg-white p-6 rounded-2xl border border-emerald-100/80 shadow-xs relative overflow-hidden group">
          <div className="absolute right-0 top-0 w-24 h-24 bg-emerald-500/5 rounded-bl-full transition-transform group-hover:scale-110" />
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-slate-400">Monthly Income</span>
            <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
              <ArrowDownCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-bold tracking-tight text-emerald-600">{formatCurrency(totalIncome)}</p>
            <p className="text-xs text-slate-400">Total rent and general receipts</p>
          </div>
        </div>

        {/* Expenses Card */}
        <div className="bg-white p-6 rounded-2xl border border-red-100/80 shadow-xs relative overflow-hidden group">
          <div className="absolute right-0 top-0 w-24 h-24 bg-red-500/5 rounded-bl-full transition-transform group-hover:scale-110" />
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-slate-400">Monthly Expenses</span>
            <div className="p-2 bg-red-50 rounded-lg text-red-600">
              <ArrowUpCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-bold tracking-tight text-red-600">{formatCurrency(totalExpenses)}</p>
            <p className="text-xs text-slate-400">Salaries, utilities, maintenance</p>
          </div>
        </div>

        {/* Net Balance Card */}
        <div className={`p-6 rounded-2xl relative overflow-hidden text-white shadow-md transition-all ${
          balance >= 0 ? 'bg-[#1A5FB4]' : 'bg-red-600'
        }`}>
          <div className="absolute right-0 top-0 w-24 h-24 bg-white/10 rounded-bl-full" />
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium opacity-80">Net Balance</span>
            <div className="p-2 bg-white/15 rounded-lg text-white">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-black tracking-tight">{formatCurrency(balance)}</p>
            <p className="text-xs opacity-85">
              {balance >= 0 ? 'Surplus for the month' : 'Deficit for the month'}
            </p>
          </div>
        </div>
      </div>

      {/* Grid of details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent timeline - 2/3 width */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col h-[520px]">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="font-bold text-slate-800 text-lg">Recent Ledger Transactions</h3>
              <p className="text-xs text-slate-400">Up to 10 latest entries for {MONTHS[selectedMonth]}</p>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => onTabChange('income')}
                className="text-xs font-semibold text-[#1A5FB4] hover:underline bg-blue-50 px-3 py-1 rounded-lg cursor-pointer"
              >
                + Rent/Income
              </button>
              <button
                onClick={() => onTabChange('expenses')}
                className="text-xs font-semibold text-red-600 hover:underline bg-red-50 px-3 py-1 rounded-lg cursor-pointer"
              >
                + Expense
              </button>
            </div>
          </div>

          <div className="overflow-y-auto flex-1 pr-1 space-y-3 scrollbar-sm">
            {recentActivity.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full py-12 text-slate-400 space-y-3">
                <Inbox className="w-12 h-12 text-slate-300" />
                <p className="text-sm">No recorded transactions for this month yet.</p>
              </div>
            ) : (
              recentActivity.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3.5 bg-slate-50/50 hover:bg-slate-50 rounded-xl border border-slate-100 transition-colors"
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <div
                      className={`p-2.5 rounded-xl flex items-center justify-center shrink-0 ${
                        item.type === 'income' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                      }`}
                    >
                      {item.type === 'income' ? (
                        <ArrowDown className="w-4 h-4" />
                      ) : (
                        <ArrowUp className="w-4 h-4" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-700 text-sm truncate">{item.label}</p>
                      <p className="text-xs text-slate-400">{formatDate(item.date)}</p>
                    </div>
                  </div>

                  <div className="ml-4 shrink-0 text-right">
                    <p
                      className={`font-bold text-sm tracking-tight ${
                        item.type === 'income' ? 'text-emerald-600' : 'text-red-600'
                      }`}
                    >
                      {item.type === 'income' ? '+' : '-'} {formatCurrency(item.amount)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Stats Summary - 1/3 width */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs h-[520px] flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-800 text-lg mb-1">Ekam Homes Status</h3>
            <p className="text-xs text-slate-400 mb-6">Real-time room occupancy and operations</p>

            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex justify-between items-center">
                <div>
                  <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">Occupancy</span>
                  <p className="text-xl font-extrabold text-slate-800">{activeResidentsCount} Active</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold text-slate-500">
                    Total: {residents.length} records
                  </p>
                  <p className="text-xs text-slate-400">
                    Inactive: {residents.length - activeResidentsCount}
                  </p>
                </div>
              </div>

              {/* Business Tips */}
              <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100 space-y-2">
                <span className="text-xs font-bold text-[#1A5FB4] uppercase tracking-wider">LEDGER DICTIONARY</span>
                <p className="text-xs text-blue-700 leading-relaxed font-medium">
                  <strong>Rent collection counts, structures, & schedules</strong> are directly matched with the residents' config details.
                </p>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Go to the <strong>Reports</strong> tab to review outstanding dues, visual rent-category ratios, and pending maintenance balances.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2 mt-6">
            <button
              onClick={() => onTabChange('residents')}
              className="w-full text-center py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold text-xs transition-colors cursor-pointer"
            >
              Manage Tenant Register
            </button>
            <button
              onClick={() => onTabChange('reports')}
              className="w-full text-center py-2.5 bg-[#1F4068] hover:bg-[#162E4B] text-white rounded-xl font-bold text-xs transition-colors cursor-pointer"
            >
              Analyze Financial Reports
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
