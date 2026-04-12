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
    name: "Round Dining Table",
    category: "Dining Tables",
    shortDescription: "Elegant round dining table suitable for weddings and refined formal setups.",
    measurements: "Approx. 150 cm diameter",
    images: [
      "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=800&q=80"
    ]
  },
  {
    id: 2,
    name: "Rectangular Dining Table",
    category: "Dining Tables",
    shortDescription: "Versatile dining table for buffet layouts, banquet seating, and large gatherings.",
    measurements: "Approx. 180 x 75 cm",
    images: [
      "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=800&q=80"
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
    name: "Bridal Sofa",
    category: "Bridal Sofa",
    shortDescription: "Statement bridal sofa designed for stage backdrops, engagement setups, and VIP seating.",
    measurements: "Approx. 190 x 85 cm",
    images: [
      buildCatalogPlaceholderImage("Bridal Sofa")
    ]
  },
  {
    id: 6,
    name: "Coffee Table",
    category: "Coffee Table",
    shortDescription: "Low-profile accent table ideal for lounge scenes, bridal stages, and welcome areas.",
    measurements: "Approx. 100 x 55 cm",
    images: [
      buildCatalogPlaceholderImage("Coffee Table")
    ]
  },
  {
    id: 7,
    name: "Cocktail Table",
    category: "Cocktail Table",
    shortDescription: "Tall cocktail table suited for receptions, mingling spaces, and elegant standing arrangements.",
    measurements: "Approx. 75 cm diameter x 110 cm height",
    images: [
      buildCatalogPlaceholderImage("Cocktail Table")
    ]
  },
  {
    id: 8,
    name: "Majlis Sofa",
    category: "Majlis Sofa",
    shortDescription: "Traditional majlis-inspired sofa for cultural seating layouts and premium hospitality spaces.",
    measurements: "Approx. 210 x 90 cm",
    images: [
      buildCatalogPlaceholderImage("Majlis Sofa")
    ]
  }
];
