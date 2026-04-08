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
const CARD_RADIUS = 26;
const GUTTER = 28;
const LOGO_URL = new URL("../../images/logo/logo.jpeg", import.meta.url).href;

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
  const fields = ["bankName", "branch", "beneficiary", "accountNumber", "iban", "swift"];

  return fields.map((field) => ({
    label: fieldLabels[field],
    value: toDisplayText(bankPreset?.[field])
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
  return [
    { label: labels.itemsTotal, value: `${formatMoney(quote.itemsTotal)} ${QUOTE_CURRENCY}` },
    { label: labels.deliveryCharge, value: `${formatMoney(quote.deliveryCharge)} ${QUOTE_CURRENCY}` },
    { label: labels.discount, value: `${formatMoney(quote.discount)} ${QUOTE_CURRENCY}` },
    { label: labels.subtotal, value: `${formatMoney(quote.subtotal)} ${QUOTE_CURRENCY}` },
    { label: `${labels.vat} (${Math.round(VAT_RATE * 100)}%)`, value: `${formatMoney(quote.vatAmount)} ${QUOTE_CURRENCY}` },
    { label: labels.grandTotal, value: `${formatMoney(quote.grandTotal)} ${QUOTE_CURRENCY}`, isGrand: true }
  ];
}

function buildPreparedQuote(quote){
  const language = quote.language === "ar" ? "ar" : "en";
  const labels = getQuoteLabels(language);
  const items = (quote.items || []).map((item, index) => ({
    index: index + 1,
    name: toDisplayText(item.name),
    quantity: Math.max(1, Number(item.quantity) || 1),
    unitPrice: `${formatMoney(item.unitPrice)} ${labels.currency}`,
    amount: `${formatMoney(item.amount)} ${labels.currency}`
  }));

  return {
    ...quote,
    language,
    direction: getDirection(language),
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
  color = "#1f1a17",
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

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#f6efe3";
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

  ctx.strokeStyle = "#e8dccb";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(startX, lineY);
  ctx.lineTo(startX + CANVAS_PAGE.contentWidth, lineY);
  ctx.stroke();

  const logoSize = 44;
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
      minSize: 14,
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
      maxSize: 14,
      minSize: 12,
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
      color: "#7a6e61",
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
      size: 14,
      weight: 500,
      color: "#877968",
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
      color: "#786b5e",
      lineHeight: 1.28,
      align: getTextAlign(language)
    });

    drawTextBlock(ctx, row.value, language, valueX, currentY, valueWidth, {
      size: 18,
      weight: 500,
      color: "#201b17",
      lineHeight: 1.35,
      align: getTextAlign(language)
    });

    if(index < rows.length - 1){
      ctx.strokeStyle = "#eee4d6";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, currentY + rowHeight + 10);
      ctx.lineTo(x + width, currentY + rowHeight + 10);
      ctx.stroke();
    }

    currentY += rowHeight + 22;
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
      total += 22;
    }
  });

  return total;
}

function drawCard(ctx, x, y, width, height, fill = "#fffdfa", stroke = "#e7dccd"){
  roundRect(ctx, x, y, width, height, CARD_RADIUS, fill, stroke, 2);
}

function drawHeaderSection(state){
  const { ctx } = state.currentPage;
  const language = state.quote.language;
  const direction = state.quote.direction;
  const leftWidth = 760;
  const rightWidth = CANVAS_PAGE.contentWidth - leftWidth - GUTTER;
  const x = CANVAS_PAGE.margin;
  const y = state.currentY;
  const logoSize = 100;
  const logoFrameSize = 120;
  const leftPadding = 34;
  const rightPadding = 34;
  const leftInnerWidth = leftWidth - (leftPadding * 2);
  const textWidth = leftInnerWidth - logoFrameSize - 24;
  const companyNameMetrics = getFittedTextMetrics(
    ctx,
    QUOTE_COMPANY.name[language] || QUOTE_COMPANY.name.en,
    language,
    textWidth,
    {
      maxSize: 38,
      minSize: 28,
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
  const phoneHeight = measureTextBlock(ctx, QUOTE_COMPANY.phone, language, contactWidth, {
    size: 18,
    weight: 600,
    lineHeight: language === "ar" ? 1.32 : 1.25
  }).height;
  const emailHeight = measureTextBlock(ctx, QUOTE_COMPANY.email, language, contactWidth, {
    size: 18,
    weight: 500,
    lineHeight: language === "ar" ? 1.32 : 1.25
  }).height;
  const instagramHeight = measureTextBlock(ctx, QUOTE_COMPANY.instagram, language, contactWidth, {
    size: 18,
    weight: 500,
    lineHeight: language === "ar" ? 1.32 : 1.25
  }).height;
  const topClusterHeight = Math.max(
    logoFrameSize,
    companyNameMetrics.measurement.height + 10 + subtitleMetrics.measurement.height
  );
  const companyLinesHeight = phoneHeight + 10 + emailHeight + 10 + instagramHeight;
  const metaContentWidth = rightWidth - (rightPadding * 2);
  const metaRowsHeight = measureInfoRows(ctx, state.quote.metaRows, language, metaContentWidth);
  const metaEyebrowHeight = measureTextBlock(ctx, state.quote.labels.quotation, language, metaContentWidth, {
    size: 16,
    weight: 800,
    lineHeight: 1.2
  }).height;
  const metaTitleMetrics = getFittedTextMetrics(
    ctx,
    state.quote.labels.quotation,
    language,
    metaContentWidth,
    {
      maxSize: 44,
      minSize: 34,
      maxLines: 2,
      weight: 800,
      lineHeight: language === "ar" ? 1.14 : 1.05
    }
  );

  const leftHeight = 30 + topClusterHeight + 22 + companyLinesHeight + 30;
  const rightHeight = 32 + metaEyebrowHeight + 10 + metaTitleMetrics.measurement.height + 24 + metaRowsHeight + 32;
  const cardHeight = Math.max(leftHeight, rightHeight);

  drawCard(ctx, x, y, leftWidth, cardHeight, "#fffaf1", "#eadcc5");
  drawCard(ctx, x + leftWidth + GUTTER, y, rightWidth, cardHeight, "#fff9ec", "#dec59f");

  const logoFrameX = direction === "rtl"
    ? x + leftWidth - leftPadding - logoFrameSize
    : x + leftPadding;
  const logoX = logoFrameX + ((logoFrameSize - logoSize) / 2);
  const textX = direction === "rtl"
    ? x + leftPadding
    : logoFrameX + logoFrameSize + 24;
  const topBlockY = y + 34;
  const subtitleY = topBlockY + companyNameMetrics.measurement.height + 10;
  const companyTextWidth = textWidth;
  const contactX = x + leftPadding;
  const contactY = topBlockY + topClusterHeight + 22;

  roundRect(ctx, logoFrameX, y + 30, logoFrameSize, logoFrameSize, 30, "#ffffff", "#eadfce", 2);
  ctx.drawImage(state.logoImage, logoX, y + 40, logoSize, logoSize);

  drawTextBlock(ctx, QUOTE_COMPANY.name[language] || QUOTE_COMPANY.name.en, language, textX, topBlockY, companyTextWidth, {
    size: companyNameMetrics.size,
    weight: 800,
    lineHeight: companyNameMetrics.style.lineHeight,
    align: getTextAlign(language)
  });

  drawTextBlock(ctx, QUOTE_COMPANY.subtitle[language] || QUOTE_COMPANY.subtitle.en, language, textX, subtitleY, companyTextWidth, {
    size: subtitleMetrics.size,
    weight: 500,
    color: "#7b6e60",
    lineHeight: subtitleMetrics.style.lineHeight,
    align: getTextAlign(language)
  });

  let companyY = contactY;
  companyY += drawTextBlock(ctx, QUOTE_COMPANY.phone, language, contactX, companyY, contactWidth, {
    size: 18,
    weight: 600,
    lineHeight: language === "ar" ? 1.32 : 1.25,
    color: "#403830"
  }) + 10;
  companyY += drawTextBlock(ctx, QUOTE_COMPANY.email, language, contactX, companyY, contactWidth, {
    size: 18,
    weight: 500,
    lineHeight: language === "ar" ? 1.32 : 1.25,
    color: "#403830"
  }) + 10;
  drawTextBlock(ctx, QUOTE_COMPANY.instagram, language, contactX, companyY, contactWidth, {
    size: 18,
    weight: 500,
    lineHeight: language === "ar" ? 1.32 : 1.25,
    color: "#403830"
  });

  const metaX = x + leftWidth + GUTTER + rightPadding;
  const metaEyebrowY = y + 32;
  const metaTitleY = metaEyebrowY + metaEyebrowHeight + 10;
  const metaRowsY = metaTitleY + metaTitleMetrics.measurement.height + 24;

  drawTextBlock(ctx, state.quote.labels.quotation, language, metaX, metaEyebrowY, metaContentWidth, {
    size: 16,
    weight: 800,
    color: "#aa7b2e",
    lineHeight: 1.2,
    align: getTextAlign(language)
  });

  drawTextBlock(ctx, state.quote.labels.quotation, language, metaX, metaTitleY, metaContentWidth, {
    size: metaTitleMetrics.size,
    weight: 800,
    color: "#241f19",
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
  const innerWidth = cardWidth - 48;
  const customerRowsHeight = measureInfoRows(measureCtx, state.quote.customerRows, language, innerWidth);
  const eventRowsHeight = measureInfoRows(measureCtx, state.quote.eventRows, language, innerWidth);
  const headerSpace = 84;
  const cardHeight = Math.max(customerRowsHeight, eventRowsHeight) + headerSpace;

  ensurePage(state, cardHeight + 30);
  const { ctx } = state.currentPage;
  const y = state.currentY;

  drawCard(ctx, x, y, cardWidth, cardHeight);
  drawCard(ctx, x + cardWidth + GUTTER, y, cardWidth, cardHeight);

  drawTextBlock(ctx, state.quote.labels.customerDetails, language, x + 24, y + 24, innerWidth, {
    size: 24,
    weight: 800,
    lineHeight: 1.1
  });

  drawTextBlock(ctx, state.quote.labels.eventDetails, language, x + cardWidth + GUTTER + 24, y + 24, innerWidth, {
    size: 24,
    weight: 800,
    lineHeight: 1.1
  });

  drawInfoRows(ctx, state.quote.customerRows, language, x + 24, y + 68, innerWidth);
  drawInfoRows(ctx, state.quote.eventRows, language, x + cardWidth + GUTTER + 24, y + 68, innerWidth);

  state.currentY = y + cardHeight + 26;
}

function drawSectionHeading(state, title){
  const { ctx } = state.currentPage;
  const headingHeight = drawTextBlock(ctx, title, state.quote.language, CANVAS_PAGE.margin, state.currentY, CANVAS_PAGE.contentWidth, {
    size: 26,
    weight: 800,
    lineHeight: 1.1
  });
  state.currentY += headingHeight + 8;
}

function drawTableHeader(ctx, quote, x, y, widths){
  const labels = ["#", quote.labels.itemDescription, quote.labels.quantity, quote.labels.unitPrice, quote.labels.amount];
  const aligns = ["center", getTextAlign(quote.language), "center", getTextAlign(quote.language, "money"), getTextAlign(quote.language, "money")];
  let currentX = x;

  labels.forEach((label, index) => {
    roundRect(
      ctx,
      currentX,
      y,
      widths[index],
      58,
      index === 0 || index === labels.length - 1 ? 18 : 0,
      "#f8efdf",
      "#dcc8a3",
      2
    );
    drawTextBlock(ctx, label, quote.language, currentX + 14, y + 18, widths[index] - 28, {
      size: 17,
      weight: 800,
      color: "#624c2a",
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
  const backgrounds = item.index % 2 === 0 ? "#fffbf5" : "#ffffff";
  let currentX = x;

  widths.forEach((width) => {
    ctx.fillStyle = backgrounds;
    ctx.fillRect(currentX, y, width, rowHeight);
    ctx.strokeStyle = "#eadfce";
    ctx.lineWidth = 2;
    ctx.strokeRect(currentX, y, width, rowHeight);
    currentX += width;
  });

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
    drawTextBlock(ctx, cell, quote.language, currentX + 14, y + 12, widths[index] - 28, {
      size: sizes[index],
      weight: index === 1 ? 600 : 700,
      color: "#201b17",
      lineHeight: 1.35,
      align: aligns[index]
    });
    currentX += widths[index];
  });
}

function drawItemsTable(state){
  const quote = state.quote;
  const tableX = CANVAS_PAGE.margin;
  const widths = [70, 560, 110, 284, 284];

  ensurePage(state, 120);
  let ctx = state.currentPage.ctx;
  drawSectionHeading(state, quote.labels.itemDescription);
  drawTableHeader(ctx, quote, tableX, state.currentY, widths);
  state.currentY += 70;

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
      state.currentY += 70;
      rowHeight = measureItemRow(ctx, quote, item, widths);
    }

    drawItemRow(ctx, quote, item, tableX, state.currentY, widths, rowHeight);
    state.currentY += rowHeight;
  });

  state.currentY += 26;
}

function drawTotalsCard(state){
  const quote = state.quote;
  const cardWidth = 390;
  const contentWidth = cardWidth - 48;
  const columnGap = quote.language === "ar" ? 24 : 18;
  const valueWidth = quote.language === "ar" ? 150 : 138;
  const labelWidth = contentWidth - valueWidth - columnGap;
  const headingMeasure = measureTextBlock(ctxMeasureCanvas(), quote.labels.totals, quote.language, contentWidth, {
    size: 24,
    weight: 800,
    lineHeight: 1.1
  });
  const rowHeights = quote.totalRows.map((row) => {
    const labelHeight = measureTextBlock(ctxMeasureCanvas(), row.label, quote.language, labelWidth, {
      size: row.isGrand ? 20 : 18,
      weight: row.isGrand ? 800 : 600,
      lineHeight: quote.language === "ar" ? 1.32 : 1.2
    }).height;
    const valueHeight = measureTextBlock(ctxMeasureCanvas(), row.value, quote.language, valueWidth, {
      size: row.isGrand ? 20 : 18,
      weight: 800,
      lineHeight: quote.language === "ar" ? 1.28 : 1.2
    }).height;

    return Math.max(labelHeight, valueHeight, row.isGrand ? 28 : 24) + 12;
  });
  const height = 24 + headingMeasure.height + 18 + rowHeights.reduce((sum, rowHeight) => sum + rowHeight, 0) + 18;

  ensurePage(state, height + 20);
  const { ctx } = state.currentPage;

  const x = CANVAS_PAGE.margin + CANVAS_PAGE.contentWidth - cardWidth;
  const y = state.currentY;
  const headingY = y + 20;

  drawCard(ctx, x, y, cardWidth, height, "#fffdf9", "#e2d4be");
  drawTextBlock(ctx, quote.labels.totals, quote.language, x + 24, headingY, contentWidth, {
    size: 24,
    weight: 800,
    lineHeight: 1.1
  });

  const labelX = quote.language === "ar"
    ? x + 24 + valueWidth + columnGap
    : x + 24;
  const valueX = quote.language === "ar"
    ? x + 24
    : x + 24 + labelWidth + columnGap;
  let currentY = headingY + headingMeasure.height + 18;

  quote.totalRows.forEach((row, index) => {
    const rowHeight = rowHeights[index];

    if(row.isGrand){
      ctx.strokeStyle = "#e6d9c6";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x + 24, currentY - 10);
      ctx.lineTo(x + cardWidth - 24, currentY - 10);
      ctx.stroke();
    }

    drawTextBlock(ctx, row.label, quote.language, labelX, currentY, labelWidth, {
      size: row.isGrand ? 20 : 18,
      weight: row.isGrand ? 800 : 600,
      color: row.isGrand ? "#1e1814" : "#6f6459",
      lineHeight: quote.language === "ar" ? 1.32 : 1.2,
      align: getTextAlign(quote.language)
    });

    drawTextBlock(ctx, row.value, quote.language, valueX, currentY, valueWidth, {
      size: row.isGrand ? 20 : 18,
      weight: 800,
      color: "#1e1814",
      lineHeight: quote.language === "ar" ? 1.28 : 1.2,
      align: getTextAlign(quote.language, "money")
    });

    currentY += rowHeight;
  });

  state.currentY = y + height + 26;
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
  const contentWidth = width - 48;
  let total = headingHeight + 26;

  quote.bankRows.forEach((row, index) => {
    const labelHeight = measureTextBlock(ctx, row.label, quote.language, contentWidth * 0.36, {
      size: 18,
      weight: 700,
      lineHeight: 1.25
    }).height;
    const valueHeight = measureTextBlock(ctx, row.value, quote.language, contentWidth * 0.6, {
      size: 18,
      weight: 500,
      lineHeight: 1.35
    }).height;

    total += Math.max(labelHeight, valueHeight, 26);

    if(index < quote.bankRows.length - 1){
      total += 20;
    }
  });

  return total + 24;
}

function drawBankCard(ctx, quote, x, y, width, height){
  drawCard(ctx, x, y, width, height);
  drawTextBlock(ctx, quote.labels.bankDetails, quote.language, x + 24, y + 22, width - 48, {
    size: 24,
    weight: 800,
    lineHeight: 1.1
  });

  let currentY = y + 68;
  const contentWidth = width - 48;
  const labelWidth = Math.min(220, contentWidth * 0.36);
  const valueWidth = contentWidth - labelWidth - 16;
  const labelX = quote.language === "ar" ? x + 24 + valueWidth + 16 : x + 24;
  const valueX = quote.language === "ar" ? x + 24 : x + 24 + labelWidth + 16;

  quote.bankRows.forEach((row, index) => {
    const rowHeight = Math.max(
      measureTextBlock(ctx, row.label, quote.language, labelWidth, { size: 18, weight: 700, lineHeight: 1.25 }).height,
      measureTextBlock(ctx, row.value, quote.language, valueWidth, { size: 18, weight: 500, lineHeight: 1.35 }).height,
      26
    );

    drawTextBlock(ctx, row.label, quote.language, labelX, currentY, labelWidth, {
      size: 18,
      weight: 700,
      color: "#776a5e",
      lineHeight: 1.25
    });

    drawTextBlock(ctx, row.value, quote.language, valueX, currentY, valueWidth, {
      size: 18,
      weight: 500,
      color: "#201b17",
      lineHeight: 1.35
    });

    if(index < quote.bankRows.length - 1){
      ctx.strokeStyle = "#eee4d7";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x + 24, currentY + rowHeight + 10);
      ctx.lineTo(x + width - 24, currentY + rowHeight + 10);
      ctx.stroke();
    }

    currentY += rowHeight + 20;
  });
}

function measureTermsCardHeight(ctx, quote, width){
  const headingHeight = 44;
  const contentWidth = width - 60;
  const bulletWidth = contentWidth - 26;
  let total = headingHeight + 26;

  quote.terms.forEach((term) => {
    total += Math.max(24, measureTextBlock(ctx, term, quote.language, bulletWidth, {
      size: 18,
      weight: 500,
      lineHeight: 1.4
    }).height) + 16;
  });

  return total + 12;
}

function drawTermsCard(ctx, quote, x, y, width, height){
  drawCard(ctx, x, y, width, height);
  drawTextBlock(ctx, quote.labels.terms, quote.language, x + 24, y + 22, width - 48, {
    size: 24,
    weight: 800,
    lineHeight: 1.1
  });

  let currentY = y + 70;
  const bulletWidth = width - 86;

  quote.terms.forEach((term) => {
    ctx.fillStyle = "#b48645";
    ctx.beginPath();
    ctx.arc(x + 30, currentY + 12, 4.5, 0, Math.PI * 2);
    ctx.fill();

    const blockHeight = drawTextBlock(ctx, term, quote.language, x + 48, currentY, bulletWidth, {
      size: 18,
      weight: 500,
      color: "#38312a",
      lineHeight: 1.4
    });

    currentY += Math.max(24, blockHeight) + 16;
  });
}

function drawBottomCards(state){
  const quote = state.quote;
  const measureCtx = state.currentPage.ctx;
  const leftWidth = 700;
  const rightWidth = CANVAS_PAGE.contentWidth - leftWidth - GUTTER;
  const bankHeight = measureBankCardHeight(measureCtx, quote, leftWidth);
  const termsHeight = measureTermsCardHeight(measureCtx, quote, rightWidth);
  const blockHeight = Math.max(bankHeight, termsHeight);

  ensurePage(state, blockHeight + 20);
  const { ctx } = state.currentPage;

  const x = CANVAS_PAGE.margin;
  const y = state.currentY;

  drawBankCard(ctx, quote, x, y, leftWidth, blockHeight);
  drawTermsCard(ctx, quote, x + leftWidth + GUTTER, y, rightWidth, blockHeight);

  state.currentY = y + blockHeight + 24;
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

export function calculateQuoteTotals(items, deliveryCharge = 0, discount = 0){
  const normalizedItems = (items || []).map((item) => {
    const quantity = Math.max(1, Number(item.quantity) || 0);
    const unitPrice = Number(item.unitPrice) || 0;

    return {
      ...item,
      quantity,
      unitPrice,
      amount: quantity * unitPrice
    };
  });

  const itemsTotal = normalizedItems.reduce((sum, item) => sum + item.amount, 0);
  const subtotal = Math.max(0, itemsTotal + (Number(deliveryCharge) || 0) - (Number(discount) || 0));
  const vatAmount = subtotal * VAT_RATE;
  const grandTotal = subtotal + vatAmount;

  return {
    items: normalizedItems,
    itemsTotal,
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
