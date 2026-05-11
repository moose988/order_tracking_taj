"use strict";

const fs = require("node:fs");
const path = require("node:path");
const {google} = require("googleapis");
const admin = require("firebase-admin");
const {setGlobalOptions, logger} = require("firebase-functions");
const {onDocumentUpdated} = require("firebase-functions/v2/firestore");

setGlobalOptions({maxInstances: 10});

admin.initializeApp();

const db = admin.firestore();
const SHEET_SPREADSHEET_ID = "1KQ6A9bLcy90oPhD9sHGTIqeK5DX1v8oAijCtrEnbpDU";
const SERVICE_ACCOUNT_PATH = path.join(__dirname, "serviceAccountKey.json");
const SHEETS_SCOPE = ["https://www.googleapis.com/auth/spreadsheets"];
const SHEET_HEADERS = Object.freeze([
  "Order ID",
  "Customer Name",
  "Customer Phone",
  "Event Date",
  "Event Time",
  "Setup Time",
  "Location",
  "Items Summary",
  "Total Quantity",
  "Driver Name",
  "Driver Phone",
  "Status",
  "Priority",
  "Notes",
  "Confirmed At",
  "Last Updated",
]);
const SYNC_METADATA_FIELDS = new Set([
  "sheetSynced",
  "sheetSyncedAt",
  "sheetSpreadsheetId",
  "sheetTab",
  "sheetRow",
]);
const WATCHED_FIELDS = [
  "status",
  "customerName",
  "phone",
  "eventDate",
  "eventTime",
  "setupTime",
  "eventLocation",
  "items",
  "driver",
  "notes",
  "priority",
];

let sheetsClientPromise = null;

function normalizeStatus(status) {
  const value = String(status || "")
    .trim()
    .toLowerCase()
    .replace(/[_\s]+/g, "-");

  const aliases = {
    confirmed: "confirmed",
    "order-confirmed": "confirmed",
  };

  return aliases[value] || value;
}

function isConfirmedStatus(status) {
  return normalizeStatus(status) === "confirmed";
}

function getComparableValue(value) {
  if (value == null) {
    return null;
  }

  if (typeof value?.toDate === "function") {
    return value.toDate().toISOString();
  }

  if (Array.isArray(value)) {
    return value.map((entry) => getComparableValue(entry));
  }

  if (typeof value === "object") {
    return Object.keys(value)
      .sort()
      .reduce((accumulator, key) => {
        accumulator[key] = getComparableValue(value[key]);
        return accumulator;
      }, {});
  }

  return value;
}

function hasWatchedFieldChanges(before = {}, after = {}) {
  return WATCHED_FIELDS.some((field) => {
    const previousValue = JSON.stringify(getComparableValue(before[field]));
    const nextValue = JSON.stringify(getComparableValue(after[field]));
    return previousValue !== nextValue;
  });
}

function changedOnlySyncMetadata(before = {}, after = {}) {
  const keys = new Set([...Object.keys(before), ...Object.keys(after)]);

  for (const key of keys) {
    if (!SYNC_METADATA_FIELDS.has(key)) {
      const previousValue = JSON.stringify(getComparableValue(before[key]));
      const nextValue = JSON.stringify(getComparableValue(after[key]));

      if (previousValue !== nextValue) {
        return false;
      }
    }
  }

  return true;
}

function parseEventDate(value) {
  const raw = String(value || "").trim();

  if (!raw) {
    return null;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return new Date(`${raw}T12:00:00Z`);
  }

  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatDayTabName(eventDate) {
  const parsed = parseEventDate(eventDate);

  if (!parsed) {
    return "Unknown Date";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    timeZone: "UTC",
  }).format(parsed);
}

function formatDateForSheet(value) {
  const parsed = parseEventDate(value);
  if (!parsed) {
    return String(value || "");
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(parsed);
}

function formatTimestampForSheet(value) {
  if (!value) {
    return "";
  }

  const date =
    typeof value?.toDate === "function"
      ? value.toDate()
      : value instanceof Date
        ? value
        : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat("en-GB", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
    timeZone: "Asia/Dubai",
  }).format(date);
}

function toArray(value) {
  return Array.isArray(value) ? value : [];
}

function getItemsSummary(items) {
  return toArray(items)
    .map((item) => {
      const name = String(item?.name || "").trim();
      const quantity = Math.max(1, Number(item?.quantity) || 1);
      return name ? `${name} x${quantity}` : "";
    })
    .filter(Boolean)
    .join(", ");
}

function getTotalQuantity(items) {
  return toArray(items).reduce((sum, item) => sum + Math.max(0, Number(item?.quantity) || 0), 0);
}

function getOrderId(orderId, orderData = {}) {
  return String(orderData.orderId || orderId || "").trim();
}

function buildSheetRow(orderId, orderData = {}) {
  return [
    getOrderId(orderId, orderData),
    String(orderData.customerName || "").trim(),
    String(orderData.phone || "").trim(),
    formatDateForSheet(orderData.eventDate),
    String(orderData.eventTime || "").trim(),
    String(orderData.setupTime || "").trim(),
    String(orderData.eventLocation || "").trim(),
    getItemsSummary(orderData.items),
    getTotalQuantity(orderData.items),
    String(orderData.driver?.name || "").trim(),
    String(orderData.driver?.phone || "").trim(),
    normalizeStatus(orderData.status || ""),
    String(orderData.priority || "").trim(),
    String(orderData.notes || "").trim(),
    formatTimestampForSheet(orderData.confirmedAt),
    formatTimestampForSheet(orderData.updatedAt || orderData.sheetSyncedAt || orderData.createdAt),
  ];
}

async function getSheetsClient() {
  if (!sheetsClientPromise) {
    sheetsClientPromise = (async () => {
      if (!fs.existsSync(SERVICE_ACCOUNT_PATH)) {
        throw new Error(`Missing service account file at ${SERVICE_ACCOUNT_PATH}`);
      }

      const credentials = JSON.parse(fs.readFileSync(SERVICE_ACCOUNT_PATH, "utf8"));
      const auth = new google.auth.GoogleAuth({
        credentials,
        scopes: SHEETS_SCOPE,
      });

      return google.sheets({
        version: "v4",
        auth: await auth.getClient(),
      });
    })();
  }

  return sheetsClientPromise;
}

async function getSpreadsheet(sheets) {
  const response = await sheets.spreadsheets.get({
    spreadsheetId: SHEET_SPREADSHEET_ID,
  });

  return response.data;
}

async function ensureSheetTab(sheets, tabName) {
  const spreadsheet = await getSpreadsheet(sheets);
  const existingSheet = spreadsheet.sheets?.find(
    (sheet) => sheet.properties?.title === tabName,
  );

  if (existingSheet) {
    await ensureHeaderRow(sheets, tabName);
    return existingSheet.properties.sheetId;
  }

  const batchResponse = await sheets.spreadsheets.batchUpdate({
    spreadsheetId: SHEET_SPREADSHEET_ID,
    requestBody: {
      requests: [{
        addSheet: {
          properties: {title: tabName},
        },
      }],
    },
  });

  const newSheetId =
    batchResponse.data.replies?.[0]?.addSheet?.properties?.sheetId;

  await ensureHeaderRow(sheets, tabName);
  return newSheetId;
}

async function ensureHeaderRow(sheets, tabName) {
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_SPREADSHEET_ID,
    range: `${tabName}!A1:P1`,
  });

  const firstRow = response.data.values?.[0] || [];
  const hasExpectedHeaders =
    firstRow.length === SHEET_HEADERS.length &&
    SHEET_HEADERS.every((header, index) => firstRow[index] === header);

  if (hasExpectedHeaders) {
    return;
  }

  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_SPREADSHEET_ID,
    range: `${tabName}!A1:P1`,
    valueInputOption: "RAW",
    requestBody: {
      values: [SHEET_HEADERS],
    },
  });
}

async function findOrderRow(sheets, tabName, orderId) {
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_SPREADSHEET_ID,
    range: `${tabName}!A:A`,
  });

  const values = response.data.values || [];
  const target = String(orderId || "").trim();

  for (let index = 1; index < values.length; index += 1) {
    if (String(values[index]?.[0] || "").trim() === target) {
      return index + 1;
    }
  }

  return null;
}

async function upsertOrderRow(sheets, tabName, rowValues, orderId) {
  const existingRow = await findOrderRow(sheets, tabName, orderId);

  if (existingRow) {
    await sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_SPREADSHEET_ID,
      range: `${tabName}!A${existingRow}:P${existingRow}`,
      valueInputOption: "RAW",
      requestBody: {
        values: [rowValues],
      },
    });

    return existingRow;
  }

  const appendResponse = await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_SPREADSHEET_ID,
    range: `${tabName}!A:P`,
    valueInputOption: "RAW",
    insertDataOption: "INSERT_ROWS",
    requestBody: {
      values: [rowValues],
    },
  });

  const updatedRange = appendResponse.data.updates?.updatedRange || "";
  const rowMatch = updatedRange.match(/![A-Z]+(\d+):/i);
  return rowMatch ? Number(rowMatch[1]) : null;
}

async function markOldRowMoved(sheets, tabName, rowNumber, newTabName) {
  if (!tabName || !rowNumber || tabName === newTabName) {
    return;
  }

  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_SPREADSHEET_ID,
      range: `${tabName}!A${rowNumber}:P${rowNumber}`,
    });

    const row = response.data.values?.[0];
    if (!row || !row.length) {
      return;
    }

    const nextRow = [...row];
    nextRow[11] = "moved";
    nextRow[13] = `Moved to ${newTabName} on ${formatTimestampForSheet(new Date())}`;
    nextRow[15] = formatTimestampForSheet(new Date());

    await sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_SPREADSHEET_ID,
      range: `${tabName}!A${rowNumber}:P${rowNumber}`,
      valueInputOption: "RAW",
      requestBody: {
        values: [nextRow],
      },
    });
  } catch (error) {
    logger.warn("Failed to mark previous sheet row as moved.", {
      tabName,
      rowNumber,
      newTabName,
      error: error.message,
    });
  }
}

async function writeSyncMetadata(orderRef, tabName, rowNumber) {
  await orderRef.update({
    sheetSynced: true,
    sheetSyncedAt: admin.firestore.FieldValue.serverTimestamp(),
    sheetSpreadsheetId: SHEET_SPREADSHEET_ID,
    sheetTab: tabName,
    sheetRow: rowNumber || null,
  });
}

async function syncOrderToSheet(orderId, orderData, beforeData = {}) {
  const sheets = await getSheetsClient();
  const orderRef = db.collection("orders").doc(orderId);
  const tabName = formatDayTabName(orderData.eventDate);

  await ensureSheetTab(sheets, tabName);

  const rowValues = buildSheetRow(orderId, orderData);
  const rowNumber = await upsertOrderRow(
    sheets,
    tabName,
    rowValues,
    getOrderId(orderId, orderData),
  );

  const previousTab = String(beforeData.sheetTab || "").trim();
  const previousRow = Number(beforeData.sheetRow) || null;

  if (previousTab && previousTab !== tabName && previousRow) {
    await markOldRowMoved(sheets, previousTab, previousRow, tabName);
  }

  await writeSyncMetadata(orderRef, tabName, rowNumber);

  logger.info("Order synced to Google Sheets.", {
    orderId,
    tabName,
    rowNumber,
  });
}

exports.syncConfirmedOrdersToGoogleSheets = onDocumentUpdated(
  "orders/{orderId}",
  async (event) => {
    const beforeData = event.data.before.data() || {};
    const afterData = event.data.after.data() || {};
    const orderId = event.params.orderId;

    if (changedOnlySyncMetadata(beforeData, afterData)) {
      return;
    }

    const wasConfirmed = isConfirmedStatus(beforeData.status);
    const isConfirmed = isConfirmedStatus(afterData.status);
    const justBecameConfirmed = !wasConfirmed && isConfirmed;
    const confirmedOrderChanged = wasConfirmed && isConfirmed && hasWatchedFieldChanges(beforeData, afterData);

    if (!justBecameConfirmed && !confirmedOrderChanged) {
      return;
    }

    try {
      await syncOrderToSheet(orderId, afterData, beforeData);
    } catch (error) {
      logger.error("Google Sheets sync failed for order.", {
        orderId,
        error: error.message,
        stack: error.stack,
      });
    }
  },
);
