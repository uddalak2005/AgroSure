import React from 'react'
import { useState } from 'react';
import { useEffect } from 'react';
import { SearchCheckIcon } from 'lucide-react';
import '../App.css'
import KioskCard from '../components/Cards/FarmerCard';
import { useAuth } from '../context/AuthContext';
export default function AllFarmers() {

    const {user,isloggedIn} = useAuth();
    const [kiosks, setKiosks] = useState([
  {
    manager: 'Ravi Kumar',
    place: 'Durg',
    state: 'Uttar Pradesh',
    id: '012',
    farmers: 212,
    claims: 12,
    pending: 2,
    status: 'Active',
    online: true,
  },
  {
    manager: 'Asha Verma',
    place: 'Patiala',
    state: 'Punjab',
    id: '013',
    farmers: 178,
    claims: 9,
    pending: 1,
    status: 'Active',
    online: false,
  },
  {
    manager: 'Sunil Mehta',
    place: 'Nagpur',
    state: 'Maharashtra',
    id: '014',
    farmers: 250,
    claims: 15,
    pending: 3,
    status: 'Inactive',
    online: false,
  },
  {
    manager: 'Kavita Sharma',
    place: 'Indore',
    state: 'Madhya Pradesh',
    id: '015',
    farmers: 198,
    claims: 10,
    pending: 0,
    status: 'Active',
    online: true,
  },
  {
    manager: 'Rajesh Yadav',
    place: 'Lucknow',
    state: 'Uttar Pradesh',
    id: '016',
    farmers: 305,
    claims: 18,
    pending: 4,
    status: 'Active',
    online: true,
  },
  {
    manager: 'Pooja Sinha',
    place: 'Jamshedpur',
    state: 'Jharkhand',
    id: '017',
    farmers: 160,
    claims: 6,
    pending: 2,
    status: 'Inactive',
    online: false,
  },
  {
    manager: 'Ram pal',
    place: 'Durgapur',
    state: 'Birbhum',
    id: '022',
    farmers: 198,
    claims: 10,
    pending: 0,
    status: 'Active',
    online: true,
  },
]);

    const [searchresults, setSearchResults] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading,setloading] = useState(false);
        
        useEffect(() => {
            if(searchTerm.length > 0){
                return;
            }
            else{
                setSearchResults([]);
            }
        },[searchTerm]);
    
        
        const makeSearch = () => {
            const query = searchTerm.toLowerCase().trim();
            const results = kiosks.filter(kiosk => 
                kiosk.manager.toLowerCase().includes(query) ||
                kiosk.place.toLowerCase().includes(query) ||
                kiosk.state.toLowerCase().includes(query)
            );
    
            setSearchResults(results);
        }

    const fetchAllKiosks = async() => {
        setloading(true);
        const response = await fetch('https://api.example.com/allkiosks', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });
        if(response.ok) {
            const data = await response.json();
            setKiosks(data.kiosks);
        }
    }
  return (
    <div className='w-full h-[100vh] flex flex-col items-center justify-center p-2'>
        <div className='w-full bg-accent/50 flex flex-[2] justify-center items-center bg-accent/50'>
            <div className='w-[90%] lg:w-[60%] rounded-lg bg-white flex justify-between items-center p-2'>
                <input
                onChange={(e) => setSearchTerm(e.target.value)}
                type='text'
                placeholder='Search Farmers...'
                className='w-full border rounded-lg px-3 py-3 text-sm text-foreground bg-accent/30
                focus:bg-white focus:border-green-500
                 focus:outline-none focus:ring-2 focus:ring-green-600 mr-2'
                />

                <button
                onClick={makeSearch}
                className='bg-green-500 hover:bg-green-600 text-foreground px-4 py-2 rounded-lg text-sm ml-2'>
                    <SearchCheckIcon/>
                </button>
            </div>
        </div>

        <div className='w-full flex flex-col flex-[9] items-center overflow-y-auto p-4 bg-background bg-accent-background'>
        
        <div className='w-[80%] flex flex-col items-start mb-4'>
            <h1 className='text-2xl font-bold text-foreground mb-2'>All Farmers under {user.name}</h1>
            <p className='text-sm text-muted-foreground mb-1'>Manage and view all farmers registered under you</p>
        </div>

            <div className='grid grid-cols-1 lg:grid-cols-3 gap-6 lg:grid-cols:4
             w-[100%] lg:w-[80%] overflow-y-auto max-h-[100%] bg-background
              border-t-2 border-orange-700
              scrollbar-hide p-3'>
              {loading ? <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div> :
                    searchresults.length > 0
                            ? searchresults.map((kiosk, index) => (
                                <KioskCard key={index} kiosk={kiosk} />
                            ))
                            : kiosks.map((kiosk, index) => (
                                <KioskCard key={index} kiosk={kiosk} />
                            ))}
            </div>  
        </div>
    </div>
  )
}
