import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

const translations = {
  en: {
    aboutDescription: "Agriculture solutions and products for farmers, rooted in quality, trust, and shared growth.",
    aboutUs: "About us",
    addToCart: "Add to cart",
    address: "Address",
    businessAddress: "Business address",
    businessEmail: "Email",
    businessPhone: "Phone",
    featuredLabel: "Featured",
    inStock: "In stock",
    notAvailable: "Unavailable",
    callNow: "Call now",
    callToOrder: "Call to order",
    catalogueMessage: "To place an order, please call us on +91 94294 80002.",
    brandStatement: "Agriculture Solutions & Products",
    contactIntro: "Get in touch with Vadhiyar Agrotech for product enquiries and farm solutions.",
    contactUs: "Contact us",
    emailUs: "Email us",
    map: "Map",
    ownerLogin: "Owner sign in",
    proprietor: "Proprietor",
    services: "Products & services",
    shopDescription: "Chemical fertilizers, pesticide medicines, hybrid seeds, organic fertilizers, agricultural implements, and farm solutions.",
    viewMap: "View map",
    whatsappUs: "Chat on WhatsApp",
    cart: "Cart",
    categories: "Categories",
    checkoutSuccess: "Order placed successfully.",
    checkoutTitle: "Checkout",
    clearFilter: "Clear filter",
    catalogueIntro: "Farm-ready essentials, selected to support every growing season.",
    continueShopping: "Continue shopping",
    deliveryDetails: "Delivery details",
    featured: "Featured picks",
    footerTag: "Connecting farmers with modern markets.",
    heroSubtitle: "Chemical and organic fertilizers, crop protection, hybrid seeds, and practical farm solutions.",
    heroTagline: "Protecting Crops. Powering Growth.",
    home: "Home",
    imageUnavailable: "Product image unavailable",
    login: "Login",
    loginToContinue: "Please log in to continue.",
    logout: "Logout",
    noProducts: "No products matched your filters.",
    orderHistory: "Order history",
    orderId: "Order ID",
    orderNotes: "Order notes",
    orderSummary: "Order summary",
    outOfStock: "Out of stock",
    pending: "Pending",
    processing: "Processing",
    delivered: "Delivered",
    cancelled: "Cancelled",
    placeOrder: "Place order",
    products: "Products",
    orders: "Orders",
    remove: "Remove",
    register: "Register",
    searchPlaceholder: "Search products",
    status: "Status",
    supportLine: "Talk with us for product and order enquiries.",
    total: "Total",
    viewProducts: "View products",
    loading: "Loading...",
    quantity: "Quantity"
  },
  hi: {
    aboutDescription: "किसानों के लिए कृषि समाधान और उत्पाद—गुणवत्ता, विश्वास और साझा प्रगति के साथ।",
    aboutUs: "हमारे बारे में",
    addToCart: "कार्ट में जोड़ें",
    address: "पता",
    businessAddress: "व्यवसाय का पता",
    businessEmail: "ईमेल",
    businessPhone: "फोन",
    featuredLabel: "विशेष",
    inStock: "स्टॉक में",
    notAvailable: "उपलब्ध नहीं",
    callNow: "अभी कॉल करें",
    callToOrder: "ऑर्डर के लिए कॉल करें",
    catalogueMessage: "ऑर्डर के लिए +91 94294 80002 पर कॉल करें।",
    brandStatement: "कृषि समाधान और उत्पाद",
    contactIntro: "उत्पादों और कृषि समाधानों के बारे में जानने के लिए वढियार एग्रोटेक से संपर्क करें।",
    contactUs: "संपर्क करें",
    emailUs: "ईमेल करें",
    map: "नक्शा",
    ownerLogin: "मालिक लॉगिन",
    proprietor: "मालिक",
    services: "उत्पाद और सेवाएँ",
    shopDescription: "रासायनिक और जैविक उर्वरक, कीटनाशक दवाएँ, हाइब्रिड बीज, कृषि उपकरण और खेती के समाधान।",
    viewMap: "नक्शा देखें",
    whatsappUs: "WhatsApp पर चैट करें",
    cart: "कार्ट",
    categories: "श्रेणियाँ",
    checkoutSuccess: "ऑर्डर सफलतापूर्वक भेज दिया गया.",
    checkoutTitle: "चेकआउट",
    clearFilter: "फ़िल्टर साफ़ करें",
    catalogueIntro: "हर फसल के मौसम के लिए चुने गए भरोसेमंद कृषि उत्पाद।",
    continueShopping: "खरीदारी जारी रखें",
    deliveryDetails: "डिलिवरी विवरण",
    featured: "विशेष चयन",
    footerTag: "किसानों को बाजार से जोड़ता अनुभव.",
    heroSubtitle: "रासायनिक और जैविक उर्वरक, फसल सुरक्षा, हाइब्रिड बीज और उपयोगी कृषि समाधान।",
    heroTagline: "उच्च गुणवत्ता वाले उर्वरक, फसल सुरक्षा उत्पाद, बीज और आधुनिक कृषि समाधान – गुजरात के किसानों का विश्वसनीय साथी।.",
    home: "होम",
    imageUnavailable: "उत्पाद की तस्वीर उपलब्ध नहीं है",
    login: "लॉग इन",
    loginToContinue: "आगे बढ़ने के लिए लॉग इन करें.",
    logout: "लॉग आउट",
    noProducts: "कोई उत्पाद नहीं मिला.",
    orderHistory: "ऑर्डर इतिहास",
    orderId: "ऑर्डर आईडी",
    orderNotes: "ऑर्डर नोट्स",
    orderSummary: "ऑर्डर सारांश",
    outOfStock: "स्टॉक नहीं है",
    pending: "बकाया",
    processing: "प्रक्रिया में",
    delivered: "पहुंच गया",
    cancelled: "रद्द",
    placeOrder: "ऑर्डर करें",
    products: "उत्पाद",
    orders: "ऑर्डर्स",
    remove: "हटाएँ",
    register: "रजिस्टर",
    searchPlaceholder: "उत्पाद खोजें",
    status: "स्थिति",
    supportLine: "उत्पादों और ऑर्डर के लिए हमसे संपर्क करें।",
    total: "कुल",
    viewProducts: "उत्पाद देखें",
    loading: "लोड हो रहा है...",
    quantity: "मात्रा"
  },
  gu: {
    aboutDescription: "ખેડૂતો માટે કૃષિ ઉકેલો અને ઉત્પાદનો—ગુણવત્તા, વિશ્વાસ અને સહિયારી પ્રગતિ સાથે.",
    aboutUs: "અમારા વિશે",
    addToCart: "કાર્ટમાં ઉમેરીએ",
    address: "સરનામું",
    businessAddress: "વ્યવસાયનું સરનામું",
    businessEmail: "ઇમેઇલ",
    businessPhone: "ફોન",
    featuredLabel: "વિશેષ",
    inStock: "સ્ટોકમાં",
    notAvailable: "ઉપલબ્ધ નથી",
    callNow: "હમણાં કૉલ કરો",
    callToOrder: "ઓર્ડર માટે કૉલ કરો",
    catalogueMessage: "ઓર્ડર માટે +91 94294 80002 પર કૉલ કરો.",
    brandStatement: "કૃષિ ઉકેલો અને ઉત્પાદનો",
    contactIntro: "ઉત્પાદનો અને ખેતીના ઉકેલો માટે વઢિયાર એગ્રોટેકનો સંપર્ક કરો.",
    contactUs: "સંપર્ક કરો",
    emailUs: "ઇમેઇલ કરો",
    map: "નકશો",
    ownerLogin: "માલિક લૉગ ઇન",
    proprietor: "માલિક",
    services: "ઉત્પાદનો અને સેવાઓ",
    shopDescription: "રાસાયણિક અને જૈવિક ખાતર, જંતુનાશક દવાઓ, હાઇબ્રિડ બીજ, કૃષિ સાધનો અને ખેતીના ઉકેલો.",
    viewMap: "નકશો જુઓ",
    whatsappUs: "WhatsApp પર વાત કરો",
    cart: "કાર્ટ",
    categories: "વર્ગો",
    checkoutSuccess: "ઓર્ડર સફળતાપૂર્વક મોકલાયો.",
    checkoutTitle: "ચેકઆઉટ",
    clearFilter: "ફિલ્ટર સાફ કરો",
    catalogueIntro: "દરેક પાકની ઋતુ માટે પસંદ કરેલી ભરોસાપાત્ર કૃષિ સામગ્રી.",
    continueShopping: "શોપિંગ ચાલુ રાખો",
    deliveryDetails: "ડિલિવરી વિગતો",
    featured: "વિશેષ પસંદગીઓ",
    footerTag: "ખેડૂતો અને ગ્રાહકો વચ્ચેનું પુલ.",
    heroSubtitle: "રાસાયણિક અને જૈવિક ખાતર, પાક સુરક્ષા, હાઇબ્રિડ બીજ અને ઉપયોગી કૃષિ ઉકેલો.",
    heroTagline: "ઉચ્ચ ગુણવત્તાવાળા ખાતરો, પાક સુરક્ષા ઉત્પાદનો, બીજ અને આધુનિક કૃષિ ઉકેલો – ગુજરાતના ખેડૂતોનો વિશ્વાસુ સાથી.",
    home: "હોમ",
    imageUnavailable: "ઉત્પાદનની તસવીર ઉપલબ્ધ નથી",
    login: "લૉગ ઇન",
    loginToContinue: "આગળ વધવા માટે લૉગ ઇન કરો.",
    logout: "લૉગ આઉટ",
    noProducts: "મૅચ થતી કોઈ વસ્તુ નથી.",
    orderHistory: "ઓર્ડર ઇતિહાસ",
    orderId: "ઓર્ડર ID",
    orderNotes: "ઓર્ડર નોંધો",
    orderSummary: "ઓર્ડર સારાંશ",
    outOfStock: "સ્ટોક નથી",
    pending: "બાકી",
    processing: "પ્રક્રિયામાં",
    delivered: "ડિલિવર",
    cancelled: "રદ",
    placeOrder: "ઓર્ડર કરો",
    products: "ઉત્પાદનો",
    orders: "ઓર્ડર્સ",
    remove: "કાઢી નાખો",
    register: "રજીસ્ટર",
    searchPlaceholder: "ઉત્પાદનો શોધો",
    status: "સ્થિતિ",
    supportLine: "ઉત્પાદનો અને ઓર્ડર માટે અમારો સંપર્ક કરો.",
    total: "કુલ",
    viewProducts: "ઉત્પાદનો જુઓ",
    loading: "લોડ થઈ રહ્યું છે...",
    quantity: "જથ્થો"
  }
} as const;

export type Language = keyof typeof translations;
export type TranslationKey = keyof typeof translations.en;

const STORAGE_KEY = "vadhiyar-language";

interface LanguageContextValue {
  language: Language;
  setLanguage: (language: Language) => void;
}

const LanguageContext = createContext<LanguageContextValue>({
  language: "en",
  setLanguage: () => {}
});

export const LanguageProvider = ({ children }: { children: React.ReactNode }) => {
  const [language, setLanguage] = useState<Language>(() => {
    if (typeof window === "undefined") {
      return "en";
    }
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored && stored in translations) {
      return stored as Language;
    }
    return "en";
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, language);
    document.documentElement.lang = language === "hi" ? "hi-IN" : language === "gu" ? "gu-IN" : "en";
  }, [language]);

  const changeLanguage = useCallback((next: Language) => {
    setLanguage(next);
  }, []);

  const value = useMemo(
    () => ({
      language,
      setLanguage: changeLanguage
    }),
    [language, changeLanguage]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useLanguage = () => useContext(LanguageContext);

export const useTranslation = () => {
  const { language } = useLanguage();
  return useCallback(
    (key: TranslationKey) => translations[language][key] ?? translations.en[key],
    [language]
  );
};

