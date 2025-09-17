import React from 'react';

const plantTreatments = [
  {
    name: "Organic Pest Control",
    description: "Eco-friendly spray to protect crops from common pests",
    application: "Spray bi-weekly during growing season",
    lastApplied: "2025-08-25",
    effectiveness: "85%",
  },
  {
    name: "Soil Nutrient Boost",
    description: "Organic compost mix to enhance soil fertility",
    application: "Apply monthly to root zones",
    lastApplied: "2025-08-15",
    effectiveness: "90%",
  },
];

const animalTreatments = [
  {
    name: "Livestock Vaccination",
    description: "Annual vaccine for cattle and sheep",
    application: "Administer annually in spring",
    lastApplied: "2025-04-10",
    effectiveness: "95%",
  },
  {
    name: "Parasite Control",
    description: "Deworming treatment for all farm animals",
    application: "Administer quarterly",
    lastApplied: "2025-07-20",
    effectiveness: "88%",
  },
];

function TreatmentsDetails() {
  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-center text-gray-800 mb-12">
          Farm Treatment Details
        </h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Plant Health Treatments */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-semibold text-green-600 mb-6">
              Plant Health Treatments
            </h2>
            {plantTreatments.map((treatment, index) => (
              <div
                key={index}
                className="mb-6 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <h3 className="text-xl font-medium text-gray-800">
                  {treatment.name}
                </h3>
                <p className="text-gray-600 mt-1">{treatment.description}</p>
                <div className="mt-3 grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-gray-500">Application:</span>
                    <p className="text-gray-700">{treatment.application}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Last Applied:</span>
                    <p className="text-gray-700">{treatment.lastApplied}</p>
                  </div>
                </div>
                <div className="mt-2">
                  <span className="text-gray-500">Effectiveness:</span>
                  <div className="w-full bg-gray-200 rounded-full h-2.5 mt-1">
                    <div
                      className="bg-green-500 h-2.5 rounded-full"
                      style={{ width: treatment.effectiveness }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Animal Treatments */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-semibold text-blue-600 mb-6">
              Animal Treatments
            </h2>
            {animalTreatments.map((treatment, index) => (
              <div
                key={index}
                className="mb-6 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <h3 className="text-xl font-medium text-gray-800">
                  {treatment.name}
                </h3>
                <p className="text-gray-600 mt-1">{treatment.description}</p>
                <div className="mt-3 grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-gray-500">Application:</span>
                    <p className="text-gray-700">{treatment.application}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Last Applied:</span>
                    <p className="text-gray-700">{treatment.lastApplied}</p>
                  </div>
                </div>
                <div className="mt-2">
                  <span className="text-gray-500">Effectiveness:</span>
                  <div className="w-full bg-gray-200 rounded-full h-2.5 mt-1">
                    <div
                      className="bg-blue-500 h-2.5 rounded-full"
                      style={{ width: treatment.effectiveness }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default TreatmentsDetails;
