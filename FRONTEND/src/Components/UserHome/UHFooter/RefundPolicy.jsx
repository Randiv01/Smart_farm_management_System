// src/Components/UserHome/UHFooter/RefundPolicy.jsx
import React, { useState, useEffect } from 'react';
import Header from '../UHNavbar/UHNavbar';
import Footer from '../UHFooter/UHFooter';
import { useTheme } from '../UHContext/UHThemeContext';
import { 
  DollarSignIcon, 
  ClockIcon, 
  MailIcon, 
  PhoneIcon, 
  ShieldIcon, 
  CheckCircleIcon, 
  XCircleIcon,
  ArrowLeftIcon,
  DownloadIcon,
  XIcon,
  AlertCircleIcon
} from 'lucide-react';

const RefundPolicy = () => {
  const { darkMode } = useTheme();
  const [showScrollPopup, setShowScrollPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState('');

  React.useEffect(() => {
    document.title = "Refund Policy | Mount Olive Farm";
  }, []);

  // Set up scroll event listener to show popups
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      
      // Show different messages based on scroll position
      if (scrollPosition > documentHeight * 0.2 && scrollPosition < documentHeight * 0.3) {
        setPopupMessage("Remember: Refund requests must be submitted within 24 hours for perishable items.");
        setShowScrollPopup(true);
      } else if (scrollPosition > documentHeight * 0.4 && scrollPosition < documentHeight * 0.5) {
        setPopupMessage("Tip: Take photos of damaged items to expedite your refund request.");
        setShowScrollPopup(true);
      } else if (scrollPosition > documentHeight * 0.6 && scrollPosition < documentHeight * 0.7) {
        setPopupMessage("Need help? Contact our support team for assistance with refunds.");
        setShowScrollPopup(true);
      } else {
        setShowScrollPopup(false);
      }
    };

    // Add scroll event listener
    window.addEventListener('scroll', handleScroll);
    
    // Clean up
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Function to handle PDF download
  const handleDownload = () => {
    // Create a PDF content
    const content = `
      MountOlive Farm Refund Policy
      Last Updated: September 19, 2025
      
      OVERVIEW
      At MountOlive Farm, we take pride in providing the highest quality farm-fresh products. 
      We want you to be completely satisfied with your purchase. This Refund Policy outlines 
      the conditions under which refunds are provided.
      
      ELIGIBILITY FOR REFUNDS
      Refund Eligible Situations:
      - Products arrived spoiled, damaged, or otherwise unusable
      - Incorrect items were delivered
      - Significant quality issues not apparent from product description
      - Delivery was significantly delayed causing product spoilage
      - Missing items from your order
      
      Non-Refundable Situations:
      - Change of mind or personal preference
      - Failure to be available to receive perishable delivery
      - Minor cosmetic imperfections on produce
      - Natural variations in size, color, or shape of farm products
      - Products properly delivered but not consumed before spoiling
      
      TIMEFRAME FOR REFUND REQUESTS
      Refund requests must be submitted within specific timeframes:
      - Perishable items: Within 24 hours of delivery
      - Non-perishable items: Within 7 days of delivery
      - Subscription cancellations: At least 3 days before next scheduled delivery
      
      HOW TO REQUEST A REFUND
      1. Contact Us: Email us at support@mountolivefarm.com within the eligible timeframe with your order number.
      2. Provide Details: Include photos showing the issue and describe the problem in detail.
      3. Review Process: Our team will review your request and respond within 1-2 business days.
      4. Resolution: If approved, refunds are processed to your original payment method within 5-10 business days.
      
      NON-RETURNABLE PRODUCTS & EXCEPTIONS
      For health and safety reasons, we cannot accept returns of:
      - Opened or partially used food products
      - Perishable items that have been delivered and accepted
      - Custom or special orders
      - Products purchased during sales or clearance events (unless defective)
      - Gift cards
      
      CONTACT US
      For questions about our Refund Policy or to request a refund:
      Phone: (123) 456-7890
      Email: refunds@mountolivefarm.com
      Customer Service Hours: Monday-Friday, 9am-5pm EST
    `;
    
    // Create a Blob with the content
    const blob = new Blob([content], { type: 'text/plain' });
    
    // Create a URL for the Blob
    const url = URL.createObjectURL(blob);
    
    // Create a temporary anchor element to trigger the download
    const a = document.createElement('a');
    a.href = url;
    a.download = 'MountOlive-Farm-Refund-Policy.txt';
    
    // Programmatically click the anchor to trigger the download
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'bg-dark-bg text-dark-text' : 'bg-gray-50 text-gray-900'}`}>
      <Header />
      
      {/* Scroll-triggered Popup */}
      {showScrollPopup && (
        <div className={`fixed bottom-4 right-4 z-50 max-w-sm p-4 rounded-lg shadow-lg animate-fadeIn ${darkMode ? 'bg-btn-teal text-soft-white' : 'bg-green-600 text-white'}`}>
          <div className="flex items-start">
            <AlertCircleIcon className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
            <p className="text-sm flex-1">{popupMessage}</p>
            <button 
              onClick={() => setShowScrollPopup(false)}
              className="ml-2 text-white opacity-70 hover:opacity-100"
            >
              <XIcon size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Breadcrumb Navigation */}
      <div className={`py-4 ${darkMode ? 'bg-dark-card' : 'bg-white'} border-b ${darkMode ? 'border-dark-gray' : 'border-gray-200'}`}>
        <div className="container mx-auto px-6">
          <nav className="flex items-center space-x-2 text-sm">
            <a 
              href="/" 
              className={`hover:text-green-600 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}
            >
              Home
            </a>
            <span className={darkMode ? 'text-gray-600' : 'text-gray-300'}>/</span>
            <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>Refund Policy</span>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar/Navigation */}
          <div className="lg:w-1/4">
            <div className={`sticky top-24 rounded-xl p-6 ${darkMode ? 'bg-dark-card' : 'bg-white'} shadow-md`}>
              <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-dark-text' : 'text-gray-800'}`}>
                Policy Navigation
              </h3>
              <ul className="space-y-2">
                <li>
                  <a 
                    href="#overview" 
                    className={`block py-2 px-3 rounded-lg ${darkMode ? 'hover:bg-dark-gray text-gray-300' : 'hover:bg-gray-100 text-gray-700'}`}
                  >
                    Overview
                  </a>
                </li>
                <li>
                  <a 
                    href="#eligibility" 
                    className={`block py-2 px-3 rounded-lg ${darkMode ? 'hover:bg-dark-gray text-gray-300' : 'hover:bg-gray-100 text-gray-700'}`}
                  >
                    Eligibility
                  </a>
                </li>
                <li>
                  <a 
                    href="#timeframe" 
                    className={`block py-2 px-3 rounded-lg ${darkMode ? 'hover:bg-dark-gray text-gray-300' : 'hover:bg-gray-100 text-gray-700'}`}
                  >
                    Timeframe
                  </a>
                </li>
                <li>
                  <a 
                    href="#process" 
                    className={`block py-2 px-3 rounded-lg ${darkMode ? 'hover:bg-dark-gray text-gray-300' : 'hover:bg-gray-100 text-gray-700'}`}
                  >
                    Refund Process
                  </a>
                </li>
                <li>
                  <a 
                    href="#exceptions" 
                    className={`block py-2 px-3 rounded-lg ${darkMode ? 'hover:bg-dark-gray text-gray-300' : 'hover:bg-gray-100 text-gray-700'}`}
                  >
                    Exceptions
                  </a>
                </li>
                <li>
                  <a 
                    href="#contact" 
                    className={`block py-2 px-3 rounded-lg ${darkMode ? 'hover:bg-dark-gray text-gray-300' : 'hover:bg-gray-100 text-gray-700'}`}
                  >
                    Contact Us
                  </a>
                </li>
              </ul>
              
              <div className="mt-6 pt-4 border-t ${darkMode ? 'border-dark-gray' : 'border-gray-200'}">
                <button 
                  onClick={handleDownload}
                  className={`w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg ${darkMode ? 'bg-btn-teal hover:bg-green-700' : 'bg-green-600 hover:bg-green-700'} text-white transition-colors`}
                >
                  <DownloadIcon size={18} />
                  Download PDF
                </button>
              </div>
            </div>
          </div>

          {/* Policy Content */}
          <div className="lg:w-3/4">
            <div className={`rounded-2xl ${darkMode ? 'bg-dark-card' : 'bg-white'} shadow-lg p-8`}>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <div className={`p-3 rounded-full mr-4 ${darkMode ? 'bg-btn-teal text-soft-white' : 'bg-green-100 text-green-600'}`}>
                    <DollarSignIcon size={28} />
                  </div>
                  <div>
                    <h1 className={`text-3xl md:text-4xl font-bold ${darkMode ? 'text-dark-text' : 'text-gray-900'}`}>
                      Refund Policy
                    </h1>
                    <p className={`mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Last Updated: September 19, 2025
                    </p>
                  </div>
                </div>
                
                <button 
                  onClick={() => window.history.back()} 
                  className={`flex items-center gap-2 py-2 px-4 rounded-lg ${darkMode ? 'hover:bg-dark-gray text-gray-300' : 'hover:bg-gray-100 text-gray-700'}`}
                >
                  <ArrowLeftIcon size={18} />
                  Go Back
                </button>
              </div>

              <div className={`prose max-w-none ${darkMode ? 'prose-invert' : ''}`}>
                <section id="overview" className="mb-10 scroll-mt-20">
                  <h2 className={`text-2xl font-semibold mb-4 ${darkMode ? 'text-dark-text' : 'text-gray-800'}`}>
                    Overview
                  </h2>
                  <div className={`p-4 rounded-lg ${darkMode ? 'bg-dark-gray' : 'bg-green-50'} mb-4`}>
                    <p className={`${darkMode ? 'text-gray-300' : 'text-green-800'}`}>
                      <strong>Note:</strong> Due to the perishable nature of our products, we have specific guidelines for returns and refunds that differ from non-perishable goods.
                    </p>
                  </div>
                  <p className={`mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    At MountOlive Farm, we take pride in providing the highest quality farm-fresh products. 
                    We want you to be completely satisfied with your purchase. This Refund Policy outlines 
                    the conditions under which refunds are provided.
                  </p>
                  <p className={`${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    We understand that sometimes things don't go as planned, and we're committed to making 
                    the refund process as straightforward and fair as possible for our valued customers.
                  </p>
                </section>

                <section id="eligibility" className="mb-10 scroll-mt-20">
                  <h2 className={`text-2xl font-semibold mb-4 ${darkMode ? 'text-dark-text' : 'text-gray-800'}`}>
                    Eligibility for Refunds
                  </h2>
                  
                  <div className={`mb-6 p-6 rounded-xl ${darkMode ? 'bg-dark-green' : 'bg-green-100'} border ${darkMode ? 'border-green-700' : 'border-green-200'}`}>
                    <h3 className={`text-lg font-semibold mb-3 flex items-center ${darkMode ? 'text-soft-white' : 'text-green-800'}`}>
                      <CheckCircleIcon className="mr-2" size={20} /> Refund Eligible Situations
                    </h3>
                    <ul className={`list-disc pl-6 space-y-2 ${darkMode ? 'text-gray-200' : 'text-green-700'}`}>
                      <li>Products arrived spoiled, damaged, or otherwise unusable</li>
                      <li>Incorrect items were delivered</li>
                      <li>Significant quality issues not apparent from product description</li>
                      <li>Delivery was significantly delayed causing product spoilage</li>
                      <li>Missing items from your order</li>
                    </ul>
                  </div>

                  <div className={`p-6 rounded-xl ${darkMode ? 'bg-dark-gray' : 'bg-red-50'} border ${darkMode ? 'border-gray-700' : 'border-red-200'}`}>
                    <h3 className={`text-lg font-semibold mb-3 flex items-center ${darkMode ? 'text-gray-300' : 'text-red-800'}`}>
                      <XCircleIcon className="mr-2" size={20} /> Non-Refundable Situations
                    </h3>
                    <ul className={`list-disc pl-6 space-y-2 ${darkMode ? 'text-gray-300' : 'text-red-700'}`}>
                      <li>Change of mind or personal preference</li>
                      <li>Failure to be available to receive perishable delivery</li>
                      <li>Minor cosmetic imperfections on produce</li>
                      <li>Natural variations in size, color, or shape of farm products</li>
                      <li>Products properly delivered but not consumed before spoiling</li>
                    </ul>
                  </div>
                </section>

                <section id="timeframe" className="mb-10 scroll-mt-20">
                  <h2 className={`text-2xl font-semibold mb-4 ${darkMode ? 'text-dark-text' : 'text-gray-800'}`}>
                    Timeframe for Refund Requests
                  </h2>
                  <div className={`flex items-start mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    <ClockIcon className="h-5 w-5 mr-2 mt-1 flex-shrink-0" />
                    <div>
                      <p className="mb-2">
                        Refund requests must be submitted within specific timeframes:
                      </p>
                      <ul className="list-disc pl-6 space-y-2">
                        <li><strong>Perishable items:</strong> Within 24 hours of delivery</li>
                        <li><strong>Non-perishable items:</strong> Within 7 days of delivery</li>
                        <li><strong>Subscription cancellations:</strong> At least 3 days before next scheduled delivery</li>
                      </ul>
                      <div className={`mt-4 p-4 rounded-lg ${darkMode ? 'bg-dark-gray' : 'bg-yellow-50'} border ${darkMode ? 'border-gray-700' : 'border-yellow-200'}`}>
                        <p className={`${darkMode ? 'text-yellow-300' : 'text-yellow-800'}`}>
                          <strong>Important:</strong> We cannot process refund requests submitted after these timeframes due to the nature of our products.
                        </p>
                      </div>
                    </div>
                  </div>
                </section>

                <section id="process" className="mb-10 scroll-mt-20">
                  <h2 className={`text-2xl font-semibold mb-4 ${darkMode ? 'text-dark-text' : 'text-gray-800'}`}>
                    How to Request a Refund
                  </h2>
                  <div className="grid md:grid-cols-2 gap-6 mb-6">
                    <div className={`p-5 rounded-xl ${darkMode ? 'bg-dark-gray' : 'bg-blue-50'} border ${darkMode ? 'border-gray-700' : 'border-blue-200'}`}>
                      <h3 className={`font-semibold mb-3 ${darkMode ? 'text-blue-300' : 'text-blue-800'}`}>Step 1: Contact Us</h3>
                      <p className={`${darkMode ? 'text-gray-300' : 'text-blue-700'}`}>
                        Email us at <strong>support@mountolivefarm.com</strong> within the eligible timeframe with your order number.
                      </p>
                    </div>
                    <div className={`p-5 rounded-xl ${darkMode ? 'bg-dark-gray' : 'bg-blue-50'} border ${darkMode ? 'border-gray-700' : 'border-blue-200'}`}>
                      <h3 className={`font-semibold mb-3 ${darkMode ? 'text-blue-300' : 'text-blue-800'}`}>Step 2: Provide Details</h3>
                      <p className={`${darkMode ? 'text-gray-300' : 'text-blue-700'}`}>
                        Include photos showing the issue and describe the problem in detail.
                      </p>
                    </div>
                    <div className={`p-5 rounded-xl ${darkMode ? 'bg-dark-gray' : 'bg-blue-50'} border ${darkMode ? 'border-gray-700' : 'border-blue-200'}`}>
                      <h3 className={`font-semibold mb-3 ${darkMode ? 'text-blue-300' : 'text-blue-800'}`}>Step 3: Review Process</h3>
                      <p className={`${darkMode ? 'text-gray-300' : 'text-blue-700'}`}>
                        Our team will review your request and respond within 1-2 business days.
                      </p>
                    </div>
                    <div className={`p-5 rounded-xl ${darkMode ? 'bg-dark-gray' : 'bg-blue-50'} border ${darkMode ? 'border-gray-700' : 'border-blue-200'}`}>
                      <h3 className={`font-semibold mb-3 ${darkMode ? 'text-blue-300' : 'text-blue-800'}`}>Step 4: Resolution</h3>
                      <p className={`${darkMode ? 'text-gray-300' : 'text-blue-700'}`}>
                        If approved, refunds are processed to your original payment method within 5-10 business days.
                      </p>
                    </div>
                  </div>
                </section>

                <section id="exceptions" className="mb-10 scroll-mt-20">
                  <h2 className={`text-2xl font-semibold mb-4 ${darkMode ? 'text-dark-text' : 'text-gray-800'}`}>
                    Non-Returnable Products & Exceptions
                  </h2>
                  <div className={`p-5 rounded-xl ${darkMode ? 'bg-dark-gray' : 'bg-gray-100'} mb-6`}>
                    <p className={`mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      For health and safety reasons, we cannot accept returns of:
                    </p>
                    <ul className={`list-disc pl-6 space-y-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      <li>Opened or partially used food products</li>
                      <li>Perishable items that have been delivered and accepted</li>
                      <li>Custom or special orders</li>
                      <li>Products purchased during sales or clearance events (unless defective)</li>
                      <li>Gift cards</li>
                    </ul>
                  </div>
                  
                  <div className={`p-5 rounded-xl ${darkMode ? 'bg-dark-green' : 'bg-green-100'} border ${darkMode ? 'border-green-700' : 'border-green-200'}`}>
                    <h3 className={`font-semibold mb-3 ${darkMode ? 'text-soft-white' : 'text-green-800'}`}>Quality Guarantee</h3>
                    <p className={`${darkMode ? 'text-gray-200' : 'text-green-700'}`}>
                      We stand behind the quality of our farm products. If you receive items that don't meet our freshness standards, contact us within 24 hours with photos for a replacement, credit, or refund.
                    </p>
                  </div>
                </section>

                <section id="contact" className="mb-10 scroll-mt-20">
                  <h2 className={`text-2xl font-semibold mb-4 ${darkMode ? 'text-dark-text' : 'text-gray-800'}`}>
                    Contact Us
                  </h2>
                  <div className={`p-6 rounded-xl ${darkMode ? 'bg-dark-gray' : 'bg-gray-100'}`}>
                    <p className={`mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      For questions about our Refund Policy or to request a refund:
                    </p>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="flex items-center">
                        <PhoneIcon className="h-5 w-5 mr-3" />
                        <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>(123) 456-7890</span>
                      </div>
                      <div className="flex items-center">
                        <MailIcon className="h-5 w-5 mr-3" />
                        <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>refunds@mountolivefarm.com</span>
                      </div>
                    </div>
                    <div className={`mt-4 p-4 rounded-lg ${darkMode ? 'bg-dark-green' : 'bg-green-50'} border ${darkMode ? 'border-green-700' : 'border-green-200'}`}>
                      <p className={`${darkMode ? 'text-gray-200' : 'text-green-700'}`}>
                        <strong>Customer Service Hours:</strong> Monday-Friday, 9am-5pm EST
                      </p>
                    </div>
                  </div>
                </section>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
      
      {/* Add some custom CSS for the animation */}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default RefundPolicy;