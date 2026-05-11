import {
  QUOTE_COMPANY,
  QUOTE_CURRENCY,
  QUOTE_TERMS,
  QUOTE_BANK_FIELD_LABELS,
  VAT_RATE,
  getQuoteLabels
} from "./quote-config.js";

const PDF_PAGE = {
  widthPt: 595.28,
  heightPt: 841.89
};

const CANVAS_PAGE = {
  width: 1480,
  height: 2094,
  margin: 86,
  footerHeight: 104,
  topAccentHeight: 8,
  contentWidth: 1480 - (86 * 2)
};

const CONTENT_BOTTOM = CANVAS_PAGE.height - CANVAS_PAGE.margin - CANVAS_PAGE.footerHeight;
const CARD_RADIUS = 20;
const GUTTER = 28;
const LOGO_URL = new URL("../../images/logo/logo.jpeg", import.meta.url).href;
const PDF_COLORS = {
  pageBackground: "#FDFAF5",
  topAccent: "#E8D9B8",
  textPrimary: "#1C1612",
  textSecondary: "#7A6A58",
  textMuted: "#9A8878",
  accentGold: "#A0742A",
  border: "#E8DCCB",
  borderGold: "#C8A060",
  separator: "#EDE3D4",
  headerFill: "#F5ECD9",
  cardFill: "#FFFDF9",
  cardFillSoft: "#FFFCF7",
  white: "#FFFFFF"
};

let logoDataUrlPromise = null;

function escapeHtml(value){
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatMoney(value){
  const amount = Number(value) || 0;
  return amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function formatPercentage(value){
  const percentage = Number(value) || 0;
  return `${percentage.toLocaleString("en-US", {
    minimumFractionDigits: percentage % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2
  })}%`;
}

function roundCurrency(value){
  return Math.round((Number(value) || 0) * 100) / 100;
}

function clampDiscountPercentage(value){
  const percentage = Number(value);

  if(!Number.isFinite(percentage)){
    return 0;
  }

  return Math.min(100, Math.max(0, percentage));
}

function normalizeDiscountType(value){
  return value === "fixed" ? "fixed" : "percentage";
}

function resolveQuoteDiscountValues(source = {}){
  const itemsTotal = Number(source.itemsTotal) || 0;
  const deliveryCharge = Number(source.deliveryCharge) || 0;
  const fallbackPreDiscountSubtotal = Math.max(0, itemsTotal + deliveryCharge);
  const preDiscountSubtotal = Math.max(
    0,
    Number(source.preDiscountSubtotal) || fallbackPreDiscountSubtotal
  );
  const discountType = normalizeDiscountType(source.discountType);

  if(discountType === "fixed"){
    const explicitDiscountValue = Number(source.discountValue);
    const explicitDiscountAmount = Number(source.discountAmount);
    const legacyDiscountAmount = Number(source.discount);
    const resolvedDiscountAmount = Number.isFinite(explicitDiscountValue)
      ? explicitDiscountValue
      : (Number.isFinite(explicitDiscountAmount) ? explicitDiscountAmount : legacyDiscountAmount);
    const discountAmount = Math.max(0, Math.min(preDiscountSubtotal, roundCurrency(resolvedDiscountAmount)));
    const discountPercentage = preDiscountSubtotal > 0
      ? roundCurrency((discountAmount / preDiscountSubtotal) * 100)
      : 0;

    return {
      preDiscountSubtotal,
      discountType,
      discountValue: discountAmount,
      discountPercentage,
      discountAmount
    };
  }

  const explicitDiscountValue = Number(source.discountValue);
  const explicitDiscountPercentage = Number(source.discountPercentage);
  const resolvedDiscountPercentage = Number.isFinite(explicitDiscountValue)
    ? explicitDiscountValue
    : (Number.isFinite(explicitDiscountPercentage) ? explicitDiscountPercentage : Number(source.discount));
  const discountPercentage = clampDiscountPercentage(resolvedDiscountPercentage);
  const discountAmount = roundCurrency(preDiscountSubtotal * (discountPercentage / 100));

  return {
    preDiscountSubtotal,
    discountType: "percentage",
    discountValue: discountPercentage,
    discountPercentage,
    discountAmount
  };
}

function formatDate(value, language = "en"){
  if(!value){
    return "";
  }

  const parsed = new Date(value);

  if(Number.isNaN(parsed.getTime())){
    return String(value);
  }

  return parsed.toLocaleDateString(language === "ar" ? "ar-AE" : "en-GB", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });
}

function blobToDataUrl(blob){
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Failed to convert blob to data URL"));
    reader.readAsDataURL(blob);
  });
}

async function getLogoDataUrl(){
  if(!logoDataUrlPromise){
    logoDataUrlPromise = (async () => {
      try{
        const response = await fetch(LOGO_URL, { cache: "force-cache" });

        if(!response.ok){
          throw new Error(`Logo fetch failed: ${response.status}`);
        }

        return await blobToDataUrl(await response.blob());
      }catch{
        return LOGO_URL;
      }
    })();
  }

  return logoDataUrlPromise;
}

function getDirection(language){
  return language === "ar" ? "rtl" : "ltr";
}

function getTextAlign(language, type = "body"){
  if(type === "money"){
    return language === "ar" ? "left" : "right";
  }

  if(type === "center"){
    return "center";
  }

  return language === "ar" ? "right" : "left";
}

function getFontFamily(language){
  return language === "ar"
    ? "'Noto Sans Arabic', 'Segoe UI', Tahoma, Arial, sans-serif"
    : "'Segoe UI', Tahoma, Arial, sans-serif";
}

function toDisplayText(value, fallback = "-"){
  const text = String(value ?? "").trim();
  return text || fallback;
}

function buildBankRows(bankPreset, language){
  const fieldLabels = QUOTE_BANK_FIELD_LABELS[language] || QUOTE_BANK_FIELD_LABELS.en;
  const fields = ["beneficiary", "iban", "bankName", "swift"];

  return fields.map((field) => ({
    label: fieldLabels[field],
    value: toDisplayText(bankPreset?.[field]),
    isIban: field === "iban"
  }));
}

function buildTerms(language){
  return (QUOTE_TERMS[language] || QUOTE_TERMS.en).map((term) => toDisplayText(term));
}

function buildMetaRows(quote, labels, language){
  return [
    { label: labels.quotationNumber, value: toDisplayText(quote.quotationNumber) },
    { label: labels.version, value: `v${quote.version}` },
    { label: labels.quotationDate, value: toDisplayText(formatDate(quote.generatedAtISO || quote.generatedAtMs, language)) },
    { label: labels.rentalDays, value: toDisplayText(quote.rentalDays || 1) }
  ];
}

function buildCustomerRows(quote, labels){
  return [
    { label: labels.customerName, value: toDisplayText(quote.customerName) },
    { label: labels.phone, value: toDisplayText(quote.customerPhone) }
  ];
}

function buildEventRows(quote, labels, language){
  return [
    { label: labels.eventDate, value: toDisplayText(formatDate(quote.eventDate, language), toDisplayText(quote.eventDate)) },
    { label: labels.eventTime, value: toDisplayText(quote.eventTime) },
    { label: labels.setupTime, value: toDisplayText(quote.setupTime) },
    { label: labels.eventLocation, value: toDisplayText(quote.eventLocation) },
    { label: labels.notes, value: toDisplayText(quote.notes) }
  ];
}

function buildTotalsRows(quote, labels){
  const discountState = resolveQuoteDiscountValues(quote);
  const discountLabel = discountState.discountType === "fixed"
    ? `${labels.discount} (${labels.currency} ${formatMoney(discountState.discountValue)})`
    : `${labels.discount} (${formatPercentage(discountState.discountValue)})`;

  return [
    { label: labels.itemsTotal, value: `${formatMoney(quote.itemsTotal)} ${QUOTE_CURRENCY}` },
    { label: labels.deliveryCharge, value: `${formatMoney(quote.deliveryCharge)} ${QUOTE_CURRENCY}` },
    { label: discountLabel, value: `- ${formatMoney(discountState.discountAmount)} ${QUOTE_CURRENCY}` },
    { label: labels.subtotal, value: `${formatMoney(quote.subtotal)} ${QUOTE_CURRENCY}` },
    { label: `${labels.vat} (${Math.round(VAT_RATE * 100)}%)`, value: `${formatMoney(quote.vatAmount)} ${QUOTE_CURRENCY}` },
    { label: labels.grandTotal, value: `${formatMoney(quote.grandTotal)} ${QUOTE_CURRENCY}`, isGrand: true }
  ];
}

function buildPreparedQuote(quote){
  const language = quote?.language === "ar" ? "ar" : "en";
  const labels = getQuoteLabels(language);
  const discountState = resolveQuoteDiscountValues(quote);
  const rentalDays = Math.max(1, Math.floor(Number(quote.rentalDays) || 1));
  const items = (quote.items || []).map((item, index) => ({
    index: index + 1,
    name: toDisplayText(item.name),
    quantity: Math.max(1, Number(item.quantity) || 1),
    unitPrice: `${formatMoney(item.unitPrice)} ${labels.currency}`,
    amount: `${formatMoney(Number.isFinite(Number(item.amount)) ? Number(item.amount) : ((Number(item.quantity) || 1) * (Number(item.unitPrice) || 0) * rentalDays))} ${labels.currency}`
  }));

  return {
    ...quote,
    language,
    direction: getDirection(language),
    discountType: discountState.discountType,
    discountValue: discountState.discountValue,
    discountPercentage: discountState.discountPercentage,
    discountAmount: discountState.discountAmount,
    preDiscountSubtotal: discountState.preDiscountSubtotal,
    labels,
    items,
    metaRows: buildMetaRows(quote, labels, language),
    customerRows: buildCustomerRows(quote, labels),
    eventRows: buildEventRows(quote, labels, language),
    totalRows: buildTotalsRows(quote, labels),
    bankRows: buildBankRows(quote.bankPreset, language),
    terms: buildTerms(language)
  };
}

function createCanvas(width = CANVAS_PAGE.width, height = CANVAS_PAGE.height){
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

function roundRect(ctx, x, y, width, height, radius, fillStyle, strokeStyle = null, lineWidth = 1){
  const safeRadius = Math.min(radius, width / 2, height / 2);

  ctx.beginPath();
  ctx.moveTo(x + safeRadius, y);
  ctx.lineTo(x + width - safeRadius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + safeRadius);
  ctx.lineTo(x + width, y + height - safeRadius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - safeRadius, y + height);
  ctx.lineTo(x + safeRadius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - safeRadius);
  ctx.lineTo(x, y + safeRadius);
  ctx.quadraticCurveTo(x, y, x + safeRadius, y);
  ctx.closePath();

  if(fillStyle){
    ctx.fillStyle = fillStyle;
    ctx.fill();
  }

  if(strokeStyle){
    ctx.lineWidth = lineWidth;
    ctx.strokeStyle = strokeStyle;
    ctx.stroke();
  }
}

function setTextStyle(ctx, language, {
  size = 28,
  weight = 400,
  color = PDF_COLORS.textPrimary,
  align = getTextAlign(language),
  baseline = "top"
} = {}){
  ctx.font = `${weight} ${size}px ${getFontFamily(language)}`;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = baseline;
  ctx.direction = getDirection(language);
}

function breakLongToken(ctx, token, maxWidth){
  const chars = Array.from(token);
  const parts = [];
  let current = "";

  chars.forEach((char) => {
    const next = current + char;

    if(current && ctx.measureText(next).width > maxWidth){
      parts.push(current);
      current = char;
      return;
    }

    current = next;
  });

  if(current){
    parts.push(current);
  }

  return parts;
}

function wrapTextLines(ctx, text, maxWidth){
  const paragraphs = String(text ?? "").split(/\r?\n/);
  const lines = [];

  paragraphs.forEach((paragraph, paragraphIndex) => {
    const trimmed = paragraph.trim();

    if(!trimmed){
      lines.push("");
      return;
    }

    const tokens = trimmed.split(/\s+/).flatMap((token) => (
      ctx.measureText(token).width > maxWidth
        ? breakLongToken(ctx, token, maxWidth)
        : [token]
    ));

    let currentLine = "";

    tokens.forEach((token) => {
      const candidate = currentLine ? `${currentLine} ${token}` : token;

      if(currentLine && ctx.measureText(candidate).width > maxWidth){
        lines.push(currentLine);
        currentLine = token;
      }else{
        currentLine = candidate;
      }
    });

    if(currentLine){
      lines.push(currentLine);
    }

    if(paragraphIndex < paragraphs.length - 1){
      lines.push("");
    }
  });

  return lines.length ? lines : [""];
}

function measureTextBlock(ctx, text, language, width, options = {}){
  const style = {
    size: 28,
    weight: 400,
    lineHeight: 1.45,
    ...options
  };

  setTextStyle(ctx, language, style);
  const lines = wrapTextLines(ctx, text, width);
  const lineHeightPx = Math.round(style.size * style.lineHeight);

  return {
    lines,
    height: Math.max(style.size, lines.length * lineHeightPx),
    lineHeightPx
  };
}

function drawTextBlock(ctx, text, language, x, y, width, options = {}){
  const style = {
    size: 28,
    weight: 400,
    lineHeight: 1.45,
    color: "#1f1a17",
    align: getTextAlign(language),
    ...options
  };

  const measurement = measureTextBlock(ctx, text, language, width, style);
  setTextStyle(ctx, language, style);

  const drawX = style.align === "center"
    ? x + (width / 2)
    : style.align === "right"
      ? x + width
      : x;

  measurement.lines.forEach((line, index) => {
    ctx.fillText(line, drawX, y + (index * measurement.lineHeightPx));
  });

  return measurement.height;
}

function getFittedTextMetrics(ctx, text, language, width, options = {}){
  const {
    maxSize = 28,
    minSize = 16,
    maxLines = 2,
    step = 1,
    ...style
  } = options;

  let size = maxSize;
  let measurement = measureTextBlock(ctx, text, language, width, {
    ...style,
    size
  });

  while(size > minSize && measurement.lines.length > maxLines){
    size -= step;
    measurement = measureTextBlock(ctx, text, language, width, {
      ...style,
      size
    });
  }

  return {
    size,
    measurement,
    style
  };
}

function ensurePage(state, minHeight = 0){
  if(!state.currentPage || (state.currentY + minHeight) > CONTENT_BOTTOM){
    finishPage(state);
    startPage(state);
  }
}

function startPage(state){
  const canvas = createCanvas();
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = PDF_COLORS.pageBackground;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = PDF_COLORS.topAccent;
  ctx.fillRect(CANVAS_PAGE.margin, CANVAS_PAGE.margin - 10, CANVAS_PAGE.contentWidth, CANVAS_PAGE.topAccentHeight);

  state.currentPage = { canvas, ctx };
  state.currentY = CANVAS_PAGE.margin + 22;
}

function drawFooter(page, state){
  const { ctx } = page;
  const language = state.quote.language;
  const direction = state.quote.direction;
  const startX = CANVAS_PAGE.margin;
  const footerTop = CANVAS_PAGE.height - CANVAS_PAGE.footerHeight + 14;
  const lineY = footerTop - 28;

  ctx.strokeStyle = "#D4C4A8";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(startX, lineY);
  ctx.lineTo(startX + CANVAS_PAGE.contentWidth, lineY);
  ctx.stroke();

  const logoSize = 36;
  const brandBlockWidth = 520;
  const brandX = direction === "rtl"
    ? startX + CANVAS_PAGE.contentWidth - brandBlockWidth
    : startX;
  const logoX = direction === "rtl"
    ? brandX + brandBlockWidth - logoSize
    : brandX;
  const brandTextX = direction === "rtl"
    ? brandX
    : logoX + logoSize + 14;
  const brandTextWidth = brandBlockWidth - logoSize - 14;
  const footerNameMetrics = getFittedTextMetrics(
    ctx,
    QUOTE_COMPANY.name[language] || QUOTE_COMPANY.name.en,
    language,
    brandTextWidth,
    {
      maxSize: 18,
      minSize: 13,
      maxLines: 2,
      weight: 700,
      lineHeight: language === "ar" ? 1.28 : 1.2
    }
  );
  const footerSubtitleMetrics = getFittedTextMetrics(
    ctx,
    QUOTE_COMPANY.subtitle[language] || QUOTE_COMPANY.subtitle.en,
    language,
    brandTextWidth,
    {
      maxSize: 13,
      minSize: 11,
      maxLines: 2,
      weight: 400,
      lineHeight: language === "ar" ? 1.28 : 1.25
    }
  );
  const footerNameY = footerTop + 1;
  const footerSubtitleY = footerNameY + footerNameMetrics.measurement.height + 4;

  ctx.drawImage(state.logoImage, logoX, footerTop, logoSize, logoSize);

  drawTextBlock(
    ctx,
    QUOTE_COMPANY.name[language] || QUOTE_COMPANY.name.en,
    language,
    brandTextX,
    footerNameY,
    brandTextWidth,
    {
      size: footerNameMetrics.size,
      weight: 700,
      lineHeight: footerNameMetrics.style.lineHeight,
      align: getTextAlign(language)
    }
  );

  drawTextBlock(
    ctx,
    QUOTE_COMPANY.subtitle[language] || QUOTE_COMPANY.subtitle.en,
    language,
    brandTextX,
    footerSubtitleY,
    brandTextWidth,
    {
      size: footerSubtitleMetrics.size,
      weight: 400,
      color: PDF_COLORS.textMuted,
      lineHeight: footerSubtitleMetrics.style.lineHeight,
      align: getTextAlign(language)
    }
  );

  drawTextBlock(
    ctx,
    `${QUOTE_COMPANY.phone} | ${QUOTE_COMPANY.email}`,
    language,
    startX,
    footerTop + 10,
    CANVAS_PAGE.contentWidth,
    {
      size: 13,
      weight: 500,
      color: PDF_COLORS.textMuted,
      lineHeight: 1.25,
      align: direction === "rtl" ? "left" : "right"
    }
  );
}

function finishPage(state){
  if(!state.currentPage){
    return;
  }

  drawFooter(state.currentPage, state);
  state.pages.push(state.currentPage.canvas);
  state.currentPage = null;
}

function drawInfoRows(ctx, rows, language, x, y, width){
  const labelWidth = Math.min(250, Math.max(190, width * 0.34));
  const valueWidth = width - labelWidth - 16;
  const labelX = language === "ar" ? x + valueWidth + 16 : x;
  const valueX = language === "ar" ? x : x + labelWidth + 16;
  let currentY = y;

  rows.forEach((row, index) => {
    const labelMeasure = measureTextBlock(ctx, row.label, language, labelWidth, {
      size: 18,
      weight: 700,
      lineHeight: 1.28
    });
    const valueMeasure = measureTextBlock(ctx, row.value, language, valueWidth, {
      size: 18,
      weight: 500,
      lineHeight: 1.35
    });
    const rowHeight = Math.max(labelMeasure.height, valueMeasure.height, 26);

    drawTextBlock(ctx, row.label, language, labelX, currentY, labelWidth, {
      size: 18,
      weight: 700,
      color: PDF_COLORS.textSecondary,
      lineHeight: 1.28,
      align: getTextAlign(language)
    });

    drawTextBlock(ctx, row.value, language, valueX, currentY, valueWidth, {
      size: 18,
      weight: 500,
      color: PDF_COLORS.textPrimary,
      lineHeight: 1.35,
      align: getTextAlign(language)
    });

    if(index < rows.length - 1){
      ctx.strokeStyle = PDF_COLORS.separator;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x + 16, currentY + rowHeight + 14);
      ctx.lineTo(x + width - 16, currentY + rowHeight + 14);
      ctx.stroke();
    }

    currentY += rowHeight + 30;
  });

  return currentY - y;
}

function measureInfoRows(ctx, rows, language, width){
  const labelWidth = Math.min(250, Math.max(190, width * 0.34));
  const valueWidth = width - labelWidth - 16;
  let total = 0;

  rows.forEach((row, index) => {
    const labelMeasure = measureTextBlock(ctx, row.label, language, labelWidth, {
      size: 18,
      weight: 700,
      lineHeight: 1.28
    });
    const valueMeasure = measureTextBlock(ctx, row.value, language, valueWidth, {
      size: 18,
      weight: 500,
      lineHeight: 1.35
    });

    total += Math.max(labelMeasure.height, valueMeasure.height, 26);

    if(index < rows.length - 1){
      total += 30;
    }
  });

  return total;
}

function drawCard(ctx, x, y, width, height, fill = PDF_COLORS.cardFill, stroke = PDF_COLORS.border){
  roundRect(ctx, x, y, width, height, CARD_RADIUS, fill, stroke, 2);
}

function drawHeaderSection(state){
  const { ctx } = state.currentPage;
  const language = state.quote.language;
  const direction = state.quote.direction;
  const leftWidth = Math.round(CANVAS_PAGE.contentWidth * 0.55);
  const rightWidth = CANVAS_PAGE.contentWidth - leftWidth - GUTTER;
  const x = CANVAS_PAGE.margin;
  const y = state.currentY;
  const logoSize = 120;
  const logoFrameSize = 136;
  const leftPadding = 36;
  const rightPadding = 40;
  const leftInnerWidth = leftWidth - (leftPadding * 2);
  const textWidth = leftInnerWidth - logoFrameSize - 24;
  const companyNameMetrics = getFittedTextMetrics(
    ctx,
    QUOTE_COMPANY.name[language] || QUOTE_COMPANY.name.en,
    language,
    textWidth,
    {
      maxSize: 44,
      minSize: 30,
      maxLines: 2,
      weight: 800,
      lineHeight: language === "ar" ? 1.24 : 1.12
    }
  );
  const subtitleMetrics = getFittedTextMetrics(
    ctx,
    QUOTE_COMPANY.subtitle[language] || QUOTE_COMPANY.subtitle.en,
    language,
    textWidth,
    {
      maxSize: 20,
      minSize: 16,
      maxLines: 2,
      weight: 500,
      lineHeight: language === "ar" ? 1.34 : 1.25
    }
  );
  const contactWidth = leftInnerWidth;
  const headerContactLine = `${QUOTE_COMPANY.phone} · ${QUOTE_COMPANY.email} · ${QUOTE_COMPANY.instagram}`;
  const contactLineHeight = measureTextBlock(ctx, headerContactLine, language, contactWidth, {
    size: 17,
    weight: 500,
    lineHeight: language === "ar" ? 1.32 : 1.25
  }).height;
  const topClusterHeight = Math.max(
    logoFrameSize,
    companyNameMetrics.measurement.height + 10 + subtitleMetrics.measurement.height
  );
  const companyLinesHeight = contactLineHeight;
  const metaContentWidth = rightWidth - (rightPadding * 2);
  const metaRowsHeight = measureInfoRows(ctx, state.quote.metaRows, language, metaContentWidth);
  const metaEyebrowHeight = measureTextBlock(ctx, state.quote.labels.quotation, language, metaContentWidth, {
    size: 15,
    weight: 800,
    lineHeight: 1.2
  }).height;
  const metaTitleMetrics = getFittedTextMetrics(
    ctx,
    state.quote.labels.quotation,
    language,
    metaContentWidth,
    {
      maxSize: 42,
      minSize: 32,
      maxLines: 2,
      weight: 800,
      lineHeight: language === "ar" ? 1.14 : 1.05
    }
  );

  const leftHeight = 30 + topClusterHeight + 14 + companyLinesHeight + 24;
  const rightHeight = 40 + metaEyebrowHeight + 12 + metaTitleMetrics.measurement.height + 26 + metaRowsHeight + 40;
  const cardHeight = Math.max(leftHeight, rightHeight);

  drawCard(ctx, x, y, leftWidth, cardHeight, PDF_COLORS.cardFillSoft, PDF_COLORS.border);
  drawCard(ctx, x + leftWidth + GUTTER, y, rightWidth, cardHeight, PDF_COLORS.cardFillSoft, PDF_COLORS.borderGold);

  const logoFrameX = direction === "rtl"
    ? x + leftWidth - leftPadding - logoFrameSize
    : x + leftPadding;
  const logoX = logoFrameX + ((logoFrameSize - logoSize) / 2);
  const textX = direction === "rtl"
    ? x + leftPadding
    : logoFrameX + logoFrameSize + 24;
  const topBlockY = y + 32;
  const subtitleY = topBlockY + companyNameMetrics.measurement.height + 10;
  const companyTextWidth = textWidth;
  const contactX = x + leftPadding;
  const contactY = topBlockY + topClusterHeight + 14;

  roundRect(ctx, logoFrameX, y + 28, logoFrameSize, logoFrameSize, CARD_RADIUS, PDF_COLORS.white, PDF_COLORS.border, 2);
  ctx.drawImage(state.logoImage, logoX - 2, y + 36, logoSize, logoSize);

  drawTextBlock(ctx, QUOTE_COMPANY.name[language] || QUOTE_COMPANY.name.en, language, textX, topBlockY, companyTextWidth, {
    size: companyNameMetrics.size,
    weight: 800,
    lineHeight: companyNameMetrics.style.lineHeight,
    color: PDF_COLORS.textPrimary,
    align: getTextAlign(language)
  });

  drawTextBlock(ctx, QUOTE_COMPANY.subtitle[language] || QUOTE_COMPANY.subtitle.en, language, textX, subtitleY, companyTextWidth, {
    size: subtitleMetrics.size,
    weight: 500,
    color: PDF_COLORS.textSecondary,
    lineHeight: subtitleMetrics.style.lineHeight,
    align: getTextAlign(language)
  });

  drawTextBlock(ctx, headerContactLine, language, contactX, contactY, contactWidth, {
    size: 17,
    weight: 500,
    lineHeight: language === "ar" ? 1.32 : 1.25,
    color: PDF_COLORS.textSecondary
  });

  const metaX = x + leftWidth + GUTTER + rightPadding;
  const metaEyebrowY = y + 40;
  const metaTitleY = metaEyebrowY + metaEyebrowHeight + 12;
  const metaRowsY = metaTitleY + metaTitleMetrics.measurement.height + 26;

  drawTextBlock(ctx, state.quote.labels.quotation, language, metaX, metaEyebrowY, metaContentWidth, {
    size: 15,
    weight: 800,
    color: PDF_COLORS.accentGold,
    lineHeight: 1.2,
    align: getTextAlign(language)
  });

  drawTextBlock(ctx, state.quote.labels.quotation, language, metaX, metaTitleY, metaContentWidth, {
    size: metaTitleMetrics.size,
    weight: 800,
    color: PDF_COLORS.textPrimary,
    lineHeight: metaTitleMetrics.style.lineHeight,
    align: getTextAlign(language)
  });

  drawInfoRows(
    ctx,
    state.quote.metaRows,
    language,
    metaX,
    metaRowsY,
    metaContentWidth
  );

  state.currentY = y + cardHeight + 26;
}

function drawDualInfoCards(state){
  const measureCtx = state.currentPage.ctx;
  const language = state.quote.language;
  const cardWidth = (CANVAS_PAGE.contentWidth - GUTTER) / 2;
  const x = CANVAS_PAGE.margin;
  const innerWidth = cardWidth - 64;
  const customerRowsHeight = measureInfoRows(measureCtx, state.quote.customerRows, language, innerWidth);
  const eventRowsHeight = measureInfoRows(measureCtx, state.quote.eventRows, language, innerWidth);
  const headerSpace = 94;
  const cardHeight = Math.max(customerRowsHeight, eventRowsHeight) + headerSpace;

  ensurePage(state, cardHeight + 30);
  const { ctx } = state.currentPage;
  const y = state.currentY;

  drawCard(ctx, x, y, cardWidth, cardHeight);
  drawCard(ctx, x + cardWidth + GUTTER, y, cardWidth, cardHeight);

  drawTextBlock(ctx, state.quote.labels.customerDetails, language, x + 32, y + 28, innerWidth, {
    size: 22,
    weight: 800,
    lineHeight: 1.1
  });

  drawTextBlock(ctx, state.quote.labels.eventDetails, language, x + cardWidth + GUTTER + 32, y + 28, innerWidth, {
    size: 22,
    weight: 800,
    lineHeight: 1.1
  });

  drawInfoRows(ctx, state.quote.customerRows, language, x + 32, y + 78, innerWidth);
  drawInfoRows(ctx, state.quote.eventRows, language, x + cardWidth + GUTTER + 32, y + 78, innerWidth);

  state.currentY = y + cardHeight + 26;
}

function drawSectionHeading(state, title){
  const { ctx } = state.currentPage;
  const headingHeight = drawTextBlock(ctx, title, state.quote.language, CANVAS_PAGE.margin, state.currentY, CANVAS_PAGE.contentWidth, {
    size: 24,
    weight: 800,
    color: PDF_COLORS.textPrimary,
    lineHeight: 1.1
  });
  state.currentY += headingHeight + 10;
}

function drawTableHeader(ctx, quote, x, y, widths){
  const labels = ["#", quote.labels.itemDescription, quote.labels.quantity, quote.labels.unitPrice, quote.labels.amount];
  const aligns = ["center", getTextAlign(quote.language), "center", getTextAlign(quote.language, "money"), getTextAlign(quote.language, "money")];
  const headerHeight = 64;
  let currentX = x;

  roundRect(ctx, x, y, widths.reduce((sum, width) => sum + width, 0), headerHeight, CARD_RADIUS, PDF_COLORS.headerFill, null, 0);
  ctx.strokeStyle = PDF_COLORS.borderGold;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x, y + headerHeight);
  ctx.lineTo(x + widths.reduce((sum, width) => sum + width, 0), y + headerHeight);
  ctx.stroke();

  labels.forEach((label, index) => {
    drawTextBlock(ctx, label, quote.language, currentX + 14, y + 18, widths[index] - 28, {
      size: 15,
      weight: 700,
      color: "#5C4A2A",
      lineHeight: 1.15,
      align: aligns[index]
    });
    currentX += widths[index];
  });
}

function measureItemRow(ctx, quote, item, widths){
  const descriptionHeight = measureTextBlock(ctx, item.name, quote.language, widths[1] - 26, {
    size: 18,
    weight: 600,
    lineHeight: 1.35
  }).height;

  return Math.max(52, descriptionHeight + 20);
}

function drawItemRow(ctx, quote, item, x, y, widths, rowHeight){
  const rowIsEven = Number(item.index) % 2 === 0;
  const backgrounds = rowIsEven ? PDF_COLORS.pageBackground : PDF_COLORS.white;
  const totalWidth = widths.reduce((sum, width) => sum + width, 0);
  let currentX = x;

  ctx.fillStyle = backgrounds;
  ctx.fillRect(x, y, totalWidth, rowHeight);

  const cells = [
    String(item.index),
    item.name,
    String(item.quantity),
    item.unitPrice,
    item.amount
  ];
  const aligns = ["center", getTextAlign(quote.language), "center", getTextAlign(quote.language, "money"), getTextAlign(quote.language, "money")];
  const sizes = [18, 18, 18, 18, 18];
  currentX = x;

  cells.forEach((cell, index) => {
    drawTextBlock(ctx, cell, quote.language, currentX + 16, y + 14, widths[index] - 32, {
      size: sizes[index],
      weight: index === 1 ? 600 : 700,
      color: PDF_COLORS.textPrimary,
      lineHeight: 1.35,
      align: aligns[index]
    });
    currentX += widths[index];
  });

  ctx.strokeStyle = PDF_COLORS.separator;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x + 16, y + rowHeight);
  ctx.lineTo(x + totalWidth - 16, y + rowHeight);
  ctx.stroke();
}

function drawItemsTable(state){
  const quote = state.quote;
  const tableX = CANVAS_PAGE.margin;
  const widths = [70, 610, 100, 250, 268];

  ensurePage(state, 120);
  let ctx = state.currentPage.ctx;
  drawSectionHeading(state, quote.labels.itemDescription);
  drawTableHeader(ctx, quote, tableX, state.currentY, widths);
  state.currentY += 78;

  if(!quote.items.length){
    ensurePage(state, 80);
    drawItemRow(ctx, quote, {
      index: "",
      name: "-",
      quantity: "-",
      unitPrice: "-",
      amount: "-"
      }, tableX, state.currentY, widths, 56);
    state.currentY += 70;
    return;
  }

  quote.items.forEach((item) => {
    let rowHeight = measureItemRow(ctx, quote, item, widths);

    if((state.currentY + rowHeight) > CONTENT_BOTTOM){
      startPage(state);
      ctx = state.currentPage.ctx;
      drawSectionHeading(state, quote.labels.itemDescription);
      drawTableHeader(ctx, quote, tableX, state.currentY, widths);
      state.currentY += 78;
      rowHeight = measureItemRow(ctx, quote, item, widths);
    }

    drawItemRow(ctx, quote, item, tableX, state.currentY, widths, rowHeight);
    state.currentY += rowHeight;
  });

  state.currentY += 14;
}

function drawTotalsCard(state){
  const quote = state.quote;
  const cardWidth = 436;
  const contentWidth = cardWidth - 60;
  const columnGap = quote.language === "ar" ? 24 : 18;
  const valueWidth = quote.language === "ar" ? 162 : 154;
  const labelWidth = contentWidth - valueWidth - columnGap;
  const headingMeasure = measureTextBlock(ctxMeasureCanvas(), quote.labels.totals, quote.language, contentWidth, {
    size: 22,
    weight: 800,
    lineHeight: 1.1
  });
  const rowHeights = quote.totalRows.map((row) => {
    const labelHeight = measureTextBlock(ctxMeasureCanvas(), row.label, quote.language, labelWidth, {
      size: row.isGrand ? 20 : 18,
      weight: row.isGrand ? 800 : 500,
      lineHeight: quote.language === "ar" ? 1.32 : 1.2
    }).height;
    const valueHeight = measureTextBlock(ctxMeasureCanvas(), row.value, quote.language, valueWidth, {
      size: row.isGrand ? 26 : 18,
      weight: 800,
      lineHeight: quote.language === "ar" ? 1.28 : 1.2
    }).height;

    return Math.max(labelHeight, valueHeight, row.isGrand ? 34 : 24) + 14;
  });
  const height = 28 + headingMeasure.height + 18 + rowHeights.reduce((sum, rowHeight) => sum + rowHeight, 0) + 20;

  ensurePage(state, height + 20);
  const { ctx } = state.currentPage;

  const x = CANVAS_PAGE.margin + CANVAS_PAGE.contentWidth - cardWidth;
  const y = state.currentY;
  const headingY = y + 24;

  drawCard(ctx, x, y, cardWidth, height, PDF_COLORS.cardFill, PDF_COLORS.border);
  drawTextBlock(ctx, quote.labels.totals, quote.language, x + 30, headingY, contentWidth, {
    size: 22,
    weight: 800,
    color: PDF_COLORS.textPrimary,
    lineHeight: 1.1
  });

  const labelX = quote.language === "ar"
    ? x + 30 + valueWidth + columnGap
    : x + 30;
  const valueX = quote.language === "ar"
    ? x + 30
    : x + 30 + labelWidth + columnGap;
  let currentY = headingY + headingMeasure.height + 18;

  quote.totalRows.forEach((row, index) => {
    const rowHeight = rowHeights[index];

    if(row.isGrand){
      ctx.strokeStyle = PDF_COLORS.borderGold;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x + 30, currentY - 12);
      ctx.lineTo(x + cardWidth - 30, currentY - 12);
      ctx.stroke();
    }

    drawTextBlock(ctx, row.label, quote.language, labelX, currentY, labelWidth, {
      size: row.isGrand ? 20 : 17,
      weight: row.isGrand ? 800 : 500,
      color: row.isGrand ? PDF_COLORS.textPrimary : PDF_COLORS.textMuted,
      lineHeight: quote.language === "ar" ? 1.32 : 1.2,
      align: getTextAlign(quote.language)
    });

    drawTextBlock(ctx, row.value, quote.language, valueX, currentY, valueWidth, {
      size: row.isGrand ? 26 : 18,
      weight: 800,
      color: PDF_COLORS.textPrimary,
      lineHeight: quote.language === "ar" ? 1.28 : 1.2,
      align: getTextAlign(quote.language, "money")
    });

    currentY += rowHeight;
  });

  state.currentY = y + height + 14;
}

function ctxMeasureCanvas(){
  if(!ctxMeasureCanvas.canvas){
    ctxMeasureCanvas.canvas = createCanvas(32, 32);
    ctxMeasureCanvas.ctx = ctxMeasureCanvas.canvas.getContext("2d");
  }

  return ctxMeasureCanvas.ctx;
}

function measureBankCardHeight(ctx, quote, width){
  const headingHeight = 44;
  const contentWidth = width - 64;
  let total = headingHeight + 26;

  quote.bankRows.forEach((row, index) => {
    const labelHeight = measureTextBlock(ctx, row.label, quote.language, contentWidth * 0.34, {
      size: 17,
      weight: 700,
      lineHeight: 1.25
    }).height;
    const valueHeight = measureTextBlock(ctx, row.value, quote.language, contentWidth * 0.62, {
      size: row.isIban ? 22 : 18,
      weight: row.isIban ? 800 : 500,
      lineHeight: row.isIban ? 1.3 : 1.35
    }).height;

    total += Math.max(labelHeight, valueHeight, 26);

    if(index < quote.bankRows.length - 1){
      total += 24;
    }
  });

  return total + 28;
}

function drawBankCard(ctx, quote, x, y, width, height){
  drawCard(ctx, x, y, width, height);
  drawTextBlock(ctx, quote.labels.bankDetails, quote.language, x + 32, y + 24, width - 64, {
    size: 22,
    weight: 800,
    color: PDF_COLORS.textPrimary,
    lineHeight: 1.1
  });

  let currentY = y + 72;
  const contentWidth = width - 64;
  const labelWidth = Math.min(210, contentWidth * 0.34);
  const valueWidth = contentWidth - labelWidth - 16;
  const labelX = quote.language === "ar" ? x + 32 + valueWidth + 16 : x + 32;
  const valueX = quote.language === "ar" ? x + 32 : x + 32 + labelWidth + 16;

  quote.bankRows.forEach((row, index) => {
    const rowHeight = Math.max(
      measureTextBlock(ctx, row.label, quote.language, labelWidth, { size: 17, weight: 700, lineHeight: 1.25 }).height,
      measureTextBlock(ctx, row.value, quote.language, valueWidth, {
        size: row.isIban ? 22 : 18,
        weight: row.isIban ? 800 : 500,
        lineHeight: row.isIban ? 1.3 : 1.35
      }).height,
      26
    );

    drawTextBlock(ctx, row.label, quote.language, labelX, currentY, labelWidth, {
      size: 17,
      weight: 700,
      color: PDF_COLORS.textSecondary,
      lineHeight: 1.25
    });

    drawTextBlock(ctx, row.value, quote.language, valueX, currentY, valueWidth, {
      size: row.isIban ? 22 : 18,
      weight: row.isIban ? 800 : 500,
      color: PDF_COLORS.textPrimary,
      lineHeight: row.isIban ? 1.3 : 1.35
    });

    if(index < quote.bankRows.length - 1){
      ctx.strokeStyle = PDF_COLORS.separator;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x + 32, currentY + rowHeight + 12);
      ctx.lineTo(x + width - 32, currentY + rowHeight + 12);
      ctx.stroke();
    }

    currentY += rowHeight + 24;
  });
}

function measureTermsCardHeight(ctx, quote, width){
  const headingHeight = 44;
  const contentWidth = width - 64;
  const bulletWidth = contentWidth - 26;
  let total = headingHeight + 26;

  quote.terms.forEach((term) => {
    total += Math.max(24, measureTextBlock(ctx, term, quote.language, bulletWidth, {
      size: 18,
      weight: 500,
      lineHeight: 1.4
    }).height) + 16;
  });

  return total + 20;
}

function drawTermsCard(ctx, quote, x, y, width, height){
  drawCard(ctx, x, y, width, height);
  drawTextBlock(ctx, quote.labels.terms, quote.language, x + 32, y + 24, width - 64, {
    size: 22,
    weight: 800,
    color: PDF_COLORS.textPrimary,
    lineHeight: 1.1
  });

  let currentY = y + 74;
  const bulletWidth = width - 92;

  quote.terms.forEach((term) => {
    ctx.fillStyle = PDF_COLORS.accentGold;
    ctx.beginPath();
    ctx.arc(x + 36, currentY + 12, 5, 0, Math.PI * 2);
    ctx.fill();

    const blockHeight = drawTextBlock(ctx, term, quote.language, x + 54, currentY, bulletWidth, {
      size: 18,
      weight: 500,
      color: PDF_COLORS.textPrimary,
      lineHeight: 1.4
    });

    currentY += Math.max(24, blockHeight) + 18;
  });
}

function drawBottomCards(state){
  const quote = state.quote;
  const measureCtx = state.currentPage.ctx;
  const leftWidth = Math.round(CANVAS_PAGE.contentWidth * 0.55);
  const rightWidth = CANVAS_PAGE.contentWidth - leftWidth - GUTTER;
  const bankHeight = measureBankCardHeight(measureCtx, quote, leftWidth);
  const termsHeight = measureTermsCardHeight(measureCtx, quote, rightWidth);
  const blockHeight = Math.max(bankHeight, termsHeight);

  ensurePage(state, blockHeight + 12);
  const { ctx } = state.currentPage;

  const x = CANVAS_PAGE.margin;
  const y = state.currentY;

  drawBankCard(ctx, quote, x, y, leftWidth, blockHeight);
  drawTermsCard(ctx, quote, x + leftWidth + GUTTER, y, rightWidth, blockHeight);

  state.currentY = y + blockHeight + 18;
}

async function renderQuotePages(quote){
  const preparedQuote = buildPreparedQuote(quote);
  const logoImage = await loadImage(await getLogoDataUrl());
  const state = {
    quote: preparedQuote,
    logoImage,
    pages: [],
    currentPage: null,
    currentY: CANVAS_PAGE.margin
  };

  startPage(state);
  drawHeaderSection(state);
  drawDualInfoCards(state);
  drawItemsTable(state);
  drawTotalsCard(state);
  drawBottomCards(state);
  finishPage(state);

  return state.pages;
}

function loadImage(src){
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Could not load image"));
    image.src = src;
  });
}

function getJsPdfConstructor(){
  const browserGlobal = typeof globalThis !== "undefined"
    ? globalThis
    : typeof window !== "undefined"
      ? window
      : typeof self !== "undefined"
        ? self
        : null;

  if(browserGlobal?.jspdf?.jsPDF){
    return browserGlobal.jspdf.jsPDF;
  }

  if(browserGlobal?.window?.jspdf?.jsPDF){
    return browserGlobal.window.jspdf.jsPDF;
  }

  if(browserGlobal?.window?.jsPDF){
    return browserGlobal.window.jsPDF;
  }

  if(browserGlobal?.jsPDF){
    return browserGlobal.jsPDF;
  }

  throw new Error("jsPDF is not available");
}

export function buildQuotePdfFileName(orderId, version, language = "en"){
  const safeOrderId = String(orderId || "quote").replace(/[^\w-]+/g, "-");
  return `${safeOrderId}-quotation-v${version}-${language}.pdf`;
}

export function calculateQuoteTotals(items, rentalDays = 1, deliveryCharge = 0, discountPercentage = 0){
  const safeRentalDays = Math.max(1, Math.floor(Number(rentalDays) || 1));
  const normalizedItems = (items || []).map((item) => {
    const quantity = Math.max(1, Number(item.quantity) || 0);
    const unitPrice = Number(item.unitPrice) || 0;

    return {
      ...item,
      quantity,
      unitPrice,
      rentalDays: safeRentalDays,
      amount: quantity * unitPrice * safeRentalDays
    };
  });

  const itemsTotal = roundCurrency(normalizedItems.reduce((sum, item) => sum + item.amount, 0));
  const safeDeliveryCharge = Math.max(0, Number(deliveryCharge) || 0);
  const preDiscountSubtotal = roundCurrency(itemsTotal + safeDeliveryCharge);
  const discountConfig = typeof discountPercentage === "object" && discountPercentage !== null
    ? discountPercentage
    : { type: "percentage", value: discountPercentage };
  const discountType = normalizeDiscountType(discountConfig.type);
  const safeDiscountValue = Math.max(0, Number(discountConfig.value) || 0);
  const safeDiscountPercentage = discountType === "percentage"
    ? clampDiscountPercentage(safeDiscountValue)
    : (preDiscountSubtotal > 0 ? roundCurrency((Math.min(preDiscountSubtotal, safeDiscountValue) / preDiscountSubtotal) * 100) : 0);
  const discountAmount = discountType === "fixed"
    ? roundCurrency(Math.min(preDiscountSubtotal, safeDiscountValue))
    : roundCurrency(preDiscountSubtotal * (safeDiscountPercentage / 100));
  const subtotal = roundCurrency(Math.max(0, preDiscountSubtotal - discountAmount));
  const vatAmount = roundCurrency(subtotal * VAT_RATE);
  const grandTotal = roundCurrency(subtotal + vatAmount);

  return {
    items: normalizedItems,
    rentalDays: safeRentalDays,
    itemsTotal,
    deliveryCharge: safeDeliveryCharge,
    preDiscountSubtotal,
    discountType,
    discountValue: discountType === "fixed" ? roundCurrency(Math.min(preDiscountSubtotal, safeDiscountValue)) : safeDiscountPercentage,
    discountPercentage: safeDiscountPercentage,
    discountAmount,
    subtotal,
    vatAmount,
    grandTotal
  };
}

export async function generateQuotePdfBlob(quote){
  if(typeof window === "undefined"){
    throw new Error("Window is not available");
  }

  const jsPDF = getJsPdfConstructor();
  const pages = await renderQuotePages(quote);
  const doc = new jsPDF({
    unit: "pt",
    format: "a4",
    orientation: "portrait",
    compress: true
  });

  pages.forEach((canvas, index) => {
    if(index > 0){
      doc.addPage();
    }

    doc.addImage(
      canvas.toDataURL("image/png"),
      "PNG",
      0,
      0,
      PDF_PAGE.widthPt,
      PDF_PAGE.heightPt,
      `quote-page-${index + 1}`,
      "FAST"
    );
  });

  return doc.output("blob");
}
