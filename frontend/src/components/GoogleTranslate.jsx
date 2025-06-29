import React, { useEffect, useRef, useState } from 'react';
import { Globe, AlertCircle } from "lucide-react";

const GoogleTranslate = () => {
  const translateRef = useRef(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Function to initialize Google Translate
    const initializeGoogleTranslate = () => {
      try {
        console.log('Initializing Google Translate...');
        
        if (window.google && window.google.translate) {
          console.log('Google Translate API found, creating element...');
          
          new window.google.translate.TranslateElement({
            pageLanguage: 'en',
            includedLanguages: 'en,hi,bn,ta,te,ml,kn,mr,gu,pa,or,as,ne,sd,ur',
            layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
            autoDisplay: false,
            multilanguagePage: true
          }, translateRef.current);
          
          setIsLoaded(true);
          console.log('Google Translate element created successfully');
        } else {
          console.log('Google Translate API not available yet');
        }
      } catch (err) {
        console.error('Error initializing Google Translate:', err);
        setError(err.message);
      }
    };

    // Check if Google Translate is already loaded
    if (window.google && window.google.translate) {
      initializeGoogleTranslate();
    } else {
      console.log('Waiting for Google Translate to load...');
      
      // Wait for Google Translate to load
      const checkGoogleTranslate = setInterval(() => {
        if (window.google && window.google.translate) {
          clearInterval(checkGoogleTranslate);
          initializeGoogleTranslate();
        }
      }, 100);

      // Cleanup interval after 10 seconds
      setTimeout(() => {
        clearInterval(checkGoogleTranslate);
        if (!isLoaded) {
          console.error('Google Translate failed to load within 10 seconds');
          setError('Google Translate failed to load');
        }
      }, 10000);
    }
  }, [isLoaded]);

  const handleTranslateClick = () => {
    console.log('Translate button clicked');
    
    try {
      // Method 1: Try to find and click the Google Translate widget
      const translateElement = document.querySelector('.goog-te-gadget');
      if (translateElement) {
        console.log('Found .goog-te-gadget, clicking...');
        translateElement.click();
        return;
      }

      // Method 2: Try to find the select element
      const translateSelect = document.querySelector('#goog-te-combo');
      if (translateSelect) {
        console.log('Found #goog-te-combo, focusing...');
        translateSelect.focus();
        translateSelect.click();
        return;
      }

      // Method 3: Try to find any Google Translate element
      const googleElements = document.querySelectorAll('[class*="goog"]');
      console.log('Found Google elements:', googleElements.length);
      
      for (let element of googleElements) {
        if (element.offsetParent !== null) { // Check if element is visible
          console.log('Clicking visible Google element:', element);
          element.click();
          return;
        }
      }

      // Method 4: Try to trigger the widget programmatically
      if (window.google && window.google.translate) {
        console.log('Attempting to trigger Google Translate programmatically...');
        const translateElement = new window.google.translate.TranslateElement({
          pageLanguage: 'en',
          includedLanguages: 'en,hi,bn,ta,te,ml,kn,mr,gu,pa,or,as,ne,sd,ur',
          layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
          autoDisplay: false,
          multilanguagePage: true
        }, 'google_translate_element');
      }

      console.log('No Google Translate elements found to click');
      
    } catch (err) {
      console.error('Error in handleTranslateClick:', err);
      setError(err.message);
    }
  };

  const reloadGoogleTranslate = () => {
    console.log('Reloading Google Translate...');
    setError(null);
    setIsLoaded(false);
    
    // Remove existing Google Translate elements
    const existingElements = document.querySelectorAll('.goog-te-banner-frame, .goog-te-gadget, #goog-te-combo');
    existingElements.forEach(el => el.remove());
    
    // Reload the page to reinitialize
    window.location.reload();
  };

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col items-end gap-2">
      {/* Google Translate Element */}
      <div 
        ref={translateRef}
        id="google_translate_element"
        className="bg-white rounded-lg shadow-lg border border-gray-200 p-2 min-w-[120px] min-h-[30px]"
      >
        {!isLoaded && !error && (
          <div className="text-xs text-gray-500">Loading translator...</div>
        )}
        {error && (
          <div className="text-xs text-red-500 flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            Error
          </div>
        )}
      </div>
      
      {/* Custom Translate Button */}
      <button 
        onClick={handleTranslateClick}
        className="bg-green-600 hover:bg-green-700 text-white 
        rounded-lg px-4 py-2 font-medium flex items-center gap-2 
        shadow-lg transition-all duration-200 hover:scale-105"
        title="Translate Website"
      >
        <Globe className="h-4 w-4" />
        <span className="hidden sm:inline">Translate</span>
      </button>

      {/* Debug/Reload Button (only show if there's an error) */}
      {error && (
        <button 
          onClick={reloadGoogleTranslate}
          className="bg-red-600 hover:bg-red-700 text-white 
          rounded-lg px-3 py-1 text-xs font-medium
          shadow-lg transition-all duration-200"
          title="Reload Google Translate"
        >
          Reload
        </button>
      )}
    </div>
  );
};

export default GoogleTranslate; 