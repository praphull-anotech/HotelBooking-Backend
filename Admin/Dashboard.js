const express = require("express");
const router = express.Router();
const Booking = require("../models/bookingModel");
const Room = require("../models/roomModel");
const RoomType = require("../models/roomTypeModel");
const User = require("../models/userModel"); // Assuming you have a User model
const auth = require("../middlewares/auth");
const { isAdmin } = require("../middlewares/roleSpecificAuth");
const { isAdminOrManager } = require("../middlewares/roleSpecificAuth");
const Payment = require("../models/paymentModel");

// Route to get reservations with room and room type details
router.get("/reservations", auth, isAdminOrManager, async (req, res) => {
  try {
    console.log("Fetching bookings from the database...");

    // Fetch all bookings
    const bookings = await Booking.find()
      .populate("user", "name email")
      .populate("payment")
      .lean(); // Use lean() for better performance as we don't need Mongoose document methods

    console.log("Bookings fetched:", bookings);

    // Prepare the response data
    const reservations = await Promise.all(
      bookings.map(async (booking) => {
        console.log("Processing booking:", booking);

        // Fetch the RoomType for the booking
        const roomType = await RoomType.findById(booking.room_type).lean();
        console.log("Room Type fetched:", roomType);

        // Check if roomType is found
        if (!roomType) {
          console.error(`RoomType with ID ${booking.room_type} not found`);
          return null; // Skip this booking if roomType is not found
        }

        // Fetch available rooms of the booked type for the booking period
        const rooms = await Room.find({
          room_type: roomType._id,
          status: "available",
        })
          .select("room_number")
          .lean();

        console.log("Rooms fetched:", rooms);

        // Randomly select rooms based on the booked quantity
        const allocatedRooms = rooms
          .sort(() => 0.5 - Math.random())
          .slice(0, booking.room_quantity)
          .map((room) => room.room_number);

        console.log("Allocated Rooms:", allocatedRooms);

        return {
          bookingId: booking.bookingId,
          userDetails: booking.user,
          roomType: roomType.type_name,
          roomQuantity: booking.room_quantity,
          allocatedRooms: allocatedRooms,
          checkInDate: booking.checkInDate,
          checkOutDate: booking.checkOutDate,
          status: booking.status,
          paymentMethod: booking.payment_method,
          paymentStatus: booking.payment ? booking.payment.status : "Not paid",
          bookingType: booking.bookingType,
          totalAmount: booking.totalBalance,
          paidAmount: booking.paidAmount,
          dueAmount: booking.dueAmount,
          discountApplied: booking.discountCoupon ? "Yes" : "No",
        };
      })
    );

    // Filter out null values if any booking couldn't be processed
    const filteredReservations = reservations.filter(
      (reservation) => reservation !== null
    );

    console.log("Reservations prepared:", filteredReservations);

    res.json({
      success: true,
      count: filteredReservations.length,
      reservations: filteredReservations,
    });
  } catch (error) {
    console.error("Error fetching reservations:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while fetching reservations",
      error: error.message,
    });
  }
});

// get customers
router.get("/customers", auth, isAdminOrManager, async (req, res) => {
  try {
    // Aggregate booking data with payment details
    const customers = await Booking.aggregate([
      {
        $lookup: {
          from: "payments", // Name of the Payment collection
          localField: "_id",
          foreignField: "booking",
          as: "payments",
        },
      },
      {
        $unwind: {
          path: "$payments",
          preserveNullAndEmptyArrays: true, // Preserve bookings with no payments
        },
      },
      {
        $project: {
          userDetails: 1,
          checkInDate: 1,
          checkOutDate: 1,
          dueAmount: 1,
          paidAmount: 1,
          bookingType: 1,
          paymentMethod: 1,
          "payments.amount": 1,
          "payments.transactionId": 1,
          "payments.status": 1,
        },
      },
      {
        $group: {
          _id: "$_id",
          userDetails: { $first: "$userDetails" },
          checkInDate: { $first: "$checkInDate" },
          checkOutDate: { $first: "$checkOutDate" },
          dueAmount: { $first: "$dueAmount" },
          paidAmount: { $first: "$paidAmount" },
          bookingType: { $first: "$bookingType" },
          paymentMethod: { $first: "$paymentMethod" },
          payments: { $push: "$payments" },
        },
      },
      {
        $sort: { checkInDate: -1 }, // Sort by check-in date descending
      },
    ]);

    res.status(200).json({
      success: true,
      customers,
    });
  } catch (error) {
    console.error("Error retrieving customer list:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
});

//get today's booking
router.get("/todays-booking-amount",auth,isAdminOrManager,async (req, res) => {
    try {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      const totalAmount = await Payment.aggregate([
        {
          $match: {
            status: "Success",
            createdAt: { $gte: startOfDay },
          },
        },
        {
          $group: {
            _id: null,
            totalAmount: { $sum: "$amount" },
          },
        },
      ]);

      res.status(200).json({
        success: true,
        totalAmount: totalAmount[0] ? totalAmount[0].totalAmount : 0,
        message:
          "Total amount for today's confirmed bookings retrieved successfully.",
      });
    } catch (error) {
      console.error("Error fetching today's booking total amount:", error);
      res.status(500).json({ success: false, message: "Server error." });
    }
});

// get total-customers
router.get("/total-customers", auth, isAdminOrManager, async (req, res) => {
  try {
    const totalCustomers = await Booking.distinct("user").countDocuments();

    res.status(200).json({
      success: true,
      totalCustomers,
      message: "Total customers retrieved successfully.",
    });
  } catch (error) {
    console.error("Error fetching total customers:", error);
    res.status(500).json({ success: false, message: "Server error." });
  }
});


//get total-bookings
router.get("/total-bookings", auth, isAdminOrManager, async (req, res) => {
  try {
    const totalBookings = await Booking.countDocuments();

    res.status(200).json({
      success: true,
      totalBookings,
      message: "Total bookings retrieved successfully.",
    });
  } catch (error) {
    console.error("Error fetching total bookings:", error);
    res.status(500).json({ success: false, message: "Server error." });
  }
});


// get today booking 
router.get("/today-bookings", auth, isAdminOrManager, async (req, res) => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0); // Set time to 00:00:00
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999); // Set time to 23:59:59.999

    const todayBookingsCount = await Booking.aggregate([
      {
        $match: {
          createdAt: {
            $gte: startOfDay,
            $lt: endOfDay,
          },
        },
      },
      {
        $count: "totalBookings",
      },
    ]);

    const totalBookings =
      todayBookingsCount.length > 0 ? todayBookingsCount[0].totalBookings : 0;

    res.status(200).json({
      success: true,
      totalBookings,
      message: "Today's bookings counted successfully.",
    });
  } catch (error) {
    console.error("Error counting today's bookings:", error);
    res.status(500).json({ success: false, message: "Server error." });
  }
});


//get due amounts
router.get("/due-amounts", auth, isAdminOrManager, async (req, res) => {
  try {
    const dueAmounts = await Booking.aggregate([
      {
        $match: {
          dueAmount: { $gt: 0 }, // Only select bookings with due amounts greater than zero
        },
      },
      {
        $lookup: {
          from: "users", // Refers to the users collection in lowercase plural form
          localField: "user", // The field in the Booking collection that references the user
          foreignField: "_id", // The field in the users collection
          as: "userDetails", // The name of the array where the matched documents will be stored
        },
      },
      {
        $unwind: "$userDetails",
      },
      {
        $project: {
          _id: 0,
          userId: "$userDetails._id",
          userName: "$userDetails.userName", // Make sure to use the correct field name from your user schema
          email: "$userDetails.email", // Make sure to use the correct field name from your user schema
          totalBalance: 1,
          paidAmount: 1,
          dueAmount: 1,
        },
      },
    ]);

    res.status(200).json({
      success: true,
      dueAmounts,
      message: "Due amounts retrieved successfully.",
    });
  } catch (error) {
    console.error("Error fetching due amounts:", error);
    res.status(500).json({ success: false, message: "Server error." });
  }
});

module.exports = router;
