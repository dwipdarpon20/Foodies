import { API_URL } from '../config/config';

export const getImageUrl = (imagePath) => {
    if (!imagePath) return 'https://via.placeholder.com/400x300';
    if (imagePath.startsWith('http')) return imagePath;
    
    // Remove /api from the API_URL and append the image path
    const baseUrl = API_URL.replace('/api', '');
    return `${baseUrl}${imagePath}`;
};
