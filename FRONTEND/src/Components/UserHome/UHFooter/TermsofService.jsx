// src/Components/UserHome/UHFooter/TermsofService.jsx
import React, { useState, useEffect } from 'react';
import Header from '../UHNavbar/UHNavbar';
import Footer from '../UHFooter/UHFooter';
import { useTheme } from '../UHContext/UHThemeContext';
import { 
  FileTextIcon, 
  ScaleIcon, 
  ClipboardIcon, 
  ShieldIcon, 
  CreditCardIcon, 
  TruckIcon, 
  RefreshCwIcon,
  ArrowLeftIcon,
  DownloadIcon,
  XIcon,
  AlertCircleIcon,
  MailIcon,
  PhoneIcon,
  MapPinIcon
} from 'lucide-react';

const TermsofService = () => {
  const { darkMode } = useTheme();
  const [showScrollPopup, setShowScrollPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState('');

  React.useEffect(() => {
    document.title = "Terms of Service | Mount Olive Farm";
  }, []);

  // Set up scroll event listener to show popups
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      const documentHeight = document.documentElement.scrollHeight;
      
      // Show different messages based on scroll position
      if (scrollPosition > documentHeight * 0.2 && scrollPosition < documentHeight * 0.3) {
        setPopupMessage("Remember: By using our site, you agree to these terms and conditions.");
        setShowScrollPopup(true);
      } else if (scrollPosition > documentHeight * 0.4 && scrollPosition < documentHeight * 0.5) {
        setPopupMessage("Tip: Keep your account information secure and never share your password.");
        setShowScrollPopup(true);
      } else if (scrollPosition > documentHeight * 0.6 && scrollPosition < documentHeight * 0.7) {
        setPopupMessage("Note: We may update these terms periodically. Check back for changes.");
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
      MountOlive Farm Terms of Service
      Last Updated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
      
      1. AGREEMENT TO TERMS
      By accessing or using the MountOlive Farm website (the "Service"), you agree to be bound by these Terms of Service 
      and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from 
      using or accessing this site.
      
      2. USE LICENSE
      Permission is granted to temporarily access the materials on MountOlive Farm's website 
      for personal, non-commercial transitory viewing only.
      
      3. ACCOUNT CREATION
      To access certain features of our Service, you may be required to create an account. When creating your account, 
      you must provide accurate and complete information.
      
      4. PURCHASES AND PAYMENT
      If you wish to purchase any product or service made available through the Service ("Purchase"), you may be asked 
      to supply certain information relevant to your Purchase.
      
      [Additional sections would be included here...]
      
      For the complete Terms of Service, visit our website or contact us.
    `;
    
    // Create a Blob with the content
    const blob = new Blob([content], { type: 'text/plain' });
    
    // Create a URL for the Blob
    const url = URL.createObjectURL(blob);
    
    // Create a temporary anchor element to trigger the download
    const a = document.createElement('a');
    a.href = url;
    a.download = 'MountOlive-Farm-Terms-of-Service.txt';
    
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
            <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>Terms of Service</span>
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
                Terms Navigation
              </h3>
              <ul className="space-y-2">
                <li>
                  <a 
                    href="#agreement" 
                    className={`block py-2 px-3 rounded-lg ${darkMode ? 'hover:bg-dark-gray text-gray-300' : 'hover:bg-gray-100 text-gray-700'}`}
                  >
                    Agreement to Terms
                  </a>
                </li>
                <li>
                  <a 
                    href="#use-license" 
                    className={`block py-2 px-3 rounded-lg ${darkMode ? 'hover:bg-dark-gray text-gray-300' : 'hover:bg-gray-100 text-gray-700'}`}
                  >
                    Use License
                  </a>
                </li>
                <li>
                  <a 
                    href="#account" 
                    className={`block py-2 px-3 rounded-lg ${darkMode ? 'hover:bg-dark-gray text-gray-300' : 'hover:bg-gray-100 text-gray-700'}`}
                  >
                    Account Creation
                  </a>
                </li>
                <li>
                  <a 
                    href="#purchases" 
                    className={`block py-2 px-3 rounded-lg ${darkMode ? 'hover:bg-dark-gray text-gray-300' : 'hover:bg-gray-100 text-gray-700'}`}
                  >
                    Purchases & Payment
                  </a>
                </li>
                <li>
                  <a 
                    href="#products" 
                    className={`block py-2 px-3 rounded-lg ${darkMode ? 'hover:bg-dark-gray text-gray-300' : 'hover:bg-gray-100 text-gray-700'}`}
                  >
                    Product Information
                  </a>
                </li>
                <li>
                  <a 
                    href="#shipping" 
                    className={`block py-2 px-3 rounded-lg ${darkMode ? 'hover:bg-dark-gray text-gray-300' : 'hover:bg-gray-100 text-gray-700'}`}
                  >
                    Shipping & Delivery
                  </a>
                </li>
                <li>
                  <a 
                    href="#returns" 
                    className={`block py-2 px-3 rounded-lg ${darkMode ? 'hover:bg-dark-gray text-gray-300' : 'hover:bg-gray-100 text-gray-700'}`}
                  >
                    Returns & Refunds
                  </a>
                </li>
                <li>
                  <a 
                    href="#liability" 
                    className={`block py-2 px-3 rounded-lg ${darkMode ? 'hover:bg-dark-gray text-gray-300' : 'hover:bg-gray-100 text-gray-700'}`}
                  >
                    Limitation of Liability
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
                    <FileTextIcon size={28} />
                  </div>
                  <div>
                    <h1 className={`text-3xl md:text-4xl font-bold ${darkMode ? 'text-dark-text' : 'text-gray-900'}`}>
                      Terms of Service
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
                <section id="agreement" className="mb-10 scroll-mt-20">
                  <h2 className={`text-2xl font-semibold mb-4 flex items-center ${darkMode ? 'text-dark-text' : 'text-gray-800'}`}>
                    <ScaleIcon className="mr-2" size={24} /> 1. Agreement to Terms
                  </h2>
                  <div className={`p-4 rounded-lg ${darkMode ? 'bg-dark-gray' : 'bg-green-50'} mb-4`}>
                    <p className={`${darkMode ? 'text-gray-300' : 'text-green-800'}`}>
                      <strong>Important:</strong> By using our website, you agree to these terms. Please read them carefully.
                    </p>
                  </div>
                  <p className={`mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    By accessing or using the MountOlive Farm website (the "Service"), you agree to be bound by these Terms of Service 
                    and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from 
                    using or accessing this site.
                  </p>
                </section>

                <section id="use-license" className="mb-10 scroll-mt-20">
                  <h2 className={`text-2xl font-semibold mb-4 flex items-center ${darkMode ? 'text-dark-text' : 'text-gray-800'}`}>
                    <ClipboardIcon className="mr-2" size={24} /> 2. Use License
                  </h2>
                  <p className={`mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Permission is granted to temporarily access the materials (information or software) on MountOlive Farm's website 
                    for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, 
                    and under this license you may not:
                  </p>
                  <ul className={`list-disc pl-6 mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    <li>Modify or copy the materials;</li>
                    <li>Use the materials for any commercial purpose or for any public display;</li>
                    <li>Attempt to decompile or reverse engineer any software contained on MountOlive Farm's website;</li>
                    <li>Remove any copyright or other proprietary notations from the materials; or</li>
                    <li>Transfer the materials to another person or "mirror" the materials on any other server.</li>
                  </ul>
                  <p className={`mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    This license shall automatically terminate if you violate any of these restrictions and may be terminated by 
                    MountOlive Farm at any time.
                  </p>
                </section>

                <section id="account" className="mb-10 scroll-mt-20">
                  <h2 className={`text-2xl font-semibold mb-4 flex items-center ${darkMode ? 'text-dark-text' : 'text-gray-800'}`}>
                    <ShieldIcon className="mr-2" size={24} /> 3. Account Creation
                  </h2>
                  <p className={`mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    To access certain features of our Service, you may be required to create an account. When creating your account, 
                    you must provide accurate and complete information. You are solely responsible for the activity that occurs on 
                    your account and for keeping your password secure.
                  </p>
                  <div className={`p-4 rounded-lg ${darkMode ? 'bg-dark-gray' : 'bg-blue-50'} border ${darkMode ? 'border-gray-700' : 'border-blue-200'}`}>
                    <p className={`${darkMode ? 'text-blue-300' : 'text-blue-800'}`}>
                      <strong>Security Tip:</strong> Use a strong, unique password and enable two-factor authentication if available.
                    </p>
                  </div>
                </section>

                <section id="purchases" className="mb-10 scroll-mt-20">
                  <h2 className={`text-2xl font-semibold mb-4 flex items-center ${darkMode ? 'text-dark-text' : 'text-gray-800'}`}>
                    <CreditCardIcon className="mr-2" size={24} /> 4. Purchases and Payment
                  </h2>
                  <p className={`mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    If you wish to purchase any product or service made available through the Service ("Purchase"), you may be asked 
                    to supply certain information relevant to your Purchase including, without limitation, your credit card number, 
                    the expiration date of your credit card, your billing address, and your shipping information.
                  </p>
                  <p className={`mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    You represent and warrant that: (i) you have the legal right to use any credit card(s) or other payment method(s) 
                    in connection with any Purchase; and that (ii) the information you supply to us is true, correct and complete.
                  </p>
                </section>

                <section id="products" className="mb-10 scroll-mt-20">
                  <h2 className={`text-2xl font-semibold mb-4 ${darkMode ? 'text-dark-text' : 'text-gray-800'}`}>
                    5. Product Information and Availability
                  </h2>
                  <p className={`mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    We strive to provide accurate information about our farm products, including descriptions, pricing, and availability. 
                    However, we do not warrant that product descriptions or other content is accurate, complete, reliable, current, or error-free.
                  </p>
                  <p className={`mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    As a farm dealing with natural products, availability may change unexpectedly due to weather conditions, harvest yields, 
                    or other factors beyond our control. We reserve the right to limit or cancel quantities purchased per person, per household, 
                    or per order.
                  </p>
                </section>

                <section id="shipping" className="mb-10 scroll-mt-20">
                  <h2 className={`text-2xl font-semibold mb-4 flex items-center ${darkMode ? 'text-dark-text' : 'text-gray-800'}`}>
                    <TruckIcon className="mr-2" size={24} /> 6. Shipping and Delivery
                  </h2>
                  <p className={`mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    We aim to process and ship orders promptly. However, delivery times are estimates only and cannot be guaranteed. 
                    We are not liable for any delays in delivery due to unforeseen circumstances or events beyond our control.
                  </p>
                  <p className={`mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    For perishable items, it is your responsibility to ensure someone is available to receive the delivery. We are not 
                    responsible for spoilage due to failure to receive deliveries promptly.
                  </p>
                </section>

                <section id="returns" className="mb-10 scroll-mt-20">
                  <h2 className={`text-2xl font-semibold mb-4 ${darkMode ? 'text-dark-text' : 'text-gray-800'}`}>
                    7. Returns and Refunds
                  </h2>
                  <p className={`mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Due to the perishable nature of our products, we generally do not accept returns of food items. If you receive 
                    damaged or spoiled products, please contact us within 24 hours of delivery with photos of the items in question.
                  </p>
                  <p className={`mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    For non-perishable items, returns may be accepted within 14 days of purchase with original packaging and receipt. 
                    Refunds will be issued to the original method of payment.
                  </p>
                </section>

                <section className="mb-10 scroll-mt-20">
                  <h2 className={`text-2xl font-semibold mb-4 ${darkMode ? 'text-dark-text' : 'text-gray-800'}`}>
                    8. User Content
                  </h2>
                  <p className={`mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Our Service may allow you to post, link, store, share and otherwise make available certain information, text, 
                    graphics, videos, or other material ("Content"). You are responsible for the Content that you post to the Service, 
                    including its legality, reliability, and appropriateness.
                  </p>
                  <p className={`mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    By posting Content to the Service, you grant us the right and license to use, modify, publicly perform, publicly 
                    display, reproduce, and distribute such Content on and through the Service.
                  </p>
                </section>

                <section className="mb-10 scroll-mt-20">
                  <h2 className={`text-2xl font-semibold mb-4 ${darkMode ? 'text-dark-text' : 'text-gray-800'}`}>
                    9. Prohibited Uses
                  </h2>
                  <p className={`mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    You may use the Service only for lawful purposes and in accordance with these Terms. You agree not to use the Service:
                  </p>
                  <ul className={`list-disc pl-6 mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    <li>In any way that violates any applicable federal, state, local, or international law or regulation;</li>
                    <li>To transmit, or procure the sending of, any advertising or promotional material without our prior written consent;</li>
                    <li>To impersonate or attempt to impersonate the Company, a Company employee, another user, or any other person or entity;</li>
                    <li>To engage in any other conduct that restricts or inhibits anyone's use or enjoyment of the Service;</li>
                    <li>To reproduce, duplicate, copy, or resell any part of our Service in contravention of these Terms.</li>
                  </ul>
                </section>

                <section className="mb-10 scroll-mt-20">
                  <h2 className={`text-2xl font-semibold mb-4 ${darkMode ? 'text-dark-text' : 'text-gray-800'}`}>
                    10. Intellectual Property
                  </h2>
                  <p className={`mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    The Service and its original content, features, and functionality are and will remain the exclusive property of 
                    MountOlive Farm and its licensors. The Service is protected by copyright, trademark, and other laws of both the 
                    United States and foreign countries.
                  </p>
                  <p className={`mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Our trademarks and trade dress may not be used in connection with any product or service without the prior written 
                    consent of MountOlive Farm.
                  </p>
                </section>

                <section className="mb-10 scroll-mt-20">
                  <h2 className={`text-2xl font-semibold mb-4 ${darkMode ? 'text-dark-text' : 'text-gray-800'}`}>
                    11. Links to Other Websites
                  </h2>
                  <p className={`mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Our Service may contain links to third-party websites or services that are not owned or controlled by MountOlive Farm.
                  </p>
                  <p className={`mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    MountOlive Farm has no control over, and assumes no responsibility for, the content, privacy policies, or practices 
                    of any third-party websites or services. You further acknowledge and agree that MountOlive Farm shall not be 
                    responsible or liable, directly or indirectly, for any damage or loss caused or alleged to be caused by or in 
                    connection with the use of or reliance on any such content, goods, or services available on or through any such 
                    websites or services.
                  </p>
                </section>

                <section className="mb-10 scroll-mt-20">
                  <h2 className={`text-2xl font-semibold mb-4 ${darkMode ? 'text-dark-text' : 'text-gray-800'}`}>
                    12. Termination
                  </h2>
                  <p className={`mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, 
                    including without limitation if you breach the Terms.
                  </p>
                  <p className={`mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Upon termination, your right to use the Service will immediately cease. If you wish to terminate your account, 
                    you may simply discontinue using the Service.
                  </p>
                </section>

                <section id="liability" className="mb-10 scroll-mt-20">
                  <h2 className={`text-2xl font-semibold mb-4 ${darkMode ? 'text-dark-text' : 'text-gray-800'}`}>
                    13. Limitation of Liability
                  </h2>
                  <p className={`mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    In no event shall MountOlive Farm, nor its directors, employees, partners, agents, suppliers, or affiliates, be 
                    liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, 
                    loss of profits, data, use, goodwill, or other intangible losses, resulting from:
                  </p>
                  <ul className={`list-disc pl-6 mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    <li>Your access to or use of or inability to access or use the Service;</li>
                    <li>Any conduct or content of any third party on the Service;</li>
                    <li>Any content obtained from the Service; and</li>
                    <li>Unauthorized access, use or alteration of your transmissions or content.</li>
                  </ul>
                </section>

                <section className="mb-10 scroll-mt-20">
                  <h2 className={`text-2xl font-semibold mb-4 ${darkMode ? 'text-dark-text' : 'text-gray-800'}`}>
                    14. Disclaimer
                  </h2>
                  <p className={`mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Your use of the Service is at your sole risk. The Service is provided on an "AS IS" and "AS AVAILABLE" basis. 
                    The Service is provided without warranties of any kind, whether express or implied, including, but not limited to, 
                    implied warranties of merchantability, fitness for a particular purpose, non-infringement or course of performance.
                  </p>
                </section>

                <section className="mb-10 scroll-mt-20">
                  <h2 className={`text-2xl font-semibold mb-4 flex items-center ${darkMode ? 'text-dark-text' : 'text-gray-800'}`}>
                    <RefreshCwIcon className="mr-2" size={24} /> 15. Governing Law
                  </h2>
                  <p className={`mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    These Terms shall be governed and construed in accordance with the laws of the state where MountOlive Farm is 
                    located, without regard to its conflict of law provisions.
                  </p>
                  <p className={`mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Our failure to enforce any right or provision of these Terms will not be considered a waiver of those rights. 
                    If any provision of these Terms is held to be invalid or unenforceable by a court, the remaining provisions of 
                    these Terms will remain in effect.
                  </p>
                </section>

                <section className="mb-10 scroll-mt-20">
                  <h2 className={`text-2xl font-semibold mb-4 ${darkMode ? 'text-dark-text' : 'text-gray-800'}`}>
                    16. Changes to Terms
                  </h2>
                  <p className={`mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is 
                    material we will provide at least 30 days' notice prior to any new terms taking effect. What constitutes a 
                    material change will be determined at our sole discretion.
                  </p>
                  <p className={`mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    By continuing to access or use our Service after those revisions become effective, you agree to be bound by the 
                    revised terms.
                  </p>
                </section>

                <section id="contact" className="mb-10 scroll-mt-20">
                  <h2 className={`text-2xl font-semibold mb-4 ${darkMode ? 'text-dark-text' : 'text-gray-800'}`}>
                    17. Contact Us
                  </h2>
                  <div className={`p-6 rounded-xl ${darkMode ? 'bg-dark-gray' : 'bg-gray-100'}`}>
                    <p className={`mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      If you have any questions about these Terms, please contact us at:
                    </p>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="flex items-center">
                        <PhoneIcon className="h-5 w-5 mr-3" />
                        <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>(123) 456-7890</span>
                      </div>
                      <div className="flex items-center">
                        <MailIcon className="h-5 w-5 mr-3" />
                        <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>terms@mountolivefarm.com</span>
                      </div>
                      <div className="flex items-center">
                        <MapPinIcon className="h-5 w-5 mr-3" />
                        <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>123 Farm Road, Countryside, CS 12345</span>
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

export default TermsofService;