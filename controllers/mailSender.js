const nodemailer = require('nodemailer');
const Room = require('../models/roomModel');
const Booking = require('../models/bookingModel');

const transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendBookingEmail = async (bookingDetails, userEmail, adminEmail) => {
  const { 
    bookingId, 
    room, 
    checkInDate, 
    checkOutDate, 
    totalBalance, 
    userDetails, 
    discountCoupon, 
    bookingType, 
    paidAmount, 
    dueAmount, 
    specialRequests,
    cancellationPolicy
  } = bookingDetails;

  try {
    // Fetch the Room details for the booking
    const roomDetails = await Room.find({ _id: { $in: room } }).populate('room_type').lean();

    if (!roomDetails || roomDetails.length === 0) {
      console.error(`Room(s) with ID(s) ${room.join(', ')} not found`);
      throw new Error(`Room(s) with ID(s) ${room.join(', ')} not found`);
    }

    const roomDetailsHTML = roomDetails.map(room => `
      <div>
        <p><strong>Room Number:</strong> ${room.room_number}</p>
        <p><strong>Room Type:</strong> ${room.room_type.type_name}</p>
        <p><strong>Bed Type:</strong> ${room.bedType}</p>
        <p><strong>Capacity:</strong> ${room.capacity.adults} adults, ${room.capacity.children} children</p>
        <p><strong>Facilities:</strong> ${room.room_facility.join(', ')}</p>
      </div>
    `).join('<hr>');

    let paymentInfo = '';
    if (bookingType === 'standard') {
      paymentInfo = `<p><strong>Amount to Pay at Hotel:</strong> $${dueAmount}</p>`;
    } else if (bookingType === 'advance') {
      paymentInfo = `
        <p><strong>Amount Paid:</strong> $${paidAmount}</p>
        <p><strong>Remaining Due Amount:</strong> $${dueAmount}</p>
      `;
    }

    const checkInDay = new Date(checkInDate).toLocaleDateString('en-US', { weekday: 'long' });
    const checkOutDay = new Date(checkOutDate).toLocaleDateString('en-US', { weekday: 'long' });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: userEmail,
      cc: adminEmail,
      subject: 'Your Booking Confirmation - ' + bookingId,
      html: `
        <h1>Booking Confirmation</h1>
        <p>Dear ${userDetails.name},</p>
        <p>Thank you for choosing our hotel. We're pleased to confirm your booking.</p>
        
        <h2>Booking Details</h2>
        <p><strong>Booking ID:</strong> ${bookingId}</p>
        <p><strong>Check-In Date:</strong> ${new Date(checkInDate).toLocaleDateString()} (${checkInDay})</p>
        <p><strong>Check-Out Date:</strong> ${new Date(checkOutDate).toLocaleDateString()} (${checkOutDay})</p>
        <p><strong>Number of Nights:</strong> ${Math.ceil((new Date(checkOutDate) - new Date(checkInDate)) / (1000 * 60 * 60 * 24))}</p>
        
        <h3>Room Details:</h3>
        ${roomDetailsHTML}
        
        <h2>Payment Information</h2>
        <p><strong>Total Amount:</strong> $${totalBalance}</p>
        ${paymentInfo}
        ${discountCoupon ? `<p><strong>Discount Coupon Applied:</strong> ${discountCoupon}</p>` : ''}
        
        <h2>Guest Information</h2>
        <p><strong>Name:</strong> ${userDetails.name}</p>
        <p><strong>Email:</strong> ${userDetails.email}</p>
        <p><strong>Phone:</strong> ${userDetails.phone}</p>
        <p><strong>Address:</strong> ${userDetails.address.street}, ${userDetails.address.city}, ${userDetails.address.state}, ${userDetails.address.zipCode}, ${userDetails.address.country}</p>
        
        ${specialRequests ? `<h2>Special Requests</h2><p>${specialRequests}</p>` : ''}
        
        <h2>Cancellation Policy</h2>
        <p>${cancellationPolicy || 'Please contact the hotel for cancellation policy details.'}</p>
        
        <h2>Additional Information</h2>
        <p>Check-in time: After 3:00 PM</p>
        <p>Check-out time: Before 11:00 AM</p>
        <p>If you need to modify or cancel your reservation, please contact our reservations team at least 24 hours prior to your check-in date.</p>
        
        <p>We look forward to welcoming you to our hotel. If you have any questions or need further assistance, please don't hesitate to contact us.</p>
        
        <p>Best regards,<br>The Reservations Team</p>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log('Booking confirmation email sent successfully');
  } catch (error) {
    console.error('Error sending email:', error);
  }
};

module.exports = { sendBookingEmail };
