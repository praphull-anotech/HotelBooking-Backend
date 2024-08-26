const express = require('express');
const router = express.Router();
const Booking = require('../models/bookingModel');
const Payment = require('../models/paymentModel');
const PaymentMethod = require("../models/paymentMethod")
const { v4: uuidv4 } = require('uuid');
const auth = require('../middlewares/auth');
const Room = require("../models/roomModel");
const { sendBookingEmail } = require('../controllers/mailSender');
const {isAdmin} = require("../middlewares/roleSpecificAuth")
// Fake payment route
router.post('/payment', auth, async (req, res) => {
  try {
    const { bookingId, paymentMethod, amount } = req.body;

    // Find the booking by ID
    const booking = await Booking.findOne({ bookingId });
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check if the payment is sufficient for the booking type
    let advancePayment = 0;
    if (booking.bookingType === "advance") {
      advancePayment = Math.round(booking.totalBalance * 0.3);
      if (amount < advancePayment) {
        return res.status(400).json({
          message: `A minimum payment of ${advancePayment} is required to confirm the booking.`,
        });
      }
    }

    // Update the booking payment details
    booking.paidAmount += amount;
    booking.dueAmount = Math.round(booking.totalBalance - booking.paidAmount);

    // Update booking status
    if (booking.bookingType === "standard" || booking.paidAmount >= advancePayment) {
      booking.status = "confirmed";
    }

    await booking.save();

    // Create a new payment record
    const payment = new Payment({
      booking: booking._id,
      paymentMethod,
      amount,
      status: booking.status === 'confirmed' ? 'Success' : 'Pending',
      transactionId: `TRANSACTION-${uuidv4()}`, // Generate a unique transaction ID
    });

    await payment.save();

    // Update the booking to include the new payment
    if (!booking.payment) {
      booking.payment = []; // Initialize payment array if not exists
    }
    booking.payment.push(payment._id);
    await booking.save();

    // Update the room status to occupied if booking is confirmed
    if (booking.status === "confirmed") {
      const roomDetails = await Room.findById(booking.room);
      roomDetails.status = 'occupied';
      await roomDetails.save();

      // Send booking confirmation email
      const adminEmail = process.env.ADMIN_EMAIL;
      const userEmail = booking.userDetails.email;

      await sendBookingEmail(booking, userEmail, adminEmail);
    }

    res.status(200).json({
      success: true,
      booking,
      payment,
      message: booking.status === "confirmed" ? 'Payment successful, booking confirmed.' : 'Payment successful, awaiting confirmation.',
    });
  } catch (error) {
    console.error('Error processing payment:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});


//get payment details
router.get("/payments", auth, async (req, res) => {
  try {
    const payments = await Payment.find().populate("booking", "bookingId checkInDate checkOutDate user");
    res.status(200).json({ success: true, payments });
  } catch (error) {
    console.error("Error retrieving payments:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
});


//add payment method to Database
router.post("/add-payment-method",auth, isAdmin, async (req, res) => {
  try {
    const { name, isActive } = req.body;
    const newMethod = new PaymentMethod({ name, isActive });
    await newMethod.save();
    res.status(201).json({ success: true, message: "Payment method added successfully.", method: newMethod });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error.", error: error.message });
  }
});



// Update a payment method
router.put("/update-payment-method/:id",auth, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, isActive } = req.body;
    const updatedMethod = await PaymentMethod.findByIdAndUpdate(
      id,
      { name, isActive },
      { new: true }
    );
    res.status(200).json({ success: true, message: "Payment method updated successfully.", method: updatedMethod });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error.", error: error.message });
  }
});


//set payment method active or deactive 
// router.put("/payment-methods/:id/toggle-status", auth,isAdmin, async (req, res) => {
//   try {
//     const { id } = req.params;

//     const isActive = await PaymentMethod.findById(id);
//     if (!method) {
//       return res.status(404).json({ message: "Payment method not found" });
//     }

//     method.status = method.status === "active" ? "inactive" : "active";

//     await method.save();
//     res.status(200).json({ success: true, method, message: "Payment method status toggled successfully." });
//   } catch (error) {
//     console.error("Error toggling payment method status:", error);
//     res.status(500).json({ message: "Server Error", error: error.message });
//   }
// });

//delete the payment method
router.delete("/delete-payment-method/:id",auth, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    await PaymentMethod.findByIdAndDelete(id);
    res.status(200).json({ success: true, message: "Payment method deleted successfully." });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error.", error: error.message });
  }
});

// Get all payment methods
router.get("/payment-methods",auth, isAdmin, async (req, res) => {
  try {
    const methods = await PaymentMethod.find();
    res.status(200).json({ success: true, methods });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error.", error: error.message });
  }
});

module.exports = router;
