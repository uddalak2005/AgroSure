import React, { useEffect, useState } from 'react';
import { Globe } from "lucide-react";
// import "./CSS/global.css"

const SimpleGoogleTranslate = () => {
  const [currentLanguage, setCurrentLanguage] = useState('en');
  const [dropdownVisible, setDropdownVisible] = useState(false);



  useEffect(() => {

    // Define init before script loads
    window.googleTranslateElementInit = function () {
      new window.google.translate.TranslateElement({
        pageLanguage: 'en',
        includedLanguages: 'en,hi,bn,ta,te,ml,kn,mr,gu,pa,or,as,ne,sd,ur',
        layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
        autoDisplay: false,
        multilanguagePage: true
      }, 'google_translate_element');
    };

      const script = document.createElement('script');
      script.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
      script.async = true;
      document.head.appendChild(script);

      return () => {
        if (script.parentNode) {
          script.parentNode.removeChild(script);
        }
      };
  }, []);



  const handleLanguageChange = (languageCode) => {
  console.log('Changing language to:', languageCode);

  // Try to find the Google Translate combo box
  const tryTranslate = (retries = 10) => {
    const translateSelect = document.querySelector('#goog-te-combo');

    if (translateSelect) {
      translateSelect.value = languageCode;
      translateSelect.dispatchEvent(new Event('change'));
      setCurrentLanguage(languageCode);
    } else if (retries > 0) {
      // Retry after a short delay if the combo isn't ready yet
      setTimeout(() => tryTranslate(retries - 1), 200);
    } else {
      console.warn('Google Translate combo box not found.');
    }
  };

  tryTranslate();
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
    <div className="z-100">
    
      {/* Google Translate Element */}
      <div 
        id="google_translate_element"
        className="rounded-lg border opacity-40 border-gray-200"
      ></div>
      
      {/* Custom Language Dropdown */}
      {/* <div className="relative">
        <button 
          className="bg-green-600 hover:bg-green-700 text-white 
          rounded-lg px-4 py-2 font-medium flex items-center gap-2 
          shadow-lg transition-all duration-200 hover:scale-105"
          onClick={
          () => {
          setDropdownVisible(prev => !prev)}
          }
        >
          <Globe className="h-4 w-4" />
          <span className="hidden sm:inline">
            {languages.find(lang => lang.code === currentLanguage)?.name || 'Translate'}
          </span>
        </button>
        
        {dropdownVisible && 
        <div 
          id="language-dropdown"
          className="mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50"
        >
          {languages.map((language) => (
        <button
          key={language.code}
          onClick={() => {
            handleLanguageChange(language.code);
            setDropdownVisible(false);
          }}
          className={`w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors flex justify-between items-center ${
            currentLanguage === language.code ? 'bg-green-50 text-green-700 font-medium' : 'text-gray-700'
          }`}
        >
          {language.name}
          {currentLanguage === language.code && <span>✅</span>}
        </button>
      ))}
        </div>
        } */}
      {/* </div> */}
    </div>
  );
};

export default SimpleGoogleTranslate; 