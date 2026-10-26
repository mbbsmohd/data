import React, { useState } from 'react';
import {
  User, Mail, Phone, Lock, ShieldCheck, MapPin, Calendar, FileText,
  AlertTriangle, CheckCircle2, Key, Send, Edit3, Smartphone, ArrowLeft
} from 'lucide-react';
import Swal from 'sweetalert2';
import { api } from '../services/api';

interface ProfilePageProps {
  user: any;
  onRefreshUser: () => void;
  onBack: () => void;
  onOpenSupport?: () => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({
  user,
  onRefreshUser,
  onBack,
  onOpenSupport
}) => {
  const [address, setAddress] = useState(user.address || '');
  const [state, setState] = useState(user.state || '');
  const [dateOfBirth, setDateOfBirth] = useState(user.date_of_birth || '');
  const [bio, setBio] = useState(user.bio || '');
  const [whatsappNumber, setWhatsappNumber] = useState(user.whatsapp_number || '');
  const [saving, setSaving] = useState(false);

  // Ticket Modal for Locked Identity Changes
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [ticketField, setTicketField] = useState<'name' | 'email' | 'phone'>('name');
  const [ticketNewValue, setTicketNewValue] = useState('');
  const [ticketReason, setTicketReason] = useState('');
  const [submittingTicket, setSubmittingTicket] = useState(false);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.updateProfile({
        address,
        state,
        dateOfBirth,
        bio,
        whatsappNumber
      });

      Swal.fire({
        icon: 'success',
        title: 'Profile Updated',
        text: 'Your personal information has been saved successfully.',
        confirmButtonColor: '#1E5BF9',
        timer: 1600,
        showConfirmButton: false
      });
      onRefreshUser();
    } catch (err: any) {
      Swal.fire({ icon: 'error', title: 'Update Failed', text: err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleOpenTicketModal = (field: 'name' | 'email' | 'phone') => {
    setTicketField(field);
    setTicketNewValue('');
    setTicketReason('');
    setShowTicketModal(true);
  };

  const handleSubmitTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketNewValue || !ticketReason) {
      Swal.fire({ icon: 'warning', title: 'Incomplete Request', text: 'Please fill in both the new requested value and reason.' });
      return;
    }

    setSubmittingTicket(true);
    try {
      const fieldLabel = ticketField === 'name' ? 'Full Name' : ticketField === 'email' ? 'Email Address' : 'Phone Number';
      const currentVal = ticketField === 'name' ? user.name : ticketField === 'email' ? user.email : user.phone;

      const res = await api.requestProfileChangeTicket({
        requestedChanges: `Change ${fieldLabel} from "${currentVal}" to "${ticketNewValue}"`,
        reason: ticketReason
      });

      Swal.fire({
        icon: 'success',
        title: 'Ticket Submitted',
        text: res.message || 'Your identity change request has been submitted to Customer Support.',
        confirmButtonColor: '#1E5BF9'
      });
      setShowTicketModal(false);
    } catch (err: any) {
      Swal.fire({ icon: 'error', title: 'Submission Failed', text: err.message });
    } finally {
      setSubmittingTicket(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="p-2.5 bg-white border border-slate-200 rounded-2xl text-slate-700 hover:bg-slate-50 transition shadow-sm flex items-center space-x-2 text-xs font-bold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </button>
        <div className="flex items-center space-x-2">
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
            Tier {user.tier || 1} Account
          </span>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase">
            {user.status || 'Active'}
          </span>
        </div>
      </div>

      {/* Profile Overview Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-sm flex flex-col sm:flex-row items-center gap-6">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black text-3xl flex items-center justify-center shadow-md">
          {(user.name || user.email || 'U')[0].toUpperCase()}
        </div>
        <div className="text-center sm:text-left flex-1">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">{user.name}</h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-100 text-blue-800">
              {user.role || 'Customer'}
            </span>
          </div>
          <p className="text-xs text-slate-500 font-mono mt-1">{user.email} • {user.phone}</p>
          <p className="text-xs text-slate-600 mt-2 font-medium">
            Member since {new Date(user.created_at || Date.now()).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </p>
        </div>
      </div>

      {/* Locked Identity Information (KYC & Anti-Fraud Protection) */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-sm space-y-6">
        <div>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-black text-slate-900">Verified Identity Information</h2>
            </div>
            <span className="text-[11px] font-bold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center space-x-1">
              <Lock className="w-3 h-3 text-slate-500" />
              <span>Strictly Locked</span>
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1">
            To prevent account takeovers, unauthorized payouts, and satisfy KYC anti-money laundering regulations, your Legal Name, Email, and Phone cannot be edited directly.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Legal Name */}
          <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase">Legal Account Name</span>
                <Lock className="w-3.5 h-3.5 text-slate-400" />
              </div>
              <div className="text-sm font-black text-slate-800">{user.name}</div>
            </div>
            <button
              onClick={() => handleOpenTicketModal('name')}
              className="mt-3 text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center space-x-1"
            >
              <Edit3 className="w-3 h-3" />
              <span>Request Name Correction</span>
            </button>
          </div>

          {/* Email Address */}
          <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase">Verified Email</span>
                <Lock className="w-3.5 h-3.5 text-slate-400" />
              </div>
              <div className="text-sm font-black text-slate-800 truncate">{user.email}</div>
            </div>
            <button
              onClick={() => handleOpenTicketModal('email')}
              className="mt-3 text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center space-x-1"
            >
              <Edit3 className="w-3 h-3" />
              <span>Request Email Update</span>
            </button>
          </div>

          {/* Phone Number */}
          <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase">Registered Phone</span>
                <Lock className="w-3.5 h-3.5 text-slate-400" />
              </div>
              <div className="text-sm font-black text-slate-800 font-mono">{user.phone}</div>
            </div>
            <button
              onClick={() => handleOpenTicketModal('phone')}
              className="mt-3 text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center space-x-1"
            >
              <Edit3 className="w-3 h-3" />
              <span>Request Phone Update</span>
            </button>
          </div>
        </div>
      </div>

      {/* Editable Profile Information Form */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-sm space-y-6">
        <div>
          <h2 className="text-lg font-black text-slate-900">Contact & Residential Details</h2>
          <p className="text-xs text-slate-500 font-medium mt-1">
            You can keep your residential address, state, and secondary communication details up-to-date here.
          </p>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase block mb-1.5 flex items-center space-x-1">
                <MapPin className="w-3.5 h-3.5 text-blue-600" />
                <span>Residential Address</span>
              </label>
              <input
                type="text"
                value={address}
                onChange={e => setAddress(e.target.value)}
                placeholder="e.g. 14 Ahmadu Bello Way"
                className="w-full text-xs font-semibold p-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 uppercase block mb-1.5 flex items-center space-x-1">
                <MapPin className="w-3.5 h-3.5 text-blue-600" />
                <span>State of Residence</span>
              </label>
              <input
                type="text"
                value={state}
                onChange={e => setState(e.target.value)}
                placeholder="e.g. Kano, Lagos, Abuja"
                className="w-full text-xs font-semibold p-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase block mb-1.5 flex items-center space-x-1">
                <Calendar className="w-3.5 h-3.5 text-blue-600" />
                <span>Date of Birth</span>
              </label>
              <input
                type="date"
                value={dateOfBirth}
                onChange={e => setDateOfBirth(e.target.value)}
                className="w-full text-xs font-semibold p-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 uppercase block mb-1.5 flex items-center space-x-1">
                <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
                <span>WhatsApp Notification Number</span>
              </label>
              <input
                type="text"
                value={whatsappNumber}
                onChange={e => setWhatsappNumber(e.target.value)}
                placeholder="e.g. 09131797675"
                className="w-full text-xs font-semibold p-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 uppercase block mb-1.5 flex items-center space-x-1">
              <FileText className="w-3.5 h-3.5 text-blue-600" />
              <span>Bio / Business Description</span>
            </label>
            <textarea
              rows={3}
              value={bio}
              onChange={e => setBio(e.target.value)}
              placeholder="Tell us a little about your business or recharge merchant services..."
              className="w-full text-xs font-semibold p-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs md:text-sm px-6 py-3 rounded-2xl transition shadow-md flex items-center space-x-2"
            >
              <span>{saving ? 'Saving Changes...' : 'Save Profile Details'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Modal: Identity Update Request to Support */}
      {showTicketModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-lg p-6 md:p-8 shadow-2xl relative space-y-5">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">Request Identity Update</h3>
                <p className="text-xs text-slate-500">Official Customer Support Review</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 font-medium bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
              To update your <b>{ticketField === 'name' ? 'Legal Name' : ticketField === 'email' ? 'Email Address' : 'Phone Number'}</b>, please provide the new requested value and reason. Our KYC compliance team will verify and update it.
            </p>

            <form onSubmit={handleSubmitTicket} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase block mb-1">
                  New {ticketField === 'name' ? 'Full Legal Name' : ticketField === 'email' ? 'Email Address' : 'Phone Number'}
                </label>
                <input
                  type={ticketField === 'email' ? 'email' : 'text'}
                  required
                  value={ticketNewValue}
                  onChange={e => setTicketNewValue(e.target.value)}
                  placeholder={`Enter your correct ${ticketField}...`}
                  className="w-full text-xs font-semibold p-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 uppercase block mb-1">
                  Reason for Update
                </label>
                <textarea
                  required
                  rows={3}
                  value={ticketReason}
                  onChange={e => setTicketReason(e.target.value)}
                  placeholder="e.g. Correcting spelling typo, newly registered SIM card, marriage name change..."
                  className="w-full text-xs font-semibold p-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowTicketModal(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingTicket}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-6 py-2.5 rounded-xl transition shadow-md flex items-center space-x-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{submittingTicket ? 'Submitting Request...' : 'Submit to Support'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
