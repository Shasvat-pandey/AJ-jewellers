const express = require('express');
const router = express.Router();
const StoreSettings = require('../models/StoreSettings');
const { protect, admin } = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');
const { settingsSchema } = require('../validators/schema');

// @route   GET /api/settings
// @desc    Fetch store settings (Creates default if missing)
router.get('/', async (req, res) => {
  try {
    let settings = await StoreSettings.findOne();
    
    // If no settings exist yet, create default ones automatically
    if (!settings) {
      settings = await StoreSettings.create({}); 
    }
    
    res.status(200).json({ success: true, data: settings });
  } catch (error) {
    console.error("Error fetching settings:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

// @route   PUT /api/settings
// @desc    Update store settings
router.put('/', protect, admin, validate(settingsSchema), async (req, res) => {
  try {
    let settings = await StoreSettings.findOne();
    
    if (settings) {
      // Update all three sections
      settings.marketRates = req.body.marketRates || settings.marketRates;
      settings.businessInfo = req.body.businessInfo || settings.businessInfo;
      settings.notifications = req.body.notifications || settings.notifications;
      
      const updatedSettings = await settings.save();
      res.status(200).json({ success: true, data: updatedSettings });
    } else {
      const newSettings = await StoreSettings.create(req.body);
      res.status(201).json({ success: true, data: newSettings });
    }
  } catch (error) {
    console.error("Error updating settings:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

module.exports = router;