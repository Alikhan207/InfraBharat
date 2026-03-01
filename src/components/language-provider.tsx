
import { createContext, useContext, useState, ReactNode } from "react";

type Language = "en" | "hi" | "bn" | "te" | "mr" | "ta" | "gu" | "kn";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations = {
  en: {
    "app.title": "InfraBharat",
    "app.subtitle": "Smart City Solutions",
    "nav.features": "Features",
    "nav.about": "About",
    "nav.contact": "Contact",
    "nav.login": "Login",
    "hero.title": "Smart Cities, Sustainable Future",
    "hero.description": "AI-powered drainage management and water logging solutions for Indian cities. Empowering citizens and officials to build resilient urban infrastructure.",
    "hero.getStarted": "Get Started",
    "hero.learnMore": "Learn More",
    "login": "Login",
    "signup": "Sign Up",
    "signIn": "Sign In",
    "createAccount": "Create Account",
    "authSubtitle": "Smart Infrastructure for Smart Cities",
    "fullName": "Full Name",
    "enterFullName": "Enter your full name",
    "email": "Email",
    "password": "Password",
    "accountType": "Account Type",
    "citizen": "Citizen",
    "municipalOfficer": "Municipal Officer",
    "contractor": "Contractor",
    "loading": "Loading...",
    "loginSuccess": "Login Successful",
    "signupSuccess": "Sign Up Successful",
    "welcomeBack": "Welcome back!",
    "accountCreated": "Your account has been created successfully",
    "error": "Error",
    "logout": "Logout",
    "backToHome": "Back to Home",
    "login.welcome": "Welcome Back",
    "login.citizen": "Citizen",
    "login.official": "Official",
    "dashboard.official": "Official Dashboard",
    "dashboard.citizen": "Citizen Dashboard",
    "ai.analysis": "AI Drainage Analysis",
    "drainage.current": "Current Drainage Specifications",
    "drainage.recommended": "Recommended Specifications",
    "cost.estimate": "Cost Estimate"
  },
  hi: {
    "app.title": "इंफ्राभारत",
    "app.subtitle": "स्मार्ट सिटी समाधान",
    "nav.features": "सुविधाएं",
    "nav.about": "हमारे बारे में",
    "nav.contact": "संपर्क",
    "nav.login": "लॉगिन",
    "hero.title": "स्मार्ट शहर, टिकाऊ भविष्य",
    "hero.description": "भारतीय शहरों के लिए AI-संचालित जल निकासी प्रबंधन और जल भराव समाधान।",
    "hero.getStarted": "शुरू करें",
    "hero.learnMore": "और जानें",
    "login.welcome": "वापस स्वागत है",
    "login.citizen": "नागरिक",
    "login.official": "अधिकारी",
    "dashboard.official": "अधिकारी डैशबोर्ड",
    "dashboard.citizen": "नागरिक डैशबोर्ड",
    "ai.analysis": "AI जल निकासी विश्लेषण",
    "drainage.current": "वर्तमान जल निकासी विनिर्देश",
    "drainage.recommended": "अनुशंसित विनिर्देश",
    "cost.estimate": "लागत अनुमान"
  },
  bn: {
    "app.title": "ইনফ্রাভারত",
    "app.subtitle": "স্মার্ট সিটি সমাধান",
    "nav.features": "বৈশিষ্ট্য",
    "nav.about": "সম্পর্কে",
    "nav.contact": "যোগাযোগ",
    "nav.login": "লগইন",
    "hero.title": "স্মার্ট শহর, টেকসই ভবিষ্যৎ",
    "hero.description": "ভারতীয় শহরগুলির জন্য AI-চালিত নিকাশী ব্যবস্থাপনা এবং জল জমার সমাধান।",
    "hero.getStarted": "শুরু করুন",
    "hero.learnMore": "আরও জানুন",
    "login.welcome": "স্বাগতম",
    "login.citizen": "নাগরিক",
    "login.official": "কর্মকর্তা",
    "dashboard.official": "কর্মকর্তা ড্যাশবোর্ড",
    "dashboard.citizen": "নাগরিক ড্যাশবোর্ড",
    "ai.analysis": "AI নিকাশী বিশ্লেষণ",
    "drainage.current": "বর্তমান নিকাশী বিশেষত্ব",
    "drainage.recommended": "প্রস্তাবিত বিশেষত্ব",
    "cost.estimate": "খরচ অনুমান"
  },
  te: {
    "app.title": "ఇన్ఫ్రాభారత్",
    "app.subtitle": "స్మార్ట్ సిటీ సొల్యూషన్స్",
    "nav.features": "ఫీచర్లు",
    "nav.about": "గురించి",
    "nav.contact": "సంప్రదింపులు",
    "nav.login": "లాగిన్",
    "hero.title": "స్మార్ట్ నగరాలు, సుస్థిర భవిష్యత్తు",
    "hero.description": "భారతీయ నగరాలకు AI-ఆధారిత డ్రైనేజీ నిర్వహణ మరియు నీటి నిలిచిపోవడం పరిష్కారాలు।",
    "hero.getStarted": "ప్రారంభించండి",
    "hero.learnMore": "మరింత తెలుసుకోండి",
    "login.welcome": "తిరిగి స్వాగతం",
    "login.citizen": "పౌరుడు",
    "login.official": "అధికారి",
    "dashboard.official": "అధికారి డాష్‌బోర్డ్",
    "dashboard.citizen": "పౌర డాష్‌బోర్డ్",
    "ai.analysis": "AI డ్రైనేజీ విశ్లేషణ",
    "drainage.current": "ప్రస్తుత డ్రైనేజీ స్పెసిఫికేషన్లు",
    "drainage.recommended": "సిఫార్సు చేయబడిన స్పెసిఫికేషన్లు",
    "cost.estimate": "ఖర్చు అంచనా"
  },
  mr: {
    "app.title": "इन्फ्राभारत",
    "app.subtitle": "स्मार्ट सिटी सोल्युशन्स",
    "nav.features": "वैशिष्ट्ये",
    "nav.about": "बद्दल",
    "nav.contact": "संपर्क",
    "nav.login": "लॉगिन",
    "hero.title": "स्मार्ट शहरे, शाश्वत भविष्य",
    "hero.description": "भारतीय शहरांसाठी AI-आधारित ड्रेनेज व्यवस्थापन आणि पाणी साचण्याचे उपाय।",
    "hero.getStarted": "सुरुवात करा",
    "hero.learnMore": "अधिक जाणून घ्या",
    "login.welcome": "परत स्वागत",
    "login.citizen": "नागरिक",
    "login.official": "अधिकारी",
    "dashboard.official": "अधिकारी डॅशबोर्ड",
    "dashboard.citizen": "नागरिक डॅशबोर्ड",
    "ai.analysis": "AI ड्रेनेज विश्लेषण",
    "drainage.current": "सध्याची ड्रेनेज तपशील",
    "drainage.recommended": "शिफारस केलेली तपशील",
    "cost.estimate": "खर्चाचा अंदाज"
  },
  ta: {
    "app.title": "இன்ஃப்ராபாரத்",
    "app.subtitle": "ஸ்மார்ட் சிட்டி தீர்வுகள்",
    "nav.features": "அம்சங்கள்",
    "nav.about": "பற்றி",
    "nav.contact": "தொடர்பு",
    "nav.login": "உள்நுழைவு",
    "hero.title": "ஸ்மார்ட் நகரங்கள், நிலையான எதிர்காலம்",
    "hero.description": "இந்திய நகரங்களுக்கான AI-இயங்கும் வடிகால் மேலாண்மை மற்றும் நீர் தேங்கல் தீர்வுகள்।",
    "hero.getStarted": "தொடங்குங்கள்",
    "hero.learnMore": "மேலும் அறிக",
    "login.welcome": "மீண்டும் வரவேற்கிறோம்",
    "login.citizen": "குடிமகன்",
    "login.official": "அதிகாரி",
    "dashboard.official": "அதிகாரி டாஷ்போர்டு",
    "dashboard.citizen": "குடிமகன் டாஷ்போர்டு",
    "ai.analysis": "AI வடிகால் பகுப்பாய்வு",
    "drainage.current": "தற்போதைய வடிகால் விவரக்குறிப்புகள்",
    "drainage.recommended": "பரிந்துரைக்கப்பட்ட விவரக்குறிப்புகள்",
    "cost.estimate": "செலவு மதிப்பீடு"
  },
  gu: {
    "app.title": "ઈન્ફ્રાભારત",
    "app.subtitle": "સ્માર્ટ સિટી સોલ્યુશન્સ",
    "nav.features": "લક્ષણો",
    "nav.about": "વિશે",
    "nav.contact": "સંપર્ક",
    "nav.login": "લોગિન",
    "hero.title": "સ્માર્ટ શહેરો, ટકાઉ ભવિષ્ય",
    "hero.description": "ભારતીય શહેરો માટે AI-સંચાલિત ડ્રેનેજ મેનેજમેન્ટ અને પાણી ભરાવાના ઉકેલો।",
    "hero.getStarted": "શરૂ કરો",
    "hero.learnMore": "વધુ જાણો",
    "login.welcome": "ફરી સ્વાગત",
    "login.citizen": "નાગરિક",
    "login.official": "અધિકારી",
    "dashboard.official": "અધિકારી ડેશબોર્ડ",
    "dashboard.citizen": "નાગરિક ડેશબોર્ડ",
    "ai.analysis": "AI ડ્રેનેજ વિશ્લેષણ",
    "drainage.current": "વર્તમાન ડ્રેનેજ વિશેષતાઓ",
    "drainage.recommended": "ભલામણ કરેલ વિશેષતાઓ",
    "cost.estimate": "ખર્ચનો અંદાજ"
  },
  kn: {
    "app.title": "ಇನ್ಫ್ರಾಭಾರತ್",
    "app.subtitle": "ಸ್ಮಾರ್ಟ್ ಸಿಟಿ ಪರಿಹಾರಗಳು",
    "nav.features": "ವೈಶಿಷ್ಟ್ಯಗಳು",
    "nav.about": "ಬಗ್ಗೆ",
    "nav.contact": "ಸಂಪರ್ಕ",
    "nav.login": "ಲಾಗಿನ್",
    "hero.title": "ಸ್ಮಾರ್ಟ್ ನಗರಗಳು, ಸಮರ್ಥನೀಯ ಭವಿಷ್ಯ",
    "hero.description": "ಭಾರತೀಯ ನಗರಗಳಿಗೆ AI-ಚಾಲಿತ ಒಳಚರಂಡಿ ನಿರ್ವಹಣೆ ಮತ್ತು ನೀರು ನಿಂತುಕೊಳ್ಳುವ ಪರಿಹಾರಗಳು।",
    "hero.getStarted": "ಪ್ರಾರಂಭಿಸಿ",
    "hero.learnMore": "ಇನ್ನಷ್ಟು ತಿಳಿಯಿರಿ",
    "login.welcome": "ಮತ್ತೆ ಸ್ವಾಗತ",
    "login.citizen": "ನಾಗರಿಕ",
    "login.official": "ಅಧಿಕಾರಿ",
    "dashboard.official": "ಅಧಿಕಾರಿ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್",
    "dashboard.citizen": "ನಾಗರಿಕ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್",
    "ai.analysis": "AI ಒಳಚರಂಡಿ ವಿಶ್ಲೇಷಣೆ",
    "drainage.current": "ಪ್ರಸ್ತುತ ಒಳಚರಂಡಿ ವಿಶೇಷಣಗಳು",
    "drainage.recommended": "ಶಿಫಾರಸು ಮಾಡಿದ ವಿಶೇಷಣಗಳು",
    "cost.estimate": "ವೆಚ್ಚದ ಅಂದಾಜು"
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>("en");

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
