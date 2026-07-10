const Tour = require('../models/Tour');

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

module.exports = { createTour, getTours, updateTour, deleteTour };
