import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth } from '../utils/firebaseConfig';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { signInWithPopup } from 'firebase/auth';
import { provider } from '../utils/firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [authState, setAuthState] = useState({
    user: null,
    isLoading: true,
    isAuthenticated: false,
  });

  useEffect(() => {
    const savedUser = localStorage.getItem('insuranceAgent');
    if (savedUser) {
      setAuthState({
        user: JSON.parse(savedUser),
        isLoading: false,
        isAuthenticated: true,
      });
    } else {
      setAuthState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  const checkCookies = async () => {
  return new Promise((resolve) => {
    onAuthStateChanged(auth, (user) => {
      if (user) {
        const agentData = {
          id: user.uid,
          role: 'agent',
          name: user.displayName || 'Ravi Kumar',
        };

        setAuthState({
          user: agentData,
          isAuthenticated: true,
          isLoading: false,
        });

        localStorage.setItem('insuranceAgent', JSON.stringify(agentData));

        resolve(1);
      } else {
        setAuthState(prev => ({ ...prev, isLoading: false }));
        resolve(0); 
      }
    });
  });
};

  const login = async (email, password) => {
    try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    
    const loggedInUser = {
      id: userCredential.user.uid, 
      role: 'agent',               
      name: userCredential.user.displayName || 'AgroSure Agent',
    };

    if (userCredential.user.uid === import.meta.env.VITE_ADMIN_UID) {
    console.log('Admin logged in')
    setAuthState(
      {
      user : {
        id: loggedInUser.id,
        role: 'admin',
        name: loggedInUser.name,
      },
      isAuthenticated: true,
      isLoading: false
    })
    localStorage.setItem('insuranceAgent', JSON.stringify({
      id: loggedInUser.id,
      role: 'admin',
      name: loggedInUser.name,
    }));
  }
    else {
    setAuthState( 
    {
      user: loggedInUser,
      isLoading: false,
      isAuthenticated: true,
    });
    localStorage.setItem('insuranceAgent', JSON.stringify(loggedInUser));
    }
    console.log('Login successful');

  } catch (error) {
    console.error('Login error:', error.message);
    setAuthState(prev => ({ ...prev, isLoading: false }));
    throw new Error('Invalid credentials');
  }
  };

  const logout = () => {
    localStorage.removeItem('insuranceAgent');
    auth.signOut();
    setAuthState({
      user: null,
      isLoading: false,
      isAuthenticated: false,
    });
  };

  const handleGoogleLogin = async () => {
    setAuthState(prev => ({ ...prev, isLoading: true }));
    try {
      const result = await signInWithPopup(auth, provider);

      setAuthState({
        user : result.user
          ? result.user.uid === import.meta.env.VITE_ADMIN_UID ? {
            id: result.user.uid,
            role: 'admin',
            name: result.user.displayName || 'AgroSure Admin',
          } : 
          {
            id: result.user.uid,
            role: 'agent',
            name: result.user.displayName || 'Ravi Kumar',
          }
          : null,
        isAuthenticated : true,
        isLoading: false,
      });
      localStorage.setItem('insuranceAgent', JSON.stringify({
        id: result.user.uid,
        role: 'agent',
        name: result.user.displayName || 'Ravi Kumar',
      }));
    } catch (error) {
      console.error("Login error:", error);
    }
  };

  const handleLogout = () => {
    auth.signOut();
    setAuthState({
      user: null,
      isAuthenticated:false,
      isLoading: false,
    });
    localStorage.removeItem('insuranceAgent');
  };


  return (
    <AuthContext.Provider value={{ ...authState, login, logout, handleGoogleLogin, handleLogout, checkCookies }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}