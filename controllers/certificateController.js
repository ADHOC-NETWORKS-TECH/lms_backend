const { Certificate, User, Course } = require('../models/associations');
const PDFDocument = require('pdfkit');

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

// Generate certificate
exports.generateCertificate = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user.id;
    const { quizScore } = req.body;
    
        
    if (quizScore < 70) {
      return res.status(400).json({
        success: false,
        message: 'You need at least 70% score to get certificate'
      });
    }
    
    // Check if certificate already exists
    const existing = await Certificate.findOne({ where: { userId, courseId } });
    if (existing) {
      return res.json({
        success: true,
        message: 'Certificate already exists',
        data: existing
      });
    }
    
    const certificate = await Certificate.create({
      userId,
      courseId,
      certificateNumber: generateCertificateNumber(),
      verificationCode: generateVerificationCode(),
      quizScore,
      issueDate: new Date(),
      isVerified: true
    });
    
    res.json({
      success: true,
      message: 'Certificate generated successfully',
      data: {
        id: certificate.id,
        certificateNumber: certificate.certificateNumber,
        verificationCode: certificate.verificationCode,
        downloadUrl: `/api/certificates/${certificate.id}/download`,
        verifyUrl: `/api/certificates/verify/${certificate.verificationCode}`
      }
    });
  } catch (error) {
        res.status(500).json({ success: false, message: error.message });
  }
};

// Get user's certificates
exports.getMyCertificates = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const certificates = await Certificate.findAll({
      where: { userId },
      include: [{ model: Course, as: 'course', attributes: ['id', 'title', 'thumbnail'] }],
      order: [['issueDate', 'DESC']]
    });
    
    res.json({ success: true, data: certificates });
  } catch (error) {
        res.status(500).json({ success: false, message: error.message });
  }
};

// Download certificate PDF
exports.downloadCertificate = async (req, res) => {
  try {
    const { certificateId } = req.params;
    
    const certificate = await Certificate.findByPk(certificateId, {
      include: [
        { model: User, as: 'user' },
        { model: Course, as: 'course' }
      ]
    });
    
    if (!certificate) {
      return res.status(404).json({ success: false, message: 'Certificate not found' });
    }
    
    // Create PDF
    const doc = new PDFDocument({
      size: 'A4',
      layout: 'landscape',
      margin: 0
    });
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=certificate_${certificate.certificateNumber}.pdf`);
    
    doc.pipe(res);
    
    const width = doc.page.width;
    const height = doc.page.height;

    // Outer light blue-gray background
    doc.rect(0, 0, width, height).fill('#e2e8f0');
    
    // White inner background
    doc.rect(20, 20, width - 40, height - 40).fill('#ffffff');

    // Thick dark blue border
    doc.rect(40, 40, width - 80, height - 80).lineWidth(12).strokeColor('#1e3a8a').stroke();

    // Thin gold border
    doc.rect(60, 60, width - 120, height - 120).lineWidth(2).strokeColor('#ca8a04').stroke();

    // "CERTIFICATE"
    doc.fontSize(46).font('Helvetica-Bold').fillColor('#1e3a8a')
       .text('C E R T I F I C A T E', 0, 110, { align: 'center', width: width, lineBreak: false });
    
    // "of completion"
    doc.fontSize(20).font('Helvetica-Bold').fillColor('#ca8a04')
       .text('of completion', 0, 165, { align: 'center', width: width, lineBreak: false });
    
    // "This certificate is proudly presented to"
    doc.fontSize(14).font('Helvetica').fillColor('#475569')
       .text('This certificate is proudly presented to', 0, 220, { align: 'center', width: width, lineBreak: false });
    
    // Student Name
    doc.fontSize(46).font('Helvetica-Bold').fillColor('#0f172a')
       .text(certificate.user.name, 0, 260, { align: 'center', width: width, lineBreak: false });
    
    // Line under student name
    doc.moveTo(180, 320).lineTo(width - 180, 320).lineWidth(2).strokeColor('#1e3a8a').stroke();

    // Paragraph text
    doc.fontSize(14).font('Helvetica').fillColor('#475569')
       .text('For successfully completing the comprehensive training program in', 0, 350, { align: 'center', width: width, lineBreak: false });
    
    doc.fontSize(16).font('Helvetica-Bold').fillColor('#1e3a8a')
       .text(`"${certificate.course.title}"`, 0, 375, { align: 'center', width: width, lineBreak: false });
    
    doc.fontSize(14).font('Helvetica').fillColor('#475569')
       .text('on our Learning Management Portal, demonstrating excellence in all modules.', 0, 400, { align: 'center', width: width, lineBreak: false });

    // Bottom section Y
    const bottomY = 490;

    // Issue Date
    const issueDateStr = new Date(certificate.issueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    
    // Line for Date
    doc.moveTo(140, bottomY).lineTo(300, bottomY).lineWidth(1).strokeColor('#475569').stroke();
    // Date text above line
    doc.fontSize(14).font('Helvetica-Bold').fillColor('#0f172a')
       .text(issueDateStr, 140, bottomY - 20, { width: 160, align: 'center', lineBreak: false });
    doc.fontSize(10).font('Helvetica-Bold').fillColor('#1e3a8a')
       .text('ISSUE DATE', 140, bottomY + 10, { width: 160, align: 'center', lineBreak: false });

    // Center Gold Seal
    const centerX = width / 2;
    doc.circle(centerX, bottomY - 15, 40).fillAndStroke('#ca8a04', '#fef08a');
    doc.circle(centerX, bottomY - 15, 36).lineWidth(1).strokeColor('#ffffff').stroke();
    // Text in seal
    doc.fontSize(8).font('Helvetica-Bold').fillColor('#ffffff')
       .text('OFFICIALLY', centerX - 35, bottomY - 20, { width: 70, align: 'center', lineBreak: false });
    doc.text('VERIFIED', centerX - 35, bottomY - 10, { width: 70, align: 'center', lineBreak: false });

    // Program Director
    doc.moveTo(width - 300, bottomY).lineTo(width - 140, bottomY).lineWidth(1).strokeColor('#475569').stroke();
    doc.fontSize(20).font('Times-Italic').fillColor('#0f172a')
       .text('Adhoc LMS', width - 300, bottomY - 25, { width: 160, align: 'center', lineBreak: false });
    doc.fontSize(10).font('Helvetica-Bold').fillColor('#1e3a8a')
       .text('PROGRAM DIRECTOR', width - 300, bottomY + 10, { width: 160, align: 'center', lineBreak: false });

    // Verification ID
    doc.fontSize(9).font('Helvetica').fillColor('#94a3b8')
       .text(`VERIFICATION ID: ${certificate.certificateNumber}`, 0, height - 70, { width: width - 70, align: 'right', lineBreak: false });
    doc.fontSize(9).font('Helvetica').fillColor('#94a3b8')
       .text(`VERIFY CODE: ${certificate.verificationCode}`, 0, height - 55, { width: width - 70, align: 'right', lineBreak: false });

    doc.end();
  } catch (error) {
        res.status(500).json({ success: false, message: error.message });
  }
};

// Verify certificate (public)
exports.verifyCertificate = async (req, res) => {
  try {
    const { verificationCode } = req.params;
    
    const certificate = await Certificate.findOne({
      where: { verificationCode },
      include: [
        { model: User, as: 'user', attributes: ['id', 'name'] },
        { model: Course, as: 'course', attributes: ['id', 'title'] }
      ]
    });
    
    if (!certificate) {
      return res.json({ valid: false, message: 'Certificate not found' });
    }
    
    res.json({
      valid: true,
      data: {
        studentName: certificate.user.name,
        courseTitle: certificate.course.title,
        issueDate: certificate.issueDate,
        certificateNumber: certificate.certificateNumber,
        score: certificate.quizScore
      }
    });
  } catch (error) {
        res.status(500).json({ success: false, message: error.message });
  }
};

// Admin: Get all certificates
exports.getAllCertificates = async (req, res) => {
  try {
    const certificates = await Certificate.findAll({
      include: [
        { model: User, as: 'user', attributes: ['id', 'name', 'email'] },
        { model: Course, as: 'course', attributes: ['id', 'title'] }
      ],
      order: [['issueDate', 'DESC']]
    });
    
    res.json({ success: true, data: certificates });
  } catch (error) {
        res.status(500).json({ success: false, message: error.message });
  }
};
