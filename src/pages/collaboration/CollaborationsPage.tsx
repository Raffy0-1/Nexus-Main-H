import React, { useState, useEffect } from 'react';
import { Users, CheckCircle, XCircle, Clock, Loader2 } from 'lucide-react';
import { Card, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';
import { useAuth } from '../../context/useAuth';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const statusConfig: Record<string, { label: string; color: 'warning' | 'success' | 'error' | 'secondary' }> = {
  pending: { label: 'Pending', color: 'warning' },
  accepted: { label: 'Accepted', color: 'success' },
  rejected: { label: 'Rejected', color: 'error' },
};

export const CollaborationsPage: React.FC = () => {
  const { user } = useAuth();
  const [collaborations, setCollaborations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'incoming' | 'outgoing'>('all');

  const fetchCollaborations = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/collaborations');
      setCollaborations(res.data || []);
    } catch (err) {
      toast.error('Failed to load collaborations');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCollaborations();
  }, []);

  const handleUpdateStatus = async (id: string, status: 'accepted' | 'rejected') => {
    try {
      await api.put(`/collaborations/${id}/status`, { status });
      setCollaborations(prev =>
        prev.map(c => (c._id === id ? { ...c, status } : c))
      );
      toast.success(`Request ${status}`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update request');
    }
  };

  const incoming = collaborations.filter(c => c.receiverId?._id === user?.id || c.receiverId === user?.id);
  const outgoing = collaborations.filter(c => c.senderId?._id === user?.id || c.senderId === user?.id);
  const displayed = activeTab === 'incoming' ? incoming : activeTab === 'outgoing' ? outgoing : collaborations;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Collaborations</h1>
        <p className="text-gray-600">Manage your collaboration requests and partnerships</p>
      </div>

      {/* Tab Bar */}
      <div className="flex gap-2 border-b border-gray-200 pb-0">
        {(['all', 'incoming', 'outgoing'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium capitalize border-b-2 transition-colors ${activeTab === tab
                ? 'border-primary-600 text-primary-700'
                : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
          >
            {tab}
            {tab === 'incoming' && incoming.filter(c => c.status === 'pending').length > 0 && (
              <span className="ml-2 bg-primary-100 text-primary-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                {incoming.filter(c => c.status === 'pending').length}
              </span>
            )}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-gray-500">
          <Loader2 className="animate-spin mr-2" /> Loading...
        </div>
      ) : displayed.length === 0 ? (
        <div className="py-16 text-center bg-gray-50 rounded-xl border border-gray-200">
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="font-medium text-gray-700">No collaboration requests</p>
          <p className="text-sm text-gray-500 mt-1">Visit Investors or Entrepreneurs pages to send a request.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {displayed.map(collab => {
            const sender = collab.senderId;
            const receiver = collab.receiverId;
            const isIncoming = (receiver?._id || receiver) === user?.id;
            const otherPerson = isIncoming ? sender : receiver;
            const otherName = otherPerson
              ? `${otherPerson.firstName || ''} ${otherPerson.lastName || ''}`.trim() || 'Unknown'
              : 'Unknown';
            const avatarUrl = otherPerson?.avatarUrl ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(otherName)}&background=random`;
            const config = statusConfig[collab.status] || statusConfig.pending;

            return (
              <Card key={collab._id} className="border border-gray-200 shadow-sm">
                <CardBody className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-5">
                  <Avatar src={avatarUrl} alt={otherName} size="md" className="flex-shrink-0" />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-gray-900">{otherName}</span>
                      <Badge variant={config.color} size="sm">{config.label}</Badge>
                      <span className="text-xs text-gray-400 uppercase tracking-wide">
                        {isIncoming ? 'Incoming' : 'Outgoing'}
                      </span>
                    </div>
                    {collab.message && (
                      <p className="text-sm text-gray-600 mt-1">{collab.message}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(collab.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  {isIncoming && collab.status === 'pending' && (
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button
                        size="sm"
                        leftIcon={<CheckCircle size={16} />}
                        onClick={() => handleUpdateStatus(collab._id, 'accepted')}
                      >
                        Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-error-600 hover:bg-error-50"
                        leftIcon={<XCircle size={16} />}
                        onClick={() => handleUpdateStatus(collab._id, 'rejected')}
                      >
                        Decline
                      </Button>
                    </div>
                  )}

                  {collab.status === 'pending' && !isIncoming && (
                    <div className="flex items-center gap-1 text-warning-600 text-sm flex-shrink-0">
                      <Clock size={16} /> Awaiting response
                    </div>
                  )}
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
