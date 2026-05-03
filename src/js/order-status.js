export const ORDER_STATUSES = Object.freeze([
  "quote-requested",
  "quote-sent",
  "confirmed",
  "preparing",
  "driver-assigned",
  "out-for-delivery",
  "delivered",
  "collection-requested",
  "collected",
  "cancelled"
]);

export function normalizeOrderStatus(status){
  const value = String(status || "").trim().toLowerCase().replace(/[_\s]+/g, "-");
  const aliases = {
    "quote-requested": "quote-requested",
    "quote-request": "quote-requested",
    "quote-sent": "quote-sent",
    confirmed: "confirmed",
    prepping: "preparing",
    preparation: "preparing",
    preparing: "preparing",
    "driver-assigned": "driver-assigned",
    assigned: "driver-assigned",
    delivery: "out-for-delivery",
    "out-for-delivery": "out-for-delivery",
    outfordelivery: "out-for-delivery",
    delivered: "delivered",
    "collection-requested": "collection-requested",
    "collection-request": "collection-requested",
    collected: "collected",
    returned: "collected",
    cancelled: "cancelled",
    canceled: "cancelled"
  };

  return aliases[value] || value;
}

export function isTerminalOrderStatus(status){
  const normalizedStatus = normalizeOrderStatus(status);
  return normalizedStatus === "delivered" || normalizedStatus === "collected" || normalizedStatus === "cancelled";
}
