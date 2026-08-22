const Tour = require('../models/Tour');
const TourBooking = require('../models/TourBooking');
const { createAdminNotification } = require('../services/notificationService');
const mongoose = require('mongoose');

const normalizeTourPayload = (payload = {}) => ({
  title: payload.title?.trim() || '',
  slug: payload.slug?.trim() || '',
  category: payload.category?.trim() || '',
  destination: payload.destination?.trim() || '',
  country: payload.country?.trim() || 'Nepal',
  province: payload.province?.trim() || '',
  city: payload.city?.trim() || '',
  coverImage: payload.coverImage?.trim() || '',
  galleryImages: Array.isArray(payload.galleryImages) ? payload.galleryImages : (payload.galleryImages ? String(payload.galleryImages).split(',').map((item) => item.trim()).filter(Boolean) : []),
  videos: Array.isArray(payload.videos) ? payload.videos : (payload.videos ? String(payload.videos).split(',').map((item) => item.trim()).filter(Boolean) : []),
  shortDescription: payload.shortDescription?.trim() || '',
  fullDescription: payload.fullDescription?.trim() || '',
  durationDays: Number(payload.durationDays || 0),
  durationNights: Number(payload.durationNights || 0),
  difficulty: payload.difficulty?.trim() || '',
  maxTravelers: Number(payload.maxTravelers || 0),
  languages: Array.isArray(payload.languages) ? payload.languages : (payload.languages ? String(payload.languages).split(',').map((item) => item.trim()).filter(Boolean) : []),
  pickupLocation: payload.pickupLocation?.trim() || '',
  googleMapsEmbedUrl: payload.googleMapsEmbedUrl?.trim() || '',
  mapRouteDetails: payload.mapRouteDetails || {
    route: payload.route?.trim() || '',
    startingPoint: payload.startingPoint?.trim() || '',
    hotelMarker: payload.hotelMarker?.trim() || '',
    destinationMarker: payload.destinationMarker?.trim() || ''
  },
  price: Number(payload.price || 0),
  discount: Number(payload.discount || 0),
  featuredBadge: !!payload.featuredBadge,
  bestSellerBadge: !!payload.bestSellerBadge,
  recommendedBadge: !!payload.recommendedBadge,
  remainingSeats: Number(payload.remainingSeats || 0),
  bookingStatus: payload.bookingStatus?.trim() || 'Available',
  tourGuideAssignment: payload.tourGuideAssignment?.trim() || '',
  vehicleAssignment: payload.vehicleAssignment?.trim() || '',
  hotelAssignment: payload.hotelAssignment?.trim() || '',
  homepageVisibility: payload.homepageVisibility !== false,
  publishStatus: payload.publishStatus?.trim() || 'Published',
  seoTitle: payload.seoTitle?.trim() || '',
  seoMetaDescription: payload.seoMetaDescription?.trim() || '',
  urlSlug: payload.urlSlug?.trim() || payload.slug?.trim() || payload.title?.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''),
  availableDates: Array.isArray(payload.availableDates) ? payload.availableDates : (payload.availableDates ? String(payload.availableDates).split(',').map((item) => item.trim()).filter(Boolean) : []),
  highlights: Array.isArray(payload.highlights) ? payload.highlights : [],
  itinerary: Array.isArray(payload.itinerary) ? payload.itinerary : [],
  included: Array.isArray(payload.included) ? payload.included : [],
  excluded: Array.isArray(payload.excluded) ? payload.excluded : [],
  travelAdvice: Array.isArray(payload.travelAdvice) ? payload.travelAdvice : [],
  faqs: Array.isArray(payload.faqs) ? payload.faqs : [],
  reviews: payload.reviews || { averageRating: 0, totalReviews: 0, ratingBreakdown: {}, customerPhotos: [], list: [] },
  infoCards: payload.infoCards || {}
});

const createTour = async (req, res) => {
  try {
    const payload = normalizeTourPayload(req.body);
    if (!payload.title) return res.status(400).json({ error: 'Tour title is required' });

    // Basic numeric validation
    if (isNaN(Number(payload.price)) || Number(payload.price) < 0) return res.status(400).json({ error: 'Price must be a non-negative number' });
    if (isNaN(Number(payload.durationDays)) || Number(payload.durationDays) < 0) return res.status(400).json({ error: 'durationDays must be a non-negative number' });
    if (isNaN(Number(payload.durationNights)) || Number(payload.durationNights) < 0) return res.status(400).json({ error: 'durationNights must be a non-negative number' });
    if (isNaN(Number(payload.maxTravelers)) || Number(payload.maxTravelers) < 0) return res.status(400).json({ error: 'maxTravelers must be a non-negative number' });
    if (isNaN(Number(payload.remainingSeats)) || Number(payload.remainingSeats) < 0) return res.status(400).json({ error: 'remainingSeats must be a non-negative number' });
    if (Number(payload.remainingSeats) > Number(payload.maxTravelers) && Number(payload.maxTravelers) > 0) return res.status(400).json({ error: 'remainingSeats cannot exceed maxTravelers' });

    const tour = await Tour.create(payload);
    res.status(201).json(tour);
  } catch (error) {
    console.error('createTour error:', error);
    res.status(500).json({ error: 'Failed to create tour' });
  }
};

const getTours = async (req, res) => {
  try {
    const tours = await Tour.find().sort({ createdAt: -1 });
    res.json(tours);
  } catch (error) {
    console.error('getTours error:', error);
    res.status(500).json({ error: 'Failed to fetch tours' });
  }
};

const updateTour = async (req, res) => {
  try {
    const payload = normalizeTourPayload(req.body);
    if (isNaN(Number(payload.price)) || Number(payload.price) < 0) return res.status(400).json({ error: 'Price must be a non-negative number' });
    if (isNaN(Number(payload.durationDays)) || Number(payload.durationDays) < 0) return res.status(400).json({ error: 'durationDays must be a non-negative number' });
    if (isNaN(Number(payload.durationNights)) || Number(payload.durationNights) < 0) return res.status(400).json({ error: 'durationNights must be a non-negative number' });
    if (isNaN(Number(payload.maxTravelers)) || Number(payload.maxTravelers) < 0) return res.status(400).json({ error: 'maxTravelers must be a non-negative number' });
    if (isNaN(Number(payload.remainingSeats)) || Number(payload.remainingSeats) < 0) return res.status(400).json({ error: 'remainingSeats must be a non-negative number' });
    if (Number(payload.remainingSeats) > Number(payload.maxTravelers) && Number(payload.maxTravelers) > 0) return res.status(400).json({ error: 'remainingSeats cannot exceed maxTravelers' });

    const tour = await Tour.findByIdAndUpdate(req.params.id, payload, { new: true });
    if (!tour) return res.status(404).json({ error: 'Tour not found' });
    res.json(tour);
  } catch (error) {
    console.error('updateTour error:', error);
    res.status(500).json({ error: 'Failed to update tour' });
  }
};

const deleteTour = async (req, res) => {
  try {
    const tour = await Tour.findByIdAndDelete(req.params.id);
    if (!tour) return res.status(404).json({ error: 'Tour not found' });
    res.json({ message: 'Tour deleted' });
  } catch (error) {
    console.error('deleteTour error:', error);
    res.status(500).json({ error: 'Failed to delete tour' });
  }
};

const bookTour = async (req, res) => {
  try {
    const { tourId, travelDate, guests, bookedByName, bookedByEmail, bookedByPhone } = req.body;
    
    if (!tourId || !travelDate || !guests || !bookedByName || !bookedByEmail) {
      return res.status(400).json({ error: 'Missing required booking fields' });
    }

    const tour = await Tour.findById(tourId);
    if (!tour) return res.status(404).json({ error: 'Tour not found' });

    const numGuests = Number(guests);
    if (numGuests <= 0) return res.status(400).json({ error: 'Invalid number of guests' });

    if (tour.maxTravelers > 0 && tour.remainingSeats < numGuests) {
      return res.status(400).json({ error: 'Not enough available seats' });
    }

    // Update remaining seats if applicable
    if (tour.maxTravelers > 0) {
      tour.remainingSeats -= numGuests;
      await tour.save();
    }

    // Compute price per person
    const rawPrice = Number(tour.price || 0);
    const rawDiscount = Number(tour.discount || 0);
    let perPersonPrice = rawPrice;
    if (rawDiscount && rawDiscount > 0) {
      if (rawDiscount <= 100) {
        perPersonPrice = rawPrice * (1 - rawDiscount / 100);
      } else {
        perPersonPrice = Math.max(0, rawPrice - rawDiscount);
      }
    }
    const computedPrice = Math.round(perPersonPrice * numGuests);
    const durationStr = `${tour.durationDays} Days / ${tour.durationNights} Nights`;

    const booking = await TourBooking.create({
      tourId: tour._id,
      tourName: tour.title,
      tourCoverImage: req.body.tourCoverImage || tour.coverImage || '',
      destination: tour.destination,
      duration: durationStr,
      travelDate,
      guests: numGuests,
      adults: Number(req.body.adults || 0),
      children: Number(req.body.children || 0),
      totalPrice: computedPrice,
      bookedBy: req.user ? req.user._id : null,
      bookedByName,
      bookedByEmail,
      bookedByPhone,
      deviceId: req.body.deviceId || '',
      country: req.body.country || '',
      address: req.body.address || '',
      paymentMethod: req.body.paymentMethod || 'pay_at_site',
      status: 'Pending'
    });

    // Notify admin about the new tour booking
    try {
      await createAdminNotification({
        type: 'tour_booking',
        title: `New Tour Booking: ${tour.title}`,
        message: `${bookedByName} booked ${numGuests} guest(s) for ${tour.title} on ${travelDate}.`,
        link: `/admin/tours/bookings/${booking._id}`,
        sendEmail: true,
        details: {
          'Tour Name': tour.title,
          'Destination': tour.destination,
          'Duration': `${tour.durationDays} Days / ${tour.durationNights} Nights`,
          'Travel Date': travelDate,
          'Guest Name': bookedByName,
          'Email': bookedByEmail,
          'Phone': bookedByPhone || 'N/A',
          'Number of Guests': numGuests,
          'Remaining Seats': tour.remainingSeats,
          'Price Per Person': `Rs. ${tour.price - tour.discount}`,
          'Total Price': `Rs. ${computedPrice}`
        }
      });
    } catch (e) {
      console.error('Failed to queue admin tour booking notification:', e && e.message ? e.message : e);
    }
    res.status(201).json(booking);
  } catch (error) {
    console.error('bookTour error:', error);
    res.status(500).json({ error: 'Failed to book tour' });
  }
};

const getUserBookings = async (req, res) => {
  try {
    const userEmail = req.user?.email || '';
    const userId = req.user?._id;
    const query = { $or: [] };
    if (userId && mongoose.Types.ObjectId.isValid(userId)) {
      query.$or.push({ bookedBy: userId });
    }
    if (userEmail) {
      query.$or.push({ bookedByEmail: { $regex: new RegExp(`^${userEmail}$`, 'i') } });
    }
    const bookings = await TourBooking.find(query.$or.length > 0 ? query : {}).populate('tourId').sort({ createdAt: -1 });
    res.json(bookings);
  } catch (err) {
    console.error('getUserBookings error:', err);
    res.status(500).json({ error: 'Failed to fetch user bookings' });
  }
};

const getUserBookingsGuest = async (req, res) => {
  try {
    const email = req.query.email || req.query.bookedByEmail || req.query.guestEmail;
    const deviceId = req.query.deviceId || req.query.bookedBy;
    if (!email && !deviceId) return res.status(400).json({ error: 'Email or deviceId is required' });
    
    const query = { $or: [] };
    if (email) {
      query.$or.push({ bookedByEmail: { $regex: new RegExp(`^${email.trim()}$`, 'i') } });
    }
    if (deviceId) {
      query.$or.push({ deviceId: deviceId });
    }
    
    const bookings = await TourBooking.find(query).populate('tourId').sort({ createdAt: -1 });
    res.json(bookings);
  } catch (err) {
    console.error('getUserBookingsGuest error:', err);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
};

const updateTourBookingStatus = async (req, res) => {
  try {
    const bookingId = req.params.id;
    const { status } = req.body;
    if (!status) return res.status(400).json({ error: 'Status is required' });

    const booking = await TourBooking.findById(bookingId);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    booking.status = String(status).trim();
    await booking.save();

    res.json({ success: true, data: booking });
  } catch (error) {
    console.error('updateTourBookingStatus error:', error);
    res.status(500).json({ error: 'Failed to update booking status' });
  }
};

const deleteTourBooking = async (req, res) => {
  try {
    const bookingId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
      return res.status(400).json({ error: 'Invalid booking id' });
    }
    const booking = await TourBooking.findByIdAndDelete(bookingId);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    res.json({ success: true, message: 'Booking deleted' });
  } catch (error) {
    console.error('deleteTourBooking error:', error);
    res.status(500).json({ error: 'Failed to delete booking' });
  }
};

const getAllTourBookings = async (req, res) => {
  try {
    const bookings = await TourBooking.find().populate('tourId').sort({ createdAt: -1 });
    res.json({ success: true, data: bookings });
  } catch (err) {
    console.error('getAllTourBookings error:', err);
    res.status(500).json({ error: 'Failed to fetch tour bookings' });
  }
};

module.exports = { createTour, getTours, updateTour, deleteTour, bookTour, getUserBookings, getUserBookingsGuest, updateTourBookingStatus, deleteTourBooking, getAllTourBookings };
