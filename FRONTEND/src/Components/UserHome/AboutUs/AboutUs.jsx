import React, { useEffect, useState } from "react";
import Navbar from '../UHNavbar/UHNavbar'; // Import the Navbar component
import Footer from '../UHFooter/UHFooter';
import { useTheme } from "../UHContext/UHThemeContext"; // Import the theme context
import ChatBot from '../UHChatbot/UHChatbot';

// Hero images (update paths or use URLs)
import hero1 from "../Images/AboutUs1.jpg";
import hero2 from "../Images/AboutUs5.jpg";
import hero3 from "../Images/AboutUs3.jpg";
import hero4 from "../Images/AboutUs4.jpg";

// Team member images
import ceoImg from "../Images/ceoAboutUs.jpg";
import ctoImg from "../Images/CtoAboutUs.webp";
import pmImg from "../Images/projectManagerAboutUs.jpeg";

const AboutUs = () => {
  const { darkMode } = useTheme(); // Get dark mode state from context

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
  const [cartItems] = useState([]); // Initialize empty cart for the navbar

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

  // Function to handle cart click (if needed)
  const handleCartClick = () => {
    // You might want to navigate to the cart page or show a modal
    console.log("Cart clicked");
  };

  return (
    <div className={`relative min-h-screen overflow-hidden ${darkMode ? "bg-gray-900 text-white" : "bg-gradient-to-b from-emerald-50 via-green-50 to-white text-gray-900"}`}>
      {/* Navbar */}
      <Navbar cartItems={cartItems} onCartClick={handleCartClick} />
      <ChatBot/>
      {/* Decorative background blobs */}
      {!darkMode && (
        <>
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-green-300/30 blur-3xl"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute bottom-0 left-0 h-80 w-80 rounded-full bg-emerald-200/40 blur-3xl"
          />
        </>
      )}

      {/* Full-width hero slideshow with overlay text */}
      <section
        className="relative w-full"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        <div className="relative h-[50vh] md:h-[70vh] lg:h-[85vh] w-full overflow-hidden">
          {/* Slides */}
          {slides.map((src, i) => (
            <img
              key={i}
              src={src}
              alt={`About Us slide ${i + 1}`}
              className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ease-in-out ${
                i === current ? "opacity-100" : "opacity-0"
              }`}
              loading={i === 0 ? "eager" : "lazy"}
              draggable="false"
            />
          ))}

          {/* Gradient for text readability */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-black/20 to-transparent" />

          {/* Overlayed heading and text */}
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center px-6 text-center">
            <h1 className="text-4xl md:text-6xl font-extrabold text-white drop-shadow-lg">
              About Us
            </h1>
            <p className="mt-3 max-w-3xl text-base md:text-xl text-white/95 drop-shadow">
              Welcome to <span className="font-semibold">Mount Olive Farm House</span>. We transform agriculture with technology,
              managing 100+ farms and delivering organic vegetables, eggs, and milk with 2+ veterinarians and 3+ plant pathologists.
            </p>
            <div className="mt-5 inline-flex items-center gap-3">
              <span className="inline-flex h-2 w-2 rounded-full bg-emerald-400" />
              <span className="text-sm md:text-base font-semibold text-emerald-50 tracking-wide">
                Sustainable • Smart • Trusted
              </span>
            </div>
          </div>

          {/* Controls */}
          <button
            onClick={prevSlide}
            aria-label="Previous slide"
            className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/85 p-2 text-gray-700 shadow hover:bg-white"
          >
            ‹
          </button>
          <button
            onClick={nextSlide}
            aria-label="Next slide"
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/85 p-2 text-gray-700 shadow hover:bg-white"
          >
            ›
          </button>

          {/* Dots */}
          <div className="absolute bottom-4 left-0 right-0 z-10 flex items-center justify-center gap-2">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                aria-label={`Go to slide ${i + 1}`}
                className={`h-2.5 w-2.5 rounded-full transition ${
                  i === current ? "bg-green-500" : "bg-white/80 ring-1 ring-gray-300"
                }`}
              />
            ))}
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