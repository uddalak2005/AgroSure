import React, { useState, useEffect } from 'react'; // Import React
import { ArrowLeft, FileText, TrendingUp, CreditCard, Calendar, DollarSign, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { auth } from '../utils/firebaseConfig';



const PastReports = ({ user, onBack }) => {

    const [insuranceHistory, setInsuranceHistory] = useState([]);
    const [yieldClaimHistory, setYieldClaimHistory] = useState([]);
  // Mock data for loan claim history
  const loanHistory = [
    {
      id: "IN001",
      purpose: "Crop Seeds Purchase",
      amount: "₹2,50,000",
      tenure: "12 months",
      status: "Approved",
      appliedDate: "15 Nov 2024",
      approvedDate: "22 Nov 2024"
    },
    {
      id: "IN002",
      purpose: "Farm Equipment",
      amount: "₹5,00,000",
      tenure: "24 months",
      status: "Under Review",
      appliedDate: "10 Dec 2024",
      approvedDate: "-"
    },
    {
      id: "IN003",
      purpose: "Irrigation System",
      amount: "₹1,75,000",
      tenure: "18 months",
      status: "Rejected",
      appliedDate: "05 Oct 2024",
      approvedDate: "-"
    }
  ];

  useEffect(()=>{
    const fetchInsuranceHistory = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/crop/getAllCrops/${auth.currentUser.uid}`);
        const data = await response.json(); 
        console.log("data : ",data);
        setYieldClaimHistory(data.cropRecord || []);
        console.log("yield claim history : ",yieldClaimHistory);
      } catch (error) {
        console.error('Error fetching yield claim history:', error);
        setYieldClaimHistory([]);
      }
    };
    fetchInsuranceHistory();
  },[]);

  // Transform API response to match the display format
  const transformedYieldHistory = (yieldClaimHistory || []).map((item, index) => ({
    id: item._id || `YP${String(index + 1).padStart(3, '0')}`,
    crop: item.cropName.charAt(0).toUpperCase() + item.cropName.slice(1) || 'Unknown Crop',
    landSize: `${item.acresOfLand || 0} acres`,
    predictedYield: `${item.predictedYieldKgPerAcre || 0} kg/acre`,
    actualYield: item.actualYield ? `${item.actualYield} kg/acre` : 'Pending',
    accuracy: item.climateScore ? `${item.climateScore}%` : '-',
    season: item.soilHealthCategory || 'Unknown Season',
    predictionDate: item.expectedHarvestDate ? new Date(item.expectedHarvestDate).toLocaleDateString() : 'Unknown Date',
    status: item.status || 'Completed',
    soilType: item.soilType || 'Not specified',
    irrigationMethod: item.irrigationMethod || 'Not specified',
    location: item.location ? `${item.location.lat}, ${item.location.long}` : 'Location not set'
  }));

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'approved':
        return 'bg-agricultural-crop-green/10 text-agricultural-crop-green border-agricultural-crop-green';
      case 'under review':
        return 'bg-agricultural-harvest-gold/10 text-agricultural-harvest-gold border-agricultural-harvest-gold';
      case 'rejected':
        return 'bg-agricultural-drought-orange/10 text-agricultural-drought-orange border-agricultural-drought-orange';
      default:
        return 'bg-agricultural-stone-gray/10 text-agricultural-stone-gray border-agricultural-stone-gray';
    }
  };

  const getStatusIcon = (status) => {
    switch (status.toLowerCase()) {
      case 'approved':
        return <CheckCircle className="h-4 w-4" />;
      case 'under review':
        return <Clock className="h-4 w-4" />;
      case 'rejected':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-agricultural-soft-sand p-8">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={onBack}
          className="mb-4 text-agricultural-soil-brown hover:bg-agricultural-stone-gray/10 px-4 py-2 rounded-md inline-flex items-center" // Basic button styling
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </button>

        <div className="flex items-center space-x-3 mb-2">
          <FileText className="h-8 w-8 text-agricultural-forest-green" />
          <h1 className="text-3xl font-bold text-agricultural-soil-brown">Past Reports</h1>
        </div>
        <p className="text-agricultural-stone-gray">
          View your complete history of insurances and yield predictions
        </p>
      </div>

      {/* Two Column Layout */}
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Loan Claim History */}
        <div>
          <div className="bg-white rounded-lg shadow-md border border-agricultural-stone-gray/20 p-6 warm-shadow"> {/* Card equivalent */}
            <div className="mb-4"> {/* CardHeader equivalent */}
              <h2 className="text-xl font-semibold text-agricultural-soil-brown flex items-center"> {/* CardTitle equivalent */}
                <CreditCard className="h-5 w-5 mr-2" />
                Insurance Claim History
              </h2>
            </div>
            <div className="space-y-4"> {/* CardContent equivalent */}
              {loanHistory.map((loan) => (
                <div
                  key={loan.id}
                  className="bg-white rounded-lg p-4 border border-agricultural-stone-gray/20 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-agricultural-soil-brown">{loan.purpose}</h3>
                      <p className="text-sm text-agricultural-stone-gray">ID: {loan.id}</p>
                    </div>
                    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full border ${getStatusColor(loan.status)}`}> {/* Badge equivalent */}
                      {getStatusIcon(loan.status)}
                      {loan.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center">
                      <DollarSign className="h-4 w-4 text-agricultural-forest-green mr-2" />
                      <span className="text-agricultural-stone-gray">Amount:</span>
                      <span className="font-medium text-agricultural-soil-brown ml-1">{loan.amount}</span>
                    </div>
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 text-agricultural-forest-green mr-2" />
                      <span className="text-agricultural-stone-gray">Tenure:</span>
                      <span className="font-medium text-agricultural-soil-brown ml-1">{loan.tenure}</span>
                    </div>
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 text-agricultural-stone-gray mr-2" />
                      <span className="text-agricultural-stone-gray">Applied:</span>
                      <span className="font-medium text-agricultural-soil-brown ml-1">{loan.appliedDate}</span>
                    </div>
                    <div className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-agricultural-stone-gray mr-2" />
                      <span className="text-agricultural-stone-gray">Approved:</span>
                      <span className="font-medium text-agricultural-soil-brown ml-1">{loan.approvedDate}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Yield Prediction History */}
        <div>
          <div className="bg-white rounded-lg shadow-md border border-agricultural-stone-gray/20 p-6 warm-shadow"> {/* Card equivalent */}
            <div className="mb-4"> {/* CardHeader equivalent */}
              <h2 className="text-xl font-semibold text-agricultural-soil-brown flex items-center"> {/* CardTitle equivalent */}
                <TrendingUp className="h-5 w-5 mr-2" />
                Yield Prediction History
              </h2>
            </div>
            <div className="space-y-4"> {/* CardContent equivalent */}
              {transformedYieldHistory.length > 0 ? (
                transformedYieldHistory.map((prediction) => (
                  <div
                    key={prediction.id}
                    className="bg-white rounded-lg p-4 border border-agricultural-stone-gray/20 hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold text-agricultural-soil-brown">{prediction.crop}</h3>
                        <p className="text-sm text-agricultural-stone-gray">ID: {prediction.id}</p>
                      </div>
                      <span className="inline-flex items-center text-xs font-semibold px-2.5 py-0.5 rounded-full border bg-agricultural-crop-green/10 text-agricultural-crop-green border-agricultural-crop-green"> {/* Badge equivalent */}
                        {prediction.season}
                      </span>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-agricultural-stone-gray">Land Size:</span>
                        <span className="font-medium text-agricultural-soil-brown">{prediction.landSize}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-agricultural-stone-gray">Predicted Yield:</span>
                        <span className="font-medium text-agricultural-soil-brown">{prediction.predictedYield}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-agricultural-stone-gray">Actual Yield:</span>
                        <span className="font-medium text-agricultural-soil-brown">{prediction.actualYield}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-agricultural-stone-gray font-semibold">Climate Score:</span>
                        <span className={`font-medium ${prediction.accuracy !== '-' ? 'text-agricultural-crop-green' : 'text-agricultural-stone-gray'}`}>
                          {prediction.accuracy}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-agricultural-stone-gray">Soil Type:</span>
                        <span className="font-medium text-agricultural-soil-brown">{prediction.soilType}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-agricultural-stone-gray">Irrigation:</span>
                        <span className="font-medium text-agricultural-soil-brown">{prediction.irrigationMethod}</span>
                      </div>
                      <div className="flex justify-between pt-2 border-t border-agricultural-stone-gray/20">
                        <span className="text-agricultural-stone-gray">Prediction Date:</span>
                        <span className="font-medium text-agricultural-soil-brown">{prediction.predictionDate}</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-agricultural-stone-gray">
                  <TrendingUp className="h-12 w-12 mx-auto mb-4 text-agricultural-stone-gray/50" />
                  <p>No yield predictions found</p>
                  <p className="text-sm">Your yield prediction history will appear here</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PastReports;