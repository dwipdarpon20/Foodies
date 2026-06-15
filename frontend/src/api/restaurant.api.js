import api from './api.config';

export const getAllRestaurants = async () => {
    try {
        const response = await api.get('/restaurants');
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const searchRestaurants = async (params) => {
    try {
        const response = await api.get('/restaurants/search', { params });
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const getRestaurantById = async (id) => {
    try {
        const response = await api.get(`/restaurants/${id}`);
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const getRestaurantDashboard = async () => {
    try {
        const response = await api.get('/restaurants/dashboard');
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const updateRestaurant = async (id, data) => {
    try {
        const response = await api.patch(`/restaurants/${id}`, data);
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const deleteRestaurant = async (id) => {
    try {
        const response = await api.delete(`/restaurants/${id}`);
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const createRestaurant = async (data) => {
    try {
        const formData = new FormData();
        
        // Append all restaurant data
        Object.keys(data).forEach(key => {
            if (key === 'image' && data[key] instanceof File) {
                formData.append('image', data[key]);
            } else if (typeof data[key] === 'object') {
                formData.append(key, JSON.stringify(data[key]));
            } else {
                formData.append(key, data[key]);
            }
        });

        const response = await api.post('/restaurants', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    } catch (error) {
        throw error;
    }
};
