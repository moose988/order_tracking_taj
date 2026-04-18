function buildCatalogPlaceholderImage(label = "Al Taj Al Malaky"){
  const safeLabel = String(label || "Al Taj Al Malaky").trim();
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 900" role="img" aria-label="${safeLabel}">
      <defs>
        <linearGradient id="catalogBg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#fbf8f3" />
          <stop offset="100%" stop-color="#efe6d7" />
        </linearGradient>
      </defs>
      <rect width="1200" height="900" rx="36" fill="url(#catalogBg)" />
      <rect x="90" y="90" width="1020" height="720" rx="30" fill="#fffdf8" stroke="#d9c4a0" stroke-width="6" stroke-dasharray="16 16" />
      <text x="600" y="398" text-anchor="middle" font-family="Georgia, serif" font-size="56" font-weight="700" fill="#8f6f34">${safeLabel}</text>
      <text x="600" y="470" text-anchor="middle" font-family="Arial, sans-serif" font-size="28" fill="#7b6a54">Image coming soon</text>
      <text x="600" y="520" text-anchor="middle" font-family="Arial, sans-serif" font-size="24" fill="#9b8b74">Al Taj Al Malaky rental catalogue</text>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

export const CATALOG_PLACEHOLDER_IMAGE = buildCatalogPlaceholderImage();

export const PRODUCTS = [
  {
    id: 1,
    name: "Dining Table 1",
    category: "Dining Tables",
    shortDescription: "Elegant dining table for weddings, formal gatherings, and premium event settings.",
    measurements: "Standard event dining table size",
    images: [
      "../images/dinning tables/IN9A0010.JPG"
    ]
  },
  {
    id: 2,
    name: "Dining Table 2",
    category: "Dining Tables",
    shortDescription: "Elegant dining table for weddings, formal gatherings, and premium event settings.",
    measurements: "Standard event dining table size",
    images: [
      "../images/dinning tables/IN9A0013.JPG"
    ]
  },
  {
    id: 9,
    name: "Dining Table 3",
    category: "Dining Tables",
    shortDescription: "Elegant dining table for weddings, formal gatherings, and premium event settings.",
    measurements: "Standard event dining table size",
    images: [
      "../images/dinning tables/IN9A0020.JPG"
    ]
  },
  {
    id: 10,
    name: "Dining Table 4",
    category: "Dining Tables",
    shortDescription: "Elegant dining table for weddings, formal gatherings, and premium event settings.",
    measurements: "Standard event dining table size",
    images: [
      "../images/dinning tables/IN9A0021.JPG"
    ]
  },
  {
    id: 11,
    name: "Dining Table 5",
    category: "Dining Tables",
    shortDescription: "Elegant dining table for weddings, formal gatherings, and premium event settings.",
    measurements: "Standard event dining table size",
    images: [
      "../images/dinning tables/IN9A0022.JPG"
    ]
  },
  {
    id: 12,
    name: "Dining Table 6",
    category: "Dining Tables",
    shortDescription: "Elegant dining table for weddings, formal gatherings, and premium event settings.",
    measurements: "Standard event dining table size",
    images: [
      "../images/dinning tables/IN9A0027.JPG"
    ]
  },
  {
    id: 13,
    name: "Dining Table 7",
    category: "Dining Tables",
    shortDescription: "Elegant dining table for weddings, formal gatherings, and premium event settings.",
    measurements: "Standard event dining table size",
    images: [
      "../images/dinning tables/IN9A0032.JPG"
    ]
  },
  {
    id: 14,
    name: "Dining Table 8",
    category: "Dining Tables",
    shortDescription: "Elegant dining table for weddings, formal gatherings, and premium event settings.",
    measurements: "Standard event dining table size",
    images: [
      "../images/dinning tables/IN9A0036.JPG"
    ]
  },
  {
    id: 15,
    name: "Dining Table 9",
    category: "Dining Tables",
    shortDescription: "Elegant dining table for weddings, formal gatherings, and premium event settings.",
    measurements: "Standard event dining table size",
    images: [
      "../images/dinning tables/IN9A0039.JPG"
    ]
  },
  {
    id: 16,
    name: "Dining Table 10",
    category: "Dining Tables",
    shortDescription: "Elegant dining table for weddings, formal gatherings, and premium event settings.",
    measurements: "Standard event dining table size",
    images: [
      "../images/dinning tables/IN9A0060.JPG"
    ]
  },
  {
    id: 17,
    name: "Dining Table 11",
    category: "Dining Tables",
    shortDescription: "Elegant dining table for weddings, formal gatherings, and premium event settings.",
    measurements: "Standard event dining table size",
    images: [
      "../images/dinning tables/IN9A9831.JPG"
    ]
  },
  {
    id: 18,
    name: "Dining Table 12",
    category: "Dining Tables",
    shortDescription: "Elegant dining table for weddings, formal gatherings, and premium event settings.",
    measurements: "Standard event dining table size",
    images: [
      "../images/dinning tables/IN9A9837.JPG"
    ]
  },
  {
    id: 19,
    name: "Dining Table 13",
    category: "Dining Tables",
    shortDescription: "Elegant dining table for weddings, formal gatherings, and premium event settings.",
    measurements: "Standard event dining table size",
    images: [
      "../images/dinning tables/IN9A9839.JPG"
    ]
  },
  {
    id: 20,
    name: "Dining Table 14",
    category: "Dining Tables",
    shortDescription: "Elegant dining table for weddings, formal gatherings, and premium event settings.",
    measurements: "Standard event dining table size",
    images: [
      "../images/dinning tables/IN9A9843.JPG"
    ]
  },
  {
    id: 21,
    name: "Dining Table 15",
    category: "Dining Tables",
    shortDescription: "Elegant dining table for weddings, formal gatherings, and premium event settings.",
    measurements: "Standard event dining table size",
    images: [
      "../images/dinning tables/IN9A9845.JPG"
    ]
  },
  {
    id: 22,
    name: "Dining Table 16",
    category: "Dining Tables",
    shortDescription: "Elegant dining table for weddings, formal gatherings, and premium event settings.",
    measurements: "Standard event dining table size",
    images: [
      "../images/dinning tables/IN9A9846.JPG"
    ]
  },
  {
    id: 23,
    name: "Dining Table 17",
    category: "Dining Tables",
    shortDescription: "Elegant dining table for weddings, formal gatherings, and premium event settings.",
    measurements: "Standard event dining table size",
    images: [
      "../images/dinning tables/IN9A9850.JPG"
    ]
  },
  {
    id: 24,
    name: "Dining Table 18",
    category: "Dining Tables",
    shortDescription: "Elegant dining table for weddings, formal gatherings, and premium event settings.",
    measurements: "Standard event dining table size",
    images: [
      "../images/dinning tables/IN9A9950.JPG"
    ]
  },
  {
    id: 25,
    name: "Dining Table 19",
    category: "Dining Tables",
    shortDescription: "Elegant dining table for weddings, formal gatherings, and premium event settings.",
    measurements: "Standard event dining table size",
    images: [
      "../images/dinning tables/IN9A9952.JPG"
    ]
  },
  {
    id: 3,
    name: "White Chair",
    category: "Chairs",
    shortDescription: "Classic clean chair design for formal events and elegant guest seating.",
    measurements: "Standard event size",
    images: [
      "../images/IN9A9418.JPG",
      "../images/IN9A9423.jpg"
    ]
  },
  {
    id: 4,
    name: "Gold Chair",
    category: "Chairs",
    shortDescription: "Luxury gold seating that adds a polished premium touch to celebration layouts.",
    measurements: "Standard event size",
    images: [
      "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80"
    ]
  },
  {
    id: 5,
    name: "Bridal Sofa 1",
    category: "Bridal Sofa",
    shortDescription: "Elegant bridal sofa designed for stage backdrops, engagement setups, and premium focal seating.",
    measurements: "Standard bridal sofa size",
    images: [
      "../images/bridal sofa/IN9A0002.JPG"
    ]
  },
  {
    id: 26,
    name: "Bridal Sofa 2",
    category: "Bridal Sofa",
    shortDescription: "Elegant bridal sofa designed for stage backdrops, engagement setups, and premium focal seating.",
    measurements: "Standard bridal sofa size",
    images: [
      "../images/bridal sofa/IN9A9715.jpg"
    ]
  },
  {
    id: 27,
    name: "Bridal Sofa 3",
    category: "Bridal Sofa",
    shortDescription: "Elegant bridal sofa designed for stage backdrops, engagement setups, and premium focal seating.",
    measurements: "Standard bridal sofa size",
    images: [
      "../images/bridal sofa/IN9A9719.jpg"
    ]
  },
  {
    id: 28,
    name: "Bridal Sofa 4",
    category: "Bridal Sofa",
    shortDescription: "Elegant bridal sofa designed for stage backdrops, engagement setups, and premium focal seating.",
    measurements: "Standard bridal sofa size",
    images: [
      "../images/bridal sofa/IN9A9741.JPG"
    ]
  },
  {
    id: 29,
    name: "Bridal Sofa 5",
    category: "Bridal Sofa",
    shortDescription: "Elegant bridal sofa designed for stage backdrops, engagement setups, and premium focal seating.",
    measurements: "Standard bridal sofa size",
    images: [
      "../images/bridal sofa/IN9A9744.jpg"
    ]
  },
  {
    id: 30,
    name: "Bridal Sofa 6",
    category: "Bridal Sofa",
    shortDescription: "Elegant bridal sofa designed for stage backdrops, engagement setups, and premium focal seating.",
    measurements: "Standard bridal sofa size",
    images: [
      "../images/bridal sofa/IN9A9755.jpg"
    ]
  },
  {
    id: 31,
    name: "Bridal Sofa 7",
    category: "Bridal Sofa",
    shortDescription: "Elegant bridal sofa designed for stage backdrops, engagement setups, and premium focal seating.",
    measurements: "Standard bridal sofa size",
    images: [
      "../images/bridal sofa/IN9A9806.jpg"
    ]
  },
  {
    id: 32,
    name: "Bridal Sofa 8",
    category: "Bridal Sofa",
    shortDescription: "Elegant bridal sofa designed for stage backdrops, engagement setups, and premium focal seating.",
    measurements: "Standard bridal sofa size",
    images: [
      "../images/bridal sofa/IN9A9808.jpg"
    ]
  },
  {
    id: 33,
    name: "Bridal Sofa 9",
    category: "Bridal Sofa",
    shortDescription: "Elegant bridal sofa designed for stage backdrops, engagement setups, and premium focal seating.",
    measurements: "Standard bridal sofa size",
    images: [
      "../images/bridal sofa/IN9A9852.JPG"
    ]
  },
  {
    id: 34,
    name: "Bridal Sofa 10",
    category: "Bridal Sofa",
    shortDescription: "Elegant bridal sofa designed for stage backdrops, engagement setups, and premium focal seating.",
    measurements: "Standard bridal sofa size",
    images: [
      "../images/bridal sofa/IN9A9854.JPG"
    ]
  },
  {
    id: 35,
    name: "Bridal Sofa 11",
    category: "Bridal Sofa",
    shortDescription: "Elegant bridal sofa designed for stage backdrops, engagement setups, and premium focal seating.",
    measurements: "Standard bridal sofa size",
    images: [
      "../images/bridal sofa/IN9A9859.JPG"
    ]
  },
  {
    id: 36,
    name: "Bridal Sofa 12",
    category: "Bridal Sofa",
    shortDescription: "Elegant bridal sofa designed for stage backdrops, engagement setups, and premium focal seating.",
    measurements: "Standard bridal sofa size",
    images: [
      "../images/bridal sofa/IN9A9861.JPG"
    ]
  },
  {
    id: 37,
    name: "Bridal Sofa 13",
    category: "Bridal Sofa",
    shortDescription: "Elegant bridal sofa designed for stage backdrops, engagement setups, and premium focal seating.",
    measurements: "Standard bridal sofa size",
    images: [
      "../images/bridal sofa/IN9A9863.JPG"
    ]
  },
  {
    id: 38,
    name: "Bridal Sofa 14",
    category: "Bridal Sofa",
    shortDescription: "Elegant bridal sofa designed for stage backdrops, engagement setups, and premium focal seating.",
    measurements: "Standard bridal sofa size",
    images: [
      "../images/bridal sofa/IN9A9865.JPG"
    ]
  },
  {
    id: 39,
    name: "Bridal Sofa 15",
    category: "Bridal Sofa",
    shortDescription: "Elegant bridal sofa designed for stage backdrops, engagement setups, and premium focal seating.",
    measurements: "Standard bridal sofa size",
    images: [
      "../images/bridal sofa/IN9A9869.JPG"
    ]
  },
  {
    id: 40,
    name: "Bridal Sofa 16",
    category: "Bridal Sofa",
    shortDescription: "Elegant bridal sofa designed for stage backdrops, engagement setups, and premium focal seating.",
    measurements: "Standard bridal sofa size",
    images: [
      "../images/bridal sofa/IN9A9870.JPG"
    ]
  },
  {
    id: 41,
    name: "Bridal Sofa 17",
    category: "Bridal Sofa",
    shortDescription: "Elegant bridal sofa designed for stage backdrops, engagement setups, and premium focal seating.",
    measurements: "Standard bridal sofa size",
    images: [
      "../images/bridal sofa/IN9A9873.JPG"
    ]
  },
  {
    id: 42,
    name: "Bridal Sofa 18",
    category: "Bridal Sofa",
    shortDescription: "Elegant bridal sofa designed for stage backdrops, engagement setups, and premium focal seating.",
    measurements: "Standard bridal sofa size",
    images: [
      "../images/bridal sofa/IN9A9875.JPG"
    ]
  },
  {
    id: 43,
    name: "Bridal Sofa 19",
    category: "Bridal Sofa",
    shortDescription: "Elegant bridal sofa designed for stage backdrops, engagement setups, and premium focal seating.",
    measurements: "Standard bridal sofa size",
    images: [
      "../images/bridal sofa/IN9A9876.JPG"
    ]
  },
  {
    id: 44,
    name: "Bridal Sofa 20",
    category: "Bridal Sofa",
    shortDescription: "Elegant bridal sofa designed for stage backdrops, engagement setups, and premium focal seating.",
    measurements: "Standard bridal sofa size",
    images: [
      "../images/bridal sofa/IN9A9901.JPG"
    ]
  },
  {
    id: 45,
    name: "Bridal Sofa 21",
    category: "Bridal Sofa",
    shortDescription: "Elegant bridal sofa designed for stage backdrops, engagement setups, and premium focal seating.",
    measurements: "Standard bridal sofa size",
    images: [
      "../images/bridal sofa/IN9A9903.JPG"
    ]
  },
  {
    id: 46,
    name: "Bridal Sofa 22",
    category: "Bridal Sofa",
    shortDescription: "Elegant bridal sofa designed for stage backdrops, engagement setups, and premium focal seating.",
    measurements: "Standard bridal sofa size",
    images: [
      "../images/bridal sofa/IN9A9906.JPG"
    ]
  },
  {
    id: 47,
    name: "Bridal Sofa 23",
    category: "Bridal Sofa",
    shortDescription: "Elegant bridal sofa designed for stage backdrops, engagement setups, and premium focal seating.",
    measurements: "Standard bridal sofa size",
    images: [
      "../images/bridal sofa/IN9A9909.JPG"
    ]
  },
  {
    id: 48,
    name: "Bridal Sofa 24",
    category: "Bridal Sofa",
    shortDescription: "Elegant bridal sofa designed for stage backdrops, engagement setups, and premium focal seating.",
    measurements: "Standard bridal sofa size",
    images: [
      "../images/bridal sofa/IN9A9912.JPG"
    ]
  },
  {
    id: 49,
    name: "Bridal Sofa 25",
    category: "Bridal Sofa",
    shortDescription: "Elegant bridal sofa designed for stage backdrops, engagement setups, and premium focal seating.",
    measurements: "Standard bridal sofa size",
    images: [
      "../images/bridal sofa/IN9A9914.JPG"
    ]
  },
  {
    id: 50,
    name: "Bridal Sofa 26",
    category: "Bridal Sofa",
    shortDescription: "Elegant bridal sofa designed for stage backdrops, engagement setups, and premium focal seating.",
    measurements: "Standard bridal sofa size",
    images: [
      "../images/bridal sofa/IN9A9917.JPG"
    ]
  },
  {
    id: 51,
    name: "Bridal Sofa 27",
    category: "Bridal Sofa",
    shortDescription: "Elegant bridal sofa designed for stage backdrops, engagement setups, and premium focal seating.",
    measurements: "Standard bridal sofa size",
    images: [
      "../images/bridal sofa/IN9A9919.jpg"
    ]
  },
  {
    id: 52,
    name: "Bridal Sofa 28",
    category: "Bridal Sofa",
    shortDescription: "Elegant bridal sofa designed for stage backdrops, engagement setups, and premium focal seating.",
    measurements: "Standard bridal sofa size",
    images: [
      "../images/bridal sofa/IN9A9929.JPG"
    ]
  },
  {
    id: 53,
    name: "Bridal Sofa 29",
    category: "Bridal Sofa",
    shortDescription: "Elegant bridal sofa designed for stage backdrops, engagement setups, and premium focal seating.",
    measurements: "Standard bridal sofa size",
    images: [
      "../images/bridal sofa/IN9A9932.JPG"
    ]
  },
  {
    id: 54,
    name: "Bridal Sofa 30",
    category: "Bridal Sofa",
    shortDescription: "Elegant bridal sofa designed for stage backdrops, engagement setups, and premium focal seating.",
    measurements: "Standard bridal sofa size",
    images: [
      "../images/bridal sofa/IN9A9936.JPG"
    ]
  },
  {
    id: 55,
    name: "Bridal Sofa 31",
    category: "Bridal Sofa",
    shortDescription: "Elegant bridal sofa designed for stage backdrops, engagement setups, and premium focal seating.",
    measurements: "Standard bridal sofa size",
    images: [
      "../images/bridal sofa/IN9A9937.JPG"
    ]
  },
  {
    id: 56,
    name: "Bridal Sofa 32",
    category: "Bridal Sofa",
    shortDescription: "Elegant bridal sofa designed for stage backdrops, engagement setups, and premium focal seating.",
    measurements: "Standard bridal sofa size",
    images: [
      "../images/bridal sofa/IN9A9941.JPG"
    ]
  },
  {
    id: 57,
    name: "Bridal Sofa 33",
    category: "Bridal Sofa",
    shortDescription: "Elegant bridal sofa designed for stage backdrops, engagement setups, and premium focal seating.",
    measurements: "Standard bridal sofa size",
    images: [
      "../images/bridal sofa/IN9A9944.JPG"
    ]
  },
  {
    id: 58,
    name: "Bridal Sofa 34",
    category: "Bridal Sofa",
    shortDescription: "Elegant bridal sofa designed for stage backdrops, engagement setups, and premium focal seating.",
    measurements: "Standard bridal sofa size",
    images: [
      "../images/bridal sofa/IN9A9946.JPG"
    ]
  },
  {
    id: 59,
    name: "Bridal Sofa 35",
    category: "Bridal Sofa",
    shortDescription: "Elegant bridal sofa designed for stage backdrops, engagement setups, and premium focal seating.",
    measurements: "Standard bridal sofa size",
    images: [
      "../images/bridal sofa/IN9A9963.JPG"
    ]
  },
  {
    id: 60,
    name: "Bridal Sofa 36",
    category: "Bridal Sofa",
    shortDescription: "Elegant bridal sofa designed for stage backdrops, engagement setups, and premium focal seating.",
    measurements: "Standard bridal sofa size",
    images: [
      "../images/bridal sofa/IN9A9977.JPG"
    ]
  },
  {
    id: 61,
    name: "Bridal Sofa 37",
    category: "Bridal Sofa",
    shortDescription: "Elegant bridal sofa designed for stage backdrops, engagement setups, and premium focal seating.",
    measurements: "Standard bridal sofa size",
    images: [
      "../images/bridal sofa/IN9A9979.JPG"
    ]
  },
  {
    id: 62,
    name: "Bridal Sofa 38",
    category: "Bridal Sofa",
    shortDescription: "Elegant bridal sofa designed for stage backdrops, engagement setups, and premium focal seating.",
    measurements: "Standard bridal sofa size",
    images: [
      "../images/bridal sofa/IN9A9980.JPG"
    ]
  },
  {
    id: 63,
    name: "Bridal Sofa 39",
    category: "Bridal Sofa",
    shortDescription: "Elegant bridal sofa designed for stage backdrops, engagement setups, and premium focal seating.",
    measurements: "Standard bridal sofa size",
    images: [
      "../images/bridal sofa/IN9A9982.JPG"
    ]
  },
  {
    id: 64,
    name: "Bridal Sofa 40",
    category: "Bridal Sofa",
    shortDescription: "Elegant bridal sofa designed for stage backdrops, engagement setups, and premium focal seating.",
    measurements: "Standard bridal sofa size",
    images: [
      "../images/bridal sofa/IN9A9986.JPG"
    ]
  },
  {
    id: 65,
    name: "Bridal Sofa 41",
    category: "Bridal Sofa",
    shortDescription: "Elegant bridal sofa designed for stage backdrops, engagement setups, and premium focal seating.",
    measurements: "Standard bridal sofa size",
    images: [
      "../images/bridal sofa/IN9A9987.JPG"
    ]
  },
  {
    id: 66,
    name: "Bridal Sofa 42",
    category: "Bridal Sofa",
    shortDescription: "Elegant bridal sofa designed for stage backdrops, engagement setups, and premium focal seating.",
    measurements: "Standard bridal sofa size",
    images: [
      "../images/bridal sofa/IN9A9992.JPG"
    ]
  },
  {
    id: 67,
    name: "Bridal Sofa 43",
    category: "Bridal Sofa",
    shortDescription: "Elegant bridal sofa designed for stage backdrops, engagement setups, and premium focal seating.",
    measurements: "Standard bridal sofa size",
    images: [
      "../images/bridal sofa/IN9A9994.JPG"
    ]
  },
  {
    id: 68,
    name: "Bridal Sofa 44",
    category: "Bridal Sofa",
    shortDescription: "Elegant bridal sofa designed for stage backdrops, engagement setups, and premium focal seating.",
    measurements: "Standard bridal sofa size",
    images: [
      "../images/bridal sofa/IN9A9997.JPG"
    ]
  },
  {
    id: 6,
    name: "Coffee Table 1",
    category: "Coffee Table",
    shortDescription: "Elegant coffee table suited for lounge scenes, bridal stages, and refined hospitality layouts.",
    measurements: "Standard event coffee table size",
    images: [
      "../images/coffe tables/IN9A0001.JPG"
    ]
  },
  {
    id: 91,
    name: "Coffee Table 2",
    category: "Coffee Table",
    shortDescription: "Elegant coffee table suited for lounge scenes, bridal stages, and refined hospitality layouts.",
    measurements: "Standard event coffee table size",
    images: [
      "../images/coffe tables/IN9A0002.JPG"
    ]
  },
  {
    id: 92,
    name: "Coffee Table 3",
    category: "Coffee Table",
    shortDescription: "Elegant coffee table suited for lounge scenes, bridal stages, and refined hospitality layouts.",
    measurements: "Standard event coffee table size",
    images: [
      "../images/coffe tables/IN9A0004.JPG"
    ]
  },
  {
    id: 93,
    name: "Coffee Table 4",
    category: "Coffee Table",
    shortDescription: "Elegant coffee table suited for lounge scenes, bridal stages, and refined hospitality layouts.",
    measurements: "Standard event coffee table size",
    images: [
      "../images/coffe tables/IN9A0006.JPG"
    ]
  },
  {
    id: 95,
    name: "Coffee Table 6",
    category: "Coffee Table",
    shortDescription: "Elegant coffee table suited for lounge scenes, bridal stages, and refined hospitality layouts.",
    measurements: "Standard event coffee table size",
    images: [
      "../images/coffe tables/IN9A0009.JPG"
    ]
  },
  {
    id: 96,
    name: "Coffee Table 7",
    category: "Coffee Table",
    shortDescription: "Elegant coffee table suited for lounge scenes, bridal stages, and refined hospitality layouts.",
    measurements: "Standard event coffee table size",
    images: [
      "../images/coffe tables/IN9A0010.JPG"
    ]
  },
  {
    id: 97,
    name: "Coffee Table 8",
    category: "Coffee Table",
    shortDescription: "Elegant coffee table suited for lounge scenes, bridal stages, and refined hospitality layouts.",
    measurements: "Standard event coffee table size",
    images: [
      "../images/coffe tables/IN9A0011.JPG"
    ]
  },
  {
    id: 98,
    name: "Coffee Table 9",
    category: "Coffee Table",
    shortDescription: "Elegant coffee table suited for lounge scenes, bridal stages, and refined hospitality layouts.",
    measurements: "Standard event coffee table size",
    images: [
      "../images/coffe tables/IN9A0012.JPG"
    ]
  },
  {
    id: 99,
    name: "Coffee Table 10",
    category: "Coffee Table",
    shortDescription: "Elegant coffee table suited for lounge scenes, bridal stages, and refined hospitality layouts.",
    measurements: "Standard event coffee table size",
    images: [
      "../images/coffe tables/IN9A0013.JPG"
    ]
  },
  {
    id: 100,
    name: "Coffee Table 11",
    category: "Coffee Table",
    shortDescription: "Elegant coffee table suited for lounge scenes, bridal stages, and refined hospitality layouts.",
    measurements: "Standard event coffee table size",
    images: [
      "../images/coffe tables/IN9A0014.JPG"
    ]
  },
  {
    id: 101,
    name: "Coffee Table 12",
    category: "Coffee Table",
    shortDescription: "Elegant coffee table suited for lounge scenes, bridal stages, and refined hospitality layouts.",
    measurements: "Standard event coffee table size",
    images: [
      "../images/coffe tables/IN9A0016.JPG"
    ]
  },
  {
    id: 102,
    name: "Coffee Table 13",
    category: "Coffee Table",
    shortDescription: "Elegant coffee table suited for lounge scenes, bridal stages, and refined hospitality layouts.",
    measurements: "Standard event coffee table size",
    images: [
      "../images/coffe tables/IN9A0017.JPG"
    ]
  },
  {
    id: 103,
    name: "Coffee Table 14",
    category: "Coffee Table",
    shortDescription: "Elegant coffee table suited for lounge scenes, bridal stages, and refined hospitality layouts.",
    measurements: "Standard event coffee table size",
    images: [
      "../images/coffe tables/IN9A0040.JPG"
    ]
  },
  {
    id: 104,
    name: "Coffee Table 15",
    category: "Coffee Table",
    shortDescription: "Elegant coffee table suited for lounge scenes, bridal stages, and refined hospitality layouts.",
    measurements: "Standard event coffee table size",
    images: [
      "../images/coffe tables/IN9A0042.JPG"
    ]
  },
  {
    id: 105,
    name: "Coffee Table 16",
    category: "Coffee Table",
    shortDescription: "Elegant coffee table suited for lounge scenes, bridal stages, and refined hospitality layouts.",
    measurements: "Standard event coffee table size",
    images: [
      "../images/coffe tables/IN9A0043.JPG"
    ]
  },
  {
    id: 106,
    name: "Coffee Table 17",
    category: "Coffee Table",
    shortDescription: "Elegant coffee table suited for lounge scenes, bridal stages, and refined hospitality layouts.",
    measurements: "Standard event coffee table size",
    images: [
      "../images/coffe tables/IN9A0044.JPG"
    ]
  },
  {
    id: 107,
    name: "Coffee Table 18",
    category: "Coffee Table",
    shortDescription: "Elegant coffee table suited for lounge scenes, bridal stages, and refined hospitality layouts.",
    measurements: "Standard event coffee table size",
    images: [
      "../images/coffe tables/IN9A0045.JPG"
    ]
  },
  {
    id: 108,
    name: "Coffee Table 19",
    category: "Coffee Table",
    shortDescription: "Elegant coffee table suited for lounge scenes, bridal stages, and refined hospitality layouts.",
    measurements: "Standard event coffee table size",
    images: [
      "../images/coffe tables/IN9A0048.JPG"
    ]
  },
  {
    id: 109,
    name: "Coffee Table 20",
    category: "Coffee Table",
    shortDescription: "Elegant coffee table suited for lounge scenes, bridal stages, and refined hospitality layouts.",
    measurements: "Standard event coffee table size",
    images: [
      "../images/coffe tables/IN9A0052.JPG"
    ]
  },
  {
    id: 110,
    name: "Coffee Table 21",
    category: "Coffee Table",
    shortDescription: "Elegant coffee table suited for lounge scenes, bridal stages, and refined hospitality layouts.",
    measurements: "Standard event coffee table size",
    images: [
      "../images/coffe tables/IN9A0054.JPG"
    ]
  },
  {
    id: 111,
    name: "Coffee Table 22",
    category: "Coffee Table",
    shortDescription: "Elegant coffee table suited for lounge scenes, bridal stages, and refined hospitality layouts.",
    measurements: "Standard event coffee table size",
    images: [
      "../images/coffe tables/IN9A9954.JPG"
    ]
  },
  {
    id: 112,
    name: "Coffee Table 23",
    category: "Coffee Table",
    shortDescription: "Elegant coffee table suited for lounge scenes, bridal stages, and refined hospitality layouts.",
    measurements: "Standard event coffee table size",
    images: [
      "../images/coffe tables/IN9A9955.JPG"
    ]
  },
  {
    id: 113,
    name: "Coffee Table 24",
    category: "Coffee Table",
    shortDescription: "Elegant coffee table suited for lounge scenes, bridal stages, and refined hospitality layouts.",
    measurements: "Standard event coffee table size",
    images: [
      "../images/coffe tables/IN9A9958.JPG"
    ]
  },
  {
    id: 114,
    name: "Coffee Table 25",
    category: "Coffee Table",
    shortDescription: "Elegant coffee table suited for lounge scenes, bridal stages, and refined hospitality layouts.",
    measurements: "Standard event coffee table size",
    images: [
      "../images/coffe tables/IN9A9959.JPG"
    ]
  },
  {
    id: 115,
    name: "Coffee Table 26",
    category: "Coffee Table",
    shortDescription: "Elegant coffee table suited for lounge scenes, bridal stages, and refined hospitality layouts.",
    measurements: "Standard event coffee table size",
    images: [
      "../images/coffe tables/IN9A9961.JPG"
    ]
  },
  {
    id: 116,
    name: "Coffee Table 27",
    category: "Coffee Table",
    shortDescription: "Elegant coffee table suited for lounge scenes, bridal stages, and refined hospitality layouts.",
    measurements: "Standard event coffee table size",
    images: [
      "../images/coffe tables/IN9A9965.JPG"
    ]
  },
  {
    id: 117,
    name: "Coffee Table 28",
    category: "Coffee Table",
    shortDescription: "Elegant coffee table suited for lounge scenes, bridal stages, and refined hospitality layouts.",
    measurements: "Standard event coffee table size",
    images: [
      "../images/coffe tables/IN9A9966.JPG"
    ]
  },
  {
    id: 118,
    name: "Coffee Table 29",
    category: "Coffee Table",
    shortDescription: "Elegant coffee table suited for lounge scenes, bridal stages, and refined hospitality layouts.",
    measurements: "Standard event coffee table size",
    images: [
      "../images/coffe tables/IN9A9967.JPG"
    ]
  },
  {
    id: 119,
    name: "Coffee Table 30",
    category: "Coffee Table",
    shortDescription: "Elegant coffee table suited for lounge scenes, bridal stages, and refined hospitality layouts.",
    measurements: "Standard event coffee table size",
    images: [
      "../images/coffe tables/IN9A9968.JPG"
    ]
  },
  {
    id: 120,
    name: "Coffee Table 31",
    category: "Coffee Table",
    shortDescription: "Elegant coffee table suited for lounge scenes, bridal stages, and refined hospitality layouts.",
    measurements: "Standard event coffee table size",
    images: [
      "../images/coffe tables/IN9A9970.JPG"
    ]
  },
  {
    id: 121,
    name: "Coffee Table 32",
    category: "Coffee Table",
    shortDescription: "Elegant coffee table suited for lounge scenes, bridal stages, and refined hospitality layouts.",
    measurements: "Standard event coffee table size",
    images: [
      "../images/coffe tables/IN9A9972.JPG"
    ]
  },
  {
    id: 122,
    name: "Coffee Table 33",
    category: "Coffee Table",
    shortDescription: "Elegant coffee table suited for lounge scenes, bridal stages, and refined hospitality layouts.",
    measurements: "Standard event coffee table size",
    images: [
      "../images/coffe tables/IN9A9974.JPG"
    ]
  },
  {
    id: 123,
    name: "Coffee Table 34",
    category: "Coffee Table",
    shortDescription: "Elegant coffee table suited for lounge scenes, bridal stages, and refined hospitality layouts.",
    measurements: "Standard event coffee table size",
    images: [
      "../images/coffe tables/IN9A9975.JPG"
    ]
  },
  {
    id: 124,
    name: "Coffee Table 35",
    category: "Coffee Table",
    shortDescription: "Elegant coffee table suited for lounge scenes, bridal stages, and refined hospitality layouts.",
    measurements: "Standard event coffee table size",
    images: [
      "../images/coffe tables/IN9A9976.JPG"
    ]
  },
  {
    id: 125,
    name: "Coffee Table 36",
    category: "Coffee Table",
    shortDescription: "Elegant coffee table suited for lounge scenes, bridal stages, and refined hospitality layouts.",
    measurements: "Standard event coffee table size",
    images: [
      "../images/coffe tables/IN9A9977.JPG"
    ]
  },
  {
    id: 126,
    name: "Coffee Table 37",
    category: "Coffee Table",
    shortDescription: "Elegant coffee table suited for lounge scenes, bridal stages, and refined hospitality layouts.",
    measurements: "Standard event coffee table size",
    images: [
      "../images/coffe tables/IN9A9979.JPG"
    ]
  },
  {
    id: 127,
    name: "Coffee Table 38",
    category: "Coffee Table",
    shortDescription: "Elegant coffee table suited for lounge scenes, bridal stages, and refined hospitality layouts.",
    measurements: "Standard event coffee table size",
    images: [
      "../images/coffe tables/IN9A9981.JPG"
    ]
  },
  {
    id: 128,
    name: "Coffee Table 39",
    category: "Coffee Table",
    shortDescription: "Elegant coffee table suited for lounge scenes, bridal stages, and refined hospitality layouts.",
    measurements: "Standard event coffee table size",
    images: [
      "../images/coffe tables/IN9A9983.JPG"
    ]
  },
  {
    id: 129,
    name: "Coffee Table 40",
    category: "Coffee Table",
    shortDescription: "Elegant coffee table suited for lounge scenes, bridal stages, and refined hospitality layouts.",
    measurements: "Standard event coffee table size",
    images: [
      "../images/coffe tables/IN9A9985.JPG"
    ]
  },
  {
    id: 130,
    name: "Coffee Table 41",
    category: "Coffee Table",
    shortDescription: "Elegant coffee table suited for lounge scenes, bridal stages, and refined hospitality layouts.",
    measurements: "Standard event coffee table size",
    images: [
      "../images/coffe tables/IN9A9987.JPG"
    ]
  },
  {
    id: 131,
    name: "Coffee Table 42",
    category: "Coffee Table",
    shortDescription: "Elegant coffee table suited for lounge scenes, bridal stages, and refined hospitality layouts.",
    measurements: "Standard event coffee table size",
    images: [
      "../images/coffe tables/IN9A9990.JPG"
    ]
  },
  {
    id: 132,
    name: "Coffee Table 43",
    category: "Coffee Table",
    shortDescription: "Elegant coffee table suited for lounge scenes, bridal stages, and refined hospitality layouts.",
    measurements: "Standard event coffee table size",
    images: [
      "../images/coffe tables/IN9A9993.JPG"
    ]
  },
  {
    id: 133,
    name: "Coffee Table 44",
    category: "Coffee Table",
    shortDescription: "Elegant coffee table suited for lounge scenes, bridal stages, and refined hospitality layouts.",
    measurements: "Standard event coffee table size",
    images: [
      "../images/coffe tables/IN9A9994.JPG"
    ]
  },
  {
    id: 134,
    name: "Coffee Table 45",
    category: "Coffee Table",
    shortDescription: "Elegant coffee table suited for lounge scenes, bridal stages, and refined hospitality layouts.",
    measurements: "Standard event coffee table size",
    images: [
      "../images/coffe tables/IN9A9996.JPG"
    ]
  },
  {
    id: 7,
    name: "Cocktail Table 1",
    category: "Cocktail Table",
    shortDescription: "Refined cocktail table ideal for receptions, standing arrangements, and premium guest flow.",
    measurements: "Standard event cocktail table size",
    images: [
      "../images/cocktail table/IN9A9972.JPG"
    ]
  },
  {
    id: 135,
    name: "Cocktail Table 2",
    category: "Cocktail Table",
    shortDescription: "Refined cocktail table ideal for receptions, standing arrangements, and premium guest flow.",
    measurements: "Standard event cocktail table size",
    images: [
      "../images/cocktail table/IN9A9989.JPG"
    ]
  },
  {
    id: 8,
    name: "Sofa 1",
    category: "Majlis Sofa",
    shortDescription: "Refined sofa seating for lounge layouts, hospitality spaces, and premium event settings.",
    measurements: "Standard event sofa size",
    images: [
      "../images/sofa/IN9A0006.jpg"
    ]
  },
  {
    id: 69,
    name: "Sofa 2",
    category: "Majlis Sofa",
    shortDescription: "Refined sofa seating for lounge layouts, hospitality spaces, and premium event settings.",
    measurements: "Standard event sofa size",
    images: [
      "../images/sofa/IN9A9554.JPG"
    ]
  },
  {
    id: 70,
    name: "Sofa 3",
    category: "Majlis Sofa",
    shortDescription: "Refined sofa seating for lounge layouts, hospitality spaces, and premium event settings.",
    measurements: "Standard event sofa size",
    images: [
      "../images/sofa/IN9A9556.JPG"
    ]
  },
  {
    id: 71,
    name: "Sofa 4",
    category: "Majlis Sofa",
    shortDescription: "Refined sofa seating for lounge layouts, hospitality spaces, and premium event settings.",
    measurements: "Standard event sofa size",
    images: [
      "../images/sofa/IN9A9570.JPG"
    ]
  },
  {
    id: 72,
    name: "Sofa 5",
    category: "Majlis Sofa",
    shortDescription: "Refined sofa seating for lounge layouts, hospitality spaces, and premium event settings.",
    measurements: "Standard event sofa size",
    images: [
      "../images/sofa/IN9A9572.JPG"
    ]
  },
  {
    id: 73,
    name: "Sofa 6",
    category: "Majlis Sofa",
    shortDescription: "Refined sofa seating for lounge layouts, hospitality spaces, and premium event settings.",
    measurements: "Standard event sofa size",
    images: [
      "../images/sofa/IN9A9580.JPG"
    ]
  },
  {
    id: 74,
    name: "Sofa 7",
    category: "Majlis Sofa",
    shortDescription: "Refined sofa seating for lounge layouts, hospitality spaces, and premium event settings.",
    measurements: "Standard event sofa size",
    images: [
      "../images/sofa/IN9A9631.JPG"
    ]
  },
  {
    id: 75,
    name: "Sofa 8",
    category: "Majlis Sofa",
    shortDescription: "Refined sofa seating for lounge layouts, hospitality spaces, and premium event settings.",
    measurements: "Standard event sofa size",
    images: [
      "../images/sofa/IN9A9641.JPG"
    ]
  },
  {
    id: 76,
    name: "Sofa 9",
    category: "Majlis Sofa",
    shortDescription: "Refined sofa seating for lounge layouts, hospitality spaces, and premium event settings.",
    measurements: "Standard event sofa size",
    images: [
      "../images/sofa/IN9A9662.JPG"
    ]
  },
  {
    id: 77,
    name: "Sofa 10",
    category: "Majlis Sofa",
    shortDescription: "Refined sofa seating for lounge layouts, hospitality spaces, and premium event settings.",
    measurements: "Standard event sofa size",
    images: [
      "../images/sofa/IN9A9789.jpg"
    ]
  },
  {
    id: 78,
    name: "Sofa 11",
    category: "Majlis Sofa",
    shortDescription: "Refined sofa seating for lounge layouts, hospitality spaces, and premium event settings.",
    measurements: "Standard event sofa size",
    images: [
      "../images/sofa/IN9A9855.JPG"
    ]
  },
  {
    id: 79,
    name: "Sofa 12",
    category: "Majlis Sofa",
    shortDescription: "Refined sofa seating for lounge layouts, hospitality spaces, and premium event settings.",
    measurements: "Standard event sofa size",
    images: [
      "../images/sofa/IN9A9881.JPG"
    ]
  },
  {
    id: 80,
    name: "Sofa 13",
    category: "Majlis Sofa",
    shortDescription: "Refined sofa seating for lounge layouts, hospitality spaces, and premium event settings.",
    measurements: "Standard event sofa size",
    images: [
      "../images/sofa/IN9A9885.JPG"
    ]
  },
  {
    id: 81,
    name: "Sofa 14",
    category: "Majlis Sofa",
    shortDescription: "Refined sofa seating for lounge layouts, hospitality spaces, and premium event settings.",
    measurements: "Standard event sofa size",
    images: [
      "../images/sofa/IN9A9889.JPG"
    ]
  },
  {
    id: 82,
    name: "Sofa 15",
    category: "Majlis Sofa",
    shortDescription: "Refined sofa seating for lounge layouts, hospitality spaces, and premium event settings.",
    measurements: "Standard event sofa size",
    images: [
      "../images/sofa/IN9A9893.JPG"
    ]
  },
  {
    id: 83,
    name: "Sofa 16",
    category: "Majlis Sofa",
    shortDescription: "Refined sofa seating for lounge layouts, hospitality spaces, and premium event settings.",
    measurements: "Standard event sofa size",
    images: [
      "../images/sofa/IN9A9897.JPG"
    ]
  },
  {
    id: 84,
    name: "Sofa 17",
    category: "Majlis Sofa",
    shortDescription: "Refined sofa seating for lounge layouts, hospitality spaces, and premium event settings.",
    measurements: "Standard event sofa size",
    images: [
      "../images/sofa/IN9A9951.JPG"
    ]
  },
  {
    id: 85,
    name: "Sofa 18",
    category: "Majlis Sofa",
    shortDescription: "Refined sofa seating for lounge layouts, hospitality spaces, and premium event settings.",
    measurements: "Standard event sofa size",
    images: [
      "../images/sofa/IN9A9953.JPG"
    ]
  },
  {
    id: 86,
    name: "Sofa 19",
    category: "Majlis Sofa",
    shortDescription: "Refined sofa seating for lounge layouts, hospitality spaces, and premium event settings.",
    measurements: "Standard event sofa size",
    images: [
      "../images/sofa/IN9A9954.JPG"
    ]
  },
  {
    id: 87,
    name: "Sofa 20",
    category: "Majlis Sofa",
    shortDescription: "Refined sofa seating for lounge layouts, hospitality spaces, and premium event settings.",
    measurements: "Standard event sofa size",
    images: [
      "../images/sofa/IN9A9966.JPG"
    ]
  },
  {
    id: 88,
    name: "Sofa 21",
    category: "Majlis Sofa",
    shortDescription: "Refined sofa seating for lounge layouts, hospitality spaces, and premium event settings.",
    measurements: "Standard event sofa size",
    images: [
      "../images/sofa/IN9A9967.JPG"
    ]
  },
  {
    id: 89,
    name: "Sofa 22",
    category: "Majlis Sofa",
    shortDescription: "Refined sofa seating for lounge layouts, hospitality spaces, and premium event settings.",
    measurements: "Standard event sofa size",
    images: [
      "../images/sofa/IN9A9971.JPG"
    ]
  },
  {
    id: 90,
    name: "Sofa 23",
    category: "Majlis Sofa",
    shortDescription: "Refined sofa seating for lounge layouts, hospitality spaces, and premium event settings.",
    measurements: "Standard event sofa size",
    images: [
      "../images/sofa/IN9A9973.JPG"
    ]
  }
];
