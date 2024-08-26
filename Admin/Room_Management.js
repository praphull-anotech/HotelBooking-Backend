const express = require("express");
const router = express.Router();
const RoomType = require("../models/roomTypeModel");
const Room = require("../models/roomModel");
const auth = require("../middlewares/auth");
const { isAdmin } = require("../middlewares/roleSpecificAuth");
const upload = require("../middlewares/upload");
const cloudinaryUpload = require("../utils/CloudinaryUpload");

// Create a new Room Type
router.post("/add-roomtypes", auth, isAdmin, upload, async (req, res) => {
  try {
    const { type_name, description, amenities, services } = req.body;

    let imageUrls = [];

    if (req.files && req.files.length > 0) {
      imageUrls = await Promise.all(
        req.files.map((file) => cloudinaryUpload(file.buffer))
      );
    }

    const amenitiesArray = amenities.split(",").map((item) => item.trim());
    const servicesArray = services.split(",").map((item) => item.trim());

    const roomType = new RoomType({
      type_name,
      description,
      amenities: amenitiesArray,
      images: imageUrls,
      services: servicesArray,
    });

    await roomType.save();

    res.status(201).json({ success: true, roomType });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Server Error" });
  }
});

// Update an existing Room Type
router.put("/update-roomtypes/:id", auth, isAdmin, upload, async (req, res) => {
  try {
    const { type_name, description, amenities, services } = req.body;

    const { id } = req.params;
    let { images } = req.body;
    let imageUrls = [];

    if (req.files && req.files.length > 0) {
      imageUrls = await Promise.all(
        req.files.map((file) => cloudinaryUpload(file.buffer))
      );
    }

    const amenitiesArray = amenities.split(",").map((item) => item.trim());
    const servicesArray = services.split(",").map((item) => item.trim());

    if (imageUrls.length > 0) {
      images = imageUrls;
    } else if (images) {
      images = images.split(","); // If images are passed as a comma-separated string
    }

    const updatedRoomType = await RoomType.findByIdAndUpdate(
      id,
      {
        type_name,
        description,
        amenities: amenitiesArray,
        images,
        services: servicesArray,
      },
      { new: true }
    );

    if (!updatedRoomType) {
      return res.status(404).json({ message: "Room Type not found" });
    }

    res.status(200).json({ success: true, updatedRoomType });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Server Error" });
  }
});

// Delete a Room Type
router.delete("/delete-roomtypes/:id", auth, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Find and delete the RoomType
    const roomType = await RoomType.findByIdAndDelete(id);

    if (!roomType) {
      return res.status(404).json({ message: "Room Type not found" });
    }

    // Also delete associated rooms
    await Room.deleteMany({ room_type: id });

    res.status(200).json({
      success: true,
      message: "Room Type and associated rooms deleted",
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Server Error" });
  }
});

// Get all Room Types
router.get("/roomtypes", auth, async (req, res) => {
  try {
    const roomTypes = await RoomType.find().populate("rooms");
    res.status(200).json({ success: true, roomTypes });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Server Error" });
  }
});

// Get a Room Type by ID
router.get("/roomtypes/:id", auth, async (req, res) => {
  try {
    const { id } = req.params;
    const roomType = await RoomType.findById(id).populate("rooms");

    if (!roomType) {
      return res.status(404).json({ message: "Room Type not found" });
    }

    res.status(200).json({ success: true, roomType });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Server Error" });
  }
});

///////////////////////////////// Rooms CRUD(the original product)=======================/////////////////////////////============================//////////////////////////=============================================---------------------------------------------

// Add a new Room
router.post("/add-room", auth, isAdmin, upload, async (req, res) => {
  try {
    const {
      room_type,
      room_number,
      room_facility,
      floor,
      status,
      bedType,
      price_per_night,
      tax,
      'capacity.adults': adults,
      'capacity.children': children,
    } = req.body;

    // Validate that capacity fields are present and convert to numbers
    if (typeof adults === 'undefined' || typeof children === 'undefined') {
      return res.status(400).json({ message: "Capacity must include adults and children properties." });
    }

    let imageUrls = [];

    if (req.files && req.files.length > 0) {
      imageUrls = await Promise.all(
        req.files.map((file) => cloudinaryUpload(file.buffer))
      );
    }

    const totalPrice = parseFloat(price_per_night) + (parseFloat(price_per_night) * parseFloat(tax)) / 100;

    const room = new Room({
      room_type,
      room_number,
      room_facility,
      floor,
      status,
      bedType,
      capacity: {
        adults: parseInt(adults, 10),
        children: parseInt(children, 10),
      },
      price_per_night: parseFloat(price_per_night),
      tax: parseFloat(tax),
      total_price: totalPrice,
      images: imageUrls,
    });

    const savedRoom = await room.save();

    // Update the RoomType to include the new room
    await RoomType.findByIdAndUpdate(
      room_type,
      { $push: { rooms: savedRoom._id } },
      { new: true }
    );

    res.status(201).json({ success: true, room: savedRoom });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Server Error" });
  }
});

// Update an existing Room
router.put("/update-room/:id", auth, isAdmin, upload, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      room_type,
      room_number,
      room_facility,
      floor,
      status,
      bedType,
      "capacity.adults": adults,
      "capacity.children": children,
      price_per_night,
      tax,
    } = req.body;
    let { images } = req.body;
    let imageUrls = [];

    if (req.files && req.files.length > 0) {
      imageUrls = await Promise.all(
        req.files.map((file) => cloudinaryUpload(file.buffer))
      );
    }

    const totalPrice =
      parseFloat(price_per_night) +
      (parseFloat(price_per_night) * parseFloat(tax)) / 100;

    if (imageUrls.length > 0) {
      images = imageUrls;
    } else if (images) {
      images = images.split(","); // If images are passed as a comma-separated string
    }

    const updatedRoom = await Room.findByIdAndUpdate(
      id,
      {
        room_type,
        room_number,
        room_facility,
        floor,
        status,
        bedType,
        capacity: {
          adults: parseInt(capacity.adults, 10),
          children: parseInt(capacity.children, 10),
        },
        price_per_night: parseFloat(price_per_night),
        tax: parseFloat(tax),
        total_price: totalPrice,
        images,
      },
      { new: true }
    );

    if (!updatedRoom) {
      return res.status(404).json({ message: "Room not found" });
    }

    if (room_type) {
      // Update RoomType references if the room_type is changed
      await RoomType.findOneAndUpdate(
        { rooms: id },
        { $pull: { rooms: id } },
        { new: true }
      );
      await RoomType.findByIdAndUpdate(
        room_type,
        { $push: { rooms: id } },
        { new: true }
      );
    }

    res.status(200).json({ success: true, room: updatedRoom });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Server Error" });
  }
});

router.delete("/delete-room/:id", auth, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Find and delete the Room
    const deletedRoom = await Room.findByIdAndDelete(id);

    if (!deletedRoom) {
      return res.status(404).json({ message: "Room not found" });
    }

    // Update the corresponding RoomType
    await RoomType.findByIdAndUpdate(
      deletedRoom.room_type,
      { $pull: { rooms: id } },
      { new: true }
    );

    res
      .status(200)
      .json({ success: true, message: "Room deleted successfully" });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Server Error" });
  }
});

router.get("/rooms", auth, isAdmin, async (req, res) => {
  try {
    const rooms = await Room.find();

    res.status(200).json({ success: true, rooms });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Server Error" });
  }
});

// Get rooms by room_type ID
router.get(
  "/rooms-available/by-room-type/:room_type_id",
  auth,
  isAdmin,
  async (req, res) => {
    try {
      const { room_type_id } = req.params;
      const rooms = await Room.find({ room_type: room_type_id }).populate(
        "room_type"
      );

      if (rooms.length === 0) {
        return res
          .status(404)
          .json({ message: "No rooms found for the given room type" });
      }

      res.status(200).json({ success: true, rooms });
    } catch (error) {
      console.error(error.message);
      res.status(500).json({ message: "Server Error" });
    }
  }
);

module.exports = router;
