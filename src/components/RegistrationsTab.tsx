import React from 'react';
import { useData } from '../context/DataContext';
import { ShieldCheck, Mail, Phone, Calendar, UserCheck, Trash2 } from 'lucide-react';
import { formatDate } from '../types';

export default function RegistrationsTab() {
  const { allRegistrations, deleteRegistration, requestConfirm } = useData();

  const handleReject = (uid: string, name: string) => {
    requestConfirm({
      title: 'Reject / Revoke Manager?',
      message: `Are you sure you want to permanently remove registration / application for ${name || 'this candidate'}? They will lose manager access keys.`,
      confirmText: 'Yes, Revoke Access',
      cancelText: 'Cancel',
      isDestructive: true,
      onConfirm: async () => {
        await deleteRegistration(uid);
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Overview Card */}
      <div className="bg-white border border-[#1D3E24]/10 rounded-2xl p-6 shadow-2xs relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5">
          <ShieldCheck className="w-40 h-40 text-[#1D3E24]" />
        </div>
        <div className="relative z-15 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-5 h-5 text-emerald-800" />
              <h2 className="text-lg font-black text-slate-800 tracking-tight">Manager Registrations</h2>
            </div>
            <p className="text-xs text-slate-400 font-semibold max-w-xl">
              Strictly secured workspace profiles of all administrators and managers registered across Ekam Homes Bookkeeper app.
            </p>
          </div>
          <div className="bg-emerald-50 border border-emerald-110 px-4 py-3 rounded-2xl text-center shrink-0">
            <span className="block text-[10px] font-black uppercase text-emerald-800 tracking-wider">Total Managers</span>
            <span className="text-2xl font-black text-emerald-950">{allRegistrations.length}</span>
          </div>
        </div>
      </div>

      {allRegistrations.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-3">
          <p className="text-sm font-bold text-slate-450">No managers found in Cloud database yet.</p>
          <p className="text-xs text-slate-420">Wait for users to complete their profile registration flow.</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-6xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50/60">
                <tr>
                  <th className="px-6 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-wider">Manager Details</th>
                  <th className="px-6 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-wider">Email Address</th>
                  <th className="px-6 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-wider">Mobile Number</th>
                  <th className="px-6 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-wider">Registered On</th>
                  <th className="px-6 py-4 text-center text-[10px] font-black text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-100 text-xs">
                {allRegistrations.map((item) => (
                  <tr key={item.uid} className="hover:bg-slate-50/40 transition-colors">
                    {/* Name */}
                    <td className="px-6 py-4.5 whitespace-nowrap">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-xl bg-[#FAF9D2]/70 border border-[#1D3E24]/10 flex items-center justify-center text-emerald-950 font-black shrink-0 shadow-3xs uppercase">
                          {item.name ? item.name.charAt(0) : <UserCheck className="w-4 h-4" />}
                        </div>
                        <div>
                          <div className="font-extrabold text-slate-800 text-sm leading-snug">{item.name || 'Anonymous User'}</div>
                          <div className="text-[10px] text-slate-400 font-bold font-mono tracking-tight">{item.uid}</div>
                        </div>
                      </div>
                    </td>

                    {/* Email */}
                    <td className="px-6 py-4.5 whitespace-nowrap">
                      <div className="flex items-center space-x-2 text-slate-650 font-semibold">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        <span>{item.email}</span>
                      </div>
                    </td>

                    {/* Mobile */}
                    <td className="px-6 py-4.5 whitespace-nowrap">
                      {item.phone ? (
                        <a
                          href={`tel:${item.phone.replace(/\s+/g, '')}`}
                          className="flex items-center space-x-2 text-[#1D3E24] hover:underline font-extrabold"
                        >
                          <Phone className="w-3.5 h-3.5 text-emerald-700" />
                          <span>{item.phone}</span>
                        </a>
                      ) : (
                        <span className="text-slate-400 font-semibold">-</span>
                      )}
                    </td>

                    {/* Registered Date */}
                    <td className="px-6 py-4.5 whitespace-nowrap text-slate-500 font-bold font-mono">
                      <div className="flex items-center space-x-2 text-slate-500">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{formatDate(item.createdAt)}</span>
                      </div>
                    </td>

                    {/* Action */}
                    <td className="px-6 py-4.5 whitespace-nowrap text-center">
                      <button
                        onClick={() => handleReject(item.uid, item.name)}
                        className="p-1 px-2.5 rounded-xl border border-red-200 text-red-650 hover:bg-red-50 hover:text-red-750 font-black transition-all text-[11px] inline-flex items-center space-x-1 cursor-pointer"
                        title="Delete registration request and revoke manager access keys"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Reject</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
