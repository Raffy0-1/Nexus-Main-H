import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, X, MessageCircle } from 'lucide-react';
import { Card, CardBody, CardFooter } from '../ui/Card';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { formatDistanceToNow } from 'date-fns';
import api from '../../utils/api';

// The real backend uses senderId/receiverId (populated objects) not investorId/entrepreneurId
interface CollabSenderReceiver {
  _id?: string;
  id?: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  avatarUrl?: string;
  isOnline?: boolean;
}

interface CollaborationRequestData {
  _id?: string;
  id?: string;
  // Populated by .populate() on the server
  senderId: CollabSenderReceiver | string;
  receiverId: CollabSenderReceiver | string;
  message: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
}

interface CollaborationRequestCardProps {
  request: CollaborationRequestData;
  currentUserId?: string;
  onStatusUpdate?: (requestId: string, status: 'accepted' | 'rejected') => void;
}

export const CollaborationRequestCard: React.FC<CollaborationRequestCardProps> = ({
  request,
  currentUserId,
  onStatusUpdate
}) => {
  const navigate = useNavigate();

  // The sender will be populated by the backend populate() call
  const sender = typeof request.senderId === 'object' ? request.senderId as CollabSenderReceiver : null;
  const receiver = typeof request.receiverId === 'object' ? request.receiverId as CollabSenderReceiver : null;

  // Show the "other" person's info
  const senderId = sender?._id || sender?.id || (request.senderId as string);
  const receiverId = receiver?._id || receiver?.id || (request.receiverId as string);
  const isRequester = currentUserId === senderId;
  const otherPerson = isRequester ? receiver : sender;
  const otherPersonId = isRequester ? receiverId : senderId;

  const otherName = otherPerson
    ? otherPerson.name || `${otherPerson.firstName || ''} ${otherPerson.lastName || ''}`.trim() || 'User'
    : 'User';

  const otherAvatarUrl = otherPerson?.avatarUrl ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(otherName)}&background=random`;

  const requestId = (request._id || request.id || '').toString();

  const handleAccept = async () => {
    try {
      await api.put(`/collaborations/${requestId}/status`, { status: 'accepted' });
      if (onStatusUpdate) onStatusUpdate(requestId, 'accepted');
    } catch (err) {
      console.error('Failed to accept collaboration:', err);
    }
  };

  const handleReject = async () => {
    try {
      await api.put(`/collaborations/${requestId}/status`, { status: 'rejected' });
      if (onStatusUpdate) onStatusUpdate(requestId, 'rejected');
    } catch (err) {
      console.error('Failed to reject collaboration:', err);
    }
  };

  const handleMessage = () => {
    navigate(`/chat/${otherPersonId}`);
  };

  const handleViewProfile = () => {
    const role = isRequester
      ? (typeof request.receiverId === 'object' ? (request.receiverId as any).role : '')
      : (typeof request.senderId === 'object' ? (request.senderId as any).role : '');
    navigate(`/profile/${role}/${otherPersonId}`);
  };

  const getStatusBadge = () => {
    switch (request.status) {
      case 'pending':
        return <Badge variant="warning">Pending</Badge>;
      case 'accepted':
        return <Badge variant="success">Accepted</Badge>;
      case 'rejected':
        return <Badge variant="error">Declined</Badge>;
      default:
        return null;
    }
  };

  return (
    <Card className="transition-all duration-300">
      <CardBody className="flex flex-col">
        <div className="flex justify-between items-start">
          <div className="flex items-start">
            <Avatar
              src={otherAvatarUrl}
              alt={otherName}
              size="md"
              status={otherPerson?.isOnline ? 'online' : 'offline'}
              className="mr-3"
            />

            <div>
              <h3 className="text-md font-semibold text-gray-900">{otherName}</h3>
              <p className="text-sm text-gray-500">
                {formatDistanceToNow(new Date(request.createdAt), { addSuffix: true })}
              </p>
            </div>
          </div>

          {getStatusBadge()}
        </div>

        <div className="mt-4">
          <p className="text-sm text-gray-600">{request.message}</p>
        </div>
      </CardBody>

      <CardFooter className="border-t border-gray-100 bg-gray-50">
        {request.status === 'pending' && !isRequester ? (
          <div className="flex justify-between w-full">
            <div className="space-x-2">
              <Button
                variant="outline"
                size="sm"
                leftIcon={<X size={16} />}
                onClick={handleReject}
              >
                Decline
              </Button>
              <Button
                variant="success"
                size="sm"
                leftIcon={<Check size={16} />}
                onClick={handleAccept}
              >
                Accept
              </Button>
            </div>

            <Button
              variant="primary"
              size="sm"
              leftIcon={<MessageCircle size={16} />}
              onClick={handleMessage}
            >
              Message
            </Button>
          </div>
        ) : (
          <div className="flex justify-between w-full">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<MessageCircle size={16} />}
              onClick={handleMessage}
            >
              Message
            </Button>

            <Button
              variant="primary"
              size="sm"
              onClick={handleViewProfile}
            >
              View Profile
            </Button>
          </div>
        )}
      </CardFooter>
    </Card>
  );
};