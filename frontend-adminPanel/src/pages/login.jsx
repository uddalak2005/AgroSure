// Login.js - Plain React + TailwindCSS without ShadCN components
import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { showToast } from '../context/notifContext';
import { showError } from '../context/notifContext';
import { Sprout, Mail, Lock } from 'lucide-react';
import { GoogleIcon } from '../utils/icons';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading, handleGoogleLogin, handleLogout, checkCookies } = useAuth();

  const navigate = useNavigate();

  useEffect(() => {
    const checkUser = async () => {
      const result = await checkCookies();
      if (result === 1) {
        showToast({
          success: 'Welcome back!',
        });
        navigate('/dashboard');
      } 
    };
    checkUser();
  }, []);


  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(email, password);
      showToast({
        success: 'Login successful',
        description: 'Welcome to the Crop Insurance Admin Panel',
      });
    } catch (error) {
      showError({
        err: 'Login failed',
        description: 'Please check your credentials and try again',
        variant: 'destructive',
      });
    }
  };

  const handleGoogleSubmit = async(e) => {
    e.preventDefault();
    try {
      await handleGoogleLogin();
      console.log('Google login successful');
      showToast({
        success: 'Login successful',
        description: 'Welcome to the Crop Insurance Admin Panel',
      });
    } catch (error) {
      showError({
        err: 'Login failed',
        description: 'Please try again later',
        variant: 'destructive',
      });
    }

  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <div className="h-16 w-16 bg-green-700 rounded-full flex items-center justify-center">
              <Sprout className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-800">Crop Insurance</h1>
          <p className="text-gray-500">Agent Support Portal</p>
        </div>

        <div className="border rounded-2xl bg-white shadow-sm">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold">Sign In</h2>
            <p className="text-sm text-gray-500">
              Enter your credentials to access the admin panel
            </p>
          </div>
          <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-medium">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <input
                    id="email"
                    type="email"
                    placeholder="agent@cropinsurance.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 pl-10 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label htmlFor="password" className="block text-sm font-medium">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 pl-10 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
                    required
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-medium py-2 px-4 rounded-lg transition disabled:opacity-60"
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
            <div className="mt-6 pl-4 p-2 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center">
                <GoogleIcon/>
                <button
                  onClick={handleGoogleSubmit}
                  className="font-medium px-4 py-2 rounded-lg transition text-yellow-500"
                >
                  Sign in with Google
                </button>
              
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
