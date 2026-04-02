const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const { Certificate, User, Course } = require('../models/associations');

// Generate unique certificate number
const generateCertificateNumber = () => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 10).toUpperCase();
  return `LMS-${timestamp}-${random}`;
};

// Generate verification code
const generateVerificationCode = () => {
  return Math.random().toString(36).substring(2, 15).toUpperCase();
};

// Create certificate in database
exports.createCertificate = async (userId, courseId, quizScore) => {
  try {
    // Check if certificate already exists
    const existing = await Certificate.findOne({
      where: { userId, courseId }
    });
    
    if (existing) {
      return existing;
    }
    
    const certificateNumber = generateCertificateNumber();
    const verificationCode = generateVerificationCode();
    
    const certificate = await Certificate.create({
      userId,
      courseId,
      certificateNumber,
      verificationCode,
      quizScore,
      issueDate: new Date(),
      isVerified: true
    });
    
    return certificate;
  } catch (error) {
    console.error('Create certificate error:', error);
    throw error;
  }
};

// Generate PDF certificate
exports.generatePDF = async (certificateId) => {
  try {
    const certificate = await Certificate.findByPk(certificateId, {
      include: [
        { model: User, as: 'user' },
        { model: Course, as: 'course' }
      ]
    });
    
    if (!certificate) {
      throw new Error('Certificate not found');
    }
    
    // Create PDF
    const doc = new PDFDocument({
      size: 'A4',
      layout: 'landscape',
      margin: 50
    });
    
    // Create filename
    const filename = `certificate_${certificate.certificateNumber}.pdf`;
    const filepath = path.join(__dirname, '../uploads/certificates/', filename);
    
    // Ensure directory exists
    const dir = path.dirname(filepath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    // Create write stream
    const stream = fs.createWriteStream(filepath);
    doc.pipe(stream);
    
    // Add border
    doc.rect(20, 20, doc.page.width - 40, doc.page.height - 40)
       .strokeColor('#4CAF50')
       .lineWidth(5)
       .stroke();
    
    // Add decorative border
    doc.rect(30, 30, doc.page.width - 60, doc.page.height - 60)
       .strokeColor('#FF9800')
       .lineWidth(2)
       .stroke();
    
    // Add header text
    doc.fontSize(48)
       .font('Helvetica-Bold')
       .fillColor('#4CAF50')
       .text('CERTIFICATE OF COMPLETION', 0, 80, { align: 'center' });
    
    doc.fontSize(20)
       .font('Helvetica')
       .fillColor('#666')
       .text('This certificate is proudly presented to', 0, 180, { align: 'center' });
    
    // Add student name
    doc.fontSize(42)
       .font('Helvetica-Bold')
       .fillColor('#2196F3')
       .text(certificate.user.name, 0, 250, { align: 'center' });
    
    // Add course text
    doc.fontSize(18)
       .font('Helvetica')
       .fillColor('#666')
       .text('for successfully completing the course', 0, 330, { align: 'center' });
    
    // Add course name
    doc.fontSize(28)
       .font('Helvetica-Bold')
       .fillColor('#FF9800')
       .text(certificate.course.title, 0, 380, { align: 'center' });
    
    // Add score
    doc.fontSize(14)
       .font('Helvetica')
       .fillColor('#666')
       .text(`with a score of ${certificate.quizScore}%`, 0, 450, { align: 'center' });
    
    // Add date
    const issueDate = new Date(certificate.issueDate).toLocaleDateString();
    doc.fontSize(12)
       .text(`Issue Date: ${issueDate}`, 50, doc.page.height - 80);
    
    // Add certificate number
    doc.fontSize(10)
       .text(`Certificate No: ${certificate.certificateNumber}`, 50, doc.page.height - 60);
    
    // Add verification code
    doc.text(`Verification Code: ${certificate.verificationCode}`, 50, doc.page.height - 40);
    
    // Add signature
    doc.fontSize(12)
       .text('Authorized Signature', doc.page.width - 200, doc.page.height - 80);
    doc.moveTo(doc.page.width - 250, doc.page.height - 90)
       .lineTo(doc.page.width - 50, doc.page.height - 90)
       .stroke();
    
    // Add seal
    doc.circle(doc.page.width - 100, doc.page.height - 50, 30)
       .strokeColor('#4CAF50')
       .lineWidth(2)
       .stroke();
    doc.fontSize(10)
       .text('LMS', doc.page.width - 110, doc.page.height - 60);
    
    // Finalize PDF
    doc.end();
    
    // Wait for stream to finish
    await new Promise((resolve) => {
      stream.on('finish', resolve);
    });
    
    // Update certificate with PDF path
    await certificate.update({ pdfPath: filepath });
    
    return { filepath, filename };
  } catch (error) {
    console.error('Generate PDF error:', error);
    throw error;
  }
};

// Verify certificate by verification code
exports.verifyCertificate = async (verificationCode) => {
  try {
    const certificate = await Certificate.findOne({
      where: { verificationCode },
      include: [
        { model: User, as: 'user', attributes: ['id', 'name', 'email'] },
        { model: Course, as: 'course', attributes: ['id', 'title'] }
      ]
    });
    
    if (!certificate) {
      return { valid: false, message: 'Certificate not found' };
    }
    
    return {
      valid: true,
      certificate: {
        certificateNumber: certificate.certificateNumber,
        studentName: certificate.user.name,
        courseTitle: certificate.course.title,
        issueDate: certificate.issueDate,
        score: certificate.quizScore
      }
    };
  } catch (error) {
    console.error('Verify certificate error:', error);
    throw error;
  }
};