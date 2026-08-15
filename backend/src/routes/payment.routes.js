const router=require('express').Router(),{body}=require('express-validator');
const c=require('../controllers/payment.controller'),{authenticate}=require('../middleware/auth.middleware'),{validateRequest}=require('../middleware/validate.middleware');
router.post('/mpesa/callback',c.mpesaCallback);
router.post('/initiate',authenticate,[body('type').isIn(['tenant_access','listing_fee','listing_renewal']),body('phone').matches(/^(\+?254|0)[17]\d{8}$/),validateRequest],c.initiatePayment);
router.get('/my',authenticate,c.getMyPayments);
router.get('/status/:paymentId',authenticate,c.queryPaymentStatus);
module.exports=router;
