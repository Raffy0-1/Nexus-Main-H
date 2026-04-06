import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MessageCircle, Users, Calendar, Building2, MapPin, UserCircle, FileText, DollarSign, Send } from 'lucide-react';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { useAuth } from '../../context/useAuth';
import api from '../../utils/api';

export const EntrepreneurProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user: currentUser } = useAuth();

  const [entrepreneur, setEntrepreneur] = useState<any>(null);
  const [hasRequestedCollaboration, setHasRequestedCollaboration] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      try {
        setIsLoading(true);
        // Fetch the real user profile from the API
        const [profileRes, collabRes] = await Promise.all([
          api.get(`/profiles/${id}`),
          api.get('/collaborations').catch(() => ({ data: [] }))
        ]);
        setEntrepreneur(profileRes.data);

        // Check if current user already sent a collaboration request
        const collabs = collabRes.data || [];
        const alreadySent = collabs.some((c: any) => {
          const sid = typeof c.senderId === 'object' ? (c.senderId._id || c.senderId.id) : c.senderId;
          const rid = typeof c.receiverId === 'object' ? (c.receiverId._id || c.receiverId.id) : c.receiverId;
          return sid === currentUser?.id && rid === id && c.status === 'pending';
        });
        setHasRequestedCollaboration(alreadySent);
      } catch (err) {
        console.error('Failed to load entrepreneur profile:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [id, currentUser?.id]);

  if (isLoading) {
    return <div className="p-8 text-center text-gray-500">Loading profile...</div>;
  }

  if (!entrepreneur) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900">Entrepreneur not found</h2>
        <p className="text-gray-600 mt-2">The profile you're looking for doesn't exist or has been removed.</p>
        <Link to="/dashboard/investor">
          <Button variant="outline" className="mt-4">Back to Dashboard</Button>
        </Link>
      </div>
    );
  }

  const isCurrentUser = currentUser?.id === (entrepreneur.id || entrepreneur._id);
  const isInvestor = currentUser?.role === 'investor';

  const handleSendRequest = async () => {
    if (!isInvestor || !currentUser || !id) return;
    try {
      await api.post('/collaborations', {
        receiverId: id,
        message: `I'm interested in learning more about your startup and would like to explore potential investment opportunities.`
      });
      setHasRequestedCollaboration(true);
    } catch (err: any) {
      console.error('Failed to send collaboration request:', err);
    }
  };

  const name = entrepreneur.name || `${entrepreneur.firstName || ''} ${entrepreneur.lastName || ''}`.trim();
  const avatarUrl = entrepreneur.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Profile header */}
      <Card>
        <CardBody className="sm:flex sm:items-start sm:justify-between p-6">
          <div className="sm:flex sm:space-x-6">
            <Avatar
              src={avatarUrl}
              alt={name}
              size="xl"
              status={entrepreneur.isOnline ? 'online' : 'offline'}
              className="mx-auto sm:mx-0"
            />

            <div className="mt-4 sm:mt-0 text-center sm:text-left">
              <h1 className="text-2xl font-bold text-gray-900">{name}</h1>
              <p className="text-gray-600 flex items-center justify-center sm:justify-start mt-1">
                <Building2 size={16} className="mr-1" />
                {entrepreneur.startupName ? `Founder at ${entrepreneur.startupName}` : 'Entrepreneur'}
              </p>

              <div className="flex flex-wrap gap-2 justify-center sm:justify-start mt-3">
                {entrepreneur.industry && <Badge variant="primary">{entrepreneur.industry}</Badge>}
                {entrepreneur.location && (
                  <Badge variant="gray">
                    <MapPin size={14} className="mr-1" />
                    {entrepreneur.location}
                  </Badge>
                )}
                {entrepreneur.foundedYear && (
                  <Badge variant="accent">
                    <Calendar size={14} className="mr-1" />
                    Founded {entrepreneur.foundedYear}
                  </Badge>
                )}
                {entrepreneur.teamSize && (
                  <Badge variant="secondary">
                    <Users size={14} className="mr-1" />
                    {entrepreneur.teamSize} team members
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <div className="mt-6 sm:mt-0 flex flex-col sm:flex-row gap-2 justify-center sm:justify-end">
            {!isCurrentUser && (
              <>
                <Link to={`/chat/${entrepreneur.id || entrepreneur._id}`}>
                  <Button variant="outline" leftIcon={<MessageCircle size={18} />}>
                    Message
                  </Button>
                </Link>

                {isInvestor && (
                  <Button
                    leftIcon={<Send size={18} />}
                    disabled={hasRequestedCollaboration}
                    onClick={handleSendRequest}
                  >
                    {hasRequestedCollaboration ? 'Request Sent' : 'Request Collaboration'}
                  </Button>
                )}
              </>
            )}

            {isCurrentUser && (
              <Button variant="outline" leftIcon={<UserCircle size={18} />}>
                Edit Profile
              </Button>
            )}
          </div>
        </CardBody>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* About */}
          <Card>
            <CardHeader>
              <h2 className="text-lg font-medium text-gray-900">About</h2>
            </CardHeader>
            <CardBody>
              <p className="text-gray-700">{entrepreneur.bio || entrepreneur.pitchSummary || 'No bio available.'}</p>
            </CardBody>
          </Card>

          {/* Startup Description */}
          {entrepreneur.pitchSummary && (
            <Card>
              <CardHeader>
                <h2 className="text-lg font-medium text-gray-900">Startup Overview</h2>
              </CardHeader>
              <CardBody>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-md font-medium text-gray-900">Pitch Summary</h3>
                    <p className="text-gray-700 mt-1">{entrepreneur.pitchSummary}</p>
                  </div>
                  {entrepreneur.industry && (
                    <div>
                      <h3 className="text-md font-medium text-gray-900">Market Opportunity</h3>
                      <p className="text-gray-700 mt-1">
                        The {entrepreneur.industry} market is experiencing significant growth. Our solution addresses key pain points in this expanding market.
                      </p>
                    </div>
                  )}
                </div>
              </CardBody>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Funding Details */}
          {entrepreneur.fundingNeeded && (
            <Card>
              <CardHeader>
                <h2 className="text-lg font-medium text-gray-900">Funding</h2>
              </CardHeader>
              <CardBody>
                <div className="space-y-4">
                  <div>
                    <span className="text-sm text-gray-500">Seeking</span>
                    <div className="flex items-center mt-1">
                      <DollarSign size={18} className="text-accent-600 mr-1" />
                      <p className="text-lg font-semibold text-gray-900">{entrepreneur.fundingNeeded}</p>
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>
          )}

          {/* Documents */}
          {!isCurrentUser && isInvestor && (
            <Card>
              <CardHeader>
                <h2 className="text-lg font-medium text-gray-900">Documents</h2>
              </CardHeader>
              <CardBody>
                <div className="space-y-3">
                  <div className="flex items-center p-3 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors">
                    <div className="p-2 bg-primary-50 rounded-md mr-3">
                      <FileText size={18} className="text-primary-700" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-gray-900">Pitch Deck</h3>
                      <p className="text-xs text-gray-500">Request collaboration to access</p>
                    </div>
                    <Button variant="outline" size="sm" disabled={!hasRequestedCollaboration}>
                      View
                    </Button>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-sm text-gray-500">
                    Request collaboration to access detailed documents and financials.
                  </p>
                  {!hasRequestedCollaboration ? (
                    <Button className="mt-3 w-full" onClick={handleSendRequest}>
                      Request Collaboration
                    </Button>
                  ) : (
                    <Button className="mt-3 w-full" disabled>
                      Request Sent
                    </Button>
                  )}
                </div>
              </CardBody>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};