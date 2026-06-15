import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { getRestaurantById } from '../../api/restaurant.api';
import customerMenuAPI from '../../api/customer.menu.api';
import { useCart } from '../../context/CartContext';
import { orderAPI, paymentAPI } from '../../services/api';
import PaymentForm from '../../components/payment/PaymentForm';

const RestaurantDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [restaurant, setRestaurant] = useState(null);
    const [menuItems, setMenuItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [menuLoading, setMenuLoading] = useState(true);
    const [menuError, setMenuError] = useState(null);
    const [activeTab, setActiveTab] = useState('menu');
    const [reviews, setReviews] = useState([]);
    const [createdOrder, setCreatedOrder] = useState(null);
    const [showPaymentForm, setShowPaymentForm] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const { cart, addToCart, removeFromCart, updateQuantity, setCart } = useCart();

    useEffect(() => {
        fetchRestaurantAndMenu();
        fetchReviews();
    }, [id]);

    useEffect(() => {
        console.log('createdOrder state changed:', createdOrder);
    }, [createdOrder]);

    useEffect(() => {
        console.log('showPaymentForm state changed:', showPaymentForm);
    }, [showPaymentForm]);

    const fetchRestaurantAndMenu = async () => {
        try {
            setLoading(true);
            setMenuLoading(true);
            setMenuError(null);
            
            // First fetch restaurant details
            const restaurantRes = await getRestaurantById(id);
            setRestaurant(restaurantRes.data.restaurant);
            
            // Then fetch menu items using customer API
            try {
                const menuRes = await customerMenuAPI.getRestaurantMenu(id);
                
                // Check if menuRes.data is an array (backward compatibility)
                const menuItems = Array.isArray(menuRes.data) 
                    ? menuRes.data 
                    : (menuRes.data?.menuItems || []);
                
                if (menuItems.length > 0) {
                    setMenuItems(menuItems);
                } else {
                    setMenuItems([]);
                    setMenuError('No menu items available');
                }
            } catch (menuError) {
                console.error('Error fetching menu items:', menuError);
                setMenuError('Failed to load menu items. Please try again later.');
                toast.error('Failed to load menu items');
            }
        } catch (error) {
            console.error('Error fetching restaurant details:', error);
            toast.error('Failed to load restaurant details');
        } finally {
            setLoading(false);
            setMenuLoading(false);
        }
    };

    const fetchReviews = async () => {
        try {
            // TODO: Implement API call to fetch reviews
            setReviews([
                { id: 1, user: 'John D.', rating: 4, comment: 'Great food and service!' },
                { id: 2, user: 'Sarah M.', rating: 5, comment: 'Best restaurant in town!' }
            ]);
        } catch (error) {
            console.error('Error fetching reviews:', error);
        }
    };

    const getFormattedLocation = (restaurant) => {
        if (restaurant.address) {
            return `${restaurant.address.street}, ${restaurant.address.city}`;
        }
        if (typeof restaurant.location === 'string') {
            return restaurant.location;
        }
        if (restaurant.location && restaurant.location.coordinates) {
            return `${restaurant.location.coordinates[1]}, ${restaurant.location.coordinates[0]}`;
        }
        return 'Location not available';
    };

    const placeOrder = async () => {
        if (cart.length === 0) {
            toast.error('Your cart is empty');
            return;
        }

        try {
            // Format order request data
            const orderRequestData = {
                restaurant: restaurant._id,
                items: cart.map(item => ({
                    menuItem: item._id,
                    quantity: item.quantity,
                    specialInstructions: item.specialInstructions || ''
                })),
                deliveryAddress: {
                    street: '789 Customer St',  // TODO: Get from user input
                    city: 'New York',
                    state: 'NY',
                    zipCode: '10003',
                    country: 'USA'
                },
                paymentMethod: 'card'  // TODO: Get from user input
            };

            // Create order first
            const orderResponse = await orderAPI.create(orderRequestData);

            const createdOrderData = orderResponse?.data?.data?.order;

            if (!createdOrderData?._id) {
                console.error('Invalid order response structure:', orderResponse);
                throw new Error('Invalid order response - missing order ID');
            }
            setCreatedOrder(createdOrderData);
            setShowPaymentForm(true);
            
        } catch (error) {
            console.error('Error placing order:', error);
            toast.error(error.response?.data?.message || 'Failed to place order. Please try again.');
        }
    };

    const handlePaymentSuccess = async (paymentIntent) => {
        toast.success('Order placed and payment processed successfully!');
        setCart([]); // Clear cart after successful order
        setShowPaymentForm(false);
        setCreatedOrder(null);
    };

    const handlePaymentCancel = async () => {
        if (createdOrder?._id) {
            try {
                await orderAPI.cancel(createdOrder._id);
                toast.success('Order cancelled');
            } catch (error) {
                console.error('Error canceling order:', error);
                toast.error('Failed to cancel order');
            }
        }
        setShowPaymentForm(false);
        setCreatedOrder(null);
    };

    const renderPaymentForm = () => {
        
        if (!showPaymentForm || !createdOrder) {
            return null;
        }

        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-lg p-6 max-w-md w-full">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold">Complete Payment</h2>
                        <button
                            onClick={handlePaymentCancel}
                            className="text-gray-500 hover:text-gray-700"
                        >
                            ×
                        </button>
                    </div>
                    <div className="mb-4">
                        <p className="text-sm text-gray-600">Order ID: {createdOrder._id}</p>
                        <p className="text-sm text-gray-600">Total: ${createdOrder.total?.toFixed(2)}</p>
                    </div>
                    <PaymentForm
                        orderId={createdOrder._id}
                        amount={createdOrder.total}
                        onSuccess={handlePaymentSuccess}
                    />
                </div>
            </div>
        );
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
            </div>
        );
    }

    if (!restaurant) {
        return <div className="text-center py-8">Restaurant not found</div>;
    }

    return (
        <div className="container mx-auto px-4 py-8">
            {/* Restaurant Header */}
            <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
                <h1 className="text-3xl font-bold mb-2">{restaurant.name}</h1>
                <div className="flex items-center gap-4 text-gray-600 mb-4">
                    <span>📍 {getFormattedLocation(restaurant)}</span>
                    <span>⭐ {restaurant.rating || '4.5'} ({restaurant.reviewCount || '50'} reviews)</span>
                    <span>🕒 {restaurant.timing || '10:00 AM - 10:00 PM'}</span>
                </div>
                <p className="text-gray-600">{restaurant.description}</p>
            </div>

            {/* Navigation Tabs */}
            <div className="flex gap-4 mb-6 border-b">
                <button 
                    className={`px-4 py-2 ${activeTab === 'menu' ? 'border-b-2 border-primary text-primary' : 'text-gray-600'}`}
                    onClick={() => setActiveTab('menu')}
                >
                    Menu
                </button>
                <button 
                    className={`px-4 py-2 ${activeTab === 'reviews' ? 'border-b-2 border-primary text-primary' : 'text-gray-600'}`}
                    onClick={() => setActiveTab('reviews')}
                >
                    Reviews
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Main Content Section */}
                <div className="md:col-span-2">
                    {activeTab === 'menu' && (
                        <div className="space-y-6">
                            {menuLoading ? (
                                <div className="flex justify-center items-center py-8">
                                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-900"></div>
                                </div>
                            ) : menuError ? (
                                <div className="text-center py-8 text-red-500">
                                    {menuError}
                                    <button 
                                        onClick={fetchRestaurantAndMenu}
                                        className="block mx-auto mt-4 text-primary hover:text-primary-dark"
                                    >
                                        Try Again
                                    </button>
                                </div>
                            ) : menuItems.length > 0 ? (
                                <div className="grid gap-6">
                                    {/* Group items by category if available */}
                                    {Object.entries(menuItems.reduce((categories, item) => {
                                        const category = item.category || 'Other';
                                        if (!categories[category]) {
                                            categories[category] = [];
                                        }
                                        categories[category].push(item);
                                        return categories;
                                    }, {})).map(([category, items]) => (
                                        <div key={category}>
                                            <h2 className="text-xl font-semibold mb-4">{category}</h2>
                                            <div className="grid gap-4">
                                                {items.map((item) => (
                                                    <div key={item._id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden">
                                                        <div className="flex">
                                                            {item.image && (
                                                                <div className="relative w-32 h-32 flex-shrink-0">
                                                                    <img 
                                                                        src={item.image} 
                                                                        alt={item.name}
                                                                        className="w-full h-full object-cover"
                                                                        onError={(e) => {
                                                                            e.target.src = '/default-food.jpg';
                                                                            e.target.onerror = null;
                                                                        }}
                                                                    />
                                                                    {item.discount > 0 && (
                                                                        <div className="absolute top-0 right-0 bg-red-500 text-white px-2 py-1 m-1 rounded-md text-xs font-semibold">
                                                                            {item.discount}% OFF
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}
                                                            <div className="flex-1 p-4">
                                                                <div className="flex justify-between items-start mb-2">
                                                                    <h3 className="text-xl font-semibold text-gray-800">{item.name}</h3>
                                                                    <span className="text-lg font-bold text-primary">₹{item.price}</span>
                                                                </div>
                                                                
                                                                <p className="text-gray-600 text-sm mb-3 line-clamp-2">{item.description || 'No description available'}</p>
                                                                
                                                                <div className="flex flex-wrap gap-2 mb-3">
                                                                    {item.isVegetarian && (
                                                                        <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full flex items-center">
                                                                            <span className="mr-1">🥬</span>
                                                                            Veg
                                                                        </span>
                                                                    )}
                                                                    {item.spicyLevel > 0 && (
                                                                        <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full flex items-center">
                                                                            <span className="mr-1">{"🌶️".repeat(Math.min(item.spicyLevel, 3))}</span>
                                                                            Spicy
                                                                        </span>
                                                                    )}
                                                                    {item.isGlutenFree && (
                                                                        <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full flex items-center">
                                                                            <span className="mr-1">🌾</span>
                                                                            Gluten-Free
                                                                        </span>
                                                                    )}
                                                                </div>

                                                                <div className="flex justify-end mb-2">
                                                                    <button
                                                                        onClick={() => addToCart(item, restaurant._id)}
                                                                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg transition-colors duration-200 flex items-center gap-2"
                                                                    >
                                                                        <span>Add</span>
                                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                                            <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
                                                                        </svg>
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="text-center border-t py-2">
                                                            <button
                                                                onClick={() => setSelectedItem(item)}
                                                                className="text-sm text-indigo-600 hover:text-indigo-800 transition-colors duration-200"
                                                            >
                                                                More Info
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-center text-gray-600 py-8">No menu items available</p>
                            )}
                        </div>
                    )}

                    {activeTab === 'reviews' && (
                        <div className="space-y-4">
                            {reviews.map((review) => (
                                <div key={review.id} className="bg-white rounded-lg shadow p-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="font-semibold">{review.user}</span>
                                        <div className="flex items-center">
                                            {[...Array(5)].map((_, i) => (
                                                <span key={i} className={i < review.rating ? 'text-yellow-400' : 'text-gray-300'}>
                                                    ★
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                    <p className="text-gray-600">{review.comment}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Cart Section */}
                <div className="bg-white rounded-lg shadow-lg p-4 h-fit sticky top-4">
                    <h2 className="text-2xl font-bold mb-4">Your Cart</h2>
                    {cart.length === 0 ? (
                        <p className="text-gray-600">Your cart is empty</p>
                    ) : (
                        <>
                            <div className="space-y-4 mb-4">
                                {cart.map((item) => (
                                    <div key={item._id} className="flex justify-between items-center">
                                        <div>
                                            <h3 className="font-semibold">{item.name}</h3>
                                            <p className="text-gray-600">₹{item.price} x {item.quantity}</p>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <button
                                                onClick={() => updateQuantity(item._id, item.quantity - 1)}
                                                className="bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded"
                                            >
                                                -
                                            </button>
                                            <span>{item.quantity}</span>
                                            <button
                                                onClick={() => updateQuantity(item._id, item.quantity + 1)}
                                                className="bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded"
                                            >
                                                +
                                            </button>
                                            <button
                                                onClick={() => removeFromCart(item._id)}
                                                className="text-red-500 hover:text-red-600"
                                            >
                                                ×
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="border-t pt-4">
                                <div className="flex justify-between mb-4">
                                    <span className="font-semibold">Total:</span>
                                    <span className="font-semibold">₹{cart.reduce((total, item) => total + (item.price * item.quantity), 0).toFixed(2)}</span>
                                </div>
                                <button
                                    onClick={() => navigate('/cart')}
                                    className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition-colors"
                                >
                                    Go to Cart
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Add payment form modal */}
            {renderPaymentForm()}

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
                                    {selectedItem.discount > 0 && (
                                        <div>
                                            <p className="text-sm font-medium text-gray-500">Discount</p>
                                            <p className="mt-1">{selectedItem.discount}%</p>
                                        </div>
                                    )}
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
                            {selectedItem.spicyLevel > 0 && (
                                <div>
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">Spicy Level</h3>
                                    <div className="flex items-center space-x-1">
                                        {[...Array(5)].map((_, index) => (
                                            <span
                                                key={index}
                                                className={`text-2xl ${
                                                    index < selectedItem.spicyLevel ? 'text-red-500' : 'text-gray-300'
                                                }`}
                                            >
                                                🌶️
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

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
                                Object.values(selectedItem.nutritionalInfo).some(value => value) && (
                                    <div>
                                        <h3 className="text-lg font-medium text-gray-900 mb-2">Nutritional Information</h3>
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                            {selectedItem.nutritionalInfo.calories && (
                                                <div>
                                                    <p className="text-sm font-medium text-gray-500">Calories</p>
                                                    <p className="mt-1">{selectedItem.nutritionalInfo.calories}</p>
                                                </div>
                                            )}
                                            {selectedItem.nutritionalInfo.protein && (
                                                <div>
                                                    <p className="text-sm font-medium text-gray-500">Protein</p>
                                                    <p className="mt-1">{selectedItem.nutritionalInfo.protein}g</p>
                                                </div>
                                            )}
                                            {selectedItem.nutritionalInfo.carbohydrates && (
                                                <div>
                                                    <p className="text-sm font-medium text-gray-500">Carbohydrates</p>
                                                    <p className="mt-1">{selectedItem.nutritionalInfo.carbohydrates}g</p>
                                                </div>
                                            )}
                                            {selectedItem.nutritionalInfo.fats && (
                                                <div>
                                                    <p className="text-sm font-medium text-gray-500">Fats</p>
                                                    <p className="mt-1">{selectedItem.nutritionalInfo.fats}g</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RestaurantDetails;
