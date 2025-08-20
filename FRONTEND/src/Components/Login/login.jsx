import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const LoginPage = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle login logic here
    console.log('Login data:', formData);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl flex flex-col md:flex-row w-full max-w-4xl">
        {/* Left Side - Form */}
        <div className="w-full md:w-2/3 p-5 md:p-12">
          <div className="text-left font-bold text-indigo-600 text-2xl mb-2">
            YourAppName
          </div>
          <div className="py-10">
            <h2 className="text-3xl font-bold text-gray-800 mb-2">Sign in to your account</h2>
            <div className="border-b-2 w-12 border-indigo-600 mb-8"></div>
            
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label htmlFor="email" className="text-gray-600 text-sm">Email address</label>
                <input 
                  type="email" 
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  placeholder="Enter your email"
                  required
                />
              </div>
              
              <div className="flex flex-col gap-2 mt-4">
                <div className="flex justify-between items-center">
                  <label htmlFor="password" className="text-gray-600 text-sm">Password</label>
                  <Link to="/forgot-password" className="text-sm text-indigo-600 hover:text-indigo-800 transition-colors">
                    Forgot password?
                  </Link>
                </div>
                <input 
                  type="password" 
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  placeholder="Enter your password"
                  required
                />
              </div>
              
              <div className="flex items-center gap-2 mt-4">
                <input 
                  type="checkbox" 
                  id="rememberMe"
                  name="rememberMe"
                  checked={formData.rememberMe}
                  onChange={handleChange}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="rememberMe" className="text-gray-600 text-sm">Remember me</label>
              </div>
              
              <button 
                type="submit"
                className="bg-indigo-600 text-white rounded-lg py-3 px-4 font-medium mt-6 hover:bg-indigo-700 transition-colors shadow-md hover:shadow-lg"
              >
                Sign in
              </button>
            </form>
            
            <div className="mt-8 text-center">
              <p className="text-gray-600 text-sm">
                Don't have an account?{' '}
                <Link to="/signup" className="text-indigo-600 font-medium hover:text-indigo-800 transition-colors">
                  Sign up
                </Link>
              </p>
            </div>
          </div>
        </div>
        
        {/* Right Side - Illustration/Image */}
        <div className="w-full md:w-1/3 bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-b-2xl md:rounded-none md:rounded-r-2xl p-12 flex flex-col justify-center items-center">
          <div className="text-center">
            <h3 className="text-2xl font-bold mb-4">Welcome back!</h3>
            <p className="text-indigo-100 mb-6">
              Access your personalized dashboard and continue your journey with us.
            </p>
            <div className="bg-white/20 p-4 rounded-full inline-flex items-center justify-center mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <p className="text-sm text-indigo-200">
              Secure login with advanced encryption
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;