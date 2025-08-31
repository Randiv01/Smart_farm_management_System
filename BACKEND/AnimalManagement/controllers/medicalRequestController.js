import nodemailer from 'nodemailer';
import Doctor from '../models/Doctor.js';
import QRCode from 'qrcode';
import fs from 'fs';
import path from 'path';

const createTransporter = () => {
  console.log('📧 Email Configuration:');
  console.log('EMAIL_USER:', process.env.EMAIL_USER ? 'Set' : 'NOT SET');
  console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? 'Set' : 'NOT SET');
  
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.error('❌ ERROR: Email credentials missing from environment variables');
    console.error('Please check your .env file in the root directory has EMAIL_USER and EMAIL_PASS');
    return null;
  }

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      },
      logger: true,
      debug: true
    });

    return transporter;
  } catch (error) {
    console.error('❌ ERROR creating email transporter:', error.message);
    return null;
  }
};

// Function to generate QR code as data URL
const generateQRCode = async (text) => {
  try {
    const qrCodeDataUrl = await QRCode.toDataURL(text, {
      width: 200,
      margin: 2,
      color: {
        dark: '#2C5530', // Mount Olive green color
        light: '#FFFFFF'
      }
    });
    return qrCodeDataUrl;
  } catch (error) {
    console.error('❌ Error generating QR code:', error);
    return null;
  }
};

export const sendMedicalRequest = async (req, res) => {
  try {
    console.log('📧 Medical request received:', req.body);
    
    const { animalId, message, qrCodeData, animalName, doctorEmail, managerName, doctorId } = req.body;
    
    let toEmail = doctorEmail;
    
    console.log('Doctor email from request:', doctorEmail);
    console.log('Doctor ID from request:', doctorId);

    // If doctorId is provided, look up the doctor in database
    if (doctorId && !toEmail) {
      console.log('Looking up doctor by ID:', doctorId);
      try {
        const doctor = await Doctor.findById(doctorId);
        if (doctor && doctor.email) {
          toEmail = doctor.email;
          console.log('Found doctor email from ID:', toEmail);
        }
      } catch (dbError) {
        console.error('Error looking up doctor:', dbError.message);
      }
    }
    
    // If no specific doctor email provided, get the first available doctor
    if (!toEmail || toEmail === '') {
      console.log('No doctor email provided, fetching from database...');
      const doctors = await Doctor.find();
      if (doctors.length > 0) {
        toEmail = doctors[0].email;
        console.log('Using first doctor email from DB:', toEmail);
      } else {
        // Fallback to default email if no doctors in database
        toEmail = 'slchina164@gmail.com';
        console.log('No doctors in DB, using fallback email:', toEmail);
      }
    }
    
    console.log('Final recipient email:', toEmail);

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(toEmail)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid email address format for recipient',
        recipient: toEmail
      });
    }
    
    // Generate QR code
    const qrCodeDataUrl = await generateQRCode(qrCodeData || animalId);
    
    const emailSubject = `🚨 URGENT: Medical Emergency - ${animalName} at Mount Olive Farm House`;
    
    const transporter = createTransporter();
    if (!transporter) {
      return res.status(500).json({ 
        success: false, 
        message: 'Email service not configured properly. Please check server logs.' 
      });
    }
    
    try {
      // Verify transporter configuration
      console.log('Verifying email transporter...');
      await transporter.verify();
      console.log('✅ Email transporter verified successfully');
      
      const currentDate = new Date().toLocaleString();
      const managerInfo = managerName || 'Animal Manager';
      
      const mailOptions = {
        from: {
          name: 'Mount Olive Farm House - Medical Alert System',
          address: process.env.EMAIL_USER
        },
        to: toEmail,
        subject: emailSubject,
        text: `
URGENT MEDICAL EMERGENCY - MOUNT OLIVE FARM HOUSE

Animal: ${animalName}
ID: ${animalId}
Date: ${currentDate}
Requested by: ${managerInfo}

EMERGENCY DETAILS:
${message}

QR CODE SCAN: 
Use the QR code in the email to quickly access animal details.

ACTION REQUIRED:
Please respond to this emergency immediately. Scan the QR code for complete animal information.

This is an automated emergency alert from Mount Olive Farm House Management System.
        `,
        html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Medical Emergency Alert</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #2C5530;
            margin: 0;
            padding: 0;
            background-color: #f8f9fa;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
            background: linear-gradient(135deg, #2C5530 0%, #4CAF50 100%);
            padding: 25px;
            text-align: center;
            color: white;
        }
        .logo {
            font-size: 28px;
            font-weight: bold;
            margin-bottom: 10px;
        }
        .alert-badge {
            background: #DC3545;
            color: white;
            padding: 8px 16px;
            border-radius: 20px;
            font-weight: bold;
            display: inline-block;
            margin-top: 10px;
        }
        .content {
            padding: 30px;
        }
        .section {
            margin-bottom: 25px;
            padding: 20px;
            background: #f8f9fa;
            border-radius: 8px;
            border-left: 4px solid #2C5530;
        }
        .emergency-section {
            background: #FFF3CD;
            border-left: 4px solid #FFC107;
        }
        .qr-section {
            text-align: center;
            background: #E8F5E8;
            border-left: 4px solid #4CAF50;
        }
        .qr-code {
            max-width: 200px;
            margin: 15px auto;
            display: block;
        }
        .footer {
            background: #2C5530;
            color: white;
            padding: 20px;
            text-align: center;
            font-size: 12px;
        }
        .button {
            display: inline-block;
            padding: 12px 24px;
            background: #DC3545;
            color: white;
            text-decoration: none;
            border-radius: 6px;
            font-weight: bold;
            margin: 10px 0;
        }
        .info-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 15px;
            margin: 20px 0;
        }
        .info-item {
            background: white;
            padding: 15px;
            border-radius: 6px;
            border: 1px solid #e0e0e0;
        }
        .urgent {
            color: #DC3545;
            font-weight: bold;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">MOUNT OLIVE FARM HOUSE</div>
            <div class="alert-badge">🚨 MEDICAL EMERGENCY ALERT</div>
        </div>

        <div class="content">
            <div class="section emergency-section">
                <h2 style="margin: 0; color: #DC3545;">URGENT ATTENTION REQUIRED</h2>
                <p style="margin: 10px 0; font-weight: bold;">Immediate veterinary assistance needed</p>
            </div>

            <div class="info-grid">
                <div class="info-item">
                    <strong>Animal ID:</strong><br>
                    ${animalName}
                </div>
                <div class="info-item">
                    <strong>Animal QR ID:</strong><br>
                    ${animalId}
                </div>
                <div class="info-item">
                    <strong>Requested by:</strong><br>
                    ${managerInfo}
                </div>
                <div class="info-item">
                    <strong>Date & Time:</strong><br>
                    ${currentDate}
                </div>
            </div>

            <div class="section">
                <h3 style="margin-top: 0;">📋 EMERGENCY DETAILS</h3>
                <p style="background: white; padding: 15px; border-radius: 6px; border-left: 3px solid #DC3545;">
                    ${message.replace(/\n/g, '<br>')}
                </p>
            </div>

            <div class="section qr-section">
                <h3 style="margin-top: 0;">📲 QUICK ACCESS QR CODE</h3>
                <p>Scan this QR code to instantly access complete animal medical records and history:</p>
                ${qrCodeDataUrl ? `<img src="${qrCodeDataUrl}" alt="Animal QR Code" class="qr-code">` : ''}
                <p style="font-size: 12px; color: #666;">
                    <em>Scan with your phone camera or QR code reader app</em>
                </p>
            </div>

            <div style="text-align: center; margin: 30px 0;">
                <p class="urgent">⚠️ THIS IS A TIME-SENSITIVE EMERGENCY ⚠️</p>
                <p>Please respond to this alert immediately. The animal's health depends on your prompt action.</p>
                <a href="tel:+94123456789" class="button">📞 CALL EMERGENCY LINE</a>
            </div>
        </div>

        <div class="footer">
            <p>🚑 <strong>Mount Olive Farm House Medical Alert System</strong></p>
            <p>This is an automated emergency message. Please do not reply to this email.</p>
            <p>© ${new Date().getFullYear()} Mount Olive Farm House. All rights reserved.</p>
            <p style="font-size: 10px; opacity: 0.8;">
                Sent from our automated animal health monitoring system<br>
                If this is a mistake, please contact farm administration
            </p>
        </div>
    </div>
</body>
</html>
        `
      };
      
      console.log('Sending emergency email to:', toEmail);
      const result = await transporter.sendMail(mailOptions);
      console.log('✅ Emergency email sent successfully! Message ID:', result.messageId);
      
      // Log this emergency request in the database for tracking
      // You can implement this based on your tracking requirements
      
      res.json({ 
        success: true, 
        message: `Emergency medical request sent to ${toEmail}`,
        emailId: result.messageId,
        recipient: toEmail
      });
      
    } catch (emailError) {
      console.error('❌ EMERGENCY EMAIL SENDING FAILED:');
      console.error('Error:', emailError.message);
      console.error('Error code:', emailError.code);
      
      let errorMessage = 'Failed to send emergency alert';
      if (emailError.code === 'EAUTH') {
        errorMessage = 'Email authentication failed. System administrator has been notified.';
      } else if (emailError.code === 'EENVELOPE') {
        errorMessage = 'Invalid email address. Please check doctor email configuration.';
      }
      
      res.status(500).json({ 
        success: false, 
        message: errorMessage,
        error: emailError.response || emailError.message,
        severity: 'high'
      });
    }
    
  } catch (error) {
    console.error('❌ Medical request processing error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to process emergency request',
      error: error.message,
      severity: 'critical'
    });
  }
};

// Test endpoint with professional template
export const testEmail = async (req, res) => {
  try {
    console.log('🧪 Testing Mount Olive Farm House email configuration...');
    
    const transporter = createTransporter();
    if (!transporter) {
      return res.status(500).json({ 
        success: false, 
        message: 'Email transporter not configured properly' 
      });
    }
    
    // Verify connection
    await transporter.verify();
    console.log('✅ SMTP connection verified');
    
    // Generate test QR code
    const testQRCode = await generateQRCode('TEST-EMERGENCY-12345');
    
    // Send test email
    const testMailOptions = {
      from: {
        name: 'Mount Olive Farm House - Medical System',
        address: process.env.EMAIL_USER
      },
      to: 'slchina164@gmail.com',
      subject: 'TEST: Mount Olive Farm House Emergency System',
      text: 'This is a test of the Mount Olive Farm House emergency email system.',
      html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Test Alert</title>
    <style>/* Same styles as above */</style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">MOUNT OLIVE FARM HOUSE</div>
            <div class="alert-badge">✅ SYSTEM TEST</div>
        </div>

        <div class="content">
            <div class="section" style="text-align: center;">
                <h2>System Test Successful</h2>
                <p>This email confirms that the Mount Olive Farm House emergency alert system is functioning properly.</p>
                ${testQRCode ? `<img src="${testQRCode}" alt="Test QR Code" class="qr-code">` : ''}
                <p><em>Test QR Code - Scans to: TEST-EMERGENCY-12345</em></p>
            </div>

            <div style="text-align: center; margin: 20px 0;">
                <p style="color: #2C5530;">🔄 <strong>System Status:</strong> OPERATIONAL</p>
                <p style="color: #666; font-size: 14px;">Last tested: ${new Date().toLocaleString()}</p>
            </div>
        </div>

        <div class="footer">
            <p>Mount Olive Farm House Monitoring System</p>
            <p>This is a test message. No action required.</p>
        </div>
    </div>
</body>
</html>
      `
    };
    
    const result = await transporter.sendMail(testMailOptions);
    console.log('✅ Test email sent successfully! Message ID:', result.messageId);
    
    res.json({ 
      success: true, 
      message: 'Mount Olive Farm House email system test successful',
      messageId: result.messageId,
      system: 'Medical Emergency Alert System',
      status: 'Operational'
    });
    
  } catch (error) {
    console.error('❌ Test email failed:', error);
    
    res.status(500).json({ 
      success: false, 
      message: 'Email system test failed',
      error: error.response || error.message,
      system: 'Medical Emergency Alert System',
      status: 'Needs Attention'
    });
  }
};