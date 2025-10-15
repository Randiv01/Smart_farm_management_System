# Smart Farm Management System

A comprehensive enterprise-grade monorepo solution for integrated smart farm operations, encompassing animal management, plant management, health management, inventory control, and employee administration.

## 🏗️ Project Structure

```
/
├── .git/                   # Git repository
├── .gitignore             # Git ignore rules
├── README.md              # This file
├── package.json           # Monorepo controller (concurrently only)
├── package-lock.json      # Monorepo lock file
└── node_modules/          # Monorepo dependencies (concurrently only)
│
├── BACKEND/               # Independent Node.js + Express + MongoDB backend
│   ├── package.json       # Complete backend dependencies
│   ├── package-lock.json  # Backend lock file
│   ├── node_modules/      # Backend-specific dependencies
│   ├── app.js            # Main server file with Socket.io integration
│   ├── arduinoReader.js  # Arduino serial communication handler
│   ├── .env              # Environment variables (ignored by git)
│   ├── AnimalManagement/ # Animal-related features
│   ├── HealthManagement/ # Health management features
│   ├── PlantManagement/  # Plant management features
│   ├── InventoryManagement/ # Inventory management features
│   ├── EmployeeManager/  # Employee management features
│   ├── ContactUs/        # Contact form handling
│   ├── arduino_feeding_system/ # Arduino-based automated feeding system
│   ├── models/           # Database models
│   ├── routes/           # API routes
│   ├── middleware/       # Express middleware
│   ├── scripts/          # Utility scripts
│   ├── uploads/          # General file uploads directory
│   ├── Health_uploads/   # Health management file uploads
│   ├── ARDUINO_SETUP.md  # Arduino integration documentation
│   └── MONGODB_TROUBLESHOOTING.md # Database troubleshooting guide
│
├── FRONTEND/             # Independent React frontend application
│   ├── package.json      # Complete frontend dependencies
│   ├── package-lock.json # Frontend lock file
│   ├── node_modules/     # Frontend-specific dependencies
│   ├── .env              # Frontend environment variables
│   ├── public/           # Static assets
│   ├── src/              # React source code
│   │   ├── Components/   # React components
│   │   └── utils/        # Utility functions
│   ├── tailwind.config.js # Tailwind CSS config
│   ├── postcss.config.js # PostCSS configuration
│   ├── tsconfig.json     # TypeScript config
│   ├── README.md         # Frontend-specific documentation
│   └── SEASONAL_EFFECTS_README.md # Seasonal effects feature documentation
│
├── ESP32_SmartAgriculture_Complete.ino # ESP32 firmware for IoT integration
├── ESP32_INTEGRATION_README.md # ESP32 setup and integration guide
├── test_esp32_connection.html # ESP32 connection testing tool
├── websocket_test.html   # WebSocket connection testing tool
├── DEBUG_SCHEDULED_FEEDING.md # Scheduled feeding debugging guide
└── SCHEDULED_FEEDING_FIX.md # Scheduled feeding fix documentation
```

## Architecture Overview

The project implements a clean monorepo architecture with the following characteristics:

- **Independent Frontend and Backend**: Each subsystem maintains complete autonomy with dedicated dependency management
- **Isolated Dependencies**: Separate `package.json`, `package-lock.json`, and `node_modules` for each subsystem
- **Minimal Root Configuration**: Root directory contains only monorepo orchestration tools
- **Modular Design**: Both frontend and backend can be installed, built, and deployed independently
- **Professional Structure**: Enterprise-grade organization following industry best practices

## 🚀 Quick Start

### Prerequisites
- Node.js (>= 16.0.0)
- npm (>= 8.0.0)
- MongoDB (local or cloud)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/username/Smart_farm_management_System.git
   cd Smart_farm_management_System
   ```

2. **Install all dependencies**
   ```bash
   npm run install:all
   ```
   
   Or install individually:
   ```bash
   npm run install:backend
   npm run install:frontend
   ```

### Running the Application

#### Option 1: Run Both Backend and Frontend Together
```bash
npm start
# or
npm run dev
```

#### Option 2: Run Backend and Frontend Separately

**Backend only:**
```bash
npm run start:backend
# or
cd BACKEND && npm run dev
```

**Frontend only:**
```bash
npm run start:frontend
# or
cd FRONTEND && npm start
```

## 📋 Available Scripts

### Root Level (Monorepo)
- `npm run install:all` - Install dependencies for both backend and frontend
- `npm run install:backend` - Install backend dependencies only
- `npm run install:frontend` - Install frontend dependencies only
- `npm start` - Start both backend and frontend concurrently
- `npm run dev` - Start both backend and frontend in development mode
- `npm run start:backend` - Start backend only
- `npm run start:frontend` - Start frontend only
- `npm run build` - Build frontend for production
- `npm test` - Run frontend tests
- `npm run clean` - Remove all node_modules directories
- `npm run clean:install` - Clean and reinstall all dependencies

### Backend Scripts (BACKEND/)
- `npm start` - Start backend server with Node.js
- `npm run dev` - Start backend server with nodemon (auto-restart)
- `npm run seed:meat` - Seed meat production data
- `npm run seed:animals` - Seed animal data

### Frontend Scripts (FRONTEND/)
- `npm start` - Start React development server with optimized settings
- `npm run start-debug` - Start with debugging enabled
- `npm run start-simple` - Start without optimization flags
- `npm run build` - Build React app for production
- `npm test` - Run React tests
- `npm run eject` - Eject from Create React App (irreversible)

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the `BACKEND/` directory with the following variables:

```env
# Database Configuration
MONGO_URI=mongodb://localhost:27017/smartfarm
# MongoDB Atlas alternative:
# MONGO_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/smartfarm

# Server Configuration
PORT=5000
NODE_ENV=development

# JWT Authentication
JWT_SECRET=<secure_random_string>

# Email Service Configuration
EMAIL_USER=<email_address>
EMAIL_PASS=<application_password>

# Arduino/ESP32 Integration (Optional)
ARDUINO_PORT=<serial_port>
ESP32_WEBSOCKET_URL=<websocket_url>
```

### Frontend Configuration

The frontend is configured to proxy API requests to `http://localhost:5000` (backend server).

## 🌐 Access Points

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Backend Health Check**: http://localhost:5000/health
- **Socket.io WebSocket**: ws://localhost:5000

## 🔌 IoT Integration

### ESP32/Arduino Support
The system supports IoT integration with ESP32 microcontrollers for:
- Automated feeding systems
- Real-time sensor data collection
- Remote device control
- WebSocket-based communication

Refer to `ESP32_INTEGRATION_README.md` and `ARDUINO_SETUP.md` for detailed setup instructions.

## 📱 Core Features

### Animal Management
- Animal registration and tracking with QR codes
- QR code generation and scanning for identification
- Automated feeding schedules with Arduino/ESP32 integration
- Real-time feeding notifications via Socket.io
- Health monitoring and treatment tracking
- Meat productivity tracking and analysis
- Zone-based animal management
- Feed stock inventory management

### Plant Management
- Plant registration and monitoring
- Pest and disease tracking
- Fertilization management
- Inspection scheduling
- Productivity analysis

### Health Management
- Doctor and specialist management
- Medicine and fertilizer inventory
- Treatment tracking
- Consultation scheduling

### Inventory Management
- Product catalog
- Order management
- Stock tracking
- Supplier management
- Refill requests

### Employee Management
- Staff management and profiles
- Attendance tracking with calendar view
- Leave management and approval workflow
- Overtime monitoring and calculation
- Salary management and payroll processing
- Employee performance analytics

## 🔌 API Endpoints

### Animal Management
- `GET/POST /animals` - Animal CRUD operations
- `GET/POST /animal-types` - Animal type management
- `GET/POST /feed-stocks` - Feed stock management
- `GET/POST /zones` - Zone management
- `POST /api/feeding` - Feeding operations
- `POST /api/automated-feeding` - Automated feeding

### Health Management
- `GET/POST /api/doctors` - Doctor management
- `GET/POST /api/specialists` - Specialist management
- `GET/POST /api/medicine-companies` - Medicine company management

### Plant Management
- `GET/POST /api/plants` - Plant management
- `GET/POST /api/inspections` - Inspection management
- `GET/POST /api/pests` - Pest management

### Inventory Management
- `GET/POST /api/inventory/products` - Product management
- `GET/POST /api/orders` - Order management
- `GET/POST /api/suppliers` - Supplier management

### Employee Management
- `GET/POST /api/employees` - Employee management
- `GET/POST /api/attendance` - Attendance tracking
- `GET/POST /api/leaves` - Leave management

## 🛠️ Development

### Development Guidelines

1. **Backend Development**: Implement new routes within the appropriate management module directory
2. **Frontend Development**: Create new components within the corresponding management module structure
3. **Database Schema**: Define new models in the designated models directory

### Technical Stack

- **Backend**: Node.js with Express.js framework utilizing ES modules
- **Frontend**: React application with TypeScript, functional components and hooks architecture
- **Database**: MongoDB with Mongoose ODM for data modeling
- **Authentication**: JWT-based stateless authentication system
- **Real-time Communication**: Socket.io for WebSocket connections and real-time updates
- **File Management**: Multer middleware for multipart form data handling
- **Styling**: Tailwind CSS with PostCSS for responsive design
- **IoT Integration**: ESP32 microcontroller support with Arduino firmware
- **Serial Communication**: SerialPort library for Arduino device integration
- **PDF Generation**: jsPDF and PDFKit for report generation
- **QR Code**: QR code generation and scanning capabilities
- **Email Service**: Nodemailer for email notifications
- **SMS Service**: Twilio integration for SMS notifications
- **AI Integration**: OpenAI API for chatbot functionality

## 📚 Additional Documentation

The project includes comprehensive documentation for specific features and troubleshooting:

- **ESP32_INTEGRATION_README.md**: Complete guide for ESP32 microcontroller setup and integration
- **ARDUINO_SETUP.md**: Arduino development environment configuration and deployment
- **DEBUG_SCHEDULED_FEEDING.md**: Debugging guide for scheduled feeding system
- **SCHEDULED_FEEDING_FIX.md**: Solutions for common scheduled feeding issues
- **MONGODB_TROUBLESHOOTING.md**: Database connection and configuration troubleshooting
- **SEASONAL_EFFECTS_README.md**: Documentation for seasonal effects feature in frontend

## 🚨 Troubleshooting

### Common Issues

1. **Port Conflict**: Verify that ports 3000 and 5000 are available before starting the application
2. **Database Connection Failure**: Validate the MONGO_URI configuration in the .env file
3. **Dependency Resolution Errors**: Execute `npm run clean:install` to perform a clean reinstallation
4. **Build Failures**: Ensure all dependencies are properly installed using `npm run install:all`
5. **Arduino/ESP32 Connection Issues**: Refer to `ARDUINO_SETUP.md` and `ESP32_INTEGRATION_README.md`
6. **Scheduled Feeding Problems**: Consult `DEBUG_SCHEDULED_FEEDING.md` and `SCHEDULED_FEEDING_FIX.md`

### Diagnostic Procedures

- Review console output for detailed error stack traces
- Verify all environment variables are correctly configured
- Confirm MongoDB service is running and accessible
- Check network connectivity for external service integrations
- Test WebSocket connections using `websocket_test.html`
- Verify ESP32 connectivity using `test_esp32_connection.html`

## 📄 License

ISC License

## 👥 Contributing

Contributions to the Smart Farm Management System are managed through the following workflow:

1. Fork the repository to create a personal copy
2. Create a feature branch from the main development branch
3. Implement changes following the established code standards
4. Execute comprehensive testing to ensure functionality
5. Submit a pull request with detailed description of modifications

## 🔄 Version History

- **v1.0.0** - Initial monorepo structure with all management modules