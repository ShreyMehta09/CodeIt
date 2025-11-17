const nodemailer = require("nodemailer");

// Create transporter
const transporter = nodemailer.createTransport({
	service: "gmail",
	auth: {
		user: process.env.EMAIL_USER,
		pass: process.env.EMAIL_PASSWORD,
	},
});

// Generate 6-digit OTP
const generateOTP = () => {
	return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send OTP email
const sendOTPEmail = async (email, otp) => {
	const mailOptions = {
		from: `CodeIt <${process.env.EMAIL_USER}>`,
		to: email,
		subject: "Verify Your Email - CodeIt",
		html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background-color: #f9f9f9;
            }
            .header {
              background-color: #4F46E5;
              color: white;
              padding: 20px;
              text-align: center;
              border-radius: 8px 8px 0 0;
            }
            .content {
              background-color: white;
              padding: 30px;
              border-radius: 0 0 8px 8px;
            }
            .otp-box {
              background-color: #f0f0f0;
              border: 2px dashed #4F46E5;
              padding: 20px;
              text-align: center;
              font-size: 32px;
              font-weight: bold;
              letter-spacing: 8px;
              margin: 20px 0;
              border-radius: 8px;
              color: #4F46E5;
            }
            .footer {
              text-align: center;
              margin-top: 20px;
              font-size: 12px;
              color: #666;
            }
            .warning {
              background-color: #FEF3C7;
              border-left: 4px solid #F59E0B;
              padding: 10px;
              margin: 20px 0;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to CodeIt! 🚀</h1>
            </div>
            <div class="content">
              <h2>Verify Your Email Address</h2>
              <p>Thank you for signing up! Please use the following OTP to verify your email address:</p>
              
              <div class="otp-box">
                ${otp}
              </div>
              
              <p>This OTP is valid for <strong>10 minutes</strong>.</p>
              
              <div class="warning">
                <strong>⚠️ Security Notice:</strong> Never share this OTP with anyone. CodeIt will never ask for your OTP via phone or email.
              </div>
              
              <p>If you didn't request this verification, please ignore this email.</p>
              
              <p>Happy Coding! 💻</p>
              <p><strong>Team CodeIt</strong></p>
            </div>
            <div class="footer">
              <p>© 2024 CodeIt. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
	};

	try {
		await transporter.sendMail(mailOptions);
		return { success: true };
	} catch (error) {
		console.error("Email send error:", error);
		return { success: false, error: error.message };
	}
};

module.exports = {
	generateOTP,
	sendOTPEmail,
	transporter,
};
