const { Subscription, Course, User } = require('../models/associations');
const { Op } = require('sequelize');



// Plan durations
const PLANS = {
    '1month': { name: '1 Month Access', duration: 30 },
    '3months': { name: '3 Months Access', duration: 90 },
    '6months': { name: '6 Months Access', duration: 180 }
};

// Get price for a specific course and plan
const getPlanPrice = (course, plan) => {
    switch (plan) {
        case '1month': return course.price_1month;
        case '3months': return course.price_3months;
        case '6months': return course.price_6months;
        default: return 499;
    }
};

// Mock: Create order (simulates Razorpay order)
exports.createOrder = async (req, res) => {
    try {
        const { courseId, plan } = req.body;
        const userId = req.user.id;

        console.log(`📝 [MOCK] Creating order: User ${userId}, Course ${courseId}, Plan ${plan}`);

        // Validate course
        const course = await Course.findByPk(courseId);
        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Course not found'
            });
        }

        // Validate plan
        if (!PLANS[plan]) {
            return res.status(400).json({
                success: false,
                message: 'Invalid plan selected'
            });
        }

        // Check if already purchased
        const existingSubscription = await Subscription.findOne({
            where: {
                userId: userId,
                courseId: courseId,
                status: 'active',
                endDate: { [Op.gt]: new Date() }
            }
        });

        if (existingSubscription) {
            return res.status(400).json({
                success: false,
                message: 'You already have an active subscription for this course',
                data: {
                    subscriptionId: existingSubscription.id,
                    expiresAt: existingSubscription.endDate
                }
            });
        }

        // Get price
        let amount = getPlanPrice(course, plan);
        let discountApplied = false;

        const user = await User.findByPk(userId);
        if (user && user.availableDiscounts > 0) {
            amount = Math.round(amount * 0.9); // 10% discount
            discountApplied = true;
        }

        // Generate mock order ID
        const mockOrderId = `mock_order_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;

        res.json({
            success: true,
            mockMode: true,
            data: {
                orderId: mockOrderId,
                amount: amount,
                originalAmount: getPlanPrice(course, plan),
                discountApplied: discountApplied,
                amountPaise: amount * 100,
                currency: 'INR',
                keyId: 'MOCK_KEY_ID',
                course: {
                    id: course.id,
                    title: course.title
                },
                plan: {
                    name: PLANS[plan].name,
                    duration: PLANS[plan].duration
                },
                mockPaymentUrl: `/api/payments/mock-pay/${mockOrderId}`,
                instructions: "In mock mode, you can directly call verify endpoint with any paymentId"
            }
        });
    } catch (error) {
        console.error('❌ [MOCK] Create order error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create order',
            error: error.message
        });
    }
};

// Mock: Verify payment (simulates Razorpay verification)
exports.verifyPayment = async (req, res) => {
    try {
        const {
            orderId,
            paymentId,
            courseId,
            plan,
            amount
        } = req.body;

        const userId = req.user.id;

        console.log(`🔐 [MOCK] Verifying payment: Order ${orderId}, Payment ${paymentId}`);

        // In mock mode, we accept any paymentId
        if (!paymentId) {
            return res.status(400).json({
                success: false,
                message: 'Payment ID is required'
            });
        }

        // Get course details
        const course = await Course.findByPk(courseId);
        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Course not found'
            });
        }

        // Check if already purchased
        const existingSubscription = await Subscription.findOne({
            where: {
                userId: userId,
                courseId: courseId,
                status: 'active',
                endDate: { [Op.gt]: new Date() }
            }
        });

        if (existingSubscription) {
            return res.status(400).json({
                success: false,
                message: 'You already have an active subscription for this course',
                data: existingSubscription
            });
        }

        // Calculate discount if applicable
        const user = await User.findByPk(userId);
        let finalAmount = amount || getPlanPrice(course, plan);
        let discountApplied = false;

        if (user && user.availableDiscounts > 0 && finalAmount < getPlanPrice(course, plan)) {
             discountApplied = true;
        } else if (!amount && user && user.availableDiscounts > 0) {
             finalAmount = Math.round(finalAmount * 0.9);
             discountApplied = true;
        }

        // Calculate dates
        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + PLANS[plan].duration);

        // Create subscription with mock payment details
        const subscription = await Subscription.create({
            userId: userId,
            courseId: courseId,
            plan: plan,
            startDate: startDate,
            endDate: endDate,
            status: 'active',
            amount: finalAmount,
            paymentId: `mock_${paymentId}`,
            orderId: orderId
        });

        if (discountApplied && user) {
            await user.decrement('availableDiscounts', { by: 1 });
        }

        console.log(`✅ [MOCK] Payment verified! Subscription created: ${subscription.id}`);
        res.json({
            success: true,
            mockMode: true,
            message: 'Payment successful! Course purchased (Mock Mode).',
            data: {
                subscriptionId: subscription.id,
                courseId: courseId,
                courseTitle: course.title,
                plan: plan,
                amount: finalAmount,
                discountApplied: discountApplied,
                expiresAt: endDate,
                daysRemaining: PLANS[plan].duration
            }
        });
    } catch (error) {
        console.error('❌ [MOCK] Verify payment error:', error);
        res.status(500).json({
            success: false,
            message: 'Payment verification failed',
            error: error.message
        });
    }
};

// Mock: Direct purchase (simplest - one step)
exports.mockPurchase = async (req, res) => {
    try {
        const { courseId, plan, coinsUsed } = req.body;
        const userId = req.user.id;

        console.log(`💰 [MOCK] Direct purchase: User ${userId}, Course ${courseId}, Plan ${plan}, Coins Used ${coinsUsed || 0}`);

        // Validate course
        const course = await Course.findByPk(courseId);
        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Course not found'
            });
        }

        // Validate plan
        if (!PLANS[plan]) {
            return res.status(400).json({
                success: false,
                message: 'Invalid plan selected'
            });
        }

        // Check if already purchased
        const existingSubscription = await Subscription.findOne({
            where: {
                userId: userId,
                courseId: courseId,
                status: 'active',
                endDate: { [Op.gt]: new Date() }
            }
        });

        if (existingSubscription) {
            return res.status(400).json({
                success: false,
                message: 'You already have an active subscription for this course',
                data: {
                    subscriptionId: existingSubscription.id,
                    expiresAt: existingSubscription.endDate
                }
            });
        }

        // Get price
        let amount = getPlanPrice(course, plan);
        let discountApplied = false;
        
        const user = await User.findByPk(userId);
        if (user && user.availableDiscounts > 0) {
            amount = Math.round(amount * 0.9);
            discountApplied = true;
        }

        // Calculate dates
        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + PLANS[plan].duration);

        // Create subscription
        const subscription = await Subscription.create({
            userId: userId,
            courseId: courseId,
            plan: plan,
            startDate: startDate,
            endDate: endDate,
            status: 'active',
            amount: amount,
            paymentId: `mock_direct_${Date.now()}`,
            orderId: `mock_order_${Date.now()}`
        });

        // Handle Coins
        const coinsToDeduct = coinsUsed || 0;
        let amountPaid = amount;
        
        if (user) {
            if (coinsToDeduct > 0 && user.coins >= coinsToDeduct) {
                await user.decrement('coins', { by: coinsToDeduct });
                amountPaid = Math.max(0, amount - coinsToDeduct);
            }
            
            // 10% cashback
            if (amountPaid > 0) {
                const earnedCoins = Math.floor(amountPaid * 0.1);
                await user.increment('coins', { by: earnedCoins });
            }
            
            if (discountApplied) {
                await user.decrement('availableDiscounts', { by: 1 });
            }
        }

        console.log(`✅ [MOCK] Direct purchase successful! Subscription: ${subscription.id}`);

        res.json({
            success: true,
            mockMode: true,
            message: 'Course purchased successfully (Mock Mode)',
            data: {
                subscriptionId: subscription.id,
                courseId: courseId,
                courseTitle: course.title,
                plan: plan,
                amount: amount,
                discountApplied: discountApplied,
                expiresAt: endDate,
                daysRemaining: PLANS[plan].duration
            }
        });
    } catch (error) {
        console.error('❌ [MOCK] Direct purchase error:', error);
        res.status(500).json({
            success: false,
            message: 'Purchase failed',
            error: error.message
        });
    }
};