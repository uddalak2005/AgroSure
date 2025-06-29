import { useState, useEffect } from 'react';
import { ArrowLeft, CreditCard, TrendingUp, Shield, CheckCircle, Loader2 } from "lucide-react";
import { auth } from '../utils/firebaseConfig';

const LoanApplication = ({ user, onBack }) => {
  const [formData, setFormData] = useState({
    loanPurpose: '',
    requestedAmount: '',
    loanTenure: '',
    selectedCropId: ''
  });

  const [cropHistory, setCropHistory] = useState([]);
  const [selectedCrop, setSelectedCrop] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(()=>{
    const fetchCropHistory = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/crop/getAllCrops/${auth.currentUser.uid}`);
        const data = await response.json(); 
        console.log("data : ",data);
        setCropHistory(data.cropRecord || []);
        console.log("crop history : ",cropHistory);
      } catch (error) {
        console.error('Error fetching yield claim history:', error);
        setCropHistory([]);
      }
    };
    fetchCropHistory();
  },[]);

  const handleCropSelection = async (cropId) => {
    if (!cropId) return;
    
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/loan/submitCropSelection`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cropId })
      });
      
      if (!response.ok) {
        throw new Error('Failed to submit crop selection');
      }
      
      const data = await response.json();
      console.log('Crop selection submitted successfully:', data);
      
      // Update the selected crop state
      const selectedCropData = cropHistory.find(crop => crop._id === cropId);
      setSelectedCrop(selectedCropData);
      
    } catch (error) {
      console.error('Error submitting crop selection:', error);
      alert('Failed to submit crop selection. Please try again.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    // In a real application, you'd send formData to your backend here.
    console.log("Submitting loan application with data:", formData);
    // Optionally reset form or navigate
    // setFormData({ loanPurpose: '', requestedAmount: '', loanTenure: '' });
    const payload = {
      uid:auth.currentUser.uid,
      loanPurpose: formData.loanPurpose,
      requestedAmount: formData.requestedAmount,
      loanTenure: Number(formData.loanTenure.split("-")[0])
    }
    console.log("payload : ",payload);
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/loan/submit/${formData.selectedCropId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        throw new Error('Failed to submit loan application');
      }
      const data = await response.json();
      console.log('Loan application submitted successfully:', data);
      alert("Loan submitted and mail sent to nearby banks!");
    } catch (e) {
      console.error('Error submitting loan application:', e);
      alert('Failed to submit loan application. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="min-h-screen bg-agricultural-soft-sand">
      <div className="p-8">
        <div className="flex items-center mb-6">
          {/* Replaces Button component */}
          <button
            onClick={onBack}
            className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-10 px-4 py-2 text-agricultural-soil-brown hover:bg-agricultural-stone-gray/10"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </button>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-agricultural-soil-brown mb-2">
              Loan Application
            </h1>
            <p className="text-agricultural-stone-gray">
              Apply for an agricultural loan with data-backed predictions
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Loan Application Form */}
            <div className="lg:col-span-2">
              {/* Replaces Card component */}
              <div className="rounded-lg border bg-white text-card-foreground shadow-sm warm-shadow border-agricultural-stone-gray/20">
                {/* Replaces CardHeader */}
                <div className="flex flex-col space-y-1.5 p-6">
                  {/* Replaces CardTitle */}
                  <h3 className="flex items-center text-2xl font-semibold leading-none tracking-tight text-agricultural-soil-brown">
                    <CreditCard className="h-5 w-5 mr-2" />
                    Loan Details
                  </h3>
                </div>
                {/* Replaces CardContent */}
                <div className="p-6 pt-0">
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                      {/* Replaces Label component */}
                      <label htmlFor="loanPurpose" className="text-agricultural-soil-brown text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 block">
                        Loan Purpose
                      </label>
                      {/* Replaces Select, SelectTrigger, SelectValue, SelectContent, SelectItem */}
                      <select
                        id="loanPurpose"
                        value={formData.loanPurpose}
                        onChange={(e) => handleChange('loanPurpose', e.target.value)}
                        className="flex h-10 w-full rounded-md border border-agricultural-stone-gray/30 bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-agricultural-forest-green focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 mt-2 appearance-none pr-8 leading-tight" // Added appearance-none and pr-8 for custom arrow if desired
                      >
                        <option value="" disabled hidden>Select loan purpose</option>
                        <option value="crop-cultivation">Crop Cultivation</option>
                        <option value="equipment-purchase">Equipment Purchase</option>
                        <option value="land-improvement">Land Improvement</option>
                        <option value="livestock">Livestock Purchase</option>
                        <option value="working-capital">Working Capital</option>
                      </select>
                      {/* Optional custom arrow for select, if appearance-none is used above */}
                      {/* <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-agricultural-stone-gray">
                          <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                      </div> */}
                    </div>

                    <div>
                      {/* Replaces Label component */}
                      <label htmlFor="selectedCrop" className="text-agricultural-soil-brown text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 block">
                        Select Crop (for loan assessment)
                      </label>
                      {/* Replaces Select, SelectTrigger, SelectValue, SelectContent, SelectItem */}
                      <select
                        id="selectedCrop"
                        value={formData.selectedCropId}
                        onChange={(e) => {
                          const cropId = e.target.value;
                          handleChange('selectedCropId', cropId);
                          // Update the selected crop state
                          const selectedCropData = cropHistory.find(crop => crop._id === cropId);
                          setSelectedCrop(selectedCropData);
                        }}
                        className="flex h-10 w-full rounded-md border border-agricultural-stone-gray/30 bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-agricultural-forest-green focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 mt-2 appearance-none pr-8 leading-tight"
                      >
                        <option value="" disabled hidden>Select a crop from your history</option>
                        {cropHistory.map((item) => (
                          <option key={item._id} value={item._id}>
                            {item.cropName.charAt(0).toUpperCase() + item.cropName.slice(1)}
                          </option>
                        ))}
                      </select>
                    </div>

                    {selectedCrop && (
                      <div className="p-4 bg-agricultural-forest-green/10 rounded-md border border-agricultural-forest-green/20">
                        <h4 className="font-medium text-agricultural-soil-brown mb-2">Selected Crop Details</h4>
                        <div className="text-sm text-agricultural-stone-gray space-y-1">
                          <p><span className="font-medium">Crop:</span> {selectedCrop.cropName.charAt(0).toUpperCase() + selectedCrop.cropName.slice(1)}</p>
                          <p><span className="font-medium">Land Size:</span> {selectedCrop.acresOfLand} acres</p>
                          <p><span className="font-medium">Predicted Yield:</span> {selectedCrop.predictedYieldKgPerAcre} kg/acre</p>
                          <p><span className="font-medium">Climate Score:</span> {selectedCrop.climateScore}%</p>
                        </div>
                      </div>
                    )}

                    <div>
                      {/* Replaces Label component */}
                      <label htmlFor="requestedAmount" className="text-agricultural-soil-brown text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 block">
                        Requested Amount (₹)
                      </label>
                      {/* Replaces Input component */}
                      <input
                        id="requestedAmount"
                        type="number"
                        placeholder="Enter amount"
                        value={formData.requestedAmount}
                        onChange={(e) => handleChange('requestedAmount', e.target.value)}
                        className="flex h-10 w-full rounded-md border border-agricultural-stone-gray/30 bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-agricultural-forest-green focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 mt-2"
                      />
                    </div>

                    <div>
                      {/* Replaces Label component */}
                      <label htmlFor="loanTenure" className="text-agricultural-soil-brown text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 block">
                        Loan Tenure
                      </label>
                      {/* Replaces Select, SelectTrigger, SelectValue, SelectContent, SelectItem */}
                      <select
                        id="loanTenure"
                        value={formData.loanTenure}
                        onChange={(e) => handleChange('loanTenure', e.target.value)}
                        className="flex h-10 w-full rounded-md border border-agricultural-stone-gray/30 bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-agricultural-forest-green focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 mt-2 appearance-none pr-8 leading-tight" // Added appearance-none and pr-8 for custom arrow if desired
                      >
                        <option value="" disabled hidden>Select loan tenure</option>
                        <option value="1-year">1 Year</option>
                        <option value="2-years">2 Years</option>
                        <option value="3-years">3 Years</option>
                        <option value="5-years">5 Years</option>
                        <option value="7-years">7 Years</option>
                      </select>
                    </div>

                    {/* Replaces Button component */}
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 w-full bg-agricultural-forest-green hover:bg-agricultural-crop-green text-white h-10 px-4 py-2"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        'Submit Loan Application'
                      )}
                    </button>
                  </form>
                </div>
              </div>
            </div>

            {/* How Loans Work */}
            <div className="space-y-6">
              {/* Replaces Card component */}
              <div className="rounded-lg border bg-white text-card-foreground shadow-sm warm-shadow border-agricultural-stone-gray/20">
                {/* Replaces CardHeader */}
                <div className="flex flex-col space-y-1.5 p-6">
                  {/* Replaces CardTitle */}
                  <h3 className="text-2xl font-semibold leading-none tracking-tight text-agricultural-soil-brown">How It Works</h3>
                </div>
                {/* Replaces CardContent */}
                <div className="p-6 pt-0 space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-agricultural-forest-green/10 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <span className="text-agricultural-forest-green font-semibold text-sm">1</span>
                    </div>
                    <div>
                      <h4 className="font-medium text-agricultural-soil-brown">Submit Application</h4>
                      <p className="text-sm text-agricultural-stone-gray">Fill out the loan application with your requirements</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-agricultural-forest-green/10 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <span className="text-agricultural-forest-green font-semibold text-sm">2</span>
                    </div>
                    <div>
                      <h4 className="font-medium text-agricultural-soil-brown">Data Review</h4>
                      <p className="text-sm text-agricultural-stone-gray">Banks review your yield predictions and farm data</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-agricultural-forest-green/10 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <span className="text-agricultural-forest-green font-semibold text-sm">3</span>
                    </div>
                    <div>
                      <h4 className="font-medium text-agricultural-soil-brown">Approval</h4>
                      <p className="text-sm text-agricultural-stone-gray">Get faster approval based on AI predictions</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Benefits */}
              {/* Replaces Card component */}
              <div className="rounded-lg border bg-white text-card-foreground shadow-sm warm-shadow border-agricultural-stone-gray/20">
                {/* Replaces CardHeader */}
                <div className="flex flex-col space-y-1.5 p-6">
                  {/* Replaces CardTitle */}
                  <h3 className="flex items-center text-2xl font-semibold leading-none tracking-tight text-agricultural-soil-brown">
                    <TrendingUp className="h-5 w-5 mr-2" />
                    Benefits
                  </h3>
                </div>
                {/* Replaces CardContent */}
                <div className="p-6 pt-0 space-y-3">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-agricultural-crop-green" />
                    <span className="text-sm text-agricultural-soil-brown">Lower interest rates</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-agricultural-crop-green" />
                    <span className="text-sm text-agricultural-soil-brown">Faster processing</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-agricultural-crop-green" />
                    <span className="text-sm text-agricultural-soil-brown">Data-backed approval</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-agricultural-crop-green" />
                    <span className="text-sm text-agricultural-soil-brown">Flexible repayment</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Section - Full Width */}
          <div className="mt-8 grid lg:grid-cols-3 gap-8">
            {/* Left side - takes 2 columns */}
            <div className="lg:col-span-2">
              <div className="rounded-lg border bg-white text-card-foreground shadow-sm warm-shadow border-agricultural-stone-gray/20 h-96">
                <div className="flex flex-col space-y-1.5 p-6">
                  <h3 className="text-2xl font-semibold leading-none tracking-tight text-agricultural-soil-brown">
                    Additional Information
                  </h3>
                </div>
                <div className="p-6 pt-0">
                  <p className="text-agricultural-stone-gray">
                    This section takes up the remaining screen space beside the form. You can add any content here such as:
                  </p>
                  <ul className="mt-4 space-y-2 text-agricultural-stone-gray">
                    <li>• Loan application guidelines</li>
                    <li>• Required documents</li>
                    <li>• Terms and conditions</li>
                    <li>• Contact information</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Right side - takes 1 column */}
            <div className="lg:col-span-1">
              <div className="rounded-lg border bg-white text-card-foreground shadow-sm warm-shadow border-agricultural-stone-gray/20 h-96">
                <div className="flex flex-col space-y-1.5 p-6">
                  <h3 className="text-2xl font-semibold leading-none tracking-tight text-agricultural-soil-brown">
                    Quick Actions
                  </h3>
                </div>
                <div className="p-6 pt-0">
                  <div className="space-y-3">
                    <button className="w-full text-left p-3 rounded-md border border-agricultural-stone-gray/20 hover:bg-agricultural-forest-green/5 transition-colors">
                      <div className="font-medium text-agricultural-soil-brown">Download Application</div>
                      <div className="text-sm text-agricultural-stone-gray">Get PDF copy</div>
                    </button>
                    <button className="w-full text-left p-3 rounded-md border border-agricultural-stone-gray/20 hover:bg-agricultural-forest-green/5 transition-colors">
                      <div className="font-medium text-agricultural-soil-brown">Track Status</div>
                      <div className="text-sm text-agricultural-stone-gray">Check application progress</div>
                    </button>
                    <button className="w-full text-left p-3 rounded-md border border-agricultural-stone-gray/20 hover:bg-agricultural-forest-green/5 transition-colors">
                      <div className="font-medium text-agricultural-soil-brown">Contact Support</div>
                      <div className="text-sm text-agricultural-stone-gray">Get help with application</div>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoanApplication;