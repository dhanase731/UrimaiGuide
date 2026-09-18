import type { PreferredLanguage } from "@/lib/registration"

export interface IntakeTranslations {
  // Page header
  moduleLabel: string
  pageTitle: string
  pageDescription: string
  scopeNotice: string

  // Progress steps
  stepRegister: string
  stepDescribe: string
  stepInterview: string
  stepFile: string

  // Language / mode toggles
  langGroupLabel: string
  modeGroupLabel: string
  modeType: string
  modeSpeak: string

  // Device section
  deviceHeading: string
  deviceMobile: string
  deviceLaptop: string
  deviceTV: string
  deviceFridge: string
  deviceCharger: string

  // Problem textarea
  problemLabel: string
  problemPlaceholder: string
  charCountNeeded: (n: number) => string
  charCountOk: string
  charCountOf: (count: number, max: number) => string

  // Validation
  errorMinChars: (n: number) => string

  // Submit / classify
  btnAnalyze: string
  btnCreating: string
  classifyingTitle: string
  classifyingBody: string

  // Speech
  speechStart: string
  speechStop: string
  speechListening: string
  speechTap: string
  speechPartial: string
  speechUnsupported: string
  speechPermissionDenied: string
  speechError: string
  speechAppend: string

  // AI correction
  btnCorrect: string
  correcting: string
  correctionOriginalLabel: string
  correctionCorrectedLabel: string
  btnUseCorrection: string
  btnKeepOriginal: string
  correctionNotConfigured: string
  correctionNetworkError: string
  correctionNoChange: string

  // Classification badge
  deviceDetected: string
  platformDetected: string
  lowConfidence: string

  // Evidence section
  evidenceTitle: string
  evidenceDescription: string
  evidenceInvoice: string
  evidenceChat: string
  evidencePhotos: string
  evidenceVideo: string
  evidenceSupported: string
  evidenceFilesUploaded: (n: number) => string
  evidenceAINote: string
  btnRemove: string
}

const en: IntakeTranslations = {
  moduleLabel: "Module 2 · Problem intake",
  pageTitle: "What went wrong?",
  pageDescription:
    "Describe your electrical or electronic device problem in your own words — no legal jargon needed. Type it or speak it.",
  scopeNotice:
    "This module handles electrical and electronic device consumer complaints.",

  stepRegister: "Register",
  stepDescribe: "Describe problem",
  stepInterview: "AI interview",
  stepFile: "File complaint",

  langGroupLabel: "Language",
  modeGroupLabel: "Input mode",
  modeType: "Type",
  modeSpeak: "Speak",

  deviceHeading: "What type of device?",
  deviceMobile: "Mobile / Tablet",
  deviceLaptop: "Laptop / PC",
  deviceTV: "TV / Monitor",
  deviceFridge: "Fridge / AC",
  deviceCharger: "Charger / Other",

  problemLabel: "Describe what happened",
  problemPlaceholder:
    "e.g. I bought a Samsung Galaxy S23 from Amazon. The screen stopped working after 10 days and the seller refused to replace or refund it…",
  charCountNeeded: (n) => `${n} more characters needed`,
  charCountOk: "Looks good",
  charCountOf: (count, max) => `${count}/${max}`,

  errorMinChars: (n) => `Please describe your problem in at least ${n} characters.`,

  btnAnalyze: "Analyze legal claim",
  btnCreating: "Creating case…",
  classifyingTitle: "Understanding your problem…",
  classifyingBody: "Electronics classifier + NLP intent detection running",

  speechStart: "Start recording",
  speechStop: "Stop recording",
  speechListening: "Listening… tap to stop",
  speechTap: "Tap and describe your problem aloud",
  speechPartial: "Recognizing…",
  speechUnsupported:
    "Speech input is not supported in this browser. Please type your problem.",
  speechPermissionDenied:
    "Microphone access was denied. Please allow microphone access and try again.",
  speechError: "Speech recognition error. Please try again or type your problem.",
  speechAppend: "Speech appended to your description.",

  btnCorrect: "Improve with AI",
  correcting: "Improving your text…",
  correctionOriginalLabel: "Your original text",
  correctionCorrectedLabel: "AI-improved version",
  btnUseCorrection: "Use improved text",
  btnKeepOriginal: "Keep my original",
  correctionNotConfigured:
    "AI correction is not configured yet. You can continue with your original text.",
  correctionNetworkError:
    "Could not reach the AI service. Please check your connection and try again.",
  correctionNoChange: "Your text is already clear. No changes were needed.",

  deviceDetected: "Device detected",
  platformDetected: "Platform",
  lowConfidence: "Please verify the detected information.",

  evidenceTitle: "Upload evidence (optional but recommended)",
  evidenceDescription:
    "Upload invoices, WhatsApp chats, product photos, screen recordings, emails, or screenshots. The AI will extract key facts automatically.",
  evidenceInvoice: "Invoice / PDF",
  evidenceChat: "Chat / Email",
  evidencePhotos: "Photos",
  evidenceVideo: "Screen recording",
  evidenceSupported:
    "Supported: Amazon/Flipkart order screenshots, WhatsApp chat exports, product photos, service center job sheets, screen recordings, PDF invoices, warranty cards.",
  evidenceFilesUploaded: (n) =>
    `${n} file${n > 1 ? "s" : ""} uploaded · AI will extract facts during analysis`,
  evidenceAINote: "Supported",
  btnRemove: "Remove",
}

const ta: IntakeTranslations = {
  moduleLabel: "தொகுதி 2 · பிரச்சனை உள்ளீடு",
  pageTitle: "என்ன தவறு நடந்தது?",
  pageDescription:
    "உங்கள் மின்சார அல்லது மின்னணு சாதன பிரச்சனையை உங்கள் சொந்த வார்த்தைகளில் விவரிக்கவும் — சட்ட வார்த்தைகள் தேவையில்லை. தட்டச்சு செய்யவும் அல்லது பேசவும்.",
  scopeNotice:
    "இந்த தொகுதி மின்சார மற்றும் மின்னணு சாதன நுகர்வோர் புகார்களை கையாளுகிறது.",

  stepRegister: "பதிவு",
  stepDescribe: "பிரச்சனை விவரி",
  stepInterview: "AI நேர்காணல்",
  stepFile: "புகார் தாக்கல்",

  langGroupLabel: "மொழி",
  modeGroupLabel: "உள்ளீட்டு முறை",
  modeType: "தட்டச்சு",
  modeSpeak: "பேசு",

  deviceHeading: "எந்த வகை சாதனம்?",
  deviceMobile: "மொபைல் / டேப்லெட்",
  deviceLaptop: "லேப்டாப் / PC",
  deviceTV: "TV / மானிட்டர்",
  deviceFridge: "குளிர்சாதனம் / AC",
  deviceCharger: "சார்ஜர் / மற்றவை",

  problemLabel: "என்ன நடந்தது என்று விவரிக்கவும்",
  problemPlaceholder:
    "எ.கா. நான் Amazon-ல் Samsung Galaxy S23 வாங்கினேன். 10 நாட்களுக்குப் பிறகு திரை வேலை செய்யவில்லை, விற்பனையாளர் மாற்றவோ பணம் திரும்பவோ மறுத்தார்…",
  charCountNeeded: (n) => `இன்னும் ${n} எழுத்துகள் தேவை`,
  charCountOk: "நன்றாக உள்ளது",
  charCountOf: (count, max) => `${count}/${max}`,

  errorMinChars: (n) => `குறைந்தது ${n} எழுத்துகளில் உங்கள் பிரச்சனையை விவரிக்கவும்.`,

  btnAnalyze: "சட்ட உரிமை பகுப்பாய்வு",
  btnCreating: "வழக்கு உருவாக்கப்படுகிறது…",
  classifyingTitle: "உங்கள் பிரச்சனையை புரிந்துகொள்கிறோம்…",
  classifyingBody: "மின்னணு வகைப்படுத்தி + NLP நோக்கம் கண்டறிதல் இயங்குகிறது",

  speechStart: "பதிவு தொடங்கு",
  speechStop: "பதிவு நிறுத்து",
  speechListening: "கேட்கிறோம்… நிறுத்த தட்டவும்",
  speechTap: "தட்டி உங்கள் பிரச்சனையை சத்தமாக விவரிக்கவும்",
  speechPartial: "அங்கீகரிக்கிறோம்…",
  speechUnsupported:
    "இந்த உலாவியில் குரல் உள்ளீடு ஆதரிக்கப்படவில்லை. தயவுசெய்து தட்டச்சு செய்யவும்.",
  speechPermissionDenied:
    "மைக்ரோஃபோன் அணுகல் மறுக்கப்பட்டது. மைக்ரோஃபோன் அணுகலை அனுமதித்து மீண்டும் முயற்சிக்கவும்.",
  speechError: "குரல் அங்கீகார பிழை. மீண்டும் முயற்சிக்கவும் அல்லது தட்டச்சு செய்யவும்.",
  speechAppend: "குரல் உங்கள் விவரணத்தில் சேர்க்கப்பட்டது.",

  btnCorrect: "AI மூலம் மேம்படுத்து",
  correcting: "உங்கள் உரையை மேம்படுத்துகிறோம்…",
  correctionOriginalLabel: "உங்கள் அசல் உரை",
  correctionCorrectedLabel: "AI மேம்படுத்திய பதிப்பு",
  btnUseCorrection: "மேம்படுத்திய உரையை பயன்படுத்து",
  btnKeepOriginal: "என் அசல் உரையை வைத்திரு",
  correctionNotConfigured:
    "AI திருத்தம் இன்னும் கட்டமைக்கப்படவில்லை. உங்கள் அசல் உரையுடன் தொடரலாம்.",
  correctionNetworkError:
    "AI சேவையை அடைய முடியவில்லை. இணைப்பை சரிபார்த்து மீண்டும் முயற்சிக்கவும்.",
  correctionNoChange: "உங்கள் உரை ஏற்கனவே தெளிவாக உள்ளது. மாற்றங்கள் தேவையில்லை.",

  deviceDetected: "சாதனம் கண்டறியப்பட்டது",
  platformDetected: "தளம்",
  lowConfidence: "கண்டறியப்பட்ட தகவலை சரிபார்க்கவும்.",

  evidenceTitle: "சான்றுகளை பதிவேற்றவும் (விருப்பமானது ஆனால் பரிந்துரைக்கப்படுகிறது)",
  evidenceDescription:
    "விலைப்பட்டியல்கள், WhatsApp அரட்டைகள், தயாரிப்பு புகைப்படங்கள், திரை பதிவுகள், மின்னஞ்சல்கள் அல்லது ஸ்கிரீன்ஷாட்களை பதிவேற்றவும். AI முக்கிய உண்மைகளை தானாக பிரித்தெடுக்கும்.",
  evidenceInvoice: "விலைப்பட்டியல் / PDF",
  evidenceChat: "அரட்டை / மின்னஞ்சல்",
  evidencePhotos: "புகைப்படங்கள்",
  evidenceVideo: "திரை பதிவு",
  evidenceSupported:
    "ஆதரிக்கப்படுவது: Amazon/Flipkart ஆர்டர் ஸ்கிரீன்ஷாட்கள், WhatsApp அரட்டை ஏற்றுமதிகள், தயாரிப்பு புகைப்படங்கள், சேவை மையம் ஜாப் ஷீட்கள், திரை பதிவுகள், PDF விலைப்பட்டியல்கள், உத்தரவாத அட்டைகள்.",
  evidenceFilesUploaded: (n) =>
    `${n} கோப்பு${n > 1 ? "கள்" : ""} பதிவேற்றப்பட்டது · AI பகுப்பாய்வின் போது உண்மைகளை பிரித்தெடுக்கும்`,
  evidenceAINote: "ஆதரிக்கப்படுவது",
  btnRemove: "நீக்கு",
}

const hi: IntakeTranslations = {
  moduleLabel: "मॉड्यूल 2 · समस्या दर्ज करें",
  pageTitle: "क्या गलत हुआ?",
  pageDescription:
    "अपनी बिजली या इलेक्ट्रॉनिक डिवाइस की समस्या अपने शब्दों में बताएं — कोई कानूनी शब्दजाल की जरूरत नहीं। टाइप करें या बोलें।",
  scopeNotice:
    "यह मॉड्यूल बिजली और इलेक्ट्रॉनिक डिवाइस उपभोक्ता शिकायतों को संभालता है।",

  stepRegister: "पंजीकरण",
  stepDescribe: "समस्या बताएं",
  stepInterview: "AI साक्षात्कार",
  stepFile: "शिकायत दर्ज करें",

  langGroupLabel: "भाषा",
  modeGroupLabel: "इनपुट मोड",
  modeType: "टाइप करें",
  modeSpeak: "बोलें",

  deviceHeading: "किस प्रकार का डिवाइस?",
  deviceMobile: "मोबाइल / टैबलेट",
  deviceLaptop: "लैपटॉप / PC",
  deviceTV: "TV / मॉनिटर",
  deviceFridge: "फ्रिज / AC",
  deviceCharger: "चार्जर / अन्य",

  problemLabel: "क्या हुआ बताएं",
  problemPlaceholder:
    "जैसे: मैंने Amazon से Samsung Galaxy S23 खरीदा। 10 दिनों के बाद स्क्रीन काम करना बंद हो गई और विक्रेता ने बदलने या वापस करने से मना कर दिया…",
  charCountNeeded: (n) => `${n} और अक्षर चाहिए`,
  charCountOk: "ठीक लग रहा है",
  charCountOf: (count, max) => `${count}/${max}`,

  errorMinChars: (n) => `कृपया कम से कम ${n} अक्षरों में अपनी समस्या बताएं।`,

  btnAnalyze: "कानूनी दावे का विश्लेषण करें",
  btnCreating: "केस बनाया जा रहा है…",
  classifyingTitle: "आपकी समस्या समझी जा रही है…",
  classifyingBody: "इलेक्ट्रॉनिक्स क्लासिफायर + NLP इरादा पहचान चल रही है",

  speechStart: "रिकॉर्डिंग शुरू करें",
  speechStop: "रिकॉर्डिंग रोकें",
  speechListening: "सुन रहे हैं… रोकने के लिए टैप करें",
  speechTap: "टैप करें और अपनी समस्या जोर से बताएं",
  speechPartial: "पहचाना जा रहा है…",
  speechUnsupported:
    "इस ब्राउज़र में वाक् इनपुट समर्थित नहीं है। कृपया टाइप करें।",
  speechPermissionDenied:
    "माइक्रोफ़ोन एक्सेस अस्वीकार कर दी गई। माइक्रोफ़ोन एक्सेस की अनुमति दें और पुनः प्रयास करें।",
  speechError: "वाक् पहचान त्रुटि। पुनः प्रयास करें या टाइप करें।",
  speechAppend: "आवाज़ आपके विवरण में जोड़ी गई।",

  btnCorrect: "AI से सुधारें",
  correcting: "आपका टेक्स्ट सुधारा जा रहा है…",
  correctionOriginalLabel: "आपका मूल टेक्स्ट",
  correctionCorrectedLabel: "AI-सुधरा संस्करण",
  btnUseCorrection: "सुधरा टेक्स्ट उपयोग करें",
  btnKeepOriginal: "मेरा मूल टेक्स्ट रखें",
  correctionNotConfigured:
    "AI सुधार अभी कॉन्फ़िगर नहीं किया गया है। आप अपने मूल टेक्स्ट के साथ जारी रख सकते हैं।",
  correctionNetworkError:
    "AI सेवा तक नहीं पहुंचा जा सका। कनेक्शन जांचें और पुनः प्रयास करें।",
  correctionNoChange: "आपका टेक्स्ट पहले से स्पष्ट है। कोई बदलाव की जरूरत नहीं।",

  deviceDetected: "डिवाइस पहचाना गया",
  platformDetected: "प्लेटफ़ॉर्म",
  lowConfidence: "कृपया पहचानी गई जानकारी सत्यापित करें।",

  evidenceTitle: "साक्ष्य अपलोड करें (वैकल्पिक लेकिन अनुशंसित)",
  evidenceDescription:
    "चालान, WhatsApp चैट, उत्पाद फ़ोटो, स्क्रीन रिकॉर्डिंग, ईमेल या स्क्रीनशॉट अपलोड करें। AI स्वचालित रूप से मुख्य तथ्य निकालेगा।",
  evidenceInvoice: "चालान / PDF",
  evidenceChat: "चैट / ईमेल",
  evidencePhotos: "फ़ोटो",
  evidenceVideo: "स्क्रीन रिकॉर्डिंग",
  evidenceSupported:
    "समर्थित: Amazon/Flipkart ऑर्डर स्क्रीनशॉट, WhatsApp चैट एक्सपोर्ट, उत्पाद फ़ोटो, सर्विस सेंटर जॉब शीट, स्क्रीन रिकॉर्डिंग, PDF चालान, वारंटी कार्ड।",
  evidenceFilesUploaded: (n) =>
    `${n} फ़ाइल${n > 1 ? "ें" : ""} अपलोड हुई · AI विश्लेषण के दौरान तथ्य निकालेगा`,
  evidenceAINote: "समर्थित",
  btnRemove: "हटाएं",
}

export const INTAKE_TRANSLATIONS: Record<PreferredLanguage, IntakeTranslations> = {
  ENGLISH: en,
  TAMIL: ta,
  HINDI: hi,
}

export function useIntakeT(lang: PreferredLanguage): IntakeTranslations {
  return INTAKE_TRANSLATIONS[lang]
}

// Localized device labels for classification badge
export const DEVICE_LABELS: Record<PreferredLanguage, Record<string, string>> = {
  ENGLISH: {
    MOBILE_PHONE: "Mobile phone",
    LAPTOP: "Laptop / PC",
    TELEVISION: "Television",
    REFRIGERATOR: "Refrigerator",
    WASHING_MACHINE: "Washing machine",
    AIR_CONDITIONER: "Air conditioner",
    SMART_DEVICE: "Smart device",
    CHARGER_POWER_BANK: "Charger / Power bank",
    AUDIO_DEVICE: "Audio device",
    CAMERA: "Camera",
    TABLET: "Tablet",
    PRINTER: "Printer",
    MICROWAVE: "Microwave",
    OTHER_ELECTRONICS: "Electronic device",
  },
  TAMIL: {
    MOBILE_PHONE: "மொபைல் போன்",
    LAPTOP: "லேப்டாப் / PC",
    TELEVISION: "தொலைக்காட்சி",
    REFRIGERATOR: "குளிர்சாதனப் பெட்டி",
    WASHING_MACHINE: "வாஷிங் மெஷின்",
    AIR_CONDITIONER: "ஏர் கண்டிஷனர்",
    SMART_DEVICE: "ஸ்மார்ட் சாதனம்",
    CHARGER_POWER_BANK: "சார்ஜர் / பவர் பேங்க்",
    AUDIO_DEVICE: "ஆடியோ சாதனம்",
    CAMERA: "கேமரா",
    TABLET: "டேப்லெட்",
    PRINTER: "பிரிண்டர்",
    MICROWAVE: "மைக்ரோவேவ்",
    OTHER_ELECTRONICS: "மின்னணு சாதனம்",
  },
  HINDI: {
    MOBILE_PHONE: "मोबाइल फोन",
    LAPTOP: "लैपटॉप / PC",
    TELEVISION: "टेलीविजन",
    REFRIGERATOR: "रेफ्रिजरेटर",
    WASHING_MACHINE: "वाशिंग मशीन",
    AIR_CONDITIONER: "एयर कंडीशनर",
    SMART_DEVICE: "स्मार्ट डिवाइस",
    CHARGER_POWER_BANK: "चार्जर / पावर बैंक",
    AUDIO_DEVICE: "ऑडियो डिवाइस",
    CAMERA: "कैमरा",
    TABLET: "टैबलेट",
    PRINTER: "प्रिंटर",
    MICROWAVE: "माइक्रोवेव",
    OTHER_ELECTRONICS: "इलेक्ट्रॉनिक डिवाइस",
  },
}

export const ISSUE_LABELS: Record<PreferredLanguage, Record<string, string>> = {
  ENGLISH: {
    DEAD_ON_ARRIVAL: "Dead on arrival",
    PHYSICAL_DAMAGE: "Physical damage",
    SCREEN_DEFECT: "Screen defect",
    BATTERY_ISSUE: "Battery issue",
    OVERHEATING: "Overheating",
    SOFTWARE_DEFECT: "Software defect",
    CONNECTIVITY_ISSUE: "Connectivity issue",
    PERFORMANCE_DEGRADATION: "Performance issue",
    COUNTERFEIT_PRODUCT: "Counterfeit product",
    WRONG_PRODUCT_DELIVERED: "Wrong product delivered",
    MISSING_ACCESSORIES: "Missing accessories",
    REFUND_DENIED: "Refund denied",
    REPLACEMENT_DENIED: "Replacement denied",
    WARRANTY_DISHONOURED: "Warranty dishonoured",
    SERVICE_CENTER_NEGLIGENCE: "Service center negligence",
    DELAYED_DELIVERY: "Delayed delivery",
  },
  TAMIL: {
    DEAD_ON_ARRIVAL: "வந்தவுடன் செயலிழந்தது",
    PHYSICAL_DAMAGE: "உடல் சேதம்",
    SCREEN_DEFECT: "திரை கோளாறு",
    BATTERY_ISSUE: "பேட்டரி பிரச்சனை",
    OVERHEATING: "அதிக வெப்பம்",
    SOFTWARE_DEFECT: "மென்பொருள் கோளாறு",
    CONNECTIVITY_ISSUE: "இணைப்பு பிரச்சனை",
    PERFORMANCE_DEGRADATION: "செயல்திறன் குறைபாடு",
    COUNTERFEIT_PRODUCT: "போலி தயாரிப்பு",
    WRONG_PRODUCT_DELIVERED: "தவறான தயாரிப்பு வழங்கப்பட்டது",
    MISSING_ACCESSORIES: "துணைப்பொருட்கள் இல்லை",
    REFUND_DENIED: "பணம் திரும்ப மறுக்கப்பட்டது",
    REPLACEMENT_DENIED: "மாற்றம் மறுக்கப்பட்டது",
    WARRANTY_DISHONOURED: "உத்தரவாதம் மறுக்கப்பட்டது",
    SERVICE_CENTER_NEGLIGENCE: "சேவை மையம் அலட்சியம்",
    DELAYED_DELIVERY: "தாமதமான டெலிவரி",
  },
  HINDI: {
    DEAD_ON_ARRIVAL: "आते ही खराब",
    PHYSICAL_DAMAGE: "शारीरिक क्षति",
    SCREEN_DEFECT: "स्क्रीन खराबी",
    BATTERY_ISSUE: "बैटरी समस्या",
    OVERHEATING: "अत्यधिक गर्म होना",
    SOFTWARE_DEFECT: "सॉफ्टवेयर खराबी",
    CONNECTIVITY_ISSUE: "कनेक्टिविटी समस्या",
    PERFORMANCE_DEGRADATION: "प्रदर्शन समस्या",
    COUNTERFEIT_PRODUCT: "नकली उत्पाद",
    WRONG_PRODUCT_DELIVERED: "गलत उत्पाद दिया गया",
    MISSING_ACCESSORIES: "सहायक उपकरण गायब",
    REFUND_DENIED: "वापसी से इनकार",
    REPLACEMENT_DENIED: "बदलाव से इनकार",
    WARRANTY_DISHONOURED: "वारंटी अस्वीकार",
    SERVICE_CENTER_NEGLIGENCE: "सर्विस सेंटर की लापरवाही",
    DELAYED_DELIVERY: "देरी से डिलीवरी",
  },
}
