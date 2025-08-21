import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    acceptTerms: false
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const navigate = useNavigate();

  const validateForm = () => {
    const newErrors = {};
    
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
    }
    
    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    // Phone validation
    if (formData.phone && !/^[\+]?[1-9][\d]{0,15}$/.test(formData.phone.replace(/[\s\-\(\)]/g, ''))) {
      newErrors.phone = 'Please enter a valid phone number';
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

  const handleSubmit = async e => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    
    try {
      // Make actual API call to register user
      const response = await axios.post("http://localhost:5000/api/users/register", {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
        phone: formData.phone || null
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

  const SuccessAnimation = () => (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-2xl shadow-2xl flex flex-col items-center transform scale-100 animate-pop-in">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
          <svg className="w-12 h-12 text-green-500 animate-checkmark" viewBox="0 0 52 52">
            <circle className="stroke-green-500" cx="26" cy="26" r="25" fill="none" strokeWidth="2"/>
            <path className="stroke-green-500" fill="none" strokeWidth="4" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
          </svg>
        </div>
        <h3 className="text-2xl font-bold text-gray-800 mb-2">Registration Successful!</h3>
        <p className="text-gray-600 mb-6">You will be redirected to login shortly</p>
        <div className="w-48 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full bg-indigo-600 rounded-full animate-progress"></div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl flex flex-col md:flex-row w-full max-w-5xl overflow-hidden">
          <div className="w-full md:w-2/3 p-5 md:p-10">
            <div className="flex justify-between items-center mb-6">
              <Link to="/" className="text-2xl font-bold text-indigo-600">Mount Olive Farm</Link>
              <Link to="/login" className="text-indigo-600 hover:text-indigo-800 font-medium">
                Already have an account? <span className="font-semibold">Sign in</span>
              </Link>
            </div>
            
            <div className="py-6">
              <h2 className="text-3xl font-bold text-gray-800 mb-2">Create your account</h2>
              <div className="border-b-2 w-12 border-indigo-600 mb-8"></div>
              
              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                  <input 
                    type="text" 
                    name="firstName" 
                    value={formData.firstName} 
                    onChange={handleChange} 
                    placeholder="John" 
                    className={`w-full p-3 rounded-lg border ${errors.firstName ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-indigo-500 transition`} 
                  />
                  {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                  <input 
                    type="text" 
                    name="lastName" 
                    value={formData.lastName} 
                    onChange={handleChange} 
                    placeholder="Doe" 
                    className={`w-full p-3 rounded-lg border ${errors.lastName ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-indigo-500 transition`} 
                  />
                  {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>}
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                  <input 
                    type="email" 
                    name="email" 
                    value={formData.email} 
                    onChange={handleChange} 
                    placeholder="john.doe@example.com" 
                    className={`w-full p-3 rounded-lg border ${errors.email ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-indigo-500 transition`} 
                  />
                  {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                  <input 
                    type="password" 
                    name="password" 
                    value={formData.password} 
                    onChange={handleChange} 
                    placeholder="••••••••" 
                    className={`w-full p-3 rounded-lg border ${errors.password ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-indigo-500 transition`} 
                  />
                  {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                  <input 
                    type="password" 
                    name="confirmPassword" 
                    value={formData.confirmPassword} 
                    onChange={handleChange} 
                    placeholder="••••••••" 
                    className={`w-full p-3 rounded-lg border ${errors.confirmPassword ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-indigo-500 transition`} 
                  />
                  {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>}
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number (Optional)</label>
                  <input 
                    type="tel" 
                    name="phone" 
                    value={formData.phone} 
                    onChange={handleChange} 
                    placeholder="0772500123" 
                    className={`w-full p-3 rounded-lg border ${errors.phone ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-indigo-500 transition`} 
                  />
                  {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
                </div>
                
                <div className="md:col-span-2">
                  <div className="flex items-start gap-2">
                    <input 
                      type="checkbox" 
                      id="acceptTerms"
                      name="acceptTerms" 
                      checked={formData.acceptTerms} 
                      onChange={handleChange} 
                      className="h-5 w-5 mt-1 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label htmlFor="acceptTerms" className="text-sm text-gray-700">
                      I agree to the <a href="#" className="text-indigo-600 hover:text-indigo-800">Terms and Conditions</a> and <a href="#" className="text-indigo-600 hover:text-indigo-800">Privacy Policy</a>
                    </label>
                  </div>
                  {errors.acceptTerms && <p className="text-red-500 text-xs mt-1">{errors.acceptTerms}</p>}
                </div>
                
                {errors.submit && (
                  <div className="md:col-span-2">
                    <p className="text-red-500 bg-red-50 p-3 rounded-md">{errors.submit}</p>
                  </div>
                )}
                
                <div className="md:col-span-2">
                  <button 
                    type="submit" 
                    disabled={loading}
                    className={`w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition flex items-center justify-center ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
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
            </div>
          </div>
          
          <div className="w-full md:w-1/3 bg-gradient-to-br from-indigo-600 to-purple-600 text-white p-10 flex flex-col justify-center">
            <div className="text-center">
              <h3 className="text-2xl font-bold mb-4">Join Mount Olive Farm Community</h3>
              <p className="mb-6">Create an account to access farm updates, events, and exclusive content.</p>
              
              <div className="space-y-4">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center mr-3">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                  </div>
                  <span>Get farm updates and news</span>
                </div>
                
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center mr-3">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                  </div>
                  <span>Register for farm events</span>
                </div>
                
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center mr-3">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                  </div>
                  <span>Access exclusive content</span>
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
          0% { stroke-dashoffset: 50; }
          100% { stroke-dashoffset: 0; }
        }
        
        @keyframes progress {
          0% { width: 0%; }
          100% { width: 100%; }
        }
        
        .animate-pop-in {
          animation: pop-in 0.5s ease-out forwards;
        }
        
        .animate-checkmark circle {
          stroke-dasharray: 166;
          stroke-dashoffset: 166;
          animation: checkmark 0.6s ease-in-out forwards 0.5s;
        }
        
        .animate-checkmark path {
          stroke-dasharray: 48;
          stroke-dashoffset: 48;
          animation: checkmark 0.5s ease-in-out forwards 1s;
        }
        
        .animate-progress {
          animation: progress 2s ease-in-out forwards;
        }
      `}</style>
    </>
  );
};

export default RegisterPage;