import React, { useState } from 'react';
import { Search, Filter, DollarSign, TrendingUp, Users, Calendar } from 'lucide-react';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';
import toast from 'react-hot-toast';

const deals = [
  {
    id: 1,
    startup: {
      name: 'TechWave AI',
      logo: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg',
      industry: 'FinTech'
    },
    amount: '$1.5M',
    equity: '15%',
    status: 'Due Diligence',
    stage: 'Series A',
    lastActivity: '2024-02-15'
  },
  {
    id: 2,
    startup: {
      name: 'GreenLife Solutions',
      logo: 'https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg',
      industry: 'CleanTech'
    },
    amount: '$2M',
    equity: '20%',
    status: 'Term Sheet',
    stage: 'Seed',
    lastActivity: '2024-02-10'
  },
  {
    id: 3,
    startup: {
      name: 'HealthPulse',
      logo: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg',
      industry: 'HealthTech'
    },
    amount: '$800K',
    equity: '12%',
    status: 'Negotiation',
    stage: 'Pre-seed',
    lastActivity: '2024-02-05'
  }
];

export const DealsPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string[]>([]);
  const [dealsList, setDealsList] = useState(deals);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newDeal, setNewDeal] = useState({ startup: '', industry: '', amount: '', equity: '', stage: 'Seed', status: 'Due Diligence' });
  
  const statuses = ['Due Diligence', 'Term Sheet', 'Negotiation', 'Closed', 'Passed'];
  
  const toggleStatus = (status: string) => {
    setSelectedStatus(prev => 
      prev.includes(status)
        ? prev.filter(s => s !== status)
        : [...prev, status]
    );
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Due Diligence': return 'primary';
      case 'Term Sheet': return 'secondary';
      case 'Negotiation': return 'accent';
      case 'Closed': return 'success';
      case 'Passed': return 'error';
      default: return 'gray';
    }
  };

  const handleAddDeal = () => {
    if (!newDeal.startup || !newDeal.amount) {
      toast.error('Startup name and amount are required');
      return;
    }
    const deal = {
      id: Date.now(),
      startup: { name: newDeal.startup, logo: `https://ui-avatars.com/api/?name=${encodeURIComponent(newDeal.startup)}&background=random`, industry: newDeal.industry || 'Technology' },
      amount: newDeal.amount,
      equity: newDeal.equity || 'TBD',
      status: newDeal.status,
      stage: newDeal.stage,
      lastActivity: new Date().toISOString().split('T')[0]
    };
    setDealsList(prev => [...prev, deal]);
    setShowAddModal(false);
    setNewDeal({ startup: '', industry: '', amount: '', equity: '', stage: 'Seed', status: 'Due Diligence' });
    toast.success('Deal added!');
  };
  
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Investment Deals</h1>
          <p className="text-gray-600">Track and manage your investment pipeline</p>
        </div>
        
        <Button onClick={() => setShowAddModal(true)}>
          Add Deal
        </Button>
      </div>
      
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardBody>
            <div className="flex items-center">
              <div className="p-3 bg-primary-100 rounded-lg mr-3">
                <DollarSign size={20} className="text-primary-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Investment</p>
                <p className="text-lg font-semibold text-gray-900">$4.3M</p>
              </div>
            </div>
          </CardBody>
        </Card>
        
        <Card>
          <CardBody>
            <div className="flex items-center">
              <div className="p-3 bg-secondary-100 rounded-lg mr-3">
                <TrendingUp size={20} className="text-secondary-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Active Deals</p>
                <p className="text-lg font-semibold text-gray-900">8</p>
              </div>
            </div>
          </CardBody>
        </Card>
        
        <Card>
          <CardBody>
            <div className="flex items-center">
              <div className="p-3 bg-accent-100 rounded-lg mr-3">
                <Users size={20} className="text-accent-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Portfolio Companies</p>
                <p className="text-lg font-semibold text-gray-900">12</p>
              </div>
            </div>
          </CardBody>
        </Card>
        
        <Card>
          <CardBody>
            <div className="flex items-center">
              <div className="p-3 bg-success-100 rounded-lg mr-3">
                <Calendar size={20} className="text-success-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Closed This Month</p>
                <p className="text-lg font-semibold text-gray-900">2</p>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
      
      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="w-full md:w-2/3">
          <Input
            placeholder="Search deals by startup name or industry..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            startAdornment={<Search size={18} />}
            fullWidth
          />
        </div>
        
        <div className="w-full md:w-1/3">
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-gray-500" />
            <div className="flex flex-wrap gap-2">
              {statuses.map(status => (
                <button
                  key={status}
                  type="button"
                  onClick={() => toggleStatus(status)}
                >
                  <Badge variant={selectedStatus.includes(status) ? getStatusColor(status) : 'gray'}>
                    {status}
                  </Badge>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {/* Deals table */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-medium text-gray-900">Active Deals</h2>
        </CardHeader>
        <CardBody>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Startup
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Equity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stage
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Activity
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {dealsList
                  .filter(deal => {
                    const matchesSearch = searchQuery === '' ||
                      deal.startup.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      deal.startup.industry.toLowerCase().includes(searchQuery.toLowerCase());
                    const matchesStatus = selectedStatus.length === 0 || selectedStatus.includes(deal.status);
                    return matchesSearch && matchesStatus;
                  })
                  .map(deal => (
                  <tr key={deal.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Avatar
                          src={deal.startup.logo}
                          alt={deal.startup.name}
                          size="sm"
                          className="flex-shrink-0"
                        />
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {deal.startup.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {deal.startup.industry}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{deal.amount}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{deal.equity}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={getStatusColor(deal.status)}>
                        {deal.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{deal.stage}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {new Date(deal.lastActivity).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>

      {/* Add Deal Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Add New Deal</h2>
              <button onClick={() => setShowAddModal(false)} className="p-2 rounded-lg hover:bg-gray-100 transition">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Startup Name *</label>
                <input
                  type="text"
                  value={newDeal.startup}
                  onChange={e => setNewDeal(p => ({ ...p, startup: e.target.value }))}
                  className="w-full rounded-xl border border-gray-300 p-3 text-sm outline-none focus:border-primary-500"
                  placeholder="e.g. TechWave AI"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
                  <input
                    type="text"
                    value={newDeal.industry}
                    onChange={e => setNewDeal(p => ({ ...p, industry: e.target.value }))}
                    className="w-full rounded-xl border border-gray-300 p-3 text-sm outline-none focus:border-primary-500"
                    placeholder="e.g. FinTech"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount *</label>
                  <input
                    type="text"
                    value={newDeal.amount}
                    onChange={e => setNewDeal(p => ({ ...p, amount: e.target.value }))}
                    className="w-full rounded-xl border border-gray-300 p-3 text-sm outline-none focus:border-primary-500"
                    placeholder="e.g. $1.5M"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Equity</label>
                  <input
                    type="text"
                    value={newDeal.equity}
                    onChange={e => setNewDeal(p => ({ ...p, equity: e.target.value }))}
                    className="w-full rounded-xl border border-gray-300 p-3 text-sm outline-none focus:border-primary-500"
                    placeholder="e.g. 15%"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stage</label>
                  <select
                    value={newDeal.stage}
                    onChange={e => setNewDeal(p => ({ ...p, stage: e.target.value }))}
                    className="w-full rounded-xl border border-gray-300 p-3 text-sm outline-none focus:border-primary-500"
                  >
                    <option>Pre-seed</option>
                    <option>Seed</option>
                    <option>Series A</option>
                    <option>Series B</option>
                    <option>Series C+</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={newDeal.status}
                  onChange={e => setNewDeal(p => ({ ...p, status: e.target.value }))}
                  className="w-full rounded-xl border border-gray-300 p-3 text-sm outline-none focus:border-primary-500"
                >
                  {statuses.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button variant="outline" onClick={() => setShowAddModal(false)}>Cancel</Button>
                <Button onClick={handleAddDeal}>Add Deal</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};