import React, { useState, useEffect } from 'react';
import {
  LifeBuoy, MessageSquare, Phone, Mail, HelpCircle, Plus,
  Send, Clock, CheckCircle2, AlertCircle, ChevronDown, ChevronUp,
  MessageCircle, ExternalLink, RefreshCw, X
} from 'lucide-react';
import Swal from 'sweetalert2';
import { api } from '../services/api';

export const SupportPage: React.FC<{
  onBack: () => void;
  settings?: any;
}> = ({ onBack, settings = {} }) => {
  const [activeTab, setActiveTab] = useState<'live_chat' | 'tickets' | 'faqs'>('live_chat');
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewModal, setShowNewModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  const [ticketReplies, setTicketReplies] = useState<any[]>([]);
  const [replyMessage, setReplyMessage] = useState('');
  const [loadingReply, setLoadingReply] = useState(false);

  // Live Chat state
  const [liveConv, setLiveConv] = useState<any>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [loadingChat, setLoadingChat] = useState(false);
  const [sendingChat, setSendingChat] = useState(false);
  const chatBottomRef = React.useRef<HTMLDivElement>(null);

  // New ticket state
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('Transaction Issue');
  const [priority, setPriority] = useState('MEDIUM');
  const [message, setMessage] = useState('');
  const [loadingSubmit, setLoadingSubmit] = useState(false);

  // FAQ accordion state
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const phone = settings.support_phone || '09131797675';
  const email = settings.support_email || 'support@bukardatasub.com';
  const whatsapp = settings.whatsapp_number || settings.support_phone || '2349131797675';

  const fetchLiveChat = async () => {
    try {
      setLoadingChat(true);
      const res = await api.getSupportConversations();
      if (res && res.success && res.conversations && res.conversations.length > 0) {
        const conv = res.conversations[0];
        setLiveConv(conv);
        const msgRes = await api.getSupportConversationMessages(conv.id);
        if (msgRes && msgRes.success) {
          setChatMessages(msgRes.messages || []);
        }
      }
    } catch (e) {
      console.error('Failed to load customer live chat', e);
    } finally {
      setLoadingChat(false);
    }
  };

  const handleStartLiveChat = async () => {
    try {
      setLoadingChat(true);
      const res = await api.createSupportConversation({
        subject: 'General Support Inquiry',
        initialMessage: 'Hello, I need assistance with my account.'
      });
      if (res && res.success) {
        setLiveConv(res.conversation);
        fetchLiveChat();
      }
    } catch (err: any) {
      Swal.fire({ icon: 'error', title: 'Chat Initialization Failed', text: err.message });
    } finally {
      setLoadingChat(false);
    }
  };

  const handleSendChatMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!chatInput.trim() || !liveConv || sendingChat) return;
    try {
      setSendingChat(true);
      const text = chatInput.trim();
      setChatInput('');
      await api.sendSupportChatMessage(liveConv.id, { message: text });
      const msgRes = await api.getSupportConversationMessages(liveConv.id);
      if (msgRes && msgRes.success) {
        setChatMessages(msgRes.messages || []);
      }
    } catch (err: any) {
      Swal.fire({ icon: 'error', title: 'Send Failed', text: err.message });
    } finally {
      setSendingChat(false);
    }
  };

  useEffect(() => {
    fetchTickets();
    fetchLiveChat();
    const chatInterval = setInterval(() => {
      if (activeTab === 'live_chat' && liveConv) {
        api.getSupportConversationMessages(liveConv.id).then(r => {
          if (r && r.success) setChatMessages(r.messages || []);
        }).catch(() => {});
      }
    }, 4000);
    return () => clearInterval(chatInterval);
  }, [liveConv?.id, activeTab]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const res = await api.getSupportTickets();
      if (res.success) {
        setTickets(res.tickets || []);
      }
    } catch (err: any) {
      console.error('Failed to fetch tickets:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenTicket = async (ticket: any) => {
    setSelectedTicket(ticket);
    try {
      const res = await api.getSupportTicketDetails(ticket.id);
      if (res.success) {
        setTicketReplies(res.replies || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !message) {
      Swal.fire({ icon: 'warning', title: 'Missing Information', text: 'Please fill in the subject and message.' });
      return;
    }

    try {
      setLoadingSubmit(true);
      const res = await api.createSupportTicket({ subject, category, priority, message });
      Swal.fire({
        icon: 'success',
        title: 'Ticket Submitted!',
        text: `Ticket reference ${res.ticketNumber} created. Our support team will respond shortly.`,
        confirmButtonColor: '#1E5BF9'
      });
      setShowNewModal(false);
      setSubject('');
      setMessage('');
      fetchTickets();
    } catch (err: any) {
      Swal.fire({ icon: 'error', title: 'Submission Failed', text: err.message });
    } finally {
      setLoadingSubmit(false);
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyMessage.trim() || !selectedTicket) return;

    try {
      setLoadingReply(true);
      await api.replySupportTicket(selectedTicket.id, replyMessage.trim());
      setReplyMessage('');
      const res = await api.getSupportTicketDetails(selectedTicket.id);
      if (res.success) {
        setTicketReplies(res.replies || []);
      }
    } catch (err: any) {
      Swal.fire({ icon: 'error', title: 'Reply Failed', text: err.message });
    } finally {
      setLoadingReply(false);
    }
  };

  const faqs = [
    {
      q: 'How do I fund my wallet automatically?',
      a: 'Navigate to the Wallet tab. Your dedicated virtual account number (Monnify / Wema Bank) is shown there. Any bank transfer sent to this account credits your wallet immediately with zero delays.'
    },
    {
      q: 'How do I verify and activate a SunKing Solar PIN?',
      a: 'Go to the SunKing Solar PIN tab, enter your SunKing 10-digit account number and select your plan duration (1 Day, 7 Days, or 30 Days). Once purchased, a 16-digit activation code is delivered on-screen and printable on a customer receipt slip.'
    },
    {
      q: 'What is the balance check USSD for data bundles?',
      a: 'MTN SME: Dial *461*4# or SMS "DATABALANCE" to 131. Airtel: Dial *140#. Glo: Dial *127*0#. 9mobile: Dial *228#.'
    },
    {
      q: 'How long does Airtime to Cash take to reflect in my bank?',
      a: 'Once you transfer the airtime to our designated verified line and submit the form, our automated telecom gateway audits the SIM delivery and approves the cash settlement into your wallet within 3 to 10 minutes.'
    },
    {
      q: 'Can I integrate my website with your developer APIs?',
      a: 'Yes! Upgrade to Tier 3 (API Partner) or navigate to the Developer API tab to generate business production API keys, set your IP allowlist, and use our RESTful endpoints with idempotency protection.'
    }
  ];

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <button
            onClick={onBack}
            className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center space-x-1 mb-2"
          >
            ← Back to Dashboard
          </button>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center space-x-2">
            <LifeBuoy className="w-7 h-7 text-blue-600" />
            <span>Help Desk & Customer Support</span>
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            24/7 technical assistance, ticket resolution, instant WhatsApp helpline, and knowledge base
          </p>
        </div>

        <button
          onClick={() => setShowNewModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2.5 rounded-2xl transition shadow-md shadow-blue-500/20 flex items-center space-x-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Open Support Ticket</span>
        </button>
      </div>

      {/* Direct Contact Channels */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <a
          href={`https://wa.me/${whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent('Hello Bukar Data Sub Support, I need assistance with my account.')}`}
          target="_blank"
          rel="noreferrer"
          className="bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 rounded-3xl p-5 transition flex items-center space-x-4 shadow-sm"
        >
          <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md">
            <MessageCircle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-700 block">Instant Chat</span>
            <span className="text-sm font-extrabold text-slate-900 block">WhatsApp Support</span>
            <span className="text-xs text-slate-500 font-mono">{phone}</span>
          </div>
        </a>

        <a
          href={`tel:${phone}`}
          className="bg-blue-50 hover:bg-blue-100 border border-blue-200/80 rounded-3xl p-5 transition flex items-center space-x-4 shadow-sm"
        >
          <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-md">
            <Phone className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-blue-700 block">Direct Hotline</span>
            <span className="text-sm font-extrabold text-slate-900 block">Call Center</span>
            <span className="text-xs text-slate-500 font-mono">{phone}</span>
          </div>
        </a>

        <a
          href={`mailto:${email}`}
          className="bg-purple-50 hover:bg-purple-100 border border-purple-200/80 rounded-3xl p-5 transition flex items-center space-x-4 shadow-sm"
        >
          <div className="w-12 h-12 rounded-2xl bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-md">
            <Mail className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-purple-700 block">Official Email</span>
            <span className="text-sm font-extrabold text-slate-900 block">Support Desk</span>
            <span className="text-xs text-slate-500 truncate block max-w-[140px]">{email}</span>
          </div>
        </a>
      </div>

      {/* Support Mode Tabs */}
      <div className="flex items-center space-x-2 bg-slate-100 p-1.5 rounded-2xl w-fit">
        <button
          onClick={() => setActiveTab('live_chat')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center space-x-2 ${
            activeTab === 'live_chat'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <MessageCircle className="w-4 h-4" />
          <span>Real-Time Live Chat with Staff</span>
        </button>

        <button
          onClick={() => setActiveTab('tickets')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center space-x-2 ${
            activeTab === 'tickets'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <LifeBuoy className="w-4 h-4" />
          <span>Support Tickets ({tickets.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('faqs')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center space-x-2 ${
            activeTab === 'faqs'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <HelpCircle className="w-4 h-4" />
          <span>FAQs</span>
        </button>
      </div>

      {/* Live Chat Section */}
      {activeTab === 'live_chat' && (
        <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm flex flex-col h-[520px]">
          <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
              <div>
                <h3 className="text-xs font-black text-slate-900">Bukar Data Sub Staff Live Help Desk</h3>
                <p className="text-[10px] text-slate-500">Instant direct assistance with payments, data & account security</p>
              </div>
            </div>
            {liveConv && (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
                Ticket: {liveConv.status}
              </span>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/40">
            {loadingChat && !liveConv ? (
              <div className="py-20 text-center text-slate-400 text-xs">Connecting to support...</div>
            ) : !liveConv ? (
              <div className="py-20 text-center space-y-3">
                <MessageSquare className="w-12 h-12 text-slate-300 mx-auto" />
                <div>
                  <h4 className="text-sm font-black text-slate-800">No Active Chat Session</h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                    Need immediate assistance with a transaction or question? Start a real-time chat with our support team.
                  </p>
                </div>
                <button
                  onClick={handleStartLiveChat}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm transition"
                >
                  Start Live Chat Now
                </button>
              </div>
            ) : chatMessages.length === 0 ? (
              <div className="py-20 text-center text-slate-400 text-xs">
                Chat session started. Write a message below and an agent will reply shortly.
              </div>
            ) : (
              chatMessages.map((m: any) => {
                const isMe = m.sender_type === 'USER';
                return (
                  <div key={m.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                    <span className="text-[10px] text-slate-400 mb-0.5 font-medium">
                      {isMe ? 'You' : m.sender_name} • {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <div className={`max-w-sm p-3 rounded-2xl text-xs leading-relaxed ${
                      isMe ? 'bg-blue-600 text-white rounded-br-xs' : 'bg-white border border-slate-200 text-slate-800 rounded-bl-xs shadow-xs'
                    }`}>
                      <p className="whitespace-pre-wrap">{m.message}</p>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={chatBottomRef} />
          </div>

          {liveConv && (
            <form onSubmit={handleSendChatMessage} className="p-3 border-t border-slate-100 bg-white flex items-center space-x-2">
              <input
                type="text"
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                placeholder="Type your message to support..."
                className="flex-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-blue-600 font-medium"
              />
              <button
                type="submit"
                disabled={!chatInput.trim() || sendingChat}
                className="p-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition disabled:opacity-40"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>
      )}

      {/* Support Tickets Section */}
      {activeTab === 'tickets' && (
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-black text-slate-900">Your Support Tickets</h3>
            <p className="text-xs text-slate-500 font-medium">Track your submitted queries and agent replies</p>
          </div>
          <button
            onClick={fetchTickets}
            className="p-2 text-slate-500 hover:text-slate-800 rounded-xl hover:bg-slate-50 transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-400 text-xs">Loading tickets...</div>
        ) : tickets.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 rounded-2xl space-y-1">
            <HelpCircle className="w-8 h-8 text-slate-300 mx-auto" />
            <div className="text-xs font-bold text-slate-600">No open tickets</div>
            <p className="text-[11px] text-slate-400">Everything looks great! If you encounter any issue, open a ticket.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {tickets.map(tkt => (
              <div
                key={tkt.id}
                onClick={() => handleOpenTicket(tkt)}
                className="py-3.5 px-3 rounded-2xl hover:bg-slate-50 transition cursor-pointer flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-[11px] font-bold text-blue-600">{tkt.ticket_number}</span>
                    <span className="font-bold text-xs text-slate-900">{tkt.subject}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium">
                    Category: {tkt.category} • Created: {new Date(tkt.created_at).toLocaleDateString()}
                  </span>
                </div>

                <div className="flex items-center space-x-3">
                  <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${
                    tkt.status === 'RESOLVED'
                      ? 'bg-emerald-50 text-emerald-700'
                      : tkt.status === 'OPEN'
                      ? 'bg-blue-50 text-blue-700'
                      : 'bg-amber-50 text-amber-700'
                  }`}>
                    {tkt.status}
                  </span>
                  <span className="text-xs text-slate-400">→</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      )}

      {/* Frequently Asked Questions Accordion */}
      {activeTab === 'faqs' && (
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
        <div>
          <h3 className="text-base font-black text-slate-900">Frequently Asked Questions</h3>
          <p className="text-xs text-slate-500 font-medium">Quick answers to common questions about services and funding</p>
        </div>

        <div className="space-y-2">
          {faqs.map((faq, idx) => (
            <div key={idx} className="border border-slate-100 rounded-2xl overflow-hidden">
              <button
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                className="w-full text-left px-4 py-3 bg-slate-50/50 hover:bg-slate-50 transition flex items-center justify-between font-bold text-xs text-slate-800"
              >
                <span>{faq.q}</span>
                {openFaq === idx ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
              </button>
              {openFaq === idx && (
                <div className="p-4 text-xs text-slate-600 font-medium leading-relaxed bg-white border-t border-slate-100">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      )}

      {/* New Ticket Modal */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-lg p-6 shadow-2xl relative">
            <button
              onClick={() => setShowNewModal(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-black text-slate-900 mb-1">Create Support Ticket</h3>
            <p className="text-xs text-slate-500 font-medium mb-4">Our dedicated operations desk will respond promptly</p>

            <form onSubmit={handleCreateTicket} className="space-y-3.5">
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Subject</label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  placeholder="e.g. Delayed 2GB MTN Data to 08031234567"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Category</label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700"
                  >
                    <option value="Transaction Issue">Transaction Issue</option>
                    <option value="Wallet Funding">Wallet Funding</option>
                    <option value="Solar PIN Delivery">Solar PIN Delivery</option>
                    <option value="SIM Hosting Gateway">SIM Hosting Gateway</option>
                    <option value="Developer API">Developer API</option>
                    <option value="Other Inquiries">Other Inquiries</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Priority</label>
                  <select
                    value={priority}
                    onChange={e => setPriority(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High (Urgent)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Message Details</label>
                <textarea
                  rows={4}
                  required
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="Provide transaction reference, recipient phone, or details of the inquiry..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="bg-slate-100 text-slate-700 font-bold text-xs px-4 py-2.5 rounded-xl hover:bg-slate-200 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loadingSubmit}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-6 py-2.5 rounded-xl transition shadow-md shadow-blue-500/20 disabled:opacity-50"
                >
                  {loadingSubmit ? 'Submitting...' : 'Submit Ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Ticket Discussion Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-lg p-6 shadow-2xl relative flex flex-col max-h-[85vh]">
            <button
              onClick={() => setSelectedTicket(null)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="border-b border-slate-100 pb-3 mb-3">
              <span className="font-mono text-xs font-bold text-blue-600">{selectedTicket.ticket_number}</span>
              <h3 className="text-base font-black text-slate-900">{selectedTicket.subject}</h3>
              <span className="text-[11px] text-slate-400">
                Status: <strong>{selectedTicket.status}</strong> • Priority: {selectedTicket.priority}
              </span>
            </div>

            {/* Conversation Thread */}
            <div className="flex-1 overflow-y-auto space-y-3 p-1 mb-4">
              {ticketReplies.map(rep => (
                <div
                  key={rep.id}
                  className={`p-3.5 rounded-2xl text-xs space-y-1 ${
                    rep.sender_type === 'STAFF'
                      ? 'bg-blue-50 border border-blue-100 text-blue-900 ml-4'
                      : 'bg-slate-100 text-slate-800 mr-4'
                  }`}
                >
                  <div className="flex justify-between items-center text-[10px] font-bold">
                    <span className={rep.sender_type === 'STAFF' ? 'text-blue-700' : 'text-slate-500'}>
                      {rep.sender_type === 'STAFF' ? 'Support Desk Officer' : 'You'}
                    </span>
                    <span className="text-slate-400">{new Date(rep.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <p className="font-medium whitespace-pre-wrap">{rep.message}</p>
                </div>
              ))}
            </div>

            {/* Reply Input */}
            <form onSubmit={handleSendReply} className="flex gap-2 border-t border-slate-100 pt-3">
              <input
                type="text"
                value={replyMessage}
                onChange={e => setReplyMessage(e.target.value)}
                placeholder="Type your response..."
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                disabled={loadingReply || !replyMessage.trim()}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition flex items-center space-x-1 disabled:opacity-40"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
