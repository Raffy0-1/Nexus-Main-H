import React, { useState, useEffect } from 'react';
import { Search, Filter, MapPin, Loader2 } from 'lucide-react';
import { Input } from '../../components/ui/Input';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { InvestorCard } from '../../components/investor/InvestorCard';
import api from '../../utils/api';

export const InvestorsPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStages, setSelectedStages] = useState<string[]>([]);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [investors, setInvestors] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchInvestors = async () => {
      try {
        setIsLoading(true);
        const res = await api.get('/profiles/investors');
        setInvestors(res.data || []);
      } catch (error) {
        console.error('Failed to load investors', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchInvestors();
  }, []);
  
  // Get unique investment stages and interests strictly safely
  const allStages = Array.from(new Set(investors.flatMap(i => i.investmentStage || [])));
  const allInterests = Array.from(new Set(investors.flatMap(i => i.investmentInterests || [])));
  
  // Filter investors based on search and filters
  const filteredInvestors = investors.filter(investor => {
    const nameMatch = (investor.name || investor.firstName || '').toLowerCase();
    const bioMatch = (investor.bio || '').toLowerCase();
    
    const matchesSearch = searchQuery === '' || 
      nameMatch.includes(searchQuery.toLowerCase()) ||
      bioMatch.includes(searchQuery.toLowerCase()) ||
      (investor.investmentInterests || []).some((interest: string) => 
        interest.toLowerCase().includes(searchQuery.toLowerCase())
      );
    
    const matchesStages = selectedStages.length === 0 ||
      (investor.investmentStage || []).some((stage: string) => selectedStages.includes(stage));
    
    const matchesInterests = selectedInterests.length === 0 ||
      (investor.investmentInterests || []).some((interest: string) => selectedInterests.includes(interest));
    
    return matchesSearch && matchesStages && matchesInterests;
  });
  
  const toggleStage = (stage: string) => {
    setSelectedStages(prev => 
      prev.includes(stage)
        ? prev.filter(s => s !== stage)
        : [...prev, stage]
    );
  };
  
  const toggleInterest = (interest: string) => {
    setSelectedInterests(prev => 
      prev.includes(interest)
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    );
  };
  
  return (
    <div className="space-y-6 animate-fade-in relative">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Find Investors</h1>
        <p className="text-gray-600">Connect with investors who match your startup's needs</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filters sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <h2 className="text-lg font-medium text-gray-900">Filters</h2>
            </CardHeader>
            <CardBody className="space-y-6">
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-2">Investment Stage</h3>
                <div className="space-y-2">
                  {allStages.length > 0 ? allStages.map(stage => (
                    <button
                      key={stage}
                      onClick={() => toggleStage(stage)}
                      className={`block w-full text-left px-3 py-2 rounded-md text-sm ${
                        selectedStages.includes(stage)
                          ? 'bg-primary-50 text-primary-700'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {stage}
                    </button>
                  )) : <p className="text-xs text-gray-400">No stages found.</p>}
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-2">Investment Interests</h3>
                <div className="flex flex-wrap gap-2">
                  {allInterests.length > 0 ? allInterests.map(interest => (
                    <button
                      key={interest}
                      type="button"
                      onClick={() => toggleInterest(interest)}
                      className="cursor-pointer"
                    >
                      <Badge
                        variant={selectedInterests.includes(interest) ? 'primary' : 'gray'}
                      >
                        {interest}
                      </Badge>
                    </button>
                  )) : <p className="text-xs text-gray-400">No interests found.</p>}
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-2">Location</h3>
                <div className="space-y-2">
                  <button className="flex items-center w-full text-left px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-gray-50">
                    <MapPin size={16} className="mr-2" />
                    San Francisco, CA
                  </button>
                  <button className="flex items-center w-full text-left px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-gray-50">
                    <MapPin size={16} className="mr-2" />
                    New York, NY
                  </button>
                  <button className="flex items-center w-full text-left px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-gray-50">
                    <MapPin size={16} className="mr-2" />
                    Boston, MA
                  </button>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
        
        {/* Main content */}
        <div className="lg:col-span-3 space-y-6">
          <div className="flex items-center gap-4">
            <Input
              placeholder="Search investors by name, interests, or keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              startAdornment={<Search size={18} />}
              fullWidth
            />
            
            <div className="flex items-center gap-2">
              <Filter size={18} className="text-gray-500" />
              <span className="text-sm text-gray-600">
                {isLoading ? "Loading..." : `${filteredInvestors.length} results`}
              </span>
            </div>
          </div>
          
          {isLoading ? (
             <div className="p-12 text-center text-gray-500 font-medium flex flex-col justify-center items-center">
                <Loader2 className="animate-spin w-8 h-8 mb-2" /> Loading Investors...
             </div>
          ) : filteredInvestors.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredInvestors.map(investor => (
                <InvestorCard
                  key={investor.id || investor._id}
                  investor={investor}
                />
              ))}
            </div>
          ) : (
            <div className="p-10 text-center border border-gray-200 rounded-xl bg-gray-50 text-gray-500 mt-4">
               No investors found matching the criteria.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};