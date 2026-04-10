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
    const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 50 });
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=certificate_${certificate.certificateNumber}.pdf`);
    
    doc.pipe(res);
    
    // Design certificate
    doc.rect(20, 20, doc.page.width - 40, doc.page.height - 40)
       .strokeColor('#4CAF50').lineWidth(5).stroke();
    
    doc.rect(30, 30, doc.page.width - 60, doc.page.height - 60)
       .strokeColor('#FF9800').lineWidth(2).stroke();
    
    doc.fontSize(48).font('Helvetica-Bold').fillColor('#4CAF50')
       .text('CERTIFICATE OF COMPLETION', 0, 80, { align: 'center' });
    
    doc.fontSize(20).font('Helvetica').fillColor('#666')
       .text('This certificate is proudly presented to', 0, 180, { align: 'center' });
    
    doc.fontSize(42).font('Helvetica-Bold').fillColor('#2196F3')
       .text(certificate.user.name, 0, 250, { align: 'center' });
    
    doc.fontSize(18).font('Helvetica').fillColor('#666')
       .text('for successfully completing the course', 0, 330, { align: 'center' });
    
    doc.fontSize(28).font('Helvetica-Bold').fillColor('#FF9800')
       .text(certificate.course.title, 0, 380, { align: 'center' });
    
    doc.fontSize(14).font('Helvetica').fillColor('#666')
       .text(`with a score of ${certificate.quizScore}%`, 0, 450, { align: 'center' });
    
    doc.fontSize(12).text(`Issue Date: ${new Date(certificate.issueDate).toLocaleDateString()}`, 50, doc.page.height - 80);
    doc.fontSize(10).text(`Certificate No: ${certificate.certificateNumber}`, 50, doc.page.height - 60);
    doc.fontSize(10).text(`Verification Code: ${certificate.verificationCode}`, 50, doc.page.height - 40);
    
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