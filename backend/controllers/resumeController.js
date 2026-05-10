const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const fs = require('fs');
const Resume = require('../models/Resume');
const analyzeResume = require('../utils/resumeAnalyzer');

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
