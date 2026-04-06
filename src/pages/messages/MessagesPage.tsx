import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';
import { ChatUserList } from '../../components/chat/ChatUserList';
import api from '../../utils/api';

export const MessagesPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchConversations = async () => {
      if (!user) return;
      try {
        setIsLoading(true);
        const res = await api.get('/messages/conversations');
        setConversations(res.data || []);
      } catch (error) {
        console.error("Failed to load conversations:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchConversations();
  }, [user]);

  if (!user) return null;

  if (isLoading) {
    return <div className="p-8 text-center text-lg text-gray-500 font-medium">Loading messages...</div>;
  }

  return (
    <div className="h-[calc(100vh-8rem)] bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden animate-fade-in">
      {conversations.length > 0 ? (
        <ChatUserList conversations={conversations} />
      ) : (
        <div className="h-full flex flex-col items-center justify-center p-8">
          <div className="bg-gray-100 p-6 rounded-full mb-4">
          </div>
          <h2 className="text-xl font-medium text-gray-900">No messages yet</h2>
          <p className="text-gray-600 text-center mt-2">
            Start connecting with entrepreneurs and investors to begin conversations
          </p>
        </div>
      )}
    </div>
  );
};