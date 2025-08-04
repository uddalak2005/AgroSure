// PendingWork.js - Plain React with TailwindCSS (No ShadCN)
import React, { useState } from 'react';
// import { useAuth } from '@/context/AuthContext';
import { Search, MapPin, Calendar, User, ArrowRight, Filter } from 'lucide-react';
import { StatusBadge } from '../components/Dashboard/StatsBadge';
import { ArrowLeftCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const mockPendingFarmers = [
  {
    id: 'farmer-1',
    name: 'Rajesh Kumar',
    location: 'Mysore, Karnataka',
    village: 'Belavadi',
    district: 'Mysore',
    phoneNumber: '+91 98765 43210',
    requestDate: '2024-01-20',
    assignedAgentId: 'agent-1',
    status: 'pending',
  },
  {
    id: 'farmer-2',
    name: 'Priya Devi',
    location: 'Mandya, Karnataka',
    village: 'Srirangapatna',
    district: 'Mandya',
    phoneNumber: '+91 98765 43211',
    requestDate: '2024-01-19',
    assignedAgentId: 'agent-1',
    status: 'pending',
  },
  {
    id: 'farmer-3',
    name: 'Suresh Reddy',
    location: 'Tumkur, Karnataka',
    village: 'Kunigal',
    district: 'Tumkur',
    requestDate: '2024-01-18',
    assignedAgentId: 'agent-1',
    status: 'pending',
  },
];

    // const [user,setUser] = useState({
    //   id: 'agent-1',
    //   role: 'agent',
    //   name: 'Ravi Kumar'});

    const user = {
      id: 'agent-1',
      role: 'agent',
      name: 'Ravi Kumar',}
      
export default function PendingWork() {
//   const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFarmer, setSelectedFarmer] = useState(null);

  const navigate = useNavigate();

  const filteredFarmers = mockPendingFarmers.filter(farmer => {
    const matchesSearch = farmer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      farmer.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      farmer.village.toLowerCase().includes(searchTerm.toLowerCase());

    if (user?.role === 'agent') {
      return farmer.assignedAgentId === user.id && matchesSearch;
    }
    return matchesSearch;
  });

  const handleProceed = (farmer) => {
    setSelectedFarmer(farmer);
    console.log('Proceeding with farmer:', farmer);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          
          <div className='flex items-center space-x-4'>
          <div className='cursor-pointer' onClick={() => navigate("/dashboard")}>
            <ArrowLeftCircle className="h-7 w-7 text-black mr-4" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Pending Work</h1>
            <p className="text-gray-500">Farmers waiting for insurance claim submission</p>
          </div>
          </div>
          <span className="bg-yellow-300 text-sm px-3 py-1 rounded-full">{filteredFarmers.length} Pending Requests</span>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <div className="flex gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              className="pl-10 w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-600"
              placeholder="Search by farmer name, village, or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="border px-4 py-2 rounded-lg text-sm flex items-center gap-2">
            <Filter className="h-4 w-4" /> Filters
          </button>
        </div>

        <div className="space-y-4">
          {filteredFarmers.length === 0 ? (
            <div className="border rounded-lg bg-white p-8 text-center">
              <User className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium mb-2">No pending requests</h3>
              <p className="text-gray-500">
                {searchTerm
                  ? 'No farmers found matching your search criteria.'
                  : 'All farmers in your jurisdiction have been processed.'}
              </p>
            </div>
          ) : (
            filteredFarmers.map(farmer => (
              <div key={farmer.id} className="border rounded-lg p-6 bg-white hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold">{farmer.name}</h3>
                      <StatusBadge status={farmer.status} />
                    </div>

                    <div className="text-sm text-gray-500 flex gap-4">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" /> {farmer.village}, {farmer.district}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" /> Requested {formatDate(farmer.requestDate)}
                      </div>
                    </div>

                    <p className="text-sm"><span className="font-medium">Location:</span> {farmer.location}</p>
                    {farmer.phoneNumber && (
                      <p className="text-sm"><span className="font-medium">Phone:</span> {farmer.phoneNumber}</p>
                    )}
                  </div>

                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => handleProceed(farmer)}
                      className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2"
                    >
                      Proceed <ArrowRight className="h-4 w-4" />
                    </button>
                    <button className="border text-sm px-4 py-2 rounded-lg">View Details</button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {selectedFarmer && (
          <div className="mt-6 border-l-4 border-green-600 bg-white rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-1">Proceeding with {selectedFarmer.name}</h3>
            <p className="text-sm text-gray-500 mb-4">This would open the insurance submission form with pre-filled farmer details</p>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="font-medium">Farmer ID:</span> {selectedFarmer.id}</div>
              <div><span className="font-medium">Request Date:</span> {formatDate(selectedFarmer.requestDate)}</div>
              <div><span className="font-medium">Village:</span> {selectedFarmer.village}</div>
              <div><span className="font-medium">District:</span> {selectedFarmer.district}</div>
            </div>
            <div className="flex gap-2 mt-4">
              <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm">Start Submission</button>
              <button onClick={() => setSelectedFarmer(null)} className="border px-4 py-2 rounded-lg text-sm">Cancel</button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
