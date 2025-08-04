import React, { useEffect, useState } from 'react';
import { Globe, ChevronDown } from "lucide-react";

const DirectGoogleTranslate = () => {
  const [currentLanguage, setCurrentLanguage] = useState('en');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    // Load Google Translate script
    const script = document.createElement('script');
    script.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
    script.async = true;
    document.head.appendChild(script);

    // Initialize Google Translate
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
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  const translatePage = (languageCode) => {
    console.log('Translating to:', languageCode);
    
    // Method 1: Direct Google Translate API call
    if (window.google && window.google.translate) {
      try {
        // Use Google Translate's internal method
        const translateElement = document.querySelector('#google_translate_element');
        if (translateElement && translateElement.children.length > 0) {
          const selectElement = translateElement.querySelector('select');
          if (selectElement) {
            selectElement.value = languageCode;
            selectElement.dispatchEvent(new Event('change'));
            setCurrentLanguage(languageCode);
            setIsDropdownOpen(false);
            return;
          }
        }
      } catch (error) {
        console.error('Error with direct translation:', error);
      }
    }

    // Method 2: Use Google Translate's cookie method
    try {
      // Set Google Translate cookie
      document.cookie = `googtrans=/en/${languageCode}; path=/`;
      
      // Reload the page to apply translation
      window.location.reload();
    } catch (error) {
      console.error('Error with cookie method:', error);
    }
  };

  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'hi', name: 'हिंदी', flag: '🇮🇳' },
    { code: 'bn', name: 'বাংলা', flag: '🇧🇩' },
    { code: 'ta', name: 'தமிழ்', flag: '🇮🇳' },
    { code: 'te', name: 'తెలుగు', flag: '🇮🇳' },
    { code: 'ml', name: 'മലയാളം', flag: '🇮🇳' },
    { code: 'kn', name: 'ಕನ್ನಡ', flag: '🇮🇳' },
    { code: 'mr', name: 'मराठी', flag: '🇮🇳' },
    { code: 'gu', name: 'ગુજરાતી', flag: '🇮🇳' },
    { code: 'pa', name: 'ਪੰਜਾਬੀ', flag: '🇮🇳' },
    { code: 'or', name: 'ଓଡ଼ିଆ', flag: '🇮🇳' },
    { code: 'as', name: 'অসমীয়া', flag: '🇮🇳' },
    { code: 'ne', name: 'नेपाली', flag: '🇳🇵' },
    { code: 'sd', name: 'سنڌي', flag: '🇵🇰' },
    { code: 'ur', name: 'اردو', flag: '🇵🇰' }
  ];

  const currentLang = languages.find(lang => lang.code === currentLanguage);

  return (
    <div className="fixed top-4 right-4 z-50">
      {/* Hidden Google Translate Element */}
      <div 
        id="google_translate_element"
        style={{ 
          position: 'absolute', 
          left: '-9999px', 
          top: '-9999px',
          width: '1px',
          height: '1px',
          overflow: 'hidden'
        }}
      ></div>
      
      {/* Custom Language Dropdown */}
      <div className="relative">
        <button 
          className="bg-white hover:bg-gray-50 text-gray-700 border border-gray-300
          rounded-lg px-4 py-2 font-medium flex items-center gap-2 
          shadow-lg transition-all duration-200 hover:shadow-xl
          backdrop-blur-sm bg-white/90"
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        >
          <Globe className="h-4 w-4 text-green-600" />
          <span className="hidden sm:inline text-sm">
            {currentLang?.flag} {currentLang?.name}
          </span>
          <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform duration-200 ${
            isDropdownOpen ? 'rotate-180' : ''
          }`} />
        </button>
        
        {/* Dropdown Menu */}
        {isDropdownOpen && (
          <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden z-50">
            <div className="py-2">
              <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                Select Language
              </div>
              {languages.map((language) => (
                <button
                  key={language.code}
                  onClick={() => translatePage(language.code)}
                  className={`w-full text-left px-4 py-3 hover:bg-green-50 transition-all duration-150 flex items-center gap-3 ${
                    currentLanguage === language.code 
                      ? 'bg-green-100 text-green-700 border-r-2 border-green-500' 
                      : 'text-gray-700'
                  }`}
                >
                  <span className="text-lg">{language.flag}</span>
                  <span className="font-medium">{language.name}</span>
                  {currentLanguage === language.code && (
                    <div className="ml-auto w-2 h-2 bg-green-500 rounded-full"></div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Backdrop to close dropdown when clicking outside */}
      {isDropdownOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsDropdownOpen(false)}
        ></div>
      )}
    </div>
  );
};

export default DirectGoogleTranslate; 