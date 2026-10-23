const { z } = require('zod');

// Authentication schemas
const registerSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
    email: z.string().trim().email("Invalid email address").toLowerCase(),
    password: z.string().min(6, "Password must be at least 6 characters"),
    phone: z.string().trim().regex(/^\d{10}$/, "Invalid 10-digit phone number"),
    otp: z.string().trim().length(6, "OTP must be 6 digits")
  })
});

const loginSchema = z.object({
  body: z.object({
    email: z.string().trim().email("Invalid email address").toLowerCase(),
    password: z.string().min(1, "Password is required")
  })
});

const sendOtpSchema = z.object({
  body: z.object({
    email: z.string().trim().email("Invalid email address").toLowerCase()
  })
});

// Product schemas
const productSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2, "Name must be at least 2 characters"),
    sku: z.string().trim().min(2, "SKU must be at least 2 characters"),
    category: z.string().trim().min(2, "Category is required"),
    purity: z.string().trim().min(2, "Purity is required"),
    weight: z.coerce.number().positive("Weight must be greater than 0"),
    makingCharges: z.coerce.number().min(0, "Making charges cannot be negative")
  }).passthrough()
});

// Order creation schema (Customer checkout)
// Notice: paymentStatus, paidAt, and verifiedBy are strictly omitted so clients cannot forge them!
const orderSchema = z.object({
  body: z.object({
    customerName: z.string().trim().min(2, "Name must be at least 2 characters"),
    phone: z.string().trim().regex(/^\d{10}$/, "10-digit phone number is required"),
    email: z.string().trim().email("Valid email is required").toLowerCase(),
    city: z.string().trim().min(2, "City is required"),
    pincode: z.string().trim().regex(/^\d{6}$/, "Valid 6-digit pincode is required"),
    address: z.string().trim().min(5, "Delivery address is required"),
    notes: z.string().optional().default(''),
    deliveryLocation: z.object({
      lat: z.number().nullable().optional(),
      lng: z.number().nullable().optional(),
      landmark: z.string().optional().default(''),
      formattedAddress: z.string().optional().default(''),
      mapsUrl: z.string().optional().default('')
    }).optional(),
    items: z.array(z.object({
      product: z.string().min(1, "Product ID is required"),
      variant: z.string().optional(),
      quantity: z.number().int().positive("Quantity must be at least 1")
    })).min(1, "At least one item is required in the order"),
    paymentMethod: z.string().min(1, "Payment method is required"),
    paymentReference: z.string().trim().max(100).optional().default(''),
    lockedGoldRate: z.number().positive().optional(),
    lockedGoldRateTimestamp: z.string().optional()
  })
});

// User profile update schema (Customer self-service)
const userUpdateSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(100).optional(),
    phone: z.string().trim().regex(/^\d{10}$/).optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    pincode: z.string().optional()
  })
});

// Admin payment verification schema
const verifyPaymentSchema = z.object({
  body: z.object({
    paymentStatus: z.enum(['Pending', 'Awaiting Verification', 'Paid', 'Failed', 'Refunded']),
    paymentReference: z.string().optional().default(''),
    amountPaid: z.number().min(0).optional(),
    internalAdminNote: z.string().optional().default('')
  })
});

// Appointment booking schema
const appointmentSchema = z.object({
  body: z.object({
    customerName: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
    phone: z.string().trim().regex(/^\d{10}$/, "Valid 10-digit phone number is required"),
    userLocation: z.string().trim().min(2, "Location is required").max(250),
    preferredDate: z.string().min(1, "Preferred date is required"),
    interests: z.string().trim().min(2, "Interests/Viewing preference is required").max(1000)
  })
});

// Settings schemas
const settingsSchema = z.object({
  body: z.object({
    marketRates: z.object({
      rate24k: z.number().positive().optional(),
      rate22k: z.number().positive().optional(),
      rate18k: z.number().positive().optional(),
      silver: z.number().positive().optional(),
      diamond: z.number().min(0).optional(),
      lockDurationMinutes: z.number().min(1).optional()
    }).passthrough().optional(),
    businessInfo: z.object({
      businessName: z.string().optional(),
      tagline: z.string().optional(),
      address: z.string().optional(),
      phone: z.string().optional(),
      email: z.string().email().optional(),
      bankDetails: z.object({
        accountName: z.string().optional(),
        accountNumber: z.string().optional(),
        bankName: z.string().optional(),
        ifscCode: z.string().optional(),
        upiId: z.string().optional(),
        qrCodeUrl: z.string().optional()
      }).optional()
    }).passthrough().optional(),
    notifications: z.object({
      newOrders: z.boolean().optional(),
      lowStock: z.boolean().optional(),
      customerMessages: z.boolean().optional()
    }).passthrough().optional()
  }).passthrough()
});

module.exports = {
  registerSchema,
  loginSchema,
  sendOtpSchema,
  productSchema,
  orderSchema,
  verifyPaymentSchema,
  appointmentSchema,
  settingsSchema,
  userUpdateSchema
};
