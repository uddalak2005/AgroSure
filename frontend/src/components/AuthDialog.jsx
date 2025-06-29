import { useState } from 'react';
import { MapPin, User, Phone, Leaf } from "lucide-react";
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../utils/firebaseConfig';
import { useNavigate } from 'react-router-dom';
// import { toast } from "@/hooks/use-toast";

const AuthDialog = ({ isOpen, onClose, onLogin, onRegister }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [userid,setuserid] = useState(null);
  const [loginFormData, setLoginFormData] = useState({
    email: '',
    password: ''
  });
  const [formData, setFormData] = useState({
    uid : userid ? userid : '',
    name: '',
    phone: '',
    email: '',
    password: '',
    totalLand: '',
    locationLat: '',
    locationLong: '',
    crops: '',
    aadhar : '',
  });

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

  const navigate = useNavigate();

  const signUpUser = async (email, password) => {
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        console.log("User signed up:", userCredential.user);
        return userCredential.user;
      } catch (error) {
        console.error("Signup error:", error.message);
        throw error;
      }
    };

    const handleSignup = async (email,password) => {
        try {
          const user = await signUpUser(email, password);
          setuserid(user.uid);
          console.log("Account created succesfully! Leading to DB storage");
          handleSubmit();
          // redirect or show message
        } catch (err) {
          console.log(err.message);
        }
      };

  const handleSubmit = async() => {
      // Mock registration
      const payload = {
        uid : userid ? userid : '',
        name: formData.name || "Souherdya Sarkar",
        email : formData.email || "souherdyasarkar@gmail.com",
        totalLand: formData.totalLand || '5 acre',
        locationLat: formData.locationLat || '22.572645',
        locationLong: formData.locationLong || '88.363892',
        crops: formData.crops.split(',').map(crop => crop.trim()) || ['Rice','Wheat','Paddy'],
        phone: formData.phone || 8910169299,
      }

      try{
        
      const response = await fetch("Backend_URI/route",{
        method: 'POST',
        body: JSON.stringify(payload)
      });
      if(response.ok){
        console.log("User data set to DB");
        navigate('/dashboard'); // Navigate to dashboard route
      }

      const data = await response.json();
      console.log(data);
  }
  catch(err){
    console.log(err);
  }
}

  // If the dialog is not open, don't render anything
  if (!isOpen) {
    return null;
  }

  return (
    // Replaces Dialog component
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={onClose}>
      {/* Replaces DialogContent */}
      <div className="relative w-full max-w-md rounded-lg border bg-agricultural-soft-sand border-agricultural-stone-gray/20 p-6 shadow-lg sm:max-w-md" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4"
          >
            <path d="M18 6L6 18"></path>
            <path d="M6 6L18 18"></path>
          </svg>
          <span className="sr-only">Close</span>
        </button>

        <div
          className="absolute inset-0 opacity-10 bg-cover bg-center rounded-lg"
          style={{
            backgroundImage: 'url("https://images.unsplash.com/photo-1500076656116-558758c991c1?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80")'
          }}
        />

        <div className="relative z-10">
          {/* Replaces DialogHeader */}
          <div className="text-center mb-6">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <Leaf className="h-8 w-8 text-agricultural-forest-green" />
              {/* Replaces DialogTitle */}
              <h2 className="text-2xl font-bold text-agricultural-soil-brown">
                AgriFinance
              </h2>
            </div>
            <p className="text-agricultural-stone-gray">
              {isLogin ? 'Welcome back to your farming journey' : 'Start your farming journey with us'}
            </p>
          </div>

          {/* Replaces Tabs */}
          <div className="flex flex-col">
            {/* Replaces TabsList */}
            <div className="grid w-full grid-cols-2 mb-6 bg-white rounded-md p-1">
              {/* Replaces TabsTrigger for Login */}
              <button
                onClick={() => setIsLogin(true)}
                className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${isLogin ? 'bg-agricultural-forest-green text-white' : 'text-agricultural-stone-gray hover:text-agricultural-soil-brown'}`}
              >
                Login
              </button>
              {/* Replaces TabsTrigger for Register */}
              <button
                onClick={() => setIsLogin(false)}
                className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${!isLogin ? 'bg-agricultural-forest-green text-white' : 'text-agricultural-stone-gray hover:text-agricultural-soil-brown'}`}
              >
                Register
              </button>
            </div>

            <form>
              {/* Replaces TabsContent for Login */}
              {isLogin && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="email" className="text-agricultural-soil-brown font-medium text-sm block">
                      Email Address
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-agricultural-stone-gray" />
                      <input
                        id="email"
                        type="email"
                        placeholder="Enter your email address"
                        className="flex h-10 w-full rounded-md border border-agricultural-stone-gray/30 bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-agricultural-forest-green focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 pl-10"
                        value={loginFormData.email}
                        onChange={(e) => setLoginFormData(prev => ({ ...prev, email: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="password" className="text-agricultural-soil-brown font-medium text-sm block">
                      Password
                    </label>
                    <input
                      id="password"
                      type="password"
                      placeholder="Enter your password"
                      className="flex h-10 w-full rounded-md border border-agricultural-stone-gray/30 bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-agricultural-forest-green focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={loginFormData.password}
                      onChange={(e) => setLoginFormData(prev => ({ ...prev, password: e.target.value }))}
                    />
                  </div>
                </div>
              )}

              {/* Replaces TabsContent for Register */}
              {!isLogin && (
  <div className="space-y-4">
    <div className="space-y-2">
      <label htmlFor="name" className="text-agricultural-soil-brown font-medium text-sm block">
        Full Name
      </label>
      <div className="relative">
        <User className="absolute left-3 top-3 h-4 w-4 text-agricultural-stone-gray" />
        <input
          id="name"
          placeholder="Enter your full name"
          className="flex h-10 w-full rounded-md border border-agricultural-stone-gray/30 bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-agricultural-forest-green focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 pl-10"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          required
        />
      </div>
    </div>

    {/* New Email Field */}
    <div className="space-y-2">
      <label htmlFor="email" className="text-agricultural-soil-brown font-medium text-sm block">
        Email Address
      </label>
      <div className="relative">
        {/* You might want an email icon here, for example: <Mail className="absolute left-3 top-3 h-4 w-4 text-agricultural-stone-gray" /> */}
        <input
          id="email"
          type="email" // Use type="email" for better mobile keyboard and basic validation
          placeholder="Enter your email"
          className="flex h-10 w-full rounded-md border border-agricultural-stone-gray/30 bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-agricultural-forest-green focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 pl-3" // Adjusted padding if no icon
          value={formData.email}
          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
          required
        />
      </div>
    </div>

    <div className="space-y-2">
      <label htmlFor="phone" className="text-agricultural-soil-brown font-medium text-sm block">
        Phone Number
      </label>
      <div className="relative">
        <Phone className="absolute left-3 top-3 h-4 w-4 text-agricultural-stone-gray" />
        <input
          id="phone"
          placeholder="+91 98765 43210"
          className="flex h-10 w-full rounded-md border border-agricultural-stone-gray/30 bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-agricultural-forest-green focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 pl-10"
          value={formData.phone}
          onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
          required
        />
      </div>
    </div>

    <div className="space-y-2">
      <label htmlFor="landSize" className="text-agricultural-soil-brown font-medium text-sm block">
        Land Size (Acres)
      </label>
      <input
        id="landSize"
        placeholder="e.g., 12.5"
        className="flex h-10 w-full rounded-md border border-agricultural-stone-gray/30 bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-agricultural-forest-green focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        value={formData.landSize}
        onChange={(e) => setFormData(prev => ({ ...prev, landSize: e.target.value }))}
        required
      />
    </div>

    <div className="space-y-2">
      <div className="flex items-center space-x-2">
        <input
          id="locationCheckbox"
          type="checkbox"
          className="h-4 w-4 text-agricultural-forest-green focus:ring-agricultural-forest-green border-agricultural-stone-gray/30 rounded"
          onChange={(e) => {
            if (e.target.checked) {
              getLocationAndUpdate();
            }
          }}
        />
        <label htmlFor="locationCheckbox" className="text-agricultural-soil-brown font-medium text-sm">
          📍 Take my location
        </label>
      </div>
      {(formData.locationLat && formData.locationLong) && (
        <p className="text-xs text-agricultural-stone-gray">
          Location captured: {formData.locationLat}, {formData.locationLong}
        </p>
      )}
    </div>

    <div className="space-y-2">
      <label htmlFor="crops" className="text-agricultural-soil-brown font-medium text-sm block">
        Crops Grown
      </label>
      <input
        id="crops"
        placeholder="e.g., Wheat, Rice, Cotton"
        className="flex h-10 w-full rounded-md border border-agricultural-stone-gray/30 bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-agricultural-forest-green focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        value={formData.crops}
        onChange={(e) => setFormData(prev => ({ ...prev, crops: e.target.value }))}
        required
      />
    </div>

    <div className="space-y-2">
      <label htmlFor="registerPassword" className="text-agricultural-soil-brown font-medium text-sm block">
        Create Password
      </label>
      <input
        id="registerPassword"
        type="password"
        placeholder="Create a secure password"
        className="flex h-10 w-full rounded-md border border-agricultural-stone-gray/30 bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-agricultural-forest-green focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        value={formData.password}
        onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
        required
      />
    </div>
  </div>
)}

              <button
                type="button"
                className="w-full mt-6 bg-agricultural-forest-green hover:bg-agricultural-crop-green text-white font-semibold py-3 rounded-md transition-all duration-300"
                onClick={(e) => {
                  e.preventDefault();
                  if (isLogin) {
                    onLogin(loginFormData.email, loginFormData.password);
                  } else {
                    handleSignup(formData.email, formData.password);
                  }
                }}
              >
                {isLogin ? 'Login to Dashboard' : 'Create Account'}
              </button>
            </form>
          </div>

          <div className="text-center mt-4 text-sm text-agricultural-stone-gray">
            {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-agricultural-forest-green hover:underline font-medium"
            >
              {isLogin ? 'Register here' : 'Login here'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthDialog;