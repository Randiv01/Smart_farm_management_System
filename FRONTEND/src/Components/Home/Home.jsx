import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../Navbar/Navbar.js";

const Home = () => {
  const navigate = useNavigate();
  const role = localStorage.getItem("role");

  
  return (
    <div className="home-container font-sans">
      <Navbar />

      {/* Hero Section */}
      <section className="bg-green-50 py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-green-800 mb-4">
            Welcome to Sunshine Farm
          </h1>
          <p className="text-lg md:text-2xl text-green-700 mb-8">
            Fresh Organic Produce & Sustainable Farming Since 1995
          </p>
          <button
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition"
            onClick={() => alert("Feeding animals...")}
          >
            🐾 Feed Our Animals
          </button>
        </div>
      </section>

      {/* About Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 text-center max-w-3xl">
          <h2 className="text-3xl font-bold text-green-800 mb-4">About Sunshine Farm</h2>
          <p className="text-green-700">
            At Sunshine Farm, we are dedicated to sustainable, organic farming practices
            that nurture the earth and provide healthy produce. From fresh vegetables to
            happy animals, we take pride in our natural approach.
          </p>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-20 bg-green-50">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-green-800 mb-12">Our Farm Products</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-lg shadow p-6">
              <img src="/images/vegetables.jpg" alt="Fresh Vegetables" className="rounded mb-4 w-full h-48 object-cover" />
              <h3 className="text-xl font-semibold mb-2">Fresh Vegetables</h3>
              <p>Grown organically and harvested daily for peak freshness.</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <img src="/images/dairy.jpg" alt="Dairy Products" className="rounded mb-4 w-full h-48 object-cover" />
              <h3 className="text-xl font-semibold mb-2">Dairy Products</h3>
              <p>From happy cows to your table, quality guaranteed.</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <img src="/images/honey.jpg" alt="Natural Honey" className="rounded mb-4 w-full h-48 object-cover" />
              <h3 className="text-xl font-semibold mb-2">Natural Honey</h3>
              <p>Pure, local honey straight from our beehives.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonial Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-green-800 mb-12">What Our Customers Say</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-green-50 p-6 rounded shadow">
              <p className="mb-4">"Sunshine Farm’s veggies are the freshest I've ever tasted! Highly recommend."</p>
              <h4 className="font-semibold text-green-800">- Mary P.</h4>
            </div>
            <div className="bg-green-50 p-6 rounded shadow">
              <p className="mb-4">"The dairy products are creamy and delicious, and the farm feels so welcoming."</p>
              <h4 className="font-semibold text-green-800">- John D.</h4>
            </div>
            <div className="bg-green-50 p-6 rounded shadow">
              <p className="mb-4">"Love their honey! Such a pure natural taste. Truly farm-to-table."</p>
              <h4 className="font-semibold text-green-800">- Linda K.</h4>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-20 bg-green-100">
        <div className="container mx-auto px-4 text-center max-w-3xl">
          <h2 className="text-3xl font-bold text-green-800 mb-4">Get In Touch</h2>
          <p className="mb-6">Questions? Visit us or drop a message.</p>
          <address className="mb-6 not-italic text-green-700">
            123 Sunshine Lane, Green Valley<br />
            Phone: (555) 123-4567<br />
            Email: contact@sunshinefarm.com
          </address>
          <form
            onSubmit={(e) => { e.preventDefault(); alert('Thank you for subscribing!'); }}
            className="flex flex-col md:flex-row gap-4 justify-center"
          >
            <input
              type="email"
              placeholder="Enter your email"
              required
              className="p-3 rounded border border-green-300 w-full md:w-auto flex-1"
            />
            <button type="submit" className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition">
              Subscribe
            </button>
          </form>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-green-800 text-white py-6 mt-10">
        <div className="container mx-auto px-4 text-center">
          <p>© 2025 Sunshine Farm. All Rights Reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Home;
