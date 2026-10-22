const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Product = require('../models/Product');
const StoreSettings = require('../models/StoreSettings');
const nodemailer = require('nodemailer');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { generateInvoice } = require('../services/invoiceGenerator');
const { protect, admin } = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');
const { orderSchema, verifyPaymentSchema } = require('../validators/schema');

// --- SEC-05: SECURE EMAIL HUB (No hardcoded credentials) ---
const SENDER_EMAIL = process.env.EMAIL_USER;
const NOREPLY_EMAIL = process.env.NOREPLY_EMAIL || 'no-reply@ajjewellers.in';

let transporter = null;
if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
} else {
  console.warn("⚠️ SMTP credentials not fully configured in environment. Emails will be logged to console in test mode.");
}

// Helper to safely send email
async function safeSendMail(mailOptions) {
  if (!transporter) {
    console.log(`[Email Mock (${mailOptions.subject})] -> To: ${mailOptions.to}`);
    return true;
  }
  try {
    return await transporter.sendMail(mailOptions);
  } catch (err) {
    console.error("Mail send error:", err.message);
    return false;
  }
}

// --- SEC-13: PRIVATE PAYMENT EVIDENCE MULTER CONFIGURATION ---
const evidenceDir = path.join(__dirname, '..', 'uploads', 'evidence');
if (!fs.existsSync(evidenceDir)) {
  fs.mkdirSync(evidenceDir, { recursive: true });
}

const evidenceStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, evidenceDir);
  },
  filename: (req, file, cb) => {
    // Generate safe, unguessable filename: evidence_<orderId>_<timestamp>_<random><ext>
    const orderId = req.params.id || 'order';
    const ext = path.extname(file.originalname).toLowerCase();
    const randomSuffix = Math.random().toString(36).substring(2, 10);
    cb(null, `evidence_${orderId}_${Date.now()}_${randomSuffix}${ext}`);
  }
});

const evidenceFilter = (req, file, cb) => {
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.pdf'];
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedExtensions.includes(ext) && allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPG, PNG, WEBP images and PDF receipts are accepted.'));
  }
};

const uploadEvidence = multer({
  storage: evidenceStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB limit
  fileFilter: evidenceFilter
});

/**
 * Automatically sends the final delivery completion receipt + paid PDF invoice
 * when BOTH paymentStatus === 'Paid' and orderStatus === 'Delivered'.
 */
async function sendDeliveryAndPaidInvoiceEmail(order, force = false) {
  try {
    if (!order || !order.email) return false;

    const isPaid = (order.paymentStatus || '').toLowerCase() === 'paid';
    const isDelivered = (order.orderStatus || '').toLowerCase() === 'delivered';

    if (!isPaid || !isDelivered) return false;
    if (order.deliveredEmailSent && !force) return false;

    const orderIdShort = `AJ-${order._id.toString().slice(-6).toUpperCase()}`;

    let settings = null;
    try {
      settings = await StoreSettings.findOne();
    } catch (settingsErr) {
      console.warn("Could not fetch store settings for delivery email:", settingsErr.message);
    }

    if (!order.deliveredAt) order.deliveredAt = new Date();
    if (!order.paidAt) order.paidAt = new Date();

    let pdfBuffer = null;
    try {
      pdfBuffer = await generateInvoice(order, settings);
      const archivesDir = path.join(__dirname, '..', 'archives', 'invoices');
      if (!fs.existsSync(archivesDir)) {
        fs.mkdirSync(archivesDir, { recursive: true });
      }
      fs.writeFileSync(path.join(archivesDir, `Invoice-${orderIdShort}.pdf`), pdfBuffer);
    } catch (pdfErr) {
      console.error("❌ Failed to generate invoice for delivery email:", pdfErr.message);
    }

    const deliveredDateStr = new Date(order.deliveredAt).toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric'
    });
    const paidDateStr = order.paidAt
      ? new Date(order.paidAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
      : 'Verified';

    const itemsHtml = (order.items || []).map((item, idx) => `
      <tr style="border-bottom: 1px solid #EAE3D5; ${idx % 2 === 1 ? 'background-color: #FDFBF4;' : ''}">
        <td style="padding: 10px; color: #4A0E1B;">
          <strong>${item.name}</strong>
          ${item.specs ? `<div style="font-size: 11px; color: #7A6A5C;">${item.specs}</div>` : ''}
        </td>
        <td style="padding: 10px; text-align: center; color: #7A6A5C;">${item.quantity}</td>
        <td style="padding: 10px; text-align: right; color: #4A0E1B; font-weight: 500;">₹${(item.price * item.quantity).toLocaleString('en-IN')}</td>
      </tr>
    `).join('');

    const mailOptions = {
      from: `"AJ Jewellers (No-Reply)" <${SENDER_EMAIL || 'support@ajjewellers.in'}>`,
      replyTo: NOREPLY_EMAIL,
      to: order.email,
      subject: `Order Delivered & Payment Confirmed - ${orderIdShort}`,
      html: `
        <div style="font-family: 'Helvetica Neue', Arial, sans-serif; color: #2A0A10; max-width: 650px; margin: auto; padding: 25px; border: 1px solid #C9A24B; border-radius: 8px; background-color: #FDFBF4;">
          <div style="text-align: center; border-bottom: 2px solid #C9A24B; padding-bottom: 18px; margin-bottom: 22px;">
            <h1 style="color: #4A0E1B; margin: 0; font-size: 28px; letter-spacing: 2px; text-transform: uppercase;">AJ JEWELLERS</h1>
            <p style="color: #C9A24B; margin: 5px 0 0 0; font-size: 11px; letter-spacing: 3px; font-weight: bold; text-transform: uppercase;">Heritage & Fine Jewellery</p>
          </div>
          <div style="background-color: #E8F5E9; border-left: 5px solid #2E7D32; padding: 16px 20px; border-radius: 4px; margin-bottom: 22px;">
            <h2 style="color: #1B5E20; margin: 0 0 6px 0; font-size: 18px;">
              ✓ Order Delivered &amp; Payment Confirmed
            </h2>
            <p style="color: #2E7D32; margin: 0; font-size: 13px; line-height: 1.5;">
              Dear <strong>${order.customerName}</strong>, your order <strong>${orderIdShort}</strong> has been successfully delivered and payment confirmed. Your official tax invoice is attached.
            </p>
          </div>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 22px; font-size: 13px;">
            <tr>
              <td style="width: 50%; vertical-align: top; padding: 14px; background-color: #FFFFFF; border: 1px solid #EAE3D5;">
                <p style="margin: 4px 0; color: #4A0E1B;"><strong>Status:</strong> <span style="color: #1B5E20; font-weight: bold;">DELIVERED</span></p>
                <p style="margin: 4px 0; color: #7A6A5C;"><strong>Delivered At:</strong> ${deliveredDateStr}</p>
                <p style="margin: 4px 0; color: #7A6A5C;"><strong>Delivered To:</strong> ${order.customerName}</p>
                <p style="margin: 4px 0; color: #7A6A5C;"><strong>Address:</strong> ${order.address.replace(/\(Coordinates.*\)/, '').trim()}, ${order.city} - ${order.pincode}</p>
              </td>
              <td style="width: 50%; vertical-align: top; padding: 14px; background-color: #FFFFFF; border: 1px solid #EAE3D5;">
                <p style="margin: 4px 0; color: #4A0E1B;"><strong>Payment Status:</strong> <span style="background-color: #E8F5E9; color: #1B5E20; padding: 2px 6px; font-weight: bold;">PAID</span></p>
                <p style="margin: 4px 0; color: #7A6A5C;"><strong>Total Amount:</strong> ₹${order.totalAmount.toLocaleString('en-IN')}</p>
                <p style="margin: 4px 0; color: #7A6A5C;"><strong>Payment Method:</strong> ${order.paymentMethod === 'cash' ? 'Cash' : order.paymentMethod === 'bank_transfer' ? 'Bank Transfer / External UPI' : 'Pay at Boutique'}</p>
                <p style="margin: 4px 0; color: #7A6A5C;"><strong>Paid Date:</strong> ${paidDateStr}</p>
                ${order.paymentReference ? `<p style="margin: 4px 0; color: #7A6A5C; font-family: monospace; font-size: 11px;"><strong>Transaction Ref:</strong> ${order.paymentReference}</p>` : ''}
              </td>
            </tr>
          </table>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 22px; font-size: 12px; background-color: #FFFFFF; border: 1px solid #EAE3D5;">
            <thead>
              <tr style="background-color: #4A0E1B; color: #C9A24B; text-transform: uppercase; font-size: 10px; letter-spacing: 1px;">
                <th style="padding: 10px; text-align: left;">Item</th>
                <th style="padding: 10px; text-align: center;">Qty</th>
                <th style="padding: 10px; text-align: right;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
              <tr style="border-top: 2px solid #C9A24B; background-color: #FDFBF4; font-weight: bold;">
                <td colspan="2" style="padding: 12px; text-align: right; color: #4A0E1B; font-size: 13px;">Total Paid:</td>
                <td style="padding: 12px; text-align: right; color: #4A0E1B; font-size: 14px;">₹${order.totalAmount.toLocaleString('en-IN')}</td>
              </tr>
            </tbody>
          </table>
          <div style="background-color: #FFFFFF; border: 1px solid #C9A24B; padding: 14px; border-radius: 4px; text-align: center; margin-bottom: 20px;">
            <p style="margin: 0; font-size: 12px; color: #4A0E1B; font-weight: bold;">
              📄 Your Official Tax Invoice (Invoice-${orderIdShort}.pdf) is attached to this email.
            </p>
          </div>
          <div style="text-align: center; border-top: 1px solid #EAE3D5; padding-top: 15px; font-size: 11px; color: #7A6A5C;">
            <p style="margin: 2px 0;">Thank you for shopping with AJ Jewellers.</p>
          </div>
        </div>
      `,
      attachments: pdfBuffer ? [{
        filename: `Invoice-${orderIdShort}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf'
      }] : []
    };

    await safeSendMail(mailOptions);
    order.deliveredEmailSent = true;
    order.deliveredEmailSentAt = new Date();
    await order.save();
    return true;
  } catch (error) {
    console.error("❌ Failed to send final delivery email:", error);
    return false;
  }
}

// @route   POST /api/orders
// @desc    SEC-02, SEC-03, FT-05, FT-06: Create order with server-authoritative pricing and force Pending payment
router.post('/', protect, validate(orderSchema), async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const rawItems = req.body.items || [];
    if (!Array.isArray(rawItems) || rawItems.length === 0) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ success: false, message: 'Cart items cannot be empty.' });
    }

    // Fetch store settings for authoritative market rates
    const settings = await StoreSettings.findOne().session(session);
    const lockDurationMinutes = settings?.marketRates?.lockDurationMinutes || 15;

    // Validate locked rate if supplied by client
    let authoritativeGoldRate = settings?.marketRates?.rate22k || 7500;
    let lockedRateApplied = false;

    if (req.body.lockedGoldRate && req.body.lockedGoldRateTimestamp) {
      const lockTime = new Date(req.body.lockedGoldRateTimestamp).getTime();
      const elapsedMinutes = (Date.now() - lockTime) / (1000 * 60);

      if (elapsedMinutes <= lockDurationMinutes && req.body.lockedGoldRate > 0) {
        authoritativeGoldRate = req.body.lockedGoldRate;
        lockedRateApplied = true;
      } else {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({
          success: false,
          message: `Gold rate lock has expired (${elapsedMinutes.toFixed(1)} mins elapsed). Please refresh market rates.`
        });
      }
    }

    let calculatedSubtotal = 0;
    const validatedItems = [];

    // Authoritative calculation and atomic inventory deduction
    for (let i = 0; i < rawItems.length; i++) {
      const item = rawItems[i];
      const quantity = Math.max(1, parseInt(item.quantity) || 1);

      // Atomically decrement stock (base stock and variant stock if variant selected)
      let product = null;
      if (item.variant) {
        product = await Product.findOneAndUpdate(
          {
            _id: item.product,
            stock: { $gte: quantity },
            "variants._id": item.variant,
            "variants.stock": { $gte: quantity }
          },
          {
            $inc: {
              stock: -quantity,
              "variants.$.stock": -quantity
            }
          },
          { new: true, session }
        );
        if (!product) {
          throw new Error(`Insufficient stock for selected variant or product unavailable for ID: ${item.product}`);
        }
      } else {
        product = await Product.findOneAndUpdate(
          { _id: item.product, stock: { $gte: quantity } },
          { $inc: { stock: -quantity } },
          { new: true, session }
        );
        if (!product) {
          throw new Error(`Insufficient stock or product unavailable for ID: ${item.product}`);
        }
      }

      // Determine product weight, making charges, and diamond value from trusted DB
      let weight = product.weight || 1;
      let makingChargesPercent = product.makingCharges || 0;
      let gstPercent = product.gst !== undefined && product.gst !== null ? product.gst : 3;

      if (item.variant && product.variants && product.variants.length > 0) {
        const matchedVariant = product.variants.find(v => v._id.toString() === item.variant.toString());
        if (matchedVariant) {
          if (matchedVariant.weight) weight = matchedVariant.weight;
          if (matchedVariant.makingCharges !== undefined) makingChargesPercent = matchedVariant.makingCharges;
          if (matchedVariant.gst !== undefined) gstPercent = matchedVariant.gst;
        }
      }

      // Server-authoritative item price calculation
      let itemPrice = 0;
      if (product.price && product.price > 0 && !product.weight) {
        // Fixed price item
        itemPrice = product.price;
      } else {
        // Dynamic jewellery pricing: (Gold Rate * Weight) + Diamond Value + Making Charges + GST
        const metalValue = authoritativeGoldRate * weight;
        const diamondValue = product.diamondValue || 0;
        const makingChargesAmt = metalValue * (makingChargesPercent / 100);
        const preGstTotal = metalValue + diamondValue + makingChargesAmt;
        const gstAmount = preGstTotal * (gstPercent / 100);
        itemPrice = Math.round(preGstTotal + gstAmount);
      }

      calculatedSubtotal += (itemPrice * quantity);

      validatedItems.push({
        product: product._id,
        name: product.name,
        specs: item.specs || (product.karat ? `${product.karat} | ${weight}g` : `${weight}g`),
        price: itemPrice, // Server-calculated price
        image: product.images && product.images[0] ? product.images[0] : item.image,
        quantity: quantity,
        variant: item.variant || null,
        gstPercent
      });

      // Update product status to Out of Stock if stock reached 0
      if (product.stock <= 0 && product.status !== 'Out of Stock') {
        await Product.updateOne({ _id: product._id }, { status: 'Out of Stock' }, { session });
      }
    }

    // Authoritative shipping & total
    const shipping = calculatedSubtotal > 50000 ? 0 : 150;
    const authoritativeTotal = calculatedSubtotal + shipping;

    // SEC-02 & Business Mandate: ONLY Cash and Bank Transfer/UPI supported
    const rawMethod = (req.body.paymentMethod || '').toLowerCase();
    let sanitizedPaymentMethod = 'cash';
    if (rawMethod.includes('bank') || rawMethod.includes('upi') || rawMethod.includes('transfer')) {
      sanitizedPaymentMethod = 'bank_transfer';
    } else if (rawMethod.includes('boutique')) {
      sanitizedPaymentMethod = 'boutique';
    } else {
      sanitizedPaymentMethod = 'cash';
    }

    // Extract delivery location & GPS coordinates
    const reqLoc = req.body.deliveryLocation || {};
    let deliveryLocation = {
      lat: reqLoc.lat !== undefined && reqLoc.lat !== null ? Number(reqLoc.lat) : null,
      lng: reqLoc.lng !== undefined && reqLoc.lng !== null ? Number(reqLoc.lng) : null,
      landmark: (reqLoc.landmark || '').trim(),
      formattedAddress: (reqLoc.formattedAddress || '').trim(),
      mapsUrl: ''
    };

    if (deliveryLocation.lat !== null && deliveryLocation.lng !== null && !isNaN(deliveryLocation.lat) && !isNaN(deliveryLocation.lng)) {
      deliveryLocation.mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${deliveryLocation.lat},${deliveryLocation.lng}`;
    }

    // Build trusted order document
    const orderData = {
      userId: req.user._id,
      customerName: req.body.customerName || req.user.name,
      email: req.body.email || req.user.email,
      phone: req.body.phone,
      address: req.body.address,
      city: req.body.city,
      pincode: req.body.pincode,
      notes: req.body.notes || '',
      deliveryLocation,
      items: validatedItems,
      totalAmount: authoritativeTotal, // Authoritative total
      paymentMethod: sanitizedPaymentMethod,
      paymentStatus: 'Pending', // ALWAYS starts as Pending
      orderStatus: 'Processing',
      paidAt: null,
      verifiedBy: null,
      amountPaid: 0,
      inventoryRestocked: false,
      history: [
        {
          status: 'Order Placed',
          actor: req.user.email,
          timestamp: new Date(),
          note: `Order placed via ${sanitizedPaymentMethod}. Initial payment status: Pending.`
        }
      ]
    };

    if (lockedRateApplied) {
      orderData.lockedGoldRate = req.body.lockedGoldRate;
      orderData.lockedGoldRateTimestamp = req.body.lockedGoldRateTimestamp;
    }

    const newOrder = new Order(orderData);
    const savedOrder = await newOrder.save({ session });

    await session.commitTransaction();
    session.endSession();

    // Generate PDF invoice in background
    const orderIdShort = `AJ-${savedOrder._id.toString().slice(-6).toUpperCase()}`;
    let pdfBuffer = null;
    try {
      pdfBuffer = await generateInvoice(savedOrder, settings);
      const archivesDir = path.join(__dirname, '..', 'archives', 'invoices');
      if (!fs.existsSync(archivesDir)) {
        fs.mkdirSync(archivesDir, { recursive: true });
      }
      fs.writeFileSync(path.join(archivesDir, `Invoice-${orderIdShort}.pdf`), pdfBuffer);
    } catch (pdfErr) {
      console.warn("Invoice generation warning:", pdfErr.message);
    }

    // Send order confirmation email
    if (savedOrder.email) {
      const isBankTransfer = sanitizedPaymentMethod === 'bank_transfer';
      const instructionsText = isBankTransfer
        ? "Please transfer the payable amount to our official AJ Jewellers bank account or UPI ID. Once received, our team will verify your payment and update your order."
        : "Your order is scheduled for Cash collection / Cash on Delivery. Our concierge will confirm payment receipt in person.";

      const mailOptions = {
        from: `"AJ Jewellers (No-Reply)" <${SENDER_EMAIL || 'support@ajjewellers.in'}>`,
        replyTo: NOREPLY_EMAIL,
        to: savedOrder.email,
        subject: `Order Confirmation - ${orderIdShort}`,
        html: `
          <div style="font-family: 'Helvetica Neue', Arial, sans-serif; color: #4A0E1B; max-width: 600px; margin: auto; padding: 25px; border: 1px solid #C9A24B; border-radius: 8px; background-color: #FDFBF4;">
            <div style="text-align: center; border-bottom: 2px solid #C9A24B; padding-bottom: 15px; margin-bottom: 20px;">
              <h1 style="color: #4A0E1B; margin: 0; font-size: 26px; letter-spacing: 2px; text-transform: uppercase;">AJ JEWELLERS</h1>
              <p style="color: #C9A24B; margin: 4px 0 0 0; font-size: 11px; letter-spacing: 2.5px; font-weight: bold; text-transform: uppercase;">Heritage & Fine Jewellery</p>
            </div>
            <h3 style="color: #4A0E1B; margin: 0 0 10px 0;">Thank you for your order, ${savedOrder.customerName}!</h3>
            <p style="color: #2A0A10; font-size: 14px; line-height: 1.5;">Your order <strong>${orderIdShort}</strong> has been received and is being prepared.</p>
            <div style="background-color: #FFF9E6; border-left: 4px solid #C9A24B; padding: 12px 16px; margin: 16px 0; font-size: 13px; color: #7A6A5C;">
              <strong>Payment Method:</strong> ${isBankTransfer ? 'Bank Transfer / External UPI' : 'Cash / Pay at Boutique'}<br/>
              <strong>Payment Status:</strong> <span style="color: #B76E00; font-weight: bold;">PENDING VERIFICATION</span><br/>
              <p style="margin: 6px 0 0 0;">${instructionsText}</p>
            </div>
            <h3 style="text-align: right; border-top: 1px solid #EAE3D5; padding-top: 12px; color: #4A0E1B; margin: 0;">Total Amount: ₹${savedOrder.totalAmount.toLocaleString('en-IN')}</h3>
            <div style="text-align: center; border-top: 1px solid #EAE3D5; padding-top: 15px; font-size: 11px; color: #7A6A5C;">
              <p>📄 Your order invoice is attached as a PDF (Payment Status: Pending).</p>
            </div>
          </div>
        `,
        attachments: pdfBuffer ? [{
          filename: `Invoice-${orderIdShort}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf'
        }] : []
      };

      safeSendMail(mailOptions);
    }

    res.status(201).json({ success: true, data: savedOrder });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Error creating order:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/orders/:id/payment-evidence
// @desc    SEC-13 & Payment Method B: Admin uploads payment evidence (receipt, transfer confirmation, screenshot)
router.post('/:id/payment-evidence', protect, admin, uploadEvidence.single('evidence'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No evidence file uploaded.' });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      // Remove uploaded file if order doesn't exist
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    const safeFilename = path.basename(req.file.filename);
    const evidenceItem = {
      originalName: req.file.originalname,
      filename: safeFilename,
      path: `/api/orders/${order._id}/payment-evidence/${safeFilename}`,
      mimeType: req.file.mimetype,
      size: req.file.size,
      uploadedAt: new Date(),
      uploadedBy: req.user._id,
      transactionReference: req.body.transactionReference || ''
    };

    if (!order.evidence) order.evidence = [];
    order.evidence.push(evidenceItem);

    // If order is currently Pending, move to Awaiting Verification (evidence uploaded, needs admin review)
    if (order.paymentStatus === 'Pending') {
      order.paymentStatus = 'Awaiting Verification';
    }

    if (req.body.transactionReference) {
      order.paymentReference = req.body.transactionReference;
    }

    if (!order.history) order.history = [];
    order.history.push({
      status: order.paymentStatus,
      actor: req.user.email,
      timestamp: new Date(),
      note: `Payment evidence uploaded (${req.file.originalname}). Ref: ${req.body.transactionReference || 'N/A'}`
    });

    await order.save();

    res.status(200).json({
      success: true,
      message: 'Payment evidence uploaded successfully. Order set to Awaiting Verification.',
      data: order
    });
  } catch (error) {
    console.error("Error uploading payment evidence:", error);
    res.status(500).json({ success: false, message: error.message || 'Failed to upload evidence.' });
  }
});

// Payment status verification controller
const handlePaymentStatusVerification = async (req, res) => {
  try {
    const { paymentStatus, paymentReference, amountPaid, internalAdminNote } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    const previousStatus = order.paymentStatus;
    order.paymentStatus = paymentStatus;

    if (paymentStatus === 'Paid') {
      order.paidAt = new Date();
      order.verifiedBy = req.user._id;
      order.verifiedAt = new Date();
      order.amountPaid = Number(amountPaid) || order.totalAmount;
      if (paymentReference) {
        order.paymentReference = paymentReference;
      }
    } else if (paymentStatus === 'Pending' || paymentStatus === 'Failed') {
      order.paidAt = null;
      order.verifiedBy = null;
      order.verifiedAt = null;
    }

    if (internalAdminNote && internalAdminNote.trim()) {
      if (!order.internalAdminNotes) order.internalAdminNotes = [];
      order.internalAdminNotes.push({
        note: internalAdminNote.trim(),
        addedBy: req.user.email,
        addedAt: new Date()
      });
    }

    if (!order.history) order.history = [];
    order.history.push({
      status: paymentStatus,
      actor: req.user.email,
      timestamp: new Date(),
      note: `Payment status changed from ${previousStatus} to ${paymentStatus}. Ref: ${paymentReference || 'N/A'}. ${internalAdminNote || ''}`
    });

    const updatedOrder = await order.save();

    // Send final delivery email if already delivered and now paid
    let deliveryEmailSent = false;
    if (updatedOrder.orderStatus === 'Delivered' && updatedOrder.paymentStatus === 'Paid') {
      deliveryEmailSent = await sendDeliveryAndPaidInvoiceEmail(updatedOrder);
    }

    res.status(200).json({
      success: true,
      message: `Payment status successfully updated to ${paymentStatus}.`,
      data: updatedOrder,
      deliveryEmailSent
    });
  } catch (error) {
    console.error("Error verifying payment:", error);
    res.status(500).json({ success: false, message: error.message || 'Failed to verify payment.' });
  }
};

// @route   PUT /api/orders/:id/verify-payment
// @desc    SEC-02 & Section 4.A: Admin explicitly verifies funds and marks payment status
router.put('/:id/verify-payment', protect, admin, validate(verifyPaymentSchema), handlePaymentStatusVerification);

// @route   PUT /api/orders/:id/payment-status
// @desc    Admin updates payment status (dropdown in orders view & admin dashboard)
router.put('/:id/payment-status', protect, admin, validate(verifyPaymentSchema), handlePaymentStatusVerification);

// @route   GET /api/orders
// @desc    Get all orders (Admin sees all, Customer sees own)
router.get('/', protect, async (req, res) => {
  try {
    const query = req.user.role === 'admin' ? {} : { userId: req.user._id };
    const orders = await Order.find(query).sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: orders.length, data: orders });
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

// @route   GET /api/orders/:id
// @desc    Get single order by ID
router.get('/:id', protect, async (req, res) => {
  try {
    const query = req.user.role === 'admin' 
      ? { _id: req.params.id }
      : { _id: req.params.id, userId: req.user._id };
    const order = await Order.findOne(query);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }
    res.status(200).json({ success: true, data: order });
  } catch (error) {
    console.error("Error fetching order:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

// @route   GET /api/orders/:id/invoice
// @desc    Download PDF invoice for an order (Authorized customer or admin)
router.get('/:id/invoice', protect, async (req, res) => {
  try {
    const query = req.user.role === 'admin' 
      ? { _id: req.params.id }
      : { _id: req.params.id, userId: req.user._id };
    const order = await Order.findOne(query);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    let settings = null;
    try {
      settings = await StoreSettings.findOne();
    } catch (settingsError) {
      console.warn("Could not fetch store settings for invoice:", settingsError.message);
    }

    const pdfBuffer = await generateInvoice(order, settings);
    const orderIdShort = `AJ-${order._id.toString().slice(-6).toUpperCase()}`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Invoice-${orderIdShort}.pdf"`);
    res.send(pdfBuffer);
  } catch (error) {
    console.error("❌ Error generating invoice:", error);
    res.status(500).json({ success: false, message: "Failed to generate invoice" });
  }
});

// @route   PUT /api/orders/:id
// @desc    FT-07: Update order status & safely restore inventory on Cancelled
router.put('/:id', protect, admin, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    const validTransitions = {
      'Pending': ['Processing', 'Shipped', 'Delivered', 'Cancelled'],
      'Processing': ['Shipped', 'Delivered', 'Cancelled'],
      'Shipped': ['Delivered', 'Cancelled'],
      'Delivered': ['Cancelled'],
      'Cancelled': []
    };

    const newStatus = req.body.orderStatus;
    if (newStatus) {
      if (!validTransitions[order.orderStatus]?.includes(newStatus) && order.orderStatus !== newStatus) {
        return res.status(400).json({ success: false, message: `Invalid status transition from ${order.orderStatus} to ${newStatus}` });
      }

      order.orderStatus = newStatus;

      if (newStatus === 'Processing') order.processingAt = new Date();
      if (newStatus === 'Shipped') order.shippedAt = new Date();
      if (newStatus === 'Delivered') {
        order.deliveredAt = order.deliveredAt || new Date();
      }

      // FT-07: Restock inventory exactly once upon Cancellation
      if (newStatus === 'Cancelled' && !order.inventoryRestocked) {
        for (const item of (order.items || [])) {
          if (item.product && item.quantity) {
            let restocked = false;
            if (item.variant) {
              const res = await Product.updateOne(
                { _id: item.product, "variants._id": item.variant },
                { $inc: { stock: item.quantity, "variants.$.stock": item.quantity }, status: 'In Stock' }
              );
              if (res.modifiedCount > 0) restocked = true;
            }
            if (!restocked) {
              await Product.updateOne(
                { _id: item.product },
                { $inc: { stock: item.quantity }, status: 'In Stock' }
              );
            }
          }
        }
        order.inventoryRestocked = true;
        if (!order.history) order.history = [];
        order.history.push({
          status: 'Cancelled',
          actor: req.user.email,
          timestamp: new Date(),
          note: 'Order cancelled by admin. Inventory restocked automatically.'
        });
      }
    }

    const updatedOrder = await order.save();

    let deliveryEmailSent = false;
    if (updatedOrder.orderStatus === 'Delivered' && updatedOrder.paymentStatus === 'Paid') {
      deliveryEmailSent = await sendDeliveryAndPaidInvoiceEmail(updatedOrder);
    }

    res.status(200).json({ success: true, data: updatedOrder, deliveryEmailSent });
  } catch (error) {
    console.error("Error updating order:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

// @route   PUT /api/orders/:id/return-status
// @desc    Admin approves or rejects return/exchange request
router.put('/:id/return-status', protect, admin, async (req, res) => {
  try {
    const { status, adminResponse } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (!order.returnRequest) {
      order.returnRequest = {};
    }
    order.returnRequest.status = status;
    if (adminResponse) {
      order.returnRequest.adminResponse = adminResponse;
    }
    order.returnRequest.reviewedAt = new Date();
    order.returnRequest.reviewedBy = req.user.email;

    if (!order.history) order.history = [];
    order.history.push({
      status: `Return ${status}`,
      actor: req.user.email,
      timestamp: new Date(),
      note: `Return/Exchange request marked as ${status}. ${adminResponse ? `Response: ${adminResponse}` : ''}`
    });

    const updated = await order.save();
    res.status(200).json({ success: true, message: `Return request marked as ${status}`, data: updated });
  } catch (err) {
    console.error("Error updating return status:", err);
    res.status(500).json({ success: false, message: 'Failed to update return status' });
  }
});

// @route   POST /api/orders/:id/return
// @desc    Customer submits return/exchange request for an eligible delivered order
router.post('/:id/return', protect, async (req, res) => {
  try {
    const { type, reason } = req.body;
    const order = await Order.findOne({ _id: req.params.id, userId: req.user._id });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    order.returnRequest = {
      requested: true,
      type: type || 'return',
      reason: reason || '',
      status: 'Pending',
      requestedAt: new Date()
    };

    if (!order.history) order.history = [];
    order.history.push({
      status: 'Return Requested',
      actor: req.user.email,
      timestamp: new Date(),
      note: `Customer requested ${type || 'return'}. Reason: ${reason || 'N/A'}`
    });

    const updated = await order.save();
    res.status(200).json({ success: true, message: 'Return request submitted successfully', data: updated });
  } catch (err) {
    console.error("Error submitting return request:", err);
    res.status(500).json({ success: false, message: 'Failed to submit return request' });
  }
});

// @route   POST /api/orders/:id/resend-delivery-email
// @desc    Admin triggers resend of final delivered invoice email
router.post('/:id/resend-delivery-email', protect, admin, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const sent = await sendDeliveryAndPaidInvoiceEmail(order, true);
    if (sent) {
      order.deliveredEmailSent = true;
      order.deliveredEmailSentAt = new Date();
      await order.save();
      return res.status(200).json({ success: true, message: 'Invoice email resent to customer!' });
    } else {
      return res.status(400).json({ success: false, message: 'Email could not be sent. Check email settings.' });
    }
  } catch (err) {
    console.error("Error resending delivery email:", err);
    res.status(500).json({ success: false, message: 'Failed to resend email' });
  }
});

// @route   GET /api/orders/admin/export-archive
// @desc    Export orders from last 4 months to CSV + ZIP of PDFs
router.get('/admin/export-archive', protect, admin, async (req, res) => {
  try {
    const { Parser } = require('json2csv');
    const archiver = require('archiver');
    
    const fourMonthsAgo = new Date();
    fourMonthsAgo.setMonth(fourMonthsAgo.getMonth() - 4);
    
    const orders = await Order.find({ createdAt: { $gte: fourMonthsAgo } }).sort({ createdAt: -1 });
    
    const csvData = orders.map(order => {
      const orderIdShort = `AJ-${order._id.toString().slice(-6).toUpperCase()}`;
      return {
        'Order ID': orderIdShort,
        'Customer Name': order.customerName || 'N/A',
        'Mobile No': order.phone || 'N/A',
        'Email ID': order.email || 'N/A',
        'Total Amount': order.totalAmount,
        'Order Date': new Date(order.createdAt).toLocaleDateString('en-IN'),
        'Payment Method': order.paymentMethod,
        'Payment Status': order.paymentStatus || 'Pending',
        'PDF Link': `Invoice-${orderIdShort}.pdf`
      };
    });
    
    let csv = '';
    if (csvData.length > 0) {
      const json2csvParser = new Parser();
      csv = json2csvParser.parse(csvData);
    } else {
      csv = 'No orders found in the last 4 months.';
    }
    
    const archive = archiver('zip', { zlib: { level: 9 } });
    
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename=AJ-Jewellers-Archive-${new Date().toISOString().split('T')[0]}.zip`);
    archive.pipe(res);
    archive.append(csv, { name: 'customers_archive.csv' });
    
    const archivesDir = path.join(__dirname, '..', 'archives', 'invoices');
    if (fs.existsSync(archivesDir)) {
      orders.forEach(order => {
        const orderIdShort = `AJ-${order._id.toString().slice(-6).toUpperCase()}`;
        const pdfFilename = `Invoice-${orderIdShort}.pdf`;
        const pdfPath = path.join(archivesDir, pdfFilename);
        if (fs.existsSync(pdfPath)) {
          archive.append(fs.createReadStream(pdfPath), { name: `invoices/${pdfFilename}` });
        }
      });
    }
    
    archive.finalize();
  } catch (error) {
    console.error("Error exporting archive:", error);
    res.status(500).json({ success: false, message: "Failed to export archive" });
  }
});

module.exports = router;