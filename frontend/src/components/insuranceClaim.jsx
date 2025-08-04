import { useState, useEffect } from 'react';
import { ArrowLeft, Shield, Upload, FileText, Camera, CheckCircle } from "lucide-react";
import AiPredictionResults from './AiPredictionResults';
import { auth } from '../utils/firebaseConfig';
import { summarizeTxtFile } from './insuranceSummary';
import ReactMarkdown from 'react-markdown';
// Assuming this is a custom hook and not a ShadCN component


const InsuranceClaim = ({ user, onBack }) => {
  const [formData, setFormData] = useState({
    provider: '',
    uin: '',
    policyNumber: '',
    policyDocument: null,
    damageImage: null,
    fieldImage : null
  });

  const [showAiResults, setShowAiResults] = useState(false);
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [geminiResponse, setGeminiResponse] = useState('');
  const [apiResponse, setApiResponse] = useState({
    // From /api/exif_metadata
    address: "Ranaghat, Ranaghat - II, Nadia, West Bengal, 741200, India",
    authenticity_score: 60,
    device_model: "Galaxy S23 FE",
    gps_latitude: 23.194992,
    gps_longitude: 88.609428,
    suspicious_reasons: [
      "Image was edited using software: S711BXXS6DXK8",
      "High ELA deviation — possible image tampering."
    ],
    timestamp: "2025:02:03 11:50:04",
    verifier_exif: "exif_metadata_reader",
    // From /api/damage_detection
    class_names: ["damaged", "non_damaged"],
    damage_confidence: 99.03,
    damage_prediction: "damaged",
    damage_model: "efficientnetv2_rw_m",
    status_damage_detection: "success",
    verifier_damage: "crop_damage_classifier",
    // From /api/crop_type
    crop_confidence_percent: 97.01,
    predicted_crop_class: "sugarcane",
    status_crop_type: "success"
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const speakText = (text, lang = 'hi-IN') => {
    if (!text || typeof window === 'undefined' || !window.speechSynthesis) {
      console.warn('Speech Synthesis not supported or text is empty.');
      return;
    }

    text = text
  .replace(/\*\*(.*?)\*\*/g, '$1') // bold

    const speakNow = () => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;

      window.speechSynthesis.getVoices().forEach(voice => {
        console.log(`${voice.name} [${voice.lang}]`);
      });
      const voices = window.speechSynthesis.getVoices();
      const selectedVoice = voices.find(voice => voice.lang === lang);
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }
  
      window.speechSynthesis.cancel(); // Stop current speech
      window.speechSynthesis.speak(utterance);
    };
  
    if (window.speechSynthesis.getVoices().length === 0) {
      // Wait for voices to load before speaking
      window.speechSynthesis.onvoiceschanged = () => {
        speakNow();
      };
    } else {
      speakNow();
    }
  };
  

  useEffect(() => {
    speakText(geminiResponse);
  }, [geminiResponse]);

  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    console.log("Form data updated:", formData);
    
    try {
      // Create FormData object for multipart/form-data
      const formDataToSend = new FormData();
      // Add text fields
      formDataToSend.append('uid', auth.currentUser.uid);
      formDataToSend.append('provider', formData.provider);
      formDataToSend.append('uin', formData.uin);
      formDataToSend.append('policyNumber', formData.policyNumber);
      
      // Add file fields if they exist
      if (formData.policyDocument) {
        formDataToSend.append('policyDoc', formData.policyDocument);
      }
      if (formData.damageImage) {
        formDataToSend.append('damageImage', formData.damageImage);
      }
      if (formData.cropImage) {
        formDataToSend.append('cropImage', formData.cropImage);
      }
      if (formData.fieldImage) {
        formDataToSend.append('fieldImage', formData.fieldImage);
      }
      
      // Log FormData contents before sending
      console.log("Multipart form data fields:");
      for (let [key, value] of formDataToSend.entries()) {
        if (value instanceof File) {
          console.log(`  ${key}: File(${value.name}, ${value.type}, ${value.size} bytes)`);
        } else {
          console.log(`  ${key}: ${value}`);
        }
      }
      
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/insurance/create`, {
        method: 'POST',
        body: formDataToSend // FormData automatically sets the correct Content-Type header
      });
      
      if (!response.ok) {
        throw new Error('Failed to submit claim');
      }
      
      const data = await response.json();
      console.log('Claim submitted successfully:', data);
      
      // Optionally reset form
      setFormData({
        provider: '',
        uin: '',
        policyNumber: '',
        policyDocument: null,
        damageImage: null,
        cropImage: null
      });
      
    } catch (e) {
      console.error('Error submitting claim:', e);
      alert('Failed to submit claim. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFileChange = (field, file) => {
    if (file) {
      // Create a new File object with the original file data
      const newFile = new File([file], file.name, {
        type: file.type,
        lastModified: file.lastModified
      });
      
      setFormData(prev => ({
        ...prev,
        [field]: newFile
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };

  const handleAiPrediction = async () => {
    setIsLoadingAi(true);
    setGeminiResponse('');
    
    try {
      // Check if a policy document is uploaded
      if (!formData.policyDocument) {
        alert('Please upload a policy document first.');
        setIsLoadingAi(false);
        return;
      }

      // Check if it's a text file
      if (!formData.policyDocument.type.includes('text') && !formData.policyDocument.name.endsWith('.txt')) {
        alert('Please upload a text file (.txt) for policy summarization.');
        setIsLoadingAi(false);
        return;
      }

      console.log("Processing text file: ", formData.policyDocument);
      
      // Call the summarizeTxtFile function
      const response = await summarizeTxtFile(formData.policyDocument);
      setGeminiResponse(response);
      
    } catch (error) {
      console.error('Error processing text file:', error);
      setGeminiResponse('Failed to process the policy document. Please try again.');
    } finally {
      setIsLoadingAi(false);
    }
  };

  return (
    <div className="min-h-screen bg-agricultural-soft-sand">
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="flex items-center mb-4 sm:mb-6">
          {/* Replaces Button component */}
          <button
            onClick={onBack}
            className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-10 px-3 sm:px-4 py-2 text-agricultural-soil-brown hover:bg-agricultural-stone-gray/10"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Back to Dashboard</span>
            <span className="sm:hidden">Back</span>
          </button>
        </div>

        <div className="max-w-7xl mx-auto">
          <div className="mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-agricultural-soil-brown mb-2">
              Insurance Claim
            </h1>
            <p className="text-agricultural-stone-gray text-sm sm:text-base">
              File a crop insurance claim for damages or losses
            </p>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8">
            {/* Insurance Claim Form */}
            <div className="xl:col-span-1 order-1 xl:order-1">
              {/* Replaces Card component */}
              <div className="rounded-lg border bg-white text-card-foreground shadow-sm warm-shadow border-agricultural-stone-gray/20">
                {/* Replaces CardHeader */}
                <div className="flex flex-col space-y-1.5 p-4 sm:p-6">
                  {/* Replaces CardTitle */}
                  <h3 className="flex items-center text-xl sm:text-2xl font-semibold leading-none tracking-tight text-agricultural-soil-brown">
                    <Shield className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                    Claim Details
                  </h3>
                </div>
                {/* Replaces CardContent */}
                <div className="p-4 sm:p-6 pt-0">
                  <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                    <div>
                      {/* Replaces Label component */}
                      <label htmlFor="provider" className="text-agricultural-soil-brown text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 block">
                        Insurance Provider
                      </label>
                      {/* Replaces Select, SelectTrigger, SelectValue, SelectContent, SelectItem */}
                      <select
                        id="provider"
                        value={formData.provider}
                        onChange={(e) => handleChange('provider', e.target.value)}
                        className="flex h-10 w-full rounded-md border border-agricultural-stone-gray/30 bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-agricultural-forest-green focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 mt-2 appearance-none pr-8 leading-tight"
                      >
                        <option value="" disabled hidden>Select insurance provider</option>
                        <option value="aic">Agriculture Insurance Company of India (AIC)</option>
                        <option value="iffco-tokio">IFFCO Tokio General Insurance</option>
                        <option value="bajaj-allianz">Bajaj Allianz General Insurance</option>
                        <option value="hdfc-ergo">HDFC ERGO General Insurance</option>
                        <option value="tata-aig">Tata AIG General Insurance</option>
                      </select>
                    </div>

                    <div>
                      {/* Replaces Label component */}
                      <label htmlFor="uin" className="text-agricultural-soil-brown text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 block">
                        UIN (Unique Identification Number)
                      </label>
                      {/* Replaces Input component */}
                      <input
                        id="uin"
                        type="text"
                        placeholder="Enter UIN"
                        value={formData.uin}
                        onChange={(e) => handleChange('uin', e.target.value)}
                        className="flex h-10 w-full rounded-md border border-agricultural-stone-gray/30 bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-agricultural-forest-green focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 mt-2"
                      />
                    </div>

                    <div>
                      {/* Replaces Label component */}
                      <label htmlFor="policyNumber" className="text-agricultural-soil-brown text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 block">
                        Policy Number
                      </label>
                      {/* Replaces Input component */}
                      <input
                        id="policyNumber"
                        type="text"
                        placeholder="Enter policy number"
                        value={formData.policyNumber}
                        onChange={(e) => handleChange('policyNumber', e.target.value)}
                        className="flex h-10 w-full rounded-md border border-agricultural-stone-gray/30 bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-agricultural-forest-green focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 mt-2"
                      />
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-lg font-medium text-agricultural-soil-brown">Required Documents</h3>

                      <div>
                        {/* Replaces Label component */}
                        <label htmlFor="policyDocument" className="text-agricultural-soil-brown text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 block">
                          Policy Document (Text file for AI analysis)
                        </label>
                        <div className="mt-2 border-2 border-dashed border-agricultural-stone-gray/30 rounded-lg p-3 sm:p-4">
                          <input
                            id="policyDocument"
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png,.txt"
                            onChange={(e) => handleFileChange('policyDocument', e.target.files?.[0] || null)}
                            className="hidden" // Hides the default file input
                          />
                          {/* Custom styled label to act as the file input button */}
                          <label htmlFor="policyDocument" className="cursor-pointer flex items-center justify-center space-x-2 text-agricultural-stone-gray hover:text-agricultural-soil-brown text-center">
                            <FileText className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                            <span className="text-xs sm:text-sm">{formData.policyDocument ? formData.policyDocument.name : 'Upload Policy Document (.txt for AI analysis)'}</span>
                          </label>
                        </div>
                      </div>

                      <div>
                        {/* Replaces Label component */}
                        <label htmlFor="damageImage" className="text-agricultural-soil-brown text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 block">
                          Damage Image
                        </label>
                        <div className="mt-2 border-2 border-dashed border-agricultural-stone-gray/30 rounded-lg p-3 sm:p-4">
                          <input
                            id="damageImage"
                            type="file"
                            accept=".jpg,.jpeg,.png"
                            onChange={(e) => handleFileChange('damageImage', e.target.files?.[0] || null)}
                            className="hidden" // Hides the default file input
                          />
                          {/* Custom styled label to act as the file input button */}
                          <label htmlFor="damageImage" className="cursor-pointer flex items-center justify-center space-x-2 text-agricultural-stone-gray hover:text-agricultural-soil-brown text-center">
                            <Camera className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                            <span className="text-xs sm:text-sm">{formData.damageImage ? formData.damageImage.name : 'Upload Damage Image'}</span>
                          </label>
                        </div>
                      </div>

                      {/* Field Image Upload */}
                      <div>
                        {/* Replaces Label component */}
                        <label htmlFor="fieldImage" className="text-agricultural-soil-brown text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 block">
                          Field Image
                        </label>
                        <div className="mt-2 border-2 border-dashed border-agricultural-stone-gray/30 rounded-lg p-3 sm:p-4">
                          <input
                            id="fieldImage"
                            type="file"
                            accept=".jpg,.jpeg,.png"
                            onChange={(e) => handleFileChange('fieldImage', e.target.files?.[0] || null)}
                            className="hidden"
                          />
                          <label htmlFor="fieldImage" className="cursor-pointer flex items-center justify-center space-x-2 text-agricultural-stone-gray hover:text-agricultural-soil-brown text-center">
                            <Upload className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                            <span className="text-xs sm:text-sm">{formData.fieldImage ? formData.fieldImage.name : 'Upload Field Image'}</span>
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* Replaces Button component */}
                    <div className='flex flex-col sm:flex-row justify-center gap-3 sm:gap-4'>
                    <button
                      type="submit"
                      className="inline-flex items-center justify-center whitespace-nowrap 
                      rounded-md text-sm font-medium ring-offset-background transition-colors 
                      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring 
                      focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 
                      w-full bg-agricultural-forest-green hover:bg-agricultural-crop-green text-white 
                      h-10 px-4 py-2"
                      disabled={isSubmitting}
                    >
                      {isSubmitting && (
                        <svg className="animate-spin mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                        </svg>
                      )}
                      Submit Insurance Claim
                    </button>

                    <button
                      type="button"
                      onClick={handleAiPrediction}
                      disabled={isLoadingAi}
                      className="inline-flex items-center justify-center whitespace-nowrap 
                      rounded-md text-sm font-medium ring-offset-background transition-colors 
                      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring 
                      focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 
                      w-full bg-agricultural-wheat-brown border border-bg-amber-800
                      text-white hover:bg-amber-600 
                      h-10 px-4 py-2"
                    >
                      {isLoadingAi ? 'Analyzing Policy...' : 'Analyze Policy with AI'}
                    </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
            <div className='xl:col-span-1 order-2 xl:order-2'>
              {/* Gemini response div */}
              <div className='rounded-lg border bg-white text-card-foreground shadow-sm warm-shadow 
              border-agricultural-stone-gray/20 h-fit max-h-full min-h-[300px] sm:min-h-[400px] overflow-y-auto'>
                <div className='flex flex-col h-full justify-center space-y-1.5 p-4 sm:p-6'>
                  <h3 className='text-xl sm:text-2xl font-semibold leading-none tracking-tight mb-4 sm:mb-6
                  text-agricultural-soil-brown'>
                    Know your policy
                  </h3>

                  {geminiResponse !== '' ? (
                  <div className='flex p-3 sm:p-4 bg-agricultural-soft-sand rounded-lg'>
                    <div className="text-agricultural-soil-brown text-xs sm:text-sm leading-relaxed whitespace-pre-wrap">
                    <ReactMarkdown>{geminiResponse}</ReactMarkdown>
                    </div>
                  </div>)
                  :(
                    <div className="flex items-center justify-center h-[200px] sm:h-[250px]">
                      <h1 className="text-gray-300 text-sm sm:text-lg text-center px-4">
                        Upload a text file and click "Analyze Policy with AI" to get a summary
                      </h1>
                    </div>
                  )
                }
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AI Prediction Results Modal */}
      {showAiResults && (
        <AiPredictionResults
          apiResponse={{
            crop: apiResponse.predicted_crop_class || 'Unknown Crop',
            acres: user?.totalLand || 0,
            predictedYield: (user?.totalLand || 0) * (2.5 + Math.random() * 1.5),
            confidenceScore: apiResponse.damage_confidence || 85,
            marketPrice: Math.floor(2000 + Math.random() * 1000),
            riskFactors: [
              { 
                factor: 'Image Authenticity', 
                score: apiResponse.authenticity_score || 60, 
                status: apiResponse.authenticity_score >= 80 ? 'excellent' : apiResponse.authenticity_score >= 60 ? 'good' : 'moderate' 
              },
              { 
                factor: 'Damage Detection', 
                score: apiResponse.damage_confidence || 99, 
                status: 'excellent' 
              },
              { 
                factor: 'Crop Classification', 
                score: apiResponse.crop_confidence_percent || 97, 
                status: 'excellent' 
              },
              { 
                factor: 'Location Verification', 
                score: apiResponse.gps_latitude && apiResponse.gps_longitude ? 95 : 50, 
                status: apiResponse.gps_latitude && apiResponse.gps_longitude ? 'excellent' : 'moderate' 
              }
            ],
            recommendations: [
              'Verify image authenticity before proceeding with claim',
              'Ensure all required documents are properly uploaded',
              'Contact insurance provider for additional verification if needed',
              'Monitor claim status regularly through the portal'
            ],
            weatherIndex: 85,
            location: apiResponse.address || 'Location not available',
            farmerId: user?.farmerId || 'Not set',
            generatedAt: new Date().toISOString(),
            projectedRevenue: 0,
            riskIndex: 0
          }}
          onClose={() => setShowAiResults(false)}
        />
      )}
    </div>
  );
};

export default InsuranceClaim;
