export const calculatePrice = (item: any, marketRates: any): number => {
  if (!item) return 0;

  // If item already has a fixed numeric price and no weight
  if (typeof item.price === "number" && item.price > 0 && !item.weight) {
    return Math.round(item.price);
  }

  if (marketRates) {
    let metalRate = 0;
    const p = String(item.purity || "").toLowerCase();

    if (p.includes("24k")) {
      metalRate = Number(marketRates.rate24k) || 0;
    } else if (p.includes("22k")) {
      metalRate = Number(marketRates.rate22k) || 0;
    } else if (p.includes("18k")) {
      metalRate = Number(marketRates.rate18k) || 0;
    } else if (p.includes("14k")) {
      metalRate = Math.round((Number(marketRates.rate24k) || 0) * (14 / 24));
    } else if (p.includes("silver") || p.includes("925")) {
      metalRate = Number(marketRates.silver) || 0;
    } else {
      metalRate = Number(marketRates.rate22k) || 0;
    }

    const metalValue = metalRate * (Number(item.weight) || 0);
    const diamondValue = Number(item.diamondValue) || 0;
    const makingChargesAmt = metalValue * ((Number(item.makingCharges) || 0) / 100);

    const preGstTotal = metalValue + diamondValue + makingChargesAmt;
    const gstPercent = item.gst !== undefined && item.gst !== null ? Number(item.gst) : 3;
    const gstAmount = preGstTotal * (gstPercent / 100);

    const finalTotal = Math.round(preGstTotal + gstAmount);
    if (finalTotal > 0) return finalTotal;
  }

  // Fallback to explicit item.price if available
  if (typeof item.price === "number" && item.price > 0) {
    return Math.round(item.price);
  }

  // Fallback estimation if market rates are unavailable but weight exists
  if (item.weight) {
    const p = String(item.purity || "").toLowerCase();
    const fallbackRate = p.includes("18k") ? 5600 : p.includes("silver") ? 90 : 6850;
    const metalVal = fallbackRate * (Number(item.weight) || 0);
    const making = metalVal * ((Number(item.makingCharges) || 12) / 100);
    const preGst = metalVal + making + (Number(item.diamondValue) || 0);
    return Math.round(preGst * 1.03);
  }

  return 0;
};

export const formatINR = (amount: number | string | null | undefined): string => {
  const num = Number(amount);
  if (isNaN(num)) return "0";
  return new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 0,
  }).format(num);
};

