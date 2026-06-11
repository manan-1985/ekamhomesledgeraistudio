import React, { useMemo, useState } from 'react';
import { useData } from '../context/DataContext';
import { CATEGORY_CONFIG, CategoryKey, MONTHS, PAYMENT_TYPE_CONFIG, RENT_CATEGORY_CONFIG, Resident, formatCurrency } from '../types';
import { ArrowDownCircle, ArrowUpCircle, Check, AlertCircle, Sparkles, ChevronDown, ChevronUp, User, Coins, FileSpreadsheet, Download } from 'lucide-react';

interface ReportsTabProps {
  selectedMonth: number;
  selectedYear: number;
  onPrevMonth: () => void;
  onNextMonth: () => void;
}

interface ResidentDue {
  resident: Resident;
  totalRent: number;
  totalPaid: number;
  outstanding: number;
  percentPaid: number;
  nextDueDate: Date | null;
  daysLeft: number | null;
  period: string;
}

function getNextDueDate(rentDueDay: number): Date {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const candidate = new Date(today.getFullYear(), today.getMonth(), rentDueDay);
  if (candidate >= today) return candidate;
  return new Date(today.getFullYear(), today.getMonth() + 1, rentDueDay);
}

function daysUntil(date: Date): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function formatDueDate(date: Date): string {
  const d = date.getDate().toString().padStart(2, '0');
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  const y = date.getFullYear();
  return `${d}/${m}/${y}`;
}

function formatDateStr(dateStr: string): string {
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}

const CATEGORY_KEYS = Object.keys(CATEGORY_CONFIG) as CategoryKey[];

export default function ReportsTab({
  selectedMonth,
  selectedYear,
  onPrevMonth,
  onNextMonth,
}: ReportsTabProps) {
  const { payments, expenses, residents } = useData();

  const [expandedResidentId, setExpandedResidentId] = useState<string | null>(null);

  const [exportTimeline, setExportTimeline] = useState<'month' | 'year' | 'all' | 'custom'>('month');
  const [customStartDate, setCustomStartDate] = useState(() => {
    const d = new Date();
    d.setDate(1); // Default to start of current month
    return d.toISOString().split('T')[0];
  });
  const [customEndDate, setCustomEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0]; // Default to today
  });

  const handleDownloadCSV = () => {
    let startDateStr = '';
    let endDateStr = '';
    let timelineLabel = '';

    let filteredPays = [...payments];
    let filteredExps = [...expenses];

    if (exportTimeline === 'month') {
      const monthStr = MONTHS[selectedMonth];
      timelineLabel = `${monthStr} ${selectedYear}`;
      
      filteredPays = payments.filter((p) => {
        const d = new Date(p.date);
        return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
      });
      filteredExps = expenses.filter((e) => {
        const d = new Date(e.date);
        return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
      });

      const lastDay = new Date(selectedYear, selectedMonth + 1, 0).getDate();
      startDateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-01`;
      endDateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
    } else if (exportTimeline === 'year') {
      timelineLabel = `Full Year ${selectedYear}`;
      filteredPays = payments.filter((p) => new Date(p.date).getFullYear() === selectedYear);
      filteredExps = expenses.filter((e) => new Date(e.date).getFullYear() === selectedYear);
      
      startDateStr = `${selectedYear}-01-01`;
      endDateStr = `${selectedYear}-12-31`;
    } else if (exportTimeline === 'custom') {
      timelineLabel = `Custom Range (${customStartDate} to ${customEndDate})`;
      filteredPays = payments.filter((p) => p.date >= customStartDate && p.date <= customEndDate);
      filteredExps = expenses.filter((e) => e.date >= customStartDate && e.date <= customEndDate);
      startDateStr = customStartDate;
      endDateStr = customEndDate;
    } else {
      timelineLabel = 'All Time Record History';
      startDateStr = 'Earliest';
      endDateStr = 'Latest';
    }

    // Calculate Aggregations
    const totalIn = filteredPays.reduce((sum, p) => sum + p.amount, 0);
    const totalOut = filteredExps.reduce((sum, e) => sum + e.amount, 0);
    const netSurplus = totalIn - totalOut;

    const rows: string[] = [];

    const escape = (val: any) => {
      if (val === undefined || val === null) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    // Header Title metadata
    rows.push(`${escape('EKAM HOMES DOON HOSTEL LEDGER ACCOUNT')}`);
    rows.push(`${escape('Generated At:')},${escape(new Date().toLocaleString())}`);
    rows.push(`${escape('Timeline Selected:')},${escape(timelineLabel)}`);
    if (startDateStr && endDateStr) {
      rows.push(`${escape('Range Interval:')},${escape(`${startDateStr} to ${endDateStr}`)}`);
    }
    rows.push('');

    // Insights Overview Summary
    rows.push(`${escape('--- FINANCIAL SUMMARY OUTLINE ---')}`);
    rows.push(`${escape('Metric Indicator')},${escape('Computational Amount')}`);
    rows.push(`${escape('Total Receipts / Inflow')},${escape(`INR ${totalIn}`)}`);
    rows.push(`${escape('Total Outlays / Expenses')},${escape(`INR ${totalOut}`)}`);
    rows.push(`${escape('Net Cash Balance (Profit/Loss)')},${escape(`INR ${netSurplus}`)}`);
    rows.push('');

    // Payments Section
    rows.push(`${escape('--- DETAILED LEDGER COLLECTIONS (REVENUE RECEIPTS) ---')}`);
    rows.push(`${escape('Transaction Date')},${escape('Name of Payer')},${escape('Room No')},${escape('Schedule Mode')},${escape('Amount (INR)')},${escape('Payer Ledger Description / Notes')}`);
    
    if (filteredPays.length === 0) {
      rows.push(`${escape('No receipts recorded in this period')}`);
    } else {
      const sortedPays = [...filteredPays].sort((a, b) => b.date.localeCompare(a.date));
      sortedPays.forEach((p) => {
        let residentName = 'N/A';
        let roomNo = 'N/A';
        
        if (p.residentId) {
          const resObj = residents.find((r) => r.id === p.residentId);
          if (resObj) {
            residentName = resObj.name;
            roomNo = `Room ${resObj.roomNumber}`;
          }
        }
        
        const typeLabel = p.paymentType ? (PAYMENT_TYPE_CONFIG[p.paymentType]?.label || p.paymentType) : 'Rent';
        rows.push(`${escape(p.date)},${escape(residentName)},${escape(roomNo)},${escape(typeLabel)},${escape(p.amount)},${escape(p.description)}`);
      });
    }
    rows.push('');

    // Expenses Section
    rows.push(`${escape('--- DETAILED LEDGER OUTLAYS (EXPENSES DISBURSED) ---')}`);
    rows.push(`${escape('Transaction Date')},${escape('Broad Category Group')},${escape('Operating Expense Detail')},${escape('Amount Outlay (INR)')},${escape('Internal Ledger Notes')}`);
    
    if (filteredExps.length === 0) {
      rows.push(`${escape('No expenses recorded in this period')}`);
    } else {
      const sortedExps = [...filteredExps].sort((a, b) => b.date.localeCompare(a.date));
      sortedExps.forEach((e) => {
        const catLabel = CATEGORY_CONFIG[e.category]?.label || e.category;
        rows.push(`${escape(e.date)},${escape(catLabel)},${escape(e.subCategory)},${escape(e.amount)},${escape(e.notes || 'N/A')}`);
      });
    }
    rows.push('');

    // Tenants list
    rows.push(`${escape('--- ACTIVE AND ARCHIVED TENANTS ROSTER ---')}`);
    rows.push(`${escape('Room Number')},${escape('Full Tenant Name')},${escape('Roster Status')},${escape('Contact/Phone')},${escape('Rental Cycle Base')},${escape('Monthly Rent Fee Value (INR)')},${escape('Registered Check-In Date')}`);
    
    residents.forEach((r) => {
      const statusLabel = r.active ? 'Active Occupant' : 'Checked Out';
      const rentConf = RENT_CATEGORY_CONFIG[r.rentCategory]?.label || r.rentCategory;
      rows.push(`${escape(r.roomNumber)},${escape(r.name)},${escape(statusLabel)},${escape(r.phone || 'N/A')},${escape(rentConf)},${escape(r.monthlyRent)},${escape(r.joinDate)}`);
    });

    const csvContent = '\uFEFF' + rows.join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.setAttribute('href', url);
    const sanitizedLabel = timelineLabel.replace(/[\s\(\):]/g, '_').toLowerCase();
    link.setAttribute('download', `ekam_homes_ledger_statement_${sanitizedLabel}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Month-selective arrays
  const monthExpenses = useMemo(() => {
    return expenses.filter((e) => {
      const d = new Date(e.date);
      return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
    });
  }, [expenses, selectedMonth, selectedYear]);

  const monthPayments = useMemo(() => {
    return payments.filter((p) => {
      const d = new Date(p.date);
      return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
    });
  }, [payments, selectedMonth, selectedYear]);

  const yearPayments = useMemo(() => {
    return payments.filter((p) => new Date(p.date).getFullYear() === selectedYear);
  }, [payments, selectedYear]);

  // Aggregate Metrics
  const totalIncome = useMemo(() => monthPayments.reduce((s, p) => s + p.amount, 0), [monthPayments]);
  const totalExpenses = useMemo(() => monthExpenses.reduce((s, e) => s + e.amount, 0), [monthExpenses]);
  const netBalance = totalIncome - totalExpenses;

  // Category Total calculations
  const categoryTotals = useMemo(() => {
    const totals: Record<CategoryKey, number> = {
      groceries: 0,
      salaries: 0,
      maintenance: 0,
      rent: 0,
      utilities: 0,
      miscellaneous: 0,
    };
    monthExpenses.forEach((e) => {
      totals[e.category] += e.amount;
    });
    return totals;
  }, [monthExpenses]);

  // Sub-category grouping
  const subCategoryBreakdown = useMemo(() => {
    const breakdown: Record<CategoryKey, Record<string, number>> = {
      groceries: {},
      salaries: {},
      maintenance: {},
      rent: {},
      utilities: {},
      miscellaneous: {},
    };
    monthExpenses.forEach((e) => {
      breakdown[e.category][e.subCategory] = (breakdown[e.category][e.subCategory] ?? 0) + e.amount;
    });
    return breakdown;
  }, [monthExpenses]);

  // Rent completion logs per resident
  const residentDues: ResidentDue[] = useMemo(() => {
    return residents.map((r) => {
      const cat = r.rentCategory ?? 'monthly';

      let totalRent = 0;
      let totalPaid = 0;
      let period = '';

      if (cat === 'monthly') {
        totalRent = r.monthlyRent;
        totalPaid = monthPayments
          .filter((p) => p.residentId === r.id)
          .reduce((s, p) => s + p.amount, 0);
        period = `${MONTHS[selectedMonth]} ${selectedYear}`;
      } else if (cat === 'yearly') {
        totalRent = r.yearlyRent ?? r.monthlyRent * 12;
        totalPaid = yearPayments.filter((p) => p.residentId === r.id).reduce((s, p) => s + p.amount, 0);
        period = `Year ${selectedYear}`;
      } else {
        totalRent = (r.partPaymentAmount ?? 0) * (r.partPaymentCount ?? 1);
        totalPaid = yearPayments.filter((p) => p.residentId === r.id).reduce((s, p) => s + p.amount, 0);
        period = `Year ${selectedYear}`;
      }

      const outstanding = Math.max(0, totalRent - totalPaid);
      const percentPaid = totalRent > 0 ? Math.min(100, (totalPaid / totalRent) * 100) : 0;

      const nextDueDate = r.rentDueDay ? getNextDueDate(r.rentDueDay) : null;
      const daysLeft = nextDueDate ? daysUntil(nextDueDate) : null;

      return {
        resident: r,
        totalRent,
        totalPaid,
        outstanding,
        percentPaid,
        nextDueDate,
        daysLeft,
        period,
      };
    });
  }, [residents, monthPayments, yearPayments, selectedMonth, selectedYear]);

  // History mapping for expand
  const paymentHistoryByResident = useMemo(() => {
    const map: Record<string, { date: string; amount: number; type: string }[]> = {};
    yearPayments.forEach((p) => {
      if (!p.residentId) return;
      if (!map[p.residentId]) map[p.residentId] = [];
      map[p.residentId].push({
        date: p.date,
        amount: p.amount,
        type: p.paymentType ?? 'monthly',
      });
    });
    return map;
  }, [yearPayments]);

  const maxExpenseCategoryCost = useMemo(() => {
    const maxVal = Math.max(...(Object.values(categoryTotals) as number[]));
    return maxVal > 0 ? maxVal : 1;
  }, [categoryTotals]);

  const topOverdueAccounts = useMemo(() => {
    return residentDues
      .filter((dues) => dues.outstanding > 0 && dues.resident.active)
      .sort((a, b) => b.outstanding - a.outstanding);
  }, [residentDues]);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header and month selectors */}
      <div className="md:flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs space-y-4 md:space-y-0">
        <div>
          <span className="text-xs font-semibold tracking-wider text-slate-400 uppercase">AUDIT & ANALYSIS</span>
          <h2 className="text-xl font-bold text-slate-800 font-sans tracking-tight">Ledger Reports</h2>
        </div>

        {/* Stepper Month */}
        <div className="flex items-center space-x-1.5 justify-center">
          <button
            onClick={onPrevMonth}
            className="p-2 rounded-lg bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-600 select-none cursor-pointer"
          >
            ←
          </button>
          <div className="bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-lg text-sm font-semibold text-slate-700 min-w-[150px] text-center">
            {MONTHS[selectedMonth]} {selectedYear}
          </div>
          <button
            onClick={onNextMonth}
            className="p-2 rounded-lg bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-600 select-none cursor-pointer"
          >
            →
          </button>
        </div>
      </div>

      {/* Timeline Report Generator Section */}
      <div className="bg-[#FAFDFB] border border-emerald-500/15 p-6 rounded-2xl shadow-2xs space-y-5">
        <div className="space-y-1">
          <div className="flex items-center space-x-2 text-[#1D3E24]">
            <FileSpreadsheet className="w-5 h-5 shrink-0" />
            <h3 className="font-extrabold text-base tracking-tight text-slate-800">Download Financial Sheet</h3>
          </div>
          <p className="text-xs text-slate-500 font-semibold leading-relaxed">
            Compile and save detailed Excel-compatible CSV statements including summary charts, payments log, expenses, and tenant registries.
          </p>
        </div>

        {/* Configurations selector row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white p-4 rounded-xl border border-slate-150/80 shadow-3xs">
          {/* Timeline option */}
          <div className="space-y-1.5 col-span-1">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">Report Timeline Mode</label>
            <select
              value={exportTimeline}
              onChange={(e) => setExportTimeline(e.target.value as any)}
              className="w-full text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:outline-hidden focus:border-[#1D3E24] cursor-pointer"
            >
              <option value="month">Current Selected Month Only</option>
              <option value="year">Current Selected Year Only</option>
              <option value="all">Complete All-Time Records</option>
              <option value="custom">Custom Date Range</option>
            </select>
          </div>

          {/* Conditional inputs */}
          {exportTimeline === 'custom' ? (
            <>
              <div className="space-y-1.5 col-span-1">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">From Date</label>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="w-full text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:outline-hidden focus:border-[#1D3E24]"
                />
              </div>
              <div className="space-y-1.5 col-span-1">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">To Date</label>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="w-full text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:outline-hidden focus:border-[#1D3E24]"
                />
              </div>
            </>
          ) : (
            <div className="col-span-1 md:col-span-2 flex items-center p-3 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
              <p className="text-[11px] text-slate-400 font-semibold leading-relaxed">
                {exportTimeline === 'month' && `Selected billing month is matching ${MONTHS[selectedMonth]} ${selectedYear}.`}
                {exportTimeline === 'year' && `Full auditing range selected starts Jan 1, ${selectedYear} until Dec 31, ${selectedYear}.`}
                {exportTimeline === 'all' && "Generates a full statement that includes every transaction from the start of registration."}
              </p>
            </div>
          )}

          {/* Download button row */}
          <div className="flex items-end col-span-1">
            <button
              onClick={handleDownloadCSV}
              className="w-full flex items-center justify-center space-x-2 bg-[#1D3E24] hover:bg-[#152e1a] text-white p-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer shadow-xs active:scale-98"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Ledger Sheet</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Income / Expense summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-emerald-50/50 border border-emerald-100 p-6 rounded-2xl flex items-center justify-between shadow-xs">
          <div className="space-y-1">
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-widest block">Total Month Receipts</span>
            <span className="text-2xl font-black text-emerald-600 tracking-tight block">
              {formatCurrency(totalIncome)}
            </span>
            <span className="text-xs text-slate-400 block">{monthPayments.length} recorded payments</span>
          </div>
          <div className="p-3 bg-emerald-500/10 text-emerald-600 rounded-2xl shrink-0">
            <ArrowDownCircle className="w-8 h-8" />
          </div>
        </div>

        <div className="bg-red-50/50 border border-red-100 p-6 rounded-2xl flex items-center justify-between shadow-xs">
          <div className="space-y-1">
            <span className="text-xs font-bold text-red-800 uppercase tracking-widest block">Total Month Outlays</span>
            <span className="text-2xl font-black text-red-600 tracking-tight block">
              {formatCurrency(totalExpenses)}
            </span>
            <span className="text-xs text-slate-400 block">{monthExpenses.length} recorded expenses</span>
          </div>
          <div className="p-3 bg-red-500/10 text-red-600 rounded-2xl shrink-0">
            <ArrowUpCircle className="w-8 h-8" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Category Cost breakdown - 2 cols on wide layout */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
            <h3 className="font-bold text-slate-800 text-lg mb-2">Category Wise Expenses</h3>
            <p className="text-xs text-slate-400 mb-6">Disbursed outlays for this billing month</p>

            <div className="space-y-4">
              {CATEGORY_KEYS.map((key) => {
                const conf = CATEGORY_CONFIG[key];
                const cost = categoryTotals[key];
                const percent = totalExpenses > 0 ? (cost / totalExpenses) * 100 : 0;
                const subs = subCategoryBreakdown[key];

                return (
                  <div key={key} className="space-y-2 p-3 bg-slate-50/30 hover:bg-slate-50 rounded-xl border border-slate-100/50 transition-colors">
                    <div className="flex justify-between items-center text-sm">
                      <div className="flex items-center space-x-2.5">
                        <span
                          className={`w-3 h-3 rounded-full inline-block`}
                          style={{ backgroundColor: conf.color }}
                        />
                        <span className="font-bold text-slate-700">{conf.label}</span>
                        <span className="text-[10px] text-slate-400 font-semibold">{percent.toFixed(1)}%</span>
                      </div>
                      <span className="font-black text-slate-800">{formatCurrency(cost)}</span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          backgroundColor: conf.color,
                          width: `${percent}%`,
                        }}
                      />
                    </div>

                    {/* Subcategories items */}
                    {Object.keys(subs).length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1.5">
                        {Object.entries(subs).map(([subCat, val]) => (
                          <span
                            key={subCat}
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold bg-white text-slate-500 border border-slate-150 shadow-2xs`}
                          >
                            {subCat}: {formatCurrency(val as number)}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: Urgent Due checklists */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
            <h3 className="font-bold text-slate-800 text-lg mb-1">Dues Ledger</h3>
            <p className="text-xs text-slate-400 mb-6">Pending collections from active tenants</p>

            <div className="space-y-4">
              {topOverdueAccounts.length === 0 ? (
                <div className="text-center py-10 bg-slate-50/50 border border-dashed border-slate-200 rounded-xl text-slate-400 space-y-2">
                  <div className="w-8 h-8 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                    ✓
                  </div>
                  <p className="text-xs font-semibold">All active resident dues are fully paid!</p>
                </div>
              ) : (
                topOverdueAccounts.map(({ resident: r, outstanding, daysLeft }) => {
                  const isOverdue = daysLeft !== null && daysLeft < 0;
                  return (
                    <div
                      key={r.id}
                      className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-100 rounded-xl"
                    >
                      <div className="min-w-0">
                        <p className="font-bold text-slate-800 text-sm leading-tight">{r.name}</p>
                        <p className="text-xs text-slate-400">Room {r.roomNumber}</p>
                        {daysLeft !== null && (
                          <span
                            className={`inline-block text-[10px] font-bold uppercase tracking-wider mt-1 ${
                              isOverdue ? 'text-red-600' : 'text-amber-600'
                            }`}
                          >
                            {isOverdue ? `Overdue by ${Math.abs(daysLeft)} days` : `Due in ${daysLeft} days`}
                          </span>
                        )}
                      </div>

                      <div className="text-right ml-4 shrink-0">
                        <span className="text-xs font-bold text-slate-400 block uppercase tracking-wider">Unpaid</span>
                        <span className="font-extrabold text-red-600 text-sm block">
                          {formatCurrency(outstanding)}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Full Audit Checklist */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="mb-6">
          <h3 className="font-bold text-slate-800 text-lg">Active Resident Accounts Statement</h3>
          <p className="text-xs text-slate-400">Statement cycle tracking matching individual rent category filters</p>
        </div>

        <div className="space-y-4">
          {residentDues.map(({ resident: r, totalRent, totalPaid, outstanding, percentPaid, period }) => {
            const isExpanded = expandedResidentId === r.id;
            const isFullyPaid = outstanding === 0;
            const hist = paymentHistoryByResident[r.id] ?? [];
            const rCfg = RENT_CATEGORY_CONFIG[r.rentCategory];

            return (
              <div
                key={r.id}
                className={`border rounded-2xl overflow-hidden transition-all duration-200 ${
                  isExpanded ? 'border-blue-200 shadow-sm' : 'border-slate-100 hover:border-slate-200'
                }`}
              >
                {/* Header row click to expand */}
                <div
                  onClick={() => setExpandedResidentId(isExpanded ? null : r.id)}
                  className="p-4 bg-slate-50/50 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer select-none"
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-xs shrink-0">
                      R{r.roomNumber}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-slate-800 text-sm truncate">{r.name}</h4>
                      <div className="flex items-center space-x-2 mt-0.5">
                        <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${rCfg.textClass} ${rCfg.bgClass}`}>
                          {rCfg.label}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          Due Cycle: {period}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Financial completeness indicators */}
                  <div className="flex items-center space-x-4 ml-11 sm:ml-0">
                    <div className="text-right">
                      <p className="text-[10px] uppercase font-bold text-slate-400 mb-0.5">Outstanding</p>
                      <p
                        className={`font-black tracking-tight text-sm ${
                          isFullyPaid ? 'text-slate-400' : 'text-red-600'
                        }`}
                      >
                        {isFullyPaid ? 'Fully Paid' : formatCurrency(outstanding)}
                      </p>
                    </div>

                    <div className="shrink-0 flex items-center justify-center">
                      {isFullyPaid ? (
                        <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center animate-pulse">
                          <AlertCircle className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </div>

                    <div>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-slate-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Progress bar tracking */}
                <div className="px-4 pb-4">
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500`}
                      style={{
                        width: `${percentPaid}%`,
                        backgroundColor: isFullyPaid ? '#10B981' : '#F59E0B',
                      }}
                    />
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold mt-1.5">
                    <span>Paid {percentPaid.toFixed(0)}%</span>
                    <span>
                      Collected: {formatCurrency(totalPaid)} / Rent: {formatCurrency(totalRent)}
                    </span>
                  </div>
                </div>

                {/* Expanded content view */}
                {isExpanded && (
                  <div className="p-4 bg-white border-t border-slate-100 text-xs space-y-3 animate-slide-down">
                    <p className="font-bold text-slate-500">History of payments recorded in {selectedYear}:</p>
                    {hist.length === 0 ? (
                      <p className="text-slate-300 italic py-1">No payment transactions found on register for this year.</p>
                    ) : (
                      <div className="space-y-1.5">
                        {hist.map((item, idx) => (
                          <div
                            key={idx}
                            className="flex justify-between items-center p-2 rounded-lg bg-slate-50 border border-slate-100"
                          >
                            <span className="text-slate-600 font-medium font-mono">
                              {formatDateStr(item.date)} — ({item.type === 'monthly' ? 'Monthly Rent' : item.type})
                            </span>
                            <span className="font-black text-emerald-600 tracking-tight">
                              {formatCurrency(item.amount)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
