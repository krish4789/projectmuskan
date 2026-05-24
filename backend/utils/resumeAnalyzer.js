const Groq = require('groq-sdk');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function isValidResume(text) {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length < 80) return false;

  // Reject placeholder/template resumes immediately
  const placeholderPatterns = [
    /\[your (full )?name\]/i,
    /\[name\]/i,
    /yourname@/i,
    /your(name|email|phone|address)@/i,
    /linkedin\.com\/in\/yourname/i,
    /github\.com\/yourname/i,
    /\+61 xxxx/i,
    /\+91 xxxxx/i,
    /xxxx xxx xxxx/i,
    /task \d+\.\d+ submission/i,
    /notes for.*submission/i,
    /firstname_lastname/i,
    /\[your .{1,30}\]/i,
  ];
  if (placeholderPatterns.some(p => p.test(text))) return false;

  const prompt = `You are a strict resume validator. Determine if the following text is a REAL, substantive resume.

REJECT if ANY of these are true:
- It is a job description or job posting
- Total word count is under 80 words
- It lacks actual bullet points or descriptions under experience/education (just listing a company name and year is NOT enough)
- It has no skills section or technical/professional skills listed
- It reads like a placeholder, test document, or incomplete draft
- It contains placeholder text like [Your Name], yourname@email.com, or XXXX phone numbers
- It contains submission instructions or academic task notes

ACCEPT only if ALL of these are true:
- It is clearly written by a real job seeker with their actual name and contact details
- Experience entries have actual descriptions of responsibilities or achievements
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

async function isValidJD(text) {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length < 50) return false;

  const prompt = `You are a strict job description validator. Determine if the following text is a real job description or job posting.

ACCEPT if it describes a job role with responsibilities, requirements, or qualifications.
REJECT if it is a resume, cover letter, academic paper, or unrelated document.

Respond ONLY with valid JSON: {"isJD": true} or {"isJD": false}

Text:
${text.slice(0, 2000)}`;

  const completion = await groq.chat.completions.create({
    model: 'llama-3.1-8b-instant',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0,
  });

  const raw = completion.choices[0].message.content.trim();
  const json = raw.replace(/^```(?:json)?\n?|```$/g, '').trim();
  const { isJD } = JSON.parse(json);
  return isJD === true;
}

// Verified real course URLs — AI picks keys, we attach these links
const CERT_CATALOG = {
  python: {
    name: 'Python for Everybody',
    provider: 'Coursera / University of Michigan',
    skill: 'Python',
    freeUrl: 'https://www.coursera.org/learn/python',
    paidUrl: 'https://www.udemy.com/course/complete-python-bootcamp/',
  },
  javascript: {
    name: 'JavaScript Algorithms and Data Structures',
    provider: 'freeCodeCamp',
    skill: 'JavaScript',
    freeUrl: 'https://www.freecodecamp.org/learn/javascript-algorithms-and-data-structures/',
    paidUrl: 'https://www.udemy.com/course/the-complete-javascript-course/',
  },
  react: {
    name: 'React - The Complete Guide',
    provider: 'Udemy',
    skill: 'React',
    freeUrl: 'https://react.dev/learn',
    paidUrl: 'https://www.udemy.com/course/react-the-complete-guide-incl-redux/',
  },
  nodejs: {
    name: 'Node.js Developer Course',
    provider: 'Udemy',
    skill: 'Node.js',
    freeUrl: 'https://nodejs.org/en/learn/getting-started/introduction-to-nodejs',
    paidUrl: 'https://www.udemy.com/course/the-complete-nodejs-developer-course-2/',
  },
  sql: {
    name: 'SQL for Data Science',
    provider: 'Coursera / UC Davis',
    skill: 'SQL',
    freeUrl: 'https://www.coursera.org/learn/sql-for-data-science',
    paidUrl: 'https://www.udemy.com/course/the-complete-sql-bootcamp/',
  },
  aws: {
    name: 'AWS Certified Solutions Architect – Associate',
    provider: 'AWS',
    skill: 'AWS',
    freeUrl: 'https://explore.skillbuilder.aws/learn/course/external/view/elearning/125/aws-cloud-practitioner-essentials',
    paidUrl: 'https://www.udemy.com/course/aws-certified-solutions-architect-associate-saa-c03/',
  },
  docker: {
    name: 'Docker & Kubernetes: The Practical Guide',
    provider: 'Udemy',
    skill: 'Docker',
    freeUrl: 'https://docs.docker.com/get-started/',
    paidUrl: 'https://www.udemy.com/course/docker-kubernetes-the-practical-guide/',
  },
  kubernetes: {
    name: 'Certified Kubernetes Administrator (CKA)',
    provider: 'Linux Foundation',
    skill: 'Kubernetes',
    freeUrl: 'https://kubernetes.io/docs/tutorials/kubernetes-basics/',
    paidUrl: 'https://www.udemy.com/course/certified-kubernetes-administrator-with-practice-tests/',
  },
  git: {
    name: 'Git & GitHub Crash Course',
    provider: 'freeCodeCamp',
    skill: 'Git',
    freeUrl: 'https://www.freecodecamp.org/news/git-and-github-for-beginners/',
    paidUrl: 'https://www.udemy.com/course/git-complete/',
  },
  typescript: {
    name: 'Understanding TypeScript',
    provider: 'Udemy',
    skill: 'TypeScript',
    freeUrl: 'https://www.typescriptlang.org/docs/',
    paidUrl: 'https://www.udemy.com/course/understanding-typescript/',
  },
  java: {
    name: 'Java Programming Masterclass',
    provider: 'Udemy',
    skill: 'Java',
    freeUrl: 'https://www.coursera.org/learn/object-oriented-java',
    paidUrl: 'https://www.udemy.com/course/java-the-complete-java-developer-course/',
  },
  'c++': {
    name: 'Beginning C++ Programming',
    provider: 'Udemy',
    skill: 'C++',
    freeUrl: 'https://www.learncpp.com/',
    paidUrl: 'https://www.udemy.com/course/beginning-c-plus-plus-programming/',
  },
  'machine learning': {
    name: 'Machine Learning Specialization',
    provider: 'Coursera / Andrew Ng',
    skill: 'Machine Learning',
    freeUrl: 'https://www.coursera.org/specializations/machine-learning-introduction',
    paidUrl: 'https://www.udemy.com/course/machinelearning/',
  },
  'deep learning': {
    name: 'Deep Learning Specialization',
    provider: 'Coursera / DeepLearning.AI',
    skill: 'Deep Learning',
    freeUrl: 'https://www.coursera.org/specializations/deep-learning',
    paidUrl: 'https://www.udemy.com/course/complete-deep-learning-course-with-python/',
  },
  tensorflow: {
    name: 'TensorFlow Developer Certificate',
    provider: 'Google / Coursera',
    skill: 'TensorFlow',
    freeUrl: 'https://www.tensorflow.org/tutorials',
    paidUrl: 'https://www.coursera.org/professional-certificates/tensorflow-in-practice',
  },
  'data analysis': {
    name: 'Google Data Analytics Certificate',
    provider: 'Google / Coursera',
    skill: 'Data Analysis',
    freeUrl: 'https://www.coursera.org/professional-certificates/google-data-analytics',
    paidUrl: 'https://www.udemy.com/course/data-analysis-with-pandas/',
  },
  pandas: {
    name: 'Data Analysis with Pandas & Python',
    provider: 'Udemy',
    skill: 'Pandas',
    freeUrl: 'https://pandas.pydata.org/docs/getting_started/intro_tutorials/',
    paidUrl: 'https://www.udemy.com/course/data-analysis-with-pandas/',
  },
  mongodb: {
    name: 'MongoDB Basics',
    provider: 'MongoDB University',
    skill: 'MongoDB',
    freeUrl: 'https://learn.mongodb.com/learning-paths/introduction-to-mongodb',
    paidUrl: 'https://www.udemy.com/course/mongodb-the-complete-developers-guide/',
  },
  postgresql: {
    name: 'The Complete SQL & PostgreSQL Bootcamp',
    provider: 'Udemy',
    skill: 'PostgreSQL',
    freeUrl: 'https://www.postgresqltutorial.com/',
    paidUrl: 'https://www.udemy.com/course/sql-and-postgresql/',
  },
  graphql: {
    name: 'GraphQL with React',
    provider: 'Udemy',
    skill: 'GraphQL',
    freeUrl: 'https://graphql.org/learn/',
    paidUrl: 'https://www.udemy.com/course/graphql-with-react-course/',
  },
  'rest api': {
    name: 'REST API Design, Development & Management',
    provider: 'Udemy',
    skill: 'REST API',
    freeUrl: 'https://www.freecodecamp.org/news/rest-api-tutorial/',
    paidUrl: 'https://www.udemy.com/course/rest-api/',
  },
  linux: {
    name: 'Linux Command Line Basics',
    provider: 'Udemy',
    skill: 'Linux',
    freeUrl: 'https://linuxjourney.com/',
    paidUrl: 'https://www.udemy.com/course/linux-command-line-volume1/',
  },
  devops: {
    name: 'DevOps Beginners to Advanced',
    provider: 'Udemy',
    skill: 'DevOps',
    freeUrl: 'https://www.freecodecamp.org/news/devops-engineering-course-for-beginners/',
    paidUrl: 'https://www.udemy.com/course/decodingdevops/',
  },
  cicd: {
    name: 'CI/CD with GitHub Actions',
    provider: 'GitHub / YouTube',
    skill: 'CI/CD',
    freeUrl: 'https://docs.github.com/en/actions/learn-github-actions',
    paidUrl: 'https://www.udemy.com/course/github-actions/',
  },
  terraform: {
    name: 'HashiCorp Certified: Terraform Associate',
    provider: 'HashiCorp',
    skill: 'Terraform',
    freeUrl: 'https://developer.hashicorp.com/terraform/tutorials',
    paidUrl: 'https://www.udemy.com/course/terraform-beginner-to-advanced/',
  },
  azure: {
    name: 'Microsoft Azure Fundamentals (AZ-900)',
    provider: 'Microsoft',
    skill: 'Azure',
    freeUrl: 'https://learn.microsoft.com/en-us/training/paths/azure-fundamentals/',
    paidUrl: 'https://www.udemy.com/course/az900-azure/',
  },
  gcp: {
    name: 'Google Cloud Associate Cloud Engineer',
    provider: 'Google Cloud',
    skill: 'GCP',
    freeUrl: 'https://cloud.google.com/learn/training/cloud-infrastructure',
    paidUrl: 'https://www.udemy.com/course/google-cloud-associate-cloud-engineer-certification/',
  },
  cybersecurity: {
    name: 'Google Cybersecurity Certificate',
    provider: 'Google / Coursera',
    skill: 'Cybersecurity',
    freeUrl: 'https://www.coursera.org/professional-certificates/google-cybersecurity',
    paidUrl: 'https://www.udemy.com/course/total-comptia-security-plus/',
  },
  agile: {
    name: 'Agile Fundamentals: Scrum & Kanban',
    provider: 'Udemy',
    skill: 'Agile / Scrum',
    freeUrl: 'https://www.atlassian.com/agile',
    paidUrl: 'https://www.udemy.com/course/agile-fundamentals-scrum-kanban-scrumban/',
  },
  'system design': {
    name: 'Grokking the System Design Interview',
    provider: 'Educative',
    skill: 'System Design',
    freeUrl: 'https://www.youtube.com/watch?v=i53Gi_K3o7I',
    paidUrl: 'https://www.educative.io/courses/grokking-the-system-design-interview',
  },
  'data structures': {
    name: 'Data Structures & Algorithms',
    provider: 'freeCodeCamp',
    skill: 'Data Structures & Algorithms',
    freeUrl: 'https://www.freecodecamp.org/learn/coding-interview-prep/',
    paidUrl: 'https://www.udemy.com/course/js-algorithms-and-data-structures-masterclass/',
  },
  flutter: {
    name: 'Flutter & Dart - The Complete Guide',
    provider: 'Udemy',
    skill: 'Flutter',
    freeUrl: 'https://docs.flutter.dev/get-started/codelab',
    paidUrl: 'https://www.udemy.com/course/learn-flutter-dart-to-build-ios-android-apps/',
  },
  'react native': {
    name: 'React Native - The Practical Guide',
    provider: 'Udemy',
    skill: 'React Native',
    freeUrl: 'https://reactnative.dev/docs/getting-started',
    paidUrl: 'https://www.udemy.com/course/react-native-the-practical-guide/',
  },
  django: {
    name: 'Django for Beginners',
    provider: 'Udemy',
    skill: 'Django',
    freeUrl: 'https://docs.djangoproject.com/en/stable/intro/tutorial01/',
    paidUrl: 'https://www.udemy.com/course/python-and-django-full-stack-web-developer-bootcamp/',
  },
  'spring boot': {
    name: 'Spring Boot 3 & Spring Framework 6',
    provider: 'Udemy',
    skill: 'Spring Boot',
    freeUrl: 'https://spring.io/guides',
    paidUrl: 'https://www.udemy.com/course/spring-hibernate-tutorial/',
  },
  communication: {
    name: 'Improving Communication Skills',
    provider: 'Coursera / UPenn',
    skill: 'Communication',
    freeUrl: 'https://www.coursera.org/learn/wharton-communication-skills',
    paidUrl: 'https://www.udemy.com/course/communication-skills-for-beginners/',
  },
  leadership: {
    name: 'Everyday Leadership',
    provider: 'Coursera / Duke',
    skill: 'Leadership',
    freeUrl: 'https://www.coursera.org/learn/everyday-leadership-new',
    paidUrl: 'https://www.udemy.com/course/leadership-masterclass/',
  },
  excel: {
    name: 'Microsoft Excel - Excel from Beginner to Advanced',
    provider: 'Udemy',
    skill: 'Excel',
    freeUrl: 'https://www.coursera.org/learn/excel-basics-data-analysis-ibm',
    paidUrl: 'https://www.udemy.com/course/microsoft-excel-2013-from-beginner-to-advanced-and-beyond/',
  },
  tableau: {
    name: 'Tableau 2024 A-Z',
    provider: 'Udemy',
    skill: 'Tableau',
    freeUrl: 'https://www.tableau.com/learn/training',
    paidUrl: 'https://www.udemy.com/course/tableau10/',
  },
  'power bi': {
    name: 'Microsoft Power BI Desktop',
    provider: 'Udemy',
    skill: 'Power BI',
    freeUrl: 'https://learn.microsoft.com/en-us/training/powerplatform/power-bi',
    paidUrl: 'https://www.udemy.com/course/mspowerbi/',
  },
};

function matchCertFromCatalog(skillKey) {
  const key = skillKey.toLowerCase().trim();
  if (CERT_CATALOG[key]) return CERT_CATALOG[key];
  // fuzzy: check if any catalog key is contained in the skill or vice versa
  for (const [k, v] of Object.entries(CERT_CATALOG)) {
    if (key.includes(k) || k.includes(key)) return v;
  }
  // No catalog match — return a generic entry so the skill is still shown
  return {
    name: skillKey.charAt(0).toUpperCase() + skillKey.slice(1),
    provider: 'Search on Coursera / Udemy',
    skill: skillKey,
    freeUrl: `https://www.coursera.org/search?query=${encodeURIComponent(skillKey)}`,
    paidUrl: `https://www.udemy.com/courses/search/?q=${encodeURIComponent(skillKey)}`,
  };
}

async function checkJDCompatibility(resumeText, jdText) {
  const prompt = `You are an expert ATS and career coach AI. Analyze how well the resume matches the job description.

Job Description:
${jdText.slice(0, 2000)}

Resume:
${resumeText.slice(0, 2000)}

Respond ONLY with valid JSON (no markdown):
{
  "compatibilityScore": <0-100>,
  "verdict": <"strong fit"|"moderate fit"|"weak fit">,
  "summary": "<2-3 sentence overall assessment>",
  "matchedKeywords": <array of keywords/skills present in both>,
  "missingKeywords": <array of important JD keywords missing from resume>,
  "matchedRequirements": <array of JD requirements the resume satisfies>,
  "missingRequirements": <array of JD requirements the resume lacks>,
  "suggestions": <array of 4-5 specific actionable improvements to better match this JD>,
  "certSkills": <array of 4-6 skill name strings the candidate should learn to close the gaps identified in missingKeywords and missingRequirements — pick skills directly relevant to this specific job description, using simple lowercase names>
}`;

  const completion = await groq.chat.completions.create({
    model: 'llama-3.1-8b-instant',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.3,
  });

  const raw = completion.choices[0].message.content.trim();
  const json = raw.replace(/^```(?:json)?\n?|```$/g, '').trim();
  const result = JSON.parse(json);

  // Attach real verified URLs from catalog
  result.recommendedCertifications = (result.certSkills || []).map(matchCertFromCatalog);

  delete result.certSkills;
  return result;
}

module.exports = { analyzeResume, isValidResume, isValidJD, checkJDCompatibility };
