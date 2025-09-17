// src/Components/UserHome/UHHome/Home.jsx
import React, { useState, useEffect } from 'react';
import { 
  ShoppingBagIcon, 
  StarIcon, 
  TruckIcon, 
  ShieldCheckIcon, 
  LeafIcon, 
  HeartIcon,
  ArrowRightIcon,
  PlayIcon,
  UsersIcon,
  AwardIcon,
  ClockIcon,
  MapPinIcon,
  PhoneIcon,
  MailIcon
} from 'lucide-react'
import Navbar from '../UHNavbar/UHNavbar'
import Footer from '../UHFooter/UHFooter'

const products = [
  { 
    id: 1, 
    name: 'Organic Chicken', 
    category: 'animal', 
    price: 12.99,
    image: 'https://images.unsplash.com/photo-1587595431973-160d0d94add1?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80',
    rating: 4.8,
    reviews: 124
  },
  { 
    id: 2, 
    name: 'Free-range Eggs', 
    category: 'animal', 
    price: 5.99,
    image: 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80',
    rating: 4.9,
    reviews: 89
  },
  { 
    id: 3, 
    name: 'Organic Tomatoes', 
    category: 'plant', 
    price: 4.49,
    image: 'https://images.unsplash.com/photo-1561136594-7f68413baa99?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80',
    rating: 4.7,
    reviews: 76
  },
  { 
    id: 4, 
    name: 'Fresh Lettuce', 
    category: 'plant', 
    price: 3.99,
    image: 'https://images.unsplash.com/photo-1566842600175-97dca3dfc3c7?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80',
    rating: 4.6,
    reviews: 53
  },
  { 
    id: 5, 
    name: 'Grass-fed Beef', 
    category: 'animal', 
    price: 18.99,
    image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80',
    rating: 4.9,
    reviews: 167
  },
  { 
    id: 6, 
    name: 'Organic Potatoes', 
    category: 'plant', 
    price: 6.99,
    image: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80',
    rating: 4.5,
    reviews: 42
  },
  { 
    id: 7, 
    name: 'Fresh Milk', 
    category: 'animal', 
    price: 4.99,
    image: 'https://images.unsplash.com/photo-1566772940193-9c3ae2938d78?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80',
    rating: 4.8,
    reviews: 98
  },
  { 
    id: 8, 
    name: 'Organic Carrots', 
    category: 'plant', 
    price: 3.49,
    image: 'https://images.unsplash.com/photo-1445282768818-728615cc910a?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80',
    rating: 4.7,
    reviews: 65
  },
]

const features = [
  {
    icon: <TruckIcon className="h-8 w-8 text-green-600" />,
    title: "Free Delivery",
    description: "Free delivery on orders over $50"
  },
  {
    icon: <ShieldCheckIcon className="h-8 w-8 text-green-600" />,
    title: "Quality Guarantee",
    description: "100% quality guarantee on all products"
  },
  {
    icon: <LeafIcon className="h-8 w-8 text-green-600" />,
    title: "100% Organic",
    description: "Certified organic farming practices"
  },
  {
    icon: <HeartIcon className="h-8 w-8 text-green-600" />,
    title: "Farm Fresh",
    description: "Harvested fresh daily from our farm"
  }
]

const testimonials = [
  {
    name: "Sarah Johnson",
    location: "San Francisco, CA",
    comment: "The quality of produce from Mount Olive Farm is exceptional. I've been a customer for over 2 years and their organic chicken is the best I've ever tasted!",
    rating: 5,
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80"
  },
  {
    name: "Michael Chen",
    location: "Los Angeles, CA",
    comment: "Their farm-fresh eggs make such a difference in my baking. The yolks are so vibrant and rich. Highly recommend to all home chefs!",
    rating: 5,
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80"
  },
  {
    name: "Emma Rodriguez",
    location: "San Diego, CA",
    comment: "I love that I can trust the quality and source of my food. The vegetables are always fresh and full of flavor. My weekly grocery delivery is something I always look forward to.",
    rating: 5,
    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80"
  }
]

// Dynamic hero features that rotate
const heroFeatures = [
  {
    title: "Farm Fresh Produce",
    description: "Harvested daily and delivered to your doorstep",
    color: "from-green-600 to-green-800",
    image: "https://images.unsplash.com/photo-1500076656116-558758c991c1?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80"
  },
  {
    title: "100% Organic Certified",
    description: "No pesticides, no chemicals, just pure nature",
    color: "from-emerald-600 to-emerald-800",
    image: "https://images.unsplash.com/photo-1574856344991-aaa31b6f4ce3?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80"
  },
  {
    title: "Free Range Animals",
    description: "Ethically raised animals with plenty of space to roam",
    color: "from-teal-600 to-teal-800",
    image: "https://images.unsplash.com/photo-1596733430284-f7437764b1a9?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80"
  },
  {
    title: "Sustainable Farming",
    description: "Environmentally friendly practices for a better planet",
    color: "from-lime-600 to-lime-800",
    image: "https://images.unsplash.com/photo-1464226184884-fa280b87c399?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80"
  },
  {
    title: "Local Community Support",
    description: "Supporting local economy and creating jobs",
    color: "from-amber-600 to-amber-800",
    image: "https://images.unsplash.com/photo-1472653525502-fc569e405a74?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80"
  }
]

const stats = [
  { value: "15+", label: "Years Experience", icon: <AwardIcon className="h-6 w-6" /> },
  { value: "500+", label: "Happy Customers", icon: <UsersIcon className="h-6 w-6" /> },
  { value: "100%", label: "Organic Certified", icon: <LeafIcon className="h-6 w-6" /> },
  { value: "24/7", label: "Customer Support", icon: <ClockIcon className="h-6 w-6" /> }
]

const ProductCard = ({ product }) => (
  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden transition-transform duration-300 hover:scale-105 hover:shadow-xl">
    <div className="relative h-48 overflow-hidden">
      <img 
        src={product.image} 
        alt={product.name}
        className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
      />
      <button className="absolute top-2 right-2 p-1 bg-white rounded-full shadow-md hover:bg-green-50">
        <HeartIcon className="h-5 w-5 text-gray-600 hover:text-green-600" />
      </button>
    </div>
    <div className="p-4">
      <div className="flex items-center mb-1">
        {[...Array(5)].map((_, i) => (
          <StarIcon 
            key={i} 
            className={`h-4 w-4 ${i < Math.floor(product.rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
          />
        ))}
        <span className="text-xs text-gray-500 ml-1">({product.reviews})</span>
      </div>
      <h4 className="font-semibold text-gray-800 dark:text-white mb-1">{product.name}</h4>
      <p className="text-sm text-gray-600 dark:text-gray-300 capitalize mb-2">{product.category} product</p>
      <div className="flex justify-between items-center">
        <span className="text-lg font-bold text-green-700 dark:text-green-400">${product.price}</span>
        <button className="bg-green-600 hover:bg-green-700 text-white py-1 px-3 rounded-full text-sm flex items-center transition-colors">
          <ShoppingBagIcon className="h-4 w-4 mr-1" /> Add
        </button>
      </div>
    </div>
  </div>
)

const TestimonialCard = ({ testimonial }) => (
  <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
    <div className="flex items-center mb-4">
      {[...Array(5)].map((_, i) => (
        <StarIcon 
          key={i} 
          className={`h-5 w-5 ${i < testimonial.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
        />
      ))}
    </div>
    <p className="text-gray-600 dark:text-gray-300 mb-4 italic">"{testimonial.comment}"</p>
    <div className="flex items-center">
      <img src={testimonial.image} alt={testimonial.name} className="h-12 w-12 rounded-full object-cover mr-3" />
      <div>
        <h4 className="font-semibold text-gray-800 dark:text-white">{testimonial.name}</h4>
        <p className="text-sm text-gray-500 dark:text-gray-400">{testimonial.location}</p>
      </div>
    </div>
  </div>
)

const BulkOrderModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl max-w-md w-full">
        <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">Bulk Order Inquiry</h2>
        <p className="text-gray-600 dark:text-gray-300 mb-6">Fill out the form below and our team will contact you within 24 hours to discuss your bulk order needs.</p>
        
        <form className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
            <input type="text" className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
            <input type="email" className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone</label>
            <input type="tel" className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Order Details</label>
            <textarea rows="3" className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"></textarea>
          </div>
          <div className="flex justify-end space-x-3 pt-2">
            <button 
              type="button" 
              onClick={onClose} 
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              Submit Inquiry
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

const Home = () => {
  const [isBulkOrderModalOpen, setIsBulkOrderModalOpen] = useState(false)
  const [currentHeroIndex, setCurrentHeroIndex] = useState(0)
  const animalProducts = products.filter(p => p.category === 'animal')
  const plantProducts = products.filter(p => p.category === 'plant')

  // Set browser tab title
  useEffect(() => {
    document.title = "Home | Mount Olive Farm";
  }, [])

  // Rotate hero features
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentHeroIndex((prevIndex) => 
        prevIndex === heroFeatures.length - 1 ? 0 : prevIndex + 1
      )
    }, 5000) // Change every 5 seconds

    return () => clearInterval(interval)
  }, [])

  const currentHero = heroFeatures[currentHeroIndex]

  return (
    <>
      <Navbar />
      <main className="w-full bg-light-beige dark:bg-gray-900 min-h-screen pt-20">

       {/* Cinematic Hero Section */}
        <section className="relative w-full h-screen overflow-hidden">
          {heroFeatures.map((feature, index) => (
            <div
              key={index}
              className={`absolute top-0 left-0 w-full h-full transition-opacity duration-[1500ms] ${
                index === currentHeroIndex ? "opacity-100 z-20" : "opacity-0 z-0"
              }`}
            >
              <img
                src={feature.image}
                alt={feature.title}
                className="w-full h-full object-cover object-center brightness-90 contrast-125"
              />
              {/* Cinematic gradient overlay */}
              <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-black/40 via-black/20 to-black/70"></div>

              {/* Content */}
              <div className="absolute inset-0 flex flex-col justify-center items-start px-8 md:px-24 lg:px-32 text-white">
                <h1 className="text-4xl md:text-6xl font-extrabold drop-shadow-lg mb-4">
                  {feature.title}
                </h1>
                <p className="text-lg md:text-2xl font-light max-w-xl drop-shadow-md">
                  {feature.description}
                </p>
                <div className="mt-6 flex flex-col sm:flex-row gap-4">
                  <button 
                    onClick={() => setIsBulkOrderModalOpen(true)}
                    className="mt-4 bg-green-600/80 hover:bg-green-700 text-white py-3 px-6 rounded-lg font-semibold shadow-lg backdrop-blur-sm flex items-center transition-colors"
                  >
                    <ShoppingBagIcon className="h-5 w-5 mr-2" /> Shop Bulk Orders
                  </button>
                  <button className="mt-4 border-2 border-white text-white hover:bg-white hover:text-green-700 py-3 px-6 rounded-lg font-semibold flex items-center transition-colors">
                    <PlayIcon className="h-5 w-5 mr-2" /> Our Story
                  </button>
                </div>
              </div>
            </div>
          ))}

          {/* Navigation Dots */}
          <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 flex space-x-3 z-10">
            {heroFeatures.map((_, idx) => (
              <span
                key={idx}
                className={`w-3 h-3 rounded-full cursor-pointer transition-all duration-300 ${
                  idx === currentHeroIndex ? "bg-green-500 scale-125" : "bg-white/40"
                }`}
                onClick={() => setCurrentHeroIndex(idx)}
              ></span>
            ))}
          </div>
        </section>


        {/* Company Stats Section */}
        <section className="py-16 bg-white dark:bg-gray-800">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-4">Why Choose Mount Olive Farm?</h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                For over 15 years, we've been providing the highest quality organic products to families across the country. 
                Our commitment to sustainable farming and animal welfare sets us apart.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {stats.map((stat, index) => (
                <div key={index} className="bg-green-50 dark:bg-gray-700 p-6 rounded-xl text-center">
                  <div className="flex justify-center mb-4 text-green-600 dark:text-green-400">
                    {stat.icon}
                  </div>
                  <h3 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">{stat.value}</h3>
                  <p className="text-gray-600 dark:text-gray-300">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 bg-gray-50 dark:bg-gray-900">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {features.map((feature, index) => (
                <div key={index} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm text-center">
                  <div className="flex justify-center mb-4">
                    {feature.icon}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">{feature.title}</h3>
                  <p className="text-gray-600 dark:text-gray-300">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* About Us Section */}
        <section className="py-16 bg-white dark:bg-gray-800">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-6">Our Story</h2>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  Mount Olive Farm was established in 2008 with a simple mission: to provide fresh, organic, 
                  and sustainably grown products to our local community. What started as a small family operation 
                  has grown into a trusted supplier for households and restaurants across the region.
                </p>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  We believe in farming practices that respect the land, treat animals humanely, and produce 
                  nutritious food without harmful chemicals. Our team of dedicated farmers works tirelessly 
                  to ensure that every product that leaves our farm meets the highest standards of quality.
                </p>
                <div className="flex items-center mt-8 space-x-4">
                  <div className="flex items-center text-gray-600 dark:text-gray-300">
                    <MapPinIcon className="h-5 w-5 mr-2 text-green-600" />
                    <span>123 Farm Road, Countryside, CA 94501</span>
                  </div>
                  <div className="flex items-center text-gray-600 dark:text-gray-300">
                    <PhoneIcon className="h-5 w-5 mr-2 text-green-600" />
                    <span>(555) 123-4567</span>
                  </div>
                </div>
                <div className="flex items-center mt-2">
                  <MailIcon className="h-5 w-5 mr-2 text-green-600" />
                  <span className="text-gray-600 dark:text-gray-300">info@mountolivefarm.com</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <img 
                  src="https://images.unsplash.com/photo-1625246335525-f887826e9529?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80" 
                  alt="Farm landscape" 
                  className="rounded-lg shadow-md h-64 w-full object-cover"
                />
                <img 
                  src="https://images.unsplash.com/photo-1620654458539-b4c186f32a32?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80" 
                  alt="Farmers working" 
                  className="rounded-lg shadow-md h-64 w-full object-cover mt-8"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Animal Products Section */}
        <section className="py-16 container mx-auto px-4">
          <div className="flex justify-between items-center mb-10">
            <h2 className="text-3xl font-bold text-gray-800 dark:text-white">Animal Products</h2>
            <button className="text-green-600 hover:text-green-700 flex items-center font-semibold">
              View All <ArrowRightIcon className="h-4 w-4 ml-1" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {animalProducts.map(product => <ProductCard key={product.id} product={product} />)}
          </div>
        </section>

        {/* Plant Products Section */}
        <section className="py-16 container mx-auto px-4">
          <div className="flex justify-between items-center mb-10">
            <h2 className="text-3xl font-bold text-gray-800 dark:text-white">Plant Products</h2>
            <button className="text-green-600 hover:text-green-700 flex items-center font-semibold">
              View All <ArrowRightIcon className="h-4 w-4 ml-1" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {plantProducts.map(product => <ProductCard key={product.id} product={product} />)}
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-16 bg-green-50 dark:bg-gray-800">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center text-gray-800 dark:text-white mb-12">What Our Customers Say</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {testimonials.map((testimonial, index) => (
                <TestimonialCard key={index} testimonial={testimonial} />
              ))}
            </div>
          </div>
        </section>

        <BulkOrderModal isOpen={isBulkOrderModalOpen} onClose={() => setIsBulkOrderModalOpen(false)} />
      </main>
      <Footer />
    </>
  )
}

export default Home