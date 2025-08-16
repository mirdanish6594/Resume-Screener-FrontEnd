import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { 
  Upload, 
  FileText, 
  AlertCircle, 
  CheckCircle, 
  TrendingUp, 
  Star,
  Target,
  Lightbulb,
  Award,
  Users,
  Code,
  Brain
} from 'lucide-react';
// 🔽 1. IMPORTS UPDATED
import { 
  extractTextFromFile,  // ADDED: New utility for client-side text extraction
  predictFromText,      // KEPT: This is now used for both text and file uploads
  getResumeImprovements,
  validateFile         // ADDED: It's good practice to keep validation
} from '../api/screenerAPI'; // Adjust path if needed
import { AIAnalysisResponse } from '../types/types'; // Adjust path if needed

const ResumeForm: React.FC = () => {
  const [text, setText] = useState<string>('');
  const [result, setResult] = useState<string | null>(null);
  const [confidence, setConfidence] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [analyzingImprovements, setAnalyzingImprovements] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'text' | 'file'>('text');
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysisResponse | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string>('');

  // This function now contains the core logic for any analysis
  const handleAnalysis = async (resumeText: string) => {
    setLoading(true);
    setError(null);
    setAiAnalysis(null);
    setResult(null);
    setConfidence(null);
    
    try {
      // Step 1: Get the initial role prediction from the text
      const predictionResponse = await predictFromText(resumeText);
      setResult(predictionResponse.predicted_role);
      setConfidence(predictionResponse.confidence);
      
      // Step 2: Get the detailed AI analysis
      setAnalyzingImprovements(true);
      const improvements = await getResumeImprovements(resumeText, predictionResponse.predicted_role);
      setAiAnalysis(improvements);

    } catch (err) {
      console.error('Analysis process error:', err);
      setError(err instanceof Error ? err.message : 'Failed to analyze resume. Please try again.');
    } finally {
      setAnalyzingImprovements(false);
      setLoading(false);
    }
  };

  const handleTextSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!text.trim() || text.trim().length < 200) return;
    handleAnalysis(text);
  };

  // 🔽 2. ONDROP LOGIC COMPLETELY REWRITTEN
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];

    // Validate the file using the utility from screenerAPI
    const validation = validateFile(file);
    if (!validation.isValid) {
      setError(validation.error || "Invalid file selected.");
      setUploadedFileName('');
      return;
    }

    setUploadedFileName(file.name);
    setLoading(true);
    setError(null);
    setAiAnalysis(null);
    
    try {
      // The key change: extract text from the file first
      const extractedText = await extractTextFromFile(file);
      
      // Now, call the unified analysis handler with the extracted text
      await handleAnalysis(extractedText);

    } catch (err) {
      console.error('File processing error:', err);
      setError(err instanceof Error ? err.message : 'Failed to process file. It might be corrupted or in an unsupported format.');
      setUploadedFileName(''); // Clear filename on error
    } finally {
      setLoading(false); // The handleAnalysis function also sets this, but it's good practice here too.
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      // Note: Add doc/docx support back if you implement a parser for them in screenerAPI.ts
    },
    maxFiles: 1
  });

 const getPriorityColor = (priority: string) => {
    // Ensure priority is treated as case-insensitive
    switch (priority.toLowerCase()) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'impact & results': return <TrendingUp className="w-5 h-5" />;
      case 'technical skills': return <Code className="w-5 h-5" />;
      case 'experience': return <Award className="w-5 h-5" />;
      case 'professional presence': return <Users className="w-5 h-5" />;
      case 'credentials': return <Star className="w-5 h-5" />;
      case 'leadership': return <Target className="w-5 h-5" />;
      default: return <Lightbulb className="w-5 h-5" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-indigo-600 rounded-full">
              <Brain className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            AI Resume Analyzer
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Get instant role predictions and personalized improvement suggestions powered by AI
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100">
          {/* Tab Navigation */}
          <div className="flex border-b border-gray-200 bg-gray-50">
            <button
              onClick={() => setActiveTab('text')}
              className={`flex-1 py-6 px-4 text-base font-semibold transition-all duration-200 ${
                activeTab === 'text'
                  ? 'text-indigo-600 border-b-3 border-indigo-600 bg-white'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
            >
              <FileText className="w-5 h-5 inline-block mr-3" />
              Paste Resume Text
            </button>
            <button
              onClick={() => setActiveTab('file')}
              className={`flex-1 py-6 px-4 text-base font-semibold transition-all duration-200 ${
                activeTab === 'file'
                  ? 'text-indigo-600 border-b-3 border-indigo-600 bg-white'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Upload className="w-5 h-5 inline-block mr-3" />
              Upload Resume File
            </button>
          </div>

          {/* Content Area */}
          <div className="p-8 lg:p-12">
            {activeTab === 'text' ? (
              <form onSubmit={handleTextSubmit} className="space-y-8">
                <div>
                  <label htmlFor="resume" className="block text-lg font-semibold text-gray-800 mb-4">
                    Paste your resume content below
                  </label>
                  <textarea
                    id="resume"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    rows={16}
                    placeholder="Paste your complete resume text here... (minimum 200 characters for accurate analysis)"
                    className="w-full px-6 py-4 border-2 border-gray-200 rounded-xl focus:ring-3 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 resize-none text-base leading-relaxed"
                    required
                  />
                  <div className="mt-2 text-sm text-gray-500">
                    Characters: {text.length} / 200 minimum
                  </div>
                </div>

                <div className="flex justify-center">
                  <button
                    type="submit"
                    disabled={loading || text.trim().length < 200}
                    className={`px-12 py-4 rounded-full font-semibold text-lg text-white shadow-xl transition-all duration-300 transform ${
                      loading || text.trim().length < 200
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 hover:shadow-2xl hover:-translate-y-1'
                    }`}
                  >
                    {loading ? (
                      <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-3 h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Analyzing Resume...
                      </span>
                    ) : (
                      <>
                        <TrendingUp className="w-6 h-6 inline-block mr-2" />
                        Analyze My Resume
                      </>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-8">
                <div {...getRootProps()} className="cursor-pointer">
                  <div className={`border-3 border-dashed rounded-2xl p-12 text-center transition-all duration-300 ${
                    isDragActive 
                      ? 'border-indigo-500 bg-indigo-50 scale-105' 
                      : 'border-gray-300 hover:border-indigo-400 hover:bg-gray-50'
                  }`}>
                    <input {...getInputProps()} />
                    <Upload className="mx-auto h-16 w-16 text-gray-400 mb-6" />
                    <h3 className="text-2xl font-semibold text-gray-700 mb-4">
                      {isDragActive ? 'Drop your resume here!' : 'Upload Your Resume'}
                    </h3>
                    <p className="text-lg text-gray-600 mb-2">
                      Drag & drop your resume file here, or click to browse
                    </p>
                    <p className="text-sm text-gray-500">
                      Supported format: PDF (Max 10MB)
                    </p>
                    {uploadedFileName && (
                      <div className="mt-4 inline-flex items-center px-4 py-2 bg-green-100 text-green-800 rounded-full">
                        <CheckCircle className="w-4 h-4 mr-2" />
                        {uploadedFileName}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Results Section */}
          {(loading || result || error) && (
            <div className={`border-t-2 ${error ? 'bg-red-50 border-red-200' : 'bg-gradient-to-r from-green-50 to-blue-50 border-green-200'}`}>
              <div className="p-8 lg:p-12">
                {error ? (
                  <div className="bg-red-100 border border-red-300 rounded-lg p-4">
                    <div className="flex items-center mb-2">
                      <AlertCircle className="h-6 w-6 text-red-500 mr-3" />
                      <h3 className="text-xl font-semibold text-red-800">Analysis Error</h3>
                    </div>
                    <p className="text-red-800 font-medium ml-9">{error}</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Prediction Result */}
                    {result && (
                       <div className="flex items-center justify-between">
                       <div className="flex items-center">
                         <CheckCircle className="h-8 w-8 text-green-500 mr-4" />
                         <div>
                           <h3 className="text-2xl font-bold text-gray-800">Predicted Role</h3>
                           <p className="text-gray-600">Based on your resume analysis</p>
                         </div>
                       </div>
                       {confidence && (
                         <div className="text-right">
                           <div className="text-3xl font-bold text-indigo-600">
                             {Math.round(confidence * 100)}%
                           </div>
                           <div className="text-sm text-gray-500">Confidence</div>
                         </div>
                       )}
                     </div>
                    )}
                   {result && (
                      <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
                      <div className="text-3xl font-bold text-indigo-600 mb-2">{result}</div>
                      <p className="text-gray-600">
                        This role matches your skills and experience profile
                      </p>
                    </div>
                   )}
                  
                    {/* AI Analysis Loading or Results */}
                    {analyzingImprovements || aiAnalysis ? (
                       <div className="space-y-6">
                       {analyzingImprovements ? (
                         <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
                           <div className="flex items-center justify-center">
                             <svg className="animate-spin h-6 w-6 text-indigo-600 mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                               <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                               <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                             </svg>
                             <span className="text-lg font-medium text-gray-700">
                               Generating personalized improvement suggestions...
                             </span>
                           </div>
                         </div>
                       ) : aiAnalysis && (
                         <>
                           {/* Overall Score */}
                           <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
                             <div className="flex items-center justify-between mb-4">
                               <h4 className="text-xl font-bold text-gray-800">Resume Score</h4>
                               <div className="text-3xl font-bold text-indigo-600">
                                 {aiAnalysis.score}/100
                               </div>
                             </div>
                             <div className="w-full bg-gray-200 rounded-full h-3">
                               <div 
                                 className="bg-gradient-to-r from-indigo-500 to-purple-500 h-3 rounded-full transition-all duration-1000"
                                 style={{ width: `${aiAnalysis.score}%` }}
                               ></div>
                             </div>
                           </div>

                           {/* Key Strengths */}
                           <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
                             <h4 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                               <Star className="w-6 h-6 text-yellow-500 mr-2" />
                               Key Strengths
                             </h4>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                               {aiAnalysis.strengths.map((strength, index) => (
                                 <div key={index} className="flex items-center p-3 bg-green-50 rounded-lg border border-green-200">
                                   <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                                   <span className="text-green-800">{strength}</span>
                                 </div>
                               ))}
                             </div>
                           </div>

                           {/* Improvement Suggestions */}
                           <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
                             <h4 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
                               <Lightbulb className="w-6 h-6 text-yellow-500 mr-2" />
                               Improvement Suggestions
                             </h4>
                             <div className="space-y-6">
                               {aiAnalysis.improvements.map((improvement, index) => (
                                 <div key={index} className="border border-gray-200 rounded-lg p-5">
                                   <div className="flex items-center justify-between mb-4">
                                     <div className="flex items-center">
                                       {getCategoryIcon(improvement.category)}
                                       <h5 className="text-lg font-semibold text-gray-800 ml-2">
                                         {improvement.category}
                                       </h5>
                                     </div>
                                     <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getPriorityColor(improvement.priority)}`}>
                                       {improvement.priority.toUpperCase()} PRIORITY
                                     </span>
                                   </div>
                                   <div className="flex items-start">
                                     <div className="w-2 h-2 bg-indigo-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                                     <span className="text-gray-700">{improvement.suggestion}</span>
                                   </div>
                                 </div>
                               ))}
                             </div>
                           </div>

                            {/* Missing Elements */}
                            {aiAnalysis.missing_elements && aiAnalysis.missing_elements.length > 0 && (
                                <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
                                <h4 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                                    <Target className="w-6 h-6 text-orange-500 mr-2" />
                                    Areas to Develop
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {aiAnalysis.missing_elements.map((element, index) => (
                                    <div key={index} className="flex items-center p-3 bg-orange-50 rounded-lg border border-orange-200">
                                        <AlertCircle className="w-5 h-5 text-orange-500 mr-3 flex-shrink-0" />
                                        <span className="text-orange-800">{element}</span>
                                    </div>
                                    ))}
                                </div>
                                </div>
                            )}

                           {/* Role-Specific Advice */}
                           {aiAnalysis.role_specific_advice && aiAnalysis.role_specific_advice.length > 0 && (
                             <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
                               <h4 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                                 <Brain className="w-6 h-6 text-purple-500 mr-2" />
                                 Role-Specific Advice for {result}
                               </h4>
                               <div className="space-y-3">
                                 {aiAnalysis.role_specific_advice.map((advice, index) => (
                                   <div key={index} className="flex items-start p-4 bg-purple-50 rounded-lg border border-purple-200">
                                     <Lightbulb className="w-5 h-5 text-purple-500 mr-3 flex-shrink-0 mt-0.5" />
                                     <span className="text-purple-800">{advice}</span>
                                   </div>
                                 ))}
                               </div>
                             </div>
                           )}
                         </>
                       )}
                     </div>
                    ) : null}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-gray-500">
          <p className="text-lg mb-2">
            🔒 Your privacy is protected - resumes are analyzed in real-time and never stored
          </p>
          <p className="text-sm">
            Powered by advanced AI algorithms for accurate role prediction and personalized suggestions
          </p>
        </div>
      </div>
    </div>
  );
};

export default ResumeForm;