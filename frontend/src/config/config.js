// API Configuration
export const API_URL = process.env.REACT_APP_API_URL;
export const BACKEND_URL = API_URL.replace('/api', '');

// Authentication
export const JWT_SECRET = process.env.REACT_APP_JWT_SECRET;
export const JWT_EXPIRY = process.env.REACT_APP_JWT_EXPIRY;

// Cloudinary Configuration
export const CLOUDINARY_URL = process.env.REACT_APP_CLOUDINARY_URL;
export const CLOUDINARY_UPLOAD_PRESET = process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET;

// Stripe Configuration
export const STRIPE_PUBLISHABLE_KEY = process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY;
