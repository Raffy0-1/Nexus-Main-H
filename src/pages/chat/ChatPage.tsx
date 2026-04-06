import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Send, Phone, Video, Info, Smile, MessageCircle } from 'lucide-react';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { ChatMessage } from '../../components/chat/ChatMessage';
import { ChatUserList } from '../../components/chat/ChatUserList';
import { useAuth } from '../../context/useAuth';
import api from '../../utils/api';
import { io, Socket } from 'socket.io-client';

export const ChatPage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const { user: currentUser } = useAuth();

  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [conversations, setConversations] = useState<any[]>([]);
  const [chatPartner, setChatPartner] = useState<any>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const messagesEndRef = useRef<null | HTMLDivElement>(null);

  // Initialize socket with JWT auth (matching server io.use() middleware)
  useEffect(() => {
    if (currentUser) {
      const token = localStorage.getItem('token');
      const newSocket = io(import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000', {
        auth: { token }
      });

      setSocket(newSocket);

      newSocket.on('connect_error', (err) => {
        console.error('Socket connection error:', err.message);
      });

      newSocket.on('receive-message', (message: any) => {
        // Append incoming message if it belongs to the current open chat
        setMessages((prev) => {
          if (message.senderId === userId || message.receiverId === userId) {
            return [...prev, message];
          }
          return prev;
        });
      });

      return () => {
        newSocket.disconnect();
      };
    }
  }, [currentUser, userId]);

  // Load initial data
  useEffect(() => {
    const loadChatData = async () => {
      if (!currentUser) return;
      try {
        setIsLoading(true);
        // Load conversations
        const convRes = await api.get('/messages/conversations');
        setConversations(convRes.data || []);

        // Load messages if userId exists
        if (userId) {
          const [msgRes, profileRes] = await Promise.all([
            api.get(`/messages/${userId}`),
            api.get(`/profiles/${userId}`).catch(() => ({ data: { id: userId, name: 'Unknown User' } })) // fallback if endpoint missing
          ]);
          setMessages(msgRes.data || []);
          setChatPartner(profileRes.data);
        }
      } catch (error) {
        console.error('Error loading chat data', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadChatData();
  }, [currentUser, userId]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentUser || !userId) return;

    const messageContent = newMessage;
    setNewMessage('');

    try {
      // Create local optimistic message object
      const tempMessage = {
        id: Date.now().toString(),
        senderId: currentUser.id,
        receiverId: userId,
        content: messageContent,
        createdAt: new Date().toISOString()
      };

      setMessages(prev => [...prev, tempMessage]);

      // Emit socket and save to DB
      if (socket) {
        socket.emit('send-message', {
          receiverId: userId,
          content: messageContent
        });
      }

      await api.post('/messages', {
        receiverId: userId,
        content: messageContent
      });

      // Refresh conversations list to update latest msg
      const convRes = await api.get('/messages/conversations');
      setConversations(convRes.data || []);

    } catch (error) {
      console.error('Error sending message', error);
    }
  };

  if (!currentUser) return null;

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-white border border-gray-200 rounded-lg overflow-hidden animate-fade-in relative">
      {/* Conversations sidebar */}
      <div className="hidden md:block w-1/3 lg:w-1/4 border-r border-gray-200">
        <ChatUserList conversations={conversations} />
      </div>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col relative">
        {isLoading && userId && (
          <div className="absolute inset-0 bg-white/70 z-10 flex items-center justify-center">
            <span className="text-gray-500 font-medium">Loading chat...</span>
          </div>
        )}

        {chatPartner ? (
          <>
            <div className="border-b border-gray-200 p-4 flex justify-between items-center">
              <div className="flex items-center">
                <Avatar
                  src={chatPartner.avatarUrl || `https://ui-avatars.com/api/?name=${chatPartner.name}`}
                  alt={chatPartner.name}
                  size="md"
                  status={chatPartner.isOnline ? 'online' : 'offline'}
                  className="mr-3"
                />

                <div>
                  <h2 className="text-lg font-medium text-gray-900">{chatPartner.name || chatPartner.firstName}</h2>
                  <p className="text-sm text-gray-500">
                    {chatPartner.isOnline ? 'Online' : 'Last seen recently'}
                  </p>
                </div>
              </div>

              <div className="flex space-x-2">
                <Button variant="ghost" size="sm" className="rounded-full p-2" aria-label="Voice call">
                  <Phone size={18} />
                </Button>
                <Button variant="ghost" size="sm" className="rounded-full p-2" aria-label="Video call">
                  <Video size={18} />
                </Button>
                <Button variant="ghost" size="sm" className="rounded-full p-2" aria-label="Info">
                  <Info size={18} />
                </Button>
              </div>
            </div>

            {/* Messages container */}
            <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
              {messages.length > 0 ? (
                <div className="space-y-4">
                  {messages.map(message => (
                    <ChatMessage
                      key={message.id || message._id}
                      message={message}
                      isCurrentUser={message.senderId === currentUser.id}
                      senderAvatarUrl={
                        message.senderId === currentUser.id
                          ? currentUser.avatarUrl
                          : chatPartner?.avatarUrl
                      }
                      senderName={
                        message.senderId === currentUser.id
                          ? currentUser.name
                          : chatPartner?.name
                      }
                    />
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center">
                  <div className="bg-gray-100 p-4 rounded-full mb-4">
                    <MessageCircle size={32} className="text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-700">No messages yet</h3>
                  <p className="text-gray-500 mt-1">Send a message to start the conversation</p>
                </div>
              )}
            </div>

            {/* Message input */}
            <div className="border-t border-gray-200 p-4 bg-white z-20">
              <form onSubmit={handleSendMessage} className="flex space-x-2">
                <Button type="button" variant="ghost" size="sm" className="rounded-full p-2" aria-label="Add emoji">
                  <Smile size={20} />
                </Button>

                <Input
                  type="text"
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  fullWidth
                  className="flex-1"
                />

                <Button
                  type="submit"
                  size="sm"
                  disabled={!newMessage.trim()}
                  className="rounded-full p-2 w-10 h-10 flex items-center justify-center"
                  aria-label="Send message"
                >
                  <Send size={18} />
                </Button>
              </form>
            </div>
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center p-4">
            <div className="bg-gray-100 p-6 rounded-full mb-4">
              <MessageCircle size={48} className="text-gray-400" />
            </div>
            <h2 className="text-xl font-medium text-gray-700">Select a conversation</h2>
            <p className="text-gray-500 mt-2 text-center">
              Choose a contact from the list to start chatting
            </p>
          </div>
        )}
      </div>
    </div>
  );
};