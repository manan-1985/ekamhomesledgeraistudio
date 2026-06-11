import React, { useMemo, useState } from 'react';
import { useData } from '../context/DataContext';
import { Resident, RentCategory, RENT_CATEGORY_CONFIG, formatCurrency, todayISO } from '../types';
import { Search, Plus, Phone, Trash2, Edit2, CheckCircle2, XCircle, Info } from 'lucide-react';

const DUE_DAYS = [1, 2, 3, 5, 7, 10, 15, 20, 25, 28];
const RENT_CATEGORIES: RentCategory[] = ['monthly', 'yearly', 'part_payment'];
const INSTALLMENT_OPTIONS = [2, 3, 4, 6, 12];

function computeMonthlyEquivalent(
  category: RentCategory,
  monthly: string,
  yearly: string,
  partAmt: string,
  partCount: number,
): number | null {
  if (category === 'monthly') {
    const v = parseFloat(monthly);
    return isNaN(v) || v <= 0 ? null : v;
  }
  if (category === 'yearly') {
    const v = parseFloat(yearly);
    return isNaN(v) || v <= 0 ? null : Math.round(v / 12);
  }
  if (category === 'part_payment') {
    const v = parseFloat(partAmt);
    return isNaN(v) || v <= 0 ? null : Math.round((v * partCount) / 12);
  }
  return null;
}

export default function ResidentsTab() {
  const { residents, addResident, updateResident, deleteResident, requestConfirm } = useData();

  // Search and Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('active');

  // Form Modal States
  const [showModal, setShowModal] = useState(false);
  const [editingResident, setEditingResident] = useState<Resident | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [room, setRoom] = useState('');
  const [phone, setPhone] = useState('');
  const [rentCategory, setRentCategory] = useState<RentCategory>('monthly');
  const [monthlyAmt, setMonthlyAmt] = useState('');
  const [yearlyAmt, setYearlyAmt] = useState('');
  const [partAmt, setPartAmt] = useState('');
  const [partCount, setPartCount] = useState(2);
  const [rentDueDay, setRentDueDay] = useState(1);
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Open modal for add
  const handleOpenAdd = () => {
    setEditingResident(null);
    setName('');
    setRoom('');
    setPhone('');
    setRentCategory('monthly');
    setMonthlyAmt('');
    setYearlyAmt('');
    setPartAmt('');
    setPartCount(2);
    setRentDueDay(1);
    setReminderEnabled(false);
    setErrorMessage('');
    setShowModal(true);
  };

  // Open modal for edit
  const handleOpenEdit = (res: Resident) => {
    setEditingResident(res);
    setName(res.name);
    setRoom(res.roomNumber);
    setPhone(res.phone ?? '');
    setRentCategory(res.rentCategory);
    setMonthlyAmt(res.rentCategory === 'monthly' ? res.monthlyRent.toString() : '');
    setYearlyAmt(res.yearlyRent?.toString() ?? '');
    setPartAmt(res.partPaymentAmount?.toString() ?? '');
    setPartCount(res.partPaymentCount ?? 2);
    setRentDueDay(res.rentDueDay ?? 1);
    setReminderEnabled(res.reminderEnabled ?? false);
    setErrorMessage('');
    setShowModal(true);
  };

  // Compute monthly equivalent on the fly
  const monthlyEquivalent = useMemo(() => {
    return computeMonthlyEquivalent(rentCategory, monthlyAmt, yearlyAmt, partAmt, partCount);
  }, [rentCategory, monthlyAmt, yearlyAmt, partAmt, partCount]);

  // Handle Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!name.trim()) return setErrorMessage('Full Name is required.');
    if (!room.trim()) return setErrorMessage('Room Number is required.');

    if (monthlyEquivalent === null) {
      return setErrorMessage('Please enter a valid, positive rent amount.');
    }

    const data: Omit<Resident, 'id'> = {
      name: name.trim(),
      roomNumber: room.trim(),
      phone: phone.trim() || undefined,
      rentCategory,
      monthlyRent: monthlyEquivalent,
      yearlyRent: rentCategory === 'yearly' ? parseFloat(yearlyAmt) : undefined,
      partPaymentAmount: rentCategory === 'part_payment' ? parseFloat(partAmt) : undefined,
      partPaymentCount: rentCategory === 'part_payment' ? partCount : undefined,
      active: editingResident ? editingResident.active : true, // Preserve or defaults to true
      joinDate: editingResident ? editingResident.joinDate : todayISO(),
      rentDueDay,
      reminderEnabled,
    };

    try {
      if (editingResident) {
        await updateResident(editingResident.id, data);
      } else {
        await addResident(data);
      }
      setShowModal(false);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to preserve resident records.');
    }
  };

  // Toggle resident status
  const toggleStatus = (res: Resident) => {
    requestConfirm({
      title: 'Change Tenant Status?',
      message: `Are you sure you want to change ${res.name}'s status to ${res.active ? 'Checked-out' : 'Active'}?`,
      confirmText: 'Yes, Change',
      cancelText: 'Cancel',
      onConfirm: async () => {
        await updateResident(res.id, { active: !res.active });
      }
    });
  };

  // Delete resident
  const handleDelete = (res: Resident) => {
    requestConfirm({
      title: 'Delete Tenant Permanently?',
      message: `Are you absolutely sure you want to delete ${res.name}? This will purge their rent mappings and history. This action cannot be undone.`,
      confirmText: 'Yes, Delete',
      cancelText: 'Cancel',
      isDestructive: true,
      onConfirm: async () => {
        await deleteResident(res.id);
      }
    });
  };

  // Search filter implementation
  const filteredResidents = useMemo(() => {
    return residents
      .filter((r) => {
        const matchesSearch =
          r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.roomNumber.toLowerCase().includes(searchQuery.toLowerCase());

        if (statusFilter === 'active') return matchesSearch && r.active;
        if (statusFilter === 'inactive') return matchesSearch && !r.active;
        return matchesSearch;
      })
      .sort((a, b) => a.roomNumber.localeCompare(b.roomNumber, undefined, { numeric: true }));
  }, [residents, searchQuery, statusFilter]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Search and Action Bar */}
      <div className="md:flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs space-y-4 md:space-y-0">
        {/* Left: Filter Buttons & Search input */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:max-w-xl">
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400" />
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or room..."
              className="block w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center space-x-1 bg-slate-50 border border-slate-200 p-1 rounded-lg">
            <button
              onClick={() => setStatusFilter('active')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold select-none cursor-pointer ${
                statusFilter === 'active'
                  ? 'bg-[#1A5FB4] text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Occupying
            </button>
            <button
              onClick={() => setStatusFilter('inactive')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold select-none cursor-pointer ${
                statusFilter === 'inactive'
                  ? 'bg-[#1A5FB4] text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Checked Out
            </button>
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold select-none cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-[#1A5FB4] text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Registers
            </button>
          </div>
        </div>

        {/* Right: Add Button */}
        <button
          onClick={handleOpenAdd}
          className="flex items-center justify-center space-x-2 w-full md:w-auto px-5 py-2 bg-[#1A5FB4] hover:bg-blue-700 text-white font-bold rounded-lg text-sm shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Tenant</span>
        </button>
      </div>

      {/* Residents Grid */}
      {filteredResidents.length === 0 ? (
        <div className="bg-white rounded-xl p-12 border border-slate-200/80 shadow-xs text-center">
          <p className="text-slate-400 font-medium">No records found matching the criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredResidents.map((res) => {
            const catCfg = RENT_CATEGORY_CONFIG[res.rentCategory];
            return (
              <div
                key={res.id}
                className="bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-xs transition-all flex flex-col justify-between"
              >
                {/* Upper Body */}
                <div className="p-5 space-y-4">
                  {/* Avatar row */}
                  <div className="flex justify-between items-start">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center font-bold text-slate-600">
                        R{res.roomNumber}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800 text-base leading-tight">{res.name}</h4>
                        <span className="text-xs text-slate-400">Join Date: {res.joinDate}</span>
                      </div>
                    </div>

                    <span
                      className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                        res.active
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                          : 'bg-slate-100 text-slate-500 border border-slate-200'
                      }`}
                    >
                      {res.active ? 'Occupying' : 'Checked Out'}
                    </span>
                  </div>

                  {/* Financial Structures */}
                  <div className="space-y-2 pt-1 border-t border-slate-100">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400">Rent Structure</span>
                      <span className={`px-2 py-0.5 rounded-full font-bold ${catCfg.textClass} ${catCfg.bgClass}`}>
                        {catCfg.label}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400">Computed Rent</span>
                      <span className="font-extrabold text-slate-700 tracking-tight">
                        {formatCurrency(res.monthlyRent)}/mo
                      </span>
                    </div>

                    {res.yearlyRent && (
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400">Yearly Ledger</span>
                        <span className="font-semibold text-slate-600">
                          {formatCurrency(res.yearlyRent)}/year
                        </span>
                      </div>
                    )}

                    {res.partPaymentAmount && (
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400">Installments</span>
                        <span className="font-semibold text-slate-600">
                          {res.partPaymentCount} x {formatCurrency(res.partPaymentAmount)}
                        </span>
                      </div>
                    )}

                    {res.rentDueDay && (
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400">Scheduled Due Day</span>
                        <span className="font-bold text-[#1A5FB4] bg-blue-50 px-2 py-0.5 rounded-md">
                          {res.rentDueDay}th of month
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Contact Number */}
                  {res.phone && (
                    <div className="flex items-center space-x-2 text-xs text-slate-500 bg-slate-50 p-2 rounded-lg">
                      <Phone className="w-3.5 h-3.5" />
                      <span>{res.phone}</span>
                    </div>
                  )}
                </div>

                {/* Operations footer */}
                <div className="bg-slate-50 px-5 py-3 rounded-b-2xl border-t border-slate-100 flex justify-between items-center">
                  <button
                    onClick={() => toggleStatus(res)}
                    className="flex items-center space-x-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
                  >
                    {res.active ? (
                      <>
                        <XCircle className="w-3.5 h-3.5 text-red-500 animate-pulse" />
                        <span>Check-out</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Re-Check-in</span>
                      </>
                    )}
                  </button>

                  <div className="flex space-x-1">
                    <button
                      onClick={() => handleOpenEdit(res)}
                      className="p-1 px-2.5 bg-white border border-slate-200 text-slate-600 hover:text-slate-800 rounded-md text-xs font-semibold flex items-center space-x-1 cursor-pointer"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => handleDelete(res)}
                      className="p-1.5 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 rounded-md cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* dialog view */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-lg w-full p-6 shadow-xl relative my-8 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-slate-800 mb-4 pb-2 border-b border-slate-100">
              {editingResident ? 'Edit Resident Profile' : 'Add New Resident Profile'}
            </h3>

            {errorMessage && (
              <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-lg text-xs font-semibold mb-4">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Full Name"
                  className="w-full px-3 py-2 border border-slate-200 bg-slate-50/50 rounded-lg text-sm focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Room & Phone Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Room Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={room}
                    onChange={(e) => setRoom(e.target.value)}
                    placeholder="Room Number"
                    className="w-full px-3 py-2 border border-slate-200 bg-slate-50/50 rounded-lg text-sm focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Phone (optional)
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Phone Number"
                    className="w-full px-3 py-2 border border-slate-200 bg-slate-50/50 rounded-lg text-sm focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="border-t border-dashed border-slate-200 my-4" />

              {/* Rent Category Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Payment Category
                </label>
                <div className="grid grid-cols-1 gap-2.5">
                  {RENT_CATEGORIES.map((cat) => {
                    const cfg = RENT_CATEGORY_CONFIG[cat];
                    const selected = rentCategory === cat;
                    return (
                      <button
                        type="button"
                        key={cat}
                        onClick={() => setRentCategory(cat)}
                        className={`text-left p-3 rounded-xl border transition-all cursor-pointer flex justify-between items-center ${
                          selected
                            ? 'border-blue-500 bg-blue-50/20 shadow-xs'
                            : 'border-slate-200 bg-slate-50/30'
                        }`}
                      >
                        <div>
                          <p className={`font-bold text-sm ${selected ? 'text-[#1A5FB4]' : 'text-slate-700'}`}>
                            {cfg.label}
                          </p>
                          <p className="text-xs text-slate-400">{cfg.description}</p>
                        </div>
                        {selected && (
                          <span className="w-5 h-5 bg-[#1A5FB4] text-white rounded-full flex items-center justify-center text-[10px] font-bold">
                            ✓
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Dynamic Rent Amount Fields */}
              <div className="space-y-3 bg-slate-50/70 p-4 rounded-xl border border-slate-200/60 shadow-xs">
                {rentCategory === 'monthly' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">
                      Monthly Rent Amount (₹) *
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={monthlyAmt}
                      onChange={(e) => setMonthlyAmt(e.target.value)}
                      placeholder="Rent Amount"
                      className="w-full px-3 py-2 border border-slate-200 bg-white rounded-lg text-sm"
                    />
                  </div>
                )}

                {rentCategory === 'yearly' && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">
                        Total Yearly Rent Amount (₹) *
                      </label>
                      <input
                        type="number"
                        required
                        min="1"
                        value={yearlyAmt}
                        onChange={(e) => setYearlyAmt(e.target.value)}
                        placeholder="Total Yearly Rent"
                        className="w-full px-3 py-2 border border-slate-200 bg-white rounded-lg text-sm"
                      />
                    </div>
                    {monthlyEquivalent !== null && (
                      <div className="flex items-center space-x-2 text-xs text-cyan-700 bg-cyan-50 border border-cyan-100 p-2.5 rounded-lg font-medium">
                        <Info className="w-4 h-4 shrink-0" />
                        <span>Monthly equivalent: {formatCurrency(monthlyEquivalent)}/month</span>
                      </div>
                    )}
                  </div>
                )}

                {rentCategory === 'part_payment' && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">
                          Installment Amount (₹) *
                        </label>
                        <input
                          type="number"
                          required
                          min="1"
                          value={partAmt}
                          onChange={(e) => setPartAmt(e.target.value)}
                          placeholder="Installment Amount"
                          className="w-full px-3 py-2 border border-slate-200 bg-white rounded-lg text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">
                          Number of Installments *
                        </label>
                        <select
                          value={partCount}
                          onChange={(e) => setPartCount(parseInt(e.target.value))}
                          className="w-full px-3 py-2 border border-slate-200 bg-white rounded-lg text-sm h-[38px]"
                        >
                          {INSTALLMENT_OPTIONS.map((num) => (
                            <option key={num} value={num}>
                              {num} Payments
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    {monthlyEquivalent !== null && (
                      <div className="flex items-center space-x-2 text-xs text-purple-700 bg-purple-50 border border-purple-100 p-2.5 rounded-lg font-medium">
                        <Info className="w-4 h-4 shrink-0" />
                        <span>
                          Monthly equivalent ({partCount} installments): {formatCurrency(monthlyEquivalent)}/mo
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Bill days & reminder toggles */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">
                      Billing Due Day
                    </label>
                    <select
                      value={rentDueDay}
                      onChange={(e) => setRentDueDay(parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-slate-200 bg-white rounded-lg text-sm h-[38px]"
                    >
                      {DUE_DAYS.map((day) => (
                        <option key={day} value={day}>
                          {day}th of month
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center space-x-2 h-[38px] mt-6 select-none">
                    <input
                      type="checkbox"
                      id="reminder"
                      checked={reminderEnabled}
                      onChange={(e) => setReminderEnabled(e.target.checked)}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer w-4 h-4"
                    />
                    <label htmlFor="reminder" className="text-xs font-semibold text-slate-600 cursor-pointer">
                      Enable rent due reminders
                    </label>
                  </div>
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
                  className="px-5 py-2 bg-[#1A5FB4] hover:bg-blue-700 text-white rounded-lg text-sm font-bold shadow-xs cursor-pointer"
                >
                  {editingResident ? 'Update Tenant' : 'Register Tenant'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
