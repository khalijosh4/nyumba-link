const router=require('express').Router(),{body}=require('express-validator');
const c=require('../controllers/booking.controller'),{authenticate}=require('../middleware/auth.middleware'),{validateRequest}=require('../middleware/validate.middleware');
router.post('/',authenticate,[body('listing_id').isUUID(),body('viewing_date').isDate(),body('viewing_time').notEmpty(),validateRequest],c.createBooking);
router.get('/my',authenticate,c.getMyBookings);
router.patch('/:id/status',authenticate,c.updateBookingStatus);
module.exports=router;
