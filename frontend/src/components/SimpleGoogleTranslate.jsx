import React, { useEffect, useState } from 'react';
import { Globe } from "lucide-react";

const SimpleGoogleTranslate = () => {
  const [currentLanguage, setCurrentLanguage] = useState('en');

  useEffect(() => {
    // Add Google Translate script dynamically
    const script = document.createElement('script');
    script.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
    script.async = true;
    document.head.appendChild(script);

    // Define the initialization function
    window.googleTranslateElementInit = function() {
      new window.google.translate.TranslateElement({
        pageLanguage: 'en',
        includedLanguages: 'en,hi,bn,ta,te,ml,kn,mr,gu,pa,or,as,ne,sd,ur',
        layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
        autoDisplay: false,
        multilanguagePage: true
      }, 'google_translate_element');
    };

    return () => {
      // Cleanup
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  const handleLanguageChange = (languageCode) => {
    console.log('Changing language to:', languageCode);
    
    // Method 1: Try to find and change the Google Translate select
    const translateSelect = document.querySelector('#goog-te-combo');
    if (translateSelect) {
      translateSelect.value = languageCode;
      translateSelect.dispatchEvent(new Event('change'));
      setCurrentLanguage(languageCode);
      return;
    }

    // Method 2: Try to trigger Google Translate directly
    if (window.google && window.google.translate) {
      try {
        // This is a more direct approach
        const iframe = document.querySelector('.goog-te-banner-frame');
        if (iframe && iframe.contentWindow) {
          iframe.contentWindow.postMessage({
            type: 'translate',
            language: languageCode
          }, '*');
        }
      } catch (error) {
        console.error('Error changing language:', error);
      }
    }

    // Method 3: Reload page with language parameter
    if (languageCode !== 'en') {
      const url = new URL(window.location);
      url.searchParams.set('lang', languageCode);
      window.location.href = url.toString();
    }
  };

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'hi', name: 'हिंदी' },
    { code: 'bn', name: 'বাংলা' },
    { code: 'ta', name: 'தமிழ்' },
    { code: 'te', name: 'తెలుగు' },
    { code: 'ml', name: 'മലയാളം' },
    { code: 'kn', name: 'ಕನ್ನಡ' },
    { code: 'mr', name: 'मराठी' },
    { code: 'gu', name: 'ગુજરાતી' },
    { code: 'pa', name: 'ਪੰਜਾਬੀ' },
    { code: 'or', name: 'ଓଡ଼ିଆ' },
    { code: 'as', name: 'অসমীয়া' },
    { code: 'ne', name: 'नेपाली' },
    { code: 'sd', name: 'سنڌي' },
    { code: 'ur', name: 'اردو' }
  ];

  return (
    <div className="fixed top-4 right-4 z-100">
      {/* Google Translate Element */}
      <div 
        id="google_translate_element"
        className="bg-white rounded-lg border border-gray-200"
      ></div>
      
      {/* Custom Language Dropdown */}
      <div className="relative">
        <button 
          className="bg-green-600 hover:bg-green-700 text-white 
          rounded-lg px-4 py-2 font-medium flex items-center gap-2 
          shadow-lg transition-all duration-200 hover:scale-105"
          onClick={() => {
            const dropdown = document.getElementById('language-dropdown');
            dropdown.classList.toggle('hidden');
          }}
        >
          <Globe className="h-4 w-4" />
          <span className="hidden sm:inline">
            {languages.find(lang => lang.code === currentLanguage)?.name || 'Translate'}
          </span>
        </button>
        
        <div 
          id="language-dropdown"
          className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 hidden z-50"
        >
          {languages.map((language) => (
            <button
              key={language.code}
              onClick={() => {
                handleLanguageChange(language.code);
                document.getElementById('language-dropdown').classList.add('hidden');
              }}
              className={`w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors ${
                currentLanguage === language.code ? 'bg-green-50 text-green-700' : 'text-gray-700'
              }`}
            >
              {language.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SimpleGoogleTranslate; 