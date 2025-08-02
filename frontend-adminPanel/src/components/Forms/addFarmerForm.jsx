import React, { useState } from 'react';
import { auth } from '../../utils/firebaseConfig';
import { showToast } from '../../context/notifContext';
import { useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { useAuth } from '../../context/AuthContext';
import { Type } from 'lucide-react';
import CustomLoader from '../loader/CustomLoader';
import { signInWithEmailAndPassword } from 'firebase/auth';
export const AddFarmer = () => {

    const navigate = useNavigate();
    const {user, isloggedIn, logout} = useAuth();

    const [loading,setloading] = useState(false);
    const [isRegistered,setisRegistered] = useState(false);
    const [isAgentLoggedOut, setisAgentLoggedOut] = useState(false);
    const [isFarmerLoggedin, setisFarmerLoggedin] = useState(false);

    const [formData, setFormData] = useState({
    uid : '',
    kioskUid:  user?.id, 
    name: '',
    phone: '',
    email: '',
    password: '',
    totalLand: '',
    locationLat: '',
    locationLong: '',
    crops: '',
    aadhar: '',
  });

  const handleFarmerLogin = async() => {
    try {
      const userCreds = await signInWithEmailAndPassword(auth,formData.email,formData.password);
      if(userCreds){
        console.log("Famer is logged in! : " , userCreds.user);
        setisFarmerLoggedin(true);
      }
    } catch (error) {
        console.log("Error logging farmer in");
    }
  } 


  const handleSubmit = async() => {

    setloading(true);
    const Farmeruid = await getfarmerUid(formData.email, formData.password);
    setisRegistered(true);
    
      // Mock registration
      const payload = {
        uid : Farmeruid,
        kioskUid: user.id,
        aadhar: formData.aadhar || '1234-5678-9012',
        name: formData.name || "Souherdya Sarkar",
        email : formData.email || "souherdyasarkar@gmail.com",
        totalLand: formData.totalLand || '5 acre',
        locationLat: formData.locationLat || '22.572645',
        locationLong: formData.locationLong || '88.363892',
        crops: formData.crops.split(',').map(crop => crop.trim()) || ['Rice','Wheat','Paddy'],
        phone: formData.phone || 8910169299,
      }

    console.log("payload : ", payload);

    try {

      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/kiosk/farmer/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json', // <-- This tells backend you're sending JSON
        },
        body: JSON.stringify(payload)
      });
      if (response.ok) {
        const data = await response.json(); // ✅ important step
        console.log("User data set to DB");
        await logout();
        setisAgentLoggedOut(true);
        await handleFarmerLogin();
        window.location.href = `${import.meta.env.VITE_AGROSURE_LOGIN_URL}/dashboard`;
      }

      const data = await response.json();
      console.log(data);
    }
    catch (err) {
      console.log(err);
    }


  }


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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const getfarmerUid = async (email, password) => {
    const userCreds = await createUserWithEmailAndPassword(auth, email, password);

    if (userCreds.user) {
      console.log("Registration succesfull");
      return userCreds.user.uid;
    }

  }

  return (
    <div className='relative w-[100%] h-[100%] flex items-center justify-center p-2 lg:p-4'>

  {loading && (
  <div className='absolute flex h-[100vh] w-[100vw] bg-white/50 items-center justify-center z-50'>
    {isFarmerLoggedin ? (
      <CustomLoader message="Redirecting to farmer dashboard..." />
    ) : isAgentLoggedOut ? (
      <CustomLoader message="Logging farmer in..." />
    ) : isRegistered ? (
      <CustomLoader message="Logging you out..." />
    ) : (
      <CustomLoader message="Registering the farmer..." />
    )}
  </div>
  )}
    <div className="w-[95%] lg:w-[70%] overflow-auto bg-background flex items-center justify-center">
      <div className="w-full">
        <div className="bg-card rounded-xl shadow-lg border border-border p-8">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-foreground mb-2">Add New Farmer</h1>
            <p className="text-muted-foreground">Register a new Farmer under your jurisdiction</p>
          </div>

            <form className="space-y-4">
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
                  className="w-full px-3 py-2 bg-background border border-input rounded-lg 
                focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent 
                text-foreground placeholder:text-muted-foreground transition-colors"
                  placeholder="Enter agent's full name"
                />
              </div>

              <div className='flex flex-col lg:flex-row gap-4'>

                <div className='w-full'>

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
                    className="w-full px-3 py-2 bg-background border border-input rounded-lg 
                focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent 
                text-foreground placeholder:text-muted-foreground transition-colors"
                    placeholder="agent@example.com"
                  />
                </div>

                <div className='w-full'>
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

              </div>

              <div>

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
                  className="w-full px-3 py-2 bg-background border border-input 
                rounded-lg focus:outline-none focus:ring-2 focus:ring-ring 
                focus:border-transparent text-foreground placeholder:text-muted-foreground transition-colors"
                  placeholder="+1 (555) 000-0000"
                />
              </div>

              <div>
                <label
                  htmlFor="aadhar"
                  className="block text-sm font-medium text-foreground mb-2"
                >
                  Aadhar Number
                </label>
                <input
                  type="text"
                  id="aadhar"
                  name="aadhar"
                  value={formData.aadhar}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 bg-background border border-input 
                rounded-lg focus:outline-none focus:ring-2 focus:ring-ring 
                focus:border-transparent text-foreground placeholder:text-muted-foreground transition-colors"
                  placeholder="e.g. 1234-5678-9012"
                />
              </div>

              <div className='flex gap-4'>
                <div className='w-full'>
                  <label
                    htmlFor="crops"
                    className="block text-sm font-medium text-foreground mb-2"
                  >
                    Crops
                  </label>
                  <input
                    type="text"
                    id="crops"
                    name="crops"
                    value={formData.crops}
                    onChange={(e) => setFormData(prev => ({ ...prev, crops: e.target.value }))}
                    required
                    className="w-full px-3 py-2 bg-background border border-input 
                rounded-lg focus:outline-none focus:ring-2 focus:ring-ring 
                focus:border-transparent text-foreground placeholder:text-muted-foreground transition-colors"
                    placeholder="e.g. Rice, Wheat, Paddy"
                  />
                </div>

                <div className='w-full'>
                  <label
                    htmlFor="address"
                    className="block text-sm font-medium text-foreground mb-2"
                  >
                    Total land(Acres)
                  </label>
                  <input
                    type='number'
                    id="totalLand"
                    name="totalLand"
                    value={formData.totalLand}
                    onChange={handleInputChange}
                    required
                    rows={3}
                    className="w-full px-3 py-2 bg-background border border-input 
                rounded-lg focus:outline-none focus:ring-2 focus:ring-ring 
                focus:border-transparent text-foreground placeholder:text-muted-foreground transition-colors"
                    placeholder="Enter total land"
                  />
                </div>
              </div>

              <div className='flex justify-left items-center pl-2'>
                <input type='checkbox' className='w-4 h-4 text-green-500 focus:ring-green-500 rounded'
                  onChange={(e) => {
                    if (e.target.checked) {
                      getLocationAndUpdate();
                    }
                  }}
                />
                <label
                  htmlFor="location"
                  className="block text-sm font-medium text-foreground ml-4"
                >
                  Take my location
                </label>

              </div>
              {(formData.locationLat && formData.locationLong) && (
                <p className="text-xs text-agricultural-stone-gray">
                  Location captured: {formData.locationLat}, {formData.locationLong}
                </p>
              )}

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
                    totalLand: '',
                    locationLat: '',
                    locationLong: '',
                    crops: '',
                  })
                  }>
                  Cancel
                </button>
                {loading ? <button
                  type="button"
                  className="flex-1 p-3 lg:px-4 lg:py-3 bg-primary/40 text-primary-foreground rounded-lg 
                hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring 
                transition-colors font-medium lg:text-base text-sm"
                >
                  Registering...
                </button>
                  :
                  <button
                    type="button"
                    className="flex-1 p-3 lg:px-4 lg:py-3 bg-primary text-primary-foreground rounded-lg 
                hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring 
                transition-colors font-medium lg:text-base text-sm"
                    onClick={handleSubmit}>
                    Register Farmer
                  </button>
                }
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};