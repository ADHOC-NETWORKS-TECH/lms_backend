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
    
    console.log(`📜 Generating certificate for user ${userId}, course ${courseId}, score ${quizScore}`);
    
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
    console.error('Generate certificate error:', error);
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
    console.error('Get certificates error:', error);
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
      margin: 0 // Remove margin to prevent accidental pagination
    });
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=certificate_${certificate.certificateNumber}.pdf`);
    
    doc.pipe(res);
    
    const width = doc.page.width;
    const height = doc.page.height;

    // Design certificate background
    doc.rect(0, 0, width, height).fill('#ffffff');

    // Outer Border
    doc.rect(20, 20, width - 40, height - 40).lineWidth(10).strokeColor('#0f172a').stroke();
    // Inner Border
    doc.rect(35, 35, width - 70, height - 70).lineWidth(2).strokeColor('#ca8a04').stroke();

    // Corner decorations (Gold)
    doc.path('M 35,75 L 35,35 L 75,35').lineWidth(6).strokeColor('#ca8a04').stroke();
    doc.path(`M ${width - 35},75 L ${width - 35},35 L ${width - 75},35`).lineWidth(6).strokeColor('#ca8a04').stroke();
    doc.path(`M 35,${height - 75} L 35,${height - 35} L 75,${height - 35}`).lineWidth(6).strokeColor('#ca8a04').stroke();
    doc.path(`M ${width - 35},${height - 75} L ${width - 35},${height - 35} L ${width - 75},${height - 35}`).lineWidth(6).strokeColor('#ca8a04').stroke();

    // Title
    doc.fontSize(40).font('Helvetica-Bold').fillColor('#0f172a')
       .text('CERTIFICATE OF COMPLETION', 0, 100, { align: 'center', width: width });
    
    // Subtitle
    doc.fontSize(16).font('Helvetica-Oblique').fillColor('#64748b')
       .text('THIS PROUDLY CERTIFIES THAT', 0, 170, { align: 'center', width: width });
    
    // Student Name
    doc.fontSize(48).font('Helvetica-Bold').fillColor('#ca8a04')
       .text(certificate.user.name, 0, 220, { align: 'center', width: width });
    
    // Course Description
    doc.fontSize(16).font('Helvetica').fillColor('#64748b')
       .text('HAS SUCCESSFULLY COMPLETED THE COURSE', 0, 300, { align: 'center', width: width });
    
    // Course Title
    doc.fontSize(28).font('Helvetica-Bold').fillColor('#0f172a')
       .text(certificate.course.title, 0, 340, { align: 'center', width: width });
    
    // Score
    if (certificate.quizScore != null) {
      doc.fontSize(14).font('Helvetica-Bold').fillColor('#10b981')
         .text(`WITH A SCORE OF ${certificate.quizScore}%`, 0, 390, { align: 'center', width: width });
    }

    // Signatures and Date Line
    const signatureY = height - 140;

    // Issue Date
    doc.fontSize(12).font('Helvetica-Bold').fillColor('#0f172a')
       .text(new Date(certificate.issueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }), 120, signatureY);
    doc.rect(100, signatureY + 20, 200, 1).fill('#0f172a');
    doc.fontSize(10).font('Helvetica').fillColor('#64748b')
       .text('DATE OF ISSUE', 100, signatureY + 30, { width: 200, align: 'center' });

    // Verification info (bottom left)
    doc.fontSize(9).font('Helvetica').fillColor('#94a3b8')
       .text(`Certificate No: ${certificate.certificateNumber}`, 40, height - 60);
    doc.fontSize(9).font('Helvetica').fillColor('#94a3b8')
       .text(`Verification Code: ${certificate.verificationCode}`, 40, height - 45);

    // Signature 
    doc.fontSize(24).font('Helvetica-Oblique').fillColor('#ca8a04')
       .text('Adhoc LMS', width - 300, signatureY - 10, { align: 'center', width: 200 });
    doc.rect(width - 300, signatureY + 20, 200, 1).fill('#0f172a');
    doc.fontSize(10).font('Helvetica').fillColor('#64748b')
       .text('DIRECTOR', width - 300, signatureY + 30, { width: 200, align: 'center' });
       
    // Add verification link (bottom right)
    doc.fontSize(9).font('Helvetica').fillColor('#3b82f6')
       .text(`Verify at: https://lms.adhoc.com/verify-certificate/${certificate.verificationCode}`, width - 350, height - 60, { width: 310, align: 'right' });

    doc.end();
  } catch (error) {
    console.error('Download certificate error:', error);
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
    console.error('Verify certificate error:', error);
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
    console.error('Get all certificates error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};