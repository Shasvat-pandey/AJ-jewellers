const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

/**
 * Generate a Premium PDF invoice for an order
 * @param {Object} order - Order object with items, customer info, totals
 * @param {Object} settings - StoreSettings object with business info
 * @returns {Promise<Buffer>} PDF buffer
 */
exports.generateInvoice = (order, settings = null) => {
  return new Promise((resolve, reject) => {
    try {
      if (!order || !order.items || !Array.isArray(order.items)) {
        throw new Error('Invalid order structure: missing items array');
      }

      // Default Business Settings
      const businessInfo = settings?.businessInfo || {
        businessName: 'AJ JEWELLERS',
        tagline: 'FASHION & LIFESTYLE',
        email: 'support@ajjewellers.com',
        phone: '+91 98765 43210',
        address: '123 Heritage Lane, Kolkata, West Bengal',
        gstin: '24AAAAA0000A1Z5',
        pan: 'AAAAA0000A',
        gstRate: 3
      };

      const gstRate = businessInfo.gstRate || 3;
      const gstMultiplier = 1 + (gstRate / 100);

      // Check if order has locked gold rate
      const hasLockedGoldRate = order.lockedGoldRate && order.lockedGoldRate > 0;
      const lockedGoldRate = hasLockedGoldRate ? order.lockedGoldRate : null;
      const lockedGoldRateTime = hasLockedGoldRate ? order.lockedGoldRateTimestamp : null;

      // Data normalization
      order.items.forEach((item) => {
        item.price = Number(item.price) || 0;
        item.quantity = Number(item.quantity) || 1;
        item.specs = item.specs || '';
      });

      // Initialize PDF (A4 size)
      const doc = new PDFDocument({
        margin: 0, // Set 0 to allow edge-to-edge background shapes
        size: 'A4',
        layout: 'portrait'
      });

      // Register Fonts (with fallback to avoid crashes)
      const fontsDir = path.join(__dirname, '..', 'fonts', 'dejavu-fonts-ttf-2.37', 'ttf');
      try {
        doc.registerFont('DejaVu', path.join(fontsDir, 'DejaVuSans.ttf'));
        doc.registerFont('DejaVu-Bold', path.join(fontsDir, 'DejaVuSans-Bold.ttf'));
        doc.registerFont('DejaVu-Oblique', path.join(fontsDir, 'DejaVuSans-Oblique.ttf'));
        // --- THE FIX: ADDED BOLD-OBLIQUE ---
        doc.registerFont('DejaVu-BoldOblique', path.join(fontsDir, 'DejaVuSans-BoldOblique.ttf'));
      } catch (err) {
        console.warn("Custom fonts missing, falling back to standard fonts.");
        doc.registerFont('DejaVu', 'Helvetica');
        doc.registerFont('DejaVu-Bold', 'Helvetica-Bold');
        doc.registerFont('DejaVu-Oblique', 'Helvetica-Oblique');
        // --- THE FIX: ADDED FALLBACK ---
        doc.registerFont('DejaVu-BoldOblique', 'Helvetica-BoldOblique');
      }

      const chunks = [];
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', (err) => reject(err));

      // --- BRAND COLORS ---
      const MAROON = '#4A0E1B';
      const GOLD = '#C9A24B';
      const BEIGE = '#FDFBF4';
      const WHITE = '#FFFFFF';
      const TEXT_DARK = '#2A0A10';
      const TEXT_MUTED = '#7A6A5C';

      // Formatters
      const formatCurrency = (num) => `₹${(Number(num) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      const shortId = order._id.toString().slice(-6).toUpperCase();
      const dateStr = new Date(order.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });

      // ==========================================
      // 1. PAGE BACKGROUND & TOP GRAPHICS
      // ==========================================

      // Auto-fill beige background on every new page
      doc.on('pageAdded', () => {
        doc.rect(0, 0, doc.page.width, doc.page.height).fill(BEIGE);
      });

      // Fill first page background
      doc.rect(0, 0, doc.page.width, doc.page.height).fill(BEIGE);

      // Premium Curved Header (Maroon Blob)
      doc.moveTo(0, 0)
        .lineTo(595.28, 0)
        .lineTo(595.28, 60)
        .bezierCurveTo(400, 60, 300, 220, 0, 180)
        .fill(MAROON);

      // Gold Accent Swoop Line
      doc.moveTo(0, 180)
        .bezierCurveTo(300, 220, 400, 60, 595.28, 60)
        .lineWidth(4)
        .stroke(GOLD);

      // ==========================================
      // 2. HEADER TEXT (Inside the Maroon Graphic)
      // ==========================================
      doc.fillColor(GOLD).font('DejaVu-Bold').fontSize(36).text(businessInfo.businessName, 40, 50);
      doc.fillColor('#E7C9B8').font('DejaVu').fontSize(10).text(businessInfo.tagline, 44, 90, { letterSpacing: 2 });

      doc.fillColor(TEXT_DARK).font('DejaVu-Bold').fontSize(26).text('INVOICE', 0, 150, { align: 'right', width: 540, characterSpacing: 2 });

      // ==========================================
      // 3. BILLING INFO & META
      // ==========================================
      let currentY = 240;

      // Left Column: Bill To
      doc.fillColor(GOLD).font('DejaVu-Bold').fontSize(11).text('BILL TO:', 40, currentY);
      doc.fillColor(TEXT_DARK).fontSize(14).text(order.customerName, 40, currentY + 16);

      doc.font('DejaVu').fontSize(10).fillColor(TEXT_MUTED);
      doc.text(order.address.replace(/\(Coordinates.*\)/, '').trim(), 40, currentY + 36, { width: 220, lineGap: 3 });
      doc.text(`${order.city} - ${order.pincode}`, 40, doc.y);
      doc.text(`Phone: ${order.phone}`, 40, doc.y);
      doc.text(`Email: ${order.email}`, 40, doc.y);

      // Right Column: Invoice Meta
      const metaX = 350;
      doc.font('DejaVu-Bold').fontSize(10).fillColor(TEXT_DARK).text('INVOICE NO', metaX, currentY);
      doc.font('DejaVu').fillColor(TEXT_MUTED).text(`: AJ-${shortId}`, metaX + 85, currentY);

      doc.font('DejaVu-Bold').fillColor(TEXT_DARK).text('INVOICE DATE', metaX, currentY + 18);
      doc.font('DejaVu').fillColor(TEXT_MUTED).text(`: ${dateStr}`, metaX + 85, currentY + 18);

      let payMethodLabel = 'CASH';
      if (order.paymentMethod === 'bank_transfer') {
        payMethodLabel = 'BANK TRANSFER / UPI';
      } else if (order.paymentMethod === 'boutique') {
        payMethodLabel = 'PAY AT BOUTIQUE';
      } else if (order.paymentMethod) {
        payMethodLabel = order.paymentMethod.toUpperCase();
      }

      doc.font('DejaVu-Bold').fillColor(TEXT_DARK).text('PAY METHOD', metaX, currentY + 36);
      doc.font('DejaVu').fillColor(TEXT_MUTED).text(`: ${payMethodLabel}`, metaX + 85, currentY + 36);

      const paymentStatusUpper = (order.paymentStatus || 'Pending').toUpperCase();
      const isPaid = paymentStatusUpper === 'PAID';
      doc.font('DejaVu-Bold').fillColor(TEXT_DARK).text('PAY STATUS', metaX, currentY + 54);
      doc.font('DejaVu-Bold').fillColor(isPaid ? '#1B5E20' : '#B76E00').text(`: ${paymentStatusUpper}`, metaX + 85, currentY + 54);

      const orderStatusUpper = (order.orderStatus || 'Processing').toUpperCase();
      const isDelivered = orderStatusUpper === 'DELIVERED';
      doc.font('DejaVu-Bold').fillColor(TEXT_DARK).text('ORDER STATUS', metaX, currentY + 72);
      doc.font('DejaVu-Bold').fillColor(isDelivered ? '#1B5E20' : '#4A0E1B').text(`: ${orderStatusUpper}`, metaX + 85, currentY + 72);

      let metaOffset = 90;
      if (isDelivered) {
        const delDateObj = order.deliveredAt || order.updatedAt || new Date();
        const delDateStr = new Date(delDateObj).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
        doc.font('DejaVu-Bold').fillColor(TEXT_DARK).text('DELIVERED ON', metaX, currentY + metaOffset);
        doc.font('DejaVu').fillColor(TEXT_MUTED).text(`: ${delDateStr}`, metaX + 85, currentY + metaOffset);
        metaOffset += 18;
      }

      if (isPaid && order.paidAt) {
        const paidDateStr = new Date(order.paidAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
        doc.font('DejaVu-Bold').fillColor(TEXT_DARK).text('PAID ON', metaX, currentY + metaOffset);
        doc.font('DejaVu').fillColor(TEXT_MUTED).text(`: ${paidDateStr}`, metaX + 85, currentY + metaOffset);
        metaOffset += 18;
      }

      // Gold Rate Lock Info (if applicable)
      if (hasLockedGoldRate) {
        const lockTimeStr = lockedGoldRateTime 
          ? new Date(lockedGoldRateTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
          : '';
        doc.font('DejaVu-Bold').fillColor(GOLD).text('GOLD RATE LOCKED', metaX, currentY + metaOffset);
        doc.font('DejaVu').fillColor(TEXT_DARK).fontSize(11).text(`: ₹${lockedGoldRate.toLocaleString('en-IN')}/gm`, metaX + 85, currentY + metaOffset);
        if (lockTimeStr) {
          doc.font('DejaVu').fontSize(8).fillColor(TEXT_MUTED).text(`(Locked at ${lockTimeStr})`, metaX + 85, currentY + metaOffset + 14);
          metaOffset += 14;
        }
        metaOffset += 25;
      }

      // ==========================================
      // 4. ITEMS TABLE
      // ==========================================
      currentY = Math.max(360, currentY + metaOffset + 10);

      // Table Header Box (Dark Maroon)
      doc.rect(40, currentY, 515, 30).fill(MAROON);

      doc.fillColor(GOLD).font('DejaVu-Bold').fontSize(10);
      doc.text('NO.', 55, currentY + 10);
      doc.text('DESCRIPTION', 95, currentY + 10);
      doc.text('QTY.', 330, currentY + 10, { align: 'center', width: 40 });
      doc.text('RATE', 390, currentY + 10, { align: 'right', width: 70 });
      doc.text('AMOUNT', 470, currentY + 10, { align: 'right', width: 70 });

      currentY += 30;
      let subtotal = 0;
      let totalGST = 0;

      // Table Rows
      order.items.forEach((item, index) => {
        // Stripe effect (White vs Beige)
        if (index % 2 === 0) {
          doc.rect(40, currentY, 515, 45).fill(WHITE);
        } else {
          doc.rect(40, currentY, 515, 45).fill(BEIGE);
        }

        const itemTotal = item.price * item.quantity;
        const itemGstPercent = item.gstPercent !== undefined && item.gstPercent !== null ? item.gstPercent : 3;
        const currentItemGstMultiplier = 1 + (itemGstPercent / 100);
        const itemSubtotal = itemTotal / currentItemGstMultiplier;
        const itemGST = itemTotal - itemSubtotal;
        subtotal += itemSubtotal;
        totalGST += itemGST;

        // Draw Row Text
        doc.fillColor(TEXT_DARK).font('DejaVu-Bold').fontSize(10);
        doc.text(String(index + 1).padStart(2, '0'), 55, currentY + 15);

        doc.font('DejaVu').fontSize(10);
        doc.text(item.name, 95, currentY + 10, { width: 230, height: 12, lineBreak: false });
        doc.fillColor(TEXT_MUTED).fontSize(8).text(item.specs, 95, currentY + 24, { width: 230 });

        doc.fillColor(TEXT_DARK).fontSize(10);
        doc.text(item.quantity.toString(), 330, currentY + 15, { align: 'center', width: 40 });
        doc.text(formatCurrency(item.price / currentItemGstMultiplier), 390, currentY + 15, { align: 'right', width: 70 });
        doc.text(formatCurrency(itemTotal), 470, currentY + 15, { align: 'right', width: 70 });

        currentY += 45;

        // Handle page breaks if cart is huge
        if (currentY > 650) {
          doc.addPage();
          currentY = 50;
        }
      });

      // Border around the whole table
      doc.rect(40, 360, 515, currentY - 360).lineWidth(1).strokeColor('#EAE3D5').stroke();

      // ==========================================
      // 5. TOTALS & FOOTER INFO
      // ==========================================
      currentY += 30;

      // Left Info Block
      doc.fillColor(GOLD).font('DejaVu-Bold').fontSize(10).text('PAYMENT & DELIVERY DETAILS', 40, currentY);
      doc.fillColor(TEXT_MUTED).font('DejaVu').fontSize(9).text(`Payment Method   : ${payMethodLabel}`, 40, currentY + 18);
      doc.text(`Payment Status   : ${paymentStatusUpper}`, 40, currentY + 32);
      if (order.paidAt) {
        const paidAtDate = new Date(order.paidAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
        doc.text(`Paid Date        : ${paidAtDate}`, 40, currentY + 46);
        if (isDelivered) {
          const delDate = order.deliveredAt ? new Date(order.deliveredAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Completed';
          doc.text(`Delivery Status  : DELIVERED (${delDate})`, 40, currentY + 60);
        } else {
          doc.text(`GSTIN No         : ${businessInfo.gstin}`, 40, currentY + 60);
        }
      } else {
        if (isDelivered) {
          doc.text(`Delivery Status  : DELIVERED`, 40, currentY + 46);
          doc.text(`GSTIN No         : ${businessInfo.gstin}`, 40, currentY + 60);
        } else {
          doc.text(`GSTIN No         : ${businessInfo.gstin}`, 40, currentY + 46);
          doc.text(`PAN No           : ${businessInfo.pan}`, 40, currentY + 60);
        }
      }

      const amountInWords = numberToWords(Math.round(order.totalAmount));
      doc.fillColor(TEXT_DARK).font('DejaVu-Oblique').text(`Words: ${amountInWords} Rupees Only`, 40, currentY + 76, { width: 280, lineGap: 2 });

      if (isPaid && isDelivered) {
        doc.save();
        doc.roundedRect(230, currentY + 15, 102, 24, 3).lineWidth(1.5).strokeColor('#1B5E20').stroke();
        doc.font('DejaVu-Bold').fontSize(8.5).fillColor('#1B5E20').text('PAID & DELIVERED', 230, currentY + 22, { align: 'center', width: 102 });
        doc.restore();
      } else if (isPaid) {
        doc.save();
        doc.roundedRect(260, currentY + 15, 65, 24, 3).lineWidth(1.5).strokeColor('#2E7D32').stroke();
        doc.font('DejaVu-Bold').fontSize(10).fillColor('#2E7D32').text('PAID', 260, currentY + 22, { align: 'center', width: 65 });
        doc.restore();
      } else {
        doc.save();
        doc.roundedRect(205, currentY + 15, 128, 24, 3).lineWidth(1.5).strokeColor('#B76E00').stroke();
        doc.font('DejaVu-Bold').fontSize(8.5).fillColor('#B76E00').text('PAYMENT PENDING', 205, currentY + 22, { align: 'center', width: 128 });
        doc.restore();
      }

      // Right Totals Block
      doc.rect(340, currentY - 10, 215, 120).fill('#F5F0E6'); // Light accent box

      const totalX = 355;
      doc.fillColor(TEXT_DARK).font('DejaVu-Bold').fontSize(10).text('SUBTOTAL', totalX, currentY + 5);
      doc.font('DejaVu').text(formatCurrency(subtotal), totalX + 70, currentY + 5, { align: 'right', width: 110 });

      doc.font('DejaVu-Bold').text(`Total GST`, totalX, currentY + 30);
      doc.font('DejaVu').text(formatCurrency(totalGST), totalX + 70, currentY + 30, { align: 'right', width: 110 });

      // Dark Total Box
      doc.rect(340, currentY + 60, 215, 40).fill(MAROON);
      doc.fillColor(WHITE).font('DejaVu-Bold').fontSize(14).text('TOTAL', totalX, currentY + 74);
      doc.fillColor(GOLD).text(formatCurrency(order.totalAmount), totalX + 70, currentY + 74, { align: 'right', width: 110 });

      // ==========================================
      // 6. BOTTOM SHAPE & CONTACT
      // ==========================================

      // Signature placed directly above Thank You
      const signaturePath = findSignatureImage();
      if (signaturePath) {
        try {
          doc.image(signaturePath, 375, 630, {
            fit: [165, 62],
            align: 'right',
            valign: 'bottom'
          });
        } catch (sigErr) {
          console.warn("Could not embed signature into PDF invoice:", sigErr.message);
        }
      }

      // Thank you text (using Oblique to simulate script)
      doc.fillColor(GOLD).font('DejaVu-BoldOblique').fontSize(26).text('Thank You', 0, 700, { align: 'right', width: 540 });
      doc.fillColor(TEXT_MUTED).font('DejaVu').fontSize(9).text('FOR YOUR PURCHASE', 0, 730, { align: 'right', width: 535, letterSpacing: 3 });

      // Bottom Maroon Swoop
      doc.moveTo(0, 770)
        .bezierCurveTo(200, 750, 400, 790, 595.28, 770)
        .lineTo(595.28, 841.89)
        .lineTo(0, 841.89)
        .fill(MAROON);

      // Gold Accent Line
      doc.moveTo(0, 770)
        .bezierCurveTo(200, 750, 400, 790, 595.28, 770)
        .lineWidth(4)
        .stroke(GOLD);

      // Footer Text Inside Graphic
      doc.fillColor(BEIGE).font('DejaVu').fontSize(9);
      doc.text(`Phone: ${businessInfo.phone}`, 40, 800);
      doc.text(`Email: ${businessInfo.email}`, 40, 815);

      doc.text(businessInfo.address.replace(' India', ''), 0, 800, { align: 'right', width: 555 });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * FIXED: Convert number to Indian words securely and perfectly formatted
 */
function numberToWords(num) {
  if (num === 0) return 'Zero';

  const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const n = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
  if (!n) return '';

  let str = '';
  str += (n[1] != 0) ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + 'Crore ' : '';
  str += (n[2] != 0) ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + 'Lakh ' : '';
  str += (n[3] != 0) ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + 'Thousand ' : '';
  str += (n[4] != 0) ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + 'Hundred ' : '';
  str += (n[5] != 0) ? ((str != '') ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]]) : '';

  return str.trim();
}

/**
 * Locate the background-removed signature image.
 * Checks the 'signature' folder (both in server/ and project root), assets/signature,
 * and falls back to assets/digitalsign.png.
 */
function findSignatureImage() {
  const candidateDirs = [
    path.join(__dirname, '..', 'signature'),
    path.join(__dirname, '..', '..', 'signature'),
    path.join(__dirname, '..', 'assets', 'signature'),
    path.join(__dirname, '..', 'uploads', 'signature')
  ];

  for (const dir of candidateDirs) {
    if (fs.existsSync(dir)) {
      try {
        const files = fs.readdirSync(dir);
        // Prioritize any signature image file
        const preferred = files.find(f => /^(signature|sign|digitalsign)/i.test(f) && /\.(png|jpe?g|webp)$/i.test(f));
        if (preferred) {
          const fullPath = path.join(dir, preferred);
          if (fs.existsSync(fullPath)) return fullPath;
        }
        const anyImg = files.find(f => /\.(png|jpe?g|webp)$/i.test(f));
        if (anyImg) {
          const fullPath = path.join(dir, anyImg);
          if (fs.existsSync(fullPath)) return fullPath;
        }
      } catch (err) {
        // Continue checking other candidate folders
      }
    }
  }

  // Fallback to assets/digitalsign.png if exists
  const fallbackAsset = path.join(__dirname, '..', 'assets', 'digitalsign.png');
  if (fs.existsSync(fallbackAsset)) {
    return fallbackAsset;
  }

  return null;
}

exports.findSignatureImage = findSignatureImage;