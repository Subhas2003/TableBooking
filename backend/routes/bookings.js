const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const auth = require('../middleware/auth');
const twilio = require('twilio');

// SMS integration placeholder (using Twilio)
const sendConfirmationSMS = async (booking) => {
    try {
        if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER) {
            const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
            const dateStr = new Date(booking.date).toLocaleDateString();
            const message = `Your table for ${booking.seats} people on ${dateStr} at ${booking.time} is confirmed. Booking ID: ${booking._id.toString().slice(-6)}`;

            await client.messages.create({
                body: message,
                from: process.env.TWILIO_PHONE_NUMBER,
                to: booking.phone
            });
            console.log('SMS sent successfully to', booking.phone);
        } else {
            console.log('Twilio credentials not found. SMS not sent. Mock confirmation:');
            const dateStr = new Date(booking.date).toLocaleDateString();
            console.log(`To ${booking.phone}: Your table for ${booking.seats} people on ${dateStr} at ${booking.time} is confirmed.`);
        }
    } catch (error) {
        console.error('Error sending SMS:', error);
    }
}

// POST /api/bookings - Create a booking (Public)
router.post('/', async (req, res) => {
    try {
        const { name, email, phone, seats, date, time, specialRequests } = req.body;

        // Basic validation
        if (!name || !email || !phone || !seats || !date || !time) {
            return res.status(400).json({ success: false, message: 'Please provide all required fields' });
        }

        const newBooking = new Booking({
            name,
            email,
            phone,
            seats,
            date,
            time,
            specialRequests
        });

        const savedBooking = await newBooking.save();

        // Return short booking ID for user reference
        const shortId = savedBooking._id.toString().slice(-6);

        res.status(201).json({
            success: true,
            message: 'Booking created successfully',
            booking: savedBooking,
            bookingId: shortId
        });

        // Note: In a real app, you might only send confirmation AFTER the admin confirms it, 
        // or send a "pending" SMS now. The prompt says default is pending, but send SMS confirmation. 
        // We'll send it here per typical prompt interpretation.
        await sendConfirmationSMS(savedBooking);

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

// GET /api/bookings - Get all bookings (Admin Protected)
router.get('/', auth, async (req, res) => {
    try {
        const query = {};

        // Search functionality
        const { search, status, date } = req.query;
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { phone: { $regex: search, $options: 'i' } }
            ];
        }

        // Filter by status
        if (status && status !== 'all') {
            query.status = status;
        }

        // Filter by date
        if (date) {
            // Need to handle date string to match Date object in MongoDB realistically
            const startDate = new Date(date);
            startDate.setHours(0, 0, 0, 0);
            const endDate = new Date(date);
            endDate.setHours(23, 59, 59, 999);

            query.date = {
                $gte: startDate,
                $lte: endDate
            };
        }

        const bookings = await Booking.find(query).sort({ date: 1, time: 1 });

        // Calculate stats
        const allBookingsForStats = await Booking.find();
        const stats = {
            total: allBookingsForStats.length,
            pending: allBookingsForStats.filter(b => b.status === 'pending').length,
            confirmed: allBookingsForStats.filter(b => b.status === 'confirmed').length,
            totalGuests: allBookingsForStats.reduce((sum, b) => sum + (b.seats || 0), 0)
        };

        res.json({ success: true, count: bookings.length, data: bookings, stats });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

// PATCH /api/bookings/:id/status - Update booking status (Admin Protected)
router.patch('/:id/status', auth, async (req, res) => {
    try {
        const { status } = req.body;

        if (!['pending', 'confirmed', 'cancelled', 'completed'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status' });
        }

        const booking = await Booking.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true, runValidators: true }
        );

        if (!booking) {
            return res.status(404).json({ success: false, message: 'Booking not found' });
        }

        res.json({ success: true, data: booking });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

// DELETE /api/bookings/:id - Delete booking (Admin Protected)
router.delete('/:id', auth, async (req, res) => {
    try {
        const booking = await Booking.findByIdAndDelete(req.params.id);

        if (!booking) {
            return res.status(404).json({ success: false, message: 'Booking not found' });
        }

        res.json({ success: true, data: {} });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

module.exports = router;
