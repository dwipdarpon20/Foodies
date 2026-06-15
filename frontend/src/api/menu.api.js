import api from './api.config';

export const menuAPI = {
  // Get all menu items for a restaurant
  getItems: async (restaurantId) => {
    try {
      const endpoint = `/restaurants/${restaurantId}/menu`;
     
      const response = await api.get(endpoint);
      
      
      if (response.data) {
       
        return response.data;
      } else {
        console.warn('Menu API: No data in response');
        throw new Error('No data received from server');
      }
    } catch (error) {
      console.error('Menu API: Error getting menu items:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        endpoint: `/restaurants/${restaurantId}/menu`,
        config: error.config
      });
      throw error;
    }
  },

  // Create a new menu item
  createItem: async (restaurantId, menuItemData) => {
    try {
      const endpoint = `/restaurants/${restaurantId}/menu`;
      
      
      const response = await api.post(endpoint, menuItemData);
      
      if (response.data) {
        return response.data;
      } else {
        console.warn('Menu API: No data in response');
        throw new Error('No data received from server');
      }
    } catch (error) {
      console.error('Menu API: Error creating menu item:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        endpoint: `/restaurants/${restaurantId}/menu`,
        config: error.config
      });
      throw error;
    }
  },

  // Update a menu item
  updateItem: async (restaurantId, itemId, menuItemData) => {
    try {
      if (!itemId) {
        throw new Error('Menu item ID is required for update');
      }
      
      const endpoint = `/restaurants/${restaurantId}/menu/${itemId}`;
      
      const response = await api.patch(endpoint, menuItemData);
      
      if (response.data) {
        return response.data;
      }
      
      // If no data but successful status, return success
      if (response.status >= 200 && response.status < 300) {
        return { status: 'success' };
      }
      
      throw new Error('Unexpected response from server');
    } catch (error) {
      console.error('Menu API: Error updating menu item:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        endpoint: `/restaurants/${restaurantId}/menu/${itemId}`,
        config: error.config
      });
      throw error;
    }
  },

  // Delete a menu item
  deleteItem: async (restaurantId, itemId) => {
    try {
      const endpoint = `/restaurants/${restaurantId}/menu/${itemId}`;
      
      const response = await api.delete(endpoint);
      
      // For DELETE requests, a 204 response is success with no content
      if (response.status === 204) {
        return { status: 'success' };
      }
      
      // For other successful responses, return the data
      if (response.data) {
        return response.data;
      }
      
      throw new Error('Unexpected response from server');
    } catch (error) {
      console.error('Menu API: Error deleting menu item:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        endpoint: `/restaurants/${restaurantId}/menu/${itemId}`,
        config: error.config
      });
      throw error;
    }
  }
};

export default menuAPI;
