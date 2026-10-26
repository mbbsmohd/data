/**
 * ==============================================================================
 * BUKAR DATA SUB — STAFF TASK ASSIGNMENT & OPERATIONAL DELEGATION CENTER
 * ==============================================================================
 * Comprehensive task management module for administrators to create, assign,
 * track, investigate, collaborate on, and resolve operational tasks.
 */

import React, { useState, useEffect } from 'react';
import {
  CheckSquare, Plus, Filter, Search, Clock, AlertTriangle, CheckCircle2,
  XCircle, User, MessageSquare, ArrowRight, Calendar, Flag, Shield,
  RefreshCw, ChevronRight, FileText, Send, UserCheck, Lock
} from 'lucide-react';
import Swal from 'sweetalert2';
import { api } from '../../services/api';

interface StaffTask {
  id: string;
  task_id_display: string;
  title: string;
  description: string;
  category: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  assigned_to_user_id?: string;
  assigned_to_name?: string;
  created_by_user_id: string;
  created_by_name: string;
  due_date?: string;
  status: 'OPEN' | 'ASSIGNED' | 'IN_PROGRESS' | 'WAITING_INFO' | 'PENDING_APPROVAL' | 'RESOLVED' | 'CLOSED' | 'REOPENED';
  related_user_id?: string;
  related_reference?: string;
  resolution_notes?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

interface TaskComment {
  id: string;
  task_id: string;
  user_name: string;
  user_role: string;
  comment: string;
  created_at: string;
}

interface StaffMember {
  id: string;
  name: string;
  email: string;
  role: string;
  sub_admin_role?: string;
}

export const StaffTaskManagement: React.FC = () => {
  const [tasks, setTasks] = useState<StaffTask[]>([]);
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [summary, setSummary] = useState<any>({ open: 0, assigned: 0, in_progress: 0, waiting_info: 0, resolved: 0, closed: 0 });

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals & Active State
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [selectedTask, setSelectedTask] = useState<StaffTask | null>(null);
  const [taskComments, setTaskComments] = useState<TaskComment[]>([]);
  const [newComment, setNewComment] = useState<string>('');
  const [submittingComment, setSubmittingComment] = useState<boolean>(false);

  // Form State for New Task
  const [newTaskForm, setNewTaskForm] = useState({
    title: '',
    description: '',
    category: 'GENERAL',
    priority: 'MEDIUM',
    assignedToUserId: '',
    dueDate: '',
    relatedReference: ''
  });

  useEffect(() => {
    loadTasks();
    loadStaffList();
  }, [statusFilter, priorityFilter, categoryFilter]);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (priorityFilter !== 'all') params.append('priority', priorityFilter);
      if (categoryFilter !== 'all') params.append('category', categoryFilter);
      if (searchQuery) params.append('search', searchQuery);

      const res: any = await api.get(`/api/admin/tasks?${params.toString()}`);
      if (res.success) {
        setTasks(res.tasks || []);
        if (res.summary) setSummary(res.summary);
      }
    } catch (err: any) {
      console.error('Failed to load tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadStaffList = async () => {
    try {
      const res: any = await api.get('/api/admin/tasks/staff/list');
      if (res.success) {
        setStaffList(res.staff || []);
      }
    } catch (err) {
      console.error('Failed to load staff list:', err);
    }
  };

  const handleSelectTask = async (task: StaffTask) => {
    setSelectedTask(task);
    try {
      const res: any = await api.get(`/api/admin/tasks/${task.id}`);
      if (res.success) {
        setTaskComments(res.comments || []);
      }
    } catch {
      setTaskComments([]);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskForm.title || !newTaskForm.description) {
      Swal.fire('Required Fields', 'Please provide a task title and description.', 'warning');
      return;
    }

    try {
      const res: any = await api.post('/api/admin/tasks', newTaskForm);
      if (res.success) {
        Swal.fire({
          icon: 'success',
          title: 'Task Created',
          text: `Operational task ${res.taskIdDisplay} has been successfully logged.`,
          timer: 2000,
          showConfirmButton: false
        });
        setShowCreateModal(false);
        setNewTaskForm({
          title: '',
          description: '',
          category: 'GENERAL',
          priority: 'MEDIUM',
          assignedToUserId: '',
          dueDate: '',
          relatedReference: ''
        });
        loadTasks();
      }
    } catch (err: any) {
      Swal.fire('Error', err.message || 'Failed to create task', 'error');
    }
  };

  const handleUpdateStatus = async (taskId: string, newStatus: string) => {
    try {
      let resolutionNotes = '';
      if (newStatus === 'RESOLVED' || newStatus === 'CLOSED') {
        const { value: notes } = await Swal.fire({
          title: 'Resolution Details',
          input: 'textarea',
          inputLabel: 'Provide final resolution or investigation notes:',
          inputPlaceholder: 'Explain how the issue or task was addressed...',
          showCancelButton: true,
          confirmButtonColor: '#1E5BF9'
        });
        if (notes === undefined) return;
        resolutionNotes = notes;
      }

      const res: any = await api.patch(`/api/admin/tasks/${taskId}/status`, {
        status: newStatus,
        resolutionNotes
      });

      if (res.success) {
        Swal.fire({ icon: 'success', title: 'Status Updated', text: `Task updated to ${newStatus}`, timer: 1500, showConfirmButton: false });
        loadTasks();
        if (selectedTask && selectedTask.id === taskId) {
          setSelectedTask({ ...selectedTask, status: newStatus as any, resolution_notes: resolutionNotes || selectedTask.resolution_notes });
        }
      }
    } catch (err: any) {
      Swal.fire('Error', err.message || 'Failed to update status', 'error');
    }
  };

  const handlePostComment = async () => {
    if (!newComment.trim() || !selectedTask) return;
    try {
      setSubmittingComment(true);
      const res: any = await api.post(`/api/admin/tasks/${selectedTask.id}/comments`, {
        comment: newComment.trim()
      });
      if (res.success && res.comment) {
        setTaskComments([...taskComments, res.comment]);
        setNewComment('');
      }
    } catch (err: any) {
      Swal.fire('Error', err.message || 'Could not post comment', 'error');
    } finally {
      setSubmittingComment(false);
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'CRITICAL':
        return <span className="px-2.5 py-1 text-xs font-black uppercase rounded-lg bg-rose-100 text-rose-800 border border-rose-300">Critical</span>;
      case 'HIGH':
        return <span className="px-2.5 py-1 text-xs font-black uppercase rounded-lg bg-orange-100 text-orange-800 border border-orange-300">High</span>;
      case 'MEDIUM':
        return <span className="px-2.5 py-1 text-xs font-black uppercase rounded-lg bg-blue-100 text-blue-800 border border-blue-300">Medium</span>;
      default:
        return <span className="px-2.5 py-1 text-xs font-black uppercase rounded-lg bg-slate-100 text-slate-700 border border-slate-300">Low</span>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'OPEN':
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-slate-100 text-slate-700 border border-slate-300">Open</span>;
      case 'ASSIGNED':
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-indigo-100 text-indigo-800 border border-indigo-300">Assigned</span>;
      case 'IN_PROGRESS':
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-blue-100 text-blue-800 border border-blue-300">In Progress</span>;
      case 'WAITING_INFO':
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-amber-100 text-amber-800 border border-amber-300">Waiting Info</span>;
      case 'RESOLVED':
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">Resolved</span>;
      case 'CLOSED':
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-slate-200 text-slate-800 border border-slate-400">Closed</span>;
      default:
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-slate-100 text-slate-700">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Metrics Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-2xl border border-blue-200">
              <CheckSquare className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Staff Task Assignment & Operations</h2>
              <p className="text-slate-600 text-sm font-medium">Delegate disputes, KYC reviews, withdrawal audits, and VTU issues with audit tracking</p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={loadTasks}
            className="p-3 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-2xl border border-slate-200 transition"
            title="Refresh Tasks"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin text-blue-600' : ''}`} />
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold px-5 py-3 rounded-2xl shadow-md transition active:scale-[0.98] flex items-center space-x-2 text-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Create Task</span>
          </button>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Total Open</span>
          <span className="text-2xl font-black text-slate-900 mt-1 block">{summary.open || 0}</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider block">Assigned</span>
          <span className="text-2xl font-black text-indigo-700 mt-1 block">{summary.assigned || 0}</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-bold text-blue-600 uppercase tracking-wider block">In Progress</span>
          <span className="text-2xl font-black text-blue-700 mt-1 block">{summary.in_progress || 0}</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-bold text-amber-600 uppercase tracking-wider block">Waiting Info</span>
          <span className="text-2xl font-black text-amber-700 mt-1 block">{summary.waiting_info || 0}</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider block">Resolved</span>
          <span className="text-2xl font-black text-emerald-700 mt-1 block">{summary.resolved || 0}</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Closed</span>
          <span className="text-2xl font-black text-slate-700 mt-1 block">{summary.closed || 0}</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[220px] relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by title, TSK-ID, or reference..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && loadTasks()}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-slate-50 border border-slate-200 text-slate-700 text-sm font-semibold rounded-xl px-3 py-2.5 focus:outline-none"
        >
          <option value="all">All Statuses</option>
          <option value="OPEN">Open</option>
          <option value="ASSIGNED">Assigned</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="WAITING_INFO">Waiting Info</option>
          <option value="RESOLVED">Resolved</option>
          <option value="CLOSED">Closed</option>
        </select>

        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="bg-slate-50 border border-slate-200 text-slate-700 text-sm font-semibold rounded-xl px-3 py-2.5 focus:outline-none"
        >
          <option value="all">All Priorities</option>
          <option value="CRITICAL">Critical</option>
          <option value="HIGH">High</option>
          <option value="MEDIUM">Medium</option>
          <option value="LOW">Low</option>
        </select>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="bg-slate-50 border border-slate-200 text-slate-700 text-sm font-semibold rounded-xl px-3 py-2.5 focus:outline-none"
        >
          <option value="all">All Categories</option>
          <option value="DISPUTE">Disputes</option>
          <option value="WITHDRAWAL_REVIEW">Withdrawals</option>
          <option value="KYC_AUDIT">KYC Audits</option>
          <option value="VTU_INVESTIGATION">VTU Investigations</option>
          <option value="SYSTEM_MAINTENANCE">System Maintenance</option>
          <option value="GENERAL">General</option>
        </select>
      </div>

      {/* Tasks Table / List */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 space-y-3">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-blue-600" />
            <p className="font-semibold text-sm">Loading staff tasks...</p>
          </div>
        ) : tasks.length === 0 ? (
          <div className="p-16 text-center text-slate-500 space-y-2">
            <CheckSquare className="w-12 h-12 stroke-[1.5] mx-auto text-slate-300" />
            <h4 className="text-lg font-bold text-slate-800">No operational tasks found</h4>
            <p className="text-sm text-slate-500 max-w-sm mx-auto">
              All delegated tasks are clear. Click "Create Task" above to assign an operational assignment to staff.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[12px] font-black uppercase text-slate-500 tracking-wider">
                  <th className="py-3.5 px-4">Task ID</th>
                  <th className="py-3.5 px-4">Title & Context</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Priority</th>
                  <th className="py-3.5 px-4">Assignee</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm font-medium text-slate-700">
                {tasks.map((task) => (
                  <tr
                    key={task.id}
                    onClick={() => handleSelectTask(task)}
                    className="hover:bg-blue-50/50 cursor-pointer transition"
                  >
                    <td className="py-4 px-4 font-mono font-bold text-blue-700">
                      {task.task_id_display}
                    </td>
                    <td className="py-4 px-4 max-w-xs">
                      <div className="font-bold text-slate-900 truncate">{task.title}</div>
                      <div className="text-xs text-slate-500 truncate">{task.description}</div>
                      {task.related_reference && (
                        <span className="text-[11px] font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded mt-1 inline-block">
                          Ref: {task.related_reference}
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-xs font-bold text-slate-600">
                      {task.category.replace(/_/g, ' ')}
                    </td>
                    <td className="py-4 px-4">
                      {getPriorityBadge(task.priority)}
                    </td>
                    <td className="py-4 px-4">
                      {task.assigned_to_name ? (
                        <div className="flex items-center space-x-1.5">
                          <User className="w-3.5 h-3.5 text-blue-600" />
                          <span className="font-semibold text-slate-800">{task.assigned_to_name}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic">Unassigned</span>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      {getStatusBadge(task.status)}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectTask(task);
                        }}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-blue-600 hover:text-white rounded-xl text-xs font-bold transition flex items-center space-x-1 ml-auto"
                      >
                        <span>Inspect</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Task Inspection & Comment Drawer/Modal */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white w-full max-w-2xl rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col animate-scale-in">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-200 pb-4">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-xs font-black text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
                    {selectedTask.task_id_display}
                  </span>
                  {getPriorityBadge(selectedTask.priority)}
                  {getStatusBadge(selectedTask.status)}
                </div>
                <h3 className="text-xl font-black text-slate-900 mt-2">{selectedTask.title}</h3>
                <span className="text-xs text-slate-500 font-medium">
                  Logged on {new Date(selectedTask.created_at).toLocaleString('en-NG')} by {selectedTask.created_by_name}
                </span>
              </div>
              <button
                onClick={() => setSelectedTask(null)}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full"
              >
                ✕
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
              {/* Description */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-xs font-black uppercase text-slate-500 block mb-1">Task Specification</span>
                <p className="text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">{selectedTask.description}</p>
              </div>

              {/* Status Change Control */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-blue-50/50 rounded-2xl border border-blue-100">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Operational Status</label>
                  <select
                    value={selectedTask.status}
                    onChange={(e) => handleUpdateStatus(selectedTask.id, e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm font-bold text-slate-800"
                  >
                    <option value="OPEN">OPEN</option>
                    <option value="ASSIGNED">ASSIGNED</option>
                    <option value="IN_PROGRESS">IN PROGRESS</option>
                    <option value="WAITING_INFO">WAITING FOR INFO</option>
                    <option value="PENDING_APPROVAL">PENDING APPROVAL</option>
                    <option value="RESOLVED">RESOLVED</option>
                    <option value="CLOSED">CLOSED</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Assigned Staff</label>
                  <div className="flex items-center text-sm font-bold text-slate-800 bg-white border border-slate-300 rounded-xl px-3 py-2">
                    <UserCheck className="w-4 h-4 text-blue-600 mr-2" />
                    <span>{selectedTask.assigned_to_name || 'Unassigned'}</span>
                  </div>
                </div>
              </div>

              {/* Resolution Notes if Resolved */}
              {selectedTask.resolution_notes && (
                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200">
                  <span className="text-xs font-black uppercase text-emerald-800 block mb-1">Resolution Summary</span>
                  <p className="text-sm text-emerald-900 whitespace-pre-wrap leading-relaxed">{selectedTask.resolution_notes}</p>
                </div>
              )}

              {/* Comment Thread */}
              <div>
                <span className="text-xs font-black uppercase text-slate-500 tracking-wider block mb-2 flex items-center space-x-1.5">
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Audit Thread & Staff Comments ({taskComments.length})</span>
                </span>
                <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                  {taskComments.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">No notes posted yet.</p>
                  ) : (
                    taskComments.map((cmnt) => (
                      <div key={cmnt.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                        <div className="flex justify-between items-center text-slate-500 mb-1">
                          <span className="font-bold text-slate-800">{cmnt.user_name} ({cmnt.user_role})</span>
                          <span>{new Date(cmnt.created_at).toLocaleTimeString()}</span>
                        </div>
                        <p className="text-slate-700 whitespace-pre-wrap">{cmnt.comment}</p>
                      </div>
                    ))
                  )}
                </div>

                {/* Add Comment input */}
                <div className="flex gap-2 mt-3">
                  <input
                    type="text"
                    placeholder="Add an operational audit note..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handlePostComment()}
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:bg-white"
                  />
                  <button
                    onClick={handlePostComment}
                    disabled={submittingComment || !newComment.trim()}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-xl text-xs transition disabled:opacity-50 flex items-center space-x-1"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Post</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setSelectedTask(null)}
                className="bg-slate-900 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition"
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Task Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white w-full max-w-lg rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 animate-scale-in">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3 mb-4">
              <h3 className="text-xl font-black text-slate-900">Create Operational Task</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Task Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Investigate Pending Airtime Callback from VTPass"
                  value={newTaskForm.title}
                  onChange={(e) => setNewTaskForm({ ...newTaskForm, title: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Task Description & Context *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Describe the issue, customer reference, or audit required..."
                  value={newTaskForm.description}
                  onChange={(e) => setNewTaskForm({ ...newTaskForm, description: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Category</label>
                  <select
                    value={newTaskForm.category}
                    onChange={(e) => setNewTaskForm({ ...newTaskForm, category: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-semibold"
                  >
                    <option value="GENERAL">General</option>
                    <option value="DISPUTE">Dispute</option>
                    <option value="WITHDRAWAL_REVIEW">Withdrawal Review</option>
                    <option value="KYC_AUDIT">KYC Audit</option>
                    <option value="VTU_INVESTIGATION">VTU Investigation</option>
                    <option value="SYSTEM_MAINTENANCE">System Maintenance</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Priority</label>
                  <select
                    value={newTaskForm.priority}
                    onChange={(e) => setNewTaskForm({ ...newTaskForm, priority: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-semibold"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Assign to Staff</label>
                  <select
                    value={newTaskForm.assignedToUserId}
                    onChange={(e) => setNewTaskForm({ ...newTaskForm, assignedToUserId: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-semibold"
                  >
                    <option value="">Leave Unassigned</option>
                    {staffList.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.role})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Related Reference</label>
                  <input
                    type="text"
                    placeholder="e.g. TXN-20261026-9812"
                    value={newTaskForm.relatedReference}
                    onChange={(e) => setNewTaskForm({ ...newTaskForm, relatedReference: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-5 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl text-sm font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold px-6 py-2.5 rounded-xl text-sm transition shadow-md"
                >
                  Create & Dispatch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
