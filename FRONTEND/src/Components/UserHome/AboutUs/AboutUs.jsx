import React, { useEffect, useState } from "react";
import Navbar from '../UHNavbar/UHNavbar';
import Footer from '../UHFooter/UHFooter';
import { useTheme } from "../UHContext/UHThemeContext";
import ChatBot from '../UHChatbot/UHChatbot';

// Hero images (update paths or use URLs)
import hero1 from "../Images/AboutUs1.jpg";
import hero2 from "../Images/AboutUs2.jpg";
import hero3 from "../Images/AboutUs3.jpg";
import hero4 from "../Images/AboutUs4.jpg";

// Team member images
import ceoImg from "../Images/ceoAboutUs.jpg";
import ctoImg from "../Images/CtoAboutUs.webp";
import pmImg from "../Images/projectManagerAboutUs.jpeg";

const AboutUs = () => {
  const { darkMode } = useTheme();

  // Reveal on scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          const el = entry.target;
          if (entry.isIntersecting) {
            el.classList.add("opacity-100", "translate-y-0", "scale-100");
            el.classList.remove("opacity-0", "translate-y-10", "scale-95");
            obs.unobserve(el);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -10% 0px" }
    );

    document.querySelectorAll(".animate-on-scroll").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  // Hero slideshow
  const slides = [hero1, hero2, hero3, hero4];
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const [cartItems] = useState([]);

  // Preload images
  useEffect(() => {
    slides.forEach((src) => {
      const img = new Image();
      img.src = src;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    document.title = "About | Mount Olive Farm";
  }, []);

  // Auto-rotate
  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => setCurrent((i) => (i + 1) % slides.length), 5000);
    return () => clearInterval(id);
  }, [paused, slides.length]);

  const prevSlide = () => setCurrent((i) => (i - 1 + slides.length) % slides.length);
  const nextSlide = () => setCurrent((i) => (i + 1) % slides.length);

  const handleCartClick = () => {
    console.log("Cart clicked");
  };

  return (
    <div className={`relative min-h-screen overflow-hidden ${darkMode ? "bg-gray-900 text-white" : "bg-gradient-to-b from-emerald-50 via-green-50 to-white text-gray-900"}`}>
      {/* Navbar */}
      <Navbar cartItems={cartItems} onCartClick={handleCartClick} />
      <ChatBot/>
      
      {/* Modern Hero Section */}
      <section className="relative w-full overflow-hidden">
        <div className="relative h-[85vh] w-full flex items-center justify-center">
          {/* Slideshow background */}
          <div className="absolute inset-0 w-full h-full">
            {slides.map((src, i) => (
              <div
                key={i}
                className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ease-in-out ${
                  i === current ? "opacity-100" : "opacity-0"
                }`}
              >
                <img
                  src={src}
                  alt={`About Us slide ${i + 1}`}
                  className="w-full h-full object-cover"
                  loading="eager"
                  draggable="false"
                />
                <div className="absolute inset-0 bg-black/40"></div>
              </div>
            ))}
          </div>

          {/* Content */}
          <div className="relative z-10 max-w-7xl mx-auto px-6 text-center text-white">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              Cultivating <span className="text-emerald-400">Tomorrow's</span> Harvest
            </h1>
            
            <p className="text-xl md:text-2xl max-w-3xl mx-auto mb-8 font-light">
              Pioneering sustainable agriculture through innovation, technology, and decades of expertise.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button className="px-8 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full font-medium transition-all duration-300 transform hover:-translate-y-1 shadow-lg hover:shadow-emerald-500/30">
                Explore Our Story
              </button>
              <button className="px-8 py-3 bg-transparent border-2 border-white hover:bg-white/10 text-white rounded-full font-medium transition-all duration-300">
                Watch Video
              </button>
            </div>
            
            {/* Stats counter */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16 max-w-4xl mx-auto">
              {[
                { number: "100+", label: "Farms Managed" },
                { number: "25+", label: "Years Experience" },
                { number: "5000+", label: "Happy Customers" },
                { number: "12", label: "Awards Won" }
              ].map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-3xl md:text-4xl font-bold text-emerald-400">{stat.number}</div>
                  <div className="text-sm md:text-base opacity-90">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Scroll indicator */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
            <div className="animate-bounce">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* Main content */}
      <div className="mx-auto flex max-w-7xl flex-col items-center px-6 py-12 md:px-12 md:py-16">
        {/* Mission, Vision, Values */}
        <div className="mt-4 grid w-full max-w-7xl grid-cols-1 gap-6 md:grid-cols-3">
          {/* Card 1 */}
          <div className="group relative animate-on-scroll opacity-0 translate-y-10 scale-95 transition-all duration-1000 delay-100">
            <div className={`absolute inset-0 rounded-3xl bg-gradient-to-br from-green-500/25 via-emerald-400/20 to-green-500/25 opacity-70 blur-sm transition group-hover:opacity-100 ${darkMode ? "from-green-700/25 via-emerald-600/20 to-green-700/25" : ""}`} />
            <div className={`relative rounded-3xl ${darkMode ? "bg-gray-800/80 text-white" : "bg-white/80 text-gray-900"} p-8 shadow-lg ring-1 ${darkMode ? "ring-green-800" : "ring-green-100"} backdrop-blur-sm transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-xl ${darkMode ? "group-hover:ring-green-600" : "group-hover:ring-green-300"}`}>
              <div className={`mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl ${darkMode ? "bg-green-900/30 text-green-300" : "bg-green-100 text-green-700"}`}>
                <span className="text-2xl">🎯</span>
              </div>
              <h2 className={`text-3xl font-bold ${darkMode ? "text-green-300" : "text-green-700"} mb-3`}>Our Mission</h2>
              <p className={`${darkMode ? "text-gray-300" : "text-gray-600"} leading-relaxed`}>
                Revolutionize farming with smart solutions for sustainable growth.
              </p>
            </div>
          </div>

          {/* Card 2 */}
          <div className="group relative animate-on-scroll opacity-0 translate-y-10 scale-95 transition-all duration-1000 delay-200">
            <div className={`absolute inset-0 rounded-3xl bg-gradient-to-br from-green-500/25 via-emerald-400/20 to-green-500/25 opacity-70 blur-sm transition group-hover:opacity-100 ${darkMode ? "from-green-700/25 via-emerald-600/20 to-green-700/25" : ""}`} />
            <div className={`relative rounded-3xl ${darkMode ? "bg-gray-800/80 text-white" : "bg-white/80 text-gray-900"} p-8 shadow-lg ring-1 ${darkMode ? "ring-green-800" : "ring-green-100"} backdrop-blur-sm transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-xl ${darkMode ? "group-hover:ring-green-600" : "group-hover:ring-green-300"}`}>
              <div className={`mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl ${darkMode ? "bg-green-900/30 text-green-300" : "bg-green-100 text-green-700"}`}>
                <span className="text-2xl">🔭</span>
              </div>
              <h2 className={`text-3xl font-bold ${darkMode ? "text-green-300" : "text-green-700"} mb-3`}>Our Vision</h2>
              <p className={`${darkMode ? "text-gray-300" : "text-gray-600"} leading-relaxed`}>
                Lead as a smart farm platform for 100+ farms with data-driven insights.
              </p>
            </div>
          </div>

          {/* Card 3 */}
          <div className="group relative animate-on-scroll opacity-0 translate-y-10 scale-95 transition-all duration-1000 delay-300">
            <div className={`absolute inset-0 rounded-3xl bg-gradient-to-br from-green-500/25 via-emerald-400/20 to-green-500/25 opacity-70 blur-sm transition group-hover:opacity-100 ${darkMode ? "from-green-700/25 via-emerald-600/20 to-green-700/25" : ""}`} />
            <div className={`relative rounded-3xl ${darkMode ? "bg-gray-800/80 text-white" : "bg-white/80 text-gray-900"} p-8 shadow-lg ring-1 ${darkMode ? "ring-green-800" : "ring-green-100"} backdrop-blur-sm transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-xl ${darkMode ? "group-hover:ring-green-600" : "group-hover:ring-green-300"}`}>
              <div className={`mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl ${darkMode ? "bg-green-900/30 text-green-300" : "bg-green-100 text-green-700"}`}>
                <span className="text-2xl">🌿</span>
              </div>
              <h2 className={`text-3xl font-bold ${darkMode ? "text-green-300" : "text-green-700"} mb-3`}>Our Values</h2>
              <p className={`${darkMode ? "text-gray-300" : "text-gray-600"} leading-relaxed`}>
                Innovation, sustainability, trust, and farmer dedication.
              </p>
            </div>
          </div>
        </div>

        {/* Quality Assurance */}
        <div className="w-full max-w-7xl mt-16 animate-on-scroll opacity-0 translate-y-10 scale-95 transition-all duration-1000 ease-out will-change-transform">
          <h2 className="text-3xl md:text-4xl font-extrabold text-center mb-8">
            <span className={`bg-gradient-to-r ${darkMode ? "from-green-400 to-emerald-300" : "from-green-800 to-emerald-600"} bg-clip-text text-transparent`}>
              Quality Assurance in Sri Lanka
            </span>
          </h2>

          <div className="grid gap-6 md:grid-cols-2">
            {[
              { title: "ISO 9000 Series", text: "Standards for quality management systems." },
              { title: "ISO 14000 Series", text: "Standards for environment-management systems." },
              {
                title: "HACCP",
                text: "Hazard Analysis and Critical Control Points: A food safety management system.",
              },
              { title: "GMP Certificate", text: "Good Management Practice Certificate: A certification for good practices." },
            ].map((item) => (
              <div
                key={item.title}
                className={`group relative overflow-hidden rounded-2xl ${darkMode ? "bg-gray-800/85 text-white" : "bg-white/85 text-gray-900"} p-6 shadow-md ring-1 ${darkMode ? "ring-green-800" : "ring-green-100"} backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${darkMode ? "hover:ring-green-600" : "hover:ring-green-300"}`}
              >
                <div className={`absolute -right-6 -top-6 h-24 w-24 rounded-full ${darkMode ? "bg-green-900/30" : "bg-green-100/60"} blur-2xl`} aria-hidden="true" />
                <h3 className={`text-xl font-semibold ${darkMode ? "text-green-300" : "text-green-700"} mb-2`}>{item.title}</h3>
                <p className={`${darkMode ? "text-gray-300" : "text-gray-600"} leading-relaxed`}>{item.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Our Company Milestones */}
        <div className="w-full max-w-7xl mt-16 animate-on-scroll opacity-0 translate-y-10 scale-95 transition-all duration-1000 ease-out will-change-transform">
          <h2 className="text-3xl md:text-4xl font-extrabold text-center mb-3">
            <span className={`bg-gradient-to-r ${darkMode ? "from-green-400 to-emerald-300" : "from-green-800 to-emerald-600"} bg-clip-text text-transparent`}>
              Our Company Milestones
            </span>
          </h2>
          <p className={`text-center ${darkMode ? "text-gray-400" : "text-gray-600"} mb-10`}>Wow! What a journey so far...</p>

          <div className="relative mx-auto w-full max-w-4xl">
            {/* center line */}
            <div className={`absolute left-1/2 -ml-[1px] h-full w-0.5 bg-gradient-to-b ${darkMode ? "from-green-800 via-emerald-700 to-green-800" : "from-green-200 via-emerald-300 to-green-200"}`} />

            <ul className="space-y-14">
              {/* 1995-2005 - Left */}
              <li className="relative md:grid md:grid-cols-9 md:items-center">
                <div className="md:col-span-4">
                  <div className="flex justify-center md:justify-end md:pr-8">
                    <div className={`w-full md:w-3/4 rounded-xl ${darkMode ? "bg-gray-800/90 text-white" : "bg-white/90 text-gray-900"} p-4 shadow-md ring-1 ${darkMode ? "ring-green-800" : "ring-green-100"} backdrop-blur-sm`}>
                      <p className={darkMode ? "text-gray-300" : "text-gray-600"}>
                        Started as a farm equipment supplier in 1995, building values of quality and support.
                      </p>
                    </div>
                  </div>
                </div>
                <div className={`relative z-10 mx-auto my-4 flex h-10 w-10 items-center justify-center rounded-full ${darkMode ? "bg-gray-800" : "bg-white"} shadow-md ring-4 ${darkMode ? "ring-green-800" : "ring-green-100"}`}>
                  <svg
                    className={`h-5 w-5 ${darkMode ? "text-green-400" : "text-green-600"}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div className="hidden md:col-span-4 md:block" />
              </li>

              {/* 2005-2015 - Right */}
              <li className="relative md:grid md:grid-cols-9 md:items-center">
                <div className="hidden md:col-span-4 md:block" />
                <div className={`relative z-10 mx-auto my-4 flex h-10 w-10 items-center justify-center rounded-full ${darkMode ? "bg-gray-800" : "bg-white"} shadow-md ring-4 ${darkMode ? "ring-green-800" : "ring-green-100"}`}>
                  <svg
                    className={`h-5 w-5 ${darkMode ? "text-green-400" : "text-green-600"}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div className="md:col-span-4">
                  <div className="flex justify-center md:justify-start md:pl-8">
                    <div className={`w-full md:w-3/4 rounded-xl ${darkMode ? "bg-gray-800/90 text-white" : "bg-white/90 text-gray-900"} p-4 shadow-md ring-1 ${darkMode ? "ring-green-800" : "ring-green-100"} backdrop-blur-sm`}>
                      <p className={darkMode ? "text-gray-300" : "text-gray-600"}>
                        Expanded nationwide in 2005, earning ISO and HACCP certifications.
                      </p>
                    </div>
                  </div>
                </div>
              </li>

              {/* 2015-2025 - Left */}
              <li className="relative md:grid md:grid-cols-9 md:items-center">
                <div className="md:col-span-4">
                  <div className="flex justify-center md:justify-end md:pr-8">
                    <div className={`w-full md:w-3/4 rounded-xl ${darkMode ? "bg-gray-800/90 text-white" : "bg-white/90 text-gray-900"} p-4 shadow-md ring-1 ${darkMode ? "ring-green-800" : "ring-green-100"} backdrop-blur-sm`}>
                      <p className={darkMode ? "text-gray-300" : "text-gray-600"}>
                        Launched Smart Farm Management System in 2015 for digital farm control.
                      </p>
                    </div>
                  </div>
                </div>
                <div className={`relative z-10 mx-auto my-4 flex h-10 w-10 items-center justify-center rounded-full ${darkMode ? "bg-gray-800" : "bg-white"} shadow-md ring-4 ${darkMode ? "ring-green-800" : "ring-green-100"}`}>
                  <svg
                    className={`h-5 w-5 ${darkMode ? "text-green-400" : "text-green-600"}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div className="hidden md:col-span-4 md:block" />
              </li>

              {/* 2025+ - Right */}
              <li className="relative md:grid md:grid-cols-9 md:items-center">
                <div className="hidden md:col-span-4 md:block" />
                <div className={`relative z-10 mx-auto my-4 flex h-10 w-10 items-center justify-center rounded-full ${darkMode ? "bg-gray-800" : "bg-white"} shadow-md ring-4 ${darkMode ? "ring-green-800" : "ring-green-100"}`}>
                  <svg
                    className={`h-5 w-5 ${darkMode ? "text-green-400" : "text-green-600"}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div className="md:col-span-4">
                  <div className="flex justify-center md:justify-start md:pl-8">
                    <div className={`w-full md:w-3/4 rounded-xl ${darkMode ? "bg-gray-800/90 text-white" : "bg-white/90 text-gray-900"} p-4 shadow-md ring-1 ${darkMode ? "ring-green-800" : "ring-green-100"} backdrop-blur-sm`}>
                      <p className={darkMode ? "text-gray-300" : "text-gray-600"}>
                        Embracing IoT and AI from 2025 for automated farming globally.
                      </p>
                    </div>
                  </div>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Awards Section */}
        <div className="w-full max-w-7xl mt-16 animate-on-scroll opacity-0 translate-y-10 scale-95 transition-all duration-1000 ease-out will-change-transform">
          <h2 className="text-3xl md:text-4xl font-extrabold text-center mb-8">
            <span className={`bg-gradient-to-r ${darkMode ? "from-green-400 to-emerald-300" : "from-green-800 to-emerald-600"} bg-clip-text text-transparent`}>
              Our Awards & Recognition
            </span>
          </h2>

          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                title: "ASDA Award 2019",
                subtitle: "Best Farm of the Year",
                text: "The Annual Symposium of the Department of Agriculture (ASDA) proudly recognizes the excellence and dedication of officers in the Sri Lanka Agricultural Service.",
              },
              {
                title: "The DoA Award 2020",
                subtitle: "Best Agriculturist of the Year 2020",
                text: "The DoA organizes Farmer's Day events to honor farmers and agricultural innovators, celebrating innovation, leadership, and service in agriculture.",
              },
              {
                title: "ASDA Award 2023",
                subtitle: "Best Farm of the Year",
                text: "The Annual Symposium of the Department of Agriculture (ASDA) proudly recognizes the excellence and dedication of officers in the Sri Lanka Agricultural Service.",
              },
            ].map((award) => (
              <div
                key={award.title}
                className={`group rounded-3xl bg-gradient-to-br ${darkMode ? "from-green-700/50 via-green-600/60 to-emerald-700/60" : "from-green-300/50 via-green-100/60 to-emerald-200/60"} p-0.5 transition-all duration-300 hover:shadow-[0_10px_30px_rgba(16,185,129,0.15)]`}
              >
                <div className={`rounded-3xl ${darkMode ? "bg-gray-800" : "bg-white"} p-8 shadow-lg transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-xl`}>
                  <div className="text-6xl mb-4">🏆</div>
                  <h3 className={`text-xl font-bold ${darkMode ? "text-white" : "text-gray-800"} mb-1`}>{award.title}</h3>
                  <p className={`${darkMode ? "text-green-300" : "text-green-700"} font-semibold mb-3`}>{award.subtitle}</p>
                  <p className={`${darkMode ? "text-gray-300" : "text-gray-600"} text-sm leading-relaxed`}>{award.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Team Section */}
        <div className="w-full max-w-7xl mt-16 animate-on-scroll opacity-0 translate-y-10 scale-95 transition-all duration-1000 ease-out will-change-transform">
          <h2 className="text-3xl md:text-4xl font-extrabold text-center mb-8">
            <span className={`bg-gradient-to-r ${darkMode ? "from-green-400 to-emerald-300" : "from-green-800 to-emerald-600"} bg-clip-text text-transparent`}>
              Meet Our Team
            </span>
          </h2>

          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                img: ceoImg,
                name: "Mr. M.G.K. Senarathna",
                role: "Founder & CEO",
                desc: "Leading with innovative technology.",
              },
              {
                img: ctoImg,
                name: "Mr. S.K.T. Silva",
                role: "CTO",
                desc: "Driving tech advancements.",
              },
              {
                img: pmImg,
                name: "Mr. A.S.K. Bandaranayaka",
                role: "Project Manager",
                desc: "Ensuring project success.",
              },
            ].map((person) => (
              <div
                key={person.name}
                className={`group rounded-3xl ${darkMode ? "bg-gray-800/80 text-white" : "bg-white/80 text-gray-900"} p-8 text-center shadow-lg ring-1 ${darkMode ? "ring-green-800" : "ring-green-100"} backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${darkMode ? "hover:ring-green-600" : "hover:ring-green-300"}`}
              >
                <div className="relative mx-auto mb-4 h-40 w-40">
                  <div className={`absolute -inset-1 rounded-full bg-gradient-to-tr ${darkMode ? "from-green-700 via-emerald-600 to-green-700" : "from-green-300 via-emerald-200 to-green-300"} opacity-60 blur-md transition group-hover:opacity-90`} />
                  <img
                    src={person.img}
                    alt={person.name}
                    className={`relative h-40 w-40 rounded-full object-cover ring-4 ${darkMode ? "ring-green-700/30 group-hover:ring-green-500/60" : "ring-green-300/30 group-hover:ring-green-400/60"} transition`}
                    loading="lazy"
                  />
                </div>
                <h3 className={`text-xl font-semibold ${darkMode ? "text-white" : "text-gray-800"}`}>{person.name}</h3>
                <p className={`${darkMode ? "text-green-300" : "text-green-700"} font-medium`}>{person.role}</p>
                <p className={`${darkMode ? "text-gray-300" : "text-gray-600"} mt-2`}>{person.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default AboutUs;   