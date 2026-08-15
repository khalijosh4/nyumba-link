const router=require('express').Router(),{body}=require('express-validator');
const c=require('../controllers/auth.controller'),{authenticate}=require('../middleware/auth.middleware'),{validateRequest}=require('../middleware/validate.middleware');
router.post('/register',[body('first_name').trim().isLength({min:2,max:80}),body('last_name').trim().isLength({min:2,max:80}),body('email').isEmail().normalizeEmail(),body('phone').matches(/^(\+?254|0)[17]\d{8}$/).withMessage('Valid Kenyan phone required'),body('password').isLength({min:8}),body('role').optional().isIn(['tenant','landlord','caretaker']),validateRequest],c.register);
router.post('/login',[body('email').isEmail().normalizeEmail(),body('password').notEmpty(),validateRequest],c.login);
router.get('/verify-email',c.verifyEmail);
router.post('/forgot-password',[body('email').isEmail().normalizeEmail(),validateRequest],c.forgotPassword);
router.post('/reset-password',[body('token').notEmpty(),body('password').isLength({min:8}),validateRequest],c.resetPassword);
router.get('/me',authenticate,c.getMe);
module.exports=router;
