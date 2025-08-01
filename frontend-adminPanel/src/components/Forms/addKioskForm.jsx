import React, { useState } from 'react';
import { auth } from '../../utils/firebaseConfig';
import { showToast } from '../../context/notifContext';
import { useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword } from 'firebase/auth';

export const AddAgentForm = () => {
    const navigate = useNavigate();
  const [formData, setFormData] = useState({
    uid: auth.currentUser ? auth.currentUser.uid : '',
    name: '',
    email: '',
    password:'',
    phone: '',
    address: '',
    locationLat: '',
    locationLong: '',
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const getAgentUid = async(email,password) => {
      const userCreds = await createUserWithEmailAndPassword(auth, email, password);
  
      if(userCreds.user) {
          console.log("Registration succesfull");
          return userCreds.user.uid;
      }
  
    }

  const handleSubmit = async(e) => {
    e.preventDefault();

    const agentUid = await getAgentUid(formData.email, formData.password);

    const payload = {
    uid: agentUid,
    name: formData.name,
    email: formData.email,
    phone: formData.phone,
    address: formData.address,
    locationLat: formData.locationLat,
    locationLong: formData.locationLong,
    }

    console.log('Agent registration data:', payload);
    // Handle form submission here

    const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/kiosk/register`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        });

    if (response.ok) {
        showToast({
            success: 'Agent registered successfully!',
        });
        navigate('/dashboard');
    } else {
        const errorData = await response.json();
        showToast({
            err: `Registration failed: ${errorData.message || 'Unknown error'}`,
        });
    }
  };

  const getLocationAndUpdate = () => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        console.log("Location obtained:", latitude, longitude);
        setFormData(prev => ({
          ...prev,
          locationLat: latitude.toString(),
          locationLong: longitude.toString()
        }));
      },
      (error) => {
        console.error("Geolocation error:", error);
        alert("Unable to get your location. Please check your browser permissions.");
      }
    );
  };


  return (
    <div className='w-full h-full flex items-center justify-center p-4'>
    <div className="w-[95%] lg:w-[30%] bg-background flex items-center justify-center">
      <div className="w-full">
        <div className="bg-card rounded-xl shadow-lg border border-border p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-foreground mb-2">Add New Agent</h1>
            <p className="text-muted-foreground">Register a new insurance agent</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label 
                htmlFor="name" 
                className="block text-sm font-medium text-foreground mb-2"
              >
                Full Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 bg-background border border-input rounded-lg 
                focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent 
                text-foreground placeholder:text-muted-foreground transition-colors"
                placeholder="Enter agent's full name"
              />
            </div>

            <div>
              <label 
                htmlFor="email" 
                className="block text-sm font-medium text-foreground mb-2"
              >
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 bg-background border border-input rounded-lg 
                focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent 
                text-foreground placeholder:text-muted-foreground transition-colors"
                placeholder="agent@example.com"
              />
            </div>

            <div>
            <label 
                htmlFor="password" 
                className="block text-sm font-medium text-foreground mb-2"
              >
                Set password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 bg-background border border-input rounded-lg 
                focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent 
                text-foreground placeholder:text-muted-foreground transition-colors"
                placeholder="Password"
              />
              </div>

            <div>
              <label 
                htmlFor="phone" 
                className="block text-sm font-medium text-foreground mb-2"
              >
                Phone Number
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent text-foreground placeholder:text-muted-foreground transition-colors"
                placeholder="+1 (555) 000-0000"
              />
            </div>

            <div>
              <label 
                htmlFor="address" 
                className="block text-sm font-medium text-foreground mb-2"
              >
                Address
              </label>
              <textarea
                id="address"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                required
                rows={3}
                className="w-full px-4 py-3 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent text-foreground placeholder:text-muted-foreground transition-colors resize-none"
                placeholder="Enter complete address"
              />
            </div>

            <div className='flex justify-left items-center pl-2'>
            <input type='checkbox' className='w-4 h-4 text-green-500 focus:ring-green-500 rounded'
                onChange={(e) => {
            if (e.target.checked) {
              getLocationAndUpdate();
            }
          }}/>
              <label 
                htmlFor="location" 
                className="block text-sm font-medium text-foreground ml-4"
              >
                Take my location
              </label>
            </div>

            <div className="flex gap-4">
              <button
                type="button"
                className="flex-1 px-4 py-3 bg-secondary text-secondary-foreground
                 rounded-lg hover:bg-secondary/80 focus:outline-none focus:ring-2 
                 focus:ring-ring transition-colors font-medium"
                onClick={() => setFormData({
                    uid: '',
                    name: '',
                    email: '',
                    phone: '',
                    address: '',
                    locationLat: '',
                    locationLong: '',
                })
                }>
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring transition-colors font-medium"
              >
                Register Agent
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
    </div>
  );
};