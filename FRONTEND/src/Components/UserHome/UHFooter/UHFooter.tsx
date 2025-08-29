// src/Components/UserHome/UHFooter/UHFooter.jsx
import React from 'react'
import { MapPinIcon, PhoneIcon, MailIcon, FacebookIcon, InstagramIcon, TwitterIcon } from 'lucide-react'

const Footer = () => {
  return (
    <footer className="bg-green-800 dark:bg-gray-900 text-white py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Contact */}
          <div>
            <h3 className="text-xl font-semibold mb-4">Contact Us</h3>
            <ul className="space-y-3">
              <li className="flex items-start">
                <MapPinIcon className="h-5 w-5 mr-2 mt-0.5 text-green-300 dark:text-green-400" />
                123 Farm Road, Mount Olive, CA 90210
              </li>
              <li className="flex items-center">
                <PhoneIcon className="h-5 w-5 mr-2 text-green-300 dark:text-green-400" />
                (555) 123-4567
              </li>
              <li className="flex items-center">
                <MailIcon className="h-5 w-5 mr-2 text-green-300 dark:text-green-400" />
                info@mountolivefarm.com
              </li>
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-xl font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li><a href="#home" className="hover:text-green-300">Home</a></li>
              <li><a href="#products" className="hover:text-green-300">Shop</a></li>
              <li><a href="#about" className="hover:text-green-300">About Us</a></li>
              <li><a href="#contact" className="hover:text-green-300">Contact</a></li>
            </ul>
          </div>

          {/* Social */}
          <div>
            <h3 className="text-xl font-semibold mb-4">Follow Us</h3>
            <div className="flex space-x-4">
              <FacebookIcon className="h-6 w-6" />
              <InstagramIcon className="h-6 w-6" />
              <TwitterIcon className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="border-t border-green-700 dark:border-gray-700 mt-8 pt-8 text-center text-sm">
          &copy; {new Date().getFullYear()} Mount Olive Farm House. All rights reserved.
        </div>
      </div>
    </footer>
  )
}

export default Footer
