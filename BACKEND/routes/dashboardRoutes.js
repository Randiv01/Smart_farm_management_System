import express from 'express';
import Greenhouse from '../PlantManagement/models/greenhouseModel.js';
import Inspection from '../PlantManagement/models/inspectionModel.js';
import Productivity from '../PlantManagement/models/productivityModel.js';
import Fertilizing from '../PlantManagement/models/fertilizingModel.js';
import Pest from '../PlantManagement/models/Pest.js';
import Consultation from '../PlantManagement/models/P-Consultation.js';

const router = express.Router();

// Get comprehensive dashboard data
router.get('/dashboard/plant-management', async (req, res) => {
  try {
    // Fetch all data in parallel for better performance
    const [
      greenhouses,
      inspections,
      productivity,
      fertilizing,
      pests,
      consultations
    ] = await Promise.all([
      Greenhouse.find({}),
      Inspection.find({}),
      Productivity.find({}),
      Fertilizing.find({}),
      Pest.find({}),
      Consultation.find({})
    ]);

    // Calculate summary statistics
    const totalGreenhouses = greenhouses.length;
    const activeGreenhouses = greenhouses.filter(gh => gh.temperature && gh.humidity).length;
    const inactiveGreenhouses = totalGreenhouses - activeGreenhouses;
    const maintenanceGreenhouses = inspections.filter(ins => ins.status === 'issue').length;

    // Active issues from inspections
    const activeIssues = inspections.filter(ins => ins.status === 'issue');

    // Monthly yield data from productivity
    const monthlyYieldData = productivity.reduce((acc, prod) => {
      const month = new Date(prod.harvestDate).toLocaleDateString('en-US', { month: 'short' });
      if (!acc[month]) {
        acc[month] = 0;
      }
      acc[month] += prod.quantity;
      return acc;
    }, {});

    const monthlyYieldChart = Object.entries(monthlyYieldData).map(([month, quantity]) => ({
      month,
      quantity
    }));

    // Fertilizer frequency by greenhouse
    const fertilizerFrequencyData = fertilizing.reduce((acc, fert) => {
      if (!acc[fert.greenhouseNo]) {
        acc[fert.greenhouseNo] = 0;
      }
      acc[fert.greenhouseNo]++;
      return acc;
    }, {});

    const fertilizerFrequencyChart = Object.entries(fertilizerFrequencyData).map(([greenhouse, frequency]) => ({
      greenhouse,
      frequency
    }));

    // Issue data combining inspections and pests
    const issueData = [
      ...inspections.filter(ins => ins.status === 'issue').map(ins => ({
        type: 'Inspection Issue',
        count: 1,
        greenhouse: ins.tunnel
      })),
      ...pests.map(pest => ({
        type: pest.issueType,
        count: 1,
        greenhouse: pest.greenhouseNo
      }))
    ];

    // Group issues by type
    const issueTypeData = issueData.reduce((acc, issue) => {
      if (!acc[issue.type]) {
        acc[issue.type] = 0;
      }
      acc[issue.type]++;
      return acc;
    }, {});

    const issueTypeChart = Object.entries(issueTypeData).map(([type, count]) => ({
      type,
      count
    }));

    // Greenhouse telemetry data (mock real-time data for GH-01)
    const telemetryData = greenhouses.map(gh => ({
      greenhouse: gh.greenhouseName,
      temperature: gh.temperature || Math.random() * 10 + 20, // 20-30°C
      humidity: gh.humidity || Math.random() * 20 + 60, // 60-80%
      soilMoisture: Math.random() * 40 + 30, // 30-70%
      timestamp: new Date().toISOString()
    }));

    res.json({
      success: true,
      data: {
        summary: {
          totalGreenhouses,
          active: activeGreenhouses,
          inactive: inactiveGreenhouses,
          maintenance: maintenanceGreenhouses
        },
        activeIssues: activeIssues.map(issue => ({
          id: issue._id,
          greenhouse: issue.tunnel,
          inspector: issue.inspector,
          date: issue.date,
          notes: issue.notes
        })),
        charts: {
          monthlyYield: monthlyYieldChart,
          fertilizerFrequency: fertilizerFrequencyChart,
          issueType: issueTypeChart
        },
        telemetry: telemetryData,
        rawData: {
          greenhouses,
          inspections,
          productivity,
          fertilizing,
          pests,
          consultations
        }
      }
    });

  } catch (error) {
    console.error('Dashboard data fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard data',
      error: error.message
    });
  }
});

// Get real-time telemetry data for specific greenhouse
router.get('/telemetry/:greenhouseId', async (req, res) => {
  try {
    const { greenhouseId } = req.params;
    
    // For GH-01, return real-time data (simulated)
    if (greenhouseId === 'GH-01') {
      const telemetryData = {
        greenhouse: greenhouseId,
        temperature: Math.random() * 5 + 23, // 23-28°C
        humidity: Math.random() * 15 + 65, // 65-80%
        soilMoisture: Math.random() * 30 + 40, // 40-70%
        timestamp: new Date().toISOString(),
        status: 'online'
      };
      
      res.json({
        success: true,
        data: telemetryData
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Real-time data only available for GH-01'
      });
    }
  } catch (error) {
    console.error('Telemetry data fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching telemetry data',
      error: error.message
    });
  }
});

// Get notifications for Plant Management
router.get('/notifications', async (req, res) => {
  try {
    const { module } = req.query;
    
    // Mock notifications - in a real app, these would come from a notifications collection
    const notifications = [
      {
        id: '1',
        title: 'Temperature Alert',
        message: 'GH-01 temperature exceeded 30°C',
        type: 'warning',
        timestamp: new Date().toISOString(),
        module: 'plant',
        read: false
      },
      {
        id: '2',
        title: 'Fertilizer Request',
        message: 'New fertilizer request from GH-02',
        type: 'info',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        module: 'plant',
        read: false
      },
      {
        id: '3',
        title: 'Pest Detection',
        message: 'Fungus detected in GH-03',
        type: 'alert',
        timestamp: new Date(Date.now() - 7200000).toISOString(),
        module: 'plant',
        read: true
      }
    ];

    // Filter by module if specified
    const filteredNotifications = module 
      ? notifications.filter(notif => notif.module === module)
      : notifications;

    res.json({
      success: true,
      data: filteredNotifications
    });

  } catch (error) {
    console.error('Notifications fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching notifications',
      error: error.message
    });
  }
});

// Create notification
router.post('/notifications', async (req, res) => {
  try {
    const { title, message, type, module, targetModule } = req.body;
    
    // In a real app, save to notifications collection
    const notification = {
      id: Date.now().toString(),
      title,
      message,
      type: type || 'info',
      timestamp: new Date().toISOString(),
      module: targetModule || module,
      read: false
    };

    console.log('New notification created:', notification);

    res.json({
      success: true,
      message: 'Notification created successfully',
      data: notification
    });

  } catch (error) {
    console.error('Notification creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating notification',
      error: error.message
    });
  }
});

export default router;
