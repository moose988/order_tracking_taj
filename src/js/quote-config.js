export const VAT_RATE = 0.05;
export const QUOTE_CURRENCY = "AED";

export const QUOTE_COMPANY = {
  name: {
    en: "Al Taj Al Malaky Parties & Events Management",
    ar: "التاج الملكي للحفلات وإدارة الفعاليات"
  },
  subtitle: {
    en: "Luxury Event Setup & Rental",
    ar: "تنسيق وتجهيز وتأجير الفعاليات"
  },
  phone: "+971 50 537 3383",
  whatsapp: "+971 50 537 3383",
  instagram: "@taj_almalaki",
  email: "info@altajalmalaky.com"
};

export const QUOTE_BANK_FIELD_LABELS = {
  en: {
    bankName: "Bank Name",
    branch: "Branch",
    beneficiary: "Beneficiary",
    accountNumber: "Account Number",
    iban: "IBAN",
    swift: "SWIFT"
  },
  ar: {
    bankName: "اسم البنك",
    branch: "الفرع",
    beneficiary: "اسم المستفيد",
    accountNumber: "رقم الحساب",
    iban: "رقم الآيبان",
    swift: "سويفت"
  }
};

export const QUOTE_BANK_PRESETS = [
  {
    id: "emirates-nbd-aed",
    label: {
      en: "Emirates NBD - AED",
      ar: "الإمارات دبي الوطني - درهم"
    },
    bankName: "Emirates NBD",
    branch: "Dubai Main Branch",
    beneficiary: "Al Taj Al Malaky Parties & Events Management",
    accountNumber: "020000123456",
    iban: "AE07026000000020000123456",
    swift: "EBILAEAD"
  },
  {
    id: "mashreq-business-aed",
    label: {
      en: "Mashreq Business - AED",
      ar: "مشرق للأعمال - درهم"
    },
    bankName: "Mashreq Bank",
    branch: "Business Bay Branch",
    beneficiary: "Al Taj Al Malaky Parties & Events Management",
    accountNumber: "101000654321",
    iban: "AE430330000000101000654321",
    swift: "BOMLAEAD"
  }
];

export const QUOTE_TERMS = {
  en: [
    "Quotation validity: 7 days from the quotation date.",
    "Availability of rental items is subject to final confirmation at booking time.",
    "Delivery, setup, and collection timing may vary depending on venue access."
  ],
  ar: [
    "صلاحية عرض السعر: 7 أيام من تاريخ العرض.",
    "توفر مواد التأجير يخضع للتأكيد النهائي عند وقت الحجز.",
    "قد تختلف أوقات التوصيل والتركيب والاستلام حسب دخول الموقع."
  ]
};

export const QUOTE_LABELS = {
  en: {
    quotation: "Quotation",
    version: "Version",
    quotationNumber: "Quotation No.",
    quotationDate: "Quotation Date",
    customerDetails: "Customer Details",
    customerName: "Customer Name",
    phone: "Phone",
    eventDetails: "Event Details",
    eventDate: "Event Date",
    eventTime: "Event Time",
    setupTime: "Setup Time",
    eventLocation: "Event Location",
    notes: "Notes",
    rentalDays: "Rental Days",
    itemDescription: "Item Description",
    quantity: "Qty",
    unitPrice: "Unit Price",
    amount: "Amount",
    totals: "Totals",
    itemsTotal: "Items Total",
    subtotal: "Subtotal",
    deliveryCharge: "Delivery Charge",
    discount: "Discount",
    vat: "VAT",
    grandTotal: "Grand Total",
    bankDetails: "Bank Details",
    terms: "Terms",
    currency: "AED"
  },
  ar: {
    quotation: "عرض سعر",
    version: "الإصدار",
    quotationNumber: "رقم عرض السعر",
    quotationDate: "تاريخ عرض السعر",
    customerDetails: "بيانات العميل",
    customerName: "اسم العميل",
    phone: "الهاتف",
    eventDetails: "تفاصيل الفعالية",
    eventDate: "تاريخ الفعالية",
    eventTime: "وقت الفعالية",
    setupTime: "وقت التجهيز",
    eventLocation: "موقع الفعالية",
    notes: "ملاحظات",
    rentalDays: "أيام الإيجار",
    itemDescription: "اسم الصنف",
    quantity: "الكمية",
    unitPrice: "سعر الوحدة",
    amount: "الإجمالي",
    totals: "الإجماليات",
    itemsTotal: "إجمالي الأصناف",
    subtotal: "المجموع الفرعي",
    deliveryCharge: "رسوم التوصيل",
    discount: "الخصم",
    vat: "ضريبة القيمة المضافة",
    grandTotal: "الإجمالي الكلي",
    bankDetails: "بيانات البنك",
    terms: "الشروط",
    currency: "درهم"
  }
};

export function getQuoteLabels(language = "en"){
  return QUOTE_LABELS[language] || QUOTE_LABELS.en;
}

export function getQuoteBankPreset(bankPresetId){
  return QUOTE_BANK_PRESETS.find((preset) => preset.id === bankPresetId) || QUOTE_BANK_PRESETS[0];
}
