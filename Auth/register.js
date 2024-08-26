const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../Models/userModel');
require("dotenv").config();

router.post('/register', async (req, res) => {
  try {
    const { userName, firstName, lastName, email, address, nationality, dob, idProof, phoneNumber, password, accountType } = req.body;

    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create new user instance
    user = new User({
      userName,
      firstName,
      lastName,
      email,
      address,
      nationality,
      dob,
      idProof,
      phoneNumber,
      accountType // Note: We'll hash the password before saving
    });

    // Hash password
    const salt = await bcrypt.genSalt(10);
    password:user.password = await bcrypt.hash(password, salt);

    // Save user to database
    await user.save();

    // Generate JWT token
    const payload = {
      id: user._id.toString(),  // Make sure you're using 'id' as the key
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

    // Add token to the user document
    user.token = token;
    await user.save();

    // Return user details and token
    res.status(201).json({
      user: {
        id: user._id,
        userName: user.userName,
        firstName: user.firstName,
        lastName: user.lastName,
        email:user.email,
        password:user.password,
        address: user.address,
        nationality: user.nationality,
        dob: user.dob,
        idProof: user.idProof,
        phoneNumber: user.phoneNumber,
        registrationDate: user.registrationDate,
        accountType: user.accountType,
        token: user.token,
      },
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;