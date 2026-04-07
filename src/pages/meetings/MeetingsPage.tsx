import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, Video, Plus, X, Loader2, Users } from 'lucide-react';
import { Card, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { useAuth } from '../../context/useAuth';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { Calendar as BigCalendar, dateFnsLocalizer, Event as CalendarEvent } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import enUS from 'date-fns/locale/en-US';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const locales = {
  'en-US': enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

const statusColors: Record<string, 'primary' | 'success' | 'error' | 'warning' | 'secondary'> = {
  pending: 'warning',
  accepted: 'success',
  rejected: 'error',
  completed: 'secondary',
};

export const MeetingsPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [meetings, setMeetings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [investors, setInvestors] = useState<any[]>([]);
  const [entrepreneurs, setEntrepreneurs] = useState<any[]>([]);

  const [form, setForm] = useState({
    attendeeId: '',
    title: '',
    description: '',
    startTime: '',
    endTime: '',
  });

  const fetchMeetings = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/meetings');
      setMeetings(res.data || []);
    } catch (err) {
      toast.error('Failed to load meetings');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMeetings();
    // Load potential attendees based on current user role
    const loadUsers = async () => {
      try {
        const [invRes, entRes] = await Promise.all([
          api.get('/profiles/investors'),
          api.get('/profiles/entrepreneurs'),
        ]);
        setInvestors(invRes.data || []);
        setEntrepreneurs(entRes.data || []);
      } catch (err) {
        // ignore — not critical
      }
    };
    loadUsers();
  }, []);

  const allUsers = [...investors, ...entrepreneurs].filter(u => (u._id || u.id) !== user?.id);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.attendeeId || !form.title || !form.startTime || !form.endTime) {
      toast.error('Please fill in all required fields');
      return;
    }
    try {
      setIsSubmitting(true);
      await api.post('/meetings', {
        attendeeId: form.attendeeId,
        title: form.title,
        description: form.description,
        startTime: new Date(form.startTime).toISOString(),
        endTime: new Date(form.endTime).toISOString(),
      });
      toast.success('Meeting scheduled successfully!');
      setShowModal(false);
      setForm({ attendeeId: '', title: '', description: '', startTime: '', endTime: '' });
      fetchMeetings();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to schedule meeting');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusUpdate = async (id: string, status: string) => {
    try {
      await api.put(`/meetings/${id}/status`, { status });
      setMeetings(prev => prev.map(m => (m._id === id ? { ...m, status } : m)));
      toast.success(`Meeting ${status}`);
    } catch (err) {
      toast.error('Failed to update meeting status');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Meetings</h1>
          <p className="text-gray-600">Schedule and manage your calls</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-gray-100 p-1 rounded-lg">
            <button 
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition ${viewMode === 'list' ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}
              onClick={() => setViewMode('list')}
            >
              List
            </button>
             <button 
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition ${viewMode === 'calendar' ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}
              onClick={() => setViewMode('calendar')}
            >
              Calendar
            </button>
          </div>
          <Button leftIcon={<Plus size={18} />} onClick={() => setShowModal(true)}>
            Schedule
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-gray-500">
          <Loader2 className="animate-spin mr-2" /> Loading meetings...
        </div>
      ) : meetings.length === 0 ? (
        <div className="py-16 text-center bg-gray-50 rounded-xl border border-gray-200">
          <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="font-medium text-gray-700">No meetings scheduled</p>
          <p className="text-sm text-gray-500 mt-1">Click "Schedule Meeting" to get started.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {viewMode === 'list' && meetings.map((meeting) => {
            const isOrganizer = meeting.organizer?._id === user?.id || meeting.organizer === user?.id;
            const otherPerson = isOrganizer ? meeting.attendee : meeting.organizer;
            const otherName = otherPerson
              ? `${otherPerson.firstName || ''} ${otherPerson.lastName || ''}`.trim()
              : 'Unknown';

            return (
              <Card key={meeting._id} className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <CardBody className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-5">
                  <div className="p-3 bg-primary-50 rounded-xl flex-shrink-0">
                    <Video size={24} className="text-primary-600" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-gray-900">{meeting.title}</h3>
                      <Badge variant={statusColors[meeting.status] || 'secondary'} size="sm">
                        {meeting.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-sm text-gray-500 flex-wrap">
                      <span className="flex items-center gap-1">
                        <Users size={14} /> with {otherName}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={14} />
                        {new Date(meeting.startTime).toLocaleString()} →{' '}
                        {new Date(meeting.endTime).toLocaleTimeString()}
                      </span>
                    </div>
                    {meeting.description && (
                      <p className="text-sm text-gray-500 mt-1 truncate">{meeting.description}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
                    {meeting.status === 'accepted' && meeting.roomId && (
                      <Button
                        size="sm"
                        leftIcon={<Video size={16} />}
                        onClick={() => navigate(`/meetings/room/${meeting.roomId}`)}
                      >
                        Join Call
                      </Button>
                    )}
                    {!isOrganizer && meeting.status === 'pending' && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleStatusUpdate(meeting._id, 'accepted')}
                        >
                          Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-error-600"
                          onClick={() => handleStatusUpdate(meeting._id, 'rejected')}
                        >
                          Decline
                        </Button>
                      </>
                    )}
                  </div>
                </CardBody>
              </Card>
            );
          })}
          
          {viewMode === 'calendar' && (
            <Card className="border border-gray-200 shadow-sm p-4 w-full">
               <BigCalendar
                  localizer={localizer}
                  events={meetings.map(m => ({
                    title: m.title,
                    start: new Date(m.startTime),
                    end: new Date(m.endTime),
                    resource: m
                  }))}
                  startAccessor="start"
                  endAccessor="end"
                  style={{ height: '600px' }}
                  views={['month', 'week', 'day']}
                  defaultView="month"
               />
            </Card>
          )}
        </div>
      )}

      {/* Schedule Meeting Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Schedule a Meeting</h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 rounded-lg hover:bg-gray-100 transition"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Attendee <span className="text-error-500">*</span>
                </label>
                <select
                  value={form.attendeeId}
                  onChange={e => setForm(p => ({ ...p, attendeeId: e.target.value }))}
                  className="w-full rounded-xl border border-gray-300 p-3 shadow-sm focus:border-primary-500 focus:ring-primary-500 outline-none text-sm"
                  required
                >
                  <option value="">Select a person...</option>
                  {allUsers.map(u => (
                    <option key={u._id || u.id} value={u._id || u.id}>
                      {u.name || `${u.firstName || ''} ${u.lastName || ''}`.trim()} {u.role ? `(${u.role})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <Input
                label="Meeting Title *"
                value={form.title}
                onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                placeholder="e.g. Series A Discussion"
                required
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  className="w-full rounded-xl border border-gray-300 p-3 shadow-sm focus:border-primary-500 outline-none text-sm"
                  rows={3}
                  placeholder="What will you discuss?"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Time <span className="text-error-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={form.startTime}
                    onChange={e => setForm(p => ({ ...p, startTime: e.target.value }))}
                    className="w-full rounded-xl border border-gray-300 p-3 shadow-sm focus:border-primary-500 outline-none text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Time <span className="text-error-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={form.endTime}
                    onChange={e => setForm(p => ({ ...p, endTime: e.target.value }))}
                    className="w-full rounded-xl border border-gray-300 p-3 shadow-sm focus:border-primary-500 outline-none text-sm"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting} leftIcon={isSubmitting ? <Loader2 size={16} className="animate-spin" /> : undefined}>
                  {isSubmitting ? 'Scheduling...' : 'Schedule Meeting'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
