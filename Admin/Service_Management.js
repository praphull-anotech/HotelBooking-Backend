const express = require("express");
const router = express.Router();
const RoomType = require("../models/roomTypeModel");
const Room = require("../models/roomModel");
const auth = require("../middlewares/auth");
const { isAdmin } = require("../middlewares/roleSpecificAuth");

// externaly add amenities and services to exisiting room_type
// Update amenities and services for an existing Room Type
// Add amenities and services to an existing Room Type
router.put("/add-amenities-services/:id", auth, isAdmin, async (req, res) => {
  try {
    const { amenities, services } = req.body;
    const { id } = req.params;

    const amenitiesArray = amenities.split(",").map((item) => item.trim());
    const servicesArray = services.split(",").map((item) => item.trim());

    const updatedRoomType = await RoomType.findByIdAndUpdate(
      id,
      {
        $addToSet: {
          amenities: { $each: amenitiesArray },
          services: { $each: servicesArray },
        },
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

// Delete specific amenities and services by index
router.put("/delete-amenities-services/:id",auth,isAdmin,async (req, res) => {
    try {
      const { id } = req.params;
      const { amenitiesIndex, servicesIndex } = req.body;

      const roomType = await RoomType.findById(id);

      if (!roomType) {
        return res.status(404).json({ message: "Room Type not found" });
      }

      if (typeof amenitiesIndex === "number" && amenitiesIndex >= 0) {
        roomType.amenities.splice(amenitiesIndex, 1);
      }

      if (typeof servicesIndex === "number" && servicesIndex >= 0) {
        roomType.services.splice(servicesIndex, 1);
      }

      await roomType.save();

      res.status(200).json({ success: true, roomType });
    } catch (error) {
      console.error(error.message);
      res.status(500).json({ message: "Server Error" });
    }
  }
);


//get services 
router.get("/services-amenities/:id", auth, async (req, res) => {
  try {
    const { id } = req.params;

    const roomType = await RoomType.findById(id);

    if (!roomType) {
      return res.status(404).json({ message: "Room Type not found" });
    }

    res.status(200).json({
      success: true,
      amenities: roomType.amenities,
      services: roomType.services,
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Server Error" });
  }
});

module.exports = router;
