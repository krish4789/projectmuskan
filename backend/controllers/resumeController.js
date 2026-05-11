const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const fs = require('fs');
const Resume = require('../models/Resume');
const { analyzeResume, isValidResume } = require('../utils/resumeAnalyzer');

exports.guestUpload = async (req, res) => {
  try {
    const guestId = req.headers['x-guest-id'];
    if (!guestId) return res.status(400).json({ message: 'Missing guest ID' });

    const count = await Resume.countDocuments({ guestId });
    if (count >= 2) return res.status(403).json({ message: 'Guest limit reached. Please register to continue.' });

    const file = req.file;
    if (!file) return res.status(400).json({ message: 'No file uploaded' });

    let text = '';
    if (file.mimetype === 'application/pdf') {
      const data = await pdfParse(fs.readFileSync(file.path));
      text = data.text;
    } else {
      const result = await mammoth.extractRawText({ path: file.path });
      text = result.value;
    }

    if (!text || text.trim().length < 50)
      return res.status(400).json({ message: 'Resume appears to be blank or incomplete' });

    const valid = await isValidResume(text);
    if (!valid)
      return res.status(400).json({ message: "The file doesn't look like a resume." });

    const analysis = await analyzeResume(text);
    const resume = await Resume.create({ guestId, fileName: file.originalname, parsedText: text, ...analysis });

    res.json({ resumeId: resume._id, uploadsLeft: 1 - count, ...analysis });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error processing resume' });
  }
};

exports.uploadResume = async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ message: 'No file uploaded' });

    let text = '';
    if (file.mimetype === 'application/pdf') {
      const data = await pdfParse(fs.readFileSync(file.path));
      text = data.text;
    } else {
      const result = await mammoth.extractRawText({ path: file.path });
      text = result.value;
    }

    if (!text || text.trim().length < 50)
      return res.status(400).json({ message: 'Resume appears to be blank or incomplete. Please upload a valid resume.' });

    const valid = await isValidResume(text);
    if (!valid)
      return res.status(400).json({ message: "The file doesn't look like a resume. Please upload a valid resume." });

    const analysis = await analyzeResume(text);

    const resume = await Resume.create({
      userId: req.userId,
      fileName: file.originalname,
      parsedText: text,
      ...analysis
    });

    res.json({ resumeId: resume._id, ...analysis });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error processing resume' });
  }
};

exports.getGuestResume = async (req, res) => {
  try {
    const guestId = req.headers['x-guest-id'];
    const resume = await Resume.findOne({ _id: req.params.id, guestId });
    if (!resume) return res.status(404).json({ message: 'Resume not found' });
    res.json(resume);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getResume = async (req, res) => {
  try {
    const resume = await Resume.findOne({ _id: req.params.id, userId: req.userId });
    if (!resume) return res.status(404).json({ message: 'Resume not found' });
    res.json(resume);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getUserResumes = async (req, res) => {
  try {
    const resumes = await Resume.find({ userId: req.userId }).select('-parsedText').sort({ uploadedAt: -1 });
    res.json(resumes);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};
