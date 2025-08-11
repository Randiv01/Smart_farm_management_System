import React from 'react';
import Navbar from '../Navbar/Navbar.js';
import './Home.css';

const Home = () => {
  return (
    <div className="home-container">
      <Navbar />

      <section className="hero-section">
        <div className="hero-content">
          <h1>Welcome to Sunshine Farm</h1>
          <p>Fresh Organic Produce & Sustainable Farming Since 1995</p>
          <button className="btn-primary" onClick={() => alert('Feeding animals...')}>
            🐾 Feed Our Animals
          </button>
        </div>
      </section>

      <section className="about-section">
        <div className="container">
          <h2>About Sunshine Farm</h2>
          <p>
            At Sunshine Farm, we are dedicated to sustainable, organic farming practices
            that nurture the earth and provide healthy produce. From fresh vegetables to
            happy animals, we take pride in our natural approach.
          </p>
        </div>
      </section>

      <section className="services-section">
        <div className="container">
          <h2>Our Farm Products</h2>
          <div className="services-cards">
            <div className="card">
              <img src="/images/vegetables.jpg" alt="Fresh Vegetables" />
              <h3>Fresh Vegetables</h3>
              <p>Grown organically and harvested daily for peak freshness.</p>
            </div>
            <div className="card">
              <img src="/images/dairy.jpg" alt="Dairy Products" />
              <h3>Dairy Products</h3>
              <p>From happy cows to your table, quality guaranteed.</p>
            </div>
            <div className="card">
              <img src="/images/honey.jpg" alt="Natural Honey" />
              <h3>Natural Honey</h3>
              <p>Pure, local honey straight from our beehives.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="testimonial-section">
        <div className="container">
          <h2>What Our Customers Say</h2>
          <div className="testimonial-cards">
            <div className="testimonial-card">
              <p>
                "Sunshine Farm’s veggies are the freshest I've ever tasted! Highly recommend."
              </p>
              <h4>- Mary P.</h4>
            </div>
            <div className="testimonial-card">
              <p>
                "The dairy products are creamy and delicious, and the farm feels so welcoming."
              </p>
              <h4>- John D.</h4>
            </div>
            <div className="testimonial-card">
              <p>
                "Love their honey! Such a pure natural taste. Truly farm-to-table."
              </p>
              <h4>- Linda K.</h4>
            </div>
          </div>
        </div>
      </section>

      <section className="contact-section">
        <div className="container">
          <h2>Get In Touch</h2>
          <p>Questions? Visit us or drop a message.</p>
          <address>
            123 Sunshine Lane, Green Valley<br />
            Phone: (555) 123-4567<br />
            Email: contact@sunshinefarm.com
          </address>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              alert('Thank you for subscribing!');
            }}
            className="newsletter-form"
          >
            <input
              type="email"
              placeholder="Enter your email"
              required
              aria-label="Email address"
            />
            <button type="submit" className="btn-primary">
              Subscribe
            </button>
          </form>
        </div>
      </section>

      <footer className="footer">
        <div className="container">
          <p>© 2025 Sunshine Farm. All Rights Reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Home;
