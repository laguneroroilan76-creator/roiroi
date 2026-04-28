const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure Multer Storage for E-Signatures
const signatureStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'uploads/signatures/';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'sign-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Configure Multer Storage for Avatars
const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'uploads/avatars/';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'avatar-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const uploadSignature = multer({ storage: signatureStorage });
const uploadAvatar = multer({ storage: avatarStorage });

module.exports = { uploadSignature, uploadAvatar };
