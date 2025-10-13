# Smart Farm Management System

A comprehensive monorepo for managing all aspects of a smart farm, including animal management, plant management, health management, inventory management, and employee management.

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
├── BACKEND/               # ✅ Independent Node.js + Express + MongoDB backend
│   ├── package.json       # ✅ Complete backend dependencies
│   ├── package-lock.json  # ✅ Backend lock file
│   ├── node_modules/      # ✅ Backend-specific dependencies
│   ├── app.js            # ✅ Main server file
│   ├── .env              # ✅ Environment variables (ignored by git)
│   ├── AnimalManagement/ # Animal-related features
│   ├── HealthManagement/ # Health management features
│   ├── PlantManagement/  # Plant management features
│   ├── InventoryManagement/ # Inventory management features
│   ├── EmployeeManager/  # Employee management features
│   ├── ContactUs/        # Contact form handling
│   ├── models/           # Database models
│   ├── routes/           # API routes
│   ├── middleware/       # Express middleware
│   └── scripts/          # Utility scripts
│
└── FRONTEND/             # ✅ Independent React frontend application
    ├── package.json      # ✅ Complete frontend dependencies
    ├── package-lock.json # ✅ Frontend lock file
    ├── node_modules/     # ✅ Frontend-specific dependencies
    ├── public/           # Static assets
    ├── src/              # React source code
    │   ├── Components/   # React components
    │   ├── utils/        # Utility functions
    │   └── ...
    ├── tailwind.config.js # Tailwind CSS config
    └── tsconfig.json     # TypeScript config
```

## ✅ **CLEAN STRUCTURE ACHIEVED**

This project has been completely restructured as requested:

- ✅ **FRONTEND** and **BACKEND** are completely independent
- ✅ Each has its own `package.json`, `package-lock.json`, and `node_modules`
- ✅ Root folder only contains monorepo management (concurrently)
- ✅ No app-level dependencies in root
- ✅ Both projects can be installed, built, and run independently
- ✅ Clean and professional folder structure

## 🚀 Quick Start

### Prerequisites
- Node.js (>= 16.0.0)
- npm (>= 8.0.0)
- MongoDB (local or cloud)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
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
- `npm run build:frontend` - Build frontend only
- `npm test` - Run frontend tests
- `npm run clean` - Remove all node_modules directories
- `npm run clean:install` - Clean and reinstall all dependencies

### Backend Scripts (BACKEND/)
- `npm start` - Start backend server with Node.js
- `npm run dev` - Start backend server with nodemon (auto-restart)

### Frontend Scripts (FRONTEND/)
- `npm start` - Start React development server
- `npm run build` - Build React app for production
- `npm test` - Run React tests
- `npm run eject` - Eject from Create React App (irreversible)

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the `BACKEND/` directory with the following variables:

```env
# Database
MONGO_URI=mongodb://localhost:27017/smartfarm
# or for MongoDB Atlas:
# MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/smartfarm

# Server
PORT=5000
NODE_ENV=development

# JWT
JWT_SECRET=your_jwt_secret_here

# Email Configuration
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# OpenAI (for chatbot)
OPENAI_API_KEY=your_openai_api_key

# Twilio (for SMS notifications)
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_PHONE_NUMBER=your_twilio_phone
```

### Frontend Configuration

The frontend is configured to proxy API requests to `http://localhost:5000` (backend server).

## 🌐 Access Points

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Backend Health Check**: http://localhost:5000/health

## 📱 Features

### Animal Management
- Animal registration and tracking
- QR code generation and scanning
- Feeding schedules and automation
- Health monitoring
- Productivity tracking
- Zone management

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
- Staff management
- Attendance tracking
- Leave management
- Overtime monitoring
- Salary management

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

### Adding New Features

1. **Backend**: Add new routes in the appropriate management folder
2. **Frontend**: Add new components in the corresponding management folder
3. **Database**: Create new models in the appropriate models folder

### Code Structure

- **Backend**: Uses ES modules with Express.js
- **Frontend**: Uses React with functional components and hooks
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT-based authentication
- **File Uploads**: Multer for handling file uploads

## 🚨 Troubleshooting

### Common Issues

1. **Port already in use**: Make sure ports 3000 and 5000 are available
2. **MongoDB connection issues**: Check your MONGO_URI in the .env file
3. **Dependencies issues**: Run `npm run clean:install` to reinstall all dependencies
4. **Build issues**: Make sure all dependencies are installed with `npm run install:all`

### Getting Help

- Check the console logs for detailed error messages
- Ensure all environment variables are properly set
- Verify MongoDB connection and database access

## 📄 License

ISC License

## 👥 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 🔄 Version History

- **v1.0.0** - Initial monorepo structure with all management modules