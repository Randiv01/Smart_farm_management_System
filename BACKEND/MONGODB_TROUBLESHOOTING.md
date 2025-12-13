# MongoDB Connection Troubleshooting Guide

## Error: "Could not connect to any servers in your MongoDB Atlas cluster"

This error occurs when your application cannot reach MongoDB Atlas. Here are the solutions:

---

## Solution 1: Whitelist Your IP Address (Most Common)

### Steps:
1. Go to [MongoDB Atlas](https://cloud.mongodb.com/)
2. Log in to your account
3. Select your cluster
4. Click on **"Network Access"** in the left sidebar
5. Click **"Add IP Address"**
6. Choose one of these options:
   - **"Add Current IP Address"** - Adds your current IP
   - **"Allow Access from Anywhere"** - Use `0.0.0.0/0` (for development only)
7. Click **"Confirm"**
8. Wait 1-2 minutes for changes to take effect

### Quick Fix (Development):
Add `0.0.0.0/0` to allow all IPs (NOT recommended for production)

---

## Solution 2: Check Your Connection String

### Verify your `.env` file:
```env
MONGO_URI=mongodb+srv://USERNAME:PASSWORD@cluster.mongodb.net/DATABASE?retryWrites=true&w=majority
```

### Common Issues:
- ❌ Wrong username or password
- ❌ Special characters in password not URL-encoded
- ❌ Wrong cluster name
- ❌ Missing database name

### URL Encode Special Characters:
If your password has special characters like `@`, `#`, `%`, etc., encode them:
- `@` → `%40`
- `#` → `%23`
- `%` → `%25`
- `/` → `%2F`

Example:
```
Password: MyPass@123
Encoded: MyPass%40123
```

---

## Solution 3: Check MongoDB Atlas Cluster Status

1. Go to MongoDB Atlas Dashboard
2. Check if your cluster is **"Active"** (green status)
3. If paused, click **"Resume"**

---

## Solution 4: Verify Database User Permissions

1. Go to **"Database Access"** in MongoDB Atlas
2. Check if your user exists
3. Ensure user has **"Read and write to any database"** permission
4. If not, edit user and grant proper permissions

---

## Solution 5: Check Network/Firewall

### Windows Firewall:
1. Open Windows Defender Firewall
2. Click "Allow an app through firewall"
3. Ensure Node.js is allowed

### Corporate/School Network:
- Some networks block MongoDB Atlas (port 27017)
- Try using a different network or VPN
- Contact your network administrator

---

## Solution 6: Test Connection String

Create a test file `testConnection.js`:

```javascript
const mongoose = require('mongoose');

const MONGO_URI = "YOUR_CONNECTION_STRING_HERE";

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('✅ Connection successful!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Connection failed:', error.message);
    process.exit(1);
  });
```

Run: `node testConnection.js`

---

## Fixed Issues in Code

### ✅ Removed Deprecated Options
The following options are no longer needed in Mongoose 6+:
- ~~`useNewUrlParser: true`~~
- ~~`useUnifiedTopology: true`~~

### Before:
```javascript
mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
```

### After:
```javascript
mongoose.connect(MONGO_URI);
```

---

## Quick Checklist

- [ ] IP address whitelisted in MongoDB Atlas
- [ ] Correct username and password
- [ ] Special characters in password are URL-encoded
- [ ] MongoDB cluster is active (not paused)
- [ ] Database user has proper permissions
- [ ] No firewall blocking port 27017
- [ ] Internet connection is stable
- [ ] `.env` file exists and is loaded correctly

---

## Still Having Issues?

### Check MongoDB Atlas Status:
Visit: https://status.mongodb.com/

### Get Your Current IP:
Visit: https://whatismyipaddress.com/

### Contact Support:
- MongoDB Atlas Support: https://support.mongodb.com/
- Check MongoDB Community Forums

---

## Development vs Production

### Development (Local):
```env
# Allow all IPs (0.0.0.0/0)
# Use this ONLY for development
```

### Production:
```env
# Whitelist specific server IPs
# Use environment variables
# Enable VPC peering for better security
```

---

**Last Updated**: December 2025
