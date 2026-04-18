import { auth, db } from "./firebase.js";
import {
  buildGoogleMapsCoordinateLink,
  extractCoordinatesFromMapLink,
  getLocationCoordinates,
  getValidatedUaeCoordinates,
  normalizeMapUrl
} from "./location-utils.js";
import { initScrollTopButton } from "./scroll-top.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { collection, doc, getDoc, getDocs, onSnapshot, query, serverTimestamp, updateDoc, where } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const driverWelcomeTitle = document.getElementById("driverWelcomeTitle");
const driverSummaryText = document.getElementById("driverSummaryText");
const driverDashboardStatus = document.getElementById("driverDashboardStatus");
const driverOrdersGrid = document.getElementById("driverOrders") || document.getElementById("driverOrdersGrid");
const driverCompletedOrdersGrid = document.getElementById("driverCompletedOrders");
const driverCompletedOrdersSummary = document.getElementById("driverCompletedOrdersSummary");
const activeDeliveryPill = document.getElementById("activeDeliveryPill");
const locationSharingPill = document.getElementById("locationSharingPill");
const driverLogoutBtn = document.getElementById("driverLogoutBtn");
const completedRangeFilter = document.getElementById("completedRangeFilter");
const completedSortFilter = document.getElementById("completedSortFilter");
const completedSearchInput = document.getElementById("completedSearchInput");
const driverCompletedPagination = document.getElementById("driverCompletedPagination");
const driverCompletedPrevBtn = document.getElementById("driverCompletedPrevBtn");
const driverCompletedNextBtn = document.getElementById("driverCompletedNextBtn");
const driverCompletedPageInfo = document.getElementById("driverCompletedPageInfo");
const driverCollectionForm = document.getElementById("driverCollectionForm");
const driverCollectionOrderIdInput = document.getElementById("driverCollectionOrderIdInput");
const driverCollectionFindBtn = document.getElementById("driverCollectionFindBtn");
const driverCollectionResult = document.getElementById("driverCollectionResult");
const driverSidebarNav = document.getElementById("driverSidebarNav");
const driverLanguageSelect = document.getElementById("driverLanguageSelect");

let currentDriver = null;
let currentOrders = [];
let locationWatchId = null;
let isLocationUpdatePending = false;
let ordersUnsubscribe = null;
let startingOrderIds = new Set();
let finishingOrderIds = new Set();
let lastSharedLocation = null;
let lastTimeoutMessageAt = 0;
let isLocationSharingEnabled = false;
let locationWatchHealthCheckId = null;
let lastLocationActivityAt = 0;
let completedOrdersPage = 1;
let currentCollectionLookupOrder = null;
let isFindingCollectionOrder = false;
let isMarkingCollected = false;
let hasDashboardHydrated = false;

const GEOLOCATION_OPTIONS = {
  enableHighAccuracy: true,
  maximumAge: 15000,
  timeout: 30000
};
const LOCATION_UPDATE_MIN_INTERVAL_MS = 15000;
const LOCATION_UPDATE_MIN_DISTANCE_KM = 0.05;
const TIMEOUT_MESSAGE_COOLDOWN_MS = 45000;
const LOCATION_WATCH_HEALTHCHECK_MS = 30000;
const LOCATION_WATCH_STALE_MS = 120000;
const COMPLETED_ORDERS_PER_PAGE = 6;
const DEFAULT_RENTAL_DAYS = 1;
const DRIVER_LANGUAGE_STORAGE_KEY = "tajDriverDashboardLanguage";
const DRIVER_LANGUAGE_CONFIG = {
  en: { dir: "ltr", locale: "en-US", htmlLang: "en" },
  ar: { dir: "rtl", locale: "ar-AE", htmlLang: "ar" },
  ur: { dir: "rtl", locale: "ur-PK", htmlLang: "ur" }
};
const DRIVER_I18N = {};

const storedUid = localStorage.getItem("driverUid");

if(!storedUid){
  window.location.href = "driver-login.html";
}

const LOCATION_SHARING_PREFERENCE_KEY = storedUid
  ? `tajDriverLocationSharingEnabled:${storedUid}`
  : "tajDriverLocationSharingEnabled";

let currentDriverLanguage = getStoredDriverLanguage();
let dashboardMessageState = {
  key: "statusBanner.connecting",
  params: {},
  type: "info"
};
let collectionRenderState = {
  view: "empty"
};

function getStoredDriverLanguage(){
  const storedLanguage = localStorage.getItem(DRIVER_LANGUAGE_STORAGE_KEY);
  if(storedLanguage === "hi"){
    return "ur";
  }
  return DRIVER_LANGUAGE_CONFIG[storedLanguage] ? storedLanguage : "en";
}

function persistDriverLanguage(language){
  currentDriverLanguage = DRIVER_LANGUAGE_CONFIG[language] ? language : "en";
  localStorage.setItem(DRIVER_LANGUAGE_STORAGE_KEY, currentDriverLanguage);
}

function getDriverLocale(){
  return DRIVER_LANGUAGE_CONFIG[currentDriverLanguage]?.locale || DRIVER_LANGUAGE_CONFIG.en.locale;
}

function getDriverDirection(){
  return DRIVER_LANGUAGE_CONFIG[currentDriverLanguage]?.dir || "ltr";
}

function getDriverHtmlLang(){
  return DRIVER_LANGUAGE_CONFIG[currentDriverLanguage]?.htmlLang || "en";
}

function getTranslationValue(key, language = currentDriverLanguage){
  return key.split(".").reduce((value, segment) => {
    if(value && typeof value === "object" && segment in value){
      return value[segment];
    }
    return undefined;
  }, DRIVER_I18N[language] || DRIVER_I18N.en);
}

function t(key, params = {}, language = currentDriverLanguage){
  const translatedValue = getTranslationValue(key, language) ?? getTranslationValue(key, "en");

  if(typeof translatedValue !== "string"){
    return key;
  }

  return translatedValue.replace(/\{(\w+)\}/g, (_, paramKey) => String(params[paramKey] ?? ""));
}

DRIVER_I18N.en = {
  meta: {
    title: "Driver Dashboard | Al Taj Al Malaky",
    logoAlt: "Al Taj Al Malaky logo"
  },
  brand: {
    subtitle: "Luxury Event Setup & Rental"
  },
  header: {
    logout: "Logout"
  },
  language: {
    label: "Language"
  },
  sidebar: {
    ariaLabel: "Driver dashboard navigation",
    quickNav: "Quick Navigation",
    groupDriver: "Driver",
    groupSystem: "System",
    dashboard: "Dashboard",
    activeOrders: "Active Orders",
    collection: "Collection",
    completedOrders: "Completed Orders",
    support: "Support"
  },
  hero: {
    kicker: "Driver Dashboard",
    greeting: "Hello, <span id=\"driverWelcomeName\">{name}</span>",
    summaryEmpty: "Assigned deliveries will appear here in real time.",
    summaryLabel: "Operational Summary",
    activeAssigned: "Active Assigned",
    completedOverall: "Completed Overall",
    inDeliveryFlow: "In Delivery Flow",
    activeDeliveries: "Active Deliveries",
    locationSharingLabel: "Location Sharing",
    noActiveDeliveries: "No active deliveries",
    activeCountSummary: "{count} active ({orders})",
    locationOnShort: "ON",
    locationOffShort: "OFF",
    activeNone: "Active deliveries: none",
    activeSome: "Active deliveries: {orders}",
    locationOn: "Location sharing: ON",
    locationOff: "Location sharing: OFF"
  },
  activeOrders: {
    kicker: "Assigned Work",
    title: "Active Orders",
    loadingTitle: "Loading assigned orders...",
    loadingDesc: "Please wait while your dashboard connects.",
    emptyTitle: "No active orders right now",
    emptyDesc: "New assigned deliveries will appear here automatically."
  },
  collection: {
    kicker: "Rental Returns",
    title: "Collect an Order",
    summary: "Enter any delivered order ID to mark the rental items as collected back.",
    orderIdLabel: "Order ID",
    orderIdPlaceholder: "TAJ-1053-VC2",
    find: "Find Order",
    finding: "Finding...",
    emptyTitle: "Ready to collect a delivered order",
    emptyDesc: "Search by the customer-facing order ID to view the order summary and release inventory after collection.",
    lookupKicker: "Collection Lookup",
    searchTitle: "Searching for order",
    searchDesc: "Looking up {orderId} now.",
    driverLoadingTitle: "Driver profile is still loading",
    driverLoadingDesc: "Please wait a moment and try again.",
    enterOrderTitle: "Enter an order ID",
    enterOrderDesc: "Type the customer-facing order ID before searching.",
    notFoundTitle: "Order not found",
    notFoundDesc: "We could not find an order with that ID. Please check the ID and try again.",
    lookupFailedTitle: "Lookup failed",
    lookupFailedDesc: "We could not load that order right now. Please try again.",
    readyTitle: "Order Ready for Collection",
    readyDesc: "Review the summary below, then confirm that the rental items have been collected back.",
    alreadyCollectedTitle: "This order has already been collected",
    alreadyCollectedDesc: "This rental order has already been returned and inventory has been released.",
    notReadyTitle: "This order is not ready for collection",
    notReadyDesc: "Only orders with status {requiredStatus} can be collected. Current status: {currentStatus}.",
    itemsMarkedTitle: "Items marked as collected",
    itemsMarkedDesc: "This order has been returned successfully and the reserved inventory is now released.",
    orderMissingTitle: "Order no longer exists",
    orderMissingDesc: "This order could not be found anymore.",
    updateFailedTitle: "Collection update failed",
    updateFailedDesc: "The order is still eligible for collection, but the update did not go through. Please try again.",
    confirm: "Mark Items Collected",
    confirming: "Marking Items Collected...",
    openMap: "Open Map",
    fields: {
      orderId: "Order ID",
      customer: "Customer",
      eventDate: "Event Date",
      rentalDays: "Rental Days",
      pickupDate: "Pickup Date",
      pickupTime: "Pickup Time",
      eventLocation: "Event Location",
      items: "Items in this Order",
      deliveredBy: "Delivered By",
      deliveredAt: "Delivered At",
      collectedBy: "Collected By",
      collectedAt: "Collected At"
    }
  },
  completed: {
    kicker: "Delivery History",
    title: "Completed Orders",
    summaryEmpty: "Delivered and collected orders will appear here automatically.",
    summaryWithCounts: "{monthCount} completed this month and {allCount} completed all time.",
    range: "Range",
    sort: "Sort",
    search: "Search",
    rangeMonth: "This Month",
    rangeAll: "All Time",
    sortRecent: "Most Recent First",
    sortOldest: "Oldest First",
    searchPlaceholder: "Order ID or customer name",
    initialEmptyTitle: "No completed orders yet",
    initialEmptyDesc: "Delivered and collected orders will move here automatically.",
    emptyTitle: "No completed orders found",
    emptyDesc: "Try a different filter or complete a delivery or collection to see it here.",
    previous: "Previous",
    next: "Next",
    pageInfo: "Page {current} of {total}",
    completedDate: "Completed Date"
  },
  support: {
    icon: "TEL",
    kicker: "Need Help",
    title: "Support",
    description: "For dispatch or technical issues, please contact MR Mohamad Daya."
  },
  statusBanner: {
    connecting: "Connecting to your assigned orders...",
    loadFailed: "We could not load your deliveries right now.",
    startSuccess: "Delivery started for {orderId}. You can share live location now.",
    startFailed: "We could not start delivery right now.",
    geolocationUnsupported: "Geolocation is not supported on this device.",
    locationUpdateFailed: "Could not update live location. We'll keep trying in the background.",
    locationPermissionDenied: "Location permission was denied. Please allow location access to continue live sharing.",
    locationTimeout: "Live location is taking longer than expected. We'll keep trying in the background.",
    locationWeak: "Live location signal is weak right now. We'll keep trying in the background.",
    locationStarted: "Live location sharing started for active deliveries.",
    locationActive: "Live location sharing is active for your current deliveries.",
    finishSuccess: "Order {orderId} completed successfully.",
    finishFailed: "We could not complete this order right now.",
    startBeforeShare: "Start delivery before sharing live location.",
    locationAlreadyActive: "Live location is already updating for active deliveries.",
    profileMissing: "Your driver profile was not found. Please contact admin.",
    dashboardConnected: "Dashboard connected. Assigned orders update in real time.",
    profileUnavailable: "Your driver profile is unavailable right now.",
    alreadyCollected: "Order {orderId} has already been collected.",
    notReadyForCollection: "This order is not ready for collection.",
    collectedSuccess: "Order {orderId} marked as collected.",
    collectedFailed: "We could not mark this order as collected right now.",
    openFailed: "We could not open your dashboard right now."
  },
  order: {
    unknownCustomer: "Unknown customer",
    noItems: "No items listed",
    unnamedItem: "Unnamed item",
    priority: "Priority",
    eventTime: "Event Time",
    rentalDays: "Rental Days",
    setupTime: "Setup Time",
    location: "Location",
    orderItems: "Order Items",
    noLocationYet: "No location yet",
    onTheWay: "On the Way",
    liveLocationOn: "Live location is ON",
    liveLocationOnDesc: "Customer can now see your movement",
    liveLocationOff: "Live location is OFF",
    liveLocationOffDesc: "Press \"Share Live Location\" so the customer can track you",
    startDelivery: "Start Delivery",
    startingDelivery: "Starting Delivery...",
    shareLiveLocation: "Share Live Location",
    sharingLiveLocation: "Sharing Live Location",
    finishOrder: "Finish Order",
    finishingOrder: "Finishing Order...",
    deliveryCompleted: "Delivery Completed",
    itemsCollectedBack: "Items Collected Back",
    cancelled: "Cancelled",
    completedPrefix: "Completed {date}",
    completedFallback: "Completed",
    callCustomer: "Call Customer",
    sendWhatsApp: "Send Message on WhatsApp",
    openMap: "Open Map",
    whatsappMessage: "Hello {customerName}, this is your driver for order {orderId}.",
    dateTbc: "Date TBC"
  },
  priority: {
    normal: "Normal",
    urgent: "Urgent",
    vip: "VIP"
  },
  statuses: {
    unknown: "Unknown",
    confirmed: "Confirmed",
    preparing: "Preparing",
    "out-for-delivery": "Out for Delivery",
    delivered: "Delivered",
    collected: "Collected",
    cancelled: "Cancelled"
  },
  prompts: {
    finishConfirmTitle: "Are you sure you want to finish order {orderId}?",
    finishConfirmBody: "This will mark order {orderId} as delivered. Continue?"
  },
  scrollTop: {
    text: "Top",
    ariaLabel: "Scroll back to top",
    title: "Back to top"
  },
  common: {
    driver: "Driver",
    customer: "Customer",
    notRecorded: "Not recorded",
    noLocationRecorded: "No location recorded",
    na: "N/A"
  }
};

DRIVER_I18N.ar = {
  meta: {
    title: "لوحة السائق | التاج الملكي",
    logoAlt: "شعار التاج الملكي"
  },
  brand: {
    subtitle: "تنسيق وتأجير فعاليات فاخرة"
  },
  header: {
    logout: "تسجيل الخروج"
  },
  language: {
    label: "اللغة"
  },
  sidebar: {
    ariaLabel: "تنقل لوحة السائق",
    quickNav: "التنقل السريع",
    groupDriver: "السائق",
    groupSystem: "النظام",
    dashboard: "اللوحة",
    activeOrders: "الطلبات النشطة",
    collection: "الاسترجاع",
    completedOrders: "الطلبات المكتملة",
    support: "الدعم"
  },
  hero: {
    kicker: "لوحة السائق",
    greeting: "مرحبًا، <span id=\"driverWelcomeName\">{name}</span>",
    summaryEmpty: "ستظهر الطلبات المسندة هنا فورًا.",
    summaryLabel: "الملخص التشغيلي",
    activeAssigned: "مسندة نشطة",
    completedOverall: "مكتملة إجمالًا",
    inDeliveryFlow: "ضمن مسار التوصيل",
    activeNone: "الشحنات النشطة: لا يوجد",
    activeSome: "الشحنات النشطة: {orders}",
    locationOn: "مشاركة الموقع: مفعلة",
    locationOff: "مشاركة الموقع: متوقفة"
  },
  activeOrders: {
    kicker: "المهام المسندة",
    title: "الطلبات النشطة",
    loadingTitle: "جارٍ تحميل الطلبات المسندة...",
    loadingDesc: "يرجى الانتظار بينما تتصل اللوحة ببياناتك.",
    emptyTitle: "لا توجد طلبات نشطة الآن",
    emptyDesc: "ستظهر الطلبات الجديدة المسندة إليك هنا تلقائيًا."
  },
  collection: {
    kicker: "استرجاع الإيجارات",
    title: "استلام طلب",
    summary: "أدخل أي رقم طلب تم تسليمه لتأكيد استرجاع مواد الإيجار.",
    orderIdLabel: "رقم الطلب",
    orderIdPlaceholder: "TAJ-1053-VC2",
    find: "البحث عن الطلب",
    finding: "جارٍ البحث...",
    emptyTitle: "جاهز لاستلام طلب تم تسليمه",
    emptyDesc: "ابحث برقم الطلب الخاص بالعميل لعرض الملخص وتحرير المخزون بعد الاسترجاع.",
    lookupKicker: "بحث الاسترجاع",
    searchTitle: "جارٍ البحث عن الطلب",
    searchDesc: "يتم الآن البحث عن {orderId}.",
    driverLoadingTitle: "ملف السائق ما زال قيد التحميل",
    driverLoadingDesc: "يرجى الانتظار لحظة ثم المحاولة مرة أخرى.",
    enterOrderTitle: "أدخل رقم الطلب",
    enterOrderDesc: "اكتب رقم الطلب الخاص بالعميل قبل البحث.",
    notFoundTitle: "لم يتم العثور على الطلب",
    notFoundDesc: "تعذر العثور على طلب بهذا الرقم. يرجى التحقق ثم المحاولة مرة أخرى.",
    lookupFailedTitle: "فشل البحث",
    lookupFailedDesc: "تعذر تحميل هذا الطلب الآن. يرجى المحاولة مرة أخرى.",
    readyTitle: "الطلب جاهز للاسترجاع",
    readyDesc: "راجع الملخص أدناه ثم أكد أن مواد الإيجار تم استرجاعها.",
    alreadyCollectedTitle: "تم استرجاع هذا الطلب بالفعل",
    alreadyCollectedDesc: "تمت إعادة هذا الطلب الإيجاري مسبقًا وتم تحرير المخزون.",
    notReadyTitle: "هذا الطلب غير جاهز للاسترجاع",
    notReadyDesc: "يمكن استرجاع الطلبات التي حالتها {requiredStatus} فقط. الحالة الحالية: {currentStatus}.",
    itemsMarkedTitle: "تم تأكيد استرجاع المواد",
    itemsMarkedDesc: "تمت إعادة هذا الطلب بنجاح وأصبح المخزون المحجوز متاحًا الآن.",
    orderMissingTitle: "الطلب لم يعد موجودًا",
    orderMissingDesc: "لم يعد من الممكن العثور على هذا الطلب.",
    updateFailedTitle: "فشل تحديث الاسترجاع",
    updateFailedDesc: "الطلب ما زال مؤهلًا للاسترجاع، لكن التحديث لم يكتمل. يرجى المحاولة مرة أخرى.",
    confirm: "تأكيد استرجاع المواد",
    confirming: "جارٍ تأكيد الاسترجاع...",
    openMap: "فتح الخريطة",
    fields: {
      orderId: "رقم الطلب",
      customer: "العميل",
      eventDate: "تاريخ الفعالية",
      rentalDays: "أيام الإيجار",
      pickupDate: "تاريخ الاستلام",
      pickupTime: "وقت الاستلام",
      eventLocation: "موقع الفعالية",
      items: "المواد داخل هذا الطلب",
      deliveredBy: "تم التسليم بواسطة",
      deliveredAt: "تم التسليم في",
      collectedBy: "تم الاسترجاع بواسطة",
      collectedAt: "تم الاسترجاع في"
    }
  },
  completed: {
    kicker: "سجل التوصيل",
    title: "الطلبات المكتملة",
    summaryEmpty: "ستظهر الطلبات التي تم تسليمها واسترجاعها هنا تلقائيًا.",
    summaryWithCounts: "{monthCount} مكتمل هذا الشهر و{allCount} مكتمل إجمالًا.",
    range: "الفترة",
    sort: "الترتيب",
    search: "بحث",
    rangeMonth: "هذا الشهر",
    rangeAll: "كل الفترات",
    sortRecent: "الأحدث أولًا",
    sortOldest: "الأقدم أولًا",
    searchPlaceholder: "رقم الطلب أو اسم العميل",
    initialEmptyTitle: "لا توجد طلبات مكتملة بعد",
    initialEmptyDesc: "ستنتقل الطلبات التي تم تسليمها واسترجاعها إلى هنا تلقائيًا.",
    emptyTitle: "لم يتم العثور على طلبات مكتملة",
    emptyDesc: "جرّب فلترًا مختلفًا أو أكمل عملية تسليم أو استرجاع لتظهر هنا.",
    previous: "السابق",
    next: "التالي",
    pageInfo: "الصفحة {current} من {total}",
    completedDate: "تاريخ الاكتمال"
  },
  support: {
    icon: "هاتف",
    kicker: "تحتاج إلى مساعدة",
    title: "الدعم",
    description: "لأي مسائل تشغيلية أو تقنية، يرجى التواصل مع السيد محمد ضياء."
  },
  statusBanner: {
    connecting: "جارٍ الاتصال بطلباتك المسندة...",
    loadFailed: "تعذر تحميل الشحنات الخاصة بك الآن.",
    startSuccess: "تم بدء التوصيل للطلب {orderId}. يمكنك الآن مشاركة الموقع المباشر.",
    startFailed: "تعذر بدء التوصيل الآن.",
    geolocationUnsupported: "هذا الجهاز لا يدعم تحديد الموقع الجغرافي.",
    locationUpdateFailed: "تعذر تحديث الموقع المباشر. سنواصل المحاولة في الخلفية.",
    locationPermissionDenied: "تم رفض إذن الموقع. يرجى السماح بالوصول إلى الموقع لمتابعة المشاركة المباشرة.",
    locationTimeout: "الموقع المباشر يستغرق وقتًا أطول من المتوقع. سنواصل المحاولة في الخلفية.",
    locationWeak: "إشارة الموقع المباشر ضعيفة حاليًا. سنواصل المحاولة في الخلفية.",
    locationStarted: "بدأت مشاركة الموقع المباشر للشحنات النشطة.",
    locationActive: "مشاركة الموقع المباشر مفعلة لشحناتك الحالية.",
    finishSuccess: "تم إكمال الطلب {orderId} بنجاح.",
    finishFailed: "تعذر إكمال هذا الطلب الآن.",
    startBeforeShare: "ابدأ التوصيل قبل مشاركة الموقع المباشر.",
    locationAlreadyActive: "الموقع المباشر يتم تحديثه بالفعل للشحنات النشطة.",
    profileMissing: "لم يتم العثور على ملف السائق الخاص بك. يرجى التواصل مع الإدارة.",
    dashboardConnected: "تم ربط اللوحة بنجاح. يتم تحديث الطلبات المسندة في الوقت الفعلي.",
    profileUnavailable: "ملف السائق غير متاح الآن.",
    alreadyCollected: "تم استرجاع الطلب {orderId} بالفعل.",
    notReadyForCollection: "هذا الطلب غير جاهز للاسترجاع.",
    collectedSuccess: "تم وضع علامة الاسترجاع على الطلب {orderId}.",
    collectedFailed: "تعذر وضع علامة استرجاع لهذا الطلب الآن.",
    openFailed: "تعذر فتح لوحة السائق الآن."
  },
  order: {
    unknownCustomer: "عميل غير معروف",
    noItems: "لا توجد مواد مدرجة",
    unnamedItem: "مادة بدون اسم",
    priority: "الأولوية",
    eventTime: "موعد الفعالية",
    rentalDays: "أيام الإيجار",
    setupTime: "وقت التجهيز",
    location: "الموقع",
    orderItems: "مواد الطلب",
    noLocationYet: "لا يوجد موقع بعد",
    onTheWay: "في الطريق",
    liveLocationOn: "الموقع المباشر مفعل",
    liveLocationOnDesc: "يمكن للعميل الآن متابعة حركتك",
    liveLocationOff: "الموقع المباشر متوقف",
    liveLocationOffDesc: "اضغط على \"مشاركة الموقع المباشر\" ليتمكن العميل من تتبعك",
    startDelivery: "بدء التوصيل",
    startingDelivery: "جارٍ بدء التوصيل...",
    shareLiveLocation: "مشاركة الموقع المباشر",
    sharingLiveLocation: "تتم مشاركة الموقع المباشر",
    finishOrder: "إنهاء الطلب",
    finishingOrder: "جارٍ إنهاء الطلب...",
    deliveryCompleted: "اكتمل التوصيل",
    itemsCollectedBack: "تم استرجاع المواد",
    cancelled: "ملغي",
    completedPrefix: "اكتمل في {date}",
    completedFallback: "اكتمل",
    callCustomer: "الاتصال بالعميل",
    sendWhatsApp: "إرسال رسالة واتساب",
    openMap: "فتح الخريطة",
    whatsappMessage: "مرحبًا {customerName}، أنا السائق المسؤول عن طلبك رقم {orderId}.",
    dateTbc: "التاريخ سيحدد لاحقًا"
  },
  priority: {
    normal: "عادي",
    urgent: "عاجل",
    vip: "VIP"
  },
  statuses: {
    unknown: "غير معروف",
    confirmed: "مؤكد",
    preparing: "قيد التجهيز",
    "out-for-delivery": "خرج للتوصيل",
    delivered: "تم التسليم",
    collected: "تم الاسترجاع",
    cancelled: "ملغي"
  },
  prompts: {
    finishConfirmTitle: "هل أنت متأكد من إنهاء الطلب {orderId}؟",
    finishConfirmBody: "سيتم وضع علامة \"تم التسليم\" على الطلب {orderId}. هل تريد المتابعة؟"
  },
  scrollTop: {
    text: "أعلى",
    ariaLabel: "العودة إلى أعلى الصفحة",
    title: "العودة إلى الأعلى"
  },
  common: {
    driver: "السائق",
    customer: "العميل",
    notRecorded: "غير مسجل",
    noLocationRecorded: "لا يوجد موقع مسجل",
    na: "غير متوفر"
  }
};

Object.assign(DRIVER_I18N.ar.hero, {
  activeDeliveries: "الشحنات النشطة",
  locationSharingLabel: "مشاركة الموقع",
  noActiveDeliveries: "لا توجد شحنات نشطة",
  activeCountSummary: "{count} نشطة ({orders})",
  locationOnShort: "مفعل",
  locationOffShort: "متوقف"
});

DRIVER_I18N.hi = {
  meta: {
    title: "Driver Dashboard | Al Taj Al Malaky",
    logoAlt: "Al Taj Al Malaky ka logo"
  },
  brand: {
    subtitle: "Luxury event setup aur rental"
  },
  header: {
    logout: "Logout"
  },
  language: {
    label: "Zabaan"
  },
  sidebar: {
    ariaLabel: "Driver dashboard navigation",
    quickNav: "Quick Navigation",
    groupDriver: "Driver",
    groupSystem: "System",
    dashboard: "Dashboard",
    activeOrders: "Active Orders",
    collection: "Collection",
    completedOrders: "Completed Orders",
    support: "Support"
  },
  hero: {
    kicker: "Driver Dashboard",
    greeting: "Hello, <span id=\"driverWelcomeName\">{name}</span>",
    summaryEmpty: "Assigned deliveries yahan real time mein nazar aayengi.",
    summaryLabel: "Operational Summary",
    activeAssigned: "Active Assigned",
    completedOverall: "Completed Overall",
    inDeliveryFlow: "In Delivery Flow",
    activeNone: "Active deliveries: koi nahin",
    activeSome: "Active deliveries: {orders}",
    locationOn: "Location sharing: ON",
    locationOff: "Location sharing: OFF"
  },
  activeOrders: {
    kicker: "Assigned Work",
    title: "Active Orders",
    loadingTitle: "Assigned orders load ho rahe hain...",
    loadingDesc: "Dashboard connect hone tak zara intezar karo.",
    emptyTitle: "Abhi koi active order nahin",
    emptyDesc: "Naye assigned deliveries yahan automatic dikh jayenge."
  },
  collection: {
    kicker: "Rental Returns",
    title: "Order collect karo",
    summary: "Kisi delivered order ka ID dalo taake rental items collected mark ho jayen.",
    orderIdLabel: "Order ID",
    orderIdPlaceholder: "TAJ-1053-VC2",
    find: "Order dhoondo",
    finding: "Dhoond rahe hain...",
    emptyTitle: "Delivered order collect karne ke liye tayyar",
    emptyDesc: "Customer wala order ID search karo, summary dekho, aur collection ke baad inventory release karo.",
    lookupKicker: "Collection Lookup",
    searchTitle: "Order dhoonda ja raha hai",
    searchDesc: "{orderId} ko abhi lookup kar rahe hain.",
    driverLoadingTitle: "Driver profile abhi load ho rahi hai",
    driverLoadingDesc: "Thora sa intezar karo aur phir dobara koshish karo.",
    enterOrderTitle: "Order ID dalo",
    enterOrderDesc: "Search se pehle customer wala order ID type karo.",
    notFoundTitle: "Order nahin mila",
    notFoundDesc: "Is ID ka order nahin mila. ID check karke phir try karo.",
    lookupFailedTitle: "Lookup fail ho gaya",
    lookupFailedDesc: "Abhi yeh order load nahin ho saka. Dobara try karo.",
    readyTitle: "Order collection ke liye ready hai",
    readyDesc: "Neeche summary check karo, phir confirm karo ke rental items wapas collect ho gaye hain.",
    alreadyCollectedTitle: "Yeh order pehle hi collect ho chuka hai",
    alreadyCollectedDesc: "Yeh rental order pehle hi return ho chuka hai aur inventory release ho gayi hai.",
    notReadyTitle: "Yeh order collection ke liye ready nahin hai",
    notReadyDesc: "Sirf {requiredStatus} status wale orders collect ho sakte hain. Abhi status: {currentStatus}.",
    itemsMarkedTitle: "Items collected mark ho gaye",
    itemsMarkedDesc: "Yeh order kamyabi se return ho gaya hai aur reserved inventory ab release ho chuki hai.",
    orderMissingTitle: "Order ab mojood nahin",
    orderMissingDesc: "Yeh order ab nahin mil raha.",
    updateFailedTitle: "Collection update fail ho gayi",
    updateFailedDesc: "Order abhi bhi collection ke liye eligible hai, lekin update nahin gaya. Dobara try karo.",
    confirm: "Items collected mark karo",
    confirming: "Items collected mark ho rahe hain...",
    openMap: "Map kholo",
    fields: {
      orderId: "Order ID",
      customer: "Customer",
      eventDate: "Event Date",
      rentalDays: "Rental Days",
      pickupDate: "Pickup Date",
      pickupTime: "Pickup Time",
      eventLocation: "Event Location",
      items: "Is order ke items",
      deliveredBy: "Delivered By",
      deliveredAt: "Delivered At",
      collectedBy: "Collected By",
      collectedAt: "Collected At"
    }
  },
  completed: {
    kicker: "Delivery History",
    title: "Completed Orders",
    summaryEmpty: "Delivered aur collected orders yahan automatic nazar aayenge.",
    summaryWithCounts: "Is month {monthCount} completed aur total {allCount} completed.",
    range: "Range",
    sort: "Sort",
    search: "Search",
    rangeMonth: "This Month",
    rangeAll: "All Time",
    sortRecent: "Most Recent First",
    sortOldest: "Oldest First",
    searchPlaceholder: "Order ID ya customer name",
    initialEmptyTitle: "Abhi completed orders nahin",
    initialEmptyDesc: "Delivered aur collected orders yahan shift ho jayenge.",
    emptyTitle: "Completed orders nahin mile",
    emptyDesc: "Koi aur filter try karo ya delivery/collection complete karo taake yahan nazar aaye.",
    previous: "Previous",
    next: "Next",
    pageInfo: "Page {current} of {total}",
    completedDate: "Completed Date"
  },
  support: {
    icon: "Call",
    kicker: "Madad chahiye",
    title: "Support",
    description: "Dispatch ya technical masle ke liye MR Mohamad Daya se rabta karo."
  },
  statusBanner: {
    connecting: "Assigned orders se connect ho raha hai...",
    loadFailed: "Abhi aapki deliveries load nahin ho sakin.",
    startSuccess: "Order {orderId} ki delivery start ho gayi. Ab live location share kar sakte ho.",
    startFailed: "Abhi delivery start nahin ho saki.",
    geolocationUnsupported: "Is device par geolocation support nahin hai.",
    locationUpdateFailed: "Live location update nahin ho saki. Hum background mein try karte rahenge.",
    locationPermissionDenied: "Location permission deny ho gayi. Live sharing jari rakhne ke liye location allow karo.",
    locationTimeout: "Live location expected se zyada time le rahi hai. Hum background mein try karte rahenge.",
    locationWeak: "Live location signal abhi weak hai. Hum background mein try karte rahenge.",
    locationStarted: "Active deliveries ke liye live location sharing start ho gayi.",
    locationActive: "Aapki current deliveries ke liye live location sharing active hai.",
    finishSuccess: "Order {orderId} kamyabi se complete ho gaya.",
    finishFailed: "Abhi yeh order complete nahin ho saka.",
    startBeforeShare: "Live location share karne se pehle delivery start karo.",
    locationAlreadyActive: "Active deliveries ke liye live location pehle se update ho rahi hai.",
    profileMissing: "Aapki driver profile nahin mili. Admin se rabta karo.",
    dashboardConnected: "Dashboard connect ho gaya. Assigned orders real time mein update honge.",
    profileUnavailable: "Aapki driver profile abhi available nahin hai.",
    alreadyCollected: "Order {orderId} pehle hi collected hai.",
    notReadyForCollection: "Yeh order collection ke liye ready nahin hai.",
    collectedSuccess: "Order {orderId} collected mark ho gaya.",
    collectedFailed: "Abhi yeh order collected mark nahin ho saka.",
    openFailed: "Abhi dashboard open nahin ho saka."
  },
  order: {
    unknownCustomer: "Unknown customer",
    noItems: "Koi items listed nahin",
    unnamedItem: "Unnamed item",
    priority: "Priority",
    eventTime: "Event Time",
    rentalDays: "Rental Days",
    setupTime: "Setup Time",
    location: "Location",
    orderItems: "Order Items",
    noLocationYet: "Abhi location nahin hai",
    onTheWay: "On the Way",
    liveLocationOn: "Live location ON hai",
    liveLocationOnDesc: "Customer ab aapki movement dekh sakta hai",
    liveLocationOff: "Live location OFF hai",
    liveLocationOffDesc: "\"Share Live Location\" dabao taake customer aapko track kar sake",
    startDelivery: "Start Delivery",
    startingDelivery: "Delivery start ho rahi hai...",
    shareLiveLocation: "Share Live Location",
    sharingLiveLocation: "Live location share ho rahi hai",
    finishOrder: "Finish Order",
    finishingOrder: "Order finish ho raha hai...",
    deliveryCompleted: "Delivery complete ho gayi",
    itemsCollectedBack: "Items wapas collect ho gaye",
    cancelled: "Cancelled",
    completedPrefix: "Completed {date}",
    completedFallback: "Completed",
    callCustomer: "Customer ko call karo",
    sendWhatsApp: "WhatsApp par message bhejo",
    openMap: "Map kholo",
    whatsappMessage: "Hello {customerName}, main aapke order {orderId} ka driver hoon.",
    dateTbc: "Date baad mein confirm hogi"
  },
  priority: {
    normal: "Normal",
    urgent: "Urgent",
    vip: "VIP"
  },
  statuses: {
    unknown: "Unknown",
    confirmed: "Confirmed",
    preparing: "Preparing",
    "out-for-delivery": "Out for Delivery",
    delivered: "Delivered",
    collected: "Collected",
    cancelled: "Cancelled"
  },
  prompts: {
    finishConfirmTitle: "Kya aap waqai order {orderId} finish karna chahte ho?",
    finishConfirmBody: "Is se order {orderId} delivered mark ho jayega. Continue karna hai?"
  },
  scrollTop: {
    text: "Top",
    ariaLabel: "Upar wapas jao",
    title: "Back to top"
  },
  common: {
    driver: "Driver",
    customer: "Customer",
    notRecorded: "Record nahin hua",
    noLocationRecorded: "Location record nahin hui",
    na: "Maloom nahin"
  }
};

DRIVER_I18N.ur = {
  meta: {
    title: "ڈرائیور ڈیش بورڈ | التاج المالکی",
    logoAlt: "التاج المالکی کا لوگو"
  },
  brand: {
    subtitle: "لگژری ایونٹ سیٹ اپ اور رینٹل"
  },
  header: {
    logout: "لاگ آؤٹ"
  },
  language: {
    label: "زبان"
  },
  sidebar: {
    ariaLabel: "ڈرائیور ڈیش بورڈ نیویگیشن",
    quickNav: "فوری نیویگیشن",
    groupDriver: "ڈرائیور",
    groupSystem: "سسٹم",
    dashboard: "ڈیش بورڈ",
    activeOrders: "فعال آرڈرز",
    collection: "کلیکشن",
    completedOrders: "مکمل شدہ آرڈرز",
    support: "سپورٹ"
  },
  hero: {
    kicker: "ڈرائیور ڈیش بورڈ",
    greeting: "السلام علیکم، <span id=\"driverWelcomeName\">{name}</span>",
    summaryEmpty: "آپ کی تفویض کردہ ڈیلیوریز یہاں ریئل ٹائم میں ظاہر ہوں گی۔",
    summaryLabel: "آپریشنل خلاصہ",
    activeAssigned: "فعال تفویض",
    completedOverall: "کل مکمل",
    inDeliveryFlow: "ڈیلیوری میں جاری",
    activeDeliveries: "فعال ڈیلیوریز",
    locationSharingLabel: "لوکیشن شیئرنگ",
    noActiveDeliveries: "کوئی فعال ڈیلیوری نہیں",
    activeCountSummary: "{count} فعال ({orders})",
    locationOnShort: "آن",
    locationOffShort: "آف",
    activeNone: "فعال ڈیلیوریز: کوئی نہیں",
    activeSome: "فعال ڈیلیوریز: {orders}",
    locationOn: "لوکیشن شیئرنگ: آن",
    locationOff: "لوکیشن شیئرنگ: آف"
  },
  activeOrders: {
    kicker: "تفویض کردہ کام",
    title: "فعال آرڈرز",
    loadingTitle: "تفویض کردہ آرڈرز لوڈ ہو رہے ہیں...",
    loadingDesc: "براہ کرم انتظار کریں، آپ کا ڈیش بورڈ کنیکٹ ہو رہا ہے۔",
    emptyTitle: "اس وقت کوئی فعال آرڈر نہیں",
    emptyDesc: "نئی تفویض کردہ ڈیلیوریز یہاں خودکار طور پر نظر آئیں گی۔"
  },
  collection: {
    kicker: "رینٹل واپسی",
    title: "آرڈر کلیکٹ کریں",
    summary: "کسی بھی ڈیلیور شدہ آرڈر کا آئی ڈی درج کریں تاکہ رینٹل آئٹمز کو واپس کلیکٹ شدہ نشان زد کیا جا سکے۔",
    orderIdLabel: "آرڈر آئی ڈی",
    orderIdPlaceholder: "TAJ-1053-VC2",
    find: "آرڈر تلاش کریں",
    finding: "تلاش جاری ہے...",
    emptyTitle: "ڈیلیور شدہ آرڈر کلیکشن کے لیے تیار ہے",
    emptyDesc: "کسٹمر والا آرڈر آئی ڈی تلاش کریں، خلاصہ دیکھیں، اور کلیکشن کے بعد انوینٹری ریلیز کریں۔",
    lookupKicker: "کلیکشن تلاش",
    searchTitle: "آرڈر تلاش کیا جا رہا ہے",
    searchDesc: "{orderId} ابھی تلاش کیا جا رہا ہے۔",
    driverLoadingTitle: "ڈرائیور پروفائل ابھی لوڈ ہو رہی ہے",
    driverLoadingDesc: "براہ کرم تھوڑا انتظار کریں اور دوبارہ کوشش کریں۔",
    enterOrderTitle: "آرڈر آئی ڈی درج کریں",
    enterOrderDesc: "تلاش سے پہلے کسٹمر والا آرڈر آئی ڈی لکھیں۔",
    notFoundTitle: "آرڈر نہیں ملا",
    notFoundDesc: "اس آئی ڈی کا آرڈر نہیں ملا۔ براہ کرم آئی ڈی چیک کر کے دوبارہ کوشش کریں۔",
    lookupFailedTitle: "تلاش ناکام ہو گئی",
    lookupFailedDesc: "یہ آرڈر اس وقت لوڈ نہیں ہو سکا۔ براہ کرم دوبارہ کوشش کریں۔",
    readyTitle: "آرڈر کلیکشن کے لیے تیار ہے",
    readyDesc: "نیچے دیا گیا خلاصہ دیکھیں، پھر تصدیق کریں کہ رینٹل آئٹمز واپس کلیکٹ ہو چکی ہیں۔",
    alreadyCollectedTitle: "یہ آرڈر پہلے ہی کلیکٹ ہو چکا ہے",
    alreadyCollectedDesc: "یہ رینٹل آرڈر پہلے ہی واپس ہو چکا ہے اور انوینٹری ریلیز ہو چکی ہے۔",
    notReadyTitle: "یہ آرڈر کلیکشن کے لیے تیار نہیں",
    notReadyDesc: "صرف {requiredStatus} اسٹیٹس والے آرڈرز کلیکٹ کیے جا سکتے ہیں۔ موجودہ اسٹیٹس: {currentStatus}۔",
    itemsMarkedTitle: "آئٹمز کلیکٹ شدہ نشان زد ہو گئیں",
    itemsMarkedDesc: "یہ آرڈر کامیابی سے واپس ہو گیا ہے اور محفوظ انوینٹری اب ریلیز ہو چکی ہے۔",
    orderMissingTitle: "آرڈر اب موجود نہیں",
    orderMissingDesc: "یہ آرڈر مزید دستیاب نہیں ہے۔",
    updateFailedTitle: "کلیکشن اپ ڈیٹ ناکام ہو گئی",
    updateFailedDesc: "آرڈر اب بھی کلیکشن کے لیے اہل ہے، مگر اپ ڈیٹ مکمل نہیں ہو سکی۔ براہ کرم دوبارہ کوشش کریں۔",
    confirm: "آئٹمز کلیکٹ شدہ نشان زد کریں",
    confirming: "آئٹمز کلیکٹ شدہ نشان زد کی جا رہی ہیں...",
    openMap: "نقشہ کھولیں",
    fields: {
      orderId: "آرڈر آئی ڈی",
      customer: "کسٹمر",
      eventDate: "ایونٹ کی تاریخ",
      rentalDays: "رینٹل دن",
      pickupDate: "پک اپ تاریخ",
      pickupTime: "پک اپ وقت",
      eventLocation: "ایونٹ مقام",
      items: "اس آرڈر کی آئٹمز",
      deliveredBy: "ڈیلیور کیا گیا بذریعہ",
      deliveredAt: "ڈیلیور ہونے کا وقت",
      collectedBy: "کلیکٹ کیا گیا بذریعہ",
      collectedAt: "کلیکٹ ہونے کا وقت"
    }
  },
  completed: {
    kicker: "ڈیلیوری ہسٹری",
    title: "مکمل شدہ آرڈرز",
    summaryEmpty: "ڈیلیور اور کلیکٹ شدہ آرڈرز یہاں خودکار طور پر ظاہر ہوں گے۔",
    summaryWithCounts: "اس مہینے {monthCount} مکمل اور مجموعی طور پر {allCount} مکمل۔",
    range: "مدت",
    sort: "ترتیب",
    search: "تلاش",
    rangeMonth: "اس مہینے",
    rangeAll: "تمام وقت",
    sortRecent: "سب سے پہلے نئی",
    sortOldest: "سب سے پہلے پرانی",
    searchPlaceholder: "آرڈر آئی ڈی یا کسٹمر کا نام",
    initialEmptyTitle: "ابھی تک کوئی مکمل شدہ آرڈر نہیں",
    initialEmptyDesc: "ڈیلیور اور کلیکٹ شدہ آرڈرز خودکار طور پر یہاں منتقل ہو جائیں گے۔",
    emptyTitle: "کوئی مکمل شدہ آرڈر نہیں ملا",
    emptyDesc: "کوئی دوسرا فلٹر آزمائیں یا ڈیلیوری/کلیکشن مکمل کریں تاکہ وہ یہاں نظر آئے۔",
    previous: "پچھلا",
    next: "اگلا",
    pageInfo: "صفحہ {current} از {total}",
    completedDate: "مکمل ہونے کی تاریخ"
  },
  support: {
    icon: "کال",
    kicker: "مدد چاہیے",
    title: "سپورٹ",
    description: "ڈسپیچ یا تکنیکی مسئلے کے لیے براہ کرم MR Mohamad Daya سے رابطہ کریں۔"
  },
  statusBanner: {
    connecting: "آپ کے تفویض کردہ آرڈرز سے کنیکٹ ہو رہا ہے...",
    loadFailed: "اس وقت آپ کی ڈیلیوریز لوڈ نہیں ہو سکیں۔",
    startSuccess: "آرڈر {orderId} کی ڈیلیوری شروع ہو گئی ہے۔ اب آپ لائیو لوکیشن شیئر کر سکتے ہیں۔",
    startFailed: "اس وقت ڈیلیوری شروع نہیں ہو سکی۔",
    geolocationUnsupported: "اس ڈیوائس پر جیو لوکیشن سپورٹ دستیاب نہیں ہے۔",
    locationUpdateFailed: "لائیو لوکیشن اپ ڈیٹ نہیں ہو سکی۔ ہم بیک گراؤنڈ میں دوبارہ کوشش کرتے رہیں گے۔",
    locationPermissionDenied: "لوکیشن پرمیشن مسترد ہو گئی۔ لائیو شیئرنگ جاری رکھنے کے لیے لوکیشن کی اجازت دیں۔",
    locationTimeout: "لائیو لوکیشن متوقع وقت سے زیادہ لے رہی ہے۔ ہم بیک گراؤنڈ میں دوبارہ کوشش کرتے رہیں گے۔",
    locationWeak: "اس وقت لائیو لوکیشن کا سگنل کمزور ہے۔ ہم بیک گراؤنڈ میں دوبارہ کوشش کرتے رہیں گے۔",
    locationStarted: "فعال ڈیلیوریز کے لیے لائیو لوکیشن شیئرنگ شروع ہو گئی ہے۔",
    locationActive: "آپ کی موجودہ ڈیلیوریز کے لیے لائیو لوکیشن شیئرنگ فعال ہے۔",
    finishSuccess: "آرڈر {orderId} کامیابی سے مکمل ہو گیا۔",
    finishFailed: "اس وقت یہ آرڈر مکمل نہیں ہو سکا۔",
    startBeforeShare: "لائیو لوکیشن شیئر کرنے سے پہلے ڈیلیوری شروع کریں۔",
    locationAlreadyActive: "فعال ڈیلیوریز کے لیے لائیو لوکیشن پہلے ہی اپ ڈیٹ ہو رہی ہے۔",
    profileMissing: "آپ کی ڈرائیور پروفائل نہیں ملی۔ براہ کرم ایڈمن سے رابطہ کریں۔",
    dashboardConnected: "ڈیش بورڈ کنیکٹ ہو گیا۔ تفویض کردہ آرڈرز ریئل ٹائم میں اپ ڈیٹ ہوں گے۔",
    profileUnavailable: "آپ کی ڈرائیور پروفائل اس وقت دستیاب نہیں ہے۔",
    alreadyCollected: "آرڈر {orderId} پہلے ہی کلیکٹ ہو چکا ہے۔",
    notReadyForCollection: "یہ آرڈر کلیکشن کے لیے تیار نہیں ہے۔",
    collectedSuccess: "آرڈر {orderId} کلیکٹ شدہ نشان زد ہو گیا۔",
    collectedFailed: "اس وقت یہ آرڈر کلیکٹ شدہ نشان زد نہیں ہو سکا۔",
    openFailed: "اس وقت آپ کا ڈیش بورڈ نہیں کھل سکا۔"
  },
  order: {
    unknownCustomer: "نامعلوم کسٹمر",
    noItems: "کوئی آئٹمز درج نہیں ہیں",
    unnamedItem: "بغیر نام کی آئٹم",
    priority: "ترجیح",
    eventTime: "ایونٹ کا وقت",
    rentalDays: "رینٹل دن",
    setupTime: "سیٹ اپ وقت",
    location: "مقام",
    orderItems: "آرڈر آئٹمز",
    noLocationYet: "ابھی لوکیشن دستیاب نہیں",
    onTheWay: "راستے میں",
    liveLocationOn: "لائیو لوکیشن آن ہے",
    liveLocationOnDesc: "کسٹمر اب آپ کی حرکت دیکھ سکتا ہے",
    liveLocationOff: "لائیو لوکیشن آف ہے",
    liveLocationOffDesc: "کسٹمر کو آپ کی ٹریکنگ کے لیے \"Share Live Location\" دبائیں",
    startDelivery: "ڈیلیوری شروع کریں",
    startingDelivery: "ڈیلیوری شروع کی جا رہی ہے...",
    shareLiveLocation: "لائیو لوکیشن شیئر کریں",
    sharingLiveLocation: "لائیو لوکیشن شیئر ہو رہی ہے",
    finishOrder: "آرڈر مکمل کریں",
    finishingOrder: "آرڈر مکمل کیا جا رہا ہے...",
    deliveryCompleted: "ڈیلیوری مکمل ہو گئی",
    itemsCollectedBack: "آئٹمز واپس کلیکٹ ہو گئیں",
    cancelled: "منسوخ",
    completedPrefix: "{date} کو مکمل ہوا",
    completedFallback: "مکمل",
    callCustomer: "کسٹمر کو کال کریں",
    sendWhatsApp: "واٹس ایپ پر پیغام بھیجیں",
    openMap: "نقشہ کھولیں",
    whatsappMessage: "السلام علیکم {customerName}، میں آپ کے آرڈر {orderId} کا ڈرائیور ہوں۔",
    dateTbc: "تاریخ بعد میں طے ہوگی"
  },
  priority: {
    normal: "نارمل",
    urgent: "فوری",
    vip: "وی آئی پی"
  },
  statuses: {
    unknown: "نامعلوم",
    confirmed: "تصدیق شدہ",
    preparing: "تیاری میں",
    "out-for-delivery": "ڈیلیوری کے لیے روانہ",
    delivered: "ڈیلیور شدہ",
    collected: "کلیکٹ شدہ",
    cancelled: "منسوخ"
  },
  prompts: {
    finishConfirmTitle: "کیا آپ واقعی آرڈر {orderId} مکمل کرنا چاہتے ہیں؟",
    finishConfirmBody: "اس سے آرڈر {orderId} ڈیلیور شدہ نشان زد ہو جائے گا۔ کیا جاری رکھنا ہے؟"
  },
  scrollTop: {
    text: "اوپر",
    ariaLabel: "اوپر واپس جائیں",
    title: "اوپر جائیں"
  },
  common: {
    driver: "ڈرائیور",
    customer: "کسٹمر",
    notRecorded: "ریکارڈ نہیں ہوا",
    noLocationRecorded: "لوکیشن ریکارڈ نہیں ہوئی",
    na: "دستیاب نہیں"
  }
};

function initMobileMenu(){
  const menuBtn = document.querySelector(".mobile-menu-btn");
  const navLinks = document.querySelector(".nav-links");

  if(!menuBtn || !navLinks){
    return;
  }

  menuBtn.addEventListener("click", () => {
    navLinks.classList.toggle("active");
  });

  navLinks.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      navLinks.classList.remove("active");
    });
  });

  window.addEventListener("resize", () => {
    if(window.innerWidth > 760){
      navLinks.classList.remove("active");
    }
  });
}

function normalizeOrderStatusValue(status){
  return String(status || "").trim().toLowerCase().replace(/\s+/g, "-");
}

function normalizeOrderIdInput(value){
  return String(value || "").trim().replace(/\s+/g, "").toUpperCase();
}

function normalizeEmail(email){
  return String(email || "").trim().toLowerCase();
}

function escapeHtml(value){
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderActiveDeliveriesPill(orders = []){
  if(!activeDeliveryPill){
    return;
  }

  if(!orders.length){
    activeDeliveryPill.textContent = t("hero.noActiveDeliveries");
    return;
  }

  const orderList = orders
    .map((order) => order.orderId || order.id || t("common.na"))
    .join(", ");

  activeDeliveryPill.textContent = t("hero.activeCountSummary", {
    count: orders.length,
    orders: orderList
  });
}

function applyStaticTranslations(){
  document.documentElement.lang = getDriverHtmlLang();
  document.documentElement.dir = getDriverDirection();
  document.body?.setAttribute("dir", getDriverDirection());
  document.title = t("meta.title");

  if(driverLanguageSelect){
    driverLanguageSelect.value = currentDriverLanguage;
  }

  document.querySelectorAll("[data-i18n]").forEach((element) => {
    element.textContent = t(element.dataset.i18n);
  });

  document.querySelectorAll("[data-i18n-placeholder]").forEach((element) => {
    element.setAttribute("placeholder", t(element.dataset.i18nPlaceholder));
  });

  document.querySelectorAll("[data-i18n-title]").forEach((element) => {
    element.setAttribute("title", t(element.dataset.i18nTitle));
  });

  document.querySelectorAll("[data-i18n-aria-label]").forEach((element) => {
    element.setAttribute("aria-label", t(element.dataset.i18nAriaLabel));
  });

  document.querySelectorAll("[data-i18n-alt]").forEach((element) => {
    element.setAttribute("alt", t(element.dataset.i18nAlt));
  });
}

function setDashboardMessage(key, type = "info", params = {}){
  dashboardMessageState = {
    key,
    params,
    type
  };

  if(!driverDashboardStatus){
    return;
  }

  driverDashboardStatus.textContent = t(key, params);
  driverDashboardStatus.className = `driver-dashboard-message is-${type}`;
}

function formatStatusLabel(status){
  const normalizedStatus = normalizeOrderStatusValue(status) || "unknown";
  const translatedStatus = t(`statuses.${normalizedStatus}`);

  if(translatedStatus !== `statuses.${normalizedStatus}`){
    return translatedStatus;
  }

  return (status || "unknown")
    .replaceAll("-", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getDriverSummaryMarkup(activeCount, completedCount, liveCount){
  return `
    <div class="driver-summary-head">
      <span class="driver-summary-label">${escapeHtml(t("hero.summaryLabel"))}</span>
    </div>
    <div class="driver-summary-metrics">
      <span class="driver-summary-stat">
        <strong>${activeCount}</strong>
        <span>${escapeHtml(t("hero.activeAssigned"))}</span>
      </span>
      <span class="driver-summary-stat">
        <strong>${completedCount}</strong>
        <span>${escapeHtml(t("hero.completedOverall"))}</span>
      </span>
      <span class="driver-summary-stat">
        <strong>${liveCount}</strong>
        <span>${escapeHtml(t("hero.inDeliveryFlow"))}</span>
      </span>
    </div>
  `;
}

function isDriverActiveOrder(order){
  return order.status === "preparing" || order.status === "out-for-delivery";
}

function isCompletedOrder(order){
  return order.status === "delivered" || order.status === "collected";
}

function getPriorityValue(priority){
  const normalizedPriority = String(priority || "normal").toLowerCase().trim();

  if(normalizedPriority === "urgent" || normalizedPriority === "vip"){
    return normalizedPriority;
  }

  return "normal";
}

function getOrderRentalDays(order){
  const rentalDays = Number(order?.rentalDays ?? order?.latestQuoteRentalDays ?? DEFAULT_RENTAL_DAYS);
  return Number.isFinite(rentalDays) && rentalDays >= 1 ? Math.floor(rentalDays) : DEFAULT_RENTAL_DAYS;
}

function getOrderItemsMarkup(order){
  const items = Array.isArray(order?.items) ? order.items : [];

  if(!items.length){
    return `<li class="driver-order-items-empty">${escapeHtml(t("order.noItems"))}</li>`;
  }

  return items.map((item) => `
    <li>
      <span>${escapeHtml(item.name || t("order.unnamedItem"))}</span>
      <strong>x${Math.max(1, Number(item.quantity) || 1)}</strong>
    </li>
  `).join("");
}

function formatPriorityLabel(priority){
  return t(`priority.${getPriorityValue(priority)}`);
}

function getDriverMeta(driver){
  return {
    name: driver?.name || "Driver",
    phone: driver?.phone || "",
    email: driver?.email || "",
    uid: driver?.uid || ""
  };
}

function formatDateDisplay(value, fallback = t("common.na")){
  const rawValue = String(value || "").trim();

  if(!rawValue){
    return fallback;
  }

  const parsed = rawValue.includes("T")
    ? new Date(rawValue)
    : new Date(`${rawValue}T00:00:00`);

  if(Number.isNaN(parsed.getTime())){
    return rawValue;
  }

  return parsed.toLocaleDateString(getDriverLocale(), {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}

function formatTimeDisplay(value){
  const rawValue = String(value || "").trim();

  if(!rawValue){
    return "";
  }

  let hours = 0;
  let minutes = 0;
  let didParse = false;

  const twentyFourHourMatch = rawValue.match(/^(\d{1,2}):(\d{2})$/);
  const meridiemMatch = rawValue.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);

  if(meridiemMatch){
    hours = Number(meridiemMatch[1]);
    minutes = Number(meridiemMatch[2]);
    const meridiem = meridiemMatch[3].toUpperCase();

    if(meridiem === "PM" && hours !== 12){
      hours += 12;
    }

    if(meridiem === "AM" && hours === 12){
      hours = 0;
    }

    didParse = true;
  }else if(twentyFourHourMatch){
    hours = Number(twentyFourHourMatch[1]);
    minutes = Number(twentyFourHourMatch[2]);
    didParse = true;
  }

  if(!didParse || !Number.isFinite(hours) || !Number.isFinite(minutes)){
    return rawValue;
  }

  const formattedDate = new Date();
  formattedDate.setHours(hours, minutes, 0, 0);

  return formattedDate.toLocaleTimeString(getDriverLocale(), {
    hour: "numeric",
    minute: "2-digit"
  });
}

function formatDriverDateTime(value, fallback = t("common.notRecorded")){
  const timestamp = getTimestampValue(value);

  if(!timestamp){
    return fallback;
  }

  return new Date(timestamp).toLocaleString(getDriverLocale(), {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
}

function getDriverSidebarLinks(){
  return driverSidebarNav
    ? [...driverSidebarNav.querySelectorAll(".driver-sidebar-link[data-target]")]
    : [];
}

function setActiveDriverSidebarLink(targetId){
  getDriverSidebarLinks().forEach((link) => {
    const isActive = link.dataset.target === targetId;
    link.classList.toggle("is-active", isActive);
    link.setAttribute("aria-current", isActive ? "page" : "false");
  });
}

function getDriverSidebarOffset(){
  const header = document.querySelector(".site-header");
  return (header?.offsetHeight || 0) + 18;
}

function scrollToDriverSection(targetId){
  const targetSection = document.getElementById(targetId);

  if(!targetSection){
    return;
  }

  const top = window.scrollY + targetSection.getBoundingClientRect().top - getDriverSidebarOffset();
  window.scrollTo({
    top: Math.max(0, top),
    behavior: "smooth"
  });
}

function updateActiveDriverSidebarLink(){
  const links = getDriverSidebarLinks();

  if(!links.length){
    return;
  }

  const offset = getDriverSidebarOffset();
  const currentTargetId = links.reduce((activeId, link) => {
    const section = document.getElementById(link.dataset.target || "");

    if(!section){
      return activeId;
    }

    const sectionTop = section.getBoundingClientRect().top;
    return sectionTop - offset <= 28 ? (link.dataset.target || activeId) : activeId;
  }, links[0].dataset.target || "");

  if(currentTargetId){
    setActiveDriverSidebarLink(currentTargetId);
  }
}

function initDriverSidebarNavigation(){
  const links = getDriverSidebarLinks();

  if(!links.length){
    return;
  }

  links.forEach((link) => {
    link.addEventListener("click", (event) => {
      const targetId = link.dataset.target || "";

      if(!targetId){
        return;
      }

      event.preventDefault();
      scrollToDriverSection(targetId);
      setActiveDriverSidebarLink(targetId);
    });
  });

  window.addEventListener("scroll", updateActiveDriverSidebarLink, { passive: true });
  updateActiveDriverSidebarLink();
}

function getDeliveredByDisplay(order){
  const deliveredBy = order?.deliveredBy || order?.driver || null;

  if(!deliveredBy){
    return t("common.notRecorded");
  }

  return [deliveredBy.name, deliveredBy.phone || deliveredBy.email].filter(Boolean).join(" | ") || t("common.notRecorded");
}

function getCollectedByDisplay(order){
  const collectedBy = order?.collectedBy || null;

  if(!collectedBy){
    return t("common.notRecorded");
  }

  return [collectedBy.name, collectedBy.phone || collectedBy.email].filter(Boolean).join(" | ") || t("common.notRecorded");
}

function getPhoneForWhatsApp(phone){
  const digits = String(phone || "").replace(/\D/g, "");

  if(digits.startsWith("0")){
    return `971${digits.slice(1)}`;
  }

  return digits;
}

function getPhoneForCall(phone){
  const rawPhone = String(phone || "").trim();

  if(!rawPhone){
    return "";
  }

  if(rawPhone.startsWith("+")){
    return `+${rawPhone.slice(1).replace(/\D/g, "")}`;
  }

  return rawPhone.replace(/[^\d]/g, "");
}

function calculateDistanceInKm(start, end){
  if(!start || !end){
    return null;
  }

  const toRadians = (value) => value * (Math.PI / 180);
  const earthRadiusKm = 6371;
  const latDelta = toRadians(end.lat - start.lat);
  const lngDelta = toRadians(end.lng - start.lng);
  const startLat = toRadians(start.lat);
  const endLat = toRadians(end.lat);
  const a = Math.sin(latDelta / 2) ** 2 +
    Math.cos(startLat) * Math.cos(endLat) * Math.sin(lngDelta / 2) ** 2;

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function getMapUrl(order){
  const destinationLocation = getValidatedUaeCoordinates(getLocationCoordinates(order?.destinationLocation));

  if(destinationLocation){
    return buildGoogleMapsCoordinateLink(destinationLocation);
  }

  const mapLinkCoordinates = getValidatedUaeCoordinates(extractCoordinatesFromMapLink(order?.mapLink));

  if(mapLinkCoordinates){
    return buildGoogleMapsCoordinateLink(mapLinkCoordinates);
  }

  if(order.mapLink){
    return normalizeMapUrl(order.mapLink);
  }

  if(order?.collectionRequest?.locationLink){
    return normalizeMapUrl(order.collectionRequest.locationLink);
  }

  if(order.eventLocation){
    return `https://www.google.com/maps?q=${encodeURIComponent(order.eventLocation)}`;
  }

  return "#";
}

function getCustomerWhatsAppUrl(order){
  const phone = getPhoneForWhatsApp(order.phone);
  const message = t("order.whatsappMessage", {
    customerName: order.customerName || t("common.customer"),
    orderId: order.orderId || order.id || t("common.na")
  });

  return phone
    ? `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
    : "#";
}

function getCustomerCallUrl(order){
  const phone = getPhoneForCall(order.phone);

  return phone ? `tel:${phone}` : "#";
}

function getAssignedDriverMeta(order){
  const currentMeta = getDriverMeta(currentDriver);
  const orderDriver = order?.driver || {};

  return {
    name: currentMeta.name || orderDriver.name || "Driver",
    phone: currentMeta.phone || orderDriver.phone || "",
    email: currentMeta.email || orderDriver.email || "",
    uid: currentMeta.uid || orderDriver.uid || ""
  };
}

async function resolveDriverProfile(user){
  const email = normalizeEmail(user.email);
  const driverDocs = await getDocs(collection(db, "drivers"));
  const driverDoc = driverDocs.docs.find((docSnapshot) => {
    const driver = docSnapshot.data();
    return driver.uid === user.uid || normalizeEmail(driver.email) === email;
  }) || null;

  if(!driverDoc){
    return null;
  }

  const currentData = driverDoc.data();
  const nextData = {};

  if(email && currentData.email !== email){
    nextData.email = email;
  }

  if(currentData.uid !== user.uid){
    nextData.uid = user.uid;
  }

  if(Object.keys(nextData).length){
    await updateDoc(driverDoc.ref, nextData);
  }

  return {
    id: driverDoc.id,
    ...currentData,
    ...nextData
  };
}

async function backfillAssignedOrders(user, driverProfile){
  const email = normalizeEmail(driverProfile?.email || user.email);

  if(!email){
    return;
  }

  const assignedByEmail = await getDocs(
    query(collection(db, "orders"), where("driver.email", "==", email))
  );

  const driverMeta = getDriverMeta({
    name: driverProfile?.name || user.displayName || "Driver",
    phone: driverProfile?.phone || "",
    email,
    uid: user.uid
  });

  const updates = assignedByEmail.docs
    .filter((orderDoc) => {
      const orderDriver = orderDoc.data().driver || {};
      return (
        orderDriver.uid !== user.uid ||
        orderDriver.name !== driverMeta.name ||
        orderDriver.phone !== driverMeta.phone ||
        orderDriver.email !== driverMeta.email
      );
    })
    .map((orderDoc) => updateDoc(orderDoc.ref, { driver: driverMeta }));

  await Promise.all(updates);
}

function sortDriverOrders(orders){
  return [...orders].sort((first, second) => {
    const firstStatusRank = first.status === "out-for-delivery" ? 0 : first.status === "preparing" ? 1 : 2;
    const secondStatusRank = second.status === "out-for-delivery" ? 0 : second.status === "preparing" ? 1 : 2;

    if(firstStatusRank !== secondStatusRank){
      return firstStatusRank - secondStatusRank;
    }

    const firstTime = getOrderSortTime(first);
    const secondTime = getOrderSortTime(second);

    return firstTime - secondTime;
  });
}

function getOrderSortTime(order, fallback = Number.MAX_SAFE_INTEGER){
  const collectedTime = getTimestampValue(order.collectedAt);

  if(collectedTime){
    return collectedTime;
  }

  const deliveredTime = getTimestampValue(order.deliveredAt);

  if(deliveredTime){
    return deliveredTime;
  }

  const eventDateTime = getEventDateTimeValue(order);

  if(eventDateTime){
    return eventDateTime;
  }

  const createdAtTime = getTimestampValue(order.createdAt);
  return createdAtTime || fallback;
}

function getTimestampValue(value){
  if(!value){
    return 0;
  }

  if(typeof value.toDate === "function"){
    return value.toDate().getTime();
  }

  if(typeof value.seconds === "number"){
    return value.seconds * 1000;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? 0 : parsed.getTime();
}

function getEventDateTimeValue(order){
  if(!order?.eventDate){
    return 0;
  }

  const dateParts = String(order.eventDate).split("-").map(Number);

  if(dateParts.length !== 3 || dateParts.some((value) => Number.isNaN(value))){
    return 0;
  }

  const [year, month, day] = dateParts;
  const eventDate = new Date(year, month - 1, day);

  if(order.eventTime){
    const timeMatch = String(order.eventTime).trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);

    if(timeMatch){
      let hours = Number(timeMatch[1]);
      const minutes = Number(timeMatch[2]);
      const meridiem = timeMatch[3].toUpperCase();

      if(meridiem === "PM" && hours !== 12){
        hours += 12;
      }

      if(meridiem === "AM" && hours === 12){
        hours = 0;
      }

      eventDate.setHours(hours, minutes, 0, 0);
    }
  }

  return Number.isNaN(eventDate.getTime()) ? 0 : eventDate.getTime();
}

function getCompletedOrdersRangeValue(order){
  return getTimestampValue(order.collectedAt) || getTimestampValue(order.deliveredAt) || getEventDateTimeValue(order) || getTimestampValue(order.createdAt);
}

function isOrderInCurrentMonth(order){
  const orderTime = getCompletedOrdersRangeValue(order);

  if(!orderTime){
    return false;
  }

  const orderDate = new Date(orderTime);
  const now = new Date();

  return orderDate.getFullYear() === now.getFullYear() && orderDate.getMonth() === now.getMonth();
}

function getCompletedOrders(){
  const searchValue = completedSearchInput?.value.trim().toLowerCase() || "";
  const rangeValue = completedRangeFilter?.value || "month";
  const sortValue = completedSortFilter?.value || "recent";

  let completedOrders = currentOrders.filter(isCompletedOrder);

  if(rangeValue === "month"){
    completedOrders = completedOrders.filter(isOrderInCurrentMonth);
  }

  if(searchValue){
    completedOrders = completedOrders.filter((order) =>
      String(order.orderId || "").toLowerCase().includes(searchValue) ||
      String(order.customerName || "").toLowerCase().includes(searchValue)
    );
  }

  completedOrders = [...completedOrders].sort((first, second) => {
    const firstTime = getCompletedOrdersRangeValue(first);
    const secondTime = getCompletedOrdersRangeValue(second);
    return sortValue === "oldest" ? firstTime - secondTime : secondTime - firstTime;
  });

  return completedOrders;
}

function syncCollectionControls(){
  if(driverCollectionOrderIdInput){
    driverCollectionOrderIdInput.disabled = isFindingCollectionOrder || isMarkingCollected;
  }

  if(driverCollectionFindBtn){
    driverCollectionFindBtn.disabled = isFindingCollectionOrder || isMarkingCollected || !currentDriver;
    driverCollectionFindBtn.textContent = isFindingCollectionOrder ? t("collection.finding") : t("collection.find");
  }

  const confirmButton = document.getElementById("driverCollectionConfirmBtn");

  if(confirmButton){
    confirmButton.disabled = isMarkingCollected;
    confirmButton.textContent = isMarkingCollected ? t("collection.confirming") : t("collection.confirm");
  }
}

function renderCollectionState(markup){
  if(!driverCollectionResult){
    return;
  }

  driverCollectionResult.innerHTML = markup;
  document.getElementById("driverCollectionConfirmBtn")?.addEventListener("click", handleMarkItemsCollected);
  syncCollectionControls();
}

function renderActiveCollectionState(){
  if(collectionRenderState.view === "message"){
    renderCollectionState(`
      <article class="driver-collection-state is-${collectionRenderState.tone}">
        <strong>${escapeHtml(t(collectionRenderState.titleKey, collectionRenderState.titleParams || {}))}</strong>
        <p>${escapeHtml(t(collectionRenderState.descriptionKey, collectionRenderState.descriptionParams || {}))}</p>
      </article>
    `);
    return;
  }

  if(collectionRenderState.view === "order"){
    const { order, options = {} } = collectionRenderState;
    const normalizedStatus = normalizeOrderStatusValue(order?.status);
    const isDeliveredOrder = normalizedStatus === "delivered";
    const isCollectedOrder = normalizedStatus === "collected";
    const mapUrl = getMapUrl(order);
    const hasMapUrl = mapUrl !== "#";
    const tone = options.tone || (isDeliveredOrder ? "ready" : isCollectedOrder ? "success" : "warning");
    const titleKey = options.titleKey || (
      isDeliveredOrder
        ? "collection.readyTitle"
        : isCollectedOrder
          ? "collection.alreadyCollectedTitle"
          : "collection.notReadyTitle"
    );
    const descriptionKey = options.descriptionKey || (
      isDeliveredOrder
        ? "collection.readyDesc"
        : isCollectedOrder
          ? "collection.alreadyCollectedDesc"
          : "collection.notReadyDesc"
    );
    const descriptionParams = options.descriptionParams || (
      isDeliveredOrder || isCollectedOrder
        ? {}
        : {
          requiredStatus: formatStatusLabel("delivered"),
          currentStatus: formatStatusLabel(order.status)
        }
    );

    renderCollectionState(`
      <article class="driver-collection-state is-${tone}">
        <div class="driver-collection-state-head">
          <div>
            <span class="driver-order-kicker">${escapeHtml(t("collection.lookupKicker"))}</span>
            <h3>${escapeHtml(t(titleKey, options.titleParams || {}))}</h3>
            <p>${escapeHtml(t(descriptionKey, descriptionParams))}</p>
          </div>
          <span class="driver-order-badge is-${escapeHtml(normalizedStatus || "unknown")}">
            ${escapeHtml(formatStatusLabel(order.status))}
          </span>
        </div>
        ${getCollectionSummaryMarkup(order)}
        ${isDeliveredOrder ? `
          <div class="driver-collection-actions">
            <a class="btn btn-secondary driver-action-link ${hasMapUrl ? "" : "is-disabled"}" href="${hasMapUrl ? mapUrl : "#"}" target="_blank" rel="noreferrer">
              ${escapeHtml(t("collection.openMap"))}
            </a>
            <button id="driverCollectionConfirmBtn" class="btn btn-primary" type="button">
              ${escapeHtml(t("collection.confirm"))}
            </button>
          </div>
        ` : ""}
      </article>
    `);
    return;
  }

  renderCollectionState(`
    <article class="driver-collection-state is-empty">
      <strong>${escapeHtml(t("collection.emptyTitle"))}</strong>
      <p>${escapeHtml(t("collection.emptyDesc"))}</p>
    </article>
  `);
}

function renderCollectionEmptyState(){
  currentCollectionLookupOrder = null;
  collectionRenderState = {
    view: "empty"
  };
  renderActiveCollectionState();
}

function getCollectionPickupDateLabel(order){
  return String(order?.collectionRequest?.pickupDateLabel || "").trim() || formatDateDisplay(order?.collectionRequest?.pickupDate, "");
}

function getCollectionPickupTimeLabel(order){
  return String(order?.collectionRequest?.pickupTimeLabel || "").trim() || formatTimeDisplay(order?.collectionRequest?.pickupTime);
}

function getCollectionSummaryMarkup(order){
  const pickupDateLabel = getCollectionPickupDateLabel(order);
  const pickupTimeLabel = getCollectionPickupTimeLabel(order);
  const eventDateLabel = formatDateDisplay(order.eventDate, t("common.na"));

  return `
    <div class="driver-collection-summary-grid">
      <div>
        <span>${escapeHtml(t("collection.fields.orderId"))}</span>
        <strong>${escapeHtml(order.orderId || order.id || t("common.na"))}</strong>
      </div>
      <div>
        <span>${escapeHtml(t("collection.fields.customer"))}</span>
        <strong>${escapeHtml(order.customerName || t("order.unknownCustomer"))}</strong>
      </div>
      <div>
        <span>${escapeHtml(t("collection.fields.eventDate"))}</span>
        <strong>${escapeHtml(eventDateLabel)}</strong>
      </div>
      <div>
        <span>${escapeHtml(t("collection.fields.rentalDays"))}</span>
        <strong>${getOrderRentalDays(order)}</strong>
      </div>
      ${pickupDateLabel ? `
        <div>
          <span>${escapeHtml(t("collection.fields.pickupDate"))}</span>
          <strong>${escapeHtml(pickupDateLabel)}</strong>
        </div>
      ` : ""}
      ${pickupTimeLabel ? `
        <div>
          <span>${escapeHtml(t("collection.fields.pickupTime"))}</span>
          <strong>${escapeHtml(pickupTimeLabel)}</strong>
        </div>
      ` : ""}
      <div class="is-wide">
        <span>${escapeHtml(t("collection.fields.eventLocation"))}</span>
        <strong>${escapeHtml(order.eventLocation || t("common.noLocationRecorded"))}</strong>
      </div>
    </div>
    <div class="driver-order-items driver-collection-items">
      <span>${escapeHtml(t("collection.fields.items"))}</span>
      <ul class="driver-order-items-list">
        ${getOrderItemsMarkup(order)}
      </ul>
    </div>
    <div class="driver-collection-summary-grid driver-collection-history-grid">
      <div>
        <span>${escapeHtml(t("collection.fields.deliveredBy"))}</span>
        <strong>${escapeHtml(getDeliveredByDisplay(order))}</strong>
      </div>
      <div>
        <span>${escapeHtml(t("collection.fields.deliveredAt"))}</span>
        <strong>${escapeHtml(formatDriverDateTime(order.deliveredAt))}</strong>
      </div>
      ${normalizeOrderStatusValue(order.status) === "collected" ? `
        <div>
          <span>${escapeHtml(t("collection.fields.collectedBy"))}</span>
          <strong>${escapeHtml(getCollectedByDisplay(order))}</strong>
        </div>
        <div>
          <span>${escapeHtml(t("collection.fields.collectedAt"))}</span>
          <strong>${escapeHtml(formatDriverDateTime(order.collectedAt))}</strong>
        </div>
      ` : ""}
    </div>
  `;
}

function renderCollectionLookupOrder(order, options = {}){
  currentCollectionLookupOrder = order;
  collectionRenderState = {
    view: "order",
    order,
    options
  };
  renderActiveCollectionState();
}

function renderCollectionLookupMessage(tone, titleKey, descriptionKey, params = {}){
  currentCollectionLookupOrder = null;
  collectionRenderState = {
    view: "message",
    tone,
    titleKey,
    descriptionKey,
    descriptionParams: params
  };
  renderActiveCollectionState();
}

async function findOrderByLookupId(orderIdValue){
  const rawValue = String(orderIdValue || "").trim();
  const normalizedValue = normalizeOrderIdInput(orderIdValue);
  const directCandidates = [...new Set([
    rawValue,
    normalizedValue,
    rawValue.toLowerCase(),
    normalizedValue.toLowerCase()
  ].filter(Boolean))];

  for(const candidate of directCandidates){
    const snapshot = await getDoc(doc(db, "orders", candidate));

    if(snapshot.exists()){
      return {
        id: snapshot.id,
        ...snapshot.data()
      };
    }
  }

  const orderIdCandidates = [...new Set([
    rawValue,
    normalizedValue,
    rawValue.toLowerCase(),
    normalizedValue.toLowerCase()
  ].filter(Boolean))];

  for(const candidate of orderIdCandidates){
    const snapshot = await getDocs(query(collection(db, "orders"), where("orderId", "==", candidate)));

    if(!snapshot.empty){
      return {
        id: snapshot.docs[0].id,
        ...snapshot.docs[0].data()
      };
    }
  }

  return null;
}

async function handleCollectionLookup(event){
  event.preventDefault();

  if(isFindingCollectionOrder || isMarkingCollected){
    return;
  }

  if(!currentDriver){
    renderCollectionLookupMessage("warning", "collection.driverLoadingTitle", "collection.driverLoadingDesc");
    return;
  }

  const enteredOrderId = driverCollectionOrderIdInput?.value || "";
  const normalizedOrderId = normalizeOrderIdInput(enteredOrderId);

  if(!normalizedOrderId){
    renderCollectionLookupMessage("error", "collection.enterOrderTitle", "collection.enterOrderDesc");
    driverCollectionOrderIdInput?.focus();
    return;
  }

  isFindingCollectionOrder = true;
  currentCollectionLookupOrder = null;
  renderCollectionLookupMessage("info", "collection.searchTitle", "collection.searchDesc", {
    orderId: normalizedOrderId
  });
  syncCollectionControls();

  try{
    const order = await findOrderByLookupId(enteredOrderId);

    if(!order){
      renderCollectionLookupMessage("error", "collection.notFoundTitle", "collection.notFoundDesc");
      return;
    }

    currentCollectionLookupOrder = order;
    renderCollectionLookupOrder(order);
  }catch(error){
    console.error("Failed to find collection order:", error);
    renderCollectionLookupMessage("error", "collection.lookupFailedTitle", "collection.lookupFailedDesc");
  }finally{
    isFindingCollectionOrder = false;
    syncCollectionControls();
  }
}

async function handleMarkItemsCollected(){
  if(!currentCollectionLookupOrder || isMarkingCollected){
    return;
  }

  if(!currentDriver){
    setDashboardMessage("statusBanner.profileUnavailable", "error");
    return;
  }

  isMarkingCollected = true;
  syncCollectionControls();

  try{
    const orderRef = doc(db, "orders", currentCollectionLookupOrder.id);
    const latestSnapshot = await getDoc(orderRef);

    if(!latestSnapshot.exists()){
      renderCollectionLookupMessage("error", "collection.orderMissingTitle", "collection.orderMissingDesc");
      return;
    }

    const latestOrder = {
      id: latestSnapshot.id,
      ...latestSnapshot.data()
    };
    const latestStatus = normalizeOrderStatusValue(latestOrder.status);

    if(latestStatus === "collected"){
      currentCollectionLookupOrder = latestOrder;
      renderCollectionLookupOrder(latestOrder);
      setDashboardMessage("statusBanner.alreadyCollected", "warning", {
        orderId: latestOrder.orderId || latestOrder.id
      });
      return;
    }

    if(latestStatus !== "delivered"){
      currentCollectionLookupOrder = latestOrder;
      renderCollectionLookupOrder(latestOrder);
      setDashboardMessage("statusBanner.notReadyForCollection", "warning");
      return;
    }

    const collectedBy = getDriverMeta(currentDriver);

    // Preserve the original delivery assignment/details and only append the return metadata.
    await updateDoc(orderRef, {
      status: "collected",
      collectedAt: serverTimestamp(),
      collectedBy
    });

    currentCollectionLookupOrder = {
      ...latestOrder,
      status: "collected",
      collectedAt: new Date(),
      collectedBy
    };

    renderCollectionLookupOrder(currentCollectionLookupOrder, {
      tone: "success",
      titleKey: "collection.itemsMarkedTitle",
      descriptionKey: "collection.itemsMarkedDesc"
    });
    setDashboardMessage("statusBanner.collectedSuccess", "success", {
      orderId: currentCollectionLookupOrder.orderId || currentCollectionLookupOrder.id
    });
  }catch(error){
    console.error("Failed to mark order as collected:", error);
    setDashboardMessage("statusBanner.collectedFailed", "error");

    if(currentCollectionLookupOrder){
      renderCollectionLookupOrder(currentCollectionLookupOrder, {
        tone: "warning",
        titleKey: "collection.updateFailedTitle",
        descriptionKey: "collection.updateFailedDesc"
      });
    }else{
      renderCollectionLookupMessage("error", "collection.updateFailedTitle", "collection.lookupFailedDesc");
    }
  }finally{
    isMarkingCollected = false;
    syncCollectionControls();
  }
}

function getCompletedOrdersPagination(totalOrders){
  const totalPages = Math.max(1, Math.ceil(totalOrders / COMPLETED_ORDERS_PER_PAGE));
  completedOrdersPage = Math.min(completedOrdersPage, totalPages);

  return {
    totalPages,
    currentPage: completedOrdersPage,
    startIndex: (completedOrdersPage - 1) * COMPLETED_ORDERS_PER_PAGE,
    endIndex: completedOrdersPage * COMPLETED_ORDERS_PER_PAGE
  };
}

function syncCompletedOrdersPagination(totalOrders){
  if(!driverCompletedPagination || !driverCompletedPageInfo || !driverCompletedPrevBtn || !driverCompletedNextBtn){
    return;
  }

  if(!totalOrders){
    driverCompletedPagination.style.display = "none";
    driverCompletedPageInfo.textContent = t("completed.pageInfo", {
      current: 1,
      total: 1
    });
    driverCompletedPrevBtn.disabled = true;
    driverCompletedNextBtn.disabled = true;
    return;
  }

  const { totalPages, currentPage } = getCompletedOrdersPagination(totalOrders);
  driverCompletedPagination.style.display = totalPages > 1 ? "flex" : "none";
  driverCompletedPageInfo.textContent = t("completed.pageInfo", {
    current: currentPage,
    total: totalPages
  });
  driverCompletedPrevBtn.disabled = currentPage <= 1;
  driverCompletedNextBtn.disabled = currentPage >= totalPages;
}

function getActiveOrders(){
  return sortDriverOrders(currentOrders.filter((order) => !isCompletedOrder(order) && order.status !== "cancelled"));
}

function getLiveDeliveryOrders(orders = currentOrders){
  return sortDriverOrders(
    orders.filter((order) => order.status === "out-for-delivery" && !finishingOrderIds.has(order.id))
  );
}

function isAnyLocationSharingActive(orders = currentOrders){
  return locationWatchId !== null && getLiveDeliveryOrders(orders).length > 0;
}

function isOrderLocationSharingActive(order){
  return order?.status === "out-for-delivery" && !finishingOrderIds.has(order.id) && isAnyLocationSharingActive();
}

function getActionBlock(order, options){
  const isStarting = startingOrderIds.has(order.id);
  const isOutForDelivery = order.status === "out-for-delivery";
  const isDelivered = order.status === "delivered";
  const isCollected = order.status === "collected";
  const isCancelled = order.status === "cancelled";
  const isClosed = isDelivered || isCollected || isCancelled;
  const isFinishing = finishingOrderIds.has(order.id);
  const isSharingLocation = isOrderLocationSharingActive(order);
  const needsLocationWarning = isOutForDelivery && !isSharingLocation;
  const mapActionClass = isClosed ? "is-disabled" : "";
  const customerPhoneAvailable = Boolean(getPhoneForCall(order.phone));
  const contactActionClass = customerPhoneAvailable ? "" : "is-disabled";
  const isCompletedCard = options.variant === "completed";

  let statusAction = "";
  let primaryActions = "";
  let locationStateBlock = "";

  if(order.status === "preparing" && isStarting){
    statusAction = `
      <button class="btn btn-secondary driver-disabled-btn" type="button" disabled>
        ${escapeHtml(t("order.startingDelivery"))}
      </button>
    `;
  }else if(order.status === "preparing"){
    primaryActions = `
      <button class="btn btn-primary start-delivery-btn" data-id="${order.id}" type="button">
        ${escapeHtml(t("order.startDelivery"))}
      </button>
    `;
  }else if(isOutForDelivery){
    statusAction = `
      <div class="driver-live-state">
        <span class="driver-live-dot"></span>
        <strong>${escapeHtml(t("order.onTheWay"))}</strong>
      </div>
    `;
    locationStateBlock = isSharingLocation ? `
      <div class="driver-location-state is-on">
        <strong>${escapeHtml(t("order.liveLocationOn"))}</strong>
        <p>${escapeHtml(t("order.liveLocationOnDesc"))}</p>
      </div>
    ` : `
      <div class="driver-location-warning" role="alert">
        <strong>${escapeHtml(t("order.liveLocationOff"))}</strong>
        <p>${escapeHtml(t("order.liveLocationOffDesc"))}</p>
      </div>
    `;
    primaryActions = `
      <button class="btn btn-secondary share-location-btn ${needsLocationWarning ? "is-highlighted" : ""}" data-id="${order.id}" type="button">
        ${escapeHtml(isSharingLocation ? t("order.sharingLiveLocation") : t("order.shareLiveLocation"))}
      </button>
      <button class="btn btn-primary finish-order-btn" data-id="${order.id}" type="button" ${isFinishing ? "disabled" : ""}>
        ${escapeHtml(isFinishing ? t("order.finishingOrder") : t("order.finishOrder"))}
      </button>
    `;
  }else if(isDelivered){
    statusAction = `
      <div class="driver-completed-state">
        <strong>${escapeHtml(t("order.deliveryCompleted"))}</strong>
        <span>${escapeHtml(formatCompletedDateLabel(order))}</span>
      </div>
    `;
  }else if(isCollected){
    statusAction = `
      <div class="driver-completed-state">
        <strong>${escapeHtml(t("order.itemsCollectedBack"))}</strong>
        <span>${escapeHtml(formatCompletedDateLabel(order))}</span>
      </div>
    `;
  }else if(isCancelled){
    statusAction = `
      <button class="btn btn-secondary driver-disabled-btn" type="button" disabled>
        ${escapeHtml(t("order.cancelled"))}
      </button>
    `;
  }

  return `
    <div class="driver-order-actions ${isCompletedCard ? "is-completed-card" : ""}">
      <div class="driver-action-row driver-action-row-secondary driver-action-row-contact">
        <a class="btn btn-secondary driver-action-link ${mapActionClass}" href="${isClosed ? "#" : getMapUrl(order)}" target="_blank" rel="noreferrer">
          ${escapeHtml(t("order.openMap"))}
        </a>
        <a class="btn btn-secondary driver-action-link ${contactActionClass}" href="${customerPhoneAvailable ? getCustomerCallUrl(order) : "#"}">
          ${escapeHtml(t("order.callCustomer"))}
        </a>
        <a class="btn btn-secondary driver-action-link ${contactActionClass}" href="${customerPhoneAvailable ? getCustomerWhatsAppUrl(order) : "#"}" target="_blank" rel="noreferrer">
          ${escapeHtml(t("order.sendWhatsApp"))}
        </a>
      </div>
      ${statusAction ? `
        <div class="driver-action-row driver-action-row-status">
          ${statusAction}
        </div>
      ` : ""}
      ${locationStateBlock ? `
        <div class="driver-action-row driver-action-row-status">
          ${locationStateBlock}
        </div>
      ` : ""}
      ${primaryActions ? `
        <div class="driver-action-row driver-action-row-primary">
          ${primaryActions}
        </div>
      ` : ""}
    </div>
  `;
}

function getCompletedDateDisplay(order, fallback = t("common.notRecorded")){
  const completedTime = getCompletedOrdersRangeValue(order);

  if(!completedTime){
    return fallback;
  }

  return new Date(completedTime).toLocaleDateString(getDriverLocale(), {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}

function formatCompletedDateLabel(order){
  const completedDate = getCompletedDateDisplay(order, "");

  if(!completedDate){
    return t("order.completedFallback");
  }

  return t("order.completedPrefix", {
    date: completedDate
  });
}

function renderCompletedOrderCard(order){
  const priority = getPriorityValue(order.priority);
  const normalizedStatus = normalizeOrderStatusValue(order.status) || "unknown";

  return `
    <article class="driver-order-card is-completed-card">
      <div class="driver-order-top">
        <div>
          <span class="driver-order-kicker">${escapeHtml(order.orderId || order.id || t("common.na"))}</span>
          <h3>${escapeHtml(order.customerName || t("order.unknownCustomer"))}</h3>
        </div>
        <span class="driver-order-badge is-${escapeHtml(normalizedStatus)}">
          ${escapeHtml(formatStatusLabel(order.status))}
        </span>
      </div>

      <div class="driver-order-priority">
        <span>${escapeHtml(t("order.priority"))}</span>
        <strong class="driver-priority-badge is-${priority}">${escapeHtml(formatPriorityLabel(priority))}</strong>
      </div>

      <div class="driver-completed-meta">
        <span>${escapeHtml(t("completed.completedDate"))}</span>
        <strong>${escapeHtml(getCompletedDateDisplay(order))}</strong>
      </div>
    </article>
  `;
}

function renderOrderCard(order, options = {}){
  const isActive = order.status === "out-for-delivery" || startingOrderIds.has(order.id);
  const isCompletedCard = options.variant === "completed";
  const priority = getPriorityValue(order.priority);
  const eventDateLabel = formatDateDisplay(order.eventDate, t("order.dateTbc"));
  const eventTimeLabel = formatTimeDisplay(order.eventTime);

  if(isCompletedCard){
    return renderCompletedOrderCard(order);
  }

  return `
    <article class="driver-order-card ${isActive ? "is-active" : ""} ${isCompletedCard ? "is-completed-card" : ""}">
      <div class="driver-order-top">
        <div>
          <span class="driver-order-kicker">${escapeHtml(order.orderId || order.id || t("common.na"))}</span>
          <h3>${escapeHtml(order.customerName || t("order.unknownCustomer"))}</h3>
        </div>
        <span class="driver-order-badge is-${String(order.status || "unknown").replaceAll(" ", "-")}">
          ${escapeHtml(formatStatusLabel(order.status))}
        </span>
      </div>

      <div class="driver-order-priority">
        <span>${escapeHtml(t("order.priority"))}</span>
        <strong class="driver-priority-badge is-${priority}">${escapeHtml(formatPriorityLabel(priority))}</strong>
      </div>

      <div class="driver-order-meta">
        <div>
          <span>${escapeHtml(t("order.eventTime"))}</span>
          <strong>${escapeHtml(eventTimeLabel ? `${eventDateLabel} - ${eventTimeLabel}` : eventDateLabel)}</strong>
        </div>
        <div>
          <span>${escapeHtml(t("order.rentalDays"))}</span>
          <strong>${getOrderRentalDays(order)}</strong>
        </div>
        <div>
          <span>${escapeHtml(t("order.setupTime"))}</span>
          <strong>${escapeHtml(formatTimeDisplay(order.setupTime) || order.setupTime || t("common.na"))}</strong>
        </div>
        <div>
          <span>${escapeHtml(t("order.location"))}</span>
          <strong>${escapeHtml(order.eventLocation || t("order.noLocationYet"))}</strong>
        </div>
      </div>

      <div class="driver-order-items">
        <span>${escapeHtml(t("order.orderItems"))}</span>
        <ul class="driver-order-items-list">
          ${getOrderItemsMarkup(order)}
        </ul>
      </div>

      ${getActionBlock(order, options)}
    </article>
  `;
}

function renderDriverOrders(orders){
  if(!driverOrdersGrid){
    return;
  }

  if(!orders.length){
    driverOrdersGrid.innerHTML = `
      <article class="driver-empty-state">
        <strong>${escapeHtml(t("activeOrders.emptyTitle"))}</strong>
        <p>${escapeHtml(t("activeOrders.emptyDesc"))}</p>
      </article>
    `;
    return;
  }

  driverOrdersGrid.innerHTML = orders.map((order) => renderOrderCard(order)).join("");

  attachOrderActions();
}

function renderCompletedOrders(orders){
  if(!driverCompletedOrdersGrid){
    return;
  }

  if(!orders.length){
    completedOrdersPage = 1;
    driverCompletedOrdersGrid.innerHTML = `
      <article class="driver-empty-state is-soft">
        <strong>${escapeHtml(t("completed.emptyTitle"))}</strong>
        <p>${escapeHtml(t("completed.emptyDesc"))}</p>
      </article>
    `;
    syncCompletedOrdersPagination(0);
    return;
  }

  const { startIndex, endIndex } = getCompletedOrdersPagination(orders.length);
  const paginatedOrders = orders.slice(startIndex, endIndex);

  driverCompletedOrdersGrid.innerHTML = paginatedOrders.map((order) => renderOrderCard(order, {
    variant: "completed"
  })).join("");
  syncCompletedOrdersPagination(orders.length);
}

function attachOrderActions(){
  document.querySelectorAll(".start-delivery-btn").forEach((button) => {
    button.addEventListener("click", async () => {
      await startDelivery(button.dataset.id);
    });
  });

  document.querySelectorAll(".share-location-btn").forEach((button) => {
    button.addEventListener("click", () => {
      startLocationSharing(button.dataset.id);
    });
  });

  document.querySelectorAll(".finish-order-btn").forEach((button) => {
    button.addEventListener("click", async () => {
      await finishOrder(button.dataset.id);
    });
  });
}

function updateDashboardSummary(){
  const activeOrders = getActiveOrders();
  const completedOrders = currentOrders.filter(isCompletedOrder);
  const completedOrdersInMonth = completedOrders.filter(isOrderInCurrentMonth);

  if(driverWelcomeTitle){
    driverWelcomeTitle.innerHTML = t("hero.greeting", {
      name: escapeHtml(currentDriver?.name || t("common.driver"))
    });
  }

  if(driverSummaryText){
    const liveDeliveryCount = getLiveDeliveryOrders().length;
    driverSummaryText.innerHTML = currentOrders.length
      ? getDriverSummaryMarkup(activeOrders.length, completedOrders.length, liveDeliveryCount)
      : `<span class="driver-summary-empty">${escapeHtml(t("hero.summaryEmpty"))}</span>`;
  }

  if(driverCompletedOrdersSummary){
    driverCompletedOrdersSummary.textContent = completedOrders.length
      ? t("completed.summaryWithCounts", {
        monthCount: completedOrdersInMonth.length,
        allCount: completedOrders.length
      })
      : t("completed.summaryEmpty");
  }

  renderActiveDeliveriesPill(getLiveDeliveryOrders());

  if(locationSharingPill){
    const liveOrderCount = getLiveDeliveryOrders().length;
    const isSharingActive = isAnyLocationSharingActive();
    locationSharingPill.textContent = isSharingActive
      ? t("hero.locationOnShort")
      : t("hero.locationOffShort");
    locationSharingPill.classList.toggle("on", isSharingActive);
    locationSharingPill.classList.toggle("off", !isSharingActive || !liveOrderCount);
  }
}

function renderDriverPreHydrationState(){
  if(driverWelcomeTitle){
    driverWelcomeTitle.innerHTML = t("hero.greeting", {
      name: escapeHtml(currentDriver?.name || t("common.driver"))
    });
  }

  if(driverSummaryText){
    driverSummaryText.innerHTML = `<span class="driver-summary-empty">${escapeHtml(t("hero.summaryEmpty"))}</span>`;
  }

  renderActiveDeliveriesPill();

  if(locationSharingPill){
    locationSharingPill.textContent = t("hero.locationOffShort");
    locationSharingPill.classList.remove("on");
    locationSharingPill.classList.add("off");
  }

  if(driverOrdersGrid){
    driverOrdersGrid.innerHTML = `
      <article class="driver-empty-state">
        <strong>${escapeHtml(t("activeOrders.loadingTitle"))}</strong>
        <p>${escapeHtml(t("activeOrders.loadingDesc"))}</p>
      </article>
    `;
  }

  if(driverCompletedOrdersSummary){
    driverCompletedOrdersSummary.textContent = t("completed.summaryEmpty");
  }

  if(driverCompletedOrdersGrid){
    driverCompletedOrdersGrid.innerHTML = `
      <article class="driver-empty-state is-soft">
        <strong>${escapeHtml(t("completed.initialEmptyTitle"))}</strong>
        <p>${escapeHtml(t("completed.initialEmptyDesc"))}</p>
      </article>
    `;
  }

  syncCompletedOrdersPagination(0);
}

function syncLiveDeliveryState(orders){
  const liveOrderIds = new Set(
    orders
      .filter((order) => order.status === "out-for-delivery")
      .map((order) => order.id)
  );

  startingOrderIds = new Set(
    [...startingOrderIds].filter((orderId) => !liveOrderIds.has(orderId))
  );

  finishingOrderIds = new Set(
    [...finishingOrderIds].filter((orderId) => liveOrderIds.has(orderId))
  );

  if(!liveOrderIds.size){
    if(locationWatchId !== null){
      stopLocationSharing({
        preservePreference: true
      });
    }else{
      stopLocationWatchHealthCheck();
    }
    return;
  }

  if(liveOrderIds.size && isLocationSharingEnabled){
    ensureLocationSharingWatch();
  }
}

function renderDriverDashboard(){
  const activeOrders = getActiveOrders();
  const completedOrders = getCompletedOrders();

  updateDashboardSummary();
  renderDriverOrders(activeOrders);
  renderCompletedOrders(completedOrders);
}

function applyDriverLanguage(){
  applyStaticTranslations();
  setDashboardMessage(dashboardMessageState.key, dashboardMessageState.type, dashboardMessageState.params);
  renderActiveCollectionState();
  syncCollectionControls();

  if(hasDashboardHydrated){
    renderDriverDashboard();
  }else{
    renderDriverPreHydrationState();
  }
}

function subscribeToDriverOrders(uid){
  ordersUnsubscribe?.();

  const driverOrdersQuery = query(
    collection(db, "orders"),
    where("driver.uid", "==", uid)
  );

  ordersUnsubscribe = onSnapshot(driverOrdersQuery, (snapshot) => {
    const assignedOrders = snapshot.docs.map((orderDoc) => ({
      id: orderDoc.id,
      ...orderDoc.data()
    }));

    currentOrders = assignedOrders;
    syncLiveDeliveryState(currentOrders);
    renderDriverDashboard();
  }, (error) => {
    console.error("Failed to subscribe to driver orders:", error);
    setDashboardMessage("statusBanner.loadFailed", "error");
  });
}

async function startDelivery(orderId){
  const order = currentOrders.find((item) => item.id === orderId);

  if(!order || !currentDriver){
    return;
  }

  startingOrderIds.add(orderId);
  renderDriverDashboard();

  try{
    const deliveryLifecyclePatch = getTimestampValue(order.outForDeliveryAt)
      ? {}
      : { outForDeliveryAt: serverTimestamp() };

    await updateDoc(doc(db, "orders", orderId), {
      status: "out-for-delivery",
      driver: getAssignedDriverMeta(order),
      driverLocation: null,
      ...deliveryLifecyclePatch
    });

    setDashboardMessage("statusBanner.startSuccess", "success", {
      orderId: order.orderId || order.id
    });
  }catch(error){
    startingOrderIds.delete(orderId);
    renderDriverDashboard();
    console.error("Failed to start delivery:", error);
    setDashboardMessage("statusBanner.startFailed", "error");
  }
}

function startLocationWatchHealthCheck(){
  if(locationWatchHealthCheckId !== null){
    return;
  }

  locationWatchHealthCheckId = window.setInterval(() => {
    const hasLiveDeliveries = getLiveDeliveryOrders().length > 0;

    if(!isLocationSharingEnabled || !hasLiveDeliveries){
      if(locationWatchHealthCheckId !== null && !hasLiveDeliveries){
        window.clearInterval(locationWatchHealthCheckId);
        locationWatchHealthCheckId = null;
      }
      return;
    }

    const isWatchMissing = locationWatchId === null;
    const isWatchStale = lastLocationActivityAt && (Date.now() - lastLocationActivityAt) > LOCATION_WATCH_STALE_MS;

    if(isWatchMissing || isWatchStale){
      restartLocationSharingWatch(isWatchStale ? "refresh" : "resume");
    }
  }, LOCATION_WATCH_HEALTHCHECK_MS);
}

function stopLocationWatchHealthCheck(){
  if(locationWatchHealthCheckId !== null){
    window.clearInterval(locationWatchHealthCheckId);
    locationWatchHealthCheckId = null;
  }
}

function stopLocationSharing(options = {}){
  const {
    preservePreference = false
  } = options;

  if(locationWatchId !== null && navigator.geolocation){
    navigator.geolocation.clearWatch(locationWatchId);
  }

  if(!preservePreference){
    persistLocationSharingPreference(false);
  }

  locationWatchId = null;
  lastSharedLocation = null;
  lastLocationActivityAt = 0;
  isLocationUpdatePending = false;
  stopLocationWatchHealthCheck();

  if(hasDashboardHydrated){
    renderDriverDashboard();
  }
}

function restartLocationSharingWatch(reason = "resume"){
  if(locationWatchId !== null && navigator.geolocation){
    navigator.geolocation.clearWatch(locationWatchId);
    locationWatchId = null;
  }

  lastLocationActivityAt = 0;
  ensureLocationSharingWatch(reason);
}

function ensureLocationSharingWatch(reason = "resume"){
  const liveOrders = getLiveDeliveryOrders();

  if(!isLocationSharingEnabled || !liveOrders.length){
    if(!liveOrders.length && locationWatchId !== null){
      stopLocationSharing({
        preservePreference: true
      });
    }
    return;
  }

  if(!navigator.geolocation){
    setDashboardMessage("statusBanner.geolocationUnsupported", "error");
    persistLocationSharingPreference(false);
    renderDriverDashboard();
    return;
  }

  if(locationWatchId !== null){
    startLocationWatchHealthCheck();
    renderDriverDashboard();
    return;
  }

  lastLocationActivityAt = Date.now();
  startLocationWatchHealthCheck();
  locationWatchId = navigator.geolocation.watchPosition(async (position) => {
    const activeLiveOrders = getLiveDeliveryOrders();

    if(!activeLiveOrders.length){
      stopLocationSharing({
        preservePreference: true
      });
      return;
    }

    lastLocationActivityAt = Date.now();

    if(isLocationUpdatePending){
      return;
    }

    isLocationUpdatePending = true;

    try{
      const nextLocation = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        updatedAt: new Date()
      };
      const now = Date.now();
      const distanceFromLastShared = calculateDistanceInKm(lastSharedLocation, nextLocation);
      const wasRecentlyShared = lastSharedLocation && (now - lastSharedLocation.sharedAtMs) < LOCATION_UPDATE_MIN_INTERVAL_MS;
      const hasBarelyMoved = Number.isFinite(distanceFromLastShared) && distanceFromLastShared < LOCATION_UPDATE_MIN_DISTANCE_KM;

      if(wasRecentlyShared && hasBarelyMoved){
        return;
      }

      await Promise.all(activeLiveOrders.map((liveOrder) =>
        updateDoc(doc(db, "orders", liveOrder.id), {
          driverLocation: nextLocation
        })
      ));

      lastSharedLocation = {
        ...nextLocation,
        sharedAtMs: now
      };
      lastLocationActivityAt = now;
    }catch(error){
      console.error("Failed to update driver location:", error);
      setDashboardMessage("statusBanner.locationUpdateFailed", "warning");
    }finally{
      isLocationUpdatePending = false;
    }
  }, (error) => {
    console.error("Geolocation watch failed:", error);
    lastLocationActivityAt = Date.now();

    if(error.code === 1){
      setDashboardMessage("statusBanner.locationPermissionDenied", "error");
      stopLocationSharing();
      return;
    }

    if(error.code === 3){
      const now = Date.now();

      if((now - lastTimeoutMessageAt) > TIMEOUT_MESSAGE_COOLDOWN_MS){
        lastTimeoutMessageAt = now;
        setDashboardMessage("statusBanner.locationTimeout", "warning");
      }

      return;
    }

    setDashboardMessage("statusBanner.locationWeak", "warning");
  }, GEOLOCATION_OPTIONS);

  if(reason === "share"){
    setDashboardMessage("statusBanner.locationStarted", "success");
  }else{
    setDashboardMessage("statusBanner.locationActive", "success");
  }

  renderDriverDashboard();
}

async function finishOrder(orderId){
  const order = currentOrders.find((item) => item.id === orderId);

  if(!order || order.status !== "out-for-delivery" || finishingOrderIds.has(orderId)){
    return;
  }

  const confirmOrderId = order.orderId || order.id;

  if(!window.confirm(t("prompts.finishConfirmTitle", { orderId: confirmOrderId }))){
    return;
  }

  if(!window.confirm(t("prompts.finishConfirmBody", { orderId: confirmOrderId }))){
    return;
  }

  finishingOrderIds.add(orderId);
  renderDriverDashboard();

  try{
    const deliveredLifecyclePatch = getTimestampValue(order.deliveredAt)
      ? {}
      : { deliveredAt: serverTimestamp() };

    await updateDoc(doc(db, "orders", orderId), {
      status: "delivered",
      driver: getAssignedDriverMeta(order),
      driverLocation: null,
      ...deliveredLifecyclePatch
    });

    setDashboardMessage("statusBanner.finishSuccess", "success", {
      orderId: confirmOrderId
    });
  }catch(error){
    console.error("Failed to finish order:", error);
    finishingOrderIds.delete(orderId);
    renderDriverDashboard();
    setDashboardMessage("statusBanner.finishFailed", "error");
  }
}

function startLocationSharing(orderId){
  const order = currentOrders.find((item) => item.id === orderId);

  if(!order){
    return;
  }

  if(order.status !== "out-for-delivery"){
    setDashboardMessage("statusBanner.startBeforeShare", "warning");
    return;
  }

  if(!navigator.geolocation){
    setDashboardMessage("statusBanner.geolocationUnsupported", "error");
    return;
  }

  persistLocationSharingPreference(true);

  if(locationWatchId !== null){
    setDashboardMessage("statusBanner.locationAlreadyActive", "success");
    startLocationWatchHealthCheck();
    renderDriverDashboard();
    return;
  }

  ensureLocationSharingWatch("share");
}

async function initializeDriverDashboard(user){
  localStorage.setItem("driverUid", user.uid);
  hydrateLocationSharingPreference();
  currentDriver = await resolveDriverProfile(user);

  if(!currentDriver){
    setDashboardMessage("statusBanner.profileMissing", "error");
    return;
  }

  await backfillAssignedOrders(user, currentDriver);
  hasDashboardHydrated = true;
  renderDriverDashboard();
  renderActiveCollectionState();
  setDashboardMessage("statusBanner.dashboardConnected", "success");
  subscribeToDriverOrders(user.uid);
}

function attachCompletedOrderFilters(){
  completedRangeFilter?.addEventListener("change", () => {
    completedOrdersPage = 1;
    renderDriverDashboard();
  });

  completedSortFilter?.addEventListener("change", () => {
    completedOrdersPage = 1;
    renderDriverDashboard();
  });

  completedSearchInput?.addEventListener("input", () => {
    completedOrdersPage = 1;
    renderDriverDashboard();
  });

  driverCompletedPrevBtn?.addEventListener("click", () => {
    if(completedOrdersPage <= 1){
      return;
    }

    completedOrdersPage -= 1;
    renderCompletedOrders(getCompletedOrders());
  });

  driverCompletedNextBtn?.addEventListener("click", () => {
    const totalOrders = getCompletedOrders().length;
    const totalPages = Math.max(1, Math.ceil(totalOrders / COMPLETED_ORDERS_PER_PAGE));

    if(completedOrdersPage >= totalPages){
      return;
    }

    completedOrdersPage += 1;
    renderCompletedOrders(getCompletedOrders());
  });
}

function persistLocationSharingPreference(isEnabled){
  isLocationSharingEnabled = Boolean(isEnabled);

  if(isLocationSharingEnabled){
    localStorage.setItem(LOCATION_SHARING_PREFERENCE_KEY, "true");
  }else{
    localStorage.removeItem(LOCATION_SHARING_PREFERENCE_KEY);
  }
}

function hydrateLocationSharingPreference(){
  isLocationSharingEnabled = localStorage.getItem(LOCATION_SHARING_PREFERENCE_KEY) === "true";
}

driverLogoutBtn?.addEventListener("click", async () => {
  stopLocationSharing();
  ordersUnsubscribe?.();
  localStorage.removeItem("driverUid");
  await signOut(auth);
  window.location.href = "driver-login.html";
});

document.addEventListener("DOMContentLoaded", () => {
  initMobileMenu();
  initDriverSidebarNavigation();
  initScrollTopButton();
  attachCompletedOrderFilters();
  hydrateLocationSharingPreference();
  renderCollectionEmptyState();
  applyDriverLanguage();
  driverCollectionForm?.addEventListener("submit", handleCollectionLookup);
  driverLanguageSelect?.addEventListener("change", (event) => {
    persistDriverLanguage(event.target.value);
    applyDriverLanguage();
  });

  document.addEventListener("visibilitychange", () => {
    if(document.visibilityState === "visible" && isLocationSharingEnabled){
      ensureLocationSharingWatch();
    }
  });

  window.addEventListener("focus", () => {
    if(isLocationSharingEnabled){
      ensureLocationSharingWatch();
    }
  });

  window.addEventListener("online", () => {
    if(isLocationSharingEnabled){
      ensureLocationSharingWatch();
    }
  });

  onAuthStateChanged(auth, async (user) => {
    if(!user || user.uid !== storedUid){
      localStorage.removeItem("driverUid");
      window.location.href = "driver-login.html";
      return;
    }

    try{
      await initializeDriverDashboard(user);
      syncCollectionControls();
    }catch(error){
      console.error("Driver dashboard init failed:", error);
      setDashboardMessage("statusBanner.openFailed", "error");
    }
  });
});

