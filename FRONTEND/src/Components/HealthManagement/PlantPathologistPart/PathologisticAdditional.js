import React from "react";

function PathologisticAdditional() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl font-extrabold text-green-800 mb-6 text-center">
          Additional Resources for Plant Pathologists
        </h2>
        <p className="text-lg text-gray-600 mb-8 text-center">
          Explore essential tools, databases, and networks to support your work in plant pathology.
        </p>

        {/* Diagnostic Tools Section */}
        <div className="mb-10">
          <h3 className="text-2xl font-semibold text-green-700 mb-4">
            Diagnostic Tools
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
              <h4 className="text-xl font-medium text-gray-800">Plant Disease Identifier</h4>
              <p className="text-gray-600 mt-2">
                AI-powered tool for identifying plant diseases from images. Upload photos and receive instant diagnostic insights.
              </p>
              <a
                href="https://example.com/plant-disease-identifier"
                className="mt-4 inline-block text-green-600 hover:text-green-800 font-semibold"
              >
                Learn More
              </a>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
              <h4 className="text-xl font-medium text-gray-800">Pathogen Diagnostic Database</h4>
              <p className="text-gray-600 mt-2">
                Comprehensive database for identifying plant pathogens based on symptoms and lab results.
              </p>
              <a
                href="https://example.com/pathogen-database"
                className="mt-4 inline-block text-green-600 hover:text-green-800 font-semibold"
              >
                Access Database
              </a>
            </div>
          </div>
        </div>

        {/* Research Databases Section */}
        <div className="mb-10">
          <h3 className="text-2xl font-semibold text-green-700 mb-4">
            Research Databases
          </h3>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h4 className="text-xl font-medium text-gray-800">Global Plant Pathology Archive</h4>
            <p className="text-gray-600 mt-2">
              Access peer-reviewed articles, case studies, and research papers on plant diseases and management strategies.
            </p>
            <a
              href="https://example.com/plant-pathology-archive"
              className="mt-4 inline-block text-green-600 hover:text-green-800 font-semibold"
            >
              Explore Archive
            </a>
          </div>
        </div>

        {/* Professional Networks Section */}
        <div>
          <h3 className="text-2xl font-semibold text-green-700 mb-4">
            Professional Networks
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
              <h4 className="text-xl font-medium text-gray-800">Plant Pathology Society</h4>
              <p className="text-gray-600 mt-2">
                Join a global community of plant pathologists to share knowledge and collaborate on research.
              </p>
              <a
                href="https://example.com/plant-pathology-society"
                className="mt-4 inline-block text-green-600 hover:text-green-800 font-semibold"
              >
                Join Now
              </a>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
              <h4 className="text-xl font-medium text-gray-800">Online Webinars & Workshops</h4>
              <p className="text-gray-600 mt-2">
                Participate in live webinars and workshops to stay updated on the latest advancements in plant pathology.
              </p>
              <a
                href="https://example.com/webinars"
                className="mt-4 inline-block text-green-600 hover:text-green-800 font-semibold"
              >
                View Schedule
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PathologisticAdditional;
