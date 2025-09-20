// src/Components/UserHome/Login/login.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { 
  EyeIcon, 
  EyeOffIcon, 
  ArrowLeftIcon
} from 'lucide-react';
import { useAuth } from '../UHContext/UHAuthContext';

const LoginPage = () => {
  const [formData, setFormData] = useState({ 
    email: '', 
    password: '', 
    rememberMe: false 
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showDemoCredentials, setShowDemoCredentials] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth(); // ✅ use AuthContext

  // Set browser tab title
  useEffect(() => {
    document.title = "Login | Mount Olive Farm";
  }, []);

  // API URL with fallback
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

  const handleChange = e => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError("");
    setLoading(true);
    
    try {
      console.log("Attempting login with URL:", `${API_URL}/api/users/login`);
      
      const res = await axios.post(`${API_URL}/api/users/login`, {
        email: formData.email,
        password: formData.password
      });

      const { token, role, firstName, lastName, email } = res.data;

      // ✅ Pass to AuthContext login (handles localStorage + state)
      await login({
        token,
        role,
        firstName,
        lastName,
        email,
        name: `${(firstName || '').trim()} ${(lastName || '').trim()}`.trim() || (email ? email.split('@')[0] : '')
      });

      // Remember Me
      if (formData.rememberMe) {
        localStorage.setItem("rememberMe", "true");
        localStorage.setItem("savedEmail", formData.email);
      } else {
        localStorage.removeItem("rememberMe");
        localStorage.removeItem("savedEmail");
      }

      // Redirect based on role
      switch(role) {
        case "animal": 
          navigate("/AnimalManagement"); 
          break;
        case "plant": 
          navigate("/PlantManagement"); 
          break;
        case "inv": 
          navigate("/InventoryManagement"); 
          break;
        case "emp": 
          navigate("/EmployeeManagement"); 
          break;
        case "health": 
          navigate("/doctor/home"); 
          break;
        case "owner": 
          navigate("/OwnerDashboard"); 
          break;
        default: 
          navigate("/"); 
          break;
      }

    } catch (err) {
      console.error("Login error details:", err);
      console.error("Error response:", err?.response);
      
      setError(err?.response?.data?.error || 
               err?.response?.data?.message || 
               err?.message ||
               "Login failed. Please check your credentials and try again.");
    } finally {
      setLoading(false);
    }
  };

  // Load remembered email
  useEffect(() => {
    const remembered = localStorage.getItem("rememberMe");
    const savedEmail = localStorage.getItem("savedEmail");
    if (remembered === "true" && savedEmail) {
      setFormData(prev => ({ ...prev, email: savedEmail, rememberMe: true }));
    }
  }, []);

  const handleSocialLogin = (provider) => {
    // Redirect to OAuth endpoint for the provider
    // If you don't have social auth implemented on backend, this will 404 — adjust accordingly.
    window.location.href = `${API_URL}/api/auth/${provider.toLowerCase()}`;
  };

  const fillDemoCredentials = (email, password) => {
    setFormData({
      email: email,
      password: password,
      rememberMe: false
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-light-beige/80 to-light-beige flex items-center justify-center p-4">
      <div className="bg-soft-white rounded-2xl shadow-2xl flex flex-col md:flex-row w-full max-w-4xl overflow-hidden">
        
        {/* Left side - Login Form */}
        <div className="w-full md:w-2/3 p-5 md:p-12">
          <Link to="/" className="inline-flex items-center text-dark-green hover:text-green-900 mb-6 transition-colors">
            <ArrowLeftIcon className="h-4 w-4 mr-1" />
            Back to Home
          </Link>
          
          <div className="text-left font-bold text-dark-green text-2xl mb-2 flex items-center">
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
          
          <div className="py-8">
            <h2 className="text-3xl font-bold text-gray-800 mb-2">Welcome back</h2>
            <p className="text-gray-600 mb-8">Sign in to access your account</p>
            
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input 
                  type="email" 
                  name="email" 
                  value={formData.email} 
                  onChange={handleChange} 
                  placeholder="Enter your email" 
                  required 
                  className="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-dark-green focus:border-transparent transition" 
                />
              </div>
              
              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <div className="relative">
                  <input 
                    type={showPassword ? "text" : "password"} 
                    name="password" 
                    value={formData.password} 
                    onChange={handleChange} 
                    placeholder="Enter your password" 
                    required 
                    className="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-dark-green focus:border-transparent transition pr-10" 
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOffIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                  </button>
                </div>
              </div>
              
              {/* Remember Me + Forgot Password */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    id="rememberMe"
                    name="rememberMe" 
                    checked={formData.rememberMe} 
                    onChange={handleChange} 
                    className="h-4 w-4 text-dark-green focus:ring-dark-green border-gray-300 rounded"
                  />
                  <label htmlFor="rememberMe" className="text-sm text-gray-700">Remember me</label>
                </div>
                <Link to="/forgot-password" className="text-sm text-dark-green hover:text-green-900">
                  Forgot password?
                </Link>
              </div>
              
              {/* Error message */}
              {error && (
                <div className="bg-red-50 text-red-700 p-3 rounded-md flex items-start">
                  <svg className="h-5 w-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <span>{error}</span>
                </div>
              )}
              
              {/* Submit */}
              <button 
                type="submit" 
                disabled={loading}
                className={`w-full bg-dark-green text-soft-white py-3 rounded-lg hover:bg-green-800 transition flex items-center justify-center ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing in...
                  </>
                ) : 'Sign in'}
              </button>
            </form>
            
            {/* Social Login */}
            <div className="flex items-center my-6">
              <div className="flex-grow border-t border-gray-300" aria-hidden="true"></div>
              <span className="mx-4 text-gray-500 text-sm">Or continue with</span>
              <div className="flex-grow border-t border-gray-300" aria-hidden="true"></div>
            </div>
            
            <div className="grid grid-cols-2 gap-3 mb-6">
              <button 
                onClick={() => handleSocialLogin('Google')}
                className="flex items-center justify-center gap-2 bg-soft-white border border-gray-300 hover:bg-light-beige/30 text-gray-700 py-2.5 px-4 rounded-lg transition-colors"
                type="button"
                aria-label="Continue with Google"
              >
                {/* Google Icon */}
                <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span className="text-sm">Google</span>
              </button>
              <button 
                onClick={() => handleSocialLogin('Facebook')}
                className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-soft-white py-2.5 px-4 rounded-lg transition-colors"
                type="button"
                aria-label="Continue with Facebook"
              >
                {/* Facebook Icon */}
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                <span className="text-sm">Facebook</span>
              </button>
            </div>
            
            <div className="mt-6 text-center">
              <p className="text-gray-600">
                Don't have an account?{' '}
                <Link to="/register" className="text-dark-green hover:text-green-900 font-semibold">
                  Sign up
                </Link>
              </p>
            </div>
          </div>
        </div>

        {/* Right side - Info */}
        <div className="w-full md:w-1/3 bg-gradient-to-br from-dark-green to-green-900 text-soft-white p-10 flex flex-col justify-center relative overflow-hidden">
          <div className="absolute inset-0 bg-black opacity-10" aria-hidden="true"></div>
          <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-soft-white rounded-full opacity-5" aria-hidden="true"></div>
          <div className="absolute -left-10 -top-10 w-36 h-36 bg-soft-white rounded-full opacity-5" aria-hidden="true"></div>
          
          <div className="relative z-10 text-center">
            <div className="w-20 h-20 bg-soft-white bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-soft-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path>
              </svg>
            </div>
            <h3 className="text-2xl font-bold mb-4">Mount Olive Farm House</h3>
            <p className="mb-6">Access your personalized account to order fresh farm products with ease.</p>
            
            <div className="space-y-3 text-left">
              <div className="flex items-center">
                <div className="w-6 h-6 bg-soft-white bg-opacity-20 rounded-full flex items-center justify-center mr-3">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                </div>
                <span>Bulk order animal and plant products</span>
              </div>
              
              <div className="flex items-center">
                <div className="w-6 h-6 bg-soft-white bg-opacity-20 rounded-full flex items-center justify-center mr-3">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                </div>
                <span>Track your past orders and deliveries</span>
              </div>
              
              <div className="flex items-center">
                <div className="w-6 h-6 bg-soft-white bg-opacity-20 rounded-full flex items-center justify-center mr-3">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                </div>
                <span>Get updates on seasonal harvests & offers</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default LoginPage;
