export const calculatePrice = (item: any, marketRates: any) => {
  if (!marketRates || !item) return 0;

  let metalRate = 0;
  if (item.purity === "24K Gold") metalRate = marketRates.rate24k;
  else if (item.purity === "22K Gold") metalRate = marketRates.rate22k;
  else if (item.purity === "18K Gold") metalRate = marketRates.rate18k;
  else if (item.purity === "Silver (925)") metalRate = marketRates.silver;

  const metalValue = metalRate * (Number(item.weight) || 0);
  const diamondValue = Number(item.diamondValue) || 0;
  const makingChargesAmt = metalValue * ((Number(item.makingCharges) || 0) / 100);
  
  const preGstTotal = metalValue + diamondValue + makingChargesAmt;
  const gstPercent = item.gst !== undefined && item.gst !== null ? Number(item.gst) : 3;
  const gstAmount = preGstTotal * (gstPercent / 100);
  
  return preGstTotal + gstAmount;
};

export const formatINR = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 0,
  }).format(amount);
};
