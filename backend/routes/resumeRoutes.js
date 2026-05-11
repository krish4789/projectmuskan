const router = require('express').Router();
const multer = require('multer');
const jwt = require('jsonwebtoken');
const path = require('path');
const { uploadResume, getResume, getUserResumes, guestUpload, getGuestResume } = require('../controllers/resumeController');

// JWT auth middleware
const auth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Unauthorized' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch {
    res.status(401).json({ message: 'Invalid token' });
  }
};

const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowed = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    cb(null, allowed.includes(file.mimetype));
  }
});

router.post('/guest/upload', upload.single('resume'), guestUpload);
router.get('/guest/resume/:id', getGuestResume);
router.post('/upload', auth, upload.single('resume'), uploadResume);
router.get('/resumes', auth, getUserResumes);
router.get('/resume/:id', auth, getResume);

module.exports = router;
