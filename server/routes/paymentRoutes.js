const express = require('express');
const router = express.Router();

/**
 * RETIRED ENDPOINTS - ONLINE PAYMENT GATEWAYS DECOMMISSIONED
 * 
 * In accordance with business requirements, all online payment gateways
 * (including Razorpay) have been retired. AJ Jewellers exclusively accepts:
 * 1. Cash (Cash on Delivery or Pay at Boutique) - confirmed by Admin.
 * 2. External Bank Transfer / UPI App Payment - verified by Admin with uploaded evidence.
 */

const retirementResponse = (req, res) => {
  res.status(410).json({
    success: false,
    message: 'Online payment gateways (including Razorpay) have been permanently decommissioned for AJ Jewellers.',
    supportedPaymentMethods: [
      {
        id: 'cash',
        name: 'Cash / Pay at Boutique',
        description: 'Payment collected upon in-store collection or delivery, verified by store administrator.'
      },
      {
        id: 'bank_transfer',
        name: 'Bank Transfer / External UPI',
        description: 'Direct transfer to company bank account or UPI ID. Administrator verifies funds and uploads evidence.'
      }
    ]
  });
};

router.post('/create-order', retirementResponse);
router.post('/verify', retirementResponse);
router.post('/webhook', retirementResponse);
router.use(retirementResponse);

module.exports = router;