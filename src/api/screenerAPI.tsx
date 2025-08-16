// ✅ THE FINAL AND CORRECT METHOD FOR VITE: Import the worker module directly.
import * as pdfjsLib from 'pdfjs-dist';

// This special '.mjs' file is the module version of the worker.
// Importing it here allows Vite to handle the setup automatically.
import 'pdfjs-dist/build/pdf.worker.min.mjs';


// =================================================================
// SECTION 1: TYPES & API CONFIGURATION
// =================================================================

// Types
export interface PredictionResponse {
  predicted_role: string;
  confidence: number;
  processed_text_length: number;
}

export interface AIAnalysisResponse {
  score: number;
  strengths: string[];
  improvements: {
    priority: 'High' | 'Medium' | 'Low';
    suggestion: string;
    category: string;
  }[];
  missing_elements: string[];
  role_specific_advice: string[];
  contextual_insights: string[];
}

// API Configuration
const API_BASE_URL = 'https://resume-screener-v3kw.onrender.com';
const HF_API_KEY = import.meta.env.REACT_APP_HF_API_KEY;


// =================================================================
// SECTION 2: UNIFIED LOGIC & API CALLS
// =================================================================

/**
 * Client-side Text Extraction Utility
 * This function reads a file in the browser and returns its text content.
 * @param file - The File object from an input element.
 * @returns A promise that resolves to the extracted text as a string.
 */
export const extractTextFromFile = async (file: File): Promise<string> => {
  const fileExt = file.name.toLowerCase();

  if (fileExt.endsWith('.pdf')) {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
      let fullText = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map(item => (item as any).str).join(' ');
        fullText += pageText + '\n';
      }
      return fullText;
    } catch (error) {
        console.error("Failed to parse PDF:", error);
        throw new Error("Could not read the PDF file. It might be corrupted or protected.");
    }
  } else {
    throw new Error('Unsupported file type. Please upload a PDF file.');
  }
};

/**
 * Predict from text input.
 * This is the single function used for getting the initial role prediction.
 * @param text - The resume text.
 * @returns A promise that resolves to the prediction response.
 */
export const predictFromText = async (text: string): Promise<PredictionResponse> => {
  try {
    const cleanedText = text.replace(/\s+/g, ' ').trim();

    if (cleanedText.length < 50) {
      throw new Error('Please provide at least 50 characters of resume text.');
    }

    const response = await fetch(`${API_BASE_URL}/predict-text`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: cleanedText }),
    });

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: Text prediction failed`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.detail || errorMessage;
      } catch { /* ignore parsing error */ }
      throw new Error(errorMessage);
    }

    return await response.json();
  } catch (error: any) {
    console.error('API Error (Text Submission):', error);
    throw new Error(`Text prediction failed: ${error.message}`);
  }
};

/**
 * Main AI-powered resume analysis function.
 * @param resumeText - The full text of the resume.
 * @param predictedRole - The role predicted by the initial model.
 * @returns A promise resolving to the full AI analysis response.
 */
export const getResumeImprovements = async (
  resumeText: string,
  predictedRole: string
): Promise<AIAnalysisResponse> => {
  try {
    console.log('Starting contextual NLP analysis for role:', predictedRole);
    return await analyzeResumeContextually(resumeText, predictedRole);
  } catch (error) {
    console.error('Contextual analysis failed, using fallback:', error);
    
    return {
      score: 60,
      strengths: ['Resume submitted for analysis'],
      improvements: [{
        priority: 'Medium',
        suggestion: 'AI analysis is temporarily unavailable. Please try again later.',
        category: 'System'
      }],
      missing_elements: [],
      role_specific_advice: [],
      contextual_insights: ['Analysis will be available shortly']
    };
  }
};


// =================================================================
// SECTION 3: CORE ANALYSIS & HUGGING FACE LOGIC
// =================================================================

/**
 * Orchestrates the advanced contextual analysis.
 */
const analyzeResumeContextually = async (resumeText: string, predictedRole: string): Promise<AIAnalysisResponse> => {
  const nlpResults = await performNLPAnalysis(resumeText, predictedRole);
  const text = resumeText.toLowerCase();
  
  const roleSpecificSkills = getRoleSpecificSkills(predictedRole);
  const detectedSkills = [...new Set([...nlpResults.skills, ...findSkillsInText(text, roleSpecificSkills)])];
  
  const score = calculateContextualScore(text, predictedRole, detectedSkills, nlpResults.experience_level);
  const strengths = generateContextualStrengths(text, detectedSkills, nlpResults, predictedRole);
  const improvements = await generateTargetedImprovements(resumeText, predictedRole, detectedSkills, nlpResults);
  const missing_elements = identifyMissingElements(text, predictedRole, detectedSkills);
  const role_specific_advice = generateRoleSpecificAdvice(text, predictedRole, detectedSkills, nlpResults.experience_level);
  const contextual_insights = generateContextualInsights(nlpResults, predictedRole, detectedSkills, resumeText);

  return {
    score,
    strengths,
    improvements,
    missing_elements,
    role_specific_advice,
    contextual_insights
  };
};

/**
 * Performs various NLP tasks by querying Hugging Face models.
 */
const performNLPAnalysis = async (resumeText: string, predictedRole: string): Promise<any> => {
  const analysisResults = {
    skills: [],
    experience_level: '',
    strengths: [],
    suggestions: []
  };

  try {
    // 1. Skill Extraction
    const skillExtractionPrompt = `Extract technical skills, programming languages, frameworks, and tools from this resume text. List them as comma-separated values:\n\n${resumeText.substring(0, 800)}`;
    const skillsResponse = await callHuggingFaceAPI('microsoft/DialoGPT-large', skillExtractionPrompt);
    if (skillsResponse) {
      const skillsText = skillsResponse.toLowerCase();
      const commonSkills = ['python', 'java', 'javascript', 'react', 'node', 'sql', 'aws', 'docker', 'kubernetes', 'git', 'machine learning', 'data analysis', 'pandas', 'numpy', 'scikit-learn', 'tensorflow', 'pytorch', 'api', 'flask', 'streamlit', 'power bi', 'tableau'];
      analysisResults.skills = commonSkills.filter(skill =>
        new RegExp(`\\b${skill.replace('.', '\\.')}\\b`, 'i').test(skillsText) || new RegExp(`\\b${skill.replace('.', '\\.')}\\b`, 'i').test(resumeText.toLowerCase())
      );
    }

    // 2. Experience Level Classification
    const experiencePrompt = `Based on this resume, classify the candidate's experience level as: Entry-level, Mid-level, or Senior-level. Respond with just one phrase:\n\n${resumeText.substring(0, 600)}`;
    const experienceResponse = await callHuggingFaceAPI('facebook/blenderbot-400M-distill', experiencePrompt);
    if (experienceResponse) {
      const expText = experienceResponse.toLowerCase();
      if (expText.includes('senior') || expText.includes('lead') || expText.includes('manager')) {
        analysisResults.experience_level = 'Senior-level';
      } else if (expText.includes('mid') || expText.includes('intermediate')) {
        analysisResults.experience_level = 'Mid-level';
      } else {
        analysisResults.experience_level = 'Entry-level';
      }
    }

    // 3. Contextual Strengths Analysis
    const strengthsPrompt = `Analyze this resume and identify the top 3 specific strengths for a ${predictedRole} position. Focus on concrete achievements, relevant experience, and demonstrated skills:\n\n${resumeText.substring(0, 700)}`;
    const strengthsResponse = await callHuggingFaceAPI('microsoft/DialoGPT-medium', strengthsPrompt);
    if (strengthsResponse) {
        const strengthPatterns = [
         /strong.*?(?:in|with|at)\s+([^.]+)/gi,
         /excellent.*?(?:in|with|at)\s+([^.]+)/gi,
         /experienced.*?(?:in|with|at)\s+([^.]+)/gi,
         /skilled.*?(?:in|with|at)\s+([^.]+)/gi
       ];
       strengthPatterns.forEach(pattern => {
         const matches = strengthsResponse.match(pattern);
         if (matches) {
           analysisResults.strengths.push(...matches.slice(0, 2));
         }
       });
    }

    // 4. Gap Analysis for Role Fit
    const gapAnalysisPrompt = `Compare this resume against requirements for a ${predictedRole} role. Identify what's missing or needs improvement. Be specific:\n\n${resumeText.substring(0, 600)}`;
    const gapResponse = await callHuggingFaceAPI('microsoft/DialoGPT-large', gapAnalysisPrompt);
    if (gapResponse) {
       const improvementKeywords = ['need', 'lack', 'missing', 'should add', 'recommend', 'suggest', 'improve'];
       improvementKeywords.forEach(keyword => {
         const regex = new RegExp(`${keyword}[^.]*`, 'gi');
         const matches = gapResponse.match(regex);
         if (matches) {
           analysisResults.suggestions.push(...matches.slice(0, 1));
         }
       });
    }

    return analysisResults;
  } catch (error) {
    console.error('NLP Analysis failed:', error);
    return analysisResults;
  }
};

/**
 * A wrapper for calling the Hugging Face Inference API with retry logic.
 */
const callHuggingFaceAPI = async (model: string, prompt: string): Promise<string | null> => {
  const maxRetries = 2;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${HF_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: { max_new_tokens: 150, temperature: 0.7, do_sample: true, return_full_text: false },
          options: { wait_for_model: true }
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data && Array.isArray(data) && data[0]?.generated_text) {
          return data[0].generated_text.trim();
        } else if (data && typeof data === 'string') {
          return data.trim();
        }
        return null;
      } else if (response.status === 503) {
        console.warn(`Model ${model} is loading, retrying... (Attempt ${attempt + 1})`);
        await new Promise(resolve => setTimeout(resolve, 3000 * (attempt + 1)));
        continue;
      } else {
        console.error(`HF API error for ${model}: ${response.status} ${response.statusText}`);
        return null;
      }
    } catch (error) {
      console.error(`HF API call failed for ${model}, attempt ${attempt + 1}:`, error);
      if (attempt === maxRetries - 1) return null;
      await new Promise(resolve => setTimeout(resolve, 1500));
    }
  }
  
  return null;
};


// =================================================================
// SECTION 4: CONTEXTUAL HELPER FUNCTIONS
// =================================================================

const getRoleSpecificSkills = (role: string): string[] => {
  const roleSkillMap: { [key: string]: string[] } = {
    'data': ['python', 'r', 'sql', 'pandas', 'numpy', 'scikit-learn', 'tensorflow', 'pytorch', 'tableau', 'power bi', 'spark', 'hadoop', 'statistics', 'machine learning'],
    'software': ['javascript', 'python', 'java', 'react', 'node.js', 'git', 'api', 'database', 'testing', 'agile', 'docker', 'kubernetes'],
    'devops': ['docker', 'kubernetes', 'aws', 'azure', 'jenkins', 'ci/cd', 'terraform', 'ansible', 'linux', 'monitoring', 'automation'],
    'frontend': ['javascript', 'react', 'vue', 'angular', 'html', 'css', 'typescript', 'webpack', 'sass', 'responsive design'],
    'backend': ['node.js', 'python', 'java', 'api', 'database', 'mongodb', 'postgresql', 'redis', 'microservices'],
    'mobile': ['react native', 'flutter', 'swift', 'kotlin', 'ios', 'android', 'mobile development']
  };
  const roleLower = role.toLowerCase();
  for (const [key, skills] of Object.entries(roleSkillMap)) {
    if (roleLower.includes(key)) return skills;
  }
  return roleSkillMap['software'];
};

const findSkillsInText = (text: string, roleSkills: string[]): string[] => {
  return roleSkills.filter(skill => {
    const skillRegex = new RegExp(`\\b${skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    return skillRegex.test(text);
  });
};

const calculateContextualScore = (text: string, role: string, skills: string[], experienceLevel: string): number => {
  let score = 50;
  const roleSkills = getRoleSpecificSkills(role);
  const skillMatch = skills.filter(skill => roleSkills.includes(skill)).length;
  score += Math.min(skillMatch * 8, 30);
  if (experienceLevel === 'Senior-level') score += 15;
  else if (experienceLevel === 'Mid-level') score += 10;
  else score += 5;
  if (text.match(/\d+%|\d+x|increased|improved|reduced|optimized/g)) score += 10;
  if (text.match(/lead|manage|mentor|supervise/g)) score += 8;
  if (text.match(/bachelor|master|phd|certified/g)) score += 5;
  return Math.min(Math.round(score), 100);
};

const generateContextualStrengths = (text: string, skills: string[], nlpResults: any, role: string): string[] => {
  const strengths: string[] = [];
  if (nlpResults.strengths && nlpResults.strengths.length > 0) {
    strengths.push(...nlpResults.strengths.slice(0, 2));
  }
  if (skills.length > 0) {
    strengths.push(`Demonstrated expertise in key areas like ${skills.slice(0, 3).join(', ')}.`);
  }
  if (nlpResults.experience_level) {
    strengths.push(`Profile aligns with an ${nlpResults.experience_level} professional.`);
  }
  const achievements = text.match(/\d+%|\d+x|\$\d+|increased.*?\d+|improved.*?\d+/gi);
  if (achievements && achievements.length > 0) {
    strengths.push('Strong track record of delivering measurable achievements and results.');
  }
  return [...new Set(strengths)].filter(s => s && s.length > 15).slice(0, 4);
};

const detectContentElements = (resumeText: string) => {
  const text = resumeText.toLowerCase();
  return {
    hasGitHub: /github\.com\/[\w-]+|github\.io|git\.[\w-]+|github\s*[:\/]/i.test(resumeText),
    hasPortfolio: /portfolio|personal\s*website|my\s*website|website\s*:/i.test(resumeText),
    hasLinkedIn: /linkedin\.com\/in\/|linkedin\s*profile/i.test(resumeText),
    hasLiveProjects: /live\s*project|deployed|production|hosted|demo|url|link|website/gi.test(resumeText),
    hasQuantifiableResults: /\d+%|\d+\+|\$[\d,]+|increased\s+by\s+\d+|improved\s+by\s+\d+|reduced\s+by\s+\d+|optimized\s+by\s+\d+|\d+x\s+/gi.test(resumeText),
    hasProjectExperience: /project[s]?\s*:|built\s+|developed\s+|created\s+|implemented\s+|designed\s+|launched/gi.test(resumeText),
    hasLeadership: /lead\s+|led\s+|manage[d]?\s+|mentor[ed]?\s+|supervise[d]?\s+|team\s*lead|project\s*manager/gi.test(resumeText),
    hasCertifications: /certified|certification|certificate|aws\s+certified|gcp\s+certified/gi.test(resumeText),
    hasEducation: /bachelor|master|phd|degree|university|college|graduated|education|b\.s\.|m\.s\./gi.test(resumeText),
    hasWorkExperience: /experience|worked\s+at|employed\s+at|internship|intern\s+at|software\s+engineer|data\s+scientist/gi.test(resumeText),
    hasAPIExperience: /\bapi\b|rest\s*api|restful|graphql|microservice|web\s*service/gi.test(resumeText),
    hasVersionControl: /git\b|github|gitlab|bitbucket|version\s*control|source\s*control/gi.test(resumeText),
    hasTesting: /test|testing|unit\s*test|integration\s*test|tdd|jest|pytest|junit/gi.test(resumeText),
    hasCloudExperience: /aws|azure|gcp|google\s*cloud|docker|kubernetes|container|ec2|s3|lambda/gi.test(resumeText),
    hasDatabaseExperience: /database|sql|mysql|postgresql|mongodb|nosql|redis/gi.test(resumeText),
    hasMLExperience: /machine\s*learning|ml\b|artificial\s*intelligence|ai\b|deep\s*learning|neural\s*network|nlp|tensorflow|pytorch|scikit-learn/gi.test(resumeText),
    hasDataViz: /visualization|tableau|power\s*bi|d3\.js|plotly|matplotlib|seaborn|dashboard/gi.test(resumeText),
    hasStatistics: /statistics|statistical|regression|hypothesis|a\/b\s*test|analytics/gi.test(resumeText),
  };
};

const generateTargetedImprovements = async (resumeText: string, role: string, skills: string[], nlpResults: any): Promise<any[]> => {
  const improvements: any[] = [];
  const contentElements = detectContentElements(resumeText);
  if (!contentElements.hasQuantifiableResults) {
    improvements.push({
      priority: 'High',
      suggestion: 'Strengthen your impact by adding metrics to your achievements (e.g., "reduced latency by 30%", "increased user engagement by 15%").',
      category: 'Impact & Results'
    });
  }
  if (!contentElements.hasGitHub && (role.toLowerCase().includes('software') || role.toLowerCase().includes('data'))) {
    improvements.push({
      priority: 'High',
      suggestion: 'A strong GitHub profile is essential. Add a link and feature 2-3 well-documented projects.',
      category: 'Professional Presence'
    });
  }
  if (!contentElements.hasProjectExperience && nlpResults.experience_level === 'Entry-level') {
    improvements.push({
        priority: 'High',
        suggestion: 'Build and showcase personal projects to demonstrate practical skills beyond coursework.',
        category: 'Experience'
    });
  }
  if (role.toLowerCase().includes('data') && !contentElements.hasDataViz) {
    improvements.push({
        priority: 'Medium',
        suggestion: 'Showcase your data storytelling skills by adding projects with visualizations or dashboards (e.g., using Tableau, Power BI, or Plotly).',
        category: 'Technical Skills'
    });
  }
  if (role.toLowerCase().includes('software') && !contentElements.hasTesting) {
    improvements.push({
        priority: 'Medium',
        suggestion: 'Mention specific testing practices or frameworks used in your projects (e.g., unit tests with Jest, integration testing).',
        category: 'Technical Skills'
    });
  }
  // Remove duplicates and limit
  const uniqueSuggestions = Array.from(new Set(improvements.map(i => i.suggestion)))
                                .map(suggestion => improvements.find(i => i.suggestion === suggestion));
  return uniqueSuggestions.slice(0, 5);
};

const identifyMissingElements = (text: string, role: string, skills: string[]): string[] => {
  const missing: string[] = [];
  const contentElements = detectContentElements(text);
  if (!contentElements.hasQuantifiableResults) missing.push('Quantifiable achievements with metrics');
  if (!contentElements.hasProjectExperience) missing.push('Dedicated projects section');
  if (role.toLowerCase().includes('software') && !contentElements.hasVersionControl) missing.push('Version control (Git/GitHub)');
  if (role.toLowerCase().includes('data') && !contentElements.hasMLExperience) missing.push('Machine learning project experience');
  return [...new Set(missing)].slice(0, 4);
};

const generateRoleSpecificAdvice = (text: string, role: string, skills: string[], experienceLevel: string): string[] => {
  const advice: string[] = [];
  const contentElements = detectContentElements(text);
  const roleLower = role.toLowerCase();
  if (roleLower.includes('data') && !contentElements.hasMLExperience) advice.push('Focus on building an end-to-end machine learning project, from data cleaning to model deployment.');
  if (roleLower.includes('software') && !contentElements.hasAPIExperience) advice.push('Gain experience with API development (REST or GraphQL) as it is a core skill for most developer roles.');
  if (experienceLevel === 'Entry-level') advice.push('Contribute to an open-source project to gain collaborative development experience and enhance your GitHub profile.');
  return [...new Set(advice)].slice(0, 3);
};

const generateContextualInsights = (nlpResults: any, role: string, skills: string[], resumeText: string): string[] => {
  const insights: string[] = [];
  if (nlpResults.experience_level) {
    insights.push(`Your resume appears to be at an ${nlpResults.experience_level} experience level.`);
  }
  const roleSkills = getRoleSpecificSkills(role);
  if (roleSkills.length > 0) {
    const matchCount = skills.filter(s => roleSkills.includes(s)).length;
    const matchPercentage = Math.round((matchCount / roleSkills.length) * 100);
    insights.push(`Your skills show a ~${matchPercentage}% alignment with the key technologies for a ${role} role.`);
  }
  if (detectContentElements(resumeText).hasQuantifiableResults) {
    insights.push("Your use of metrics to describe achievements is a strong positive signal to recruiters.");
  }
  return [...new Set(insights)].slice(0, 3);
};


// =================================================================
// SECTION 5: VALIDATION & HEALTH CHECK UTILITIES
// =================================================================

export const checkApiHealth = async (): Promise<{ status: string; model_loaded: boolean; vectorizer_loaded: boolean; service: string }> => {
  try {
    const response = await fetch(`${API_BASE_URL}/`);
    if (!response.ok) throw new Error(`API health check failed: ${response.status}`);
    return await response.json();
  } catch (error: any) {
    console.error('API Health Check Error:', error);
    throw new Error(`Health check failed: ${error.message}`);
  }
};

export const validateFile = (file: File): { isValid: boolean; error?: string } => {
  const allowedTypes = ['.pdf']; // Currently only supporting PDF due to client-side parser
  const maxSize = 10 * 1024 * 1024; // 10MB
  
  const fileExt = file.name.toLowerCase();
  const hasValidExtension = allowedTypes.some(ext => fileExt.endsWith(ext));
  
  if (!hasValidExtension) return { isValid: false, error: `Invalid file type. Please upload one of: ${allowedTypes.join(', ')}` };
  if (file.size > maxSize) return { isValid: false, error: 'File size exceeds 10MB limit' };
  if (file.size === 0) return { isValid: false, error: 'Empty file detected' };
  
  return { isValid: true };
};

export const validateText = (text: string): { isValid: boolean; error?: string } => {
  const cleanedText = text.replace(/\s+/g, ' ').trim();
  
  if (!cleanedText) return { isValid: false, error: 'Please provide resume text' };
  if (cleanedText.length < 50) return { isValid: false, error: `Please provide at least 50 characters (current: ${cleanedText.length})` };
  
  return { isValid: true };
};