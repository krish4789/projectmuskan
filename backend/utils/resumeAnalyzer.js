const Groq = require('groq-sdk');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function isValidResume(text) {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length < 80) return false;

  const prompt = `You are a strict resume validator. Determine if the following text is a REAL, substantive resume.

REJECT if ANY of these are true:
- It is a job description or job posting
- Total word count is under 80 words
- It lacks actual bullet points or descriptions under experience/education (just listing a company name and year is NOT enough)
- It has no skills section or technical/professional skills listed
- It reads like a placeholder, test document, or incomplete draft

ACCEPT only if ALL of these are true:
- It is clearly written by a job seeker about themselves
- Experience entries have actual descriptions of responsibilities or achievements (not just a job title and year)
- It has meaningful content across at least 3 sections

Respond ONLY with valid JSON: {"isResume": true} or {"isResume": false}

Text:
${text.slice(0, 2000)}`;

  const completion = await groq.chat.completions.create({
    model: 'llama-3.1-8b-instant',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0,
  });

  const raw = completion.choices[0].message.content.trim();
  const json = raw.replace(/^```(?:json)?\n?|```$/g, '').trim();
  const { isResume } = JSON.parse(json);
  return isResume === true;
}

async function analyzeResume(text) {
  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
  const prompt = `You are a strict, professional resume scorer and career coach AI. Analyze this resume deeply and return a comprehensive JSON report.

SCORING RULES (be strict, do NOT be generous):

1. CONTENT score (0-100): Each experience/project with 3+ bullet points: +20 (max 60). Summary with 3+ sentences: +15. Certifications: +10.
2. SKILLS score (0-100): 10+ skills: 80-100. 5-9: 50-79. 1-4: 10-40. None: 0.
3. STRUCTURE score (0-100): All 4 sections present: 100. Missing 1: 75. Missing 2: 50. Missing 3+: 20.
4. TONE & STYLE score (0-100): Action verbs: +30. Quantified achievements: +30. Summary: +20. Consistent formatting: +20.
5. OVERALL score: Content 35% + Skills 25% + Structure 20% + Tone&Style 20%.
6. ATS score (0-100): keyword density + section clarity. No keywords: max 30. Rich keywords: 70-100.
7. atsCompatibility (0-100): Can ATS parse sections cleanly? Penalize tables, columns, graphics.
8. recruiterReadability (0-100): Is it easy to skim in 6-8 seconds? Clear hierarchy, bullet points, concise.
9. technicalDepth (0-100): Depth of technical content, complexity of projects, technologies mentioned.
10. formattingQuality (0-100): Consistent fonts/spacing, proper section headers, no clutter.

Resume word count: ${wordCount}

Respond ONLY with a valid JSON object (no markdown, no explanation):
{
  "score": <overall 0-100>,
  "wordCount": ${wordCount},
  "atsCompatibility": <0-100>,
  "recruiterReadability": <0-100>,
  "technicalDepth": <0-100>,
  "formattingQuality": <0-100>,
  "detectedSections": <array from: skills, education, experience, projects, certifications, summary, contact>,
  "missingSections": <array from: skills, education, experience, projects, certifications, summary, contact>,
  "suggestions": <array of 5-7 specific actionable suggestion strings>,
  "feedback": "<2-3 sentence honest feedback referencing actual content>",
  "atsScore": <0-100>,
  "atsFeedback": "<2-3 sentence ATS feedback>",
  "atsProbability": <"high"|"moderate"|"low">,
  "missingKeywords": <array of 5-8 important missing keywords for the detected role>,
  "keywordMatchPercent": <0-100>,
  "strengths": <array of 3-4 strength strings (concise, e.g. "Strong project diversity")>,
  "weaknesses": <array of 3-4 weakness strings (concise, e.g. "No quantified achievements")>,
  "grammarScore": <0-100>,
  "grammarIssues": <number of grammar issues found>,
  "overusedWords": <array of 2-3 overused word strings>,
  "passiveVoiceCount": <number>,
  "readabilityScore": <0-100>,
  "avgSentenceLength": <number>,
  "recruiterScanTime": "<e.g. 6-8 seconds>",
  "recruiterNoticesFirst": <array of 2-3 section names recruiters will notice first>,
  "shortlistLikelihood": <"high"|"moderate"|"low">,
  "skillsFound": <array of technical skill strings found in resume>,
  "missingSkills": <array of 5-6 important missing skill strings for the role>,
  "skillCategories": {
    "frontend": <"strong"|"moderate"|"weak"|"missing">,
    "backend": <"strong"|"moderate"|"weak"|"missing">,
    "cloud": <"strong"|"moderate"|"weak"|"missing">,
    "devops": <"strong"|"moderate"|"weak"|"missing">,
    "database": <"strong"|"moderate"|"weak"|"missing">
  },
  "jobRoleMatch": {
    "detectedRole": "<best matching role e.g. Full Stack Developer>",
    "matchPercent": <0-100>,
    "missingForRole": <array of 3-5 missing skills/keywords for that role>
  },
  "projectAnalysis": <array of objects: { "name": "<project name>", "score": <0-10>, "strengths": ["<str>"], "improvements": ["<str>"] }>,
  "rewriteSuggestions": <array of 2-3 objects: { "original": "<weak bullet from resume>", "improved": "<stronger rewritten version>" }>,
  "categories": {
    "toneAndStyle": { "score": <0-100>, "items": [{ "title": "<title>", "status": "good|warning", "description": "<detail>" }] },
    "content": { "score": <0-100>, "items": [{ "title": "<title>", "status": "good|warning", "description": "<detail>" }] },
    "structure": { "score": <0-100>, "items": [{ "title": "<title>", "status": "good|warning", "description": "<detail>" }] },
    "skills": { "score": <0-100>, "items": [{ "title": "<title>", "status": "good|warning", "description": "<detail>" }] }
  }
}

Resume text:
${text.slice(0, 4000)}`;

  const completion = await groq.chat.completions.create({
    model: 'llama-3.1-8b-instant',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.3,
  });

  const raw = completion.choices[0].message.content.trim();
  const json = raw.replace(/^```(?:json)?\n?|```$/g, '').trim();
  const parsed = JSON.parse(json);
  parsed.detectedSections = (parsed.detectedSections || []).map(s => s.toLowerCase());
  parsed.missingSections = (parsed.missingSections || []).map(s => s.toLowerCase());
  return parsed;
}

module.exports = { analyzeResume, isValidResume };
