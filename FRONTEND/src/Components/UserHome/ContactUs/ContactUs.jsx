import React, { useEffect, useState } from "react";
import ContactForm from "./ContactForm.jsx";

// Slideshow images (adjust paths if needed)
import slide1 from "../Images/ContactUs1.jpg";
import slide2 from "../Images/ContactUs2.jpg";
import slide3 from "../Images/ContactUs3.webp";
import slide4 from "../Images/ContactUs4.webp";

const ContactUs = () => {
  const [open, setOpen] = useState(false);

  // Slideshow state
  const slides = [slide1, slide2, slide3, slide4];
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);

  // Preload images
  useEffect(() => {
    slides.forEach((src) => {
      const img = new Image();
      img.src = src;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-rotate every 5s
  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(id);
  }, [paused, slides.length]);

  const prevSlide = () => setCurrent((i) => (i - 1 + slides.length) % slides.length);
  const nextSlide = () => setCurrent((i) => (i + 1) % slides.length);

  // Close modal on ESC
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const googleMapsShortLink = "https://maps.app.goo.gl/qXkVoTgZ9JbnnFGu6";
  const embedMapSrc = "https://www.google.com/maps?q=Mount+Olive+Farm+House+Sri+Lanka&output=embed";

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-emerald-50 via-green-50 to-white">
      {/* Decorative blobs */}
      <div className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-green-300/30 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-80 w-80 rounded-full bg-emerald-200/40 blur-3xl" />

      {/* Full-width slideshow hero */}
      <section
        className="relative w-full"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        <div className="relative h-[40vh] md:h-[50vh] lg:h-[56vh] w-full overflow-hidden">
          {/* Slides */}
          {slides.map((src, i) => (
            <img
              key={i}
              src={src}
              alt={`Mount Olive Farm House slide ${i + 1}`}
              className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ease-in-out ${
                i === current ? "opacity-100" : "opacity-0"
              }`}
              loading={i === 0 ? "eager" : "lazy"}
              draggable="false"
            />
          ))}

          {/* Dark gradient for readability */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-black/15 to-transparent" />

          {/* Static overlay content */}
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center px-6 text-center">
            <h1 className="text-3xl md:text-5xl font-extrabold text-white drop-shadow-lg">
              How can I help you?
            </h1>
            <p className="mt-2 max-w-3xl text-sm md:text-lg text-white/95 drop-shadow">
              We’re here to help. Reach out to Mount Olive Farm House for support, partnerships, or general inquiries.
            </p>
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
          <div className="absolute bottom-3 left-0 right-0 z-10 flex items-center justify-center gap-2">
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

      {/* Content container */}
      <div className="mx-auto max-w-7xl px-6 py-12 md:px-12 md:py-16">
        {/* Contact + Map */}
        {/* key change: md:items-stretch to let the right column stretch and be filled by the map */}
        <div className="grid gap-8 md:grid-cols-2 md:items-stretch">
          {/* Info Cards */}
          <div className="space-y-6">
            <div className="rounded-3xl bg-white/80 p-6 shadow-lg ring-1 ring-green-100 backdrop-blur-sm">
              <div className="flex items-start gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 text-green-700 text-2xl">
                  📍
                </div>
                <div>
                  <h3 className="text-xl font-bold text-green-800">Head Office</h3>
                  <p className="mt-1 text-gray-700">
                    Mount Olive Farm House
                    <br />
                    No. 45, Green Valley Road,
                    <br />
                    Boragasketiya,Nuwaraeliya, Sri Lanka
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl bg-white/80 p-6 shadow-lg ring-1 ring-green-100 backdrop-blur-sm">
              <div className="flex items-start gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 text-green-700 text-2xl">
                  ☎️
                </div>
                <div>
                  <h3 className="text-xl font-bold text-green-800">Contact</h3>
                  <div className="mt-1 text-gray-700 space-y-1">
                    <p>General: +94 81 249 2134</p>
                    <p>Support: +94 71 987 6543</p>
                    <p>
                      Email:{" "}
                      <a className="text-green-700 underline" href="mailto:info@mountolivefarm.lk">
                        info@mountolivefarm.lk
                      </a>
                    </p>
                    <p>
                      WhatsApp:{" "}
                      <a
                        className="text-green-700 underline"
                        href="https://wa.me/94771234567?text=Hello%20Mount%20Olive%20Farm%20House!"
                        target="_blank"
                        rel="noreferrer"
                      >
                        +94 77 123 4567
                      </a>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-3xl bg-white/80 p-6 shadow-lg ring-1 ring-green-100 backdrop-blur-sm">
              <div className="flex items-start gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 text-green-700 text-2xl">
                  ⏰
                </div>
                <div>
                  <h3 className="text-xl font-bold text-green-800">Hours</h3>
                  <div className="mt-1 text-gray-700 space-y-1">
                    <p>Mon–Fri: 8:30 AM – 5:30 PM</p>
                    <p>Sat: 9:00 AM – 1:00 PM</p>
                    <p>Sun: Closed</p>
                    <p className="text-sm text-green-700">Emergency Vet Support: 24/7</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={() => setOpen(true)}
                className="inline-flex items-center justify-center rounded-xl bg-green-600 px-5 py-3 font-semibold text-white shadow hover:bg-green-700 transition"
              >
                Open Contact Form
              </button>
              <a
                href={googleMapsShortLink}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center rounded-xl bg-white px-5 py-3 font-semibold text-green-700 ring-1 ring-green-200 shadow hover:bg-green-50 transition"
              >
                Open in Google Maps
              </a>
            </div>
          </div>

          {/* Map (fills full height) */}
          <div className="flex h-full flex-col overflow-hidden rounded-3xl bg-white/70 p-2 shadow-lg ring-1 ring-green-100 backdrop-blur-sm">
            {/* The map area grows to fill all available height */}
            <div className="relative w-full flex-1 overflow-hidden rounded-2xl min-h-[320px] md:min-h-[540px]">
              <iframe
                title="Mount Olive Farm House Map"
                src={embedMapSrc}
                className="absolute inset-0 h-full w-full border-0"
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
              {/* Small overlay label so the map uses 100% of the card height */}
              <div className="pointer-events-none absolute bottom-2 left-2 rounded-md bg-white/90 px-2 py-1 text-xs font-semibold text-green-700 shadow ring-1 ring-green-200">
                Map
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
          onClick={() => setOpen(false)}
          aria-modal="true"
          role="dialog"
        >
          <div
            className="w-full max-w-xl rounded-2xl bg-white shadow-2xl ring-1 ring-green-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h3 className="text-lg font-bold text-green-800">Send us a message</h3>
              <button
                onClick={() => setOpen(false)}
                className="rounded-full p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                aria-label="Close contact form"
              >
                ✖️
              </button>
            </div>
            <div className="p-6">
              <ContactForm onClose={() => setOpen(false)} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContactUs;