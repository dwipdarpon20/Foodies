import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { menuAPI } from '../../api/menu.api';
import { toast } from 'react-hot-toast';
import RestaurantSelector from '../../components/restaurant/RestaurantSelector';
import MenuForm from '../../components/restaurant/MenuForm';

const MenuManagement = () => {
  const { user } = useAuth();
  const [restaurantId, setRestaurantId] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedItem, setSelectedItem] = useState(null);

  // Memoize the handleRestaurantSelect function to prevent unnecessary re-renders
  const handleRestaurantSelect = useCallback((id) => {
    if (id) {
      setRestaurantId(id);
      // Don't clear menu items here, let the useEffect handle it
    }
  }, []);

  // Fetch menu items when restaurantId changes
  useEffect(() => {
    if (restaurantId) {
      fetchMenuItems();
    }
  }, [restaurantId]); // Only depend on restaurantId

  const fetchMenuItems = async () => {
    if (!restaurantId) {
      return;
    }
    
    try {
      setLoading(true);
      const response = await menuAPI.getItems(restaurantId);
      
      if (response?.status === 'success' && Array.isArray(response?.data?.menuItems)) {
        setMenuItems(response.data.menuItems);
      } else {
        console.warn('Unexpected response structure:', response);
        setMenuItems([]);
      }
    } catch (error) {
      console.error('Error fetching menu items:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      toast.error('Failed to load menu items. Please try again.');
      setMenuItems([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = async (menuItemData) => {
    if (!restaurantId) {
      toast.error('Please select a restaurant first');
      return;
    }

    try {
      
      // The menu item has already been created by the form
      // Just update the UI
      setShowAddForm(false);
      await fetchMenuItems(); // Refresh the menu items list
    } catch (error) {
      console.error('MenuManagement: Error handling menu item:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
    }
  };

  const handleUpdateItem = async (menuItemData) => {
    if (!restaurantId) {
      toast.error('Please select a restaurant first');
      return;
    }

    try {
      
      // The menu item has already been updated by the form
      // Just update the UI
      setEditingItem(null);
      await fetchMenuItems(); // Refresh the menu items list
    } catch (error) {
      console.error('MenuManagement: Error handling menu item update:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
    }
  };

  const handleDeleteItem = async (itemId) => {
    try {
      await menuAPI.deleteItem(restaurantId, itemId);
      toast.success('Menu item deleted successfully');
      await fetchMenuItems(); // Refresh the menu items list
    } catch (error) {
      console.error('Error deleting menu item:', error);
      toast.error(error.response?.data?.message || 'Failed to delete menu item');
    }
  };

  // Memoize filteredMenuItems to prevent unnecessary recalculations
  const filteredMenuItems = useMemo(() => {
    if (!Array.isArray(menuItems)) {
      console.warn('menuItems is not an array:', menuItems);
      return [];
    }
    return selectedCategory === 'all'
      ? menuItems
      : menuItems.filter(item => 
          item.category && item.category.toLowerCase() === selectedCategory.toLowerCase()
        );
  }, [menuItems, selectedCategory]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <RestaurantSelector onRestaurantSelect={handleRestaurantSelect} />
      
      {restaurantId && (
        <>
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Menu Management</h1>
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Add Menu Item
            </button>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Category
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            >
              <option value="all">All Categories</option>
              <option value="appetizers">Appetizers</option>
              <option value="main-course">Main Course</option>
              <option value="desserts">Desserts</option>
              <option value="beverages">Beverages</option>
              <option value="sides">Sides</option>
            </select>
          </div>

          {showAddForm && (
            <MenuForm
              onSubmit={handleAddItem}
              onCancel={() => setShowAddForm(false)}
              restaurantId={restaurantId}
            />
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.isArray(filteredMenuItems) && filteredMenuItems.length > 0 ? (
              filteredMenuItems.map((item) => (
                <div
                  key={item._id}
                  className="bg-white rounded-lg shadow-md p-6"
                >
                  {editingItem && editingItem._id === item._id ? (
                    <MenuForm
                      initialData={item}
                      onSubmit={handleUpdateItem}
                      onCancel={() => setEditingItem(null)}
                      restaurantId={restaurantId}
                      editingItem={item}
                    />
                  ) : (
                    <>
                      <h3 className="text-lg font-semibold mb-2">{item.name}</h3>
                      <p className="text-gray-600 mb-2">{item.description || 'No description available'}</p>
                      <p className="text-gray-800 font-medium mb-2">${item.price}</p>
                      <p className="text-sm text-gray-500 mb-4">
                        Category: {item.category || 'Uncategorized'}
                      </p>
                      <div className="flex justify-between items-center space-x-2">
                        <button
                          onClick={() => setSelectedItem(item)}
                          className="text-indigo-500 hover:text-indigo-600"
                        >
                          More Info
                        </button>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => setEditingItem(item)}
                            className="text-blue-500 hover:text-blue-600"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteItem(item._id)}
                            className="text-red-500 hover:text-red-600"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ))
            ) : (
              <div className="col-span-3 text-center text-gray-500">
                No menu items found. {selectedCategory !== 'all' && 'Try changing the category filter or '} 
                Click "Add Menu Item" to create one.
              </div>
            )}
          </div>

          {/* Item Details Modal */}
          {selectedItem && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-2xl font-bold text-gray-900">{selectedItem.name}</h2>
                  <button
                    onClick={() => setSelectedItem(null)}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Basic Info */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Basic Information</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Price</p>
                        <p className="mt-1">${selectedItem.price}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Category</p>
                        <p className="mt-1">{selectedItem.category}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Preparation Time</p>
                        <p className="mt-1">{selectedItem.preparationTime} minutes</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Discount</p>
                        <p className="mt-1">{selectedItem.discount}%</p>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Description</h3>
                    <p className="text-gray-600">{selectedItem.description || 'No description available'}</p>
                  </div>

                  {/* Dietary Information */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Dietary Information</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center">
                        <span className={`mr-2 ${selectedItem.isVegetarian ? 'text-green-500' : 'text-gray-400'}`}>
                          {selectedItem.isVegetarian ? '✓' : '✗'}
                        </span>
                        <span>Vegetarian</span>
                      </div>
                      <div className="flex items-center">
                        <span className={`mr-2 ${selectedItem.isVegan ? 'text-green-500' : 'text-gray-400'}`}>
                          {selectedItem.isVegan ? '✓' : '✗'}
                        </span>
                        <span>Vegan</span>
                      </div>
                      <div className="flex items-center">
                        <span className={`mr-2 ${selectedItem.isGlutenFree ? 'text-green-500' : 'text-gray-400'}`}>
                          {selectedItem.isGlutenFree ? '✓' : '✗'}
                        </span>
                        <span>Gluten Free</span>
                      </div>
                    </div>
                  </div>

                  {/* Spicy Level */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Spicy Level</h3>
                    <div className="flex items-center space-x-1">
                      {[...Array(5)].map((_, index) => (
                        <svg
                          key={index}
                          className={`h-5 w-5 ${
                            index < selectedItem.spicyLevel ? 'text-red-500' : 'text-gray-300'
                          }`}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm0-2a6 6 0 100-12 6 6 0 000 12z" clipRule="evenodd" />
                        </svg>
                      ))}
                    </div>
                  </div>

                  {/* Ingredients */}
                  {selectedItem.ingredients && selectedItem.ingredients.length > 0 && (
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Ingredients</h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedItem.ingredients.map((ingredient, index) => (
                          <span
                            key={index}
                            className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-sm"
                          >
                            {ingredient}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Allergens */}
                  {selectedItem.allergens && selectedItem.allergens.length > 0 && (
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Allergens</h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedItem.allergens.map((allergen, index) => (
                          <span
                            key={index}
                            className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-sm"
                          >
                            {allergen}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Nutritional Information */}
                  {selectedItem.nutritionalInfo && (
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Nutritional Information</h3>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div>
                          <p className="text-sm font-medium text-gray-500">Calories</p>
                          <p className="mt-1">{selectedItem.nutritionalInfo.calories || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">Protein</p>
                          <p className="mt-1">{selectedItem.nutritionalInfo.protein || 'N/A'}g</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">Carbohydrates</p>
                          <p className="mt-1">{selectedItem.nutritionalInfo.carbohydrates || 'N/A'}g</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">Fats</p>
                          <p className="mt-1">{selectedItem.nutritionalInfo.fats || 'N/A'}g</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Status Information */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Status</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center">
                        <span className={`mr-2 ${selectedItem.isAvailable ? 'text-green-500' : 'text-red-500'}`}>
                          {selectedItem.isAvailable ? '✓' : '✗'}
                        </span>
                        <span>Available</span>
                      </div>
                      <div className="flex items-center">
                        <span className={`mr-2 ${selectedItem.isPopular ? 'text-yellow-500' : 'text-gray-400'}`}>
                          {selectedItem.isPopular ? '★' : '☆'}
                        </span>
                        <span>Popular</span>
                      </div>
                      <div className="flex items-center">
                        <span className={`mr-2 ${selectedItem.isSpecial ? 'text-purple-500' : 'text-gray-400'}`}>
                          {selectedItem.isSpecial ? '✦' : '✧'}
                        </span>
                        <span>Special</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default MenuManagement;
