const LANGUAGE_STORAGE_KEY = "tajPublicLanguage";
const DEFAULT_LANGUAGE = "en";
const SUPPORTED_LANGUAGES = new Set(["en", "ar"]);

const TRANSLATIONS = {
  en: {
    meta: {
      homeTitle: "Al Taj Al Malaky Parties & Events Management",
      orderTitle: "Order - Al Taj Al Malaky",
      quoteTitle: "Quote Request | Al Taj Al Malaky",
      trackTitle: "Track Order | Al Taj Al Malaky",
      reviewsTitle: "Reviews | Al Taj Al Malaky"
    },
    nav: {
      home: "Home",
      order: "Order",
      track: "Track Order",
      reviews: "Reviews"
    },
    common: {
      brandTagline: "Luxury Event Setup & Rental",
      logoAlt: "Al Taj Al Malaky logo",
      whatsapp: "WhatsApp",
      languageSelector: "Language selector",
      openNavigation: "Open navigation menu",
      viewCollection: "View Collection",
      loadingReviews: "Loading reviews...",
      noReviewsYet: "No reviews yet",
      anonymous: "Anonymous",
      recentReview: "Recent review",
      dayMonday: "Monday",
      dayTuesday: "Tuesday",
      dayWednesday: "Wednesday",
      dayThursday: "Thursday",
      dayFriday: "Friday",
      daySaturday: "Saturday",
      daySunday: "Sunday",
      closed: "Closed",
      noData: "N/A"
    },
    category: {
      all: "All",
      chairs: "Chairs",
      diningTables: "Dining Tables",
      coffeeTable: "Coffee Table",
      bridalSofa: "Bridal Sofa",
      majlisSofa: "Majlis Sofa",
      cocktailTable: "Cocktail Table"
    },
    status: {
      "quote-requested": "Quote Requested",
      "quote-sent": "Quote Sent",
      confirmed: "Order Confirmed",
      preparing: "Being Prepared",
      "out-for-delivery": "Out for Delivery",
      delivered: "Delivered",
      cancelled: "Order Cancelled",
      unknown: "Unknown"
    },
    home: {
      heroTitle: "Premium event rentals across the UAE",
      heroLead: "Chairs, tables, majlis, bridal seating, and lounge pieces delivered across the UAE with premium quality, service, and presentation.",
      heroPrimary: "Request Your Quote",
      heroSecondary: "Client Reviews",
      heroScroll: "Scroll to enter the collection",
      collectionsKicker: "Collections",
      collectionsTitle: "Explore our signature collection",
      valuesKicker: "Why Clients Choose Us",
      valuesTitle: "We deliver refined event setups across the UAE",
      valuesText: "Chairs, tables, majlis, and bridal seating curated with precision and delivered with premium service.",
      valuesCuratedTitle: "Curated Pieces",
      valuesCuratedText: "A refined selection of chairs, tables, and statement setups for elevated settings.",
      valuesOrderingTitle: "Seamless Ordering",
      valuesOrderingText: "An effortless journey from selection to quote, designed for clarity and ease.",
      valuesTrackingTitle: "Reliable Delivery & Tracking",
      valuesTrackingText: "On-time setup across the UAE with real-time order tracking for complete peace of mind.",
      showcaseKicker: "Event Highlights",
      showcaseTitle: "Spaces styled to feel poised at first glance and memorable long after",
      reviewsKicker: "Client Feedback",
      reviewsTitle: "Client experiences shaped by elegance, service, and trust",
      reviewsCta: "View Client Experiences",
      visitKicker: "Visit Us",
      visitTitle: "Visit our office.",
      visitText: "Visit our location for consultations, event planning, and rental selection in a calm, premium setting.",
      openingHours: "Opening Hours",
      getDirections: "Get Directions",
      whatsappUs: "WhatsApp Us",
      locationLabel: "Our Location",
      ctaKicker: "Begin Your Event",
      ctaTitle: "Ready to build a more elegant event setting?",
      ctaText: "Explore the collection, choose your preferred pieces, and send your quote request directly to our team.",
      ctaPrimary: "Explore the Collection",
      ctaSecondary: "Track an Existing Order",
      collectionDiningDescription: "Formal table foundations for weddings, receptions, and elevated dining layouts.",
      collectionChairsDescription: "Guest seating selected to feel elegant, polished, and visually balanced across the room.",
      collectionCoffeeDescription: "Low-profile accent pieces for lounge scenes, bridal moments, and welcome areas.",
      collectionBridalDescription: "Statement seating for bridal stages and VIP focal points with graceful presence.",
      collectionMajlisDescription: "Majlis-inspired seating for warm hospitality spaces and culturally rich event settings.",
      collectionCocktailDescription: "Reception-ready standing tables for mingling, hospitality moments, and refined gatherings.",
      collectionAlt: "{product} from the {category} collection",
      collectionAltFallback: "{category} collection preview",
      collectionAria: "Explore {category}"
    },
    order: {
      pageTitle: "Build Your Event Order",
      kicker: "Curated Collection",
      toolbarAria: "Browse products",
      searchLabel: "Search Collection",
      searchPlaceholder: "Search by product name or category",
      clearSearch: "Clear product search",
      filterAria: "Product categories",
      loadMore: "Load More",
      bookingBasket: "Booking Basket",
      yourOrder: "Your Order",
      summaryCaption: "Select pieces from the collection to start building your quote.",
      emptyBasketTitle: "Your basket is ready",
      emptyBasketText: "Select products from the collection to build a polished quote request.",
      itemsSelected: "{count} item selected|{count} items selected",
      selectionsPrepared: "{count} selection prepared for your quote request.|{count} selections prepared for your quote request.",
      getQuote: "Get Quote",
      clearAll: "Clear All",
      mobileCartText: "Open your basket and continue to quote",
      top: "Top",
      noMatchesKicker: "No Matches",
      noMatchesTitle: "No products found",
      noMatchesText: "Try a different search or switch categories to continue browsing the collection.",
      showingCount: "Showing {shown} of {total} piece|Showing {shown} of {total} pieces",
      tapToViewDetails: "Tap to view details",
      modalImageAlt: "Product Image",
      zoomControls: "Image zoom controls",
      zoomOut: "Zoom out",
      resetZoom: "Reset zoom",
      zoomIn: "Zoom in",
      previousImage: "Previous image",
      nextImage: "Next image",
      thumbsAria: "Product gallery thumbnails",
      closeModal: "Close product modal",
      measurements: "Measurements",
      quantity: "Quantity",
      decreaseQuantity: "Decrease quantity",
      increaseQuantity: "Increase quantity",
      addToOrder: "Add to Order",
      addItemsFirst: "Add items first.",
      clearOrderConfirm: "Are you sure you want to clear your entire order?",
      viewImage: "View image {index}",
      imageThumbAlt: "{name} thumbnail {index}",
      collectionFallback: "Collection"
    },
    quote: {
      kicker: "Quote Request",
      pageTitle: "Complete Your Quote Request",
      customerNameLabel: "Customer Name",
      customerNamePlaceholder: "Ahmed",
      phoneLabel: "Phone Number",
      phonePlaceholder: "05xxxxxxxx",
      eventDateLabel: "Event Date",
      eventTimeLabel: "Event Time",
      setupTimeLabel: "Setup Time",
      setupTimeHelp: "When should our team arrive for setup?",
      rentalDaysLabel: "Rental Days",
      rentalDaysHelp: "How many days should the rental remain reserved?",
      mapLinkLabel: "Google Maps Link",
      mapLinkPlaceholder: "Paste Google Maps location link here",
      pickLocationBtn: "Pick Event Location on Map",
      useCurrentLocationBtn: "Use My Current Location",
      locationPickerHelp: "Search for a venue or tap directly on the map to lock the exact destination for delivery tracking.",
      eventLocationLabel: "Event Location",
      eventLocationPlaceholder: "Dubai, Business Bay",
      eventLocationHelp: "Please enter the exact accurate location (street number, building name, and floor).",
      notesLabel: "Notes",
      notesPlaceholder: "Outdoor event, evening setup, special seating request, etc.",
      selectedItemsTitle: "Your Selected Items",
      clearAll: "Clear all",
      emptyState: "Your order is empty",
      totalItemsZero: "Total items: 0",
      totalItems: "Total item: {count}|Total items: {count}",
      itemsSelected: "{count} item selected|{count} items selected",
      submitBtn: "Send via WhatsApp",
      submitting: "Submitting...",
      backToOrder: "Back to Order Page",
      addItemsFirst: "Add items first.",
      mapLinkRequired: "Please provide the Google Maps link for the event location.",
      geolocationUnsupported: "Geolocation not supported on this device.",
      locationCaptured: "Location captured successfully.",
      locationUnavailable: "Unable to retrieve your location.",
      submitError: "We couldn't submit your request right now. Please try again.",
      pickerTitle: "Pick Event Location",
      pickerSubtitle: "Search for a venue in the UAE or tap directly on the map to place the delivery pin.",
      summaryTitle: "Selected Location"
    },
    track: {
      kicker: "Track Your Order",
      lookupKicker: "Order Lookup",
      lookupTitle: "Enter your order ID",
      orderIdPlaceholder: "Example: TAJ-1024",
      trackButton: "Track Order",
      currentStatusKicker: "Current Status",
      reviewKicker: "Review",
      reviewTitle: "Rate your experience",
      reviewText: "Your feedback helps us continue delivering refined event experiences.",
      reviewNameLabel: "Name (optional)",
      reviewNamePlaceholder: "Your name",
      reviewRatingLabel: "Rating",
      reviewStarsAria: "Rate your experience",
      reviewOneStar: "1 star",
      reviewTwoStars: "2 stars",
      reviewThreeStars: "3 stars",
      reviewFourStars: "4 stars",
      reviewFiveStars: "5 stars",
      reviewTapCaption: "Tap a star to rate your delivery experience.",
      reviewSelectCaption: "Select a rating that reflects your overall experience.",
      reviewCommentLabel: "Comment (optional)",
      reviewCommentPlaceholder: "Share a few words about your experience",
      submitReview: "Submit Review",
      timelineKicker: "Progress Timeline",
      timelineTitle: "Follow each step of your order journey",
      statusRequestTitle: "Request Received",
      statusRequestText: "Your quote request has been received successfully.",
      statusQuoteTitle: "Quote Sent",
      statusQuoteText: "Your quotation has been prepared and sent to you.",
      statusConfirmedTitle: "Order Confirmed",
      statusConfirmedText: "Your order has been reviewed and confirmed.",
      statusPreparingTitle: "Being Prepared",
      statusPreparingText: "Your event setup is currently being prepared.",
      statusDeliveryTitle: "Out for Delivery",
      statusDeliveryText: "The team is on the way to your location.",
      statusDeliveredTitle: "Delivered",
      statusDeliveredText: "Your order has arrived and setup is complete.",
      liveMapKicker: "Live Map",
      driverDetails: "Driver Details",
      driverName: "Name:",
      driverPhone: "Phone:",
      contactDriver: "Contact Driver on WhatsApp",
      orderDetailsKicker: "Order Details",
      orderDetailsTitle: "Your booking information",
      supportKicker: "Need Help",
      supportTitle: "Get support for this order",
      supportGeneral: "General Inquiry",
      supportDelay: "Order Delay",
      supportEdit: "Edit Order",
      supportCancel: "Cancel Order",
      supportLocation: "Change Location",
      supportButton: "Contact Support on WhatsApp",
      closeReviewPrompt: "Close review prompt",
      reviewModalTitle: "How was your experience?",
      maybeLater: "Maybe later",
      leaveReview: "Leave Review",
      orderNotFoundTitle: "Order not found",
      orderNotFoundText: "This order may have been removed or the ID is incorrect.",
      orderLoadErrorTitle: "Unable to load this order",
      orderLoadErrorText: "Please try again in a moment.",
      orderInfoTitle: "Items in this Order",
      orderIdLabel: "Order ID:",
      customerLabel: "Customer:",
      eventDateLabel: "Event Date:",
      rentalDaysLabel: "Rental Days:",
      eventTimeLabel: "Event Time:",
      setupTimeLabel: "Setup Time:",
      locationLabel: "Location:",
      mapLabel: "Map:",
      openLocation: "Open Location",
      deliveryLocation: "Delivery Location",
      locationPending: "Location pending",
      driverUpdate: "Driver Update",
      liveDriverTitle: "Live driver location active",
      liveDriverTime: "Last updated at {time}.",
      liveDriverFallback: "Your driver is currently sharing live location.",
      deliveryCardLabel: "Delivery",
      deliveryCompleteTitle: "Delivery complete",
      deliveryCompleteText: "This order has been delivered successfully.",
      etaUnavailable: "ETA unavailable",
      etaUnavailableText: "Live ETA needs reliable destination coordinates and a sane delivery distance.",
      orderCancelledTitle: "Order Cancelled",
      orderCancelledText: "This order is marked as cancelled. Please contact support if you need help.",
      latestProgress: "Your latest order progress is shown here in real time.",
      reviewThanks: "Thank you for your feedback",
      reviewRatingRequired: "Please choose a rating before submitting your review.",
      reviewSubmitError: "We could not submit your review right now. Please try again.",
      reviewSubmitting: "Submitting...",
      etaHoursMinutes: "Estimated arrival: {hours} hr {minutes} min",
      etaHours: "Estimated arrival: {hours} hr",
      etaMinutes: "Estimated arrival: {minutes} min",
      enterOrderId: "Please enter an Order ID",
      driverFallbackName: "Driver",
      driverMessage: "Hello {name},\n\nI'm contacting you regarding my order {orderId}."
    },
    reviews: {
      heroKicker: "Client Experiences",
      heroTitle: "Trusted feedback from clients across the UAE",
      trustTitleOne: "5-star client satisfaction",
      trustTextOne: "Shared after completed event setups and deliveries",
      trustTitleTwo: "Delivered across the UAE",
      trustTextTwo: "Trusted for timely coordination and premium presentation",
      trustTitleThree: "Chosen for elegant occasions",
      trustTextThree: "Weddings, private events, and refined gatherings",
      filterAria: "Review filters",
      filterAll: "All Reviews",
      filterRecent: "Latest",
      filterTop: "Top Rated",
      paginationAria: "Reviews pagination",
      ctaKicker: "Plan With Confidence",
      ctaTitle: "Planning an event?",
      ctaText: "Explore our collection or request your quote with confidence.",
      ctaButton: "Request a Quote",
      reviewPhotoAlt: "Customer review photo",
      previous: "Previous",
      next: "Next",
      goToPage: "Go to page {page}"
    }
  },
  ar: {
    meta: {
      homeTitle: "التاج الملكي للحفلات وإدارة الفعاليات",
      orderTitle: "الطلب - التاج الملكي",
      trackTitle: "تتبع الطلب | التاج الملكي",
      reviewsTitle: "التقييمات | التاج الملكي"
    },
    nav: {
      home: "الرئيسية",
      order: "الطلب",
      track: "تتبع الطلب",
      reviews: "التقييمات"
    },
    common: {
      brandTagline: "تجهيز وتأجير الفعاليات الفاخرة",
      logoAlt: "شعار التاج الملكي",
      whatsapp: "واتساب",
      languageSelector: "اختيار اللغة",
      openNavigation: "فتح قائمة التنقل",
      viewCollection: "عرض المجموعة",
      loadingReviews: "جارٍ تحميل التقييمات...",
      noReviewsYet: "لا توجد تقييمات بعد",
      anonymous: "مجهول",
      recentReview: "تقييم حديث",
      dayMonday: "الاثنين",
      dayTuesday: "الثلاثاء",
      dayWednesday: "الأربعاء",
      dayThursday: "الخميس",
      dayFriday: "الجمعة",
      daySaturday: "السبت",
      daySunday: "الأحد",
      closed: "مغلق",
      noData: "غير متوفر"
    },
    category: {
      all: "الكل",
      chairs: "الكراسي",
      diningTables: "طاولات الطعام",
      coffeeTable: "طاولات القهوة",
      bridalSofa: "كنب العروس",
      majlisSofa: "كنب المجلس",
      cocktailTable: "طاولات الكوكتيل"
    },
    status: {
      "quote-requested": "تم طلب عرض السعر",
      "quote-sent": "تم إرسال عرض السعر",
      confirmed: "تم تأكيد الطلب",
      preparing: "جارٍ التجهيز",
      "out-for-delivery": "في الطريق للتسليم",
      delivered: "تم التسليم",
      cancelled: "تم إلغاء الطلب",
      unknown: "غير معروف"
    },
    home: {
      heroTitle: "تأجير مستلزمات الفعاليات الفاخرة في جميع أنحاء الإمارات",
      heroLead: "كراسي وطاولات ومجالس ومقاعد عروس وقطع لاونج يتم توصيلها في أنحاء الإمارات بجودة وخدمة وعرض راقٍ.",
      heroPrimary: "اطلب عرض السعر",
      heroSecondary: "تقييمات العملاء",
      heroScroll: "مرر لاكتشاف المجموعة",
      collectionsKicker: "المجموعات",
      collectionsTitle: "استكشف مجموعتنا المميزة",
      valuesKicker: "لماذا يختارنا العملاء",
      valuesTitle: "نقدم تجهيزات فعاليات راقية في جميع أنحاء الإمارات",
      valuesText: "كراسي وطاولات ومجالس ومقاعد عروس يتم تنسيقها بعناية وتوصيلها بخدمة مميزة.",
      valuesCuratedTitle: "قطع مختارة بعناية",
      valuesCuratedText: "تشكيلة راقية من الكراسي والطاولات والتجهيزات اللافتة للمساحات الراقية.",
      valuesOrderingTitle: "طلب سلس",
      valuesOrderingText: "رحلة سهلة من الاختيار إلى عرض السعر مصممة للوضوح والسهولة.",
      valuesTrackingTitle: "توصيل وتتبع موثوق",
      valuesTrackingText: "تجهيز في الوقت المحدد داخل الإمارات مع تتبع مباشر للطلب لراحة كاملة.",
      showcaseKicker: "أبرز الفعاليات",
      showcaseTitle: "مساحات مصممة لتبدو أنيقة من النظرة الأولى وتبقى في الذاكرة طويلًا",
      reviewsKicker: "آراء العملاء",
      reviewsTitle: "تجارب عملاء صاغتها الأناقة والخدمة والثقة",
      reviewsCta: "عرض تجارب العملاء",
      visitKicker: "زورونا",
      visitTitle: "زوروا مكتبنا.",
      visitText: "زوروا موقعنا للاستشارات وتخطيط الفعاليات واختيار القطع في أجواء هادئة وفاخرة.",
      openingHours: "ساعات العمل",
      getDirections: "الحصول على الاتجاهات",
      whatsappUs: "راسلنا على واتساب",
      locationLabel: "موقعنا",
      ctaKicker: "ابدأ فعاليتك",
      ctaTitle: "جاهز لإنشاء إعداد أكثر أناقة لفعاليتك؟",
      ctaText: "استكشف المجموعة واختر القطع المناسبة وأرسل طلب عرض السعر مباشرة إلى فريقنا.",
      ctaPrimary: "استكشف المجموعة",
      ctaSecondary: "تتبع طلب موجود",
      collectionDiningDescription: "أساسيات الطاولات الرسمية لحفلات الزفاف والاستقبالات وتنسيقات الطعام الراقية.",
      collectionChairsDescription: "مقاعد ضيوف مختارة لتبدو أنيقة ومتوازنة بصريًا في المساحة.",
      collectionCoffeeDescription: "قطع منخفضة الارتفاع لمناطق الاستراحة ولحظات العروس ومناطق الاستقبال.",
      collectionBridalDescription: "مقاعد مميزة لمنصات العروس ونقاط التركيز الخاصة بكامل الأناقة.",
      collectionMajlisDescription: "جلسات مستوحاة من المجلس لمساحات ضيافة دافئة وفعاليات بطابع ثقافي راقٍ.",
      collectionCocktailDescription: "طاولات استقبال عالية مناسبة للتجمعات والضيافة واللقاءات الراقية.",
      collectionAlt: "{product} من مجموعة {category}",
      collectionAltFallback: "معاينة مجموعة {category}",
      collectionAria: "استكشف {category}"
    },
    order: {
      pageTitle: "أنشئ طلب فعاليتك",
      kicker: "مجموعة منسقة",
      toolbarAria: "تصفح المنتجات",
      searchLabel: "ابحث في المجموعة",
      searchPlaceholder: "ابحث حسب اسم المنتج أو الفئة",
      clearSearch: "مسح البحث",
      filterAria: "فئات المنتجات",
      loadMore: "عرض المزيد",
      bookingBasket: "سلة الحجز",
      yourOrder: "طلبك",
      summaryCaption: "اختر القطع من المجموعة لبدء إعداد طلب عرض السعر.",
      emptyBasketTitle: "سلتك جاهزة",
      emptyBasketText: "اختر المنتجات من المجموعة لبناء طلب عرض سعر أنيق.",
      itemsSelected: "تم اختيار عنصر واحد|تم اختيار {count} عناصر",
      selectionsPrepared: "تم تجهيز اختيار واحد لطلب عرض السعر.|تم تجهيز {count} اختيارات لطلب عرض السعر.",
      getQuote: "احصل على عرض سعر",
      clearAll: "مسح الكل",
      mobileCartText: "افتح سلتك وأكمل إلى عرض السعر",
      top: "أعلى",
      noMatchesKicker: "لا توجد نتائج",
      noMatchesTitle: "لم يتم العثور على منتجات",
      noMatchesText: "جرّب بحثًا مختلفًا أو بدّل الفئة لمتابعة التصفح.",
      showingCount: "عرض {shown} من أصل {total} قطعة|عرض {shown} من أصل {total} قطع",
      tapToViewDetails: "اضغط لعرض التفاصيل",
      modalImageAlt: "صورة المنتج",
      zoomControls: "أدوات تكبير الصورة",
      zoomOut: "تصغير",
      resetZoom: "إعادة التكبير",
      zoomIn: "تكبير",
      previousImage: "الصورة السابقة",
      nextImage: "الصورة التالية",
      thumbsAria: "صور مصغرة للمنتج",
      closeModal: "إغلاق نافذة المنتج",
      measurements: "المقاسات",
      quantity: "الكمية",
      decreaseQuantity: "تقليل الكمية",
      increaseQuantity: "زيادة الكمية",
      addToOrder: "أضف إلى الطلب",
      addItemsFirst: "أضف عناصر أولًا.",
      clearOrderConfirm: "هل أنت متأكد أنك تريد مسح طلبك بالكامل؟",
      viewImage: "عرض الصورة {index}",
      imageThumbAlt: "صورة مصغرة {index} لـ {name}",
      collectionFallback: "المجموعة"
    },
    track: {
      kicker: "تتبع طلبك",
      lookupKicker: "البحث عن الطلب",
      lookupTitle: "أدخل رقم الطلب",
      orderIdPlaceholder: "مثال: TAJ-1024",
      trackButton: "تتبع الطلب",
      currentStatusKicker: "الحالة الحالية",
      reviewKicker: "التقييم",
      reviewTitle: "قيّم تجربتك",
      reviewText: "ملاحظاتك تساعدنا على الاستمرار في تقديم تجارب فعاليات راقية.",
      reviewNameLabel: "الاسم (اختياري)",
      reviewNamePlaceholder: "اسمك",
      reviewRatingLabel: "التقييم",
      reviewStarsAria: "قيّم تجربتك",
      reviewOneStar: "نجمة واحدة",
      reviewTwoStars: "نجمتان",
      reviewThreeStars: "3 نجوم",
      reviewFourStars: "4 نجوم",
      reviewFiveStars: "5 نجوم",
      reviewTapCaption: "اضغط على نجمة لتقييم تجربة التوصيل.",
      reviewSelectCaption: "اختر تقييمًا يعكس تجربتك العامة.",
      reviewCommentLabel: "التعليق (اختياري)",
      reviewCommentPlaceholder: "شاركنا بضع كلمات عن تجربتك",
      submitReview: "إرسال التقييم",
      timelineKicker: "مخطط التقدم",
      timelineTitle: "تابع كل خطوة من رحلة طلبك",
      statusRequestTitle: "تم استلام الطلب",
      statusRequestText: "تم استلام طلب عرض السعر بنجاح.",
      statusQuoteTitle: "تم إرسال عرض السعر",
      statusQuoteText: "تم إعداد عرض السعر وإرساله إليك.",
      statusConfirmedTitle: "تم تأكيد الطلب",
      statusConfirmedText: "تمت مراجعة طلبك وتأكيده.",
      statusPreparingTitle: "جارٍ التجهيز",
      statusPreparingText: "يتم حاليًا تجهيز إعداد فعاليتك.",
      statusDeliveryTitle: "في الطريق للتسليم",
      statusDeliveryText: "الفريق في الطريق إلى موقعك.",
      statusDeliveredTitle: "تم التسليم",
      statusDeliveredText: "وصل طلبك واكتمل التجهيز.",
      liveMapKicker: "الخريطة المباشرة",
      driverDetails: "بيانات السائق",
      driverName: "الاسم:",
      driverPhone: "الهاتف:",
      contactDriver: "تواصل مع السائق عبر واتساب",
      orderDetailsKicker: "تفاصيل الطلب",
      orderDetailsTitle: "معلومات حجزك",
      supportKicker: "تحتاج مساعدة",
      supportTitle: "احصل على دعم لهذا الطلب",
      supportGeneral: "استفسار عام",
      supportDelay: "تأخر الطلب",
      supportEdit: "تعديل الطلب",
      supportCancel: "إلغاء الطلب",
      supportLocation: "تغيير الموقع",
      supportButton: "تواصل مع الدعم عبر واتساب",
      closeReviewPrompt: "إغلاق نافذة التقييم",
      reviewModalTitle: "كيف كانت تجربتك؟",
      maybeLater: "لاحقًا",
      leaveReview: "اترك تقييمًا",
      orderNotFoundTitle: "لم يتم العثور على الطلب",
      orderNotFoundText: "قد يكون هذا الطلب قد أزيل أو أن الرقم غير صحيح.",
      orderLoadErrorTitle: "تعذر تحميل هذا الطلب",
      orderLoadErrorText: "يرجى المحاولة مرة أخرى بعد قليل.",
      orderInfoTitle: "العناصر في هذا الطلب",
      orderIdLabel: "رقم الطلب:",
      customerLabel: "العميل:",
      eventDateLabel: "تاريخ المناسبة:",
      rentalDaysLabel: "أيام الإيجار:",
      eventTimeLabel: "وقت المناسبة:",
      setupTimeLabel: "وقت التجهيز:",
      locationLabel: "الموقع:",
      mapLabel: "الخريطة:",
      openLocation: "فتح الموقع",
      deliveryLocation: "موقع التوصيل",
      locationPending: "الموقع قيد الانتظار",
      driverUpdate: "تحديث السائق",
      liveDriverTitle: "موقع السائق المباشر مفعل",
      liveDriverTime: "آخر تحديث الساعة {time}.",
      liveDriverFallback: "السائق يشارك موقعه المباشر حاليًا.",
      deliveryCardLabel: "التسليم",
      deliveryCompleteTitle: "اكتمل التسليم",
      deliveryCompleteText: "تم تسليم هذا الطلب بنجاح.",
      etaUnavailable: "الوقت المتوقع غير متاح",
      etaUnavailableText: "يحتاج الوقت المتوقع إلى إحداثيات موثوقة للموقع ومسافة توصيل منطقية.",
      orderCancelledTitle: "تم إلغاء الطلب",
      orderCancelledText: "تم وضع علامة على هذا الطلب كملغي. يرجى التواصل مع الدعم إذا كنت بحاجة إلى مساعدة.",
      latestProgress: "يتم عرض آخر تقدم لطلبك هنا بشكل مباشر.",
      reviewThanks: "شكرًا لك على ملاحظاتك",
      reviewRatingRequired: "يرجى اختيار تقييم قبل إرسال رأيك.",
      reviewSubmitError: "تعذر إرسال تقييمك الآن. يرجى المحاولة مرة أخرى.",
      reviewSubmitting: "جارٍ الإرسال...",
      etaHoursMinutes: "الوصول المتوقع: {hours} س {minutes} د",
      etaHours: "الوصول المتوقع: {hours} س",
      etaMinutes: "الوصول المتوقع: {minutes} د",
      enterOrderId: "يرجى إدخال رقم الطلب",
      driverFallbackName: "السائق",
      driverMessage: "Hello {name},\n\nI'm contacting you regarding my order {orderId}."
    },
    reviews: {
      heroKicker: "تجارب العملاء",
      heroTitle: "آراء موثوقة من عملائنا في جميع أنحاء الإمارات",
      trustTitleOne: "رضا عملاء بخمس نجوم",
      trustTextOne: "تمت مشاركتها بعد تجهيزات الفعاليات وعمليات التسليم المكتملة",
      trustTitleTwo: "توصيل في جميع أنحاء الإمارات",
      trustTextTwo: "موثوقون في التنسيق في الوقت المناسب والعرض الراقي",
      trustTitleThree: "الخيار الأمثل للمناسبات الأنيقة",
      trustTextThree: "حفلات الزفاف والفعاليات الخاصة والتجمعات الراقية",
      filterAria: "فلاتر التقييمات",
      filterAll: "كل التقييمات",
      filterRecent: "الأحدث",
      filterTop: "الأعلى تقييمًا",
      paginationAria: "ترقيم صفحات التقييمات",
      ctaKicker: "خطط بثقة",
      ctaTitle: "تخطط لفعالية؟",
      ctaText: "استكشف مجموعتنا أو اطلب عرض السعر بثقة.",
      ctaButton: "اطلب عرض سعر",
      reviewPhotoAlt: "صورة تقييم العميل",
      previous: "السابق",
      next: "التالي",
      goToPage: "اذهب إلى الصفحة {page}"
    }
  }
};

Object.assign(TRANSLATIONS.en.meta, {
  quoteTitle: "Quote Request | Al Taj Al Malaky"
});

Object.assign(TRANSLATIONS.en, {
  quote: {
    kicker: "Quote Request",
    pageTitle: "Complete Your Quote Request",
    customerNameLabel: "Customer Name",
    customerNamePlaceholder: "Ahmed",
    phoneLabel: "Phone Number",
    phonePlaceholder: "05xxxxxxxx",
    eventDateLabel: "Event Date",
    eventTimeLabel: "Event Time",
    setupTimeLabel: "Setup Time",
    setupTimeHelp: "When should our team arrive for setup?",
    rentalDaysLabel: "Rental Days",
    rentalDaysHelp: "How many days should the rental remain reserved?",
    mapLinkLabel: "Google Maps Link",
    mapLinkPlaceholder: "Paste Google Maps location link here",
    pickLocationBtn: "Pick Event Location on Map",
    useCurrentLocationBtn: "Use My Current Location",
    locationPickerHelp: "Search for a venue or tap directly on the map to lock the exact destination for delivery tracking.",
    eventLocationLabel: "Event Location",
    eventLocationPlaceholder: "Dubai, Business Bay",
    eventLocationHelp: "Please enter the exact accurate location (street number, building name, and floor).",
    notesLabel: "Notes",
    notesPlaceholder: "Outdoor event, evening setup, special seating request, etc.",
    selectedItemsTitle: "Your Selected Items",
    clearAll: "Clear all",
    emptyState: "Your order is empty",
    totalItemsZero: "Total items: 0",
    totalItems: "Total item: {count}|Total items: {count}",
    itemsSelected: "{count} item selected|{count} items selected",
    submitBtn: "Send via WhatsApp",
    submitting: "Submitting...",
    backToOrder: "Back to Order Page",
    addItemsFirst: "Add items first.",
    mapLinkRequired: "Please provide the Google Maps link for the event location.",
    geolocationUnsupported: "Geolocation not supported on this device.",
    locationCaptured: "Location captured successfully.",
    locationUnavailable: "Unable to retrieve your location.",
    submitError: "We couldn't submit your request right now. Please try again.",
    pickerTitle: "Pick Event Location",
    pickerSubtitle: "Search for a venue in the UAE or tap directly on the map to place the delivery pin.",
    summaryTitle: "Selected Location"
  }
});

Object.assign(TRANSLATIONS.ar.meta, {
  quoteTitle: "طلب عرض السعر | التاج الملكي"
});

Object.assign(TRANSLATIONS.ar, {
  quote: {
    kicker: "طلب عرض السعر",
    pageTitle: "أكمل طلب عرض السعر",
    customerNameLabel: "اسم العميل",
    customerNamePlaceholder: "أحمد",
    phoneLabel: "رقم الهاتف",
    phonePlaceholder: "05xxxxxxxx",
    eventDateLabel: "تاريخ المناسبة",
    eventTimeLabel: "وقت المناسبة",
    setupTimeLabel: "وقت التجهيز",
    setupTimeHelp: "متى ينبغي أن يصل فريقنا للتجهيز؟",
    rentalDaysLabel: "أيام الإيجار",
    rentalDaysHelp: "كم يومًا يجب أن يبقى الحجز محجوزًا؟",
    mapLinkLabel: "رابط جوجل مابس",
    mapLinkPlaceholder: "ألصق رابط موقع جوجل مابس هنا",
    pickLocationBtn: "حدد موقع المناسبة على الخريطة",
    useCurrentLocationBtn: "استخدم موقعي الحالي",
    locationPickerHelp: "ابحث عن مكان أو اضغط مباشرة على الخريطة لتثبيت الوجهة الدقيقة لتتبع التوصيل.",
    eventLocationLabel: "موقع المناسبة",
    eventLocationPlaceholder: "دبي، بزنس باي",
    eventLocationHelp: "يرجى إدخال الموقع الدقيق بالكامل (رقم الشارع واسم المبنى والطابق).",
    notesLabel: "ملاحظات",
    notesPlaceholder: "فعالية خارجية، تجهيز مسائي، طلب خاص للجلوس، إلخ.",
    selectedItemsTitle: "العناصر المختارة",
    clearAll: "مسح الكل",
    emptyState: "طلبك فارغ",
    totalItemsZero: "إجمالي العناصر: 0",
    totalItems: "إجمالي العنصر: {count}|إجمالي العناصر: {count}",
    itemsSelected: "تم اختيار عنصر واحد|تم اختيار {count} عناصر",
    submitBtn: "إرسال عبر واتساب",
    submitting: "جارٍ الإرسال...",
    backToOrder: "العودة إلى صفحة الطلب",
    addItemsFirst: "أضف عناصر أولًا.",
    mapLinkRequired: "يرجى إضافة رابط جوجل مابس لموقع المناسبة.",
    geolocationUnsupported: "خدمة تحديد الموقع غير مدعومة على هذا الجهاز.",
    locationCaptured: "تم التقاط الموقع بنجاح.",
    locationUnavailable: "تعذر الوصول إلى موقعك.",
    submitError: "لم نتمكن من إرسال طلبك الآن. يرجى المحاولة مرة أخرى.",
    pickerTitle: "حدد موقع المناسبة",
    pickerSubtitle: "ابحث عن مكان في الإمارات أو اضغط مباشرة على الخريطة لوضع دبوس التوصيل.",
    summaryTitle: "الموقع المحدد"
  }
});

let currentLanguage = DEFAULT_LANGUAGE;
let isBound = false;

function resolveNestedKey(target, key){
  return String(key || "")
    .split(".")
    .reduce((accumulator, part) => (accumulator && accumulator[part] != null ? accumulator[part] : undefined), target);
}

function interpolate(template, params = {}){
  return String(template).replace(/\{(\w+)\}/g, (_, key) => String(params[key] ?? ""));
}

function getStoredLanguage(){
  try{
    const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    return SUPPORTED_LANGUAGES.has(stored) ? stored : DEFAULT_LANGUAGE;
  }catch{
    return DEFAULT_LANGUAGE;
  }
}

function persistLanguage(language){
  try{
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  }catch{
    // Ignore storage failures.
  }
}

function updateDocumentLanguage(){
  const language = getLanguage();
  const direction = language === "ar" ? "rtl" : "ltr";
  document.documentElement.lang = language;
  document.documentElement.dir = direction;
  document.body?.classList.toggle("is-rtl", direction === "rtl");
}

function updateDocumentTitle(){
  const titleKey = document.body?.dataset.i18nTitle;

  if(titleKey){
    document.title = t(titleKey);
  }
}

function updateLanguageSwitchers(){
  document.querySelectorAll("[data-language-switcher]").forEach((switcher) => {
    const labelKey = switcher.dataset.i18nAriaLabel;

    if(labelKey){
      switcher.setAttribute("aria-label", t(labelKey));
    }

    switcher.querySelectorAll("[data-lang-option]").forEach((button) => {
      const isActive = button.dataset.langOption === currentLanguage;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-pressed", String(isActive));
    });
  });
}

function bindLanguageSwitchers(){
  if(isBound){
    return;
  }

  isBound = true;
  document.addEventListener("click", (event) => {
    const option = event.target.closest("[data-lang-option]");

    if(!option){
      return;
    }

    setLanguage(option.dataset.langOption || DEFAULT_LANGUAGE);
  });
}

export function getLanguage(){
  return currentLanguage;
}

export function getLocale(){
  return currentLanguage === "ar" ? "ar-AE" : "en-US";
}

export function isRTL(){
  return currentLanguage === "ar";
}

export function t(key, params = {}){
  const languageDictionary = TRANSLATIONS[currentLanguage] || TRANSLATIONS[DEFAULT_LANGUAGE];
  const fallbackDictionary = TRANSLATIONS[DEFAULT_LANGUAGE];
  const resolved = resolveNestedKey(languageDictionary, key) ?? resolveNestedKey(fallbackDictionary, key) ?? key;
  return interpolate(resolved, params);
}

export function translateCount(key, count, params = {}){
  const message = t(key, { count, ...params });
  const variants = String(message).split("|");

  if(variants.length === 1){
    return variants[0];
  }

  return interpolate(count === 1 ? variants[0] : variants[1], { count, ...params });
}

export function translateCategory(category){
  const categoryMap = {
    All: "category.all",
    Chairs: "category.chairs",
    "Dining Tables": "category.diningTables",
    "Coffee Table": "category.coffeeTable",
    "Bridal Sofa": "category.bridalSofa",
    "Majlis Sofa": "category.majlisSofa",
    "Cocktail Table": "category.cocktailTable"
  };

  const key = categoryMap[String(category || "").trim()];
  return key ? t(key) : String(category || "");
}

export function translateStatus(status){
  const normalized = String(status || "unknown").toLowerCase().trim().replaceAll(" ", "-");
  return t(`status.${normalized}`);
}

export function formatLocalizedDate(value, options = {
  day: "numeric",
  month: "short",
  year: "numeric"
}){
  if(!value){
    return "";
  }

  const date = typeof value?.toDate === "function" ? value.toDate() : new Date(value);

  if(Number.isNaN(date.getTime())){
    return "";
  }

  return date.toLocaleDateString(getLocale(), options);
}

export function formatLocalizedTime(value, options = {
  hour: "numeric",
  minute: "2-digit"
}){
  if(!value){
    return "";
  }

  const date = typeof value?.toDate === "function" ? value.toDate() : new Date(value);

  if(Number.isNaN(date.getTime())){
    return "";
  }

  return date.toLocaleTimeString(getLocale(), options);
}

export function applyTranslations(root = document){
  updateDocumentLanguage();
  updateDocumentTitle();

  root.querySelectorAll("[data-i18n]").forEach((element) => {
    const key = element.dataset.i18n;
    element.textContent = t(key);
  });

  root.querySelectorAll("[data-i18n-placeholder]").forEach((element) => {
    const key = element.dataset.i18nPlaceholder;
    element.setAttribute("placeholder", t(key));
  });

  root.querySelectorAll("[data-i18n-aria-label]").forEach((element) => {
    const key = element.dataset.i18nAriaLabel;
    element.setAttribute("aria-label", t(key));
  });

  root.querySelectorAll("[data-i18n-title]").forEach((element) => {
    const key = element.dataset.i18nTitle;
    element.setAttribute("title", t(key));
  });

  root.querySelectorAll("[data-i18n-alt]").forEach((element) => {
    const key = element.dataset.i18nAlt;
    element.setAttribute("alt", t(key));
  });

  updateLanguageSwitchers();
}

export function setLanguage(language, options = {}){
  const nextLanguage = SUPPORTED_LANGUAGES.has(language) ? language : DEFAULT_LANGUAGE;
  const shouldPersist = options.persist !== false;

  if(currentLanguage === nextLanguage && options.force !== true){
    applyTranslations();
    return;
  }

  currentLanguage = nextLanguage;

  if(shouldPersist){
    persistLanguage(currentLanguage);
  }

  applyTranslations();
  document.dispatchEvent(new CustomEvent("app:languagechange", {
    detail: {
      language: currentLanguage,
      direction: isRTL() ? "rtl" : "ltr"
    }
  }));
}

export function initI18n(){
  currentLanguage = getStoredLanguage();
  bindLanguageSwitchers();
  applyTranslations();
}

export function onLanguageChange(callback){
  document.addEventListener("app:languagechange", (event) => {
    callback(event.detail.language, event.detail.direction);
  });
}
