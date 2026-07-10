import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

const translations = {
  en: {
    addToCart: "Add to cart",
    callNow: "Call now",
    callToOrder: "Call to order",
    catalogueMessage: "To place an order, please call us on 9825213351.",
    brandStatement: "Fresh produce, smarter farming.",
    shopDescription: "Our shop sells fertilizers like DAP, Urea, etc., seeds, medicines/pesticides for crops.",
    cart: "Cart",
    categories: "Categories",
    checkoutSuccess: "Order placed successfully.",
    checkoutTitle: "Checkout",
    clearFilter: "Clear filter",
    continueShopping: "Continue shopping",
    deliveryDetails: "Delivery details",
    featured: "Featured picks",
    footerTag: "Connecting farmers with modern markets.",
    heroSubtitle: "Empowering farmers with advanced crop protection, premium fertilizers, and smart agricultural tools.",
    heroTagline: "Protecting Crops. Powering Growth.",
    home: "Home",
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
    searchPlaceholder: "Search produce",
    status: "Status",
    supportLine: "Live support for growers and buyers.",
    total: "Total",
    viewProducts: "View products",
    loading: "Loading...",
    quantity: "Quantity"
  },
  hi: {
    addToCart: "कार्ट में जोड़ें",
    callNow: "अभी कॉल करें",
    callToOrder: "ऑर्डर के लिए कॉल करें",
    catalogueMessage: "ऑर्डर देने के लिए कृपया हमसे 9825213351 पर कॉल करें।",
    brandStatement: "ताज़ा उत्पाद, स्मार्ट खेती.",
    shopDescription: "हमारी दुकान DAP, यूरिया आदि जैसे उर्वरक, बीज, फसलों के लिए दवाएं/कीटनाशक बेचती है।",
    cart: "कार्ट",
    categories: "श्रेणियाँ",
    checkoutSuccess: "ऑर्डर सफलतापूर्वक भेज दिया गया.",
    checkoutTitle: "चेकआउट",
    clearFilter: "फ़िल्टर साफ़ करें",
    continueShopping: "खरीदारी जारी रखें",
    deliveryDetails: "डिलिवरी विवरण",
    featured: "विशेष चयन",
    footerTag: "किसानों को बाजार से जोड़ता अनुभव.",
    heroSubtitle: "उन्नत फसल सुरक्षा, प्रीमियम उर्वरक और स्मार्ट कृषि उपकरणों से किसानों को सशक्त बनाना.",
    heroTagline: "फसलों की सुरक्षा. विकास को ऊर्जा.",
    home: "होम",
    login: "लॉग इन",
    loginToContinue: "आगे बढ़ने के लिए लॉग इन करें.",
    logout: "लॉग आउट",
    noProducts: "कोई उत्पाद नहीं मिला.",
    orderHistory: "ऑर्डर इतिहास",
    orderId: "ऑर्डर आईडी",
    orderNotes: "ऑर्डर नोट्स",
    orderSummary: "ऑर्डर सारांश",
    outOfStock: "स्टॉक नहीं है",
    pending: "अपेक्षित",
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
    supportLine: "किसानों व खरीदारों के लिए 24x7 सहायता.",
    total: "कुल",
    viewProducts: "उत्पाद देखें",
    loading: "लोड हो रहा है...",
    quantity: "मात्रा"
  },
  gu: {
    addToCart: "કાર્ટમાં ઉમેરીએ",
    callNow: "હમણાં કૉલ કરો",
    callToOrder: "ઓર્ડર માટે કૉલ કરો",
    catalogueMessage: "ઓર્ડર આપવા માટે કૃપા કરીને અમને 9825213351 પર કૉલ કરો.",
    shopDescription: "આমારી દુકાન DAP, યુરિયા વગેરે જેવા ખાતર, બીજ, પાકો માટે દવાઓ/જંતુનાશક વેચે છે.",
    brandStatement: "તાજી ઉપજ, સ્માર્ટ ખેતી.",
    cart: "કાર્ટ",
    categories: "વર્ગો",
    checkoutSuccess: "ઓર્ડર સફળતાપૂર્વક મોકલાયો.",
    checkoutTitle: "ચેકઆઉટ",
    clearFilter: "ફિલ્ટર સાફ કરો",
    continueShopping: "શોપિંગ ચાલુ રાખો",
    deliveryDetails: "ડિલિવરી વિગતો",
    featured: "વિશેષ પસંદગીઓ",
    footerTag: "ખેડૂતો અને ગ્રાહકો વચ્ચેનું પુલ.",
    heroSubtitle: "અદ્યતન પાક સુરક્ષા, પ્રીમિયમ ખાતર અને સ્માર્ટ કૃષિ સાધનો દ્વારા ખેડૂતોને સશક્ત બનાવવું.",
    heroTagline: "પાકોની સુરક્ષા. વૃદ્ધિને શક્તિ.",
    home: "હોમ",
    login: "લૉગ ઇન",
    loginToContinue: "આગળ વધવા માટે લૉગ ઇન કરો.",
    logout: "લૉગ આઉટ",
    noProducts: "મૅચ થતી કોઈ વસ્તુ નથી.",
    orderHistory: "ઓર્ડર ઇતિહાસ",
    orderId: "ઓર્ડર ID",
    orderNotes: "ઓર્ડર નોંધો",
    orderSummary: "ઓર્ડર સારાંશ",
    outOfStock: "સ્ટોક નથી",
    pending: "વિચારો",
    processing: "પ્રક્રિયામાં",
    delivered: "ડિલિવર",
    cancelled: "રદ",
    placeOrder: "ઓર્ડર કરો",
    products: "ઉત્પાદનો",
    orders: "ઓર્ડર્સ",
    remove: "કાઢી નાખો",
    register: "રજીસ્ટર",
    searchPlaceholder: "ફસલ શોધો",
    status: "સ્થિતિ",
    supportLine: "વિકાસકર્તા અને ખરીદદારો માટે 24x7 સહાય.",
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
