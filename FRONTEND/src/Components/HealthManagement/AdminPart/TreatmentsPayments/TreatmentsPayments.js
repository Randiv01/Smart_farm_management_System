import React from 'react';

const plantTreatments = [
  {
    name: "Organic Pest Control",
    description: "Eco-friendly spray for crop protection",
    cost: 150.00,
    quantity: 10,
    lastPurchased: "2025-08-20",
  },
  {
    name: "Soil Nutrient Boost",
    description: "Organic compost for soil fertility",
    cost: 200.00,
    quantity: 5,
    lastPurchased: "2025-08-10",
  },
];

const animalTreatments = [
  {
    name: "Livestock Vaccination",
    description: "Annual vaccine for cattle and sheep",
    cost: 300.00,
    quantity: 20,
    lastPurchased: "2025-04-05",
  },
  {
    name: "Parasite Control",
    description: "Deworming treatment for farm animals",
    cost: 120.00,
    quantity: 15,
    lastPurchased: "2025-07-15",
  },
];

function TreatmentsPayments() {
  const calculateTotal = (treatments) => {
    return treatments.reduce((total, treatment) => 
      total + (treatment.cost * treatment.quantity), 0).toFixed(2);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-center text-gray-800 mb-12">
          Farm Treatments Payment Details
        </h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Plant Treatments Payments */}
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
                    <span className="text-gray-500">Unit Cost:</span>
                    <p className="text-gray-700">${treatment.cost.toFixed(2)}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Quantity:</span>
                    <p className="text-gray-700">{treatment.quantity}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Total Cost:</span>
                    <p className="text-gray-700">
                      ${(treatment.cost * treatment.quantity).toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500">Last Purchased:</span>
                    <p className="text-gray-700">{treatment.lastPurchased}</p>
                  </div>
                </div>
              </div>
            ))}
            <div className="mt-6 p-4 bg-green-50 rounded-lg">
              <h3 className="text-lg font-semibold text-green-700">
                Total Plant Treatments Cost: ${calculateTotal(plantTreatments)}
              </h3>
            </div>
          </div>

          {/* Animal Treatments Payments */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-semibold text-blue-600 mb-6">
              Animal Health Treatments
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
                    <span className="text-gray-500">Unit Cost:</span>
                    <p className="text-gray-700">${treatment.cost.toFixed(2)}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Quantity:</span>
                    <p className="text-gray-700">{treatment.quantity}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Total Cost:</span>
                    <p className="text-gray-700">
                      ${(treatment.cost * treatment.quantity).toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500">Last Purchased:</span>
                    <p className="text-gray-700">{treatment.lastPurchased}</p>
                  </div>
                </div>
              </div>
            ))}
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h3 className="text-lg font-semibold text-blue-700">
                Total Animal Treatments Cost: ${calculateTotal(animalTreatments)}
              </h3>
            </div>
          </div>
        </div>

        {/* Grand Total */}
        <div className="mt-8 p-6 bg-white rounded-xl shadow-lg text-center">
          <h2 className="text-2xl font-semibold text-gray-800">
            Grand Total: ${(parseFloat(calculateTotal(plantTreatments)) + parseFloat(calculateTotal(animalTreatments))).toFixed(2)}
          </h2>
        </div>
      </div>
    </div>
  );
}

export default TreatmentsPayments;