import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const LoginPage = () => {
  const [formData, setFormData] = useState({ email:'', password:'', rememberMe:false });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showDemoCredentials, setShowDemoCredentials] = useState(false);
  const navigate = useNavigate();

  const handleChange = e => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type==='checkbox' ? checked : value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError("");
    setLoading(true);
    
    try {
      const res = await axios.post("http://localhost:5000/api/users/login", {
        email: formData.email,
        password: formData.password
      });

      const { token, role, firstName, lastName, email } = res.data;

      // Store authentication data
      localStorage.setItem("token", token);
      localStorage.setItem("role", role);
      localStorage.setItem("firstName", firstName);
      localStorage.setItem("lastName", lastName);
      localStorage.setItem("email", email);
      localStorage.setItem("name", `${firstName} ${lastName}`);
      
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
          navigate("/HealthManagement"); 
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
      setError(err.response?.data?.error || 
               err.response?.data?.message || 
               "Login failed. Please check your credentials.");
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl flex flex-col md:flex-row w-full max-w-4xl">
        {/* Left side - Login Form */}
        <div className="w-full md:w-2/3 p-5 md:p-12">
          <div className="text-left font-bold text-indigo-600 text-2xl mb-2">Mount Olive Farm</div>
          <div className="py-10">
            <h2 className="text-3xl font-bold text-gray-800 mb-2">Sign in to your account</h2>
            <div className="border-b-2 w-12 border-indigo-600 mb-8"></div>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <input 
                type="email" 
                name="email" 
                value={formData.email} 
                onChange={handleChange} 
                placeholder="Email" 
                required 
                className="p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500" 
              />
              <input 
                type="password" 
                name="password" 
                value={formData.password} 
                onChange={handleChange} 
                placeholder="Password" 
                required 
                className="p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500" 
              />
              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  id="rememberMe"
                  name="rememberMe" 
                  checked={formData.rememberMe} 
                  onChange={handleChange} 
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="rememberMe" className="text-gray-700">Remember me</label>
              </div>
              {error && <p className="text-red-500 bg-red-50 p-2 rounded-md">{error}</p>}
              <button 
                type="submit" 
                disabled={loading}
                className={`bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing in...
                  </>
                ) : 'Sign in'}
              </button>
            </form>
            
            {/* Demo credentials */}
            <div className="mt-6">
              <button 
                onClick={() => setShowDemoCredentials(!showDemoCredentials)}
                className="text-sm text-indigo-600 hover:text-indigo-800 font-medium mb-2"
              >
                {showDemoCredentials ? 'Hide Demo Credentials' : 'Show Demo Credentials'}
              </button>
              
              {showDemoCredentials && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 font-semibold mb-2">Demo Credentials:</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                    <p><span className="font-medium">Owner:</span> randiv.owner@mountolive.com<br/><span className="text-xs">Password: Owner123!</span></p>
                    <p><span className="font-medium">Animal:</span> john.animal@mountolive.com<br/><span className="text-xs">Password: Animal123!</span></p>
                    <p><span className="font-medium">Plant:</span> mary.plant@mountolive.com<br/><span className="text-xs">Password: Plant123!</span></p>
                    <p><span className="font-medium">Normal User:</span> Any email format<br/><span className="text-xs">Password: (as registered)</span></p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right side - Info + Register */}
        <div className="w-full md:w-1/3 bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-r-2xl p-12 flex flex-col justify-center items-center">
          <h3 className="text-2xl font-bold mb-4">Welcome back!</h3>
          <p className="text-center mb-6">Access your personalized dashboard to manage farm operations efficiently.</p>
          <div className="mt-6 text-center">
            <p className="text-sm">Don't have an account?</p>
            <button 
              onClick={() => navigate("/register")}
              className="mt-2 px-4 py-2 bg-white text-indigo-600 rounded-lg font-semibold hover:bg-gray-100 transition"
            >
              Register Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;