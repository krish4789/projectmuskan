const Groq = require('groq-sdk');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function analyzeResume(text) {
  const prompt = `You are a professional resume reviewer. Analyze the following resume text and respond ONLY with a valid JSON object (no markdown, no explanation) in this exact format:
{
  "score": <overall number 0-100>,
  "wordCount": <number>,
  "detectedSections": <array of strings from: skills, education, experience, projects, certifications>,
  "missingSections": <array of strings from: skills, education, experience, projects, certifications>,
  "suggestions": <array of short actionable suggestion strings>,
  "feedback": "<2-3 sentence overall AI feedback on the resume>",
  "atsScore": <number 0-100>,
  "atsFeedback": "<2-3 sentence ATS feedback>",
  "categories": {
    "toneAndStyle": {
      "score": <number 0-100>,
      "items": [
        { "title": "<item title>", "status": "good|warning", "description": "<detail>" }
      ]
    },
    "content": {
      "score": <number 0-100>,
      "items": [
        { "title": "<item title>", "status": "good|warning", "description": "<detail>" }
      ]
    },
    "structure": {
      "score": <number 0-100>,
      "items": [
        { "title": "<item title>", "status": "good|warning", "description": "<detail>" }
      ]
    },
    "skills": {
      "score": <number 0-100>,
      "items": [
        { "title": "<item title>", "status": "good|warning", "description": "<detail>" }
      ]
    }
  }
}

For each category provide 2-4 items mixing good and warning statuses based on actual resume content.

Resume text:
${text.slice(0, 4000)}`;

  const completion = await groq.chat.completions.create({
    model: 'llama-3.1-8b-instant',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.3,
  });

  const raw = completion.choices[0].message.content.trim();
  // Strip markdown code fences if model wraps response
  const json = raw.replace(/^```(?:json)?\n?|```$/g, '').trim();
  const parsed = JSON.parse(json);
  // Normalize section names to lowercase to ensure consistent matching
  parsed.detectedSections = (parsed.detectedSections || []).map(s => s.toLowerCase());
  parsed.missingSections = (parsed.missingSections || []).map(s => s.toLowerCase());
  return parsed;
}

module.exports = analyzeResume;
