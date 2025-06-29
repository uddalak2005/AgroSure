import { useEffect } from 'react';

const GoogleLangAuto = () => {
  const translateToLang = (langCode) => {
    const tryTranslate = () => {
      const select = document.querySelector("select.goog-te-combo");
      if (select && window.google?.translate?.TranslateElement) {
        select.value = langCode;
        select.dispatchEvent(new Event("change"));
        console.log(`✅ Translated page to ${langCode}`);
      } else {
        setTimeout(tryTranslate, 300); // Retry after short delay
      }
    };
    tryTranslate();
  };

  useEffect(() => {
    const script = document.createElement('script');
    script.src = "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
    script.async = true;
    document.body.appendChild(script);
  
    window.googleTranslateElementInit = () => {
      new window.google.translate.TranslateElement(
        { pageLanguage: 'en' },
        'google_translate_element'
      );
    };
  
    translateToLang('bn');
  }, []);

  return <div id="google_translate_element" style={{ display: 'none' }} />;
};

export default GoogleLangAuto;
