// src/Components/UserHome/UHFooter/PrivacyPolicy.jsx
import React, { useState, useEffect } from 'react';
import Header from '../UHNavbar/UHNavbar';
import Footer from '../UHFooter/UHFooter';
import { useTheme } from '../UHContext/UHThemeContext';
import { 
  ShieldIcon, 
  LockIcon, 
  MailIcon, 
  PhoneIcon, 
  MapPinIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  DownloadIcon,
  ArrowLeftIcon,
  XIcon
} from 'lucide-react';

const PrivacyPolicy = () => {
  const { darkMode } = useTheme();
  const [showScrollPopup, setShowScrollPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState('');

  React.useEffect(() => {
    document.title = "Privacy Policy | Mount Olive Farm";
  }, []);

  // Set up scroll event listener to show popups
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      const documentHeight = document.documentElement.scrollHeight;
      
      // Show different messages based on scroll position
      if (scrollPosition > documentHeight * 0.2 && scrollPosition < documentHeight * 0.3) {
        setPopupMessage("Your privacy matters to us. We never sell your personal data to third parties.");
        setShowScrollPopup(true);
      } else if (scrollPosition > documentHeight * 0.4 && scrollPosition < documentHeight * 0.5) {
        setPopupMessage("You can control your cookie preferences through your browser settings.");
        setShowScrollPopup(true);
      } else if (scrollPosition > documentHeight * 0.6 && scrollPosition < documentHeight * 0.7) {
        setPopupMessage("Contact our privacy team anytime with questions about your data.");
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
      MountOlive Farm Privacy Policy
      Last Updated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
      
      1. INTRODUCTION
      Welcome to MountOlive Farm ("we," "our," or "us"). We are committed to protecting your privacy and ensuring
      that your personal information is handled in a safe and responsible manner.
      
      2. INFORMATION WE COLLECT
      Personal Information:
      - Name and contact details (email address, phone number)
      - Demographic information (postal code, preferences)
      - Account information if you create a profile on our site
      - Payment information for purchases
      - Communications you send to us
      
      Automatically Collected Information:
      - IP address and browser type
      - Device information
      - Pages you visit and time spent on them
      - Referring website addresses
      - Cookies and similar tracking technologies
      
      3. HOW WE USE YOUR INFORMATION
      We use the information we collect for various purposes, including:
      - Providing, operating, and maintaining our website
      - Improving, personalizing, and expanding our website
      - Understanding and analyzing how you use our website
      - Developing new products, services, features, and functionality
      - Communicating with you, either directly or through one of our partners
      - Processing your transactions and managing your orders
      - Sending you marketing and promotional communications
      - Finding and preventing fraud
      
      4. COOKIES AND TRACKING TECHNOLOGIES
      We use cookies and similar tracking technologies to track activity on our website and store certain information.
      
      5. DATA SHARING AND DISCLOSURE
      We may share your information with service providers, in business transfers, or where required by law.
      
      6. DATA SECURITY
      We have implemented appropriate security measures to protect your personal information.
      
      7. YOUR PRIVACY RIGHTS
      Depending on your location, you may have rights to access, correct, delete, or restrict processing of your data.
      
      8. CHILDREN'S PRIVACY
      Our website is not intended for children under the age of 13.
      
      9. CHANGES TO THIS PRIVACY POLICY
      We may update our Privacy Policy from time to time.
      
      10. CONTACT US
      If you have any questions or concerns about this Privacy Policy, please contact us at:
      MountOlive Farm
      Email: privacy@mountolivefarm.com
      Phone: (123) 456-7890
      Address: 123 Farm Road, Countryside, CS 12345
    `;
    
    // Create a Blob with the content
    const blob = new Blob([content], { type: 'text/plain' });
    
    // Create a URL for the Blob
    const url = URL.createObjectURL(blob);
    
    // Create a temporary anchor element to trigger the download
    const a = document.createElement('a');
    a.href = url;
    a.download = 'MountOlive-Farm-Privacy-Policy.txt';
    
    // Programmatically click the anchor to trigger the download
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'bg-dark-bg text-dark-text' : 'light-beige'}`}>
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
                    href="#introduction" 
                    className={`block py-2 px-3 rounded-lg ${darkMode ? 'hover:bg-dark-gray text-gray-300' : 'hover:bg-gray-100 text-gray-700'}`}
                  >
                    Introduction
                  </a>
                </li>
                <li>
                  <a 
                    href="#information-collected" 
                    className={`block py-2 px-3 rounded-lg ${darkMode ? 'hover:bg-dark-gray text-gray-300' : 'hover:bg-gray-100 text-gray-700'}`}
                  >
                    Information Collected
                  </a>
                </li>
                <li>
                  <a 
                    href="#information-use" 
                    className={`block py-2 px-3 rounded-lg ${darkMode ? 'hover:bg-dark-gray text-gray-300' : 'hover:bg-gray-100 text-gray-700'}`}
                  >
                    How We Use Information
                  </a>
                </li>
                <li>
                  <a 
                    href="#cookies" 
                    className={`block py-2 px-3 rounded-lg ${darkMode ? 'hover:bg-dark-gray text-gray-300' : 'hover:bg-gray-100 text-gray-700'}`}
                  >
                    Cookies
                  </a>
                </li>
                <li>
                  <a 
                    href="#data-sharing" 
                    className={`block py-2 px-3 rounded-lg ${darkMode ? 'hover:bg-dark-gray text-gray-300' : 'hover:bg-gray-100 text-gray-700'}`}
                  >
                    Data Sharing
                  </a>
                </li>
                <li>
                  <a 
                    href="#data-security" 
                    className={`block py-2 px-3 rounded-lg ${darkMode ? 'hover:bg-dark-gray text-gray-300' : 'hover:bg-gray-100 text-gray-700'}`}
                  >
                    Data Security
                  </a>
                </li>
                <li>
                  <a 
                    href="#your-rights" 
                    className={`block py-2 px-3 rounded-lg ${darkMode ? 'hover:bg-dark-gray text-gray-300' : 'hover:bg-gray-100 text-gray-700'}`}
                  >
                    Your Rights
                  </a>
                </li>
                <li>
                  <a 
                    href="#children-privacy" 
                    className={`block py-2 px-3 rounded-lg ${darkMode ? 'hover:bg-dark-gray text-gray-300' : 'hover:bg-gray-100 text-gray-700'}`}
                  >
                    Children's Privacy
                  </a>
                </li>
                <li>
                  <a 
                    href="#policy-changes" 
                    className={`block py-2 px-3 rounded-lg ${darkMode ? 'hover:bg-dark-gray text-gray-300' : 'hover:bg-gray-100 text-gray-700'}`}
                  >
                    Policy Changes
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
                    <ShieldIcon size={28} />
                  </div>
                  <div>
                    <h1 className={`text-3xl md:text-4xl font-bold ${darkMode ? 'text-dark-text' : 'text-gray-900'}`}>
                      Privacy Policy
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
                <section id="introduction" className="mb-10 scroll-mt-20">
                  <h2 className={`text-2xl font-semibold mb-4 ${darkMode ? 'text-dark-text' : 'text-gray-800'}`}>
                    1. Introduction
                  </h2>
                  <div className={`p-4 rounded-lg ${darkMode ? 'bg-dark-gray' : 'bg-green-50'} mb-4`}>
                    <p className={`${darkMode ? 'text-gray-300' : 'text-green-800'}`}>
                      <strong>Our Commitment:</strong> We are dedicated to protecting your privacy and handling your personal information with care and respect.
                    </p>
                  </div>
                  <p className={`mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Welcome to MountOlive Farm ("we," "our," or "us"). We are committed to protecting your privacy and ensuring
                    that your personal information is handled in a safe and responsible manner. This Privacy Policy outlines how
                    we collect, use, and protect your information when you visit our website.
                  </p>
                </section>

                <section id="information-collected" className="mb-10 scroll-mt-20">
                  <h2 className={`text-2xl font-semibold mb-4 ${darkMode ? 'text-dark-text' : 'text-gray-800'}`}>
                    2. Information We Collect
                  </h2>
                  
                  <div className={`mb-6 p-6 rounded-xl ${darkMode ? 'bg-dark-green' : 'bg-green-100'} border ${darkMode ? 'border-green-700' : 'border-green-200'}`}>
                    <h3 className={`text-lg font-semibold mb-3 flex items-center ${darkMode ? 'text-soft-white' : 'text-green-800'}`}>
                      <CheckCircleIcon className="mr-2" size={20} /> Personal Information
                    </h3>
                    <p className={`mb-3 ${darkMode ? 'text-gray-200' : 'text-green-700'}`}>
                      We may collect personal information that you voluntarily provide to us, including:
                    </p>
                    <ul className={`list-disc pl-6 space-y-2 ${darkMode ? 'text-gray-200' : 'text-green-700'}`}>
                      <li>Name and contact details (email address, phone number)</li>
                      <li>Demographic information (postal code, preferences)</li>
                      <li>Account information if you create a profile on our site</li>
                      <li>Payment information for purchases</li>
                      <li>Communications you send to us</li>
                    </ul>
                  </div>

                  <div className={`p-6 rounded-xl ${darkMode ? 'bg-dark-gray' : 'bg-blue-50'} border ${darkMode ? 'border-gray-700' : 'border-blue-200'}`}>
                    <h3 className={`text-lg font-semibold mb-3 flex items-center ${darkMode ? 'text-gray-300' : 'text-blue-800'}`}>
                      <CheckCircleIcon className="mr-2" size={20} /> Automatically Collected Information
                    </h3>
                    <p className={`mb-3 ${darkMode ? 'text-gray-300' : 'text-blue-700'}`}>
                      When you visit our website, we may automatically collect certain information, including:
                    </p>
                    <ul className={`list-disc pl-6 space-y-2 ${darkMode ? 'text-gray-300' : 'text-blue-700'}`}>
                      <li>IP address and browser type</li>
                      <li>Device information</li>
                      <li>Pages you visit and time spent on them</li>
                      <li>Referring website addresses</li>
                      <li>Cookies and similar tracking technologies</li>
                    </ul>
                  </div>
                </section>

                <section id="information-use" className="mb-10 scroll-mt-20">
                  <h2 className={`text-2xl font-semibold mb-4 ${darkMode ? 'text-dark-text' : 'text-gray-800'}`}>
                    3. How We Use Your Information
                  </h2>
                  <div className="grid md:grid-cols-2 gap-6 mb-6">
                    <div className={`p-5 rounded-xl ${darkMode ? 'bg-dark-gray' : 'bg-purple-50'} border ${darkMode ? 'border-gray-700' : 'border-purple-200'}`}>
                      <h3 className={`font-semibold mb-3 ${darkMode ? 'text-purple-300' : 'text-purple-800'}`}>Service Operation</h3>
                      <p className={`${darkMode ? 'text-gray-300' : 'text-purple-700'}`}>
                        Providing, operating, and maintaining our website and services.
                      </p>
                    </div>
                    <div className={`p-5 rounded-xl ${darkMode ? 'bg-dark-gray' : 'bg-purple-50'} border ${darkMode ? 'border-gray-700' : 'border-purple-200'}`}>
                      <h3 className={`font-semibold mb-3 ${darkMode ? 'text-purple-300' : 'text-purple-800'}`}>Improvement</h3>
                      <p className={`${darkMode ? 'text-gray-300' : 'text-purple-700'}`}>
                        Improving, personalizing, and expanding our website functionality.
                      </p>
                    </div>
                    <div className={`p-5 rounded-xl ${darkMode ? 'bg-dark-gray' : 'bg-purple-50'} border ${darkMode ? 'border-gray-700' : 'border-purple-200'}`}>
                      <h3 className={`font-semibold mb-3 ${darkMode ? 'text-purple-300' : 'text-purple-800'}`}>Communication</h3>
                      <p className={`${darkMode ? 'text-gray-300' : 'text-purple-700'}`}>
                        Communicating with you about services, updates, and promotions.
                      </p>
                    </div>
                    <div className={`p-5 rounded-xl ${darkMode ? 'bg-dark-gray' : 'bg-purple-50'} border ${darkMode ? 'border-gray-700' : 'border-purple-200'}`}>
                      <h3 className={`font-semibold mb-3 ${darkMode ? 'text-purple-300' : 'text-purple-800'}`}>Security</h3>
                      <p className={`${darkMode ? 'text-gray-300' : 'text-purple-700'}`}>
                        Finding and preventing fraud and ensuring website security.
                      </p>
                    </div>
                  </div>
                </section>

                <section id="cookies" className="mb-10 scroll-mt-20">
                  <h2 className={`text-2xl font-semibold mb-4 ${darkMode ? 'text-dark-text' : 'text-gray-800'}`}>
                    4. Cookies and Tracking Technologies
                  </h2>
                  <div className={`p-5 rounded-xl ${darkMode ? 'bg-dark-gray' : 'bg-yellow-50'} mb-6 border ${darkMode ? 'border-gray-700' : 'border-yellow-200'}`}>
                    <p className={`mb-4 ${darkMode ? 'text-gray-300' : 'text-yellow-800'}`}>
                      We use cookies and similar tracking technologies to track activity on our website and store certain
                      information. The technologies we use may include:
                    </p>
                    <ul className={`list-disc pl-6 space-y-2 ${darkMode ? 'text-gray-300' : 'text-yellow-800'}`}>
                      <li>
                        <strong>Cookies:</strong> Small data files stored on your device. You can instruct your browser to refuse
                        all cookies or to indicate when a cookie is being sent.
                      </li>
                      <li>
                        <strong>Web Beacons:</strong> Electronic files used to record information about how you browse the website.
                      </li>
                    </ul>
                  </div>
                  
                  <div className={`p-5 rounded-xl ${darkMode ? 'bg-dark-green' : 'bg-green-100'} border ${darkMode ? 'border-green-700' : 'border-green-200'}`}>
                    <h3 className={`font-semibold mb-3 ${darkMode ? 'text-soft-white' : 'text-green-800'}`}>Cookie Types</h3>
                    <ul className={`list-disc pl-6 space-y-2 ${darkMode ? 'text-gray-200' : 'text-green-700'}`}>
                      <li>
                        <strong>Necessary / Essential Cookies:</strong> Required to provide you with services available through our website.
                      </li>
                      <li>
                        <strong>Functionality Cookies:</strong> Allow us to remember choices you make when you use the website.
                      </li>
                      <li>
                        <strong>Tracking and Performance Cookies:</strong> Used to track information about traffic and usage patterns.
                      </li>
                    </ul>
                  </div>
                </section>

                <section id="data-sharing" className="mb-10 scroll-mt-20">
                  <h2 className={`text-2xl font-semibold mb-4 ${darkMode ? 'text-dark-text' : 'text-gray-800'}`}>
                    5. Data Sharing and Disclosure
                  </h2>
                  <div className={`p-5 rounded-xl ${darkMode ? 'bg-dark-gray' : 'bg-gray-100'} mb-6`}>
                    <p className={`mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      We may share your information in the following situations:
                    </p>
                    <ul className={`list-disc pl-6 space-y-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      <li>
                        <strong>Service Providers:</strong> We may share your information with third-party vendors who perform
                        services for us or on our behalf.
                      </li>
                      <li>
                        <strong>Business Transfers:</strong> We may share or transfer your information in connection with, or during
                        negotiations of, any merger, sale of company assets, financing, or acquisition.
                      </li>
                      <li>
                        <strong>Legal Requirements:</strong> We may disclose your information where required to do so by law or in
                        response to valid requests by public authorities.
                      </li>
                    </ul>
                  </div>
                </section>

                <section id="data-security" className="mb-10 scroll-mt-20">
                  <h2 className={`text-2xl font-semibold mb-4 ${darkMode ? 'text-dark-text' : 'text-gray-800'}`}>
                    6. Data Security
                  </h2>
                  <div className={`flex items-start mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    <LockIcon className="h-5 w-5 mr-2 mt-1 flex-shrink-0" />
                    <div>
                      <p className="mb-2">
                        We have implemented appropriate technical and organizational security measures designed to protect the
                        security of any personal information we process. However, please also remember that we cannot guarantee that
                        the internet itself is 100% secure.
                      </p>
                      <div className={`mt-4 p-4 rounded-lg ${darkMode ? 'bg-dark-gray' : 'bg-yellow-50'} border ${darkMode ? 'border-gray-700' : 'border-yellow-200'}`}>
                        <p className={`${darkMode ? 'text-yellow-300' : 'text-yellow-800'}`}>
                          <strong>Important:</strong> Although we will do our best to protect your personal information,
                          transmission of personal information to and from our website is at your own risk.
                        </p>
                      </div>
                    </div>
                  </div>
                </section>

                <section id="your-rights" className="mb-10 scroll-mt-20">
                  <h2 className={`text-2xl font-semibold mb-4 ${darkMode ? 'text-dark-text' : 'text-gray-800'}`}>
                    7. Your Privacy Rights
                  </h2>
                  <div className={`p-6 rounded-xl ${darkMode ? 'bg-dark-green' : 'bg-green-100'} border ${darkMode ? 'border-green-700' : 'border-green-200'}`}>
                    <p className={`mb-4 ${darkMode ? 'text-gray-200' : 'text-green-700'}`}>
                      Depending on your location, you may have the following rights regarding your personal information:
                    </p>
                    <ul className={`list-disc pl-6 space-y-2 ${darkMode ? 'text-gray-200' : 'text-green-700'}`}>
                      <li>The right to access and receive a copy of your personal information</li>
                      <li>The right to rectify any inaccurate or incomplete personal information</li>
                      <li>The right to request the erasure of your personal information</li>
                      <li>The right to restrict the processing of your personal information</li>
                      <li>The right to data portability</li>
                      <li>The right to object to processing of your personal information</li>
                      <li>The right to withdraw consent</li>
                    </ul>
                    <div className={`mt-4 p-4 rounded-lg ${darkMode ? 'bg-dark-gray' : 'bg-white'} border ${darkMode ? 'border-gray-700' : 'border-green-200'}`}>
                      <p className={`${darkMode ? 'text-gray-300' : 'text-green-700'}`}>
                        <strong>To exercise any of these rights,</strong> please contact us using the details provided in the "Contact Us" section.
                      </p>
                    </div>
                  </div>
                </section>

                <section id="children-privacy" className="mb-10 scroll-mt-20">
                  <h2 className={`text-2xl font-semibold mb-4 ${darkMode ? 'text-dark-text' : 'text-gray-800'}`}>
                    8. Children's Privacy
                  </h2>
                  <div className={`p-5 rounded-xl ${darkMode ? 'bg-dark-gray' : 'bg-pink-50'} border ${darkMode ? 'border-gray-700' : 'border-pink-200'}`}>
                    <p className={`${darkMode ? 'text-gray-300' : 'text-pink-800'}`}>
                      Our website is not intended for children under the age of 13. We do not knowingly collect personal
                      information from children under 13. If you are a parent or guardian and believe that your child has provided
                      us with personal information, please contact us, and we will take steps to delete such information from our
                      systems.
                    </p>
                  </div>
                </section>

                <section id="policy-changes" className="mb-10 scroll-mt-20">
                  <h2 className={`text-2xl font-semibold mb-4 ${darkMode ? 'text-dark-text' : 'text-gray-800'}`}>
                    9. Changes to This Privacy Policy
                  </h2>
                  <div className={`p-5 rounded-xl ${darkMode ? 'bg-dark-gray' : 'bg-blue-50'} border ${darkMode ? 'border-gray-700' : 'border-blue-200'}`}>
                    <p className={`${darkMode ? 'text-gray-300' : 'text-blue-800'}`}>
                      We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new
                      Privacy Policy on this page and updating the "Last Updated" date. You are advised to review this Privacy
                      Policy periodically for any changes.
                    </p>
                  </div>
                </section>

                <section id="contact" className="mb-10 scroll-mt-20">
                  <h2 className={`text-2xl font-semibold mb-4 ${darkMode ? 'text-dark-text' : 'text-gray-800'}`}>
                    10. Contact Us
                  </h2>
                  <div className={`p-6 rounded-xl ${darkMode ? 'bg-dark-gray' : 'bg-gray-100'}`}>
                    <p className={`mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      If you have any questions or concerns about this Privacy Policy, please contact us at:
                    </p>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="flex items-center">
                        <MailIcon className="h-5 w-5 mr-3" />
                        <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>privacy@mountolivefarm.com</span>
                      </div>
                      <div className="flex items-center">
                        <PhoneIcon className="h-5 w-5 mr-3" />
                        <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>(123) 456-7890</span>
                      </div>
                      <div className="flex items-center md:col-span-2">
                        <MapPinIcon className="h-5 w-5 mr-3" />
                        <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>123 Farm Road, Countryside, CS 12345</span>
                      </div>
                    </div>
                    <div className={`mt-4 p-4 rounded-lg ${darkMode ? 'bg-dark-green' : 'bg-green-50'} border ${darkMode ? 'border-green-700' : 'border-green-200'}`}>
                      <p className={`${darkMode ? 'text-gray-200' : 'text-green-700'}`}>
                        <strong>Privacy Team Hours:</strong> Monday-Friday, 9am-5pm EST
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

export default PrivacyPolicy;