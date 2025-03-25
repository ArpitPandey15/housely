import { prisma } from '../config/prismaConfig.js';
import asyncHandler from 'express-async-handler';

// Create User
const createUser = asyncHandler(async (req, res) => {
    console.log("Creating a user");
    let { email } = req.body;

    const userExists = await prisma.user.findUnique({ where: { email } });

    if (!userExists) {
        const user = await prisma.user.create({ data: req.body });
        res.status(201).json({ message: "User created successfully", user });
    } else {
        res.status(200).json({ message: "User already exists", user: userExists });
    }
});

// Book visit for residency
const bookVisit = asyncHandler(async (req, res) => {
    const { email, date } = req.body;
    const { id } = req.params;

    try {
        const user = await prisma.user.findUnique({
            where: { email },
            select: { bookedVisits: true }
        });

        if (!user || !user.bookedVisits) {
            return res.status(404).json({ message: "User not found or has no visits" });
        }

        if (user.bookedVisits.some((visit) => visit.id === id)) {
            return res.status(400).json({ message: "Already booked" });
        }

        await prisma.user.update({
            where: { email },
            data: { bookedVisits: { push: { id, date } } },
        });

        res.status(200).json({ message: "Booked successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get all bookings
const getAllBookings = asyncHandler(async (req, res) => {
    const { email } = req.body;

    try {
        const user = await prisma.user.findUnique({
            where: { email },
            select: { bookedVisits: true }
        });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json(user.bookedVisits);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Cancel booking
const cancelBooking = asyncHandler(async (req, res) => {
    const { email } = req.body;
    const { id } = req.params;

    try {
        const user = await prisma.user.findUnique({
            where: { email },
            select: { bookedVisits: true }
        });

        if (!user || !user.bookedVisits) {
            return res.status(404).json({ message: "User not found or has no bookings" });
        }

        const index = user.bookedVisits.findIndex((visit) => visit.id === id);
        if (index === -1) {
            return res.status(400).json({ message: "Not booked" });
        }

        user.bookedVisits.splice(index, 1);

        await prisma.user.update({
            where: { email },
            data: { bookedVisits: user.bookedVisits }
        });

        res.status(200).json({ message: "Cancelled successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Add or remove favorite residency
const toFav = asyncHandler(async (req, res) => {
    const { email } = req.body;
    const { rid } = req.params;

    try {
        const user = await prisma.user.findUnique({ where: { email } });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if (user.favResidenciesID.includes(rid)) {
            const updatedUser = await prisma.user.update({
                where: { email },
                data: { favResidenciesID: { set: user.favResidenciesID.filter((id) => id !== rid) } },
            });

            return res.status(200).json({ message: "Removed from favorites", user: updatedUser });
        } else {
            const updatedUser = await prisma.user.update({
                where: { email },
                data: { favResidenciesID: { push: rid } },
            });

            return res.status(200).json({ message: "Added to favorites", user: updatedUser });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get all favorite residencies
const getAllFav = asyncHandler(async (req, res) => {
    const { email } = req.body;

    try {
        const user = await prisma.user.findUnique({
            where: { email },
            select: { favResidenciesID: true }
        });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json(user.favResidenciesID);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export { createUser, bookVisit, getAllBookings, cancelBooking, toFav, getAllFav };
