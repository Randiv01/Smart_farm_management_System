import mongoose from "mongoose";
import dotenv from "dotenv";
import Employee from "../EmployeeManager/E-model/Employee.js";
import Overtime from "../EmployeeManager/E-model/Overtime.js";
import Salary from "../EmployeeManager/E-model/Salary.js";

dotenv.config();

const MONGO_URI =
  process.env.MONGO_URI ||
  process.env.MONGODB_URI ||
  "mongodb+srv://EasyFarming:sliit123@easyfarming.owlbj1f.mongodb.net/EasyFarming?retryWrites=true&w=majority";

const YEAR = 2025;
const MONTH = 10; // October

function hoursFromMixed(v) {
  if (typeof v === "number") return v;
  if (typeof v === "string" && /^\d{1,2}:\d{2}$/.test(v)) {
    const [h, m] = v.split(":").map(Number);
    return h + m / 60;
  }
  return 0;
}

function sumHoursToHHMM(hoursTotal) {
  const minutes = Math.round(hoursTotal * 60);
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}:${String(m).padStart(2, "0")}`;
}

function getOvertimeRateByPosition(position) {
  const managerPositions = [
    'Employee Manager',
    'Animal Manager',
    'Plant Manager',
    'Inventory Manager',
    'Animal Health Manager',
    'Plant Health Manager'
  ];
  return managerPositions.includes(position) ? 200 : 100; // LKR per hour
}

function getBasicSalaryByPosition(position) {
  const salaryRanges = {
    'Employee Manager': 150000,
    'Animal Manager': 120000,
    'Plant Manager': 120000,
    'Inventory Manager': 100000,
    'Animal Health Manager': 110000,
    'Plant Health Manager': 110000,
    'Worker': 45000,
    'Care Taker': 55000,
    'Cleaner': 35000,
    'Driver': 65000,
    'Other': 50000
  };
  return salaryRanges[position] || 50000;
}

async function pickThreeEmployeesWithOvertime() {
  const start = new Date(YEAR, MONTH - 1, 1, 0, 0, 0, 0);
  const end = new Date(YEAR, MONTH, 0, 23, 59, 59, 999);

  const empIds = await Overtime.aggregate([
    { $match: { date: { $gte: start, $lte: end } } },
    { $group: { _id: "$employee", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 3 },
  ]);
  if (empIds.length === 0) {
    // fallback: take first 3 employees
    const fallback = await Employee.find({}, { _id: 1 }).sort({ id: 1 }).limit(3).lean();
    return fallback.map(f => f._id);
  }
  return empIds.map(e => e._id);
}

async function computeOvertimeForEmployee(emp) {
  const start = new Date(YEAR, MONTH - 1, 1, 0, 0, 0, 0);
  const end = new Date(YEAR, MONTH, 0, 23, 59, 59, 999);
  const records = await Overtime.find({ employee: emp._id, date: { $gte: start, $lte: end }, status: { $in: ["Approved", "Pending", "Rejected"] } }).lean();
  const totalHours = records.reduce((acc, r) => acc + hoursFromMixed(r.overtimeHours), 0);
  const hoursHHMM = sumHoursToHHMM(totalHours);
  const rate = getOvertimeRateByPosition(emp.title);
  const pay = Math.round(totalHours * rate);
  return { hoursHHMM, pay };
}

async function run() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // choose 3 employees based on overtime
    const ids = await pickThreeEmployeesWithOvertime();
    const employees = await Employee.find({ _id: { $in: ids } }).lean();

    if (employees.length < 3) {
      console.warn(`Only found ${employees.length} employees; proceeding anyway.`);
    }

    // build 8 salary docs using only these 3 employees
    const perEmpCounts = [3, 3, 2];
    const docs = [];

    for (let i = 0; i < employees.length && i < 3; i++) {
      const emp = employees[i];
      const { hoursHHMM, pay } = await computeOvertimeForEmployee(emp);
      const base = getBasicSalaryByPosition(emp.title);

      for (let k = 0; k < perEmpCounts[i] && docs.length < 8; k++) {
        const allowances = [0, 1500, 2500, 0][(i + k) % 4];
        const deductions = [0, 500, 0, 1000][(i + k) % 4];
        const performanceBonus = [0, 0, 2000, 0][(i + k) % 4];
        const commission = 0;
        const taxDeduction = Math.round(base * 0.05);
        const insuranceDeduction = Math.round(base * 0.05);
        const totalSalary = base + pay + allowances + performanceBonus + commission;
        const netSalary = totalSalary - deductions - taxDeduction - insuranceDeduction;

        docs.push({
          employee: emp._id,
          employeeId: emp.id,
          employeeName: emp.name,
          position: emp.title || "Other",
          payrollPeriod: { year: YEAR, month: MONTH },
          basicSalary: base,
          overtimePay: pay,
          overtimeHours: hoursHHMM,
          allowances,
          deductions,
          performanceBonus,
          commission,
          taxDeduction,
          insuranceDeduction,
          totalSalary,
          netSalary,
          status: ["Pending", "Processing", "Paid"][ (i + k) % 3 ],
          paymentMethod: "Bank Transfer",
          department: emp.department || "Employee Management",
          remarks: `Seeded salary ${(i+1)}-${k+1}`,
        });
      }
    }

    // Insert without clearing existing
    const inserted = await Salary.insertMany(docs, { ordered: true });
    console.log(`✅ Inserted ${inserted.length} salary records for ${YEAR}-${MONTH}`);
  } catch (err) {
    console.error("❌ Salary seed failed:", err.message);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
    console.log("🔌 MongoDB connection closed");
  }
}

run();
