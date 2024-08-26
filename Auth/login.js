const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
require('dotenv').config();

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    console.log('Request body:', req.body);

    // Check if the user exists
    let user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    console.log('=====>',user)

    // Compare the provided password with the hashed password in the database
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check JWT_SECRET
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET is not defined');
      return res.status(500).json({ message: 'Server configuration error' });
    }

    console.log('JWT_SECRET:', process.env.JWT_SECRET);

    // Generate JWT token
    const payload = {
      id: user._id.toString(),
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

    console.log('Generated token:', token);

    // Set token in cookies
    const options = {
      expires: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // Cookie expires in 3 days
      httpOnly: true, // Cookie is not accessible via client-side script
    };

    res.cookie('token', token, options);

    // Respond with the user information and token
    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        userName: user.userName,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
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
    console.error('Login Error:', error.message);
    res.status(500).send('Server Error');
  }
});

// Logout route
router.get('/logout', async (req, res) => {
  res.clearCookie('token'); // Clear the 'token' cookie
  res.status(200).json({ message: 'Logged out' });
});

module.exports = router;
