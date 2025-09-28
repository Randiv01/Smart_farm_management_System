# Automated Feeding System Setup

## Overview
The automated feeding system automatically executes scheduled feedings at their designated times without manual intervention.

## Features
- ✅ **Automatic Execution**: Feeds animals at scheduled times
- ✅ **Status Tracking**: Monitors feeding success/failure
- ✅ **Stock Management**: Automatically reduces feed stock
- ✅ **Error Handling**: Logs failures with reasons
- ✅ **Real-time Monitoring**: Shows system status in frontend

## Configuration

### ESP32 IP Address
Set the ESP32 IP address in your environment variables:

```bash
# In your .env file or environment
ESP32_IP=192.168.1.8
```

If not set, the system defaults to `192.168.1.8`.

### Check Interval
The system checks for scheduled feedings every 60 seconds by default. This can be modified in `automatedFeedingService.js`:

```javascript
this.checkIntervalMs = 60000; // 60 seconds
```

## How It Works

### 1. Scheduling
- Managers schedule feedings through the frontend
- Feedings are stored with status "scheduled"
- System checks every minute for due feedings

### 2. Execution
- When a feeding time arrives, the system:
  - Validates feed stock availability
  - Sends command to ESP32 device
  - Updates feed stock if successful
  - Marks feeding as "completed" or "failed"

### 3. Monitoring
- Frontend shows real-time status of all scheduled feedings
- Automated feeding service status is displayed
- Failed feedings show error reasons

## API Endpoints

### Get Service Status
```
GET /api/automated-feeding/status
```

### Start Service
```
POST /api/automated-feeding/start
```

### Stop Service
```
POST /api/automated-feeding/stop
```

### Manual Check
```
POST /api/automated-feeding/check
```

## Feeding Status Types

- **scheduled**: Waiting to be executed
- **completed**: Successfully executed
- **failed**: Execution failed (with reason)
- **cancelled**: Manually cancelled

## Error Handling

The system handles various failure scenarios:
- Insufficient feed stock
- ESP32 device not responding
- Network connectivity issues
- Invalid feeding data

## Frontend Integration

The frontend displays:
- Automated feeding service status
- Scheduled feedings with status indicators
- Real-time updates of feeding execution
- Error messages for failed feedings

## Troubleshooting

### Service Not Starting
- Check MongoDB connection
- Verify ESP32 IP address
- Check server logs for errors

### Feedings Not Executing
- Verify ESP32 is connected and responding
- Check feed stock availability
- Review feeding schedule times
- Check network connectivity

### Status Not Updating
- Refresh the frontend page
- Check backend service status
- Verify database connectivity

## Logs

The system logs all activities:
- Service start/stop
- Feeding executions
- Success/failure status
- Error details

Check the server console for detailed logs.
