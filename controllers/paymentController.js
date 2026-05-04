const Razorpay = require('razorpay');
const crypto = require('crypto');
const { Subscription, Course, User } = require('../models/associations');
const { Op } = require('sequelize');

let razorpayInstance = null;
const getRazorpay = () => {
    if (!razorpayInstance) {
        razorpayInstance = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID || 'dummy_key_id',
            key_secret: process.env.RAZORPAY_KEY_SECRET || 'dummy_key_secret'
        });
    }
    return razorpayInstance;
};

const PLANS = {
    '1month': { name: '1 Month Access', duration: 30 },
    '3months': { name: '3 Months Access', duration: 90 },
    '6months': { name: '6 Months Access', duration: 180 }
};

const getPlanPrice = (course, plan) => {
    switch (plan) {
        case '1month': return course.price_1month;
        case '3months': return course.price_3months;
        case '6months': return course.price_6months;
        default: return course.price_1month || 499;
    }
};

exports.createOrder = async (req, res) => {
    try {
        const { courseId, plan, coinsUsed } = req.body;
        const userId = req.user.id;

        const course = await Course.findByPk(courseId);
        if (!course) {
            return res.status(404).json({ success: false, message: 'Course not found' });
        }
        if (!PLANS[plan]) {
            return res.status(400).json({ success: false, message: 'Invalid plan selected' });
        }

        const existingSubscription = await Subscription.findOne({
            where: { userId, courseId, status: 'active', endDate: { [Op.gt]: new Date() } }
        });
        if (existingSubscription) {
            return res.status(400).json({ success: false, message: 'You already have an active subscription for this course' });
        }

        let amount = getPlanPrice(course, plan);
        const user = await User.findByPk(userId);
        if (user && user.availableDiscounts > 0) {
            amount = Math.round(amount * 0.9);
        }
        let coinsToDeduct = coinsUsed || 0;
        if (user && coinsToDeduct > 0 && user.coins >= coinsToDeduct) {
            amount = Math.max(0, amount - coinsToDeduct);
        }

        if (amount === 0) {
            return res.json({ success: true, isFree: true, amount: 0 });
        }

        const options = {
            amount: amount * 100,
            currency: 'INR',
            receipt: 'receipt_' + Date.now()
        };

        const razorpay = getRazorpay();
        const order = await razorpay.orders.create(options);
        res.json({ success: true, order, keyId: process.env.RAZORPAY_KEY_ID, amount });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to create order', error: error.message });
    }
};

exports.verifyPayment = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, courseId, plan, coinsUsed } = req.body;
        const userId = req.user.id;

        if (!razorpay_order_id && !razorpay_payment_id) {
            isFree = true;
        } else {
            console.log('--- Razorpay Verification Debug ---');
            console.log('Order ID:', razorpay_order_id);
            console.log('Payment ID:', razorpay_payment_id);
            const body = razorpay_order_id + "|" + razorpay_payment_id;
            const secret = (process.env.RAZORPAY_KEY_SECRET || '').trim();
            
            console.log('Verifying signature for Order:', razorpay_order_id);
            if (!secret) {
                console.error('RAZORPAY_KEY_SECRET is missing on backend!');
                return res.status(500).json({ success: false, message: 'Razorpay secret not configured on server' });
            }

            const expectedSignature = crypto.createHmac('sha256', secret)
                .update(body)
                .digest('hex');

            if (expectedSignature !== razorpay_signature) {
                console.error('SIGNATURE MISMATCH!');
                console.log('Received Signature:', razorpay_signature);
                // DO NOT log the full secret, but log its length to verify it's loaded
                console.log('Secret Length:', secret.length);
                return res.status(400).json({ success: false, message: 'Invalid payment signature' });
            }
            console.log('Signature verified successfully.');
        }

        const course = await Course.findByPk(courseId);
        if (!course) {
            return res.status(404).json({ success: false, message: 'Course not found' });
        }

        const user = await User.findByPk(userId);
        let amount = getPlanPrice(course, plan);
        let discountApplied = false;
        if (user && user.availableDiscounts > 0) {
            amount = Math.round(amount * 0.9);
            discountApplied = true;
        }
        let coinsToDeduct = coinsUsed || 0;
        let amountPaid = amount;
        if (user && coinsToDeduct > 0 && user.coins >= coinsToDeduct) {
            amountPaid = Math.max(0, amount - coinsToDeduct);
            await user.decrement('coins', { by: coinsToDeduct });
        }
        if (discountApplied && user) {
            await user.decrement('availableDiscounts', { by: 1 });
        }

        if (amountPaid > 0 && user && user.referredBy) {
            const earnedCoins = Math.floor(amountPaid * 0.1);
            const referrer = await User.findByPk(user.referredBy);
            if (referrer) {
                await referrer.increment('coins', { by: earnedCoins });
            }
        }

        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + PLANS[plan].duration);

        const subscription = await Subscription.create({
            userId: userId,
            courseId: courseId,
            plan: plan,
            startDate: startDate,
            endDate: endDate,
            status: 'active',
            amount: amountPaid,
            paymentId: razorpay_payment_id || 'free_access',
            orderId: razorpay_order_id || 'free_order'
        });

        res.json({ success: true, message: 'Payment verified successfully! Course purchased.', data: { subscriptionId: subscription.id, courseId, plan, amount: amountPaid, expiresAt: endDate, daysRemaining: PLANS[plan].duration } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Payment verification failed', error: error.message });
    }
};

