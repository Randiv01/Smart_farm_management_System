// E-utils/pdfGenerator.js - PDF Report Generator
import fs from 'fs';
import path from 'path';

// Simple HTML to PDF converter using basic HTML generation
export class PDFReportGenerator {
  
  // Generate employee report HTML
  static generateEmployeeReportHTML(data) {
    const { employee, attendance, overtime, salary, leave, period } = data;
    
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Employee Report - ${employee.name}</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f9f9f9;
        }
        .header {
            text-align: center;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            border-radius: 10px;
            margin-bottom: 30px;
        }
        .header h1 {
            margin: 0;
            font-size: 2.5em;
            font-weight: 300;
        }
        .header p {
            margin: 10px 0 0 0;
            font-size: 1.1em;
            opacity: 0.9;
        }
        .section {
            background: white;
            padding: 25px;
            margin-bottom: 20px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .section h2 {
            color: #667eea;
            border-bottom: 2px solid #667eea;
            padding-bottom: 10px;
            margin-bottom: 20px;
            font-size: 1.5em;
        }
        .info-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
        }
        .info-item {
            padding: 15px;
            background: #f8f9fa;
            border-radius: 8px;
            border-left: 4px solid #667eea;
        }
        .info-label {
            font-weight: bold;
            color: #666;
            font-size: 0.9em;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .info-value {
            font-size: 1.1em;
            margin-top: 5px;
            color: #333;
        }
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
        }
        .stat-card {
            text-align: center;
            padding: 20px;
            background: white;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            border-top: 4px solid;
        }
        .stat-card.attendance { border-top-color: #28a745; }
        .stat-card.overtime { border-top-color: #ffc107; }
        .stat-card.salary { border-top-color: #17a2b8; }
        .stat-card.leave { border-top-color: #fd7e14; }
        .stat-number {
            font-size: 2em;
            font-weight: bold;
            margin: 10px 0;
        }
        .stat-label {
            color: #666;
            font-size: 0.9em;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .footer {
            text-align: center;
            margin-top: 40px;
            padding: 20px;
            color: #666;
            border-top: 1px solid #ddd;
        }
        @media print {
            body { background-color: white; }
            .section { box-shadow: none; border: 1px solid #ddd; }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Employee Report</h1>
        <p>${employee.name} - ${period.monthName} ${period.year}</p>
    </div>

    <div class="section">
        <h2>Personal Information</h2>
        <div class="info-grid">
            <div class="info-item">
                <div class="info-label">Employee ID</div>
                <div class="info-value">${employee.id}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Full Name</div>
                <div class="info-value">${employee.name}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Job Title</div>
                <div class="info-value">${employee.title}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Department</div>
                <div class="info-value">${employee.department}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Contact</div>
                <div class="info-value">${employee.contact}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Joined Date</div>
                <div class="info-value">${employee.joined}</div>
            </div>
        </div>
    </div>

    <div class="section">
        <h2>Performance Summary</h2>
        <div class="stats-grid">
            <div class="stat-card attendance">
                <div class="stat-label">Attendance</div>
                <div class="stat-number">${attendance.present}</div>
                <div class="stat-label">Present Days</div>
                <small>${attendance.absent} absent, ${attendance.onLeave} leave</small>
            </div>
            <div class="stat-card overtime">
                <div class="stat-label">Overtime Hours</div>
                <div class="stat-number">${overtime.currentMonth}</div>
                <div class="stat-label">This Month</div>
                <small>Last month: ${overtime.lastMonth}h</small>
            </div>
            <div class="stat-card salary">
                <div class="stat-label">Salary</div>
                <div class="stat-number">$${salary ? salary.total : 'N/A'}</div>
                <div class="stat-label">Total Amount</div>
                <small>Basic: $${salary ? salary.basic : 'N/A'}</small>
            </div>
            <div class="stat-card leave">
                <div class="stat-label">Leave Balance</div>
                <div class="stat-number">${leave.annual.total - leave.annual.used}</div>
                <div class="stat-label">Annual Leave</div>
                <small>Used: ${leave.annual.used}/${leave.annual.total}</small>
            </div>
        </div>
    </div>

    ${salary ? `
    <div class="section">
        <h2>Salary Breakdown</h2>
        <div class="info-grid">
            <div class="info-item">
                <div class="info-label">Basic Salary</div>
                <div class="info-value">$${salary.basic}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Overtime Pay</div>
                <div class="info-value">$${salary.overtime}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Allowances</div>
                <div class="info-value">$${salary.allowances}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Deductions</div>
                <div class="info-value">$${salary.deductions}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Net Salary</div>
                <div class="info-value">$${salary.net}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Status</div>
                <div class="info-value">${salary.status}</div>
            </div>
        </div>
    </div>
    ` : ''}

    <div class="section">
        <h2>Leave Summary</h2>
        <div class="info-grid">
            <div class="info-item">
                <div class="info-label">Annual Leave</div>
                <div class="info-value">${leave.annual.used} / ${leave.annual.total} days</div>
            </div>
            <div class="info-item">
                <div class="info-label">Sick Leave</div>
                <div class="info-value">${leave.sick.used} / ${leave.sick.total} days</div>
            </div>
            <div class="info-item">
                <div class="info-label">Casual Leave</div>
                <div class="info-value">${leave.casual.used} / ${leave.casual.total} days</div>
            </div>
            <div class="info-item">
                <div class="info-label">Other Leave</div>
                <div class="info-value">${leave.other.used} / ${leave.other.total} days</div>
            </div>
        </div>
    </div>

    <div class="footer">
        <p>Generated on ${new Date().toLocaleDateString()} | Mount Olive Farm House Employee Management System</p>
        <p>This report is confidential and intended for authorized personnel only.</p>
    </div>
</body>
</html>`;

    return html;
  }

  // Save HTML to file (for now, return HTML string)
  static async generateEmployeeReport(data) {
    try {
      const html = this.generateEmployeeReportHTML(data);
      
      // For now, return the HTML string
      // In a real implementation, you would use libraries like puppeteer or wkhtmltopdf
      // to convert HTML to PDF
      
      return {
        success: true,
        html: html,
        message: "HTML report generated successfully"
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

export default PDFReportGenerator;

