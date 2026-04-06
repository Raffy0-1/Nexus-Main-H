import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, ExternalLink, Users } from 'lucide-react';
import { Investor } from '../../types';
import { Card, CardBody, CardFooter } from '../ui/Card';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import api from '../../utils/api';
import toast from 'react-hot-toast';

interface InvestorCardProps {
  investor: Investor;
  showActions?: boolean;
}

export const InvestorCard: React.FC<InvestorCardProps> = ({
  investor,
  showActions = true
}) => {
  const navigate = useNavigate();
  const [isSendingRequest, setIsSendingRequest] = useState(false);
  
  const handleViewProfile = () => {
    navigate(`/profile/investor/${investor.id}`);
  };
  
  const handleMessage = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/chat/${investor.id}`);
  };

  const handleCollaborationRequest = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      setIsSendingRequest(true);
      await api.post('/collaborations', {
        receiverId: investor.id,
        message: `I'd love to collaborate with you on potential investment opportunities.`
      });
      toast.success('Collaboration request sent!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to send request');
    } finally {
      setIsSendingRequest(false);
    }
  };
  
  return (
    <Card 
      hoverable 
      className="transition-all duration-300 h-full"
      onClick={handleViewProfile}
    >
      <CardBody className="flex flex-col">
        <div className="flex items-start">
          <Avatar
            src={investor.avatarUrl}
            alt={investor.name}
            size="lg"
            status={investor.isOnline ? 'online' : 'offline'}
            className="mr-4"
          />
          
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">{investor.name}</h3>
            <p className="text-sm text-gray-500 mb-2">Investor • {investor.totalInvestments} investments</p>
            
            <div className="flex flex-wrap gap-2 mb-3">
              {investor.investmentStage.map((stage, index) => (
                <Badge key={index} variant="secondary" size="sm">{stage}</Badge>
              ))}
            </div>
          </div>
        </div>
        
        <div className="mt-3">
          <h4 className="text-sm font-medium text-gray-900 mb-1">Investment Interests</h4>
          <div className="flex flex-wrap gap-2">
            {investor.investmentInterests.map((interest, index) => (
              <Badge key={index} variant="primary" size="sm">{interest}</Badge>
            ))}
          </div>
        </div>
        
        <div className="mt-4">
          <p className="text-sm text-gray-600 line-clamp-2">{investor.bio}</p>
        </div>
        
        <div className="mt-3 flex justify-between items-center">
          <div>
            <span className="text-xs text-gray-500">Investment Range</span>
            <p className="text-sm font-medium text-gray-900">{investor.minimumInvestment} - {investor.maximumInvestment}</p>
          </div>
        </div>
      </CardBody>
      
      {showActions && (
        <CardFooter className="border-t border-gray-100 bg-gray-50 flex justify-between gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<MessageCircle size={16} />}
            onClick={handleMessage}
          >
            Message
          </Button>

          <Button
            variant="outline"
            size="sm"
            leftIcon={<Users size={16} />}
            onClick={handleCollaborationRequest}
            disabled={isSendingRequest}
          >
            {isSendingRequest ? 'Sending...' : 'Connect'}
          </Button>
          
          <Button
            variant="primary"
            size="sm"
            rightIcon={<ExternalLink size={16} />}
            onClick={handleViewProfile}
          >
            View Profile
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};