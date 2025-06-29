import { useState } from 'react';
import { MapPin, Leaf, Calendar as CalendarIcon, TrendingUp, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { auth } from '../utils/firebaseConfig';
const YieldPredictionForm = ({ user , onPredictionComplete }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    cropType: '',
    acres: 0,
    plantingDate: '',
    harvestDate: '',
    soilType: '',
    irrigationType: '',
    notes: ''
  });

 const [apiPostResponse, setApiPostResponse] = useState(null);

const [apiGetResponse, setApiGetResponse ] = useState({
  uid: "64bca9e1f42aab3472d58fa2", // simulated MongoDB ObjectId reference
  acresOfLand: "3.5",
  cropName: "Rice",
  plantingDate: new Date("2025-06-01"),
  expectedHarvestDate: new Date("2025-10-15"),
  soilType: "Loamy",
  irrigationMethod: "Drip Irrigation",
  additionalNotes: "Field located near river, good access to water.",
  predictedYieldKgPerAcre: 1450,
  yieldCategory: "High",
  soilHealthScore: 82,
  soilHealthCategory: "Excellent",
  climateScore: 76,
  location: {
    lat: 23.1949,
    long: 88.6094
  },
  suggestedCrops: [
    {
      cropName: "Maize",
      predictedYieldKgPerHa: 7200
    },
    {
      cropName: "Wheat",
      predictedYieldKgPerHa: 6500
    },
    {
      cropName: "Sugarcane",
      predictedYieldKgPerHa: 84000
    }
  ]
});
 const [responseFetched, setResponseFetched] = useState(false);
  
  const cropOptions = [
    { value: 'wheat', label: 'Wheat', icon: '🌾' },
    { value: 'rice', label: 'Rice', icon: '🌾' },
    { value: 'corn', label: 'Corn', icon: '🌽' },
    { value: 'mustard', label: 'Mustard', icon: '🌻' },
    { value: 'cotton', label: 'Cotton', icon: '🌿' },
    { value: 'sugarcane', label: 'Sugarcane', icon: '🎋' }
  ];

  const soilTypes = [
    { value: 'clay', label: 'Clay Soil' },
    { value: 'sandy', label: 'Sandy Soil' },
    { value: 'loamy', label: 'Loamy Soil' },
    { value: 'silt', label: 'Silt Soil' },
    { value: 'black', label: 'Black Soil' }
  ];

  const irrigationTypes = [
    { value: 'drip', label: 'Drip Irrigation' },
    { value: 'sprinkler', label: 'Sprinkler Irrigation' },
    { value: 'flood', label: 'Flood Irrigation' },
    { value: 'rainfall', label: 'Rainfall Dependent' }
  ];

  const calculateTimespan = () => {
    if (formData.plantingDate && formData.harvestDate) {
      const planting = new Date(formData.plantingDate);
      const harvest = new Date(formData.harvestDate);
      
      if (harvest > planting) {
        const diffTime = Math.abs(harvest - planting);
        const diffMonths = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30.44)); // Average days per month
        return diffMonths;
      }
    }
    return 0;
  };

  const timespan = calculateTimespan();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true); // Start loading
    console.log("Form data : ",formData);
    const payload = {
      uid : auth.currentUser.uid,
      cropName: formData.cropType,
      acresOfLand: Number(formData.acres),
      plantingDate : formData.plantingDate,
      expectedHarvestDate : formData.harvestDate,
      soilType: formData.soilType,
      irrigationMethod: formData.irrigationType,
      additionalNotes: formData.notes || null,
    }
    console.log("Payload : ",payload);
    if (!formData.cropType || !formData.acres || !formData.plantingDate) {
      alert("Please fill in all required fields.");
      setIsLoading(false); // Stop loading on validation error
      return;}

      try {
        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/crop/addNewCrop`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload)
        }); 
        if (!response.ok) {
          throw new Error('Failed to submit yield prediction');
        }
        const data = await response.json();
        console.log(data);
        console.log('Yield prediction submitted successfully:', data);
        
        //POST done, now get the data from the database
        try {
          const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/crop/getPredictions/${data.newCrop._id}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          });
          const data_get = await response.json();
          console.log("Data from get : ",data_get);
          setApiGetResponse(data_get);
          onPredictionComplete(data_get.updatedCropRecord);
          setIsLoading(false); // Stop loading when prediction is complete
          
        } catch (error) {
          console.error('Error getting predictions:', error);
          setIsLoading(false); // Stop loading on error
        }
      }catch (e) {
        console.error('Error submitting yield prediction:', e);
        alert('Failed to submit yield prediction. Please try again.');
        setIsLoading(false); // Stop loading on error
      }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
      setFormData(prev => ({ ...prev, [name]: value }));

  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-2">Yield Prediction Request</h1>
      <p className="text-gray-600 mb-8">Provide details about your crop to get accurate yield predictions</p>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="p-6 border shadow rounded">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <Leaf className="h-5 w-5 mr-2" /> Crop Information
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block font-medium mb-1">Crop Type *</label>
                <select
                  value={formData.cropType}
                  onChange={(e) => setFormData(prev => ({ ...prev, cropType: e.target.value }))}
                  className="w-full border px-3 py-2 rounded"
                >
                  <option value="">Select crop type</option>
                  {cropOptions.map((crop) => (
                    <option key={crop.value} value={crop.value}>
                      {crop.icon} {crop.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium mb-1">Acres to Evaluate *</label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="e.g., 5.5"
                  className="w-full border px-3 py-2 rounded"
                  value={formData.acres}
                  onChange={(e) => setFormData(prev => ({ ...prev, acres: e.target.value }))}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium mb-1">Planting Date *</label>
                  <input
                    type="date"
                    name="plantingDate"
                    value={formData.plantingDate}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>

                <div>
                  <label className="block font-medium mb-1">Expected Harvest Date</label>
                  <input
                    type="date"
                    name="harvestDate"
                    value={formData.harvestDate}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>
              </div>

              {timespan > 0 && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Growing Period
                  </label>
                  <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-md">
                    <span className="text-gray-700 font-medium">{timespan} months</span>
                  </div>
                </div>
              )}

              <div>
                <label className="block font-medium mb-1">Soil Type</label>
                <select
                  value={formData.soilType}
                  onChange={(e) => setFormData(prev => ({ ...prev, soilType: e.target.value }))}
                  className="w-full border px-3 py-2 rounded"
                >
                  <option value="">Select soil type</option>
                  {soilTypes.map((soil) => (
                    <option key={soil.value} value={soil.value}>{soil.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium mb-1">Irrigation Method</label>
                <select
                  value={formData.irrigationType}
                  onChange={(e) => setFormData(prev => ({ ...prev, irrigationType: e.target.value }))}
                  className="w-full border px-3 py-2 rounded"
                >
                  <option value="">Select irrigation method</option>
                  {irrigationTypes.map((irrigation) => (
                    <option key={irrigation.value} value={irrigation.value}>{irrigation.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium mb-1">Additional Notes</label>
                <textarea
                  className="w-full border px-3 py-2 rounded"
                  placeholder="Any additional information..."
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                ></textarea>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-green-700 hover:bg-green-600 text-white py-3 rounded font-semibold"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating Prediction...
                  </span>
                ) : (
                  <span className="flex items-center justify-center">
                    <TrendingUp className="mr-2 h-4 w-4" /> Generate Yield Prediction
                  </span>
                )}
              </button>
            </form>
          </div>
        </div>

        <div className="space-y-6">
          <div className="p-6 border shadow rounded">
            <h2 className="text-xl font-semibold mb-4">Farm Information</h2>
            <div className="text-sm space-y-2">
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-gray-600" />
                <span>{user.locationLat && user.locationLong ? `${user.locationLat}, ${user.locationLong}` : 'Location not set'}</span>
              </div>
              <div>
                <span className="text-gray-600">Total Land: </span>
                <span className="font-semibold">{user.totalLand || 0} acres</span>
              </div>
              <div>
                <span className="text-gray-600">Farmer ID: </span>
                <span className="font-semibold">{user.farmerId || 'Not set'}</span>
              </div>
            </div>
          </div>

          <div className="p-6 border shadow rounded">
            <h2 className="text-xl font-semibold mb-4">How it Works</h2>
            <ol className="list-decimal pl-5 space-y-2 text-sm">
              <li>Enter your crop and farm details</li>
              <li>AI analyzes weather, soil, and historical data</li>
              <li>Get detailed yield prediction report</li>
              <li>Use report for loan applications</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};

export default YieldPredictionForm;