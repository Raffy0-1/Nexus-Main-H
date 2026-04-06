import React, { useState, useEffect } from 'react';
import { Bell, MessageCircle, UserPlus, DollarSign, Loader2, Check } from 'lucide-react';
import { Card, CardBody } from '../../components/ui/Card';
import { Avatar } from '../../components/ui/Avatar';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import api from '../../utils/api';
import toast from 'react-hot-toast';

export const NotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        setIsLoading(true);
        const res = await api.get('/notifications');
        setNotifications(res.data || []);
      } catch (error) {
        console.error('Failed to load notifications', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchNotifications();
  }, []);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'new_message':
        return <MessageCircle size={16} className="text-primary-600" />;
      case 'meeting_request':
      case 'meeting_response':
        return <UserPlus size={16} className="text-secondary-600" />;
      case 'document_shared':
        return <DollarSign size={16} className="text-accent-600" />;
      case 'collaboration_request':
        return <UserPlus size={16} className="text-green-600" />;
      default:
        return <Bell size={16} className="text-gray-600" />;
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.put('/notifications/mark-read');
      setNotifications(prev => prev.map(n => ({...n, unread: false})));
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Failed to mark all as read', error);
      toast.error('Failed to mark notifications read');
    }
  };

  const handleMarkRead = async (id: string) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n._id === id ? {...n, unread: false} : n));
    } catch (error) {
      console.error('Failed to mark notification read', error);
    }
  };
  
  return (
    <div className="space-y-6 animate-fade-in relative">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-600">Stay updated with your network activity</p>
        </div>
        
        <Button variant="outline" size="sm" onClick={handleMarkAllRead} leftIcon={<Check size={16}/>}>
          Mark all as read
        </Button>
      </div>
      
      <div className="space-y-4">
        {isLoading ? (
           <div className="p-8 flex items-center justify-center text-gray-500">
             <Loader2 className="animate-spin w-6 h-6 mr-2" /> Loading...
           </div>
        ) : notifications.length > 0 ? (
          notifications.map(notification => (
            <Card
              key={notification.id || notification._id}
              className={`transition-colors duration-200 ${
                notification.unread ? 'bg-primary-50' : 'bg-white'
              }`}
            >
              <CardBody className="flex items-start p-4">
                <Avatar
                  src={notification.user?.avatar || `https://ui-avatars.com/api/?name=${notification.user?.name || 'User'}`}
                  alt={notification.user?.name || "Notification Entity"}
                  size="md"
                  className="flex-shrink-0 mr-4"
                />
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">
                      {notification.user?.name || 'System notification'}
                    </span>
                    {notification.unread && (
                      <Badge variant="primary" size="sm" rounded>New</Badge>
                    )}
                  </div>
                  
                  <p className="text-gray-600 mt-1">
                    {notification.content || notification.message}
                  </p>
                  
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      {getNotificationIcon(notification.type)}
                      <span>{new Date(notification.createdAt || notification.time || new Date()).toLocaleString()}</span>
                    </div>
                    {notification.unread && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleMarkRead(notification._id)}
                      >
                        Mark as read
                      </Button>
                    )}
                  </div>
                </div>
              </CardBody>
            </Card>
          ))
        ) : (
           <div className="p-12 text-center bg-gray-50 rounded-xl border border-gray-200">
             <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
             <p className="text-gray-600 font-medium">No recent notifications</p>
             <p className="text-sm text-gray-500 mt-1">When someone interacts with your startup, you'll see it here.</p>
           </div>
        )}
      </div>
    </div>
  );
};