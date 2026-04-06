import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Avatar } from '../ui/Avatar';

interface ChatMessageData {
  id?: string;
  _id?: string;
  senderId: string;
  receiverId?: string;
  content: string;
  // API returns `createdAt`; normalized shape also adds `timestamp`
  timestamp?: string;
  createdAt?: string;
  isRead?: boolean;
}

interface ChatMessageProps {
  message: ChatMessageData;
  isCurrentUser: boolean;
  senderAvatarUrl?: string;
  senderName?: string;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  isCurrentUser,
  senderAvatarUrl,
  senderName = 'User'
}) => {
  // Support both `timestamp` (normalized) and `createdAt` (raw DB) field names
  const timeValue = message.timestamp || message.createdAt;
  const displayTime = timeValue
    ? formatDistanceToNow(new Date(timeValue), { addSuffix: true })
    : '';

  const avatarSrc =
    senderAvatarUrl ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(senderName)}&background=random`;

  return (
    <div
      className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} mb-4 animate-fade-in`}
    >
      {!isCurrentUser && (
        <Avatar
          src={avatarSrc}
          alt={senderName}
          size="sm"
          className="mr-2 self-end"
        />
      )}
      
      <div className={`flex flex-col ${isCurrentUser ? 'items-end' : 'items-start'}`}>
        <div
          className={`max-w-xs sm:max-w-md px-4 py-2 rounded-lg ${
            isCurrentUser
              ? 'bg-primary-600 text-white rounded-br-none'
              : 'bg-gray-100 text-gray-800 rounded-bl-none'
          }`}
        >
          <p className="text-sm">{message.content}</p>
        </div>
        
        {displayTime && (
          <span className="text-xs text-gray-500 mt-1">{displayTime}</span>
        )}
      </div>
      
      {isCurrentUser && (
        <Avatar
          src={avatarSrc}
          alt={senderName}
          size="sm"
          className="ml-2 self-end"
        />
      )}
    </div>
  );
};