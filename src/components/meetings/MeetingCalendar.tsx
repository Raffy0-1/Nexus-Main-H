import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, Clock, Users, X } from 'lucide-react';
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  isSameMonth,
  isSameDay,
  eachDayOfInterval
} from 'date-fns';

// Define our types
interface Meeting {
  id: string;
  title: string;
  date: Date;
  time: string;
  participant: string;
}

const MeetingCalendar: React.FC = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ title: '', date: '', time: '', participant: '' });

  useEffect(() => {
    const mockMeetings = [
      { id: '1', title: 'Investor Pitch', date: new Date(), time: '10:00 AM', participant: 'Acme Ventures' },
      { id: '2', title: 'Product Review', date: new Date(new Date().setDate(new Date().getDate() + 2)), time: '02:00 PM', participant: 'Tech Angels' }
    ];
    setMeetings(mockMeetings);
  }, []);

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  const handleSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.date || !formData.time) return;
    
    const newMeeting: Meeting = {
      id: Math.random().toString(36).substr(2, 9),
      title: formData.title,
      date: new Date(formData.date),
      time: formData.time,
      participant: formData.participant
    };
    
    setMeetings(prev => [...prev, newMeeting]);
    setIsModalOpen(false);
    setFormData({ title: '', date: '', time: '', participant: '' });
  };

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
  
  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

  return (
    <div className="w-full bg-white dark:bg-gray-900 rounded-2xl shadow-xl overflow-hidden text-gray-800 dark:text-gray-100 p-6 max-w-7xl mx-auto font-sans">
      <div className="flex flex-col md:flex-row items-center justify-between mb-8 space-y-4 md:space-y-0">
        <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          Meeting Calendar
        </h2>
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-4">
            <button onClick={prevMonth} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <ChevronLeft className="w-6 h-6 text-gray-500" />
            </button>
            <h3 className="text-xl font-semibold w-40 text-center">
              {format(currentMonth, 'MMMM yyyy')}
            </h3>
            <button onClick={nextMonth} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <ChevronRight className="w-6 h-6 text-gray-500" />
            </button>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center space-x-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-500/30 hover:bg-blue-700 hover:shadow-blue-500/50 transition-all active:scale-95"
          >
            <Plus className="w-5 h-5" />
            <span className="font-medium">Schedule</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-px bg-gray-200 dark:bg-gray-700 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
          <div key={day} className="bg-gray-50 dark:bg-gray-800 py-3 text-center text-sm font-semibold text-gray-500 uppercase tracking-wider">
            {day}
          </div>
        ))}
        {calendarDays.map((day, idx) => {
          const dayMeetings = meetings.filter(m => isSameDay(m.date, day));
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const isToday = isSameDay(day, new Date());
          
          return (
            <div 
              key={idx} 
              className={`min-h-[140px] bg-white dark:bg-gray-900 p-3 flex flex-col group hover:bg-blue-50/50 dark:hover:bg-gray-800/50 transition-colors ${
                !isCurrentMonth ? 'text-gray-400 bg-gray-50 dark:bg-gray-800/80' : ''
              }`}
            >
              <div className="flex justify-between items-center mb-2">
                <span className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-bold ${
                  isToday 
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/40' 
                    : isCurrentMonth ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400 dark:text-gray-600'
                }`}>
                  {format(day, 'd')}
                </span>
                {dayMeetings.length > 0 && (
                  <span className="bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 text-xs px-2 py-0.5 rounded-full font-semibold">
                    {dayMeetings.length}
                  </span>
                )}
              </div>
              <div className="flex-1 space-y-1.5 overflow-y-auto no-scrollbar">
                {dayMeetings.map(meeting => (
                  <div 
                    key={meeting.id} 
                    className="p-2 text-xs rounded-lg border border-l-4 border-l-blue-500 bg-blue-50 border-blue-100 dark:bg-gray-800 dark:border-gray-700 text-gray-700 dark:text-gray-300 truncate cursor-pointer hover:shadow-sm hover:-translate-y-0.5 transition-all"
                  >
                    <div className="font-semibold text-blue-800 dark:text-blue-400 truncate">{meeting.time} - {meeting.title}</div>
                    <div className="text-[10px] text-gray-500 dark:text-gray-400 truncate flex items-center mt-1">
                      <Users className="w-3 h-3 mr-1 inline" />
                      {meeting.participant}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-100 dark:border-gray-700 translate-y-0 animate-in slide-in-from-bottom-4 duration-300">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50">
              <h3 className="text-xl font-bold flex items-center space-x-2">
                <CalendarIcon className="w-6 h-6 text-blue-600" />
                <span>Schedule a Meeting</span>
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSchedule} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Meeting Title</label>
                <input 
                  type="text" 
                  required
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none" 
                  placeholder="e.g. Q3 Roadmap Review"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5 flex items-center">
                    <CalendarIcon className="w-4 h-4 mr-1.5 text-gray-400" /> Date
                  </label>
                  <input 
                    type="date" 
                    required
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 transition-all outline-none text-gray-700 dark:text-gray-200"
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5 flex items-center">
                    <Clock className="w-4 h-4 mr-1.5 text-gray-400" /> Time
                  </label>
                  <input 
                    type="time" 
                    required
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 transition-all outline-none text-gray-700 dark:text-gray-200"
                    value={formData.time}
                    onChange={(e) => setFormData({...formData, time: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5 flex items-center">
                  <Users className="w-4 h-4 mr-1.5 text-gray-400" /> Participant Entity
                </label>
                <input 
                  type="text" 
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-gray-700 dark:text-gray-200" 
                  placeholder="Investor / Entrepreneur name"
                  value={formData.participant}
                  onChange={(e) => setFormData({...formData, participant: e.target.value})}
                />
              </div>

              <div className="pt-4 flex justify-end space-x-3">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-2.5 rounded-xl font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold shadow-lg shadow-blue-500/30 transition-all active:scale-95"
                >
                  Save Meeting
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MeetingCalendar;
