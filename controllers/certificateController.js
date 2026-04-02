const { Certificate, User, Course } = require('../models/associations');
const certificateService = require('../services/certificateService');
const path = require('path');

// Generate certificate for completed course
exports.generateCertificate = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user.id;
    const { quizScore } = req.body;
    
    // Check if user completed the course
    // For now, we'll accept quizScore >= 70
    if (quizScore < 70) {
      return res.status(400).json({
        success: false,
        message: 'You need at least 70% score to get certificate'
      });
    }
    
    // Create certificate
    const certificate = await certificateService.createCertificate(
      userId,
      courseId,
      quizScore
    );
    
    // Generate PDF
    const pdf = await certificateService.generatePDF(certificate.id);
    
    res.json({
      success: true,
      message: 'Certificate generated successfully',
      data: {
        certificateId: certificate.id,
        certificateNumber: certificate.certificateNumber,
        verificationCode: certificate.verificationCode,
        downloadUrl: `/api/certificates/${certificate.id}/download`,
        verifyUrl: `/api/certificates/verify/${certificate.verificationCode}`
      }
    });
  } catch (error) {
    console.error('Generate certificate error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate certificate',
      error: error.message
    });
  }
};

// Download certificate PDF
exports.downloadCertificate = async (req, res) => {
  try {
    const { certificateId } = req.params;
    
    const certificate = await Certificate.findByPk(certificateId);
    
    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: 'Certificate not found'
      });
    }
    
    // Check if user owns this certificate or is admin
    if (certificate.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    if (!certificate.pdfPath || !fs.existsSync(certificate.pdfPath)) {
      return res.status(404).json({
        success: false,
        message: 'PDF file not found'
      });
    }
    
    res.download(certificate.pdfPath, `certificate_${certificate.certificateNumber}.pdf`);
  } catch (error) {
    console.error('Download certificate error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to download certificate',
      error: error.message
    });
  }
};

// Get user's certificates
exports.getMyCertificates = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const certificates = await Certificate.findAll({
      where: { userId },
      include: [
        { model: Course, as: 'course', attributes: ['id', 'title', 'thumbnail'] }
      ],
      order: [['issueDate', 'DESC']]
    });
    
    res.json({
      success: true,
      count: certificates.length,
      data: certificates
    });
  } catch (error) {
    console.error('Get certificates error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get certificates',
      error: error.message
    });
  }
};

// Verify certificate (public)
exports.verifyCertificate = async (req, res) => {
  try {
    const { verificationCode } = req.params;
    
    const result = await certificateService.verifyCertificate(verificationCode);
    
    res.json(result);
  } catch (error) {
    console.error('Verify certificate error:', error);
    res.status(500).json({
      success: false,
      message: 'Verification failed',
      error: error.message
    });
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
    
    res.json({
      success: true,
      count: certificates.length,
      data: certificates
    });
  } catch (error) {
    console.error('Get all certificates error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get certificates',
      error: error.message
    });
  }
};