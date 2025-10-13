// BACKEND/PlantManagement/Controllers/dashboardController.js
import Productivity from '../models/productivityModel.js';
import Inspection from '../models/inspectionModel.js';
import Fertilizing from '../models/fertilizingModel.js';
import Greenhouse from '../models/greenhouseModel.js';
import Plant from '../models/plantModel.js';
import Pest from '../models/Pest.js';
import Telemetry from '../models/telemetryModel.js';

// Get dashboard data including monthly yield chart
export const getDashboardData = async (req, res) => {
  try {
    // Get summary data - using real plant data (greenhouses) with status
    const totalGreenhouses = await Plant.countDocuments();
    const activeGreenhouses = await Plant.countDocuments({ status: 'Active' });
    const inactiveGreenhouses = await Plant.countDocuments({ status: 'Inactive' });
    const maintenanceGreenhouses = await Plant.countDocuments({ status: 'Maintenance' });

    // Get monthly yield data for the last 12 months
    const monthlyYieldData = await getMonthlyYieldData();

    // Get fertilizer frequency data by greenhouse
    const fertilizerFrequencyData = await getFertilizerFrequencyData();

    // Get active issues from inspections
    const activeIssues = await getActiveIssues();

    // Get issues by type data
    const issueData = await getIssuesByType();

    const dashboardData = {
      summary: {
        totalGreenhouses,
        activeGreenhouses,
        inactiveGreenhouses,
        maintenanceGreenhouses
      },
      yieldData: monthlyYieldData,
      fertilizerFrequencyData,
      activeIssues,
      issueData
    };

    res.json({
      success: true,
      data: dashboardData
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard data'
    });
  }
};

// Get monthly yield data for the last 12 months
const getMonthlyYieldData = async () => {
  try {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    // Get all productivity data and group by month/year
    const allProductivity = await Productivity.find({});
    
    // Group data by month and year
    const monthlyYields = {};
    
    allProductivity.forEach(record => {
      const harvestDate = new Date(record.harvestDate);
      const year = harvestDate.getFullYear();
      const month = harvestDate.getMonth();
      const monthKey = `${months[month]} ${year}`;
      
      if (!monthlyYields[monthKey]) {
        monthlyYields[monthKey] = 0;
      }
      monthlyYields[monthKey] += record.quantity || 0;
    });
    
    // Convert to array format for chart
    const monthlyData = Object.entries(monthlyYields).map(([month, yieldValue]) => ({
      month,
      yield: yieldValue
    }));
    
    // Sort by date
    monthlyData.sort((a, b) => {
      const [monthA, yearA] = a.month.split(' ');
      const [monthB, yearB] = b.month.split(' ');
      const monthIndexA = months.indexOf(monthA);
      const monthIndexB = months.indexOf(monthB);
      
      if (yearA !== yearB) return yearA - yearB;
      return monthIndexA - monthIndexB;
    });

    return monthlyData;
  } catch (error) {
    console.error('Error getting monthly yield data:', error);
    return [];
  }
};

// Get fertilizer frequency data by greenhouse - same as Fertilizing Management
const getFertilizerFrequencyData = async () => {
  try {
    // Get all fertilizing records
    const fertilizingRecords = await Fertilizing.find({});
    
    // Group by greenhouseNo and count frequency - same logic as Fertilizing Management
    const fertilizerDataMap = {};
    
    fertilizingRecords.forEach(record => {
      const greenhouseNo = record.greenhouseNo;
      if (fertilizerDataMap[greenhouseNo]) {
        fertilizerDataMap[greenhouseNo].frequency += 1;
      } else {
        fertilizerDataMap[greenhouseNo] = {
          greenhouseNo: greenhouseNo,
          frequency: 1
        };
      }
    });
    
    // Convert to array format
    const fertilizerData = Object.values(fertilizerDataMap);
    
    return fertilizerData;
  } catch (error) {
    console.error('Error getting fertilizer frequency data:', error);
    return [];
  }
};

// Get active issues from inspections
const getActiveIssues = async () => {
  try {
    const issues = await Inspection.find({
      status: 'issue'
    })
    .sort({ date: -1 })
    .limit(10)
    .select('tunnel notes date status');

    return issues;
  } catch (error) {
    console.error('Error getting active issues:', error);
    return [];
  }
};

// Get issues by type data - combining inspection and pest & disease data
const getIssuesByType = async () => {
  try {
    // Get inspection issues
    const inspectionIssues = await Inspection.find({
      status: 'issue'
    });

    // Get pest & disease issues
    const pestIssues = await Pest.find({
      status: 'Active'
    });

    const issueTypes = {};
    
    // Count inspection issues
    inspectionIssues.forEach(issue => {
      const type = 'Inspection Issue';
      issueTypes[type] = (issueTypes[type] || 0) + 1;
    });

    // Count pest & disease issues by type
    pestIssues.forEach(issue => {
      const type = issue.issueType || 'Other';
      issueTypes[type] = (issueTypes[type] || 0) + 1;
    });

    return Object.entries(issueTypes).map(([name, value]) => ({
      name,
      value
    }));
  } catch (error) {
    console.error('Error getting issues by type:', error);
    return [];
  }
};

// Get greenhouse telemetry data
export const getGreenhouseTelemetry = async (req, res) => {
  try {
    const { greenhouseId } = req.params;
    
    // Check if telemetry data exists for this greenhouse
    const latestTelemetry = await Telemetry.findOne({ greenhouseId })
      .sort({ timestamp: -1 })
      .limit(1);
    
    if (latestTelemetry) {
      // Return real telemetry data
      res.json({
        success: true,
        data: {
          temperature: latestTelemetry.temperature,
          humidity: latestTelemetry.humidity,
          soilMoisture: latestTelemetry.soilMoisture || 0,
          lightLevel: latestTelemetry.lightLevel || 0,
          timestamp: latestTelemetry.timestamp
        }
      });
    } else if (greenhouseId === 'GH-01') {
      // Return mock data for GH-01 when no real data is available
      const mockData = {
        temperature: 24.5 + (Math.random() - 0.5) * 4,
        humidity: 65 + (Math.random() - 0.5) * 10,
        lightLevel: 850 + (Math.random() - 0.5) * 100,
        soilMoisture: 70 + (Math.random() - 0.5) * 20,
        timestamp: new Date()
      };

      res.json({
        success: true,
        data: mockData
      });
    } else {
      res.json({
        success: false,
        message: 'Telemetry data only available for GH-01'
      });
    }
  } catch (error) {
    console.error('Error fetching telemetry data:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching telemetry data'
    });
  }
};

// Get valid greenhouses
export const getValidGreenhouses = async (req, res) => {
  try {
    const plants = await Plant.find().select('greenhouseId plantName location');
    
    // Create unique greenhouses from plant data
    const greenhouseMap = {};
    plants.forEach(plant => {
      if (!greenhouseMap[plant.greenhouseId]) {
        greenhouseMap[plant.greenhouseId] = {
          _id: plant._id,
          greenhouseName: plant.greenhouseId,
          location: plant.location
        };
      }
    });
    
    const greenhouses = Object.values(greenhouseMap);
    
    res.json({
      success: true,
      data: greenhouses
    });
  } catch (error) {
    console.error('Error fetching greenhouses:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching greenhouses'
    });
  }
};

// Store telemetry data from DHT22 sensor
export const storeTelemetryData = async (req, res) => {
  try {
    const { greenhouseId, temperature, humidity, soilMoisture, lightLevel } = req.body;
    
    if (!greenhouseId || temperature === undefined || humidity === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Greenhouse ID, temperature, and humidity are required'
      });
    }

    const telemetryData = new Telemetry({
      greenhouseId,
      temperature,
      humidity,
      soilMoisture: soilMoisture || 0,
      lightLevel: lightLevel || 0
    });

    await telemetryData.save();

    res.json({
      success: true,
      message: 'Telemetry data stored successfully',
      data: telemetryData
    });
  } catch (error) {
    console.error('Error storing telemetry data:', error);
    res.status(500).json({
      success: false,
      message: 'Error storing telemetry data'
    });
  }
};

// Get all Plant Management issues for header notification
export const getAllPlantManagementIssues = async (req, res) => {
  try {
    // Get inspection issues
    const inspectionIssues = await Inspection.find({
      status: 'issue'
    })
    .sort({ date: -1 })
    .limit(5)
    .select('tunnel notes date status');

    // Get active pest & disease issues
    const pestIssues = await Pest.find({
      status: 'Active'
    })
    .sort({ date: -1 })
    .limit(5)
    .select('greenhouseNo description date issueType status severity');

    // Check for sensor issues (environmental alerts for GH-01)
    const sensorIssues = await checkSensorIssues();

    // Format all issues consistently
    const allIssues = [
      // Inspection issues
      ...inspectionIssues.map(issue => ({
        id: issue._id,
        type: 'Inspection Issue',
        title: `Inspection Issue - ${issue.tunnel}`,
        description: issue.notes,
        severity: 'Medium',
        date: issue.date,
        source: 'Inspection Management',
        url: '/PlantManagement/inspection'
      })),
      
      // Pest & disease issues
      ...pestIssues.map(issue => ({
        id: issue._id,
        type: 'Pest Disease',
        title: `${issue.issueType} - ${issue.greenhouseNo}`,
        description: issue.description,
        severity: issue.severity || 'Medium',
        date: issue.date,
        source: 'Pest & Disease Management',
        url: '/PlantManagement/pest-disease'
      })),
      
      // Sensor issues
      ...sensorIssues
    ];

    // Sort by date (most recent first)
    allIssues.sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json({
      success: true,
      data: {
        totalIssues: allIssues.length,
        criticalIssues: allIssues.filter(issue => issue.severity === 'Critical').length,
        highIssues: allIssues.filter(issue => issue.severity === 'High').length,
        mediumIssues: allIssues.filter(issue => issue.severity === 'Medium').length,
        lowIssues: allIssues.filter(issue => issue.severity === 'Low').length,
        issues: allIssues
      }
    });
  } catch (error) {
    console.error('Error fetching Plant Management issues:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching Plant Management issues'
    });
  }
};

// Check for sensor issues (environmental alerts)
const checkSensorIssues = async () => {
  try {
    const sensorIssues = [];
    
    // Get latest telemetry for GH-01
    const latestTelemetry = await Telemetry.findOne({ greenhouseId: 'GH-01' })
      .sort({ timestamp: -1 });
    
    if (latestTelemetry) {
      // Check for environmental issues based on optimal ranges
      // Optimal ranges (adjust based on plant requirements):
      const optimalTemp = { min: 18, max: 25 }; // °C
      const optimalHumidity = { min: 50, max: 70 }; // %
      
      // Temperature alerts
      if (latestTelemetry.temperature < optimalTemp.min) {
        sensorIssues.push({
          id: 'sensor-temp-low',
          type: 'Sensor Alert',
          title: 'Temperature Alert - GH-01',
          description: `Temperature is too low: ${latestTelemetry.temperature.toFixed(1)}°C (optimal: ${optimalTemp.min}-${optimalTemp.max}°C)`,
          severity: 'High',
          date: latestTelemetry.timestamp,
          source: 'Sensor System',
          url: '/PlantManagement/monitor-control'
        });
      } else if (latestTelemetry.temperature > optimalTemp.max) {
        sensorIssues.push({
          id: 'sensor-temp-high',
          type: 'Sensor Alert',
          title: 'Temperature Alert - GH-01',
          description: `Temperature is too high: ${latestTelemetry.temperature.toFixed(1)}°C (optimal: ${optimalTemp.min}-${optimalTemp.max}°C)`,
          severity: 'High',
          date: latestTelemetry.timestamp,
          source: 'Sensor System',
          url: '/PlantManagement/monitor-control'
        });
      }
      
      // Humidity alerts
      if (latestTelemetry.humidity < optimalHumidity.min) {
        sensorIssues.push({
          id: 'sensor-humidity-low',
          type: 'Sensor Alert',
          title: 'Humidity Alert - GH-01',
          description: `Humidity is too low: ${latestTelemetry.humidity.toFixed(1)}% (optimal: ${optimalHumidity.min}-${optimalHumidity.max}%)`,
          severity: 'Medium',
          date: latestTelemetry.timestamp,
          source: 'Sensor System',
          url: '/PlantManagement/monitor-control'
        });
      } else if (latestTelemetry.humidity > optimalHumidity.max) {
        sensorIssues.push({
          id: 'sensor-humidity-high',
          type: 'Sensor Alert',
          title: 'Humidity Alert - GH-01',
          description: `Humidity is too high: ${latestTelemetry.humidity.toFixed(1)}% (optimal: ${optimalHumidity.min}-${optimalHumidity.max}%)`,
          severity: 'Medium',
          date: latestTelemetry.timestamp,
          source: 'Sensor System',
          url: '/PlantManagement/monitor-control'
        });
      }
    }
    
    return sensorIssues;
  } catch (error) {
    console.error('Error checking sensor issues:', error);
    return [];
  }
};
