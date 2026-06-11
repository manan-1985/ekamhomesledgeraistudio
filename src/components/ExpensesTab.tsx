import React, { useMemo, useState } from 'react';
import { useData } from '../context/DataContext';
import { Expense, CategoryKey, CATEGORY_CONFIG, formatCurrency, formatDate, todayISO } from '../types';
import { Search, Plus, Trash2, Tag, ChevronDown, ChevronUp, ScrollText, AlertTriangle } from 'lucide-react';

interface ExpensesTabProps {
  selectedMonth: number;
  selectedYear: number;
  onPrevMonth: () => void;
  onNextMonth: () => void;
}

const CATEGORY_KEYS = Object.keys(CATEGORY_CONFIG) as CategoryKey[];

export default function ExpensesTab({
  selectedMonth,
  selectedYear,
  onPrevMonth,
  onNextMonth,
}: ExpensesTabProps) {
  const { expenses, addExpense, deleteExpense, requestConfirm } = useData();

  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<CategoryKey | 'all'>('all');

  // Modal States
  const [showModal, setShowModal] = useState(false);
  const [category, setCategory] = useState<CategoryKey>('groceries');
  const [subCategory, setSubCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(todayISO());
  const [notes, setNotes] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Handle open add modal
  const handleOpenAdd = () => {
    setCategory('groceries');
    setSubCategory('');
    setAmount('');
    setDate(todayISO());
    setNotes('');
    setShowSuggestions(false);
    setErrorMessage('');
    setShowModal(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!subCategory.trim()) {
      return setErrorMessage('Please specify or select a sub-category.');
    }
    if (!amount.trim()) {
      return setErrorMessage('Please enter an amount.');
    }
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) {
      return setErrorMessage('Please enter a valid, positive amount.');
    }

    addExpense({
      category,
      subCategory: subCategory.trim(),
      amount: amt,
      date,
      notes: notes.trim() || undefined,
    });

    setShowModal(false);
  };

  const handleDelete = (exp: Expense) => {
    requestConfirm({
      title: 'Remove Expense Record?',
      message: `Are you sure you want to delete the expense entry: "${exp.subCategory}" for ${formatCurrency(exp.amount)}? This will adjust your ledger outlays accordingly.`,
      confirmText: 'Yes, Delete',
      cancelText: 'Cancel',
      isDestructive: true,
      onConfirm: () => {
        deleteExpense(exp.id);
      }
    });
  };

  // Filter expenses for this month
  const monthExpenses = useMemo(() => {
    return expenses.filter((e) => {
      const d = new Date(e.date);
      return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
    });
  }, [expenses, selectedMonth, selectedYear]);

  // Apply search query and category filters
  const filteredExpenses = useMemo(() => {
    return monthExpenses
      .filter((e) => {
        const matchesSearch =
          e.subCategory.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (e.notes && e.notes.toLowerCase().includes(searchQuery.toLowerCase()));

        const matchesCategory = filterCategory === 'all' || e.category === filterCategory;

        return matchesSearch && matchesCategory;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [monthExpenses, searchQuery, filterCategory]);

  const totalFilteredAmount = useMemo(() => {
    return filteredExpenses.reduce((s, e) => s + e.amount, 0);
  }, [filteredExpenses]);

  const totalMonthlyExpenses = useMemo(() => {
    return monthExpenses.reduce((s, e) => s + e.amount, 0);
  }, [monthExpenses]);

  const suggestions = CATEGORY_CONFIG[category].suggestions;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Month step and statistics */}
      <div className="md:flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs space-y-4 md:space-y-0">
        <div>
          <span className="text-xs font-semibold tracking-wider text-slate-400 uppercase">EXPENSE REGISTER</span>
          <h2 className="text-xl font-bold text-slate-800">Operational Outlays</h2>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 w-full md:w-auto">
          {/* Monthly Total Outlay Badge */}
          <div className="bg-red-50 border border-red-100 p-2.5 px-4 rounded-lg flex items-center justify-between sm:justify-start space-x-3">
            <span className="text-xs text-red-800 font-bold uppercase tracking-wider">MONTH TOTAL:</span>
            <span className="font-extrabold text-red-600 tracking-tight text-lg">
              {formatCurrency(totalMonthlyExpenses)}
            </span>
          </div>

          {/* Month Stepper */}
          <div className="flex items-center space-x-1.5 justify-center">
            <button
              onClick={onPrevMonth}
              className="p-2 rounded-lg bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-600 select-none cursor-pointer"
            >
              ←
            </button>
            <div className="bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-lg text-xs font-bold text-slate-700 min-w-[120px] text-center">
              {selectedYear} - {selectedMonth + 1}
            </div>
            <button
              onClick={onNextMonth}
              className="p-2 rounded-lg bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-600 select-none cursor-pointer"
            >
              →
            </button>
          </div>
        </div>
      </div>

      {/* Primary Filtering and Actions */}
      <div className="space-y-4">
        {/* Actions bar with search */}
        <div className="md:flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs space-y-4 md:space-y-0">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:max-w-xl">
            <div className="relative flex-1">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-slate-400" />
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search sub-categories or notes..."
                className="block w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={handleOpenAdd}
              className="flex items-center justify-center space-x-2 px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg text-sm shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Record Expense</span>
            </button>
          </div>

          <div className="flex flex-wrap gap-1 bg-slate-50 border border-slate-200 p-1 rounded-lg">
            <button
              onClick={() => setFilterCategory('all')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer ${
                filterCategory === 'all' ? 'bg-[#1A5FB4] text-white' : 'text-slate-600'
              }`}
            >
              All Categories
            </button>
            {CATEGORY_KEYS.map((key) => (
              <button
                key={key}
                onClick={() => setFilterCategory(key)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer ${
                  filterCategory === key
                    ? 'bg-[#1A5FB4] text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {CATEGORY_CONFIG[key].label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Expenses List */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/75 border-b border-slate-100 text-slate-400 uppercase font-extrabold text-[10px] tracking-wider">
                <th className="py-4 px-6">Expense Item</th>
                <th className="py-4 px-6 text-center">Category Tag</th>
                <th className="py-4 px-6">Additional Notes</th>
                <th className="py-4 px-6 text-center">Outlay Date</th>
                <th className="py-4 px-6 text-right">Amount Outlay</th>
                <th className="py-4 px-6 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 font-medium">
                    No expense outlays recorded matching this filter.
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((exp) => {
                  const catCfg = CATEGORY_CONFIG[exp.category];
                  return (
                    <tr key={exp.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 px-6 font-bold text-slate-800">{exp.subCategory}</td>
                      <td className="py-4 px-6 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border border-transparent ${catCfg.textClass} ${catCfg.bgClass}`}
                        >
                          {catCfg.label}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-xs text-slate-500 max-w-xs truncate">
                        {exp.notes ? (
                          <span className="flex items-center space-x-1">
                            <ScrollText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{exp.notes}</span>
                          </span>
                        ) : (
                          <span className="text-slate-300 italic">No notes</span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-center text-xs text-slate-500">
                        {formatDate(exp.date)}
                      </td>
                      <td className="py-4 px-6 text-right font-black text-red-600 tracking-tight text-base">
                        {formatCurrency(exp.amount)}
                      </td>
                      <td className="py-4 px-6 text-center">
                        <button
                          onClick={() => handleDelete(exp)}
                          className="p-1 px-2.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-100 rounded-md text-xs font-bold transition-all cursor-pointer inline-flex items-center space-x-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Delete</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info breakdown */}
        {filteredExpenses.length > 0 && (
          <div className="bg-slate-50 px-6 py-4 flex justify-between items-center border-t border-slate-100 text-xs text-slate-500 font-semibold animate-slide-up">
            <span>Showing {filteredExpenses.length} expense records</span>
            <span>
              Total list filter expense amount: <strong className="text-red-700">{formatCurrency(totalFilteredAmount)}</strong>
            </span>
          </div>
        )}
      </div>

      {/* Record Expense Modal dialog */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 shadow-xl relative my-8">
            <h3 className="text-lg font-bold text-slate-800 mb-4 pb-2 border-b border-slate-100">
              Record Operational Expense
            </h3>

            {errorMessage && (
              <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-lg text-xs font-semibold mb-4">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4">
              {/* Category Select Chips Grid */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Outlay Category *
                </label>
                <div className="grid grid-cols-2 xs:grid-cols-3 gap-2">
                  {CATEGORY_KEYS.map((key) => {
                    const cfg = CATEGORY_CONFIG[key];
                    const selected = category === key;
                    const styleObj = selected
                      ? { background: cfg.color, color: '#fff', borderColor: 'transparent' }
                      : { color: cfg.color, borderColor: cfg.color };

                    return (
                      <button
                        type="button"
                        key={key}
                        onClick={() => {
                          setCategory(key);
                          setSubCategory('');
                        }}
                        style={styleObj}
                        className="p-2 border rounded-xl text-center font-bold text-xs transition-all cursor-pointer truncate"
                      >
                        {cfg.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Sub-category selection header */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Expense Item / Sub-category *
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowSuggestions(!showSuggestions)}
                    className="text-xs font-bold text-[#1A5FB4] hover:underline flex items-center space-x-1 cursor-pointer"
                  >
                    <Tag className="w-3.5 h-3.5" />
                    <span>Quick pick</span>
                    {showSuggestions ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>
                </div>

                {/* Suggestions chip row display */}
                {showSuggestions && (
                  <div className="flex flex-wrap gap-1.5 p-3 bg-slate-50 border border-slate-100 rounded-xl mb-2">
                    {suggestions.map((s2) => (
                      <button
                        type="button"
                        key={s2}
                        onClick={() => {
                          setSubCategory(s2);
                          setShowSuggestions(false);
                        }}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                          subCategory === s2
                            ? 'bg-[#1A5FB4] text-white'
                            : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {s2}
                      </button>
                    ))}
                  </div>
                )}

                <input
                  type="text"
                  required
                  value={subCategory}
                  onChange={(e) => setSubCategory(e.target.value)}
                  placeholder="Expense Item / Sub-category"
                  className="w-full px-3 py-2 border border-slate-200 bg-slate-50/50 rounded-lg text-sm focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Amount and date grid */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Amount Paid (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Amount Paid"
                    className="w-full px-3 py-2 border border-slate-200 bg-white rounded-lg text-sm focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Expense Date
                  </label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 bg-white rounded-lg text-sm h-[38px] focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Additional notes */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Additional Notes (optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Additional Notes"
                  className="w-full px-3 py-2 border border-slate-200 bg-slate-50/50 rounded-lg text-sm h-16 resize-none focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Submit / Cancel Buttons */}
              <div className="flex space-x-2 justify-end pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 rounded-lg text-sm font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-bold shadow-xs cursor-pointer"
                >
                  Save Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
