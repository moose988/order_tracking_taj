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
    shortDescription: "Elegant dining tables for weddings, galas, and refined gatherings.",
    measurements: "Standard event dining table size",
    images: [
      "../images/dinning tables/IN9A0010.JPG"
    ]
  },
  {
    id: 2,
    name: "Dining Table 2",
    category: "Dining Tables",
    shortDescription: "Elegant dining tables for weddings, galas, and refined gatherings.",
    measurements: "Standard event dining table size",
    images: [
      "../images/dinning tables/IN9A0013.JPG"
    ]
  },
  {
    id: 9,
    name: "Dining Table 3",
    category: "Dining Tables",
    shortDescription: "Elegant dining tables for weddings, galas, and refined gatherings.",
    measurements: "Standard event dining table size",
    images: [
      "../images/dinning tables/IN9A0020.JPG"
    ]
  },
  {
    id: 10,
    name: "Dining Table 4",
    category: "Dining Tables",
    shortDescription: "Elegant dining tables for weddings, galas, and refined gatherings.",
    measurements: "Standard event dining table size",
    images: [
      "../images/dinning tables/IN9A0021.JPG"
    ]
  },
  {
    id: 11,
    name: "Dining Table 5",
    category: "Dining Tables",
    shortDescription: "Elegant dining tables for weddings, galas, and refined gatherings.",
    measurements: "Standard event dining table size",
    images: [
      "../images/dinning tables/IN9A0022.JPG"
    ]
  },
  {
    id: 12,
    name: "Dining Table 6",
    category: "Dining Tables",
    shortDescription: "Elegant dining tables for weddings, galas, and refined gatherings.",
    measurements: "Standard event dining table size",
    images: [
      "../images/dinning tables/IN9A0027.JPG"
    ]
  },
  {
    id: 13,
    name: "Dining Table 7",
    category: "Dining Tables",
    shortDescription: "Elegant dining tables for weddings, galas, and refined gatherings.",
    measurements: "Standard event dining table size",
    images: [
      "../images/dinning tables/IN9A0032.JPG"
    ]
  },
  {
    id: 14,
    name: "Dining Table 8",
    category: "Dining Tables",
    shortDescription: "Elegant dining tables for weddings, galas, and refined gatherings.",
    measurements: "Standard event dining table size",
    images: [
      "../images/dinning tables/IN9A0036.JPG"
    ]
  },
  {
    id: 15,
    name: "Dining Table 9",
    category: "Dining Tables",
    shortDescription: "Elegant dining tables for weddings, galas, and refined gatherings.",
    measurements: "Standard event dining table size",
    images: [
      "../images/dinning tables/IN9A0039.JPG"
    ]
  },
  {
    id: 16,
    name: "Dining Table 10",
    category: "Dining Tables",
    shortDescription: "Elegant dining tables for weddings, galas, and refined gatherings.",
    measurements: "Standard event dining table size",
    images: [
      "../images/dinning tables/IN9A0060.JPG"
    ]
  },
  {
    id: 17,
    name: "Dining Table 11",
    category: "Dining Tables",
    shortDescription: "Elegant dining tables for weddings, galas, and refined gatherings.",
    measurements: "Standard event dining table size",
    images: [
      "../images/dinning tables/IN9A9831.JPG"
    ]
  },
  {
    id: 18,
    name: "Dining Table 12",
    category: "Dining Tables",
    shortDescription: "Elegant dining tables for weddings, galas, and refined gatherings.",
    measurements: "Standard event dining table size",
    images: [
      "../images/dinning tables/IN9A9837.JPG"
    ]
  },
  {
    id: 19,
    name: "Dining Table 13",
    category: "Dining Tables",
    shortDescription: "Elegant dining tables for weddings, galas, and refined gatherings.",
    measurements: "Standard event dining table size",
    images: [
      "../images/dinning tables/IN9A9839.JPG"
    ]
  },
  {
    id: 20,
    name: "Dining Table 14",
    category: "Dining Tables",
    shortDescription: "Elegant dining tables for weddings, galas, and refined gatherings.",
    measurements: "Standard event dining table size",
    images: [
      "../images/dinning tables/IN9A9843.JPG"
    ]
  },
  {
    id: 21,
    name: "Dining Table 15",
    category: "Dining Tables",
    shortDescription: "Elegant dining tables for weddings, galas, and refined gatherings.",
    measurements: "Standard event dining table size",
    images: [
      "../images/dinning tables/IN9A9845.JPG"
    ]
  },
  {
    id: 22,
    name: "Dining Table 16",
    category: "Dining Tables",
    shortDescription: "Elegant dining tables for weddings, galas, and refined gatherings.",
    measurements: "Standard event dining table size",
    images: [
      "../images/dinning tables/IN9A9846.JPG"
    ]
  },
  {
    id: 23,
    name: "Dining Table 17",
    category: "Dining Tables",
    shortDescription: "Elegant dining tables for weddings, galas, and refined gatherings.",
    measurements: "Standard event dining table size",
    images: [
      "../images/dinning tables/IN9A9850.JPG"
    ]
  },
  {
    id: 24,
    name: "Dining Table 18",
    category: "Dining Tables",
    shortDescription: "Elegant dining tables for weddings, galas, and refined gatherings.",
    measurements: "Standard event dining table size",
    images: [
      "../images/dinning tables/IN9A9950.JPG"
    ]
  },
  {
    id: 25,
    name: "Dining Table 19",
    category: "Dining Tables",
    shortDescription: "Elegant dining tables for weddings, galas, and refined gatherings.",
    measurements: "Standard event dining table size",
    images: [
      "../images/dinning tables/IN9A9952.JPG"
    ]
  },
  {
    id: 3,
    name: "Chair 1",
    category: "Chairs",
    shortDescription: "Refined seating for elegant events and premium guest arrangements.",
    measurements: "Standard event chair size",
    images: [
      "../images/chairs/11360308/1- new chair\uf028/CW4A4321 copy-.jpg",
      "../images/chairs/11360308/1- new chair\uf028/CW4A4325 copy.jpg",
      "../images/chairs/11360308/1- new chair\uf028/CW4A4323 copy.jpg"
    ]
  },
  {
    id: 4,
    name: "Chair 2",
    category: "Chairs",
    shortDescription: "Refined seating for elegant events and premium guest arrangements.",
    measurements: "Standard event chair size",
    images: [
      "../images/chairs/11360308/2\uf028/CW4A4333 copy.jpg",
      "../images/chairs/11360308/2\uf028/CW4A4335 copy.jpg",
      "../images/chairs/11360308/2\uf028/CW4A4332 copy.jpg"
    ]
  },
  {
    id: 136,
    name: "Chair 3",
    category: "Chairs",
    shortDescription: "Refined seating for elegant events and premium guest arrangements.",
    measurements: "Standard event chair size",
    images: [
      "../images/chairs/11360308/3/CW4A4336 copy.jpg",
      "../images/chairs/11360308/3/CW4A4339 copy.jpg",
      "../images/chairs/11360308/3/CW4A4340 copy.jpg"
    ]
  },
  {
    id: 137,
    name: "Chair 4",
    category: "Chairs",
    shortDescription: "Refined seating for elegant events and premium guest arrangements.",
    measurements: "Standard event chair size",
    images: [
      "../images/chairs/11360308/4/CW4A4341 copy.jpg",
      "../images/chairs/11360308/4/CW4A4346 copy.jpg",
      "../images/chairs/11360308/4/CW4A4345-2 copy.jpg"
    ]
  },
  {
    id: 138,
    name: "Chair 5",
    category: "Chairs",
    shortDescription: "Refined seating for elegant events and premium guest arrangements.",
    measurements: "Standard event chair size",
    images: [
      "../images/chairs/11360308/5/CW4A4347 copy.jpg",
      "../images/chairs/11360308/5/CW4A4349 copy.jpg",
      "../images/chairs/11360308/5/CW4A4351 copy.jpg"
    ]
  },
  {
    id: 139,
    name: "Chair 6",
    category: "Chairs",
    shortDescription: "Refined seating for elegant events and premium guest arrangements.",
    measurements: "Standard event chair size",
    images: [
      "../images/chairs/11360308/\u0666/CW4A4352-2 copy.jpg",
      "../images/chairs/11360308/\u0666/CW4A4358.jpg",
      "../images/chairs/11360308/\u0666/CW4A4357 copy.jpg"
    ]
  },
  {
    id: 140,
    name: "Chair 7",
    category: "Chairs",
    shortDescription: "Refined seating for elegant events and premium guest arrangements.",
    measurements: "Standard event chair size",
    images: [
      "../images/chairs/11360308/7/CW4A4360 copy.jpg",
      "../images/chairs/11360308/7/CW4A4362 copy.jpg",
      "../images/chairs/11360308/7/CW4A4363.jpg"
    ]
  },
  {
    id: 141,
    name: "Chair 8",
    category: "Chairs",
    shortDescription: "Refined seating for elegant events and premium guest arrangements.",
    measurements: "Standard event chair size",
    images: [
      "../images/chairs/11360308/8/CW4A4367 copy.jpg",
      "../images/chairs/11360308/8/CW4A4368 copy.jpg",
      "../images/chairs/11360308/8/CW4A4370 copy.jpg"
    ]
  },
  {
    id: 142,
    name: "Chair 9",
    category: "Chairs",
    shortDescription: "Refined seating for elegant events and premium guest arrangements.",
    measurements: "Standard event chair size",
    images: [
      "../images/chairs/11360308/\u0669/CW4A4377 copy.jpg",
      "../images/chairs/11360308/\u0669/CW4A4378 copy.jpg",
      "../images/chairs/11360308/\u0669/CW4A4379 copy.jpg"
    ]
  },
  {
    id: 143,
    name: "Chair 10",
    category: "Chairs",
    shortDescription: "Refined seating for elegant events and premium guest arrangements.",
    measurements: "Standard event chair size",
    images: [
      "../images/chairs/11360308/\u0661\u0660/CW4A4396 copy.jpg",
      "../images/chairs/11360308/\u0661\u0660/CW4A4397 copy.jpg",
      "../images/chairs/11360308/\u0661\u0660/CW4A4399 copy.jpg"
    ]
  },
  {
    id: 144,
    name: "Chair 11",
    category: "Chairs",
    shortDescription: "Refined seating for elegant events and premium guest arrangements.",
    measurements: "Standard event chair size",
    images: [
      "../images/chairs/11360308/11/CW4A4390 copy.jpg",
      "../images/chairs/11360308/11/CW4A4391 copy.jpg",
      "../images/chairs/11360308/11/CW4A4392 copy.jpg"
    ]
  },
  {
    id: 145,
    name: "Chair 12",
    category: "Chairs",
    shortDescription: "Refined seating for elegant events and premium guest arrangements.",
    measurements: "Standard event chair size",
    images: [
      "../images/chairs/11360308/12/CW4A4402 copy.jpg",
      "../images/chairs/11360308/12/CW4A4406 copy.jpg",
      "../images/chairs/11360308/12/CW4A4409 copy.jpg"
    ]
  },
  {
    id: 146,
    name: "Chair 13",
    category: "Chairs",
    shortDescription: "Refined seating for elegant events and premium guest arrangements.",
    measurements: "Standard event chair size",
    images: [
      "../images/chairs/11360308/13/CW4A4605 copy.jpg",
      "../images/chairs/11360308/13/CW4A4607 copy.jpg",
      "../images/chairs/11360308/13/CW4A4609 copy.jpg"
    ]
  },
  {
    id: 147,
    name: "Chair 14",
    category: "Chairs",
    shortDescription: "Refined seating for elegant events and premium guest arrangements.",
    measurements: "Standard event chair size",
    images: [
      "../images/chairs/11360308/14/CW4A4612.jpg",
      "../images/chairs/11360308/14/CW4A4613 copy.jpg",
      "../images/chairs/11360308/14/CW4A4614 copy.jpg"
    ]
  },
  {
    id: 148,
    name: "Chair 15",
    category: "Chairs",
    shortDescription: "Refined seating for elegant events and premium guest arrangements.",
    measurements: "Standard event chair size",
    images: [
      "../images/chairs/11360308/\u0661\u0665/CW4A4383.jpg",
      "../images/chairs/11360308/\u0661\u0665/CW4A4384 copy.jpg",
      "../images/chairs/11360308/\u0661\u0665/CW4A4388 copy.jpg"
    ]
  },
  {
    id: 149,
    name: "Chair 16",
    category: "Chairs",
    shortDescription: "Refined seating for elegant events and premium guest arrangements.",
    measurements: "Standard event chair size",
    images: [
      "../images/chairs/11360308/\u0661\u0666/CW4A4410 copy.jpg",
      "../images/chairs/11360308/\u0661\u0666/CW4A4411 copy.jpg",
      "../images/chairs/11360308/\u0661\u0666/CW4A4412 copy.jpg"
    ]
  },
  {
    id: 150,
    name: "Chair 17",
    category: "Chairs",
    shortDescription: "Refined seating for elegant events and premium guest arrangements.",
    measurements: "Standard event chair size",
    images: [
      "../images/chairs/11360308/\u0661\u0667/CW4A4415 copy.jpg",
      "../images/chairs/11360308/\u0661\u0667/CW4A4416 copy.jpg",
      "../images/chairs/11360308/\u0661\u0667/CW4A4417 copy.jpg"
    ]
  },
  {
    id: 151,
    name: "Chair 18",
    category: "Chairs",
    shortDescription: "Refined seating for elegant events and premium guest arrangements.",
    measurements: "Standard event chair size",
    images: [
      "../images/chairs/11360308/\u0661\u0668/CW4A4424.jpg",
      "../images/chairs/11360308/\u0661\u0668/CW4A4426 copy.jpg",
      "../images/chairs/11360308/\u0661\u0668/CW4A4427 copy.jpg"
    ]
  },
  {
    id: 152,
    name: "Chair 19",
    category: "Chairs",
    shortDescription: "Refined seating for elegant events and premium guest arrangements.",
    measurements: "Standard event chair size",
    images: [
      "../images/chairs/11360308/\u0661\u0669/CW4A4458.jpg",
      "../images/chairs/11360308/\u0661\u0669/CW4A4460 -copy.jpg",
      "../images/chairs/11360308/\u0661\u0669/CW4A4462 copy.jpg"
    ]
  },
  {
    id: 153,
    name: "Chair 20",
    category: "Chairs",
    shortDescription: "Refined seating for elegant events and premium guest arrangements.",
    measurements: "Standard event chair size",
    images: [
      "../images/chairs/11360308/\u0662\u0660/CW4A4475 copy.jpg",
      "../images/chairs/11360308/\u0662\u0660/CW4A4476 copy.jpg",
      "../images/chairs/11360308/\u0662\u0660/CW4A4477-Recovered copy.jpg"
    ]
  },
  {
    id: 154,
    name: "Chair 21",
    category: "Chairs",
    shortDescription: "Refined seating for elegant events and premium guest arrangements.",
    measurements: "Standard event chair size",
    images: [
      "../images/chairs/11360308/\u0662\u0661/CW4A4465 copy.jpg",
      "../images/chairs/11360308/\u0662\u0661/CW4A4467 copy.jpg",
      "../images/chairs/11360308/\u0662\u0661/CW4A4468 copy.jpg"
    ]
  },
  {
    id: 155,
    name: "Chair 22",
    category: "Chairs",
    shortDescription: "Refined seating for elegant events and premium guest arrangements.",
    measurements: "Standard event chair size",
    images: [
      "../images/chairs/11360308/\u0662\u0662/CW4A4479 copy.jpg",
      "../images/chairs/11360308/\u0662\u0662/CW4A4480 copy.jpg",
      "../images/chairs/11360308/\u0662\u0662/CW4A4481 copy.jpg"
    ]
  },
  {
    id: 156,
    name: "Chair 23",
    category: "Chairs",
    shortDescription: "Refined seating for elegant events and premium guest arrangements.",
    measurements: "Standard event chair size",
    images: [
      "../images/chairs/11360308/\u0662\u0663/CW4A4470 copy.jpg",
      "../images/chairs/11360308/\u0662\u0663/CW4A4472.jpg",
      "../images/chairs/11360308/\u0662\u0663/CW4A4473 copy.jpg"
    ]
  },
  {
    id: 157,
    name: "Chair 24",
    category: "Chairs",
    shortDescription: "Refined seating for elegant events and premium guest arrangements.",
    measurements: "Standard event chair size",
    images: [
      "../images/chairs/11360308/\u0662\u0664/CW4A4484 copy.jpg",
      "../images/chairs/11360308/\u0662\u0664/CW4A4486.jpg",
      "../images/chairs/11360308/\u0662\u0664/CW4A4488.jpg"
    ]
  },
  {
    id: 158,
    name: "Chair 25",
    category: "Chairs",
    shortDescription: "Refined seating for elegant events and premium guest arrangements.",
    measurements: "Standard event chair size",
    images: [
      "../images/chairs/11360308/\u0662\u0665/CW4A4490 copy.jpg",
      "../images/chairs/11360308/\u0662\u0665/CW4A4492 copy.jpg",
      "../images/chairs/11360308/\u0662\u0665/CW4A4493 copy.jpg"
    ]
  },
  {
    id: 159,
    name: "Chair 26",
    category: "Chairs",
    shortDescription: "Refined seating for elegant events and premium guest arrangements.",
    measurements: "Standard event chair size",
    images: [
      "../images/chairs/11360308/\u0662\u0666/CW4A4449 copy.jpg",
      "../images/chairs/11360308/\u0662\u0666/CW4A4452 copy.jpg",
      "../images/chairs/11360308/\u0662\u0666/CW4A4453 copy.jpg"
    ]
  },
  {
    id: 160,
    name: "Chair 27",
    category: "Chairs",
    shortDescription: "Refined seating for elegant events and premium guest arrangements.",
    measurements: "Standard event chair size",
    images: [
      "../images/chairs/11360308/\u0662\u0667/CW4A4503-2 copy.jpg",
      "../images/chairs/11360308/\u0662\u0667/CW4A4505 copy.jpg",
      "../images/chairs/11360308/\u0662\u0667/CW4A4507 copy.jpg"
    ]
  },
  {
    id: 161,
    name: "Chair 28",
    category: "Chairs",
    shortDescription: "Refined seating for elegant events and premium guest arrangements.",
    measurements: "Standard event chair size",
    images: [
      "../images/chairs/11360308/\u0662\u0668/CW4A4532 copy.jpg",
      "../images/chairs/11360308/\u0662\u0668/CW4A4534 copy.jpg",
      "../images/chairs/11360308/\u0662\u0668/CW4A4535 copy.jpg"
    ]
  },
  {
    id: 162,
    name: "Chair 29",
    category: "Chairs",
    shortDescription: "Refined seating for elegant events and premium guest arrangements.",
    measurements: "Standard event chair size",
    images: [
      "../images/chairs/11360308/\u0662\u0669/CW4A4518 copy.jpg",
      "../images/chairs/11360308/\u0662\u0669/CW4A4519.jpg",
      "../images/chairs/11360308/\u0662\u0669/CW4A4520.jpg"
    ]
  },
  {
    id: 163,
    name: "Chair 30",
    category: "Chairs",
    shortDescription: "Refined seating for elegant events and premium guest arrangements.",
    measurements: "Standard event chair size",
    images: [
      "../images/chairs/11360308/\u0663\u0660/CW4A4522-2 copy.jpg",
      "../images/chairs/11360308/\u0663\u0660/CW4A4524 copy.jpg",
      "../images/chairs/11360308/\u0663\u0660/CW4A4525 copy.jpg"
    ]
  },
  {
    id: 164,
    name: "Chair 31",
    category: "Chairs",
    shortDescription: "Refined seating for elegant events and premium guest arrangements.",
    measurements: "Standard event chair size",
    images: [
      "../images/chairs/11360308/\u0663\u0661/CW4A4632 copy.jpg",
      "../images/chairs/11360308/\u0663\u0661/CW4A4633 copy.jpg",
      "../images/chairs/11360308/\u0663\u0661/CW4A4634 copy.jpg"
    ]
  },
  {
    id: 165,
    name: "Chair 32",
    category: "Chairs",
    shortDescription: "Refined seating for elegant events and premium guest arrangements.",
    measurements: "Standard event chair size",
    images: [
      "../images/chairs/11360308/\u0663\u0662/CW4A4616 copy.jpg",
      "../images/chairs/11360308/\u0663\u0662/CW4A4617 copy.jpg",
      "../images/chairs/11360308/\u0663\u0662/CW4A4618 copy.jpg"
    ]
  },
  {
    id: 166,
    name: "Chair 33",
    category: "Chairs",
    shortDescription: "Refined seating for elegant events and premium guest arrangements.",
    measurements: "Standard event chair size",
    images: [
      "../images/chairs/11360308/\u0663\u0663/CW4A4546 copy.jpg",
      "../images/chairs/11360308/\u0663\u0663/CW4A4547 copy.jpg",
      "../images/chairs/11360308/\u0663\u0663/CW4A4548 copy.jpg"
    ]
  },
  {
    id: 167,
    name: "Chair 34",
    category: "Chairs",
    shortDescription: "Refined seating for elegant events and premium guest arrangements.",
    measurements: "Standard event chair size",
    images: [
      "../images/chairs/11360308/\u0663\u0664/CW4A4601 copy.jpg",
      "../images/chairs/11360308/\u0663\u0664/CW4A4602 copy.jpg",
      "../images/chairs/11360308/\u0663\u0664/CW4A4603 copy.jpg"
    ]
  },
  {
    id: 168,
    name: "Chair 35",
    category: "Chairs",
    shortDescription: "Refined seating for elegant events and premium guest arrangements.",
    measurements: "Standard event chair size",
    images: [
      "../images/chairs/11360308/\u0663\u0665/CW4A4597 copy.jpg",
      "../images/chairs/11360308/\u0663\u0665/CW4A4598 copy.jpg",
      "../images/chairs/11360308/\u0663\u0665/CW4A4599 copy.jpg"
    ]
  },
  {
    id: 169,
    name: "Chair 36",
    category: "Chairs",
    shortDescription: "Refined seating for elegant events and premium guest arrangements.",
    measurements: "Standard event chair size",
    images: [
      "../images/chairs/11360308/\u0663\u0666/CW4A4591 copy.jpg",
      "../images/chairs/11360308/\u0663\u0666/CW4A4592 copy.jpg",
      "../images/chairs/11360308/\u0663\u0666/CW4A4593 copy.jpg"
    ]
  },
  {
    id: 170,
    name: "Chair 37",
    category: "Chairs",
    shortDescription: "Refined seating for elegant events and premium guest arrangements.",
    measurements: "Standard event chair size",
    images: [
      "../images/chairs/11360308/\u0663\u0667/CW4A4586 copy.jpg",
      "../images/chairs/11360308/\u0663\u0667/CW4A4587 copy.jpg",
      "../images/chairs/11360308/\u0663\u0667/CW4A4588 copy.jpg"
    ]
  },
  {
    id: 171,
    name: "Chair 38",
    category: "Chairs",
    shortDescription: "Refined seating for elegant events and premium guest arrangements.",
    measurements: "Standard event chair size",
    images: [
      "../images/chairs/11360308/\u0663\u0668/CW4A4563 copy.jpg",
      "../images/chairs/11360308/\u0663\u0668/CW4A4566 copy.jpg",
      "../images/chairs/11360308/\u0663\u0668/CW4A4565 copy.jpg"
    ]
  },
  {
    id: 172,
    name: "Chair 39",
    category: "Chairs",
    shortDescription: "Refined seating for elegant events and premium guest arrangements.",
    measurements: "Standard event chair size",
    images: [
      "../images/chairs/11360308/\u0663\u0669/CW4A4557 copy.jpg",
      "../images/chairs/11360308/\u0663\u0669/CW4A4560 copy.jpg",
      "../images/chairs/11360308/\u0663\u0669/CW4A4561 copy.jpg"
    ]
  },
  {
    id: 173,
    name: "Chair 40",
    category: "Chairs",
    shortDescription: "Refined seating for elegant events and premium guest arrangements.",
    measurements: "Standard event chair size",
    images: [
      "../images/chairs/11360308/\u0664\u0660/CW4A4576 copy.jpg",
      "../images/chairs/11360308/\u0664\u0660/CW4A4577 copy.jpg",
      "../images/chairs/11360308/\u0664\u0660/CW4A4579 copy.jpg"
    ]
  },
  {
    id: 174,
    name: "Chair 41",
    category: "Chairs",
    shortDescription: "Refined seating for elegant events and premium guest arrangements.",
    measurements: "Standard event chair size",
    images: [
      "../images/chairs/11360308/\u0664\u0661/CW4A4551 copy.jpg",
      "../images/chairs/11360308/\u0664\u0661/CW4A4552 copy.jpg",
      "../images/chairs/11360308/\u0664\u0661/CW4A4555 copy.jpg"
    ]
  },
  {
    id: 175,
    name: "Chair 42",
    category: "Chairs",
    shortDescription: "Refined seating for elegant events and premium guest arrangements.",
    measurements: "Standard event chair size",
    images: [
      "../images/chairs/11360308/\u0664\u0662/CW4A4567 copy.jpg",
      "../images/chairs/11360308/\u0664\u0662/CW4A4569 copy.jpg",
      "../images/chairs/11360308/\u0664\u0662/CW4A4571 copy.jpg"
    ]
  },
  {
    id: 176,
    name: "Chair 43",
    category: "Chairs",
    shortDescription: "Refined seating for elegant events and premium guest arrangements.",
    measurements: "Standard event chair size",
    images: [
      "../images/chairs/11360308/\u0664\u0663/\u0661.jpg",
      "../images/chairs/11360308/\u0664\u0663/CW4A4444 copy.jpg",
      "../images/chairs/11360308/\u0664\u0663/CW4A4447.jpg"
    ]
  },
  {
    id: 177,
    name: "Chair 44",
    category: "Chairs",
    shortDescription: "Refined seating for elegant events and premium guest arrangements.",
    measurements: "Standard event chair size",
    images: [
      "../images/chairs/11360308/\u0664\u0664/CW4A4434.jpg",
      "../images/chairs/11360308/\u0664\u0664/CW4A4436-2 copy.jpg",
      "../images/chairs/11360308/\u0664\u0664/CW4A4439-2 copy.jpg"
    ]
  },
  {
    id: 178,
    name: "Chair 45",
    category: "Chairs",
    shortDescription: "Refined seating for elegant events and premium guest arrangements.",
    measurements: "Standard event chair size",
    images: [
      "../images/chairs/11360308/\u0664\u0665/CW4A4581 copy.jpg",
      "../images/chairs/11360308/\u0664\u0665/CW4A4582 copy.jpg",
      "../images/chairs/11360308/\u0664\u0665/CW4A4583 copy.jpg"
    ]
  },
  {
    id: 179,
    name: "Chair 46",
    category: "Chairs",
    shortDescription: "Refined seating for elegant events and premium guest arrangements.",
    measurements: "Standard event chair size",
    images: [
      "../images/chairs/11360308/\u0664\u0666/CW4A4496 copy.jpg",
      "../images/chairs/11360308/\u0664\u0666/CW4A4497.jpg",
      "../images/chairs/11360308/\u0664\u0666/CW4A4498 copy.jpg"
    ]
  },
  {
    id: 180,
    name: "Chair 47",
    category: "Chairs",
    shortDescription: "Refined seating for elegant events and premium guest arrangements.",
    measurements: "Standard event chair size",
    images: [
      "../images/chairs/11360308/\u0664\u0667/CW4A4539 copy.jpg",
      "../images/chairs/11360308/\u0664\u0667/CW4A4541-2 copy.jpg",
      "../images/chairs/11360308/\u0664\u0667/CW4A4542 copy 2.jpg"
    ]
  },
  {
    id: 181,
    name: "Chair 48",
    category: "Chairs",
    shortDescription: "Refined seating for elegant events and premium guest arrangements.",
    measurements: "Standard event chair size",
    images: [
      "../images/chairs/11360308/\u0664\u0668/CW4A4419 copy.jpg",
      "../images/chairs/11360308/\u0664\u0668/CW4A4421 copy.jpg",
      "../images/chairs/11360308/\u0664\u0668/CW4A4422 copy.jpg"
    ]
  },
  {
    id: 182,
    name: "Chair 49",
    category: "Chairs",
    shortDescription: "Refined seating for elegant events and premium guest arrangements.",
    measurements: "Standard event chair size",
    images: [
      "../images/chairs/11360308/\u0664\u0669/CW4A4626 copy.jpg",
      "../images/chairs/11360308/\u0664\u0669/CW4A4628 copy.jpg",
      "../images/chairs/11360308/\u0664\u0669/CW4A4629.jpg"
    ]
  },
  {
    id: 183,
    name: "Chair 50",
    category: "Chairs",
    shortDescription: "Refined seating for elegant events and premium guest arrangements.",
    measurements: "Standard event chair size",
    images: [
      "../images/chairs/11360308/\u0665\u0660/CW4A4622 copy.jpg",
      "../images/chairs/11360308/\u0665\u0660/CW4A4623 copy.jpg",
      "../images/chairs/11360308/\u0665\u0660/CW4A4624 copy--.jpg"
    ]
  },
  {
    id: 184,
    name: "Chair 51",
    category: "Chairs",
    shortDescription: "Refined seating for elegant events and premium guest arrangements.",
    measurements: "Standard event chair size",
    images: [
      "../images/chairs/11360308/\u0665\u0661/---.jpg",
      "../images/chairs/11360308/\u0665\u0661/\u0661 copy.jpg",
      "../images/chairs/11360308/\u0665\u0661/\u0661-.jpg"
    ]
  },
  {
    id: 185,
    name: "Chair 52",
    category: "Chairs",
    shortDescription: "Refined seating for elegant events and premium guest arrangements.",
    measurements: "Standard event chair size",
    images: [
      "../images/chairs/11360308/\u0665\u0662/CW4A4314 copy.jpg",
      "../images/chairs/11360308/\u0665\u0662/CW4A4318.jpg",
      "../images/chairs/11360308/\u0665\u0662/CW4A4319 copy.jpg"
    ]
  },
  {
    id: 5,
    name: "Bridal Sofa 1",
    category: "Bridal Sofa",
    shortDescription: "Bridal statement sofas for stages, engagements, and graceful focal settings.",
    measurements: "Standard bridal sofa size",
    images: [
      "../images/bridal sofa/IN9A0002.JPG"
    ]
  },
  {
    id: 26,
    name: "Bridal Sofa 2",
    category: "Bridal Sofa",
    shortDescription: "Bridal statement sofas for stages, engagements, and graceful focal settings.",
    measurements: "Standard bridal sofa size",
    images: [
      "../images/bridal sofa/IN9A9715.jpg"
    ]
  },
  {
    id: 27,
    name: "Bridal Sofa 3",
    category: "Bridal Sofa",
    shortDescription: "Bridal statement sofas for stages, engagements, and graceful focal settings.",
    measurements: "Standard bridal sofa size",
    images: [
      "../images/bridal sofa/IN9A9719.jpg"
    ]
  },
  {
    id: 28,
    name: "Bridal Sofa 4",
    category: "Bridal Sofa",
    shortDescription: "Bridal statement sofas for stages, engagements, and graceful focal settings.",
    measurements: "Standard bridal sofa size",
    images: [
      "../images/bridal sofa/IN9A9741.JPG"
    ]
  },
  {
    id: 29,
    name: "Bridal Sofa 5",
    category: "Bridal Sofa",
    shortDescription: "Bridal statement sofas for stages, engagements, and graceful focal settings.",
    measurements: "Standard bridal sofa size",
    images: [
      "../images/bridal sofa/IN9A9744.jpg"
    ]
  },
  {
    id: 30,
    name: "Bridal Sofa 6",
    category: "Bridal Sofa",
    shortDescription: "Bridal statement sofas for stages, engagements, and graceful focal settings.",
    measurements: "Standard bridal sofa size",
    images: [
      "../images/bridal sofa/IN9A9755.jpg"
    ]
  },
  {
    id: 31,
    name: "Bridal Sofa 7",
    category: "Bridal Sofa",
    shortDescription: "Bridal statement sofas for stages, engagements, and graceful focal settings.",
    measurements: "Standard bridal sofa size",
    images: [
      "../images/bridal sofa/IN9A9806.jpg"
    ]
  },
  {
    id: 32,
    name: "Bridal Sofa 8",
    category: "Bridal Sofa",
    shortDescription: "Bridal statement sofas for stages, engagements, and graceful focal settings.",
    measurements: "Standard bridal sofa size",
    images: [
      "../images/bridal sofa/IN9A9808.jpg"
    ]
  },
  {
    id: 33,
    name: "Bridal Sofa 9",
    category: "Bridal Sofa",
    shortDescription: "Bridal statement sofas for stages, engagements, and graceful focal settings.",
    measurements: "Standard bridal sofa size",
    images: [
      "../images/bridal sofa/IN9A9852.JPG"
    ]
  },
  {
    id: 34,
    name: "Bridal Sofa 10",
    category: "Bridal Sofa",
    shortDescription: "Bridal statement sofas for stages, engagements, and graceful focal settings.",
    measurements: "Standard bridal sofa size",
    images: [
      "../images/bridal sofa/IN9A9854.JPG"
    ]
  },
  {
    id: 35,
    name: "Bridal Sofa 11",
    category: "Bridal Sofa",
    shortDescription: "Bridal statement sofas for stages, engagements, and graceful focal settings.",
    measurements: "Standard bridal sofa size",
    images: [
      "../images/bridal sofa/IN9A9859.JPG"
    ]
  },
  {
    id: 36,
    name: "Bridal Sofa 12",
    category: "Bridal Sofa",
    shortDescription: "Bridal statement sofas for stages, engagements, and graceful focal settings.",
    measurements: "Standard bridal sofa size",
    images: [
      "../images/bridal sofa/IN9A9861.JPG"
    ]
  },
  {
    id: 37,
    name: "Bridal Sofa 13",
    category: "Bridal Sofa",
    shortDescription: "Bridal statement sofas for stages, engagements, and graceful focal settings.",
    measurements: "Standard bridal sofa size",
    images: [
      "../images/bridal sofa/IN9A9863.JPG"
    ]
  },
  {
    id: 38,
    name: "Bridal Sofa 14",
    category: "Bridal Sofa",
    shortDescription: "Bridal statement sofas for stages, engagements, and graceful focal settings.",
    measurements: "Standard bridal sofa size",
    images: [
      "../images/bridal sofa/IN9A9865.JPG"
    ]
  },
  {
    id: 39,
    name: "Bridal Sofa 15",
    category: "Bridal Sofa",
    shortDescription: "Bridal statement sofas for stages, engagements, and graceful focal settings.",
    measurements: "Standard bridal sofa size",
    images: [
      "../images/bridal sofa/IN9A9869.JPG"
    ]
  },
  {
    id: 40,
    name: "Bridal Sofa 16",
    category: "Bridal Sofa",
    shortDescription: "Bridal statement sofas for stages, engagements, and graceful focal settings.",
    measurements: "Standard bridal sofa size",
    images: [
      "../images/bridal sofa/IN9A9870.JPG"
    ]
  },
  {
    id: 41,
    name: "Bridal Sofa 17",
    category: "Bridal Sofa",
    shortDescription: "Bridal statement sofas for stages, engagements, and graceful focal settings.",
    measurements: "Standard bridal sofa size",
    images: [
      "../images/bridal sofa/IN9A9873.JPG"
    ]
  },
  {
    id: 42,
    name: "Bridal Sofa 18",
    category: "Bridal Sofa",
    shortDescription: "Bridal statement sofas for stages, engagements, and graceful focal settings.",
    measurements: "Standard bridal sofa size",
    images: [
      "../images/bridal sofa/IN9A9875.JPG"
    ]
  },
  {
    id: 43,
    name: "Bridal Sofa 19",
    category: "Bridal Sofa",
    shortDescription: "Bridal statement sofas for stages, engagements, and graceful focal settings.",
    measurements: "Standard bridal sofa size",
    images: [
      "../images/bridal sofa/IN9A9876.JPG"
    ]
  },
  {
    id: 44,
    name: "Bridal Sofa 20",
    category: "Bridal Sofa",
    shortDescription: "Bridal statement sofas for stages, engagements, and graceful focal settings.",
    measurements: "Standard bridal sofa size",
    images: [
      "../images/bridal sofa/IN9A9901.JPG"
    ]
  },
  {
    id: 45,
    name: "Bridal Sofa 21",
    category: "Bridal Sofa",
    shortDescription: "Bridal statement sofas for stages, engagements, and graceful focal settings.",
    measurements: "Standard bridal sofa size",
    images: [
      "../images/bridal sofa/IN9A9903.JPG"
    ]
  },
  {
    id: 46,
    name: "Bridal Sofa 22",
    category: "Bridal Sofa",
    shortDescription: "Bridal statement sofas for stages, engagements, and graceful focal settings.",
    measurements: "Standard bridal sofa size",
    images: [
      "../images/bridal sofa/IN9A9906.JPG"
    ]
  },
  {
    id: 47,
    name: "Bridal Sofa 23",
    category: "Bridal Sofa",
    shortDescription: "Bridal statement sofas for stages, engagements, and graceful focal settings.",
    measurements: "Standard bridal sofa size",
    images: [
      "../images/bridal sofa/IN9A9909.JPG"
    ]
  },
  {
    id: 48,
    name: "Bridal Sofa 24",
    category: "Bridal Sofa",
    shortDescription: "Bridal statement sofas for stages, engagements, and graceful focal settings.",
    measurements: "Standard bridal sofa size",
    images: [
      "../images/bridal sofa/IN9A9912.JPG"
    ]
  },
  {
    id: 49,
    name: "Bridal Sofa 25",
    category: "Bridal Sofa",
    shortDescription: "Bridal statement sofas for stages, engagements, and graceful focal settings.",
    measurements: "Standard bridal sofa size",
    images: [
      "../images/bridal sofa/IN9A9914.JPG"
    ]
  },
  {
    id: 50,
    name: "Bridal Sofa 26",
    category: "Bridal Sofa",
    shortDescription: "Bridal statement sofas for stages, engagements, and graceful focal settings.",
    measurements: "Standard bridal sofa size",
    images: [
      "../images/bridal sofa/IN9A9917.JPG"
    ]
  },
  {
    id: 51,
    name: "Bridal Sofa 27",
    category: "Bridal Sofa",
    shortDescription: "Bridal statement sofas for stages, engagements, and graceful focal settings.",
    measurements: "Standard bridal sofa size",
    images: [
      "../images/bridal sofa/IN9A9919.jpg"
    ]
  },
  {
    id: 52,
    name: "Bridal Sofa 28",
    category: "Bridal Sofa",
    shortDescription: "Bridal statement sofas for stages, engagements, and graceful focal settings.",
    measurements: "Standard bridal sofa size",
    images: [
      "../images/bridal sofa/IN9A9929.JPG"
    ]
  },
  {
    id: 53,
    name: "Bridal Sofa 29",
    category: "Bridal Sofa",
    shortDescription: "Bridal statement sofas for stages, engagements, and graceful focal settings.",
    measurements: "Standard bridal sofa size",
    images: [
      "../images/bridal sofa/IN9A9932.JPG"
    ]
  },
  {
    id: 54,
    name: "Bridal Sofa 30",
    category: "Bridal Sofa",
    shortDescription: "Bridal statement sofas for stages, engagements, and graceful focal settings.",
    measurements: "Standard bridal sofa size",
    images: [
      "../images/bridal sofa/IN9A9936.JPG"
    ]
  },
  {
    id: 55,
    name: "Bridal Sofa 31",
    category: "Bridal Sofa",
    shortDescription: "Bridal statement sofas for stages, engagements, and graceful focal settings.",
    measurements: "Standard bridal sofa size",
    images: [
      "../images/bridal sofa/IN9A9937.JPG"
    ]
  },
  {
    id: 56,
    name: "Bridal Sofa 32",
    category: "Bridal Sofa",
    shortDescription: "Bridal statement sofas for stages, engagements, and graceful focal settings.",
    measurements: "Standard bridal sofa size",
    images: [
      "../images/bridal sofa/IN9A9941.JPG"
    ]
  },
  {
    id: 57,
    name: "Bridal Sofa 33",
    category: "Bridal Sofa",
    shortDescription: "Bridal statement sofas for stages, engagements, and graceful focal settings.",
    measurements: "Standard bridal sofa size",
    images: [
      "../images/bridal sofa/IN9A9944.JPG"
    ]
  },
  {
    id: 58,
    name: "Bridal Sofa 34",
    category: "Bridal Sofa",
    shortDescription: "Bridal statement sofas for stages, engagements, and graceful focal settings.",
    measurements: "Standard bridal sofa size",
    images: [
      "../images/bridal sofa/IN9A9946.JPG"
    ]
  },
  {
    id: 59,
    name: "Bridal Sofa 35",
    category: "Bridal Sofa",
    shortDescription: "Bridal statement sofas for stages, engagements, and graceful focal settings.",
    measurements: "Standard bridal sofa size",
    images: [
      "../images/bridal sofa/IN9A9963.JPG"
    ]
  },
  {
    id: 60,
    name: "Bridal Sofa 36",
    category: "Bridal Sofa",
    shortDescription: "Bridal statement sofas for stages, engagements, and graceful focal settings.",
    measurements: "Standard bridal sofa size",
    images: [
      "../images/bridal sofa/IN9A9977.JPG"
    ]
  },
  {
    id: 61,
    name: "Bridal Sofa 37",
    category: "Bridal Sofa",
    shortDescription: "Bridal statement sofas for stages, engagements, and graceful focal settings.",
    measurements: "Standard bridal sofa size",
    images: [
      "../images/bridal sofa/IN9A9979.JPG"
    ]
  },
  {
    id: 62,
    name: "Bridal Sofa 38",
    category: "Bridal Sofa",
    shortDescription: "Bridal statement sofas for stages, engagements, and graceful focal settings.",
    measurements: "Standard bridal sofa size",
    images: [
      "../images/bridal sofa/IN9A9980.JPG"
    ]
  },
  {
    id: 63,
    name: "Bridal Sofa 39",
    category: "Bridal Sofa",
    shortDescription: "Bridal statement sofas for stages, engagements, and graceful focal settings.",
    measurements: "Standard bridal sofa size",
    images: [
      "../images/bridal sofa/IN9A9982.JPG"
    ]
  },
  {
    id: 64,
    name: "Bridal Sofa 40",
    category: "Bridal Sofa",
    shortDescription: "Bridal statement sofas for stages, engagements, and graceful focal settings.",
    measurements: "Standard bridal sofa size",
    images: [
      "../images/bridal sofa/IN9A9986.JPG"
    ]
  },
  {
    id: 65,
    name: "Bridal Sofa 41",
    category: "Bridal Sofa",
    shortDescription: "Bridal statement sofas for stages, engagements, and graceful focal settings.",
    measurements: "Standard bridal sofa size",
    images: [
      "../images/bridal sofa/IN9A9987.JPG"
    ]
  },
  {
    id: 66,
    name: "Bridal Sofa 42",
    category: "Bridal Sofa",
    shortDescription: "Bridal statement sofas for stages, engagements, and graceful focal settings.",
    measurements: "Standard bridal sofa size",
    images: [
      "../images/bridal sofa/IN9A9992.JPG"
    ]
  },
  {
    id: 67,
    name: "Bridal Sofa 43",
    category: "Bridal Sofa",
    shortDescription: "Bridal statement sofas for stages, engagements, and graceful focal settings.",
    measurements: "Standard bridal sofa size",
    images: [
      "../images/bridal sofa/IN9A9994.JPG"
    ]
  },
  {
    id: 68,
    name: "Bridal Sofa 44",
    category: "Bridal Sofa",
    shortDescription: "Bridal statement sofas for stages, engagements, and graceful focal settings.",
    measurements: "Standard bridal sofa size",
    images: [
      "../images/bridal sofa/IN9A9997.JPG"
    ]
  },
  {
    id: 6,
    name: "Coffee Table 1",
    category: "Coffee Table",
    shortDescription: "Elegant coffee tables for lounge styling and premium hospitality scenes.",
    measurements: "Standard event coffee table size",
    images: [
      "../images/coffe tables/IN9A0001.JPG"
    ]
  },
  {
    id: 91,
    name: "Coffee Table 2",
    category: "Coffee Table",
    shortDescription: "Elegant coffee tables for lounge styling and premium hospitality scenes.",
    measurements: "Standard event coffee table size",
    images: [
      "../images/coffe tables/IN9A0002.JPG"
    ]
  },
  {
    id: 93,
    name: "Coffee Table 4",
    category: "Coffee Table",
    shortDescription: "Elegant coffee tables for lounge styling and premium hospitality scenes.",
    measurements: "Standard event coffee table size",
    images: [
      "../images/coffe tables/IN9A0006.JPG"
    ]
  },
  {
    id: 95,
    name: "Coffee Table 6",
    category: "Coffee Table",
    shortDescription: "Elegant coffee tables for lounge styling and premium hospitality scenes.",
    measurements: "Standard event coffee table size",
    images: [
      "../images/coffe tables/IN9A0009.JPG"
    ]
  },
  {
    id: 96,
    name: "Coffee Table 7",
    category: "Coffee Table",
    shortDescription: "Elegant coffee tables for lounge styling and premium hospitality scenes.",
    measurements: "Standard event coffee table size",
    images: [
      "../images/coffe tables/IN9A0010.JPG"
    ]
  },
  {
    id: 97,
    name: "Coffee Table 8",
    category: "Coffee Table",
    shortDescription: "Elegant coffee tables for lounge styling and premium hospitality scenes.",
    measurements: "Standard event coffee table size",
    images: [
      "../images/coffe tables/IN9A0011.JPG"
    ]
  },
  {
    id: 98,
    name: "Coffee Table 9",
    category: "Coffee Table",
    shortDescription: "Elegant coffee tables for lounge styling and premium hospitality scenes.",
    measurements: "Standard event coffee table size",
    images: [
      "../images/coffe tables/IN9A0012.JPG"
    ]
  },
  {
    id: 99,
    name: "Coffee Table 10",
    category: "Coffee Table",
    shortDescription: "Elegant coffee tables for lounge styling and premium hospitality scenes.",
    measurements: "Standard event coffee table size",
    images: [
      "../images/coffe tables/IN9A0013.JPG"
    ]
  },
  {
    id: 100,
    name: "Coffee Table 11",
    category: "Coffee Table",
    shortDescription: "Elegant coffee tables for lounge styling and premium hospitality scenes.",
    measurements: "Standard event coffee table size",
    images: [
      "../images/coffe tables/IN9A0014.JPG"
    ]
  },
  {
    id: 101,
    name: "Coffee Table 12",
    category: "Coffee Table",
    shortDescription: "Elegant coffee tables for lounge styling and premium hospitality scenes.",
    measurements: "Standard event coffee table size",
    images: [
      "../images/coffe tables/IN9A0016.JPG"
    ]
  },
  {
    id: 102,
    name: "Coffee Table 13",
    category: "Coffee Table",
    shortDescription: "Elegant coffee tables for lounge styling and premium hospitality scenes.",
    measurements: "Standard event coffee table size",
    images: [
      "../images/coffe tables/IN9A0017.JPG"
    ]
  },
  {
    id: 103,
    name: "Coffee Table 14",
    category: "Coffee Table",
    shortDescription: "Elegant coffee tables for lounge styling and premium hospitality scenes.",
    measurements: "Standard event coffee table size",
    images: [
      "../images/coffe tables/IN9A0040.JPG"
    ]
  },
  {
    id: 104,
    name: "Coffee Table 15",
    category: "Coffee Table",
    shortDescription: "Elegant coffee tables for lounge styling and premium hospitality scenes.",
    measurements: "Standard event coffee table size",
    images: [
      "../images/coffe tables/IN9A0042.JPG"
    ]
  },
  {
    id: 105,
    name: "Coffee Table 16",
    category: "Coffee Table",
    shortDescription: "Elegant coffee tables for lounge styling and premium hospitality scenes.",
    measurements: "Standard event coffee table size",
    images: [
      "../images/coffe tables/IN9A0043.JPG"
    ]
  },
  {
    id: 106,
    name: "Coffee Table 17",
    category: "Coffee Table",
    shortDescription: "Elegant coffee tables for lounge styling and premium hospitality scenes.",
    measurements: "Standard event coffee table size",
    images: [
      "../images/coffe tables/IN9A0044.JPG"
    ]
  },
  {
    id: 107,
    name: "Coffee Table 18",
    category: "Coffee Table",
    shortDescription: "Elegant coffee tables for lounge styling and premium hospitality scenes.",
    measurements: "Standard event coffee table size",
    images: [
      "../images/coffe tables/IN9A0045.JPG"
    ]
  },
  {
    id: 108,
    name: "Coffee Table 19",
    category: "Coffee Table",
    shortDescription: "Elegant coffee tables for lounge styling and premium hospitality scenes.",
    measurements: "Standard event coffee table size",
    images: [
      "../images/coffe tables/IN9A0048.JPG"
    ]
  },
  {
    id: 109,
    name: "Coffee Table 20",
    category: "Coffee Table",
    shortDescription: "Elegant coffee tables for lounge styling and premium hospitality scenes.",
    measurements: "Standard event coffee table size",
    images: [
      "../images/coffe tables/IN9A0052.JPG"
    ]
  },
  {
    id: 110,
    name: "Coffee Table 21",
    category: "Coffee Table",
    shortDescription: "Elegant coffee tables for lounge styling and premium hospitality scenes.",
    measurements: "Standard event coffee table size",
    images: [
      "../images/coffe tables/IN9A0054.JPG"
    ]
  },
  {
    id: 111,
    name: "Coffee Table 22",
    category: "Coffee Table",
    shortDescription: "Elegant coffee tables for lounge styling and premium hospitality scenes.",
    measurements: "Standard event coffee table size",
    images: [
      "../images/coffe tables/IN9A9954.JPG"
    ]
  },
  {
    id: 112,
    name: "Coffee Table 23",
    category: "Coffee Table",
    shortDescription: "Elegant coffee tables for lounge styling and premium hospitality scenes.",
    measurements: "Standard event coffee table size",
    images: [
      "../images/coffe tables/IN9A9955.JPG"
    ]
  },
  {
    id: 113,
    name: "Coffee Table 24",
    category: "Coffee Table",
    shortDescription: "Elegant coffee tables for lounge styling and premium hospitality scenes.",
    measurements: "Standard event coffee table size",
    images: [
      "../images/coffe tables/IN9A9958.JPG"
    ]
  },
  {
    id: 114,
    name: "Coffee Table 25",
    category: "Coffee Table",
    shortDescription: "Elegant coffee tables for lounge styling and premium hospitality scenes.",
    measurements: "Standard event coffee table size",
    images: [
      "../images/coffe tables/IN9A9959.JPG"
    ]
  },
  {
    id: 115,
    name: "Coffee Table 26",
    category: "Coffee Table",
    shortDescription: "Elegant coffee tables for lounge styling and premium hospitality scenes.",
    measurements: "Standard event coffee table size",
    images: [
      "../images/coffe tables/IN9A9961.JPG"
    ]
  },
  {
    id: 116,
    name: "Coffee Table 27",
    category: "Coffee Table",
    shortDescription: "Elegant coffee tables for lounge styling and premium hospitality scenes.",
    measurements: "Standard event coffee table size",
    images: [
      "../images/coffe tables/IN9A9965.JPG"
    ]
  },
  {
    id: 117,
    name: "Coffee Table 28",
    category: "Coffee Table",
    shortDescription: "Elegant coffee tables for lounge styling and premium hospitality scenes.",
    measurements: "Standard event coffee table size",
    images: [
      "../images/coffe tables/IN9A9966.JPG"
    ]
  },
  {
    id: 118,
    name: "Coffee Table 29",
    category: "Coffee Table",
    shortDescription: "Elegant coffee tables for lounge styling and premium hospitality scenes.",
    measurements: "Standard event coffee table size",
    images: [
      "../images/coffe tables/IN9A9967.JPG"
    ]
  },
  {
    id: 119,
    name: "Coffee Table 30",
    category: "Coffee Table",
    shortDescription: "Elegant coffee tables for lounge styling and premium hospitality scenes.",
    measurements: "Standard event coffee table size",
    images: [
      "../images/coffe tables/IN9A9968.JPG"
    ]
  },
  {
    id: 120,
    name: "Coffee Table 31",
    category: "Coffee Table",
    shortDescription: "Elegant coffee tables for lounge styling and premium hospitality scenes.",
    measurements: "Standard event coffee table size",
    images: [
      "../images/coffe tables/IN9A9970.JPG"
    ]
  },
  {
    id: 122,
    name: "Coffee Table 33",
    category: "Coffee Table",
    shortDescription: "Elegant coffee tables for lounge styling and premium hospitality scenes.",
    measurements: "Standard event coffee table size",
    images: [
      "../images/coffe tables/IN9A9974.JPG"
    ]
  },
  {
    id: 123,
    name: "Coffee Table 34",
    category: "Coffee Table",
    shortDescription: "Elegant coffee tables for lounge styling and premium hospitality scenes.",
    measurements: "Standard event coffee table size",
    images: [
      "../images/coffe tables/IN9A9975.JPG"
    ]
  },
  {
    id: 124,
    name: "Coffee Table 35",
    category: "Coffee Table",
    shortDescription: "Elegant coffee tables for lounge styling and premium hospitality scenes.",
    measurements: "Standard event coffee table size",
    images: [
      "../images/coffe tables/IN9A9976.JPG"
    ]
  },
  {
    id: 125,
    name: "Coffee Table 36",
    category: "Coffee Table",
    shortDescription: "Elegant coffee tables for lounge styling and premium hospitality scenes.",
    measurements: "Standard event coffee table size",
    images: [
      "../images/coffe tables/IN9A9977.JPG"
    ]
  },
  {
    id: 126,
    name: "Coffee Table 37",
    category: "Coffee Table",
    shortDescription: "Elegant coffee tables for lounge styling and premium hospitality scenes.",
    measurements: "Standard event coffee table size",
    images: [
      "../images/coffe tables/IN9A9979.JPG"
    ]
  },
  {
    id: 127,
    name: "Coffee Table 38",
    category: "Coffee Table",
    shortDescription: "Elegant coffee tables for lounge styling and premium hospitality scenes.",
    measurements: "Standard event coffee table size",
    images: [
      "../images/coffe tables/IN9A9981.JPG"
    ]
  },
  {
    id: 128,
    name: "Coffee Table 39",
    category: "Coffee Table",
    shortDescription: "Elegant coffee tables for lounge styling and premium hospitality scenes.",
    measurements: "Standard event coffee table size",
    images: [
      "../images/coffe tables/IN9A9983.JPG"
    ]
  },
  {
    id: 129,
    name: "Coffee Table 40",
    category: "Coffee Table",
    shortDescription: "Elegant coffee tables for lounge styling and premium hospitality scenes.",
    measurements: "Standard event coffee table size",
    images: [
      "../images/coffe tables/IN9A9985.JPG"
    ]
  },
  {
    id: 130,
    name: "Coffee Table 41",
    category: "Coffee Table",
    shortDescription: "Elegant coffee tables for lounge styling and premium hospitality scenes.",
    measurements: "Standard event coffee table size",
    images: [
      "../images/coffe tables/IN9A9987.JPG"
    ]
  },
  {
    id: 131,
    name: "Coffee Table 42",
    category: "Coffee Table",
    shortDescription: "Elegant coffee tables for lounge styling and premium hospitality scenes.",
    measurements: "Standard event coffee table size",
    images: [
      "../images/coffe tables/IN9A9990.JPG"
    ]
  },
  {
    id: 132,
    name: "Coffee Table 43",
    category: "Coffee Table",
    shortDescription: "Elegant coffee tables for lounge styling and premium hospitality scenes.",
    measurements: "Standard event coffee table size",
    images: [
      "../images/coffe tables/IN9A9993.JPG"
    ]
  },
  {
    id: 133,
    name: "Coffee Table 44",
    category: "Coffee Table",
    shortDescription: "Elegant coffee tables for lounge styling and premium hospitality scenes.",
    measurements: "Standard event coffee table size",
    images: [
      "../images/coffe tables/IN9A9994.JPG"
    ]
  },
  {
    id: 134,
    name: "Coffee Table 45",
    category: "Coffee Table",
    shortDescription: "Elegant coffee tables for lounge styling and premium hospitality scenes.",
    measurements: "Standard event coffee table size",
    images: [
      "../images/coffe tables/IN9A9996.JPG"
    ]
  },
  {
    id: 7,
    name: "Cocktail Table 1",
    category: "Cocktail Table",
    shortDescription: "Refined cocktail tables for receptions, mingling, and polished guest flow.",
    measurements: "Standard event cocktail table size",
    images: [
      "../images/cocktail table/IN9A9972.JPG"
    ]
  },
  {
    id: 135,
    name: "Cocktail Table 2",
    category: "Cocktail Table",
    shortDescription: "Refined cocktail tables for receptions, mingling, and polished guest flow.",
    measurements: "Standard event cocktail table size",
    images: [
      "../images/cocktail table/IN9A9989.JPG"
    ]
  },
  {
    id: 8,
    name: "Sofa 1",
    category: "Majlis Sofa",
    shortDescription: "Refined sofa seating for majlis lounges and upscale event comfort.",
    measurements: "Standard event sofa size",
    images: [
      "../images/sofa/IN9A0006.jpg"
    ]
  },
  {
    id: 69,
    name: "Sofa 2",
    category: "Majlis Sofa",
    shortDescription: "Refined sofa seating for majlis lounges and upscale event comfort.",
    measurements: "Standard event sofa size",
    images: [
      "../images/sofa/IN9A9554.JPG"
    ]
  },
  {
    id: 70,
    name: "Sofa 3",
    category: "Majlis Sofa",
    shortDescription: "Refined sofa seating for majlis lounges and upscale event comfort.",
    measurements: "Standard event sofa size",
    images: [
      "../images/sofa/IN9A9556.JPG"
    ]
  },
  {
    id: 71,
    name: "Sofa 4",
    category: "Majlis Sofa",
    shortDescription: "Refined sofa seating for majlis lounges and upscale event comfort.",
    measurements: "Standard event sofa size",
    images: [
      "../images/sofa/IN9A9570.JPG"
    ]
  },
  {
    id: 72,
    name: "Sofa 5",
    category: "Majlis Sofa",
    shortDescription: "Refined sofa seating for majlis lounges and upscale event comfort.",
    measurements: "Standard event sofa size",
    images: [
      "../images/sofa/IN9A9572.JPG"
    ]
  },
  {
    id: 73,
    name: "Sofa 6",
    category: "Majlis Sofa",
    shortDescription: "Refined sofa seating for majlis lounges and upscale event comfort.",
    measurements: "Standard event sofa size",
    images: [
      "../images/sofa/IN9A9580.JPG"
    ]
  },
  {
    id: 74,
    name: "Sofa 7",
    category: "Majlis Sofa",
    shortDescription: "Refined sofa seating for majlis lounges and upscale event comfort.",
    measurements: "Standard event sofa size",
    images: [
      "../images/sofa/IN9A9631.JPG"
    ]
  },
  {
    id: 75,
    name: "Sofa 8",
    category: "Majlis Sofa",
    shortDescription: "Refined sofa seating for majlis lounges and upscale event comfort.",
    measurements: "Standard event sofa size",
    images: [
      "../images/sofa/IN9A9641.JPG"
    ]
  },
  {
    id: 76,
    name: "Sofa 9",
    category: "Majlis Sofa",
    shortDescription: "Refined sofa seating for majlis lounges and upscale event comfort.",
    measurements: "Standard event sofa size",
    images: [
      "../images/sofa/IN9A9662.JPG"
    ]
  },
  {
    id: 77,
    name: "Sofa 10",
    category: "Majlis Sofa",
    shortDescription: "Refined sofa seating for majlis lounges and upscale event comfort.",
    measurements: "Standard event sofa size",
    images: [
      "../images/sofa/IN9A9789.jpg"
    ]
  },
  {
    id: 78,
    name: "Sofa 11",
    category: "Majlis Sofa",
    shortDescription: "Refined sofa seating for majlis lounges and upscale event comfort.",
    measurements: "Standard event sofa size",
    images: [
      "../images/sofa/IN9A9855.JPG"
    ]
  },
  {
    id: 79,
    name: "Sofa 12",
    category: "Majlis Sofa",
    shortDescription: "Refined sofa seating for majlis lounges and upscale event comfort.",
    measurements: "Standard event sofa size",
    images: [
      "../images/sofa/IN9A9881.JPG"
    ]
  },
  {
    id: 80,
    name: "Sofa 13",
    category: "Majlis Sofa",
    shortDescription: "Refined sofa seating for majlis lounges and upscale event comfort.",
    measurements: "Standard event sofa size",
    images: [
      "../images/sofa/IN9A9885.JPG"
    ]
  },
  {
    id: 81,
    name: "Sofa 14",
    category: "Majlis Sofa",
    shortDescription: "Refined sofa seating for majlis lounges and upscale event comfort.",
    measurements: "Standard event sofa size",
    images: [
      "../images/sofa/IN9A9889.JPG"
    ]
  },
  {
    id: 82,
    name: "Sofa 15",
    category: "Majlis Sofa",
    shortDescription: "Refined sofa seating for majlis lounges and upscale event comfort.",
    measurements: "Standard event sofa size",
    images: [
      "../images/sofa/IN9A9893.JPG"
    ]
  },
  {
    id: 83,
    name: "Sofa 16",
    category: "Majlis Sofa",
    shortDescription: "Refined sofa seating for majlis lounges and upscale event comfort.",
    measurements: "Standard event sofa size",
    images: [
      "../images/sofa/IN9A9897.JPG"
    ]
  },
  {
    id: 84,
    name: "Sofa 17",
    category: "Majlis Sofa",
    shortDescription: "Refined sofa seating for majlis lounges and upscale event comfort.",
    measurements: "Standard event sofa size",
    images: [
      "../images/sofa/IN9A9951.JPG"
    ]
  },
  {
    id: 85,
    name: "Sofa 18",
    category: "Majlis Sofa",
    shortDescription: "Refined sofa seating for majlis lounges and upscale event comfort.",
    measurements: "Standard event sofa size",
    images: [
      "../images/sofa/IN9A9953.JPG"
    ]
  },
  {
    id: 86,
    name: "Sofa 19",
    category: "Majlis Sofa",
    shortDescription: "Refined sofa seating for majlis lounges and upscale event comfort.",
    measurements: "Standard event sofa size",
    images: [
      "../images/sofa/IN9A9954.JPG"
    ]
  },
  {
    id: 87,
    name: "Sofa 20",
    category: "Majlis Sofa",
    shortDescription: "Refined sofa seating for majlis lounges and upscale event comfort.",
    measurements: "Standard event sofa size",
    images: [
      "../images/sofa/IN9A9966.JPG"
    ]
  },
  {
    id: 88,
    name: "Sofa 21",
    category: "Majlis Sofa",
    shortDescription: "Refined sofa seating for majlis lounges and upscale event comfort.",
    measurements: "Standard event sofa size",
    images: [
      "../images/sofa/IN9A9967.JPG"
    ]
  },
  {
    id: 89,
    name: "Sofa 22",
    category: "Majlis Sofa",
    shortDescription: "Refined sofa seating for majlis lounges and upscale event comfort.",
    measurements: "Standard event sofa size",
    images: [
      "../images/sofa/IN9A9971.JPG"
    ]
  },
  {
    id: 90,
    name: "Sofa 23",
    category: "Majlis Sofa",
    shortDescription: "Refined sofa seating for majlis lounges and upscale event comfort.",
    measurements: "Standard event sofa size",
    images: [
      "../images/sofa/IN9A9973.JPG"
    ]
  }
];
