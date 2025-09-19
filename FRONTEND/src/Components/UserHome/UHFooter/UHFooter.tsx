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
                Growing organic, sustainable produce with love and care for over 15 years.
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
                <li><a href="/" className="text-green-200 hover:text-white flex items-center transition-all duration-300"><ArrowRight className="h-4 w-4 mr-2" /> Home</a></li>
                <li><a href="/InventoryManagement/catalog" className="text-green-200 hover:text-white flex items-center transition-all duration-300"><ArrowRight className="h-4 w-4 mr-2" /> Shop</a></li>
                <li><a href="#" className="text-green-200 hover:text-white flex items-center transition-all duration-300"><ArrowRight className="h-4 w-4 mr-2" /> About Us</a></li>
                <li><a href="#" className="text-green-200 hover:text-white flex items-center transition-all duration-300"><ArrowRight className="h-4 w-4 mr-2" /> Farm Tours</a></li>
                <li><a href="#" className="text-green-200 hover:text-white flex items-center transition-all duration-300"><ArrowRight className="h-4 w-4 mr-2" /> Contact</a></li>
                <li><a href="news" className="text-green-200 hover:text-white flex items-center transition-all duration-300"><ArrowRight className="h-4 w-4 mr-2" /> News</a></li>
              </ul>
            </div>

            {/* Products */}
            <div>
            <h3 className="text-xl font-semibold mb-6 pb-2 border-b border-green-700 dark:border-green-800">
              Our Products
            </h3>
            <ul className="space-y-3">
              <li className="text-green-200 flex items-center transition-all duration-300 hover:text-white">
                <ArrowRight className="h-4 w-4 mr-2" /> Fresh Vegetables
              </li>
              <li className="text-green-200 flex items-center transition-all duration-300 hover:text-white">
                <ArrowRight className="h-4 w-4 mr-2" /> Organic Fruits
              </li>
              <li className="text-green-200 flex items-center transition-all duration-300 hover:text-white">
                <ArrowRight className="h-4 w-4 mr-2" /> Farm Dairy
              </li>
              <li className="text-green-200 flex items-center transition-all duration-300 hover:text-white">
                <ArrowRight className="h-4 w-4 mr-2" /> Honey & Jams
              </li>
              <li className="text-green-200 flex items-center transition-all duration-300 hover:text-white">
                <ArrowRight className="h-4 w-4 mr-2" /> Seasonal Specials
              </li>
              <li className="text-green-200 flex items-center transition-all duration-300 hover:text-white">
                <ArrowRight className="h-4 w-4 mr-2" /> Gift Baskets
              </li>
            </ul>
          </div>

            {/* Contact Info */}
            <div>
              <h3 className="text-xl font-semibold mb-6 pb-2 border-b border-green-700 dark:border-green-800">Contact Us</h3>
              <ul className="space-y-4">
                <li className="flex items-start">
                  <MapPinIcon className="h-5 w-5 mr-3 mt-0.5 text-green-300 dark:text-green-400 flex-shrink-0" />
                  <span>No. 45, Green Valley Road,Boragasketiya,Nuwaraeliya, Sri Lanka</span>
                </li>
                <li className="flex items-center">
                  <PhoneIcon className="h-5 w-5 mr-3 text-green-300 dark:text-green-400 flex-shrink-0" />
                  <span>+94 81 249 2134</span>
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
              <a href="privacyPolicy" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="termsofservice" className="hover:text-white transition-colors">Terms of Service</a>
              <a href="shippingPolicy" className="hover:text-white transition-colors">Shipping Policy</a>
              <a href="refundPolicy" className="hover:text-white transition-colors">Refund Policy</a>
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