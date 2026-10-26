import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare, Send, CheckCircle, Clock, AlertCircle, RefreshCw,
  Search, Lock, User, Check, Shield, FileText, ChevronRight
} from 'lucide-react';
import Swal from 'sweetalert2';
import { api } from '../../services/api';

export const CustomerSupportLiveChat: React.FC = () => {
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConv, setSelectedConv] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingConv, setLoadingConv] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchConversations = async (status = statusFilter) => {
    try {
      setLoadingConv(true);
      const res = await api.getSupportConversations(status === 'ALL' ? undefined : status);
      if (res && res.success) {
        setConversations(res.conversations || []);
        if (selectedConv) {
          const updated = (res.conversations || []).find((c: any) => c.id === selectedConv.id);
          if (updated) setSelectedConv(updated);
        }
      }
    } catch (err: any) {
      console.error('Failed to fetch support conversations:', err);
    } finally {
      setLoadingConv(false);
    }
  };

  const fetchMessages = async (convId: string) => {
    try {
      setLoadingMessages(true);
      const res = await api.getSupportConversationMessages(convId);
      if (res && res.success) {
        setMessages(res.messages || []);
      }
    } catch (err: any) {
      console.error('Failed to fetch messages:', err);
    } finally {
      setLoadingMessages(false);
    }
  };

  useEffect(() => {
    fetchConversations(statusFilter);
    const interval = setInterval(() => {
      fetchConversations(statusFilter);
      if (selectedConv) fetchMessages(selectedConv.id);
    }, 6000);
    return () => clearInterval(interval);
  }, [statusFilter]);

  useEffect(() => {
    if (selectedConv) {
      fetchMessages(selectedConv.id);
    }
  }, [selectedConv?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedConv || !newMessage.trim() || sending) return;

    try {
      setSending(true);
      const text = newMessage.trim();
      const internal = isInternalNote;
      setNewMessage('');

      await api.sendSupportChatMessage(selectedConv.id, {
        message: text,
        isInternalNote: internal
      });

      setIsInternalNote(false);
      fetchMessages(selectedConv.id);
      fetchConversations();
    } catch (err: any) {
      Swal.fire({ icon: 'error', title: 'Send Failed', text: err.message });
    } finally {
      setSending(false);
    }
  };

  const handleUpdateStatus = async (convId: string, newStatus: string) => {
    try {
      await api.updateSupportConversation(convId, { status: newStatus });
      fetchConversations();
      if (selectedConv && selectedConv.id === convId) {
        setSelectedConv({ ...selectedConv, status: newStatus });
      }
    } catch (err: any) {
      Swal.fire({ icon: 'error', title: 'Status Update Failed', text: err.message });
    }
  };

  const quickReplies = [
    'Hello! We are currently investigating your transaction reference.',
    'Your wallet balance has been successfully credited.',
    'Could you please share your transaction reference or session ID?',
    'This issue has been resolved. Thank you for using Bukar Data Sub!'
  ];

  const filteredConversations = conversations.filter(c => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.user_name.toLowerCase().includes(q) ||
      c.user_email.toLowerCase().includes(q) ||
      (c.subject || '').toLowerCase().includes(q) ||
      (c.last_message_text || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden h-[calc(100vh-180px)] min-h-[600px] flex flex-col">
      {/* Top Bar */}
      <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-pink-600 rounded-2xl text-white shadow-md shadow-pink-500/20">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-black text-slate-900 tracking-tight flex items-center space-x-2">
              <span>Customer Support Live Chat Command</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-pink-100 text-pink-700">
                Staff Desk
              </span>
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Real-time two-way messaging, unread message tracking, and private internal staff notes.
            </p>
          </div>
        </div>

        <button
          onClick={() => fetchConversations()}
          className="p-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition text-slate-600 shadow-xs"
          title="Refresh Messages"
        >
          <RefreshCw className={`w-4 h-4 ${loadingConv ? 'animate-spin text-pink-600' : ''}`} />
        </button>
      </div>

      {/* Main Split Screen */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Pane: Conversation List */}
        <div className="w-80 md:w-96 border-r border-slate-200 flex flex-col bg-slate-50/40 shrink-0">
          {/* Search & Filter Bar */}
          <div className="p-3 border-b border-slate-200 space-y-2 bg-white">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search inquiries or email..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-pink-500"
              />
            </div>

            <div className="flex items-center space-x-1 overflow-x-auto text-[11px] font-bold">
              {['ALL', 'OPEN', 'PENDING', 'RESOLVED', 'CLOSED'].map(s => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-2.5 py-1 rounded-lg transition whitespace-nowrap ${
                    statusFilter === s
                      ? 'bg-pink-600 text-white font-black shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Conversations Thread */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {loadingConv && conversations.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-pink-600" />
                <span className="text-xs">Loading conversations...</span>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-8 text-center text-slate-400 space-y-1">
                <MessageSquare className="w-8 h-8 mx-auto text-slate-300" />
                <p className="text-xs font-bold">No active conversations found</p>
                <p className="text-[11px]">When customers write to support, tickets will appear here.</p>
              </div>
            ) : (
              filteredConversations.map(conv => {
                const isSelected = selectedConv?.id === conv.id;
                return (
                  <div
                    key={conv.id}
                    onClick={() => setSelectedConv(conv)}
                    className={`p-3.5 cursor-pointer transition flex items-start justify-between space-x-2 ${
                      isSelected ? 'bg-pink-50/70 border-l-4 border-pink-600' : 'hover:bg-white'
                    }`}
                  >
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-black text-xs text-slate-900 truncate">
                          {conv.user_name}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(conv.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-[11px] font-semibold text-slate-600 truncate">
                        {conv.subject || 'Support Inquiry'}
                      </p>
                      <p className="text-[11px] text-slate-500 truncate">
                        {conv.last_message_text || 'No messages yet'}
                      </p>
                    </div>

                    <div className="flex flex-col items-end space-y-1 shrink-0">
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                        conv.status === 'OPEN'
                          ? 'bg-rose-100 text-rose-800'
                          : conv.status === 'PENDING'
                          ? 'bg-amber-100 text-amber-800'
                          : conv.status === 'RESOLVED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {conv.status}
                      </span>
                      {conv.unread_admin_count > 0 && (
                        <span className="w-4 h-4 rounded-full bg-pink-600 text-white text-[10px] font-black flex items-center justify-center">
                          {conv.unread_admin_count}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Pane: Active Message Thread */}
        <div className="flex-1 flex flex-col bg-white">
          {selectedConv ? (
            <>
              {/* Active Conversation Top Bar */}
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/40">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-full bg-pink-600 text-white font-black text-sm flex items-center justify-center">
                    {selectedConv.user_name[0]?.toUpperCase() || 'U'}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-black text-xs text-slate-900">{selectedConv.user_name}</span>
                      <span className="text-[11px] text-slate-400">({selectedConv.user_email})</span>
                    </div>
                    <span className="text-[11px] text-slate-500 font-medium block">
                      Subject: {selectedConv.subject}
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="text-xs text-slate-500 font-bold">Status:</span>
                  <select
                    value={selectedConv.status}
                    onChange={e => handleUpdateStatus(selectedConv.id, e.target.value)}
                    className="p-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 focus:outline-none"
                  >
                    <option value="OPEN">OPEN (Needs Action)</option>
                    <option value="PENDING">PENDING (Waiting Customer)</option>
                    <option value="RESOLVED">RESOLVED (Completed)</option>
                    <option value="CLOSED">CLOSED (Archived)</option>
                  </select>
                </div>
              </div>

              {/* Message Bubbles Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/30">
                {loadingMessages && messages.length === 0 ? (
                  <div className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-pink-600" />
                    <span className="text-xs">Loading message thread...</span>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 text-xs font-medium">
                    No messages in this inquiry thread yet. Write a message below to begin.
                  </div>
                ) : (
                  messages.map((m: any) => {
                    const isStaff = m.sender_type === 'ADMIN';
                    const isNote = Boolean(m.is_internal_note);

                    return (
                      <div
                        key={m.id}
                        className={`flex flex-col ${isStaff ? 'items-end' : 'items-start'}`}
                      >
                        <div className="flex items-center space-x-1.5 text-[10px] text-slate-400 mb-0.5">
                          <span className="font-bold text-slate-600">{m.sender_name}</span>
                          <span>•</span>
                          <span>{new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          {isNote && (
                            <span className="px-1.5 py-0.2 bg-amber-100 text-amber-800 rounded font-black text-[9px] uppercase">
                              Internal Staff Note
                            </span>
                          )}
                        </div>

                        <div
                          className={`max-w-md p-3 rounded-2xl text-xs leading-relaxed ${
                            isNote
                              ? 'bg-amber-50 border border-amber-300 text-amber-900 shadow-xs'
                              : isStaff
                              ? 'bg-blue-600 text-white rounded-br-xs shadow-xs'
                              : 'bg-white border border-slate-200 text-slate-800 rounded-bl-xs shadow-xs'
                          }`}
                        >
                          <p className="whitespace-pre-wrap">{m.message}</p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Replies Bar */}
              <div className="px-4 py-2 border-t border-slate-100 bg-white flex items-center space-x-2 overflow-x-auto">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 shrink-0">
                  Quick Replies:
                </span>
                {quickReplies.map((qr, i) => (
                  <button
                    key={i}
                    onClick={() => setNewMessage(qr)}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-semibold whitespace-nowrap transition"
                  >
                    {qr.slice(0, 32)}...
                  </button>
                ))}
              </div>

              {/* Message Composer */}
              <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-200 bg-white space-y-2">
                <div className="flex items-center justify-between text-xs px-1">
                  <label className="flex items-center space-x-2 cursor-pointer text-slate-700 font-bold">
                    <input
                      type="checkbox"
                      checked={isInternalNote}
                      onChange={e => setIsInternalNote(e.target.checked)}
                      className="rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                    />
                    <span className={isInternalNote ? 'text-amber-700 font-black' : ''}>
                      🔒 Staff Internal Note (Invisible to customer)
                    </span>
                  </label>
                </div>

                <div className="flex items-center space-x-2">
                  <textarea
                    rows={2}
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder={
                      isInternalNote
                        ? 'Type staff private note (visible to administrators only)...'
                        : 'Reply to customer (Press Enter to send)...'
                    }
                    className={`flex-1 p-2.5 rounded-xl border text-xs focus:outline-none transition ${
                      isInternalNote
                        ? 'bg-amber-50/60 border-amber-300 text-amber-900 placeholder-amber-400 focus:ring-1 focus:ring-amber-500'
                        : 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400 focus:ring-1 focus:ring-blue-600'
                    }`}
                  />

                  <button
                    type="submit"
                    disabled={!newMessage.trim() || sending}
                    className={`p-3 rounded-xl text-white font-bold transition flex items-center justify-center shrink-0 disabled:opacity-40 ${
                      isInternalNote ? 'bg-amber-600 hover:bg-amber-700' : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400 space-y-3">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-300">
                <MessageSquare className="w-8 h-8" />
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-700">No Conversation Selected</h4>
                <p className="text-xs text-slate-500 max-w-sm mt-0.5">
                  Select a customer support thread from the left pane to view messages, post staff replies, and record internal notes.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
