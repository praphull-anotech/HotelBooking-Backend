const express = require('express');
const router = express.Router();
const Booking = require('../models/bookingModel');
const auth = require('../middlewares/auth');
const {isAdmin} = require('../middlewares/roleSpecificAuth')
// Route to get all 'standard' bookings
router.get('/bookings/standard', auth,isAdmin, async (req, res) => {
  try {
    const standardBookings = await Booking.find({ bookingType: 'standard' });

    if (!standardBookings || standardBookings.length === 0) {
      return res.status(404).json({ message: 'No standard bookings found.' });
    }

    res.status(200).json({
      success: true,
      bookings: standardBookings
    });
  } catch (error) {
    console.error('Error fetching standard bookings:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

router.get('/bookings/advance', auth,isAdmin, async (req, res) => {
    try {
      const advanceBookings = await Booking.find({ bookingType: 'advance' });
  
      if (!advanceBookings || advanceBookings.length === 0) {
        return res.status(404).json({ message: 'No advance bookings found.' });
      }
  
      res.status(200).json({
        success: true,
        bookings: advanceBookings
      });
    } catch (error) {
      console.error('Error fetching advance bookings:', error);
      res.status(500).json({ message: 'Server Error', error: error.message });
    }
  });
  

module.exports = router;
