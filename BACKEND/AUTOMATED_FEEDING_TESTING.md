# Automated Feeding System Testing Guide

## 🧪 How to Test the Automated Feeding System

### 1. **Backend Server Setup**
```bash
cd BACKEND
node app.js
```

You should see these logs when the system starts:
```
✅ MongoDB Connected: [your-mongodb-url]
🤖 Automated feeding service started
✅ Automated feeding service started
```

### 2. **Frontend Testing**
1. Open the FeedingScheduler component
2. Look for the "Automated Feeding System" section
3. You should see:
   - **Service Status**: Running (green) or Stopped (red)
   - **Check Interval**: Every 60 seconds
   - **Next Check**: Time of next automatic check
   - **Next Feeding**: Real-time countdown to next scheduled feeding

### 3. **Schedule a Test Feeding**
1. **Set a future time** (e.g., 2-3 minutes from now)
2. **Select a zone** and **feed type**
3. **Enter quantity** (e.g., 5g)
4. **Click "Schedule Feeding"**

### 4. **Monitor Real-Time Countdown**
- The "Next Feeding" card shows:
  - Zone name and feed details
  - **Live countdown**: `2m 30s`, `1m 45s`, etc.
  - Updates every second

### 5. **Watch Automatic Execution**
When the scheduled time arrives:
- **Backend logs** will show:
  ```
  🔍 Checking for scheduled feedings at [time]
  🕐 Found 1 scheduled feeding(s) due for execution
  🍽️ Processing feeding: Zone [name], Feed [name], Time [time]
  🍽️ Executing scheduled feeding for Zone: [name], Feed: [name], Quantity: 5g
  ✅ Scheduled feeding completed successfully for Zone: [name]
  ```

- **Frontend** will show:
  - Status changes from "scheduled" to "completed"
  - Green checkmark appears
  - Execution time is recorded

### 6. **Manual Testing**
Use the **"Check Now"** button to:
- Trigger immediate feeding check
- Test the system without waiting
- Debug any issues

### 7. **Error Testing**
Test error scenarios:
- **Insufficient stock**: Schedule feeding with more quantity than available
- **ESP32 offline**: Disconnect ESP32 and schedule feeding
- **Invalid data**: Try scheduling with missing fields

## 🔍 **Debugging Commands**

### Check Service Status
```bash
curl http://localhost:5000/api/automated-feeding/status
```

### Manual Check
```bash
curl -X POST http://localhost:5000/api/automated-feeding/check
```

### Get Next Feeding
```bash
curl http://localhost:5000/api/automated-feeding/next-feeding
```

## 📊 **Expected Behavior**

### ✅ **Success Flow**
1. **Schedule**: Feeding created with "scheduled" status
2. **Countdown**: Real-time countdown shows time remaining
3. **Execution**: At scheduled time, system automatically feeds
4. **Completion**: Status changes to "completed", stock reduced
5. **Notification**: Success message displayed

### ❌ **Error Flow**
1. **Schedule**: Feeding created with "scheduled" status
2. **Countdown**: Real-time countdown shows time remaining
3. **Execution**: At scheduled time, system attempts feeding
4. **Failure**: Status changes to "failed", error reason logged
5. **Notification**: Error message displayed

## 🚨 **Troubleshooting**

### Service Not Starting
- Check MongoDB connection
- Verify all imports are correct
- Check server logs for errors

### Feedings Not Executing
- Verify ESP32 IP address is correct
- Check ESP32 is connected and responding
- Ensure feed stock is available
- Check network connectivity

### Countdown Not Working
- Refresh the frontend page
- Check browser console for errors
- Verify API endpoints are responding

### Status Not Updating
- Check backend service is running
- Verify database connectivity
- Check for JavaScript errors in frontend

## 📝 **Test Checklist**

- [ ] Backend server starts successfully
- [ ] Automated feeding service starts
- [ ] Frontend shows service status
- [ ] Can schedule a feeding
- [ ] Countdown displays correctly
- [ ] Countdown updates in real-time
- [ ] Feeding executes automatically
- [ ] Status updates to "completed"
- [ ] Stock is reduced correctly
- [ ] Error handling works
- [ ] Manual check button works
- [ ] Real-time updates work

## 🎯 **Success Indicators**

✅ **System Working Correctly When:**
- Service status shows "Running"
- Countdown updates every second
- Feedings execute at scheduled times
- Status changes appropriately
- Stock reduces after feeding
- Error messages are clear
- Manual check works

The automated feeding system is now fully functional with real-time countdown and automatic execution! 🎉
