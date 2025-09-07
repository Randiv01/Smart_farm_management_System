// src/Components/PlantManagement/components/P-InspectionChart.jsx
import React from "react";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Doughnut } from "react-chartjs-2";

ChartJS.register(ArcElement, Tooltip, Legend);

const InspectionChart = ({ data }) => {
  const chartData = {
    labels: ["Cleared", "Issues"],
    datasets: [
      {
        label: "Inspections",
        data: data || [10, 5], // placeholder
        backgroundColor: ["#66BB6A", "#EF5350"],
        borderWidth: 1,
      },
    ],
  };

  return <Doughnut data={chartData} />;
};

export default InspectionChart;
