// src/Components/UserHome/UHFooter/UHFooter.jsx
import React from 'react'
import { 
  MapPinIcon, 
  PhoneIcon, 
  MailIcon, 
  Facebook, 
  Instagram, 
  Twitter, 
  Youtube,
  Heart,
  ArrowRight,
  Leaf
} from 'lucide-react'

const UHFooter = () => {
  return (
    <>
      {/* Enhanced Newsletter Section */}
      <section className="relative py-16 bg-gradient-to-r from-green-600 to-green-700 dark:from-gray-800 dark:to-gray-900 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-10">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <pattern id="leaves" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M0,0 L20,0 L20,20 Z" fill="white" opacity="0.2"/>
              <path d="M0,0 L0,20 L20,20 Z" fill="white" opacity="0.2"/>
            </pattern>
            <rect x="0" y="0" width="100" height="100" fill="url(#leaves)" />
          </svg>
        </div>
        
        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="max-w-3xl mx-auto bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-2xl transform transition-all hover:shadow-xl">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full mb-6">
              <MailIcon className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            
            <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-4">Stay Updated with Our Farm</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
              Subscribe to our newsletter to receive updates on new products, special offers, and exclusive farming tips directly to your inbox.
            </p>
            
            <form className="max-w-md mx-auto flex flex-col sm:flex-row gap-3">
              <div className="relative flex-grow">
                <input 
                  type="email" 
                  placeholder="Your email address" 
                  required
                  className="w-full px-5 py-4 rounded-xl focus:ring-2 focus:ring-green-500 focus:outline-none border border-gray-300 dark:border-gray-700 dark:bg-gray-700 dark:text-white shadow-sm"
                />
              </div>
              <button 
                type="submit" 
                className="bg-green-600 text-white font-semibold px-6 py-4 rounded-xl hover:bg-green-700 transition-colors flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
              >
                Subscribe <ArrowRight className="h-5 w-5" />
              </button>
            </form>
            
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
              We respect your privacy. Unsubscribe at any time.
            </p>
          </div>
        </div>
      </section>

      {/* Enhanced Footer */}
      <footer className="bg-gradient-to-b from-green-800 to-green-900 dark:from-gray-900 dark:to-black text-white pt-16 pb-8">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
            {/* Brand Section */}
            <div className="lg:col-span-1">
              <div className="flex items-center mb-5">
                <Leaf className="h-8 w-8 text-green-300 mr-2" />
                <span className="text-2xl font-bold">Mount Olive Farm</span>
              </div>
              <p className="text-green-200 dark:text-green-300 mb-6 max-w-xs">
                Growing organic, sustainable produce with love and care for over 20 years.
              </p>
              <div className="flex space-x-4">
                <a href="https://www.facebook.com/" className="bg-green-700 hover:bg-green-600 p-3 rounded-full transition-all duration-300">
                  <Facebook className="h-5 w-5" />
                </a>
                <a href="https://www.instagram.com/?hl=en" className="bg-green-700 hover:bg-green-600 p-3 rounded-full transition-all duration-300">
                  <Instagram className="h-5 w-5" />
                </a>
                <a href="https://x.com/" className="bg-green-700 hover:bg-green-600 p-3 rounded-full transition-all duration-300">
                  <Twitter className="h-5 w-5" />
                </a>
                <a href="https://www.youtube.com/" className="bg-green-700 hover:bg-green-600 p-3 rounded-full transition-all duration-300">
                  <Youtube className="h-5 w-5" />
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-xl font-semibold mb-6 pb-2 border-b border-green-700 dark:border-green-800">Quick Links</h3>
              <ul className="space-y-3">
                <li><a href="#" className="text-green-200 hover:text-white flex items-center transition-all duration-300"><ArrowRight className="h-4 w-4 mr-2" /> Home</a></li>
                <li><a href="#" className="text-green-200 hover:text-white flex items-center transition-all duration-300"><ArrowRight className="h-4 w-4 mr-2" /> Shop</a></li>
                <li><a href="#" className="text-green-200 hover:text-white flex items-center transition-all duration-300"><ArrowRight className="h-4 w-4 mr-2" /> About Us</a></li>
                <li><a href="#" className="text-green-200 hover:text-white flex items-center transition-all duration-300"><ArrowRight className="h-4 w-4 mr-2" /> Farm Tours</a></li>
                <li><a href="#" className="text-green-200 hover:text-white flex items-center transition-all duration-300"><ArrowRight className="h-4 w-4 mr-2" /> Recipes</a></li>
                <li><a href="#" className="text-green-200 hover:text-white flex items-center transition-all duration-300"><ArrowRight className="h-4 w-4 mr-2" /> Contact</a></li>
              </ul>
            </div>

            {/* Products */}
            <div>
              <h3 className="text-xl font-semibold mb-6 pb-2 border-b border-green-700 dark:border-green-800">Our Products</h3>
              <ul className="space-y-3">
                <li><a href="#" className="text-green-200 hover:text-white flex items-center transition-all duration-300"><ArrowRight className="h-4 w-4 mr-2" /> Fresh Vegetables</a></li>
                <li><a href="#" className="text-green-200 hover:text-white flex items-center transition-all duration-300"><ArrowRight className="h-4 w-4 mr-2" /> Organic Fruits</a></li>
                <li><a href="#" className="text-green-200 hover:text-white flex items-center transition-all duration-300"><ArrowRight className="h-4 w-4 mr-2" /> Farm Dairy</a></li>
                <li><a href="#" className="text-green-200 hover:text-white flex items-center transition-all duration-300"><ArrowRight className="h-4 w-4 mr-2" /> Honey & Jams</a></li>
                <li><a href="#" className="text-green-200 hover:text-white flex items-center transition-all duration-300"><ArrowRight className="h-4 w-4 mr-2" /> Seasonal Specials</a></li>
                <li><a href="#" className="text-green-200 hover:text-white flex items-center transition-all duration-300"><ArrowRight className="h-4 w-4 mr-2" /> Gift Baskets</a></li>
              </ul>
            </div>

            {/* Contact Info */}
            <div>
              <h3 className="text-xl font-semibold mb-6 pb-2 border-b border-green-700 dark:border-green-800">Contact Us</h3>
              <ul className="space-y-4">
                <li className="flex items-start">
                  <MapPinIcon className="h-5 w-5 mr-3 mt-0.5 text-green-300 dark:text-green-400 flex-shrink-0" />
                  <span>123 Farm Road, Mount Olive, CA 90210</span>
                </li>
                <li className="flex items-center">
                  <PhoneIcon className="h-5 w-5 mr-3 text-green-300 dark:text-green-400 flex-shrink-0" />
                  <span>(555) 123-4567</span>
                </li>
                <li className="flex items-center">
                  <MailIcon className="h-5 w-5 mr-3 text-green-300 dark:text-green-400 flex-shrink-0" />
                  <span>info@mountolivefarm.com</span>
                </li>
              </ul>
              
              <div className="mt-6 p-4 bg-green-700 dark:bg-green-900 rounded-lg">
                <h4 className="font-medium mb-2">Farm Store Hours</h4>
                <p className="text-sm text-green-200">Mon-Sat: 8am - 6pm</p>
                <p className="text-sm text-green-200">Sunday: 10am - 4pm</p>
              </div>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="border-t border-green-700 dark:border-green-900 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-green-300 text-sm mb-4 md:mb-0">
              &copy; {new Date().getFullYear()} Mount Olive Farm House. All rights reserved.
            </p>
            
            <div className="flex flex-wrap justify-center gap-6 text-sm text-green-300">
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-white transition-colors">Shipping Policy</a>
              <a href="#" className="hover:text-white transition-colors">Refund Policy</a>
            </div>
          </div>
          
          {/* Made with love */}
          <div className="text-center mt-6">
            <p className="text-xs text-green-700 dark:text-green-800 flex items-center justify-center">
              Made by the Mount Olive Farm team
            </p>
          </div>
        </div>
      </footer>
    </>
  )
}

export default UHFooter