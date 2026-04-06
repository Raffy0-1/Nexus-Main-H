import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ZegoUIKitPrebuilt } from '@zegocloud/zego-uikit-prebuilt';
import { io, Socket } from 'socket.io-client';
import { Mic, MicOff, Video, VideoOff } from 'lucide-react';
import { useAuth } from '../../context/useAuth';

const VideoCallPage: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoHidden, setIsVideoHidden] = useState(false);

  useEffect(() => {
    // 1. Establish socket connection with JWT auth token
    const token = localStorage.getItem('token');
    const newSocket = io(import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000', {
      auth: { token }
    });
    setSocket(newSocket);

    newSocket.on('connect_error', (err) => {
      console.error('Socket error in call:', err.message);
    });

    // 2. Emit join-room event immediately
    if (roomId) {
      newSocket.emit('join-room', roomId, currentUser?.id);
    }

    return () => {
      newSocket.disconnect();
    };
  }, [roomId, currentUser?.id]);

  useEffect(() => {
    if (!roomId) return;

    const appID = import.meta.env.VITE_ZEGO_APP_ID ? Number(import.meta.env.VITE_ZEGO_APP_ID) : 123456789;
    const serverSecret = import.meta.env.VITE_ZEGO_SERVER_SECRET || "PLACEHOLDER_SECRET";

    const initMeeting = async () => {
      const userName = currentUser?.name || `Nexus User ${Math.floor(Math.random() * 1000)}`;
      const userId = currentUser?.id || Date.now().toString();

      const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
        appID,
        serverSecret,
        roomId,
        userId,
        userName
      );

      const zp = ZegoUIKitPrebuilt.create(kitToken);

      if (containerRef.current) {
        zp.joinRoom({
          container: containerRef.current,
          scenario: {
            mode: ZegoUIKitPrebuilt.VideoConference,
          },
          showPreJoinView: true,
          showRoomTimer: true,
          turnOnMicrophoneWhenJoining: false,
          turnOnCameraWhenJoining: false,
          onLeaveRoom: () => {
            navigate('/meetings');
          }
        });
      }
    };

    initMeeting();
  }, [roomId, navigate, currentUser?.id, currentUser?.name]);

  // Handle Audio/Video socket emission logic via UI buttons
  const toggleAudio = () => {
    setIsAudioMuted(!isAudioMuted);
    if (socket && roomId) {
      socket.emit('toggle-audio', { roomId, muted: !isAudioMuted });
    }
  };

  const toggleVideo = () => {
    setIsVideoHidden(!isVideoHidden);
    if (socket && roomId) {
      socket.emit('toggle-video', { roomId, hidden: !isVideoHidden });
    }
  };

  return (
    <div className="flex flex-col h-screen w-full bg-black relative">
      <div className="absolute top-4 left-4 z-[999]">
        <button
          onClick={() => navigate('/meetings')}
          className="px-5 py-2.5 bg-gray-800 hover:bg-gray-700 text-white font-medium rounded-xl border border-gray-700 transition shadow-lg backdrop-blur"
        >
          &larr; Back to Dashboard
        </button>
      </div>

      {/* Manual Toggle Overlays to satisfy exact integration request for socket emitting */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-[999] flex space-x-4 bg-gray-900/80 p-3 rounded-2xl backdrop-blur-md">
        <button
          onClick={toggleAudio}
          className={`p-3 rounded-xl transition ${isAudioMuted ? 'bg-red-500 text-white' : 'bg-gray-700 hover:bg-gray-600 text-white'}`}
          title="Emit Mute Event to Socket"
        >
          {isAudioMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
        </button>
        <button
          onClick={toggleVideo}
          className={`p-3 rounded-xl transition ${isVideoHidden ? 'bg-red-500 text-white' : 'bg-gray-700 hover:bg-gray-600 text-white'}`}
          title="Emit Hide Video Event to Socket"
        >
          {isVideoHidden ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
        </button>
      </div>

      {/* Core Vender UI Container */}
      <div
        ref={containerRef}
        className="w-full h-full flex items-center justify-center border-none"
      />
    </div>
  );
};

export default VideoCallPage;
