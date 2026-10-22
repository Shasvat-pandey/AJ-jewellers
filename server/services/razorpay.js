/**
 * DEPRECATED RAZORPAY SERVICE STUB
 * 
 * SEC-01 Remediation: Razorpay has been permanently retired.
 * This stub safely handles legacy references without crashing or exposing credentials.
 */

const createOrder = async () => {
  throw new Error('Razorpay integration has been permanently retired.');
};

const verifyPayment = () => {
  return false;
};

const getPaymentDetails = async () => {
  throw new Error('Razorpay integration has been permanently retired.');
};

const createRefund = async () => {
  throw new Error('Razorpay integration has been permanently retired.');
};

module.exports = {
  createOrder,
  verifyPayment,
  getPaymentDetails,
  createRefund
};