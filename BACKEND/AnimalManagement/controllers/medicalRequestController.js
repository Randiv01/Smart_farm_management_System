import nodemailer from 'nodemailer';
import Doctor from '../models/Doctor.js';
import QRCode from 'qrcode';
import Animal from '../models/Animal.js';

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
        dark: '#2C5530',
        light: '#FFFFFF'
      }
    });
    return qrCodeDataUrl;
  } catch (error) {
    console.error('❌ Error generating QR code:', error);
    return null;
  }
};

// Function to get additional animal details
const getAnimalDetails = async (animalId) => {
  try {
    const animal = await Animal.findById(animalId).populate('type');
    if (!animal) return null;
    
    return {
      type: animal.type?.name || 'Unknown',
      breed: animal.data?.breed || 'Not specified',
      age: animal.data?.age || 'Unknown',
      location: animal.assignedZone?.location || 'Main Farm',
      batchId: animal.batchId || 'Individual',
      lastCheckup: animal.data?.lastCheckup || 'Not recorded',
      specialNotes: animal.data?.specialNotes || 'None'
    };
  } catch (error) {
    console.error('Error fetching animal details:', error);
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

    // Get additional animal details
    const animalDetails = await getAnimalDetails(animalId);
    
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
    
    const emailSubject = `🚨 URGENT: Medical Emergency - ${animalName} (ID: ${animalId})`;
    
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
      const managerInfo = managerName || 'Farm Manager';
      
      const mailOptions = {
        from: {
          name: 'Mount Olive Farm House - Medical Alert System',
          address: process.env.EMAIL_USER
        },
        to: toEmail,
        subject: emailSubject,
        text: `
URGENT MEDICAL EMERGENCY - MOUNT OLIVE FARM HOUSE

Animal Details:
- Name: ${animalName}
- ID: ${animalId}
- Type: ${animalDetails?.type || 'Unknown'}
- Breed: ${animalDetails?.breed || 'Not specified'}
- Age: ${animalDetails?.age || 'Unknown'}
- Location: ${animalDetails?.location || 'Main Farm'}
- Batch/Group: ${animalDetails?.batchId || 'Individual'}
- Last Checkup: ${animalDetails?.lastCheckup || 'Not recorded'}

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
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Medical Emergency Alert</title>
    <style>
        /* CSS Reset */
        body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
        table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; border-collapse: collapse !important; }
        img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
        div { margin: 0; padding: 0; }
        
        /* Brand Colors */
        :root {
            --primary: #2C5530;
            --primary-light: #3A6B40;
            --secondary: #6A994E;
            --accent: #F2E8CF;
            --alert: #BC4749;
            --white: #FFFFFF;
            --light: #F8F9FA;
            --gray: #6C757D;
            --dark: #343A40;
        }
        
        body {
            font-family: 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            margin: 0;
            padding: 20px 0;
            background-color: #f5f5f5;
            -webkit-font-smoothing: antialiased;
            color: var(--dark);
            line-height: 1.6;
        }
        
        .container {
            max-width: 650px;
            margin: 0 auto;
            background: var(--white);
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
        }
        
        /* Header Styles */
        .header {
            background: linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%);
            padding: 30px;
            text-align: center;
            color: var(--white);
        }
        
        .logo {
            font-size: 32px;
            font-weight: 800;
            margin-bottom: 8px;
            letter-spacing: 0.5px;
        }
        
        .tagline {
            font-size: 16px;
            opacity: 0.9;
            margin-bottom: 15px;
            font-weight: 300;
        }
        
        .alert-badge {
            background: var(--alert);
            color: var(--white);
            padding: 12px 24px;
            border-radius: 30px;
            font-weight: bold;
            display: inline-block;
            margin-top: 15px;
            font-size: 18px;
            text-transform: uppercase;
            letter-spacing: 1px;
            box-shadow: 0 4px 12px rgba(188, 71, 73, 0.3);
        }
        
        /* Content Styles */
        .content {
            padding: 35px;
        }
        
        .section {
            margin-bottom: 28px;
            padding: 25px;
            background: var(--light);
            border-radius: 12px;
            border-left: 5px solid var(--primary);
        }
        
        .emergency-section {
            background: linear-gradient(135deg, #FFF3CD 0%, #FFEAA7 100%);
            border-left: 5px solid #FFC107;
        }
        
        .qr-section {
            text-align: center;
            background: linear-gradient(135deg, #E8F5E8 0%, #D4EDDA 100%);
            border-left: 5px solid var(--secondary);
        }
        
        .qr-code {
            max-width: 200px;
            margin: 20px auto;
            display: block;
            border: 2px solid var(--primary);
            border-radius: 12px;
            padding: 10px;
            background: var(--white);
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        }
        
        /* Footer Styles */
        .footer {
            background: var(--primary);
            color: var(--white);
            padding: 25px;
            text-align: center;
            font-size: 14px;
        }
        
        .button {
            display: inline-block;
            padding: 16px 32px;
            background: var(--alert);
            color: var(--white);
            text-decoration: none;
            border-radius: 8px;
            font-weight: bold;
            margin: 15px 0;
            transition: all 0.3s ease;
            box-shadow: 0 4px 12px rgba(188, 71, 73, 0.3);
        }
        
        .button:hover {
            background: #A53C3E;
            transform: translateY(-2px);
            box-shadow: 0 6px 16px rgba(188, 71, 73, 0.4);
        }
        
        /* Info Grid Styles */
        .info-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 20px;
            margin: 25px 0;
        }
        
        .info-item {
            background: var(--white);
            padding: 20px;
            border-radius: 10px;
            border: 1px solid #e0e0e0;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
            transition: all 0.3s ease;
        }
        
        .info-item:hover {
            transform: translateY(-3px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
        
        .info-label {
            font-size: 12px;
            color: var(--gray);
            text-transform: uppercase;
            margin-bottom: 8px;
            letter-spacing: 0.5px;
            font-weight: 600;
        }
        
        .info-value {
            font-size: 16px;
            font-weight: 600;
            color: var(--dark);
        }
        
        .id-badge {
            background: var(--primary);
            color: var(--white);
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: 600;
            display: inline-block;
        }
        
        .urgent {
            color: var(--alert);
            font-weight: bold;
            font-size: 18px;
            text-align: center;
            margin: 20px 0;
        }
        
        .instructions {
            background: var(--white);
            padding: 25px;
            border-radius: 12px;
            border: 2px dashed var(--secondary);
            margin: 25px 0;
        }
        
        .step {
            display: flex;
            align-items: flex-start;
            margin-bottom: 20px;
        }
        
        .step-number {
            background: var(--secondary);
            color: var(--white);
            width: 32px;
            height: 32px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-right: 15px;
            flex-shrink: 0;
            font-weight: bold;
            font-size: 16px;
        }
        
        .timeline {
            position: relative;
            padding-left: 35px;
            margin: 30px 0;
        }
        
        .timeline::before {
            content: '';
            position: absolute;
            left: 0;
            top: 0;
            bottom: 0;
            width: 3px;
            background: var(--primary);
            border-radius: 3px;
        }
        
        .timeline-item {
            position: relative;
            margin-bottom: 25px;
        }
        
        .timeline-item::before {
            content: '';
            position: absolute;
            left: -35px;
            top: 8px;
            width: 14px;
            height: 14px;
            border-radius: 50%;
            background: var(--primary);
            border: 3px solid var(--white);
            box-shadow: 0 0 0 2px var(--primary);
        }
        
        .status-badge {
            display: inline-block;
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            margin-left: 10px;
        }
        
        .status-pending {
            background: #FFF3CD;
            color: #856404;
        }
        
        .status-complete {
            background: #D4EDDA;
            color: #155724;
        }
        
        /* Responsive Styles */
        @media (max-width: 650px) {
            .container {
                border-radius: 0;
                box-shadow: none;
            }
            
            .content {
                padding: 25px 20px;
            }
            
            .info-grid {
                grid-template-columns: 1fr;
                gap: 15px;
            }
            
            .header {
                padding: 25px 20px;
            }
            
            .logo {
                font-size: 28px;
            }
            
            .alert-badge {
                font-size: 16px;
                padding: 10px 20px;
            }
            
            .section {
                padding: 20px;
            }
            
            .button {
                padding: 14px 28px;
                font-size: 16px;
            }
            
            .timeline {
                padding-left: 25px;
            }
            
            .timeline-item::before {
                left: -25px;
            }
        }
        
        /* Animation */
        @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.05); }
            100% { transform: scale(1); }
        }
        
        .pulse {
            animation: pulse 2s infinite;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">MOUNT OLIVE FARM HOUSE</div>
            <div class="tagline">Excellence in Animal Care & Management</div>
            <div class="alert-badge">🚨 Medical Emergency Alert</div>
        </div>

        <div class="content">
            <div class="section emergency-section">
                <h2 style="margin: 0; color: var(--alert); font-size: 24px;">URGENT VETERINARY ATTENTION REQUIRED</h2>
                <p style="margin: 15px 0; font-weight: bold; font-size: 18px;">Immediate medical assistance needed for animal in distress</p>
            </div>

            <h3 style="color: var(--primary); margin-top: 0; font-size: 20px; border-bottom: 2px solid var(--primary); padding-bottom: 10px;">Animal Identification</h3>
            
            <div class="info-grid">
                <div class="info-item">
                    <div class="info-label">Animal Name</div>
                    <div class="info-value">${animalName}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Unique Identification</div>
                    <div class="info-value">
                        ${animalId} 
                        <span class="id-badge">ID</span>
                    </div>
                </div>
                <div class="info-item">
                    <div class="info-label">Animal Type</div>
                    <div class="info-value">${animalDetails?.type || 'Unknown'}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Breed</div>
                    <div class="info-value">${animalDetails?.breed || 'Not specified'}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Age</div>
                    <div class="info-value">${animalDetails?.age || 'Unknown'}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Location</div>
                    <div class="info-value">${animalDetails?.location || 'Main Farm'}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Batch/Group ID</div>
                    <div class="info-value">${animalDetails?.batchId || 'Individual'}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Last Checkup</div>
                    <div class="info-value">${animalDetails?.lastCheckup || 'Not recorded'}</div>
                </div>
            </div>

            <div class="info-item" style="grid-column: 1 / -1; margin-top: 10px;">
                <div class="info-label">Reported By</div>
                <div class="info-value">${managerInfo} • ${currentDate}</div>
            </div>

            <div class="section">
                <h3 style="margin-top: 0; color: var(--primary); font-size: 20px;">📋 Emergency Details</h3>
                <div style="background: var(--white); padding: 20px; border-radius: 10px; border-left: 4px solid var(--alert); box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
                    ${message.replace(/\n/g, '<br>')}
                </div>
            </div>

            <div class="section qr-section">
                <h3 style="margin-top: 0; color: var(--primary); font-size: 20px;">📲 Quick Access QR Code</h3>
                <p style="margin-bottom: 20px;">Scan this QR code to instantly access complete animal medical records, history, and treatment guidelines:</p>
                ${qrCodeDataUrl ? `<img src="${qrCodeDataUrl}" alt="Animal QR Code" class="qr-code">` : ''}
                <p style="font-size: 14px; color: var(--gray); margin-top: 15px;">
                    <em>Scan with your phone camera or QR code reader app for instant access</em>
                </p>
            </div>

            <div class="instructions">
                <h3 style="margin-top: 0; color: var(--primary); font-size: 20px; display: flex; align-items: center;">
                    <span style="margin-right: 10px;">🔄</span> Next Steps & Action Required
                </h3>
                
                <div class="step">
                    <div class="step-number">1</div>
                    <div>
                        <strong style="color: var(--primary);">Review Emergency Details</strong><br>
                        Examine the symptoms and emergency information provided above
                    </div>
                </div>
                
                <div class="step">
                    <div class="step-number">2</div>
                    <div>
                        <strong style="color: var(--primary);">Scan QR Code</strong><br>
                        Access full medical history and previous treatments
                    </div>
                </div>
                
                <div class="step">
                    <div class="step-number">3</div>
                    <div>
                        <strong style="color: var(--primary);">Contact Farm Manager</strong><br>
                        Confirm arrival time and discuss immediate treatment options
                    </div>
                </div>
                
                <div class="step">
                    <div class="step-number">4</div>
                    <div>
                        <strong style="color: var(--primary);">Provide Emergency Care</strong><br>
                        Administer necessary treatment and update health records
                    </div>
                </div>
            </div>

            <div style="text-align: center; margin: 30px 0;">
                <p class="urgent">⚠️ TIME-SENSITIVE EMERGENCY - IMMEDIATE RESPONSE REQUIRED ⚠️</p>
                <p style="margin-bottom: 20px;">The health and well-being of this animal depends on your prompt action. Please prioritize this emergency.</p>
                <a href="tel:+94123456789" class="button pulse">📞 CALL EMERGENCY HOTLINE</a>
                <p style="font-size: 14px; color: var(--gray); margin-top: 15px;">
                    Estimated response time: < 30 minutes required<br>
                    Current status: <span style="color: var(--alert); font-weight: bold;">AWAITING VETERINARIAN RESPONSE</span>
                </p>
            </div>

            <div class="timeline">
                <h3 style="color: var(--primary); margin-bottom: 20px; font-size: 20px;">🕒 Emergency Timeline</h3>
                
                <div class="timeline-item">
                    <strong>Alert Generated</strong>
                    <span class="status-badge status-complete">COMPLETE</span><br>
                    <span style="color: var(--gray); font-size: 14px;">${currentDate}</span><br>
                    Emergency alert created by farm management system
                </div>
                
                <div class="timeline-item">
                    <strong>Veterinarian Notified</strong>
                    <span class="status-badge status-pending">PENDING</span><br>
                    <span style="color: var(--gray); font-size: 14px;">Awaiting response</span><br>
                    Awaiting veterinarian acknowledgment
                </div>
                
                <div class="timeline-item">
                    <strong>Treatment Initiated</strong>
                    <span class="status-badge status-pending">PENDING</span><br>
                    <span style="color: var(--gray); font-size: 14px;">Not started</span><br>
                    Emergency care and treatment
                </div>
                
                <div class="timeline-item">
                    <strong>Resolution</strong>
                    <span class="status-badge status-pending">PENDING</span><br>
                    <span style="color: var(--gray); font-size: 14px;">Not achieved</span><br>
                    Emergency resolved and animal stabilized
                </div>
            </div>
        </div>

        <div class="footer">
            <p style="margin: 0 0 10px 0; font-size: 16px; font-weight: 600;">🚑 Mount Olive Farm House Medical Alert System</p>
            <p style="margin: 0 0 15px 0; font-size: 14px; opacity: 0.9;">No. 45, Green Valley Road, Boragasketiya, Nuwaraeliya, Sri Lanka | Phone: +94 81 249 2134 | Email: info@mountolivefarm.com</p>
            <p style="margin: 0 0 15px 0; font-size: 13px; opacity: 0.8;">This is an automated emergency message. Please do not reply to this email.</p>
            <p style="margin: 0; font-size: 12px; opacity: 0.7;">
                © ${new Date().getFullYear()} Mount Olive Farm House. All rights reserved.<br>
                Sent from our automated animal health monitoring system<br>
                If this is a mistake or requires update, please contact farm administration immediately
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
      
      res.json({ 
        success: true, 
        message: `Emergency medical request sent to ${toEmail}`,
        emailId: result.messageId,
        recipient: toEmail,
        animalId: animalId,
        animalName: animalName
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
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Test Alert</title>
    <style>/* Same styles as above */</style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">MOUNT OLIVE FARM HOUSE</div>
            <div class="tagline">Excellence in Animal Care & Management</div>
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
                <p style="color: var(--primary);">🔄 <strong>System Status:</strong> OPERATIONAL</p>
                <p style="color: var(--gray); font-size: 14px;">Last tested: ${new Date().toLocaleString()}</p>
            </div>
        </div>

        <div class="footer">
            <p style="margin: 0 0 10px 0; font-size: 16px; font-weight: 600;">🚑 Mount Olive Farm House Medical Alert System</p>
            <p style="margin: 0 0 15px 0; font-size: 14px; opacity: 0.9;">No. 45, Green Valley Road, Boragasketiya, Nuwaraeliya, Sri Lanka | Phone: +94 81 249 2134 | Email: info@mountolivefarm.com</p>
            <p style="margin: 0 0 15px 0; font-size: 13px; opacity: 0.8;">This is a test message. No action required.</p>
            <p style="margin: 0; font-size: 12px; opacity: 0.7;">
                © ${new Date().getFullYear()} Mount Olive Farm House. All rights reserved.<br>
                Sent from our automated animal health monitoring system
            </p>
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