import mongoose from "mongoose";
import dotenv from "dotenv";
import Employee from "../EmployeeManager/E-model/Employee.js";

dotenv.config();

const MONGO_URI =
  process.env.MONGO_URI ||
  process.env.MONGODB_URI ||
  "mongodb+srv://EasyFarming:sliit123@easyfarming.owlbj1f.mongodb.net/EasyFarming?retryWrites=true&w=majority";

function empId(n) {
  return `EMP${String(n).padStart(3, "0")}`;
}

// Only fields allowed by the schema in BACKEND/EmployeeManager/E-model/Employee.js
const employees = [
  { id: empId(1),  name: "Piusha",            contact: "0776633353", email: "piusha@mountolivefarm.com",      title: "Employee Manager",    department: "Employee Management", type: "Full-time", status: "Active", joined: "2025-01-10", address: "No.11/1,Napana,Menikhinne" },
  { id: empId(2),  name: "Rajitha",           contact: "0776665555", email: "rajitha@mountolivefarm.com",     title: "Animal Manager",      department: "Animal Management",   type: "Full-time", status: "Active", joined: "2025-01-08", address: "No.11, Colombo" },
  { id: empId(3),  name: "Rathana Jothi",     contact: "0799067547", email: "rjothi@mountolivefarm.com",       title: "Inventory Manager",   department: "Inventory Management", type: "Full-time", status: "Active", joined: "2025-03-26", address: "No.21, Kandy" },
  { id: empId(4),  name: "Test Employee",     contact: "0712345678", email: "test@mountolive.com",             title: "Worker",              department: "Farm Operations",      type: "Full-time", status: "Active", joined: "2025-01-01", address: "123 Test Street, Colombo" },
  { id: empId(5),  name: "Ranasignhe",        contact: "0777844687", email: "ranasinghe@mountolivefarm.com",  title: "Worker",              department: "Farm Operations",      type: "Part-time", status: "Active", joined: "2024-12-31", address: "No.11/2, Kandy" },
  { id: empId(6),  name: "Anthony",           contact: "0789865438", email: "anthony@mountolivefarm.com",      title: "Animal Health Manager", department: "Health Management",   type: "Full-time", status: "Active", joined: "2025-05-28", address: "No.11/2, Walala, Menikhinne" },
  { id: empId(7),  name: "Nimali Perera",     contact: "0771234567", email: "nimali@mountolivefarm.com",       title: "Other",               department: "Employee Management",  type: "Full-time", status: "Active", joined: "2025-02-05", address: "45 Flower Rd, Colombo 07" },
  { id: empId(8),  name: "Kasun Fernando",    contact: "0719876543", email: "kasun@mountolivefarm.com",        title: "Worker",              department: "Farm Operations",      type: "Full-time", status: "Active", joined: "2025-02-12", address: "10 Lake Rd, Kurunegala" },
  { id: empId(9),  name: "Sanduni Silva",     contact: "0754567890", email: "sanduni@mountolivefarm.com",      title: "Animal Health Manager",department: "Health Management",    type: "Full-time", status: "Active", joined: "2025-03-01", address: "22 Temple Rd, Gampaha" },
  { id: empId(10), name: "Supun Jayasinghe",  contact: "0705554433", email: "supun@mountolivefarm.com",        title: "Inventory Manager",   department: "Inventory Management", type: "Full-time", status: "Active", joined: "2025-03-10", address: "5 Hillside, Matale" },
  { id: empId(11), name: "Ishara Weerakoon",  contact: "0723344556", email: "ishara@mountolivefarm.com",       title: "Other",               department: "Employee Management",  type: "Full-time", status: "Active", joined: "2025-03-16", address: "120 Main St, Kandy" },
  { id: empId(12), name: "Ruvindu Abeysekera",contact: "0742233445", email: "ruvindu@mountolivefarm.com",      title: "Plant Manager",       department: "Plant Management",     type: "Full-time", status: "Active", joined: "2025-03-20", address: "4 Green Ave, Nuwara Eliya" },
  { id: empId(13), name: "Dilki Herath",      contact: "0769988776", email: "dilki@mountolivefarm.com",        title: "Plant Health Manager",department: "Health Management",    type: "Full-time", status: "Active", joined: "2025-03-25", address: "7 River Rd, Kegalle" },
  { id: empId(14), name: "Mahesh Priyankara", contact: "0783344556", email: "mahesh@mountolivefarm.com",       title: "Driver",              department: "Farm Operations",      type: "Full-time", status: "Active", joined: "2025-04-01", address: "9 Park Ln, Anuradhapura" },
  { id: empId(15), name: "Anjali Karunarathna",contact: "0712233445",email: "anjali@mountolivefarm.com",       title: "Inventory Manager",   department: "Inventory Management", type: "Full-time", status: "Active", joined: "2025-04-07", address: "18 Fort Rd, Trincomalee" },
  { id: empId(16), name: "Chathura Dissanayake",contact: "0777788990",email: "chathura@mountolivefarm.com",    title: "Other",               department: "Farm Operations",      type: "Full-time", status: "Active", joined: "2025-04-12", address: "2 Lake View, Polonnaruwa" },
  { id: empId(17), name: "Sajini Rathnayake", contact: "0701122334", email: "sajini@mountolivefarm.com",       title: "Animal Health Manager",department: "Health Management",    type: "Part-time", status: "Active", joined: "2025-04-15", address: "11 Sea Rd, Negombo" },
  { id: empId(18), name: "Pasindu Gunawardena",contact: "0725566778",email: "pasindu@mountolivefarm.com",      title: "Other",               department: "Employee Management",  type: "Full-time", status: "Active", joined: "2025-04-18", address: "8 Temple Rd, Matara" },
  { id: empId(19), name: "Hasini Madushika",  contact: "0756677889", email: "hasini@mountolivefarm.com",       title: "Plant Manager",       department: "Plant Management",     type: "Full-time", status: "Active", joined: "2025-04-22", address: "6 Canal Rd, Badulla" },
  { id: empId(20), name: "Tharindu Peris",    contact: "0747788990", email: "tharindu@mountolivefarm.com",     title: "Inventory Manager",   department: "Inventory Management", type: "Full-time", status: "Active", joined: "2025-04-25", address: "3 Hill St, Ratnapura" },
  { id: empId(21), name: "Devmini Senanayake",contact: "0714455667", email: "devmini@mountolivefarm.com",      title: "Animal Health Manager",department: "Health Management",    type: "Full-time", status: "Active", joined: "2025-05-02", address: "14 Garden Rd, Galle" },
  { id: empId(22), name: "Ruwan Lakmal",      contact: "0772255334", email: "ruwan@mountolivefarm.com",        title: "Inventory Manager",   department: "Inventory Management", type: "Full-time", status: "Active", joined: "2025-05-06", address: "25 Cross St, Hambantota" },
  { id: empId(23), name: "Shanika Weerasekara",contact: "0703344556",email: "shanika@mountolivefarm.com",      title: "Worker",              department: "Farm Operations",      type: "Part-time", status: "Active", joined: "2025-05-10", address: "12 Canal Rd, Puttalam" },
  { id: empId(24), name: "Nadeesha Hettiarachchi",contact:"0723344559",email:"nadeesha@mountolivefarm.com",    title: "Plant Manager",       department: "Plant Management",     type: "Full-time", status: "Active", joined: "2025-05-15", address: "20 Flower Rd, Monaragala" },
  { id: empId(25), name: "Yohan Samarasinghe",contact: "0759988776", email: "yohan@mountolivefarm.com",        title: "Other",               department: "Employee Management",  type: "Full-time", status: "Active", joined: "2025-05-20", address: "33 River Side, Batticaloa" }
];

async function run() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // Clean collection first
    const del = await Employee.deleteMany({});
    console.log(`🧹 Cleared Employee collection (deleted ${del.deletedCount})`);

    // Insert 25 records
    const inserted = await Employee.insertMany(employees, { ordered: true });
    console.log(`✅ Inserted ${inserted.length} employees`);
  } catch (err) {
    console.error("❌ Seed failed:", err.message);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
    console.log("🔌 MongoDB connection closed");
  }
}

run();
