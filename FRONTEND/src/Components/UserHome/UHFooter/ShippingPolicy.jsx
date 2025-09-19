// src/Components/UserHome/UHFooter/ShippingPolicy.jsx
import React, { useState, useEffect } from 'react';
import Header from '../UHNavbar/UHNavbar';
import Footer from '../UHFooter/UHFooter';
import { useTheme } from '../UHContext/UHThemeContext';
import { 
  TruckIcon, 
  ClockIcon, 
  MapPinIcon, 
  PhoneIcon, 
  MailIcon, 
  ShieldIcon, 
  RefreshCwIcon,
  ArrowLeftIcon,
  DownloadIcon,
  XIcon,
  AlertCircleIcon,
  CalendarIcon,
  PackageIcon,
  NavigationIcon
} from 'lucide-react';

const ShippingPolicy = () => {
  const { darkMode } = useTheme();
  const [showScrollPopup, setShowScrollPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState('');

  React.useEffect(() => {
    document.title = "Shipping Policy | Mount Olive Farm";
  }, []);

  // Set up scroll event listener to show popups
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      const documentHeight = document.documentElement.scrollHeight;
      
      // Show different messages based on scroll position
      if (scrollPosition > documentHeight * 0.2 && scrollPosition < documentHeight * 0.3) {
        setPopupMessage("Remember: Check delivery zones before ordering to ensure we ship to your area.");
        setShowScrollPopup(true);
      } else if (scrollPosition > documentHeight * 0.4 && scrollPosition < documentHeight * 0.5) {
        setPopupMessage("Tip: Provide clear delivery instructions to ensure your package is left in a safe location.");
        setShowScrollPopup(true);
      } else if (scrollPosition > documentHeight * 0.6 && scrollPosition < documentHeight * 0.7) {
        setPopupMessage("Note: Perishable items require prompt reception. Plan to be available during delivery.");
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
    // Create a text content
    const content = `
      MountOlive Farm Shipping Policy
      Last Updated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
      
      OVERVIEW
      At MountOlive Farm, we are committed to delivering the freshest farm products directly to your doorstep. 
      This Shipping Policy outlines our delivery procedures, timelines, and other important information regarding 
      how we ship our products.
      
      SHIPPING AREAS & DELIVERY ZONES
      We currently ship to:
      - Local deliveries within a 30-mile radius of our farm (free delivery)
      - Regional deliveries within our state ($7.99 flat rate)
      - Select neighboring states ($12.99 flat rate)
      
      PROCESSING TIME
      All orders are processed within 1-2 business days. Orders placed on weekends or holidays 
      will be processed the next business day.
      
      SHIPPING METHODS & DELIVERY TIMES
      Standard Local Delivery: 2-3 business days (Free for orders over $50, $5.99 for orders under $50)
      Next-Day Local Delivery: Next business day ($9.99)
      Regional Shipping: 3-5 business days ($7.99 flat rate)
      Extended Area Shipping: 5-7 business days ($12.99 flat rate)
      
      PERISHABLE ITEMS & PACKAGING
      We use temperature-controlled packaging, insulated boxes with ice packs, and sustainable materials
      to ensure your products arrive fresh.
      
      ORDER TRACKING
      You'll receive a tracking number once your order ships. For local deliveries, you'll get a delivery
      window notification on delivery day.
      
      For the complete shipping policy, visit our website or contact us.
    `;
    
    // Create a Blob with the content
    const blob = new Blob([content], { type: 'text/plain' });
    
    // Create a URL for the Blob
    const url = URL.createObjectURL(blob);
    
    // Create a temporary anchor element to trigger the download
    const a = document.createElement('a');
    a.href = url;
    a.download = 'MountOlive-Farm-Shipping-Policy.txt';
    
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
            <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>Shipping Policy</span>
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
                    href="#shipping-areas" 
                    className={`block py-2 px-3 rounded-lg ${darkMode ? 'hover:bg-dark-gray text-gray-300' : 'hover:bg-gray-100 text-gray-700'}`}
                  >
                    Shipping Areas
                  </a>
                </li>
                <li>
                  <a 
                    href="#processing-time" 
                    className={`block py-2 px-3 rounded-lg ${darkMode ? 'hover:bg-dark-gray text-gray-300' : 'hover:bg-gray-100 text-gray-700'}`}
                  >
                    Processing Time
                  </a>
                </li>
                <li>
                  <a 
                    href="#shipping-methods" 
                    className={`block py-2 px-3 rounded-lg ${darkMode ? 'hover:bg-dark-gray text-gray-300' : 'hover:bg-gray-100 text-gray-700'}`}
                  >
                    Shipping Methods
                  </a>
                </li>
                <li>
                  <a 
                    href="#packaging" 
                    className={`block py-2 px-3 rounded-lg ${darkMode ? 'hover:bg-dark-gray text-gray-300' : 'hover:bg-gray-100 text-gray-700'}`}
                  >
                    Packaging
                  </a>
                </li>
                <li>
                  <a 
                    href="#tracking" 
                    className={`block py-2 px-3 rounded-lg ${darkMode ? 'hover:bg-dark-gray text-gray-300' : 'hover:bg-gray-100 text-gray-700'}`}
                  >
                    Order Tracking
                  </a>
                </li>
                <li>
                  <a 
                    href="#restrictions" 
                    className={`block py-2 px-3 rounded-lg ${darkMode ? 'hover:bg-dark-gray text-gray-300' : 'hover:bg-gray-100 text-gray-700'}`}
                  >
                    Restrictions
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
                    <TruckIcon size={28} />
                  </div>
                  <div>
                    <h1 className={`text-3xl md:text-4xl font-bold ${darkMode ? 'text-dark-text' : 'text-gray-900'}`}>
                      Shipping Policy
                    </h1>
                    <p className={`mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Last Updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
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
                      <strong>Note:</strong> We specialize in shipping perishable farm products and take extra care to ensure freshness upon delivery.
                    </p>
                  </div>
                  <p className={`mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    At MountOlive Farm, we are committed to delivering the freshest farm products directly to your doorstep. 
                    This Shipping Policy outlines our delivery procedures, timelines, and other important information regarding 
                    how we ship our products.
                  </p>
                  <p className={`${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    We understand the importance of receiving fresh farm products and have developed specialized packaging
                    and shipping methods to maintain quality during transit.
                  </p>
                </section>

                <section id="shipping-areas" className="mb-10 scroll-mt-20">
                  <h2 className={`text-2xl font-semibold mb-4 ${darkMode ? 'text-dark-text' : 'text-gray-800'}`}>
                    Shipping Areas & Delivery Zones
                  </h2>
                  <div className={`flex items-start mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    <MapPinIcon className="h-5 w-5 mr-2 mt-1 flex-shrink-0" />
                    <div>
                      <p className="font-medium mb-2">We currently ship to the following areas:</p>
                      <ul className="list-disc pl-6 mb-4">
                        <li>Local deliveries within a 30-mile radius of our farm (free delivery)</li>
                        <li>Regional deliveries within our state ($7.99 flat rate)</li>
                        <li>Select neighboring states ($12.99 flat rate)</li>
                      </ul>
                      <div className={`p-4 rounded-lg ${darkMode ? 'bg-dark-gray' : 'bg-blue-50'} border ${darkMode ? 'border-gray-700' : 'border-blue-200'}`}>
                        <p className={`${darkMode ? 'text-blue-300' : 'text-blue-800'}`}>
                          <strong>Check Delivery Availability:</strong> Enter your zip code during checkout to confirm if we deliver to your area.
                        </p>
                      </div>
                    </div>
                  </div>
                </section>

                <section id="processing-time" className="mb-10 scroll-mt-20">
                  <h2 className={`text-2xl font-semibold mb-4 ${darkMode ? 'text-dark-text' : 'text-gray-800'}`}>
                    Processing Time
                  </h2>
                  <div className={`flex items-start mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    <ClockIcon className="h-5 w-5 mr-2 mt-1 flex-shrink-0" />
                    <div>
                      <p className="mb-2">
                        All orders are processed within <strong>1-2 business days</strong>. Orders placed on weekends or holidays 
                        will be processed the next business day.
                      </p>
                      <p>
                        For the freshest products, we harvest and pack most items the day before or the day of shipment.
                      </p>
                    </div>
                  </div>
                  <div className={`p-4 rounded-lg ${darkMode ? 'bg-dark-green' : 'bg-green-50'} border ${darkMode ? 'border-green-700' : 'border-green-200'}`}>
                    <h3 className={`font-semibold mb-2 flex items-center ${darkMode ? 'text-soft-white' : 'text-green-800'}`}>
                      <CalendarIcon className="mr-2" size={18} /> Harvest & Packing Schedule
                    </h3>
                    <p className={`${darkMode ? 'text-gray-200' : 'text-green-700'}`}>
                      We follow a just-in-time harvesting approach to ensure maximum freshness. Most products are harvested within 24 hours of shipping.
                    </p>
                  </div>
                </section>

                <section id="shipping-methods" className="mb-10 scroll-mt-20">
                  <h2 className={`text-2xl font-semibold mb-4 ${darkMode ? 'text-dark-text' : 'text-gray-800'}`}>
                    Shipping Methods & Delivery Times
                  </h2>
                  <div className={`overflow-x-auto ${darkMode ? 'bg-dark-gray' : 'bg-gray-100'} rounded-lg p-4 mb-4`}>
                    <table className="w-full">
                      <thead>
                        <tr className={`${darkMode ? 'bg-dark-green text-soft-white' : 'bg-green-700 text-white'}`}>
                          <th className="py-2 px-4 text-left">Service</th>
                          <th className="py-2 px-4 text-left">Delivery Time</th>
                          <th className="py-2 px-4 text-left">Cost</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className={`border-b ${darkMode ? 'border-dark-gray' : 'border-gray-200'}`}>
                          <td className="py-3 px-4 font-medium">Standard Local Delivery</td>
                          <td className="py-3 px-4">2-3 business days</td>
                          <td className="py-3 px-4">Free for orders over $50<br/>$5.99 for orders under $50</td>
                        </tr>
                        <tr className={`border-b ${darkMode ? 'border-dark-gray' : 'border-gray-200'}`}>
                          <td className="py-3 px-4 font-medium">Next-Day Local Delivery</td>
                          <td className="py-3 px-4">Next business day</td>
                          <td className="py-3 px-4">$9.99</td>
                        </tr>
                        <tr className={`border-b ${darkMode ? 'border-dark-gray' : 'border-gray-200'}`}>
                          <td className="py-3 px-4 font-medium">Regional Shipping</td>
                          <td className="py-3 px-4">3-5 business days</td>
                          <td className="py-3 px-4">$7.99 flat rate</td>
                        </tr>
                        <tr>
                          <td className="py-3 px-4 font-medium">Extended Area Shipping</td>
                          <td className="py-3 px-4">5-7 business days</td>
                          <td className="py-3 px-4">$12.99 flat rate</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <p className={`${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Delivery times are estimates and may vary due to weather conditions, holidays, or other factors beyond our control.
                  </p>
                </section>

                <section id="packaging" className="mb-10 scroll-mt-20">
                  <h2 className={`text-2xl font-semibold mb-4 ${darkMode ? 'text-dark-text' : 'text-gray-800'}`}>
                    Perishable Items & Packaging
                  </h2>
                  <div className={`flex items-start mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    <ShieldIcon className="h-5 w-5 mr-2 mt-1 flex-shrink-0" />
                    <div>
                      <p className="mb-2">
                        We take special care in packaging our perishable items to ensure they arrive fresh:
                      </p>
                      <ul className="list-disc pl-6 mb-4">
                        <li>Temperature-controlled packaging for dairy and meat products</li>
                        <li>Insulated boxes with ice packs for produce during warm months</li>
                        <li>Breathable packaging for certain fruits and vegetables</li>
                        <li>Recyclable and sustainable packaging materials whenever possible</li>
                      </ul>
                      <div className={`p-4 rounded-lg ${darkMode ? 'bg-dark-gray' : 'bg-yellow-50'} border ${darkMode ? 'border-gray-700' : 'border-yellow-200'}`}>
                        <p className={`${darkMode ? 'text-yellow-300' : 'text-yellow-800'}`}>
                          <strong>Environmental Note:</strong> Our packaging is 85% recyclable or compostable. Please recycle appropriately.
                        </p>
                      </div>
                    </div>
                  </div>
                </section>

                <section id="tracking" className="mb-10 scroll-mt-20">
                  <h2 className={`text-2xl font-semibold mb-4 ${darkMode ? 'text-dark-text' : 'text-gray-800'}`}>
                    Order Tracking
                  </h2>
                  <div className={`flex items-start mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    <NavigationIcon className="h-5 w-5 mr-2 mt-1 flex-shrink-0" />
                    <div>
                      <p className="mb-2">
                        Once your order has been shipped, you will receive a confirmation email with a tracking number. 
                        You can use this tracking number to monitor your delivery status.
                      </p>
                      <p>
                        For local deliveries, you will receive a text message or email with an estimated delivery window 
                        on the day of delivery.
                      </p>
                    </div>
                  </div>
                </section>

                <section className="mb-10 scroll-mt-20">
                  <h2 className={`text-2xl font-semibold mb-4 ${darkMode ? 'text-dark-text' : 'text-gray-800'}`}>
                    Delivery Instructions & Receiving Packages
                  </h2>
                  <p className={`mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    To ensure the quality and safety of your perishable items:
                  </p>
                  <ul className={`list-disc pl-6 mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    <li>Please provide clear delivery instructions during checkout</li>
                    <li>Someone should be available to receive perishable items promptly</li>
                    <li>If no one is available, drivers will leave packages in a shaded, secure location</li>
                    <li>During hot weather, we recommend arranging for delivery to a workplace or neighbor</li>
                  </ul>
                  <div className={`p-4 rounded-lg ${darkMode ? 'bg-dark-gray' : 'bg-red-50'} border ${darkMode ? 'border-gray-700' : 'border-red-200'}`}>
                    <p className={`${darkMode ? 'text-red-300' : 'text-red-800'}`}>
                      <strong>Important:</strong> We are not responsible for spoilage due to failure to receive deliveries promptly.
                    </p>
                  </div>
                </section>

                <section id="restrictions" className="mb-10 scroll-mt-20">
                  <h2 className={`text-2xl font-semibold mb-4 ${darkMode ? 'text-dark-text' : 'text-gray-800'}`}>
                    Shipping Restrictions
                  </h2>
                  <div className={`flex items-start mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    <PackageIcon className="h-5 w-5 mr-2 mt-1 flex-shrink-0" />
                    <div>
                      <p className="mb-2">
                        Due to state agricultural regulations, we cannot ship certain products to all locations. 
                        Restrictions may apply to:
                      </p>
                      <ul className="list-disc pl-6 mb-4">
                        <li>Fresh fruits and vegetables to certain states</li>
                        <li>Plants, seeds, and seedlings</li>
                        <li>Raw milk and dairy products</li>
                        <li>Honey and bee products</li>
                      </ul>
                      <p>
                        If you have questions about shipping specific products to your area, please contact us before ordering.
                      </p>
                    </div>
                  </div>
                </section>

                <section className="mb-10 scroll-mt-20">
                  <h2 className={`text-2xl font-semibold mb-4 ${darkMode ? 'text-dark-text' : 'text-gray-800'}`}>
                    Weather & Seasonal Considerations
                  </h2>
                  <div className={`flex items-start mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    <RefreshCwIcon className="h-5 w-5 mr-2 mt-1 flex-shrink-0" />
                    <div>
                      <p className="mb-2">
                        As a farm, we are subject to weather conditions that may affect our shipping:
                      </p>
                      <ul className="list-disc pl-6 mb-4">
                        <li>During extreme heat or cold, we may pause shipments to protect product quality</li>
                        <li>Inclement weather may cause delivery delays</li>
                        <li>Seasonal availability affects which products we can ship</li>
                        <li>During peak seasons (holidays, etc.), processing times may be longer</li>
                      </ul>
                      <p>
                        We will notify customers promptly of any weather-related shipping changes.
                      </p>
                    </div>
                  </div>
                </section>

                <section className="mb-10 scroll-mt-20">
                  <h2 className={`text-2xl font-semibold mb-4 ${darkMode ? 'text-dark-text' : 'text-gray-800'}`}>
                    Damaged or Late Shipments
                  </h2>
                  <p className={`mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    If your package arrives damaged or with compromised contents:
                  </p>
                  <ol className={`list-decimal pl-6 mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    <li>Take photos of the packaging and damaged items</li>
                    <li>Contact us within 24 hours of delivery at <strong>support@mountolivefarm.com</strong></li>
                    <li>We will arrange for a replacement or refund as appropriate</li>
                  </ol>
                  <p className={`${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    For late shipments, please check your tracking information first. If your shipment is significantly delayed, 
                    contact us and we will investigate with the carrier.
                  </p>
                </section>

                <section className="mb-10 scroll-mt-20">
                  <h2 className={`text-2xl font-semibold mb-4 ${darkMode ? 'text-dark-text' : 'text-gray-800'}`}>
                    International Shipping
                  </h2>
                  <p className={`mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Currently, we only ship within the United States. We do not offer international shipping due to 
                    customs regulations and the perishable nature of our products.
                  </p>
                </section>

                <section className="mb-10 scroll-mt-20">
                  <h2 className={`text-2xl font-semibold mb-4 ${darkMode ? 'text-dark-text' : 'text-gray-800'}`}>
                    Policy Changes
                  </h2>
                  <p className={`mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    We may update this Shipping Policy from time to time to reflect changes in our practices, 
                    service offerings, or regulations. The updated policy will be posted on our website with 
                    a revised "Last Updated" date.
                  </p>
                </section>

                <section id="contact" className="mb-10 scroll-mt-20">
                  <h2 className={`text-2xl font-semibold mb-4 ${darkMode ? 'text-dark-text' : 'text-gray-800'}`}>
                    Contact Us
                  </h2>
                  <div className={`p-6 rounded-xl ${darkMode ? 'bg-dark-gray' : 'bg-gray-100'}`}>
                    <p className={`mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      If you have any questions about our Shipping Policy, please contact us:
                    </p>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="flex items-center">
                        <PhoneIcon className="h-5 w-5 mr-3" />
                        <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>(123) 456-7890</span>
                      </div>
                      <div className="flex items-center">
                        <MailIcon className="h-5 w-5 mr-3" />
                        <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>shipping@mountolivefarm.com</span>
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

export default ShippingPolicy;