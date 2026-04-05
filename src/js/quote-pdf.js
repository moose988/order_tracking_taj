import {
  QUOTE_COMPANY,
  QUOTE_CURRENCY,
  QUOTE_TERMS,
  QUOTE_BANK_FIELD_LABELS,
  VAT_RATE,
  getQuoteLabels
} from "./quote-config.js";

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

function getDirection(language){
  return language === "ar" ? "rtl" : "ltr";
}

function buildBankRows(bankPreset, language){
  const fieldLabels = QUOTE_BANK_FIELD_LABELS[language] || QUOTE_BANK_FIELD_LABELS.en;
  const fields = ["bankName", "branch", "beneficiary", "accountNumber", "iban", "swift"];

  return fields.map((field) => `
    <tr>
      <td>${escapeHtml(fieldLabels[field])}</td>
      <td>${escapeHtml(bankPreset?.[field] || "")}</td>
    </tr>
  `).join("");
}

function buildTermsMarkup(language){
  const terms = QUOTE_TERMS[language] || QUOTE_TERMS.en;

  return terms.map((term) => `<li>${escapeHtml(term)}</li>`).join("");
}

function buildItemRows(items, labels){
  return items.map((item, index) => `
    <tr>
      <td>${index + 1}</td>
      <td>${escapeHtml(item.name)}</td>
      <td>${escapeHtml(item.quantity)}</td>
      <td>${formatMoney(item.unitPrice)} ${labels.currency}</td>
      <td>${formatMoney(item.amount)} ${labels.currency}</td>
    </tr>
  `).join("");
}

function buildQuoteMarkup(quote){
  const language = quote.language === "ar" ? "ar" : "en";
  const labels = getQuoteLabels(language);
  const direction = getDirection(language);
  const align = language === "ar" ? "right" : "left";

  return `
    <div dir="${direction}" style="font-family: Arial, 'Noto Sans Arabic', sans-serif; color: #241f1a; background: #ffffff; padding: 28px;">
      <style>
        .quote-pdf-shell{max-width:900px;margin:0 auto;}
        .quote-pdf-head{display:flex;justify-content:space-between;gap:24px;align-items:flex-start;padding-bottom:18px;border-bottom:2px solid #c9a96a;}
        .quote-pdf-title{font-size:30px;font-weight:700;margin:0 0 8px;}
        .quote-pdf-subtitle{margin:0;color:#746a5f;font-size:14px;line-height:1.6;}
        .quote-pdf-meta{min-width:280px;background:#fbf7f0;border:1px solid #eadfcf;border-radius:16px;padding:16px;}
        .quote-pdf-grid{display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-top:22px;}
        .quote-pdf-card{border:1px solid #eadfcf;border-radius:18px;padding:18px;background:#fffdfa;}
        .quote-pdf-card h3{margin:0 0 12px;font-size:17px;}
        .quote-pdf-card p{margin:0 0 8px;font-size:13px;line-height:1.6;text-align:${align};}
        .quote-pdf-table{width:100%;border-collapse:collapse;margin-top:22px;}
        .quote-pdf-table th,.quote-pdf-table td{border:1px solid #e2d6c5;padding:10px 12px;font-size:13px;text-align:${align};}
        .quote-pdf-table th{background:#f7f0e4;font-weight:700;}
        .quote-pdf-table .quote-pdf-index{text-align:center;width:48px;}
        .quote-pdf-totals{margin-top:22px;margin-left:auto;max-width:360px;}
        .quote-pdf-totals table{width:100%;border-collapse:collapse;}
        .quote-pdf-totals td{padding:9px 12px;border:1px solid #eadfcf;font-size:13px;}
        .quote-pdf-totals tr:last-child td{font-size:15px;font-weight:700;background:#f7f0e4;}
        .quote-pdf-bank{margin-top:22px;}
        .quote-pdf-bank table{width:100%;border-collapse:collapse;}
        .quote-pdf-bank td{border:1px solid #eadfcf;padding:10px 12px;font-size:13px;}
        .quote-pdf-terms{margin-top:22px;border:1px solid #eadfcf;border-radius:18px;padding:18px;background:#fffdfa;}
        .quote-pdf-terms h3{margin:0 0 10px;font-size:17px;}
        .quote-pdf-terms ul{margin:0;padding-${language === "ar" ? "right" : "left"}:20px;}
        .quote-pdf-terms li{margin-bottom:8px;font-size:13px;line-height:1.7;}
        .quote-pdf-footer{margin-top:18px;font-size:12px;color:#746a5f;text-align:center;}
      </style>
      <div class="quote-pdf-shell">
        <div class="quote-pdf-head">
          <div>
            <h1 class="quote-pdf-title">${escapeHtml(QUOTE_COMPANY.name[language] || QUOTE_COMPANY.name.en)}</h1>
            <p class="quote-pdf-subtitle">${escapeHtml(QUOTE_COMPANY.subtitle[language] || QUOTE_COMPANY.subtitle.en)}</p>
            <p class="quote-pdf-subtitle">${escapeHtml(QUOTE_COMPANY.phone)} | ${escapeHtml(QUOTE_COMPANY.whatsapp)}</p>
            <p class="quote-pdf-subtitle">${escapeHtml(QUOTE_COMPANY.email)} | ${escapeHtml(QUOTE_COMPANY.instagram)}</p>
          </div>
          <div class="quote-pdf-meta">
            <p><strong>${escapeHtml(labels.quotation)}</strong></p>
            <p>${escapeHtml(labels.quotationNumber)}: ${escapeHtml(quote.quotationNumber)}</p>
            <p>${escapeHtml(labels.version)}: ${escapeHtml(quote.version)}</p>
            <p>${escapeHtml(labels.quotationDate)}: ${escapeHtml(formatDate(quote.generatedAtISO || quote.generatedAtMs, language))}</p>
            <p>${escapeHtml(labels.rentalDays)}: ${escapeHtml(quote.rentalDays || 1)}</p>
          </div>
        </div>

        <div class="quote-pdf-grid">
          <section class="quote-pdf-card">
            <h3>${escapeHtml(labels.customerDetails)}</h3>
            <p><strong>${escapeHtml(labels.customerName)}:</strong> ${escapeHtml(quote.customerName)}</p>
            <p><strong>${escapeHtml(labels.phone)}:</strong> ${escapeHtml(quote.customerPhone)}</p>
          </section>

          <section class="quote-pdf-card">
            <h3>${escapeHtml(labels.eventDetails)}</h3>
            <p><strong>${escapeHtml(labels.eventDate)}:</strong> ${escapeHtml(quote.eventDate || "")}</p>
            <p><strong>${escapeHtml(labels.eventTime)}:</strong> ${escapeHtml(quote.eventTime || "N/A")}</p>
            <p><strong>${escapeHtml(labels.setupTime)}:</strong> ${escapeHtml(quote.setupTime || "N/A")}</p>
            <p><strong>${escapeHtml(labels.eventLocation)}:</strong> ${escapeHtml(quote.eventLocation || "")}</p>
            <p><strong>${escapeHtml(labels.notes)}:</strong> ${escapeHtml(quote.notes || "-")}</p>
          </section>
        </div>

        <table class="quote-pdf-table">
          <thead>
            <tr>
              <th class="quote-pdf-index">#</th>
              <th>${escapeHtml(labels.itemDescription)}</th>
              <th>${escapeHtml(labels.quantity)}</th>
              <th>${escapeHtml(labels.unitPrice)}</th>
              <th>${escapeHtml(labels.amount)}</th>
            </tr>
          </thead>
          <tbody>
            ${buildItemRows(quote.items || [], labels)}
          </tbody>
        </table>

        <div class="quote-pdf-totals">
          <table>
            <tr>
              <td>${escapeHtml(labels.itemsTotal)}</td>
              <td>${formatMoney(quote.itemsTotal)} ${QUOTE_CURRENCY}</td>
            </tr>
            <tr>
              <td>${escapeHtml(labels.deliveryCharge)}</td>
              <td>${formatMoney(quote.deliveryCharge)} ${QUOTE_CURRENCY}</td>
            </tr>
            <tr>
              <td>${escapeHtml(labels.discount)}</td>
              <td>${formatMoney(quote.discount)} ${QUOTE_CURRENCY}</td>
            </tr>
            <tr>
              <td>${escapeHtml(labels.subtotal)}</td>
              <td>${formatMoney(quote.subtotal)} ${QUOTE_CURRENCY}</td>
            </tr>
            <tr>
              <td>${escapeHtml(`${labels.vat} (${Math.round(VAT_RATE * 100)}%)`)}</td>
              <td>${formatMoney(quote.vatAmount)} ${QUOTE_CURRENCY}</td>
            </tr>
            <tr>
              <td>${escapeHtml(labels.grandTotal)}</td>
              <td>${formatMoney(quote.grandTotal)} ${QUOTE_CURRENCY}</td>
            </tr>
          </table>
        </div>

        <section class="quote-pdf-bank">
          <div class="quote-pdf-card">
            <h3>${escapeHtml(labels.bankDetails)}</h3>
            <table>
              <tbody>
                ${buildBankRows(quote.bankPreset, language)}
              </tbody>
            </table>
          </div>
        </section>

        <section class="quote-pdf-terms">
          <h3>${escapeHtml(labels.terms)}</h3>
          <ul>
            ${buildTermsMarkup(language)}
          </ul>
        </section>

        <div class="quote-pdf-footer">
          ${escapeHtml(QUOTE_COMPANY.name[language] || QUOTE_COMPANY.name.en)}
        </div>
      </div>
    </div>
  `;
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

function waitForAnimationFrame(){
  return new Promise((resolve) => {
    window.requestAnimationFrame(() => {
      resolve();
    });
  });
}

function waitForDelay(delayMs){
  return new Promise((resolve) => {
    window.setTimeout(resolve, delayMs);
  });
}

async function waitForQuoteRender(){
  await waitForAnimationFrame();
  await waitForAnimationFrame();
  await waitForDelay(80);

  if(document.fonts?.ready){
    try{
      await document.fonts.ready;
    }catch{
      // Ignore font readiness failures and continue with capture.
    }
  }

  await waitForAnimationFrame();
}

function createQuoteRenderSurface(quote){
  const renderHost = document.createElement("div");
  renderHost.setAttribute("data-quote-pdf-render-host", "true");
  renderHost.style.position = "fixed";
  renderHost.style.top = "0";
  renderHost.style.left = "0";
  renderHost.style.width = "980px";
  renderHost.style.minHeight = "100vh";
  renderHost.style.padding = "24px";
  renderHost.style.background = "#ffffff";
  renderHost.style.opacity = "0";
  renderHost.style.pointerEvents = "none";
  renderHost.style.overflow = "visible";
  renderHost.style.zIndex = "2147483647";
  renderHost.style.boxSizing = "border-box";
  renderHost.style.contain = "layout style paint";

  const quoteContent = document.createElement("div");
  quoteContent.setAttribute("data-quote-pdf-content", "true");
  quoteContent.style.width = "900px";
  quoteContent.style.maxWidth = "900px";
  quoteContent.style.background = "#ffffff";
  quoteContent.style.margin = "0";
  quoteContent.style.boxSizing = "border-box";
  quoteContent.innerHTML = buildQuoteMarkup(quote);

  renderHost.appendChild(quoteContent);
  document.body.appendChild(renderHost);

  return {
    renderHost,
    quoteContent
  };
}

export async function generateQuotePdfBlob(quote){
  if(typeof window === "undefined" || typeof window.html2pdf !== "function"){
    throw new Error("html2pdf is not available");
  }

  const { renderHost, quoteContent } = createQuoteRenderSurface(quote);

  try{
    await waitForQuoteRender();

    return await window.html2pdf()
      .set({
        margin: [18, 18, 18, 18],
        filename: quote.pdfFileName || buildQuotePdfFileName(quote.quotationNumber, quote.version, quote.language),
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          backgroundColor: "#ffffff",
          windowWidth: 980,
          scrollX: 0,
          scrollY: 0
        },
        jsPDF: {
          unit: "pt",
          format: "a4",
          orientation: "portrait"
        }
      })
      .from(quoteContent)
      .toPdf()
      .outputPdf("blob");
  }finally{
    renderHost.remove();
  }
}
