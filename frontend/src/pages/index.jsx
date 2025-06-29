import { useState } from 'react';
import { MapPin, CheckCircle, Users, TrendingUp, Leaf, Shield, BarChart3 } from "lucide-react";
import AuthDialog from "../components/AuthDialog";
import FarmerDashboard from "../components/FarmerDashboard";
import { onAuthStateChanged } from "firebase/auth";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { signInWithEmailAndPassword } from "firebase/auth";
import {auth} from '../utils/firebaseConfig'
import { useNavigate } from 'react-router-dom';
import SimpleGoogleTranslate from '../components/SimpleGoogleTranslate';

const Index = () => {
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  const navigate = useNavigate();
  const observeAuthState = (onUserAuthenticated, onUserNotAuthenticated) => {
    onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log("User is logged in:", user);
        onUserAuthenticated(user);
      } else {
        console.log("No user is logged in.");
        onUserNotAuthenticated();
      }
    });
  };

   const signInUser = async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log("User signed in:", userCredential.user);
      return userCredential.user;
    } catch (error) {
      console.error("Signin error:", error.message);
      throw error;
    }
  };

  const handleAuthCheck = () => {
    observeAuthState(
      (user) => {
        // User is logged in
        setCurrentUser(user);
        setIsLoggedIn(true);
      },
      () => {
        // No user is logged in
        // navigate("/login");
      }
    );
  };
  
  const handleSignin = async (email,password) => {
    try {
      const user = await signInUser(email, password);
      setIsLoggedIn(true);
      setCurrentUser(user);
      // redirect or show message
    } catch (err) {
      console.log(err.message);
    }
  };

  if (isLoggedIn && currentUser) {
    navigate("/dashboard");
  }

  return (
    <div className="min-h-screen bg-agricultural-soft-sand">
      {/* Navigation */}
      <nav className="bg-white/95 backdrop-blur-sm border-b border-agricultural-stone-gray/20 sticky top-0 z-50">
      <SimpleGoogleTranslate />
      
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <Leaf className="h-8 w-8 text-agricultural-forest-green" />
              <span className="text-xl font-bold text-agricultural-soil-brown">AgroSure</span>
            </div>
            <button
              onClick={() => {
                setIsAuthOpen(true)
                handleAuthCheck()}
                }
              className="bg-agricultural-forest-green hover:bg-agricultural-crop-green text-white transition-all duration-300 px-4 py-2 rounded-md text-sm font-medium"
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div
          className="h-[600px] bg-cover bg-center relative"
          style={{
            backgroundImage: 'linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.3)), url("https://images.unsplash.com/photo-1500076656116-558758c991c1?ixlib=rb-4.0.3&auto=format&fit=crop&w=2071&q=80")'
          }}
        >
          <div className="absolute inset-0 hero-gradient"></div>
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center">
            <div className="max-w-3xl text-white animate-fade-in">
              <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
                Empowering Farmers with
                <span className="block text-agricultural-harvest-gold">Data-Backed Financial Support</span>
              </h1>
              <p className="text-xl md:text-2xl mb-8 text-white/90 leading-relaxed">
                Get accurate yield predictions and secure agricultural loans with confidence.
                Our AI-powered platform helps you make informed farming decisions.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => setIsAuthOpen(true)}
                  className="bg-agricultural-harvest-gold hover:bg-agricultural-harvest-gold/90 text-agricultural-soil-brown font-semibold text-lg px-8 py-4 rounded-md transition-all duration-300 transform hover:scale-105"
                >
                  Start Your Journey
                </button>
                <button
                  className="border-white text-white hover:bg-white hover:text-agricultural-soil-brown font-semibold text-lg px-8 py-4 rounded-md transition-all duration-300 border-2"
                >
                  Learn More
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 animate-slide-up">
            <h2 className="text-4xl font-bold text-agricultural-soil-brown mb-4">
              How It Works
            </h2>
            <p className="text-xl text-agricultural-stone-gray max-w-2xl mx-auto">
              Simple steps to get your yield prediction and secure agricultural financing
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              {
                icon: MapPin,
                title: "Register Your Land",
                description: "Add your farm location, size, and crop details to our secure platform"
              },
              {
                icon: Leaf,
                title: "Select Your Crop",
                description: "Choose from various crop types and specify your planting timeline"
              },
              {
                icon: BarChart3,
                title: "Get Predictions",
                description: "Receive AI-powered yield forecasts based on weather and soil data"
              },
              {
                icon: Shield,
                title: "Secure Financing",
                description: "Present your data-backed report to banks for loan approval"
              }
            ].map((step, index) => (
              <div key={index} className="text-center p-6 warm-shadow hover:shadow-lg transition-all duration-300 border border-agricultural-stone-gray/20 rounded-lg bg-white">
                <div className="pt-6">
                  <div className="w-16 h-16 bg-agricultural-forest-green/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <step.icon className="h-8 w-8 text-agricultural-forest-green" />
                  </div>
                  <h3 className="text-xl font-semibold text-agricultural-soil-brown mb-2">
                    {step.title}
                  </h3>
                  <p className="text-agricultural-stone-gray">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-agricultural-soft-sand">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="animate-slide-up">
              <h2 className="text-4xl font-bold text-agricultural-soil-brown mb-6">
                Trusted by Farmers Across India
              </h2>
              <p className="text-xl text-agricultural-stone-gray mb-8">
                Our platform combines traditional farming wisdom with modern technology
                to provide accurate, reliable yield predictions that banks trust.
              </p>

              <div className="space-y-4">
                {[
                  "95% Accuracy in yield predictions",
                  "Partnership with major banks",
                  "Weather-integrated forecasting",
                  "Multilingual support"
                ].map((feature, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <CheckCircle className="h-6 w-6 text-agricultural-crop-green" />
                    <span className="text-agricultural-soil-brown font-medium">{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="p-6 text-center warm-shadow rounded-lg bg-white">
                <div className="pt-6">
                  <div className="text-3xl font-bold text-agricultural-forest-green mb-2">50K+</div>
                  <div className="text-agricultural-stone-gray">Farmers Registered</div>
                </div>
              </div>
              <div className="p-6 text-center warm-shadow rounded-lg bg-white">
                <div className="pt-6">
                  <div className="text-3xl font-bold text-agricultural-forest-green mb-2">₹500Cr+</div>
                  <div className="text-agricultural-stone-gray">Loans Approved</div>
                </div>
              </div>
              <div className="p-6 text-center warm-shadow rounded-lg bg-white">
                <div className="pt-6">
                  <div className="text-3xl font-bold text-agricultural-forest-green mb-2">95%</div>
                  <div className="text-agricultural-stone-gray">Accuracy Rate</div>
                </div>
              </div>
              <div className="p-6 text-center warm-shadow rounded-lg bg-white">
                <div className="pt-6">
                  <div className="text-3xl font-bold text-agricultural-forest-green mb-2">24/7</div>
                  <div className="text-agricultural-stone-gray">Support Available</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Partners Section */}
      <section className="py-16 bg-white border-t border-agricultural-stone-gray/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h3 className="text-2xl font-semibold text-agricultural-soil-brown mb-4">
              Trusted by Leading Financial Institutions
            </h3>
            <div className="flex flex-wrap justify-center items-center gap-8 opacity-60">
              {["SBI", "HDFC Bank", "ICICI Bank", "Axis Bank", "Bank of Baroda"].map((bank, index) => (
                <div key={index} className="text-lg font-semibold text-agricultural-stone-gray bg-agricultural-soft-sand px-6 py-3 rounded-lg">
                  {bank}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-agricultural-soil-brown text-agricultural-soft-sand py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Leaf className="h-6 w-6" />
                <span className="text-lg font-bold">AgroSure</span>
              </div>
              <p className="text-agricultural-soft-sand/80">
                Empowering farmers with data-driven financial solutions for a sustainable future.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-agricultural-soft-sand/80">
                <li>About Us</li>
                <li>How It Works</li>
                <li>Support</li>
                <li>Contact</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-agricultural-soft-sand/80">
                <li>Privacy Policy</li>
                <li>Terms of Service</li>
                <li>Cookie Policy</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-agricultural-soft-sand/20 mt-8 pt-8 text-center text-agricultural-soft-sand/60">
            <p>&copy; 2024 AgroSure. All rights reserved.</p>
          </div>
        </div>
      </footer>

      <AuthDialog
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onLogin={(email,password) => handleSignin(email,password)}
        onRegister={(email,password)=>handleSignup(email,password)}
      />
    </div>
  );
};

export default Index;