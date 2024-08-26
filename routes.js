const express = require('express')
const router = express.Router()

const Login = require('./Auth/login')
const Register = require('./Auth/register')
const roomManagement = require('./Admin/Room_Management')
const requestbooking = require('./User/Booking')
const coupon = require("./Admin/CouponController")
const payment = require("./User/Payment")
const servicemanagement = require('./Admin/Service_Management')
const bookingmanagement = require('./Admin/Booking_Management')
const dashboard = require("./Admin/Dashboard")
////////////////////////////////////////////////////////////////=========================///////////////////////////////////

router.use('/',Login)
router.use('/',Register)
router.use('/',roomManagement)
router.use('/',requestbooking)
router.use('/',coupon)
router.use('/',payment)
router.use('/',servicemanagement)
router.use('/',bookingmanagement)
router.use('/',dashboard)

module.exports = router