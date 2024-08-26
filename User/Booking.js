const express = require('express');
const router = express.Router();
const Booking = require('../models/bookingModel');
const RoomType = require('../models/roomTypeModel');
const Room = require('../models/roomModel');
const Payment = require('../models/paymentModel');
const Coupon = require('../models/couponModel');
const { v4: uuidv4 } = require('uuid');
const auth = require('../middlewares/auth');
const {isAdmin} = require("../middlewares/roleSpecificAuth")
const {sendBookingEmail} = require('../controllers/mailSender')


async function applyCoupon(couponCode, totalAmount) {
  const coupon = await Coupon.findOne({ couponCode });

  if (!coupon || !coupon.isActive) {
    throw new Error('Invalid or inactive coupon');
  }

  const currentDate = new Date();
  if (currentDate < coupon.startCouponDate || currentDate > coupon.endCouponDate) {
    throw new Error('Coupon is not valid for the current date');
  }

  if (totalAmount < coupon.minPurchaseAmount) {
    throw new Error('Purchase amount does not meet the minimum requirement for the coupon');
  }

  if (coupon.usedCount >= coupon.usageLimit) {
    throw new Error('Coupon usage limit exceeded');
  }

  // Calculate discount and ensure it does not exceed the maxDiscountAmount
  const discount = Math.min(
    Math.round((totalAmount * coupon.discountPercentage) / 100),
    coupon.maxDiscountAmount
  );

  // Update the coupon usage count
  coupon.usedCount += 1;
  await coupon.save();

  console.log(`Coupon applied. Discount: ${discount}`);

  return discount;
}

// Create a new booking request
router.post('/booking', auth, async (req, res) => {
  try {
    const {
      userDetails,
      room, // Directly using room ID
      room_quantity,
      checkInDate,
      checkOutDate,
      payment_method,
      bookingType,
      discountCoupon,
      paidAmount = 0, // Default to 0 if not provided
    } = req.body;

    // Validate userDetails fields
    const { name, email, phone, address } = userDetails;
    const { street, city, state, zipCode, country } = address;

    if (!name || !email || !phone || !street || !city || !state || !zipCode || !country) {
      return res.status(400).json({ message: 'All user details and address fields are required.' });
    }

    // Fetch the room details
    const roomDetails = await Room.findById(room);
    if (!roomDetails) {
      return res.status(404).json({ message: 'Room not found' });
    }

    // Check if the room is available for the requested dates
    const existingBooking = await Booking.findOne({
      room,
      $or: [
        { checkInDate: { $lt: new Date(checkOutDate) }, checkOutDate: { $gt: new Date(checkInDate) } }
      ],
    });

    if (existingBooking) {
      return res.status(400).json({ message: 'Room is not available for the selected dates.' });
    }

    // Calculate the total price for the requested rooms using total_price
    const roomTotalPrice = roomDetails.total_price;
    let subtotal = roomTotalPrice * room_quantity;

    // Calculate the number of nights
    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);
    const numberOfNights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));

    subtotal *= numberOfNights;
    console.log(`Room price: ${roomTotalPrice}, Room quantity: ${room_quantity}, Subtotal: ${subtotal}`);

    // Apply coupon discount if available
    let discountAmount = 0;
    let totalAmount = subtotal;
    if (discountCoupon) {
      discountAmount = await applyCoupon(discountCoupon, subtotal);
      totalAmount -= discountAmount;
      console.log(`Coupon applied. Discount: ${discountAmount}`);
    }

    // Calculate the advance payment based on bookingType
    let advancePayment = 0;
    if (bookingType === "advance") {
      advancePayment = Math.round(totalAmount * 0.3); // 30% advance payment
      console.log(`Advance Payment: ${advancePayment}`);
    }

    // Round all numerical values
    totalAmount = Math.round(totalAmount);
    let roundedPaidAmount = Math.round(paidAmount); // Avoid reassigning const paidAmount
    subtotal = Math.round(subtotal);
    discountAmount = Math.round(discountAmount);

    console.log(`Discount Amount: ${discountAmount}, Total Amount after discount: ${totalAmount}`);

    // Generate a unique booking ID
    const bookingId = uuidv4();

    // Create a new booking with the initial status set to "pending"
    const newBooking = new Booking({
      user: req.user._id,
      userDetails, 
      room,
      room_quantity,
      status: "pending", // Pending until payment is confirmed
      checkInDate,
      checkOutDate,
      payment:null, 
      payment_method,
      bookingType,
      discountCoupon,
      dueAmount: totalAmount,
      paidAmount: roundedPaidAmount, // No payment yet
      totalBalance: totalAmount,
      bookingId,
    });

    await newBooking.save();

    // Reserve the room, but do not mark it as occupied yet
    roomDetails.bookings.push(newBooking._id);
    await roomDetails.save();

    // Define the message based on bookingType
    let message;
    if (bookingType === 'standard') {
      message = `Booking created successfully. Please note that you need to pay ${totalAmount} on the hotel premises upon check-in.`;
      const adminEmail = process.env.ADMIN_EMAIL;
      const userEmail = userDetails.email;

      // Send booking confirmation email immediately for standard bookings
      await sendBookingEmail(newBooking, userEmail, adminEmail);
    } else if (bookingType === 'advance') {
      message = `Booking created successfully. Please proceed with a payment of ${advancePayment} to confirm your booking.`;
    }

    console.log(`Final message: ${message}`);

    // Send the response with the appropriate message
    res.status(201).json({
      success: true,
      bookingId: newBooking.bookingId,
      message,
    });
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});


/////Cancel Booking by user ////////////////////////////////////////////////////////////
router.delete('/cancel-booking/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`Deleting booking with ID: ${id}`);

    // Find the booking by ID
    const booking = await Booking.findById(id);
    if (!booking) {
      console.log(`Booking with ID: ${id} not found`);
      return res.status(404).json({ message: 'Booking not found' });
    }

    const bookingDate = new Date(booking.createdAt); // Assuming createdAt is when the booking was made
    const today = new Date();
    const timeSinceBooking = Math.ceil((today - bookingDate) / (1000 * 60 * 60)); // Time since booking in hours
    const checkInDate = new Date(booking.checkInDate);
    const daysUntilCheckIn = Math.ceil((checkInDate - today) / (1000 * 60 * 60 * 24));

    console.log(`Time since booking: ${timeSinceBooking} hours`);
    console.log(`Days until check-in: ${daysUntilCheckIn} days`);

    // Check if the cancellation is within the allowed time frame
    if (timeSinceBooking > 20) {
      console.log('Cancellation attempt outside the allowed time frame');
      return res.status(400).json({ message: 'Cancellation is not allowed beyond 20 hours of booking' });
    }

    // For advance bookings, handle refund condition
    if (booking.bookingType === 'advance' && timeSinceBooking > 30) {
      console.log('Advance booking cancellation attempt beyond allowed refund period');
      return res.status(400).json({ message: 'Advance booking cancellations are not refundable beyond 30 hours of booking' });
    }

    // Update the booking status to cancelled
    booking.status = 'cancelled';
    await booking.save();
    console.log(`Booking with ID: ${id} status updated to cancelled`);

    // Update room status if needed
    if (booking.status === 'cancelled') {
      const rooms = await Room.find({ room_type: booking.room_type, status: 'occupied' });
      console.log(`Updating status for ${rooms.length} occupied rooms`);
      for (let room of rooms) {
        room.status = 'available';
        await room.save();
        console.log(`Room ID: ${room._id} status updated to available`);
      }
    }

    res.status(200).json({ success: true, message: 'Booking cancelled successfully' });
  } catch (error) {
    console.error('Error cancelling booking:', error.message);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});


// Update Booking by user ///////////////////////////\\\\\\\\\\\\\\\\\\\\\\\\\
router.put('/update-booking/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { checkInDate, checkOutDate, bookingType } = req.body;

    const booking = await Booking.findById(id);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check if the update is allowed
    const bookingCreationDate = new Date(booking.createdAt);
    const currentDate = new Date();
    const hoursSinceBooking = Math.ceil((currentDate - bookingCreationDate) / (1000 * 60 * 60));

    if (hoursSinceBooking > 30) {
      return res.status(400).json({ message: 'Update not allowed after 30 hours of booking' });
    }

    // Fetch room details
    const roomDetails = await Room.findById(booking.room);
    if (!roomDetails) {
      return res.status(404).json({ message: 'Room not found' });
    }

    // Calculate new total balance and due amount
    const roomPrice = roomDetails.total_price; // Use total_price for calculations
    const newCheckIn = new Date(checkInDate);
    const newCheckOut = new Date(checkOutDate);
    const numberOfNights = Math.ceil((newCheckOut - newCheckIn) / (1000 * 60 * 60 * 24));
    const newTotalBalance = Math.round(roomPrice * numberOfNights);
    const newDueAmount = Math.round(newTotalBalance - booking.paidAmount);

    // Handle case when the number of nights is reduced
    const excessPayment = Math.round(booking.paidAmount - newTotalBalance);

    // Update booking details
    booking.checkInDate = checkInDate || booking.checkInDate;
    booking.checkOutDate = checkOutDate || booking.checkOutDate;
    booking.bookingType = bookingType || booking.bookingType;
    booking.totalBalance = newTotalBalance;
    booking.dueAmount = newDueAmount;
    booking.status = "pending"; // Set status to pending after update

    await booking.save();

    // Prepare the message for the user
    let message = `Booking updated successfully.`;
    
    if (excessPayment > 0) {
      message += ` You have overpaid. The refundable amount is ${excessPayment}. Please collect this amount from the hotel premises or email us at ${process.env.HOTEL_EMAIL}.`;
    } else {
      const advancePayment = Math.round(newDueAmount * 0.3); // 30% of the new due amount
      if (advancePayment > booking.paidAmount) {
        message += ` You need to pay ${advancePayment - booking.paidAmount} to confirm the updated booking.`;
      } else {
        message += ` You have already paid more than 30% of the new total balance. No additional payment is required.`;
      }
    }

    res.status(200).json({ success: true, booking, message });
  } catch (error) {
    console.error('Error updating booking:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});


router.get('/rooms/filter', async (req, res) => {
  try {
    // Extracting query parameters
    const { adults, children, bedType } = req.query;

    console.log("Request received:", req.query);
    console.log(`Extracted values - Adults: ${adults} Children: ${children} Bed Type: ${bedType}`);

    // Validate required query parameters
    if (!adults || !children || !bedType) {
      console.log("Validation failed: Missing capacity or bed type");
      return res.status(400).json({ message: "Please provide capacity (adults and children) and bed type." });
    }

    // Convert adults and children to numbers
    const adultsNumber = parseInt(adults);
    const childrenNumber = parseInt(children);

    // Log the parsed values
    console.log(`Parsed values - Adults: ${adultsNumber} Children: ${childrenNumber} Bed Type: ${bedType}`);

    // Fetch rooms that match the criteria
    const matchingRooms = await Room.find({
      'capacity.adults': { $gte: adultsNumber },
      'capacity.children': { $gte: childrenNumber },
      bedType: bedType,
      status: 'available'
    });

    console.log("Matching rooms found:", matchingRooms);

    if (matchingRooms.length === 0) {
      return res.status(404).json({ message: 'No rooms available with the specified capacity and bed type.' });
    }

    res.status(200).json({ rooms: matchingRooms });
  } catch (error) {
    console.error('Error fetching rooms:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});


router.post('/checkout', auth, isAdmin, async (req, res) => {
  try {
    const { bookingId } = req.body;

    // Find the booking by ID
    const booking = await Booking.findOne({ bookingId }); // Use findOne to get a single booking object
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found.' });
    }

    // Set the booking status to completed
    booking.status = 'checkedout';
    await booking.save(); // Save the updated booking status

    // Update the room associated with this booking
    const room = await Room.findById(booking.room); // Use findById to get the room by ID
    if (room) {
      // Remove the booking ID from the room's bookings array
      room.bookings.pull(booking._id);
      room.status = 'available'; // Reset the room status to available
      await room.save(); // Save the updated room status
    }

    res.status(200).json({ success: true, message: 'Checkout completed successfully.' });
  } catch (error) {
    console.error('Error during checkout:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});


module.exports = router;
