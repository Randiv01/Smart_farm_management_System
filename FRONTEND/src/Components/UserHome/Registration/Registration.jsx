// src/Components/UserHome/UHRegister/Register.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { 
  EyeIcon, 
  EyeOffIcon, 
  FacebookIcon, 
  TwitterIcon, 
  GithubIcon,
  ArrowLeftIcon,
  CheckIcon,
  CalendarIcon
} from 'lucide-react';
import { Helmet } from 'react-helmet';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    country: '',
    phone: '',
    gender: '',
    dateOfBirth: '',
    acceptTerms: false
  });
  
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [countries, setCountries] = useState([]);
  const navigate = useNavigate();

  // Set browser tab title
  useEffect(() => {
    document.title = "Register | Mount Olive Farm";
  }, []);

  // Country data with codes and validation patterns
  useEffect(() => {
    const countryData = [
      { name: 'Sri Lanka', code: 'LK', dialCode: '+94', pattern: /^[1-9][0-9]{8}$/ },
      { name: 'United States', code: 'US', dialCode: '+1', pattern: /^[2-9][0-9]{9}$/ },
      { name: 'United Kingdom', code: 'UK', dialCode: '+44', pattern: /^[1-9][0-9]{9}$/ },
      { name: 'India', code: 'IN', dialCode: '+91', pattern: /^[6-9][0-9]{9}$/ },
      { name: 'Australia', code: 'AU', dialCode: '+61', pattern: /^[0-9]{9}$/ },
    ];
    setCountries(countryData);
    
    // Set default country
    setFormData(prev => ({ ...prev, country: 'LK' }));
  }, []);

  const validateForm = () => {
    const newErrors = {};
    const selectedCountry = countries.find(c => c.code === formData.country);
    
    // First name validation
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    } else if (formData.firstName.length < 2) {
      newErrors.firstName = 'First name must be at least 2 characters';
    }
    
    // Last name validation
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    } else if (formData.lastName.length < 2) {
      newErrors.lastName = 'Last name must be at least 2 characters';
    }
    
    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/.test(formData.password)) {
      newErrors.password = 'Password must include uppercase, lowercase, number, and special character';
    }
    
    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    // Country validation
    if (!formData.country) {
      newErrors.country = 'Please select your country';
    }
    
    // Phone validation
    if (formData.phone) {
      const phoneWithoutSpaces = formData.phone.replace(/\s/g, '');
      if (selectedCountry && !selectedCountry.pattern.test(phoneWithoutSpaces)) {
        newErrors.phone = `Please enter a valid ${selectedCountry.name} phone number`;
      }
    }
    
    // Date of Birth validation - FIXED: Changed const to let for age variable
    if (formData.dateOfBirth) {
      const dob = new Date(formData.dateOfBirth);
      const today = new Date();
      let age = today.getFullYear() - dob.getFullYear(); // Changed from const to let
      const monthDiff = today.getMonth() - dob.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
        age--;
      }
      
      if (age < 18) {
        newErrors.dateOfBirth = 'You must be at least 18 years old';
      }
    }
    
    // Terms acceptance validation
    if (!formData.acceptTerms) {
      newErrors.acceptTerms = 'You must accept the terms and conditions';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = e => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handlePhoneChange = e => {
    const value = e.target.value;
    // Allow only numbers, plus sign, and spaces
    if (/^[0-9+\s]*$/.test(value)) {
      setFormData(prev => ({ ...prev, phone: value }));
      
      if (errors.phone) {
        setErrors(prev => ({ ...prev, phone: '' }));
      }
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    
    try {
      // Format phone number with country code
      const selectedCountry = countries.find(c => c.code === formData.country);
      let formattedPhone = formData.phone;
      if (formattedPhone && selectedCountry) {
        // Remove any existing country code and add the correct one
        formattedPhone = formattedPhone.replace(/^\+?[0-9\s]*/, '');
        formattedPhone = `${selectedCountry.dialCode} ${formattedPhone}`;
      }
      
      // Make actual API call to register user
      const response = await axios.post("http://localhost:5000/api/users/register", {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
        phone: formattedPhone || null,
        country: formData.country,
        gender: formData.gender || null,
        dateOfBirth: formData.dateOfBirth || null
      });

      console.log("Registration response:", response.data);
      
      // Show success animation
      setShowSuccess(true);
      
      // Redirect to login after animation completes
      setTimeout(() => {
        navigate('/login');
      }, 2500);
      
    } catch (err) {
      console.error("Registration error:", err);
      setErrors({ 
        submit: err.response?.data?.error || 
                err.response?.data?.message || 
                'Registration failed. Please try again.' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSocialRegister = (provider) => {
    console.log(`Registering with ${provider}`);
    setErrors({ submit: `${provider} registration would be implemented here` });
  };

  const SuccessAnimation = () => (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-2xl shadow-2xl flex flex-col items-center transform scale-100 animate-pop-in">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
          <CheckIcon className="w-12 h-12 text-green-500 animate-checkmark" />
        </div>
        <h3 className="text-2xl font-bold text-gray-800 mb-2">Registration Successful!</h3>
        <p className="text-gray-600 mb-6">You will be redirected to login shortly</p>
        <div className="w-48 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full bg-green-600 rounded-full animate-progress"></div>
        </div>
      </div>
    </div>
  );

  const selectedCountry = countries.find(c => c.code === formData.country);

  return (
    <>
      <Helmet>
        <title>Register | Mount Olive Farm Marketplace</title>
        <meta name="description" content="Create an account to access our farm marketplace with exclusive benefits." />
      </Helmet>
      
      <div className="min-h-screen bg-gradient-to-br from-light-beige/80 to-light-beige flex items-center justify-center p-4">
        <div className="bg-soft-white rounded-2xl shadow-2xl flex flex-col md:flex-row w-full max-w-5xl overflow-hidden">
          <div className="w-full md:w-2/3 p-5 md:p-10">
            <Link to="/" className="inline-flex items-center text-dark-green hover:text-green-900 mb-6 transition-colors">
              <ArrowLeftIcon className="h-4 w-4 mr-1" />
              Back to Home
            </Link>
            
            <div className="flex justify-between items-center mb-6">
              <div className="font-bold text-dark-green text-2xl flex items-center">
                <img 
                  src="/logo.png" 
                  alt="Mount Olive Farm Marketplace Logo" 
                  className="h-8 w-8 mr-2" 
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "/favicon.ico";
                  }}
                />
                Mount Olive Farm House
              </div>
              
              </div>
                <div className="mt-6 text-left">
                <p className="text-gray-600 text-lg">
                  Already have an account?{' '}
                  <Link 
                    to="/login" 
                    className="text-dark-green font-semibold hover:text-green-900 hover:underline transition-colors duration-200"
                  >
                    Sign in
                  </Link>
                </p>
              </div>


            <div className="py-6">
              <h2 className="text-3xl font-bold text-gray-800 mb-2">Create your account</h2>
              <p className="text-gray-600 mb-8">Join our farm community today</p>
              
              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                  <input 
                    type="text" 
                    name="firstName" 
                    value={formData.firstName} 
                    onChange={handleChange} 
                    placeholder="John" 
                    className={`w-full p-3 rounded-lg border ${errors.firstName ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-dark-green focus:border-transparent transition`} 
                  />
                  {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                  <input 
                    type="text" 
                    name="lastName" 
                    value={formData.lastName} 
                    onChange={handleChange} 
                    placeholder="Doe" 
                    className={`w-full p-3 rounded-lg border ${errors.lastName ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-dark-green focus:border-transparent transition`} 
                  />
                  {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>}
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
                  <input 
                    type="email" 
                    name="email" 
                    value={formData.email} 
                    onChange={handleChange} 
                    placeholder="john.doe@example.com" 
                    className={`w-full p-3 rounded-lg border ${errors.email ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-dark-green focus:border-transparent transition`} 
                  />
                  {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                  <div className="relative">
                    <input 
                      type={showPassword ? "text" : "password"} 
                      name="password" 
                      value={formData.password} 
                      onChange={handleChange} 
                      placeholder="••••••••" 
                      className={`w-full p-3 rounded-lg border ${errors.password ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-dark-green focus:border-transparent transition pr-10`} 
                    />
                    <button 
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
                    >
                      {showPassword ? <EyeOffIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                    </button>
                  </div>
                  {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
                  <div className="mt-1 text-xs text-gray-500">
                    Must include uppercase, lowercase, number, special character, and be at least 8 characters long.
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password *</label>
                  <div className="relative">
                    <input 
                      type={showConfirmPassword ? "text" : "password"} 
                      name="confirmPassword" 
                      value={formData.confirmPassword} 
                      onChange={handleChange} 
                      placeholder="••••••••" 
                      className={`w-full p-3 rounded-lg border ${errors.confirmPassword ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-dark-green focus:border-transparent transition pr-10`} 
                    />
                    <button 
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
                    >
                      {showConfirmPassword ? <EyeOffIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                    </button>
                  </div>
                  {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Country *</label>
                  <select
                    name="country"
                    value={formData.country}
                    onChange={handleChange}
                    className={`w-full p-3 rounded-lg border ${errors.country ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-dark-green focus:border-transparent transition`}
                  >
                    <option value="">Select Country</option>
                    {countries.map(country => (
                      <option key={country.code} value={country.code}>
                        {country.name} ({country.dialCode})
                      </option>
                    ))}
                  </select>
                  {errors.country && <p className="text-red-500 text-xs mt-1">{errors.country}</p>}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number {selectedCountry && `(${selectedCountry.dialCode})`}
                  </label>
                  <div className="flex">
                    {selectedCountry && (
                      <div className="flex items-center justify-center px-3 rounded-l-lg border border-r-0 border-gray-300 bg-gray-50 text-gray-500">
                        {selectedCountry.dialCode}
                      </div>
                    )}
                    <input 
                      type="tel" 
                      name="phone" 
                      value={formData.phone} 
                      onChange={handlePhoneChange} 
                      placeholder={selectedCountry ? "Enter your phone number" : "Select country first"}
                      disabled={!selectedCountry}
                      className={`w-full p-3 rounded-r-lg border ${errors.phone ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-dark-green focus:border-transparent transition ${!selectedCountry ? 'bg-gray-100' : ''}`} 
                    />
                  </div>
                  {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
                  {selectedCountry && (
                    <div className="mt-1 text-xs text-gray-500">
                      Format: {selectedCountry.name} phone numbers should match the local format.
                    </div>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Gender (Optional)</label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-dark-green focus:border-transparent transition"
                  >
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth (Optional)</label>
                  <div className="relative">
                    <input 
                      type="date" 
                      name="dateOfBirth" 
                      value={formData.dateOfBirth} 
                      onChange={handleChange} 
                      max={new Date().toISOString().split('T')[0]}
                      className={`w-full p-3 rounded-lg border ${errors.dateOfBirth ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-dark-green focus:border-transparent transition`} 
                    />
                  </div>
                  {errors.dateOfBirth && <p className="text-red-500 text-xs mt-1">{errors.dateOfBirth}</p>}
                </div>
                
                <div className="md:col-span-2">
                  <div className="flex items-start gap-3">
                    <input 
                      type="checkbox" 
                      id="acceptTerms"
                      name="acceptTerms" 
                      checked={formData.acceptTerms} 
                      onChange={handleChange} 
                      className="h-5 w-5 mt-0.5 text-dark-green focus:ring-dark-green border-gray-300 rounded"
                    />
                    <label htmlFor="acceptTerms" className="text-sm text-gray-700">
                      I agree to the <a href="#" className="text-dark-green hover:text-green-900">Terms and Conditions</a> and <a href="#" className="text-dark-green hover:text-green-900">Privacy Policy</a>
                    </label>
                  </div>
                  {errors.acceptTerms && <p className="text-red-500 text-xs mt-1">{errors.acceptTerms}</p>}
                </div>
                
                {errors.submit && (
                  <div className="md:col-span-2">
                    <div className="bg-red-50 text-red-700 p-3 rounded-md flex items-start">
                      <svg className="h-5 w-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                      <span>{errors.submit}</span>
                    </div>
                  </div>
                )}
                
                <div className="md:col-span-2">
                  <button 
                    type="submit" 
                    disabled={loading}
                    className={`w-full bg-dark-green text-soft-white py-3 rounded-lg hover:bg-green-800 transition flex items-center justify-center ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Creating account...
                      </>
                    ) : 'Create Account'}
                  </button>
                </div>
              </form>

              <div className="flex items-center my-6">
                <div className="flex-grow border-t border-gray-300"></div>
                <span className="mx-4 text-gray-500 text-sm">Or register with email</span>
                <div className="flex-grow border-t border-gray-300"></div>
              </div>

              {/* Social Register Buttons */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <button 
                  onClick={() => handleSocialRegister('Facebook')}
                  className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-soft-white py-2.5 px-4 rounded-lg transition-colors"
                >
                  <FacebookIcon className="h-5 w-5" />
                  <span className="text-sm">Facebook</span>
                </button>
                <button 
                  onClick={() => handleSocialRegister('Google')}
                  className="flex items-center justify-center gap-2 bg-soft-white border border-gray-300 hover:bg-light-beige/30 text-gray-700 py-2.5 px-4 rounded-lg transition-colors"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  <span className="text-sm">Google</span>
                </button>
              </div>
            </div>
          </div>
          
          <div className="w-full md:w-1/3 bg-gradient-to-br from-dark-green to-green-900 text-soft-white p-10 flex flex-col justify-center relative overflow-hidden">
            <div className="absolute inset-0 bg-black opacity-10"></div>
            <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-soft-white rounded-full opacity-5"></div>
            <div className="absolute -left-10 -top-10 w-36 h-36 bg-soft-white rounded-full opacity-5"></div>
            
            <div className="relative z-10 text-center">
              <div className="w-20 h-20 bg-soft-white bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-soft-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path>
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-4">Mount Olive Farm House</h3>
              <p className="mb-6">Create an account to access our farm marketplace with exclusive benefits.</p>
              
              <div className="space-y-3 text-left">
                <div className="flex items-center">
                  <div className="w-6 h-6 bg-soft-white bg-opacity-20 rounded-full flex items-center justify-center mr-3">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                  </div>
                  <span>Place bulk orders for animals, plants, and farm products</span>
                </div>
                
                <div className="flex items-center">
                  <div className="w-6 h-6 bg-soft-white bg-opacity-20 rounded-full flex items-center justify-center mr-3">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                  </div>
                  <span>Track your orders and delivery status</span>
                </div>
                
                <div className="flex items-center">
                  <div className="w-6 h-6 bg-soft-white bg-opacity-20 rounded-full flex items-center justify-center mr-3">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                  </div>
                  <span>Access promotions and farm updates</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {showSuccess && <SuccessAnimation />}
      
      <style jsx>{`
        @keyframes pop-in {
          0% { transform: scale(0.8); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        
        @keyframes checkmark {
          0% { transform: scale(0); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        
        @keyframes progress {
          0% { width: 0%; }
          100% { width: 100%; }
        }
        
        .animate-pop-in {
          animation: pop-in 0.5s ease-out forwards;
        }
        
        .animate-checkmark {
          animation: checkmark 0.5s ease-in-out forwards 0.5s;
        }
        
        .animate-progress {
          animation: progress 2s ease-in-out forwards;
        }
      `}</style>
    </>
  );
};

export default RegisterPage;