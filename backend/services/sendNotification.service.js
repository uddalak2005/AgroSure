import nodemailer from "nodemailer";
import dotenv from "dotenv";
import generateLoanProfilePDF from "../utils/createPDF.util.js";
import { v2 as cloudinary } from "cloudinary";
import fetch from "node-fetch";


cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

dotenv.config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.ALERT_EMAIL,
    pass: process.env.ALERT_PASS,
  },
});

class SendNotification {

  getSignedCloudinaryUrl(publicId, resourceType = 'raw', expiresIn = 300) {
    const expiresAt = Math.floor(Date.now() / 1000) + expiresIn;

    const url = cloudinary.url(publicId, {
      type: "authenticated",
      resource_type: resourceType, // 'raw' or 'image'
      sign_url: true,
      expires_at: expiresAt
    });

    return url;
  }

  async sendLoanNotificationEmail(bankEmail, loanProfile) {
    try {
      console.log("🔄 Generating email HTML and PDF...");

      const {
        name,
        email,
        phone,
        cropName,
        acresOfLand,
        plantingDate,
        expectedHarvestDate,
        soilType,
        irrigationMethod,
        predictedYieldKgPerAcre,
        yieldCategory,
        soilHealthScore,
        soilHealthCategory,
        climateScore,
      } = loanProfile;

      const html = `
    <div style="font-family:Arial, sans-serif; padding: 20px; background:#f4f4f4;">
      <div style="max-width:600px; margin:auto; background:white; border-radius:10px; overflow:hidden;">
        <div style="background:#2e7d32; color:white; padding:20px;">
          <h2 style="margin:0;">🌱 New Farmer Loan Application - AgriSure.ai</h2>
        </div>
        <div style="padding:20px;">
          <p>Hello,</p>
          <p>A new loan profile has been submitted by a farmer. Here are the details:</p>
          <table style="width:100%; border-collapse:collapse;">
            <tr><td><strong>👤 Farmer Name:</strong></td><td>${name}</td></tr>
            <tr><td><strong>📧 Email:</strong></td><td>${email}</td></tr>
            <tr><td><strong>📞 Phone:</strong></td><td>${phone}</td></tr>
            <tr><td><strong>📐 Land Area:</strong></td><td>${acresOfLand} acres</td></tr>
            <tr><td><strong>🌾 Crop:</strong></td><td>${cropName}</td></tr>
            <tr><td><strong>💰 Estimated Yield:</strong></td><td>${predictedYieldKgPerAcre} kg/ha</td></tr>
            <tr><td><strong>📊 Climate Score:</strong></td><td>${climateScore}</td></tr>
          </table>
          <p style="margin-top:20px;">You can contact the farmer via the contact number provided.</p>
        </div>
        <div style="background:#eeeeee; text-align:center; padding:10px; font-size:12px; color:#666;">
          © ${new Date().getFullYear()} AgriSure.ai | Empowering Farmers with Smart Finance
        </div>
      </div>
    </div>`;

      // 🧾 Generate PDF
      let pdfBuffer;
      try {
        pdfBuffer = await generateLoanProfilePDF({
          name,
          email,
          phone,
          cropName,
          acresOfLand,
          plantingDate,
          expectedHarvestDate,
          soilType,
          irrigationMethod,
          predictedYieldKgPerAcre,
          yieldCategory,
          soilHealthScore,
          soilHealthCategory,
          climateScore,
        });
        console.log("✅ PDF generated successfully");
      } catch (pdfErr) {
        console.error("❌ Failed to generate PDF:", pdfErr.message);
        return false;
      }

      try {
        const info = await transporter.sendMail({
          from: `"AgroSure" <${process.env.ALERT_EMAIL}>`,
          to: bankEmail,
          subject: "📄 Loan Profile Report – AgroSure",
          html: html,
          attachments: [
            {
              filename: "Loan-Profile.pdf",
              content: pdfBuffer,
              contentType: "application/pdf",
            },
          ],
        });

        if (info.rejected.length > 0) {
          console.warn("⚠️ Email was rejected for:", info.rejected);
          return false;
        }

        console.log("✅ Email sent to:", info.accepted);
        return true;
      } catch (emailErr) {
        console.error("❌ Failed to send email:", emailErr.message);
        return false;
      }
    } catch (err) {
      console.error(
        "❌ Unexpected error in sendLoanNotificationEmail:",
        err.message
      );
      return false;
    }
  }

  async sendInsuranceClaimNotificationEmail(bankEmail, insuranceRecord, payLoad, name) {
    try {
      const {
        uid,
        location,
        provider,
        uin,
        policyNumber,
        policyDoc,
        damageImage,
        cropImage,
        fieldImage,
      } = insuranceRecord;

      console.log(policyDoc, damageImage, cropImage,fieldImage);

      // Extract AI insights data from payload with fallbacks
      const metadata = payLoad?.metadata || {};
      const damageDetection = payLoad?.damageDetection || {};
      const cropType = payLoad?.cropType || {};

      const html = `
      <div style="font-family:Arial,sans-serif; padding:20px; background:#f4f4f4;">
        <div style="max-width:800px; margin:auto; background:white; border-radius:8px;">
          <div style="background:#0277bd; color:white; padding:16px;">
            <h2 style="margin:0;">🌾 New Insurance Claim - AgriSure.ai</h2>
          </div>
          <div style="padding:20px;">
            <p>Hello,</p>
            <p>A new insurance claim has been submitted by a farmer. Please find the details below:</p>
            
            <h3 style="color:#0277bd; border-bottom:2px solid #0277bd; padding-bottom:5px;">📋 Basic Claim Information</h3>
            <table style="width:100%; border-collapse:collapse; margin-bottom:20px;">
              <tr><td style="padding:8px; border:1px solid #ddd;"><strong>👤 Farmer Name:</strong></td><td style="padding:8px; border:1px solid #ddd;">${name || 'Not provided'}</td></tr>
              <tr><td style="padding:8px; border:1px solid #ddd;"><strong>🆔 UID:</strong></td><td style="padding:8px; border:1px solid #ddd;">${uid || 'Not provided'}</td></tr>
              <tr><td style="padding:8px; border:1px solid #ddd;"><strong>🌍 Location:</strong></td><td style="padding:8px; border:1px solid #ddd;">Lat: ${location?.lat || 'Not provided'}, Long: ${location?.long || 'Not provided'}</td></tr>
              <tr><td style="padding:8px; border:1px solid #ddd;"><strong>🏢 Provider:</strong></td><td style="padding:8px; border:1px solid #ddd;">${provider || 'Not provided'}</td></tr>
              <tr><td style="padding:8px; border:1px solid #ddd;"><strong>🪪 UIN:</strong></td><td style="padding:8px; border:1px solid #ddd;">${uin || 'Not provided'}</td></tr>
              <tr><td style="padding:8px; border:1px solid #ddd;"><strong>📄 Policy No.:</strong></td><td style="padding:8px; border:1px solid #ddd;">${policyNumber || 'Not provided'}</td></tr>
            </table>

            <h3 style="color:#0277bd; border-bottom:2px solid #0277bd; padding-bottom:5px;">🔍 AI Analysis Results</h3>
            
            <h4 style="color:#2e7d32; margin-top:20px;">📸 Image Metadata Analysis</h4>
            <table style="width:100%; border-collapse:collapse; margin-bottom:20px;">
              <tr><td style="padding:8px; border:1px solid #ddd;"><strong>📍 Location Address:</strong></td><td style="padding:8px; border:1px solid #ddd;">${metadata.address || 'Not available'}</td></tr>
              <tr><td style="padding:8px; border:1px solid #ddd;"><strong>📱 Device Model:</strong></td><td style="padding:8px; border:1px solid #ddd;">${metadata.device_model || 'Not available'}</td></tr>
              <tr><td style="padding:8px; border:1px solid #ddd;"><strong>📅 Timestamp:</strong></td><td style="padding:8px; border:1px solid #ddd;">${metadata.timestamp || 'Not available'}</td></tr>
              <tr><td style="padding:8px; border:1px solid #ddd;"><strong>🎯 GPS Coordinates:</strong></td><td style="padding:8px; border:1px solid #ddd;">Lat: ${metadata.gps_latitude || 'Not available'}, Long: ${metadata.gps_longitude || 'Not available'}</td></tr>
              <tr><td style="padding:8px; border:1px solid #ddd;"><strong>🔒 Authenticity Score:</strong></td><td style="padding:8px; border:1px solid #ddd;">${metadata.authenticity_score || 'Not available'}/100</td></tr>
              <tr><td style="padding:8px; border:1px solid #ddd;"><strong>⚠️ Suspicious Reasons:</strong></td><td style="padding:8px; border:1px solid #ddd;">${metadata.suspicious_reasons ? metadata.suspicious_reasons.join(', ') : 'None detected'}</td></tr>
            </table>

            <h4 style="color:#2e7d32; margin-top:20px;">🌾 Crop Damage Assessment</h4>
            <table style="width:100%; border-collapse:collapse; margin-bottom:20px;">
              <tr><td style="padding:8px; border:1px solid #ddd;"><strong>🔍 Damage Status:</strong></td><td style="padding:8px; border:1px solid #ddd; color:${damageDetection.prediction === 'damaged' ? '#d32f2f' : '#2e7d32'};">${damageDetection.prediction || 'Not available'}</td></tr>
              <tr><td style="padding:8px; border:1px solid #ddd;"><strong>📊 Confidence Level:</strong></td><td style="padding:8px; border:1px solid #ddd;">${damageDetection.confidence ? `${damageDetection.confidence.toFixed(2)}%` : 'Not available'}</td></tr>
              <tr><td style="padding:8px; border:1px solid #ddd;"><strong>🤖 AI Model Used:</strong></td><td style="padding:8px; border:1px solid #ddd;">${damageDetection.model || 'Not available'}</td></tr>
              <tr><td style="padding:8px; border:1px solid #ddd;"><strong>✅ Analysis Status:</strong></td><td style="padding:8px; border:1px solid #ddd;">${damageDetection.status || 'Not available'}</td></tr>
            </table>

            <h4 style="color:#2e7d32; margin-top:20px;">🌱 Crop Type Identification</h4>
            <table style="width:100%; border-collapse:collapse; margin-bottom:20px;">
              <tr><td style="padding:8px; border:1px solid #ddd;"><strong>🌾 Identified Crop:</strong></td><td style="padding:8px; border:1px solid #ddd;">${cropType.predicted_class || 'Not available'}</td></tr>
              <tr><td style="padding:8px; border:1px solid #ddd;"><strong>📊 Confidence Level:</strong></td><td style="padding:8px; border:1px solid #ddd;">${cropType.confidence_percent ? `${cropType.confidence_percent.toFixed(2)}%` : 'Not available'}</td></tr>
              <tr><td style="padding:8px; border:1px solid #ddd;"><strong>✅ Analysis Status:</strong></td><td style="padding:8px; border:1px solid #ddd;">${cropType.status || 'Not available'}</td></tr>
            </table>

            <div style="background:#fff3cd; border:1px solid #ffeaa7; padding:15px; border-radius:5px; margin:20px 0;">
              <h4 style="margin:0; color:#856404;">📋 Audit Summary</h4>
              <ul style="margin:10px 0; padding-left:20px;">
                <li><strong>Image Authenticity:</strong> ${metadata.authenticity_score ? (metadata.authenticity_score >= 70 ? '✅ Good' : metadata.authenticity_score >= 50 ? '⚠️ Moderate' : '❌ Low') : 'Not available'}</li>
                <li><strong>Damage Detection:</strong> ${damageDetection.prediction === 'damaged' ? '✅ Damage confirmed' : damageDetection.prediction === 'non_damaged' ? '❌ No damage detected' : 'Not available'}</li>
                <li><strong>Crop Verification:</strong> ${cropType.predicted_class ? `✅ Identified as ${cropType.predicted_class}` : 'Not available'}</li>
                <li><strong>Location Verification:</strong> ${metadata.address ? '✅ Location data available' : '❌ Location data missing'}</li>
              </ul>
            </div>

            <p style="margin-top:20px;"><strong>📎 Supporting Documents:</strong> Relevant documents are attached below for detailed review.</p>
          </div>
          <div style="background:#eeeeee; text-align:center; padding:10px; font-size:12px; color:#666;">
            © ${new Date().getFullYear()} AgriSure.ai | Smart Agri-Insurance
          </div>
        </div>
      </div>
    `;

      const attachments = [];

      const docs = [policyDoc, damageImage, cropImage, fieldImage];
      for (const doc of docs) {
        if (doc && doc.publicId) {
          try {

            const resourceType = doc.fileType === "image" ? "image" : "raw";

            const signedUrl = this.getSignedCloudinaryUrl(doc.publicId, resourceType);
            console.log(`🔐 Signed URL for ${doc.fieldName}:`, signedUrl);

            const fileResp = await fetch(signedUrl);
            if (!fileResp.ok) throw new Error(`HTTP ${fileResp.status}`);

            const buffer = await fileResp.arrayBuffer();

            attachments.push({
              filename: doc.originalName || `${doc.fieldName}.file`,
              content: Buffer.from(buffer),
              contentType: doc.fileType === "image" ? "image/png" : "application/pdf"
            });

            console.log(`✅ Attached ${doc.fieldName}`);
          } catch (err) {
            console.warn(`⚠️ Failed to attach ${doc?.fieldName || "unknown"}:`, err.message);
          }
        }
      }


      const info = await transporter.sendMail({
        from: `"AgroSure" <${process.env.ALERT_EMAIL}>`,
        to: bankEmail,
        subject: "📑 New Insurance Claim Submitted – AgroSure.ai",
        html,
        attachments,
      });

      if (info.rejected.length > 0) {
        console.warn("⚠️ Email rejected:", info.rejected);
        return false;
      }

      console.log("✅ Insurance claim email sent to:", info.accepted);
      return true;
    } catch (err) {
      console.error("❌ Error sending insurance email:", err.message);
      return false;
    }
  }
}

export default new SendNotification();
