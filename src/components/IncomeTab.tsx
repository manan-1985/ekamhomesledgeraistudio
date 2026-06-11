import React, { useMemo, useState } from 'react';
import { useData } from '../context/DataContext';
import { Payment, PaymentType, PAYMENT_TYPE_CONFIG, formatCurrency, formatDate, todayISO } from '../types';
import { Search, Plus, Trash2, Calendar, UserCheck, HelpCircle } from 'lucide-react';

interface IncomeTabProps {
  selectedMonth: number;
  selectedYear: number;
  onPrevMonth: () => void;
  onNextMonth: () => void;
}

const PAYMENT_TYPES: PaymentType[] = ['monthly', 'installment', 'part_payment', 'one_time'];

export default function IncomeTab({
  selectedMonth,
  selectedYear,
  onPrevMonth,
  onNextMonth,
}: IncomeTabProps) {
  const { payments, residents, addPayment, deletePayment, requestConfirm } = useData();

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<PaymentType | 'all'>('all');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [selectedResidentId, setSelectedResidentId] = useState<string>('');
  const [paymentType, setPaymentType] = useState<PaymentType>('monthly');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(todayISO());
  const [errorMessage, setErrorMessage] = useState('');

  // Handle resident pick from dropdown
  const handleResidentChange = (resId: string) => {
    setSelectedResidentId(resId);
    if (resId) {
      const resObj = residents.find((r) => r.id === resId);
      if (resObj) {
        setAmount(resObj.monthlyRent.toString());
      }
    } else {
      setAmount('');
    }
  };

  // Open Modal
  const handleOpenAdd = () => {
    setSelectedResidentId('');
    setPaymentType('monthly');
    setDescription('');
    setAmount('');
    setDate(todayISO());
    setErrorMessage('');
    setShowModal(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!amount.trim()) {
      return setErrorMessage('Please enter an amount.');
    }
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) {
      return setErrorMessage('Please enter a valid, positive amount.');
    }

    const selectedResident = residents.find((r) => r.id === selectedResidentId);
    let desc = '';
    if (selectedResident) {
      const typeLabel = PAYMENT_TYPE_CONFIG[paymentType].label;
      desc = `${selectedResident.name} — ${typeLabel} (Room ${selectedResident.roomNumber})`;
    } else {
      desc = description.trim() || 'Other Income';
    }

    addPayment({
      type: selectedResidentId ? 'resident' : 'other',
      paymentType: selectedResidentId ? paymentType : undefined,
      residentId: selectedResidentId || undefined,
      description: desc,
      amount: amt,
      date,
    });

    setShowModal(false);
  };

  const handleDelete = (pay: Payment) => {
    requestConfirm({
      title: 'Remove Payment Log?',
      message: `Are you sure you want to delete the payment record: "${pay.description}" for ${formatCurrency(pay.amount)}? This will adjust your ledger computations accordingly.`,
      confirmText: 'Yes, Delete',
      cancelText: 'Cancel',
      isDestructive: true,
      onConfirm: () => {
        deletePayment(pay.id);
      }
    });
  };

  // Filter payments for selected month
  const monthPayments = useMemo(() => {
    return payments.filter((p) => {
      const d = new Date(p.date);
      return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
    });
  }, [payments, selectedMonth, selectedYear]);

  // Apply search query and category filters
  const filteredPayments = useMemo(() => {
    return monthPayments
      .filter((p) => {
        const matchesSearch = p.description.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesType = filterType === 'all' || p.paymentType === filterType;
        return matchesSearch && matchesType;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [monthPayments, searchQuery, filterType]);

  const totalFilteredAmount = useMemo(() => {
    return filteredPayments.reduce((s, p) => s + p.amount, 0);
  }, [filteredPayments]);

  const totalMonthlyIncome = useMemo(() => {
    return monthPayments.reduce((s, p) => s + p.amount, 0);
  }, [monthPayments]);

  // List of active residents for logging
  const activeResidents = useMemo(() => {
    return residents.filter((r) => r.active);
  }, [residents]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Month context and total banner */}
      <div className="md:flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs space-y-4 md:space-y-0">
        <div>
          <span className="text-xs font-semibold tracking-wider text-slate-400 uppercase">INCOME LOGS</span>
          <h2 className="text-xl font-bold text-slate-800">Rent & Revenue collections</h2>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 w-full md:w-auto">
          {/* Monthly Total Display badge */}
          <div className="bg-emerald-50 border border-emerald-100 p-2.5 px-4 rounded-lg flex items-center justify-between sm:justify-start space-x-3">
            <span className="text-xs text-emerald-800 font-bold uppercase tracking-wider">MONTH TOTAL:</span>
            <span className="font-extrabold text-emerald-600 tracking-tight text-lg">
              {formatCurrency(totalMonthlyIncome)}
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

      {/* Inputs and filters row */}
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
              placeholder="Search collected receipts..."
              className="block w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center space-x-1 bg-slate-50 border border-slate-200 p-1 rounded-lg">
            <button
              onClick={() => setFilterType('all')}
              className={`px-2.5 py-1.5 rounded-md text-xs font-semibold cursor-pointer ${
                filterType === 'all' ? 'bg-[#1A5FB4] text-white' : 'text-slate-600'
              }`}
            >
              All Types
            </button>
            {PAYMENT_TYPES.map((pt) => (
              <button
                key={pt}
                onClick={() => setFilterType(pt)}
                className={`px-2.5 py-1.5 rounded-md text-xs font-semibold cursor-pointer whitespace-nowrap ${
                  filterType === pt ? 'bg-[#1A5FB4] text-white' : 'text-slate-600'
                }`}
              >
                {PAYMENT_TYPE_CONFIG[pt].label}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center justify-center space-x-2 w-full md:w-auto px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-sm shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Collect Rent / Revenue</span>
        </button>
      </div>

      {/* Receipts Table Ledger */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/75 border-b border-slate-100 text-slate-400 uppercase font-extrabold text-[10px] tracking-wider">
                <th className="py-4 px-6">Description</th>
                <th className="py-4 px-6 text-center">Type Classification</th>
                <th className="py-4 px-6 text-center">Receipt Date</th>
                <th className="py-4 px-6 text-right">Collection Amount</th>
                <th className="py-4 px-6 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400 font-medium">
                    No transactions recorded for the category in this period.
                  </td>
                </tr>
              ) : (
                filteredPayments.map((pay) => {
                  const typeCfg = pay.paymentType ? PAYMENT_TYPE_CONFIG[pay.paymentType] : null;
                  return (
                    <tr key={pay.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 px-6 font-semibold text-slate-800">
                        <div className="flex items-center space-x-2.5">
                          {pay.residentId ? (
                            <UserCheck className="w-4 h-4 text-blue-500 shrink-0" />
                          ) : (
                            <HelpCircle className="w-4 h-4 text-slate-400 shrink-0" />
                          )}
                          <span>{pay.description}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-center">
                        {typeCfg ? (
                          <span
                            className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide border"
                            style={{
                              color: typeCfg.color,
                              background: typeCfg.bgColor,
                              borderColor: 'transparent',
                            }}
                          >
                            {typeCfg.label}
                          </span>
                        ) : (
                          <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-slate-100 text-slate-500 border border-slate-100">
                            General Rev
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-center text-xs text-slate-500">
                        {formatDate(pay.date)}
                      </td>
                      <td className="py-4 px-6 text-right font-extrabold text-emerald-600 tracking-tight text-base">
                        {formatCurrency(pay.amount)}
                      </td>
                      <td className="py-4 px-6 text-center">
                        <button
                          onClick={() => handleDelete(pay)}
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

        {/* Footer Summary Info */}
        {filteredPayments.length > 0 && (
          <div className="bg-slate-50 px-6 py-4 flex justify-between items-center border-t border-slate-100 text-xs text-slate-500 font-semibold">
            <span>Showing {filteredPayments.length} collection records</span>
            <span>
              Total list filter collection amount: <strong className="text-emerald-700">{formatCurrency(totalFilteredAmount)}</strong>
            </span>
          </div>
        )}
      </div>

      {/* Collect Rent Modal dialog */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 shadow-xl relative my-8">
            <h3 className="text-lg font-bold text-slate-800 mb-4 pb-2 border-b border-slate-100">
              Collect Rent & Ledger Income
            </h3>

            {errorMessage && (
              <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-lg text-xs font-semibold mb-4">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4">
              {/* Resident selector */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Tenant/Resident payor
                </label>
                <select
                  value={selectedResidentId}
                  onChange={(e) => handleResidentChange(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 bg-slate-50/50 rounded-lg text-sm h-[38px]"
                >
                  <option value="">None (Other / Miscellaneous Income)</option>
                  {activeResidents.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} (Room {r.roomNumber}) — Monthly Rent: {formatCurrency(r.monthlyRent)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Payment Type selection (Appears if Resident Selected) */}
              {selectedResidentId && (
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Payment Classification
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {PAYMENT_TYPES.map((pt) => {
                      const cfg = PAYMENT_TYPE_CONFIG[pt];
                      const selected = paymentType === pt;
                      return (
                        <button
                          type="button"
                          key={pt}
                          onClick={() => setPaymentType(pt)}
                          className={`p-2.5 rounded-lg border text-xs font-bold transition-all cursor-pointer text-center ${
                            selected ? 'border-blue-500 bg-blue-50 text-[#1A5FB4]' : 'border-slate-200 bg-white'
                          }`}
                        >
                          {cfg.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Description Input (Appears if NOT associated with Resident) */}
              {!selectedResidentId && (
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Revenue Description *
                  </label>
                  <input
                    type="text"
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Revenue Description"
                    className="w-full px-3 py-2 border border-slate-200 bg-slate-50/50 rounded-lg text-sm focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              )}

              {/* Amount and date row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Amount Collected (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Amount Collected"
                    className="w-full px-3 py-2 border border-slate-200 bg-white rounded-lg text-sm focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Collection Date
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
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-bold shadow-xs cursor-pointer"
                >
                  Record Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
