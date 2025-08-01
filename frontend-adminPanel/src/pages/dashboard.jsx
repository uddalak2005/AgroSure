// Converted Dashboard.js to plain React + TailwindCSS, removing ShadCN components
import React from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  TrendingUp,
  CheckCircle,
  Clock,
  Users,
  MapPin,
  LogOut,
  Bell,
  PlusCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { StatsCard } from '../components/Dashboard/StatsCard';
import { StatusBadge } from '../components/Dashboard/StatsBadge';

const agentStats = {
  totalSubmissions: 45,
  successfulSubmissions: 38,
  totalInsuranceAmount: 1575000,
  pendingClaims: 7,
  approvedClaims: 35,
  rejectedClaims: 3,
};

const adminStats = {
  totalAgents: 12,
  totalSubmissions: 487,
  totalInsuranceAmount: 15200000,
  pendingReviews: 23,
};

const recentActivity = [
  { id: 1, action: 'Claim submitted for Farmer Rajesh Kumar', time: '2 hours ago', status: 'approved' },
  { id: 2, action: 'New farmer request from Mysore District', time: '4 hours ago', status: 'in-progress' },
  { id: 3, action: 'Claim approved for Farmer Priya Devi', time: '1 day ago', status: 'rejected' },
];

export default function Dashboard() {
  const { user, logout, handleLogout } = useAuth();

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(amount);
  };

  const renderQuickButton = (to, Icon, label) => {
  const target = label === 'Add New Farmer' ? '_blank' : '_self';

  return (
    <a
      href={to}
      target={target}
      rel="noopener noreferrer"
      className="w-full text-left border rounded-xl px-4 py-2 border-input 
      bg-background hover:bg-accent hover:text-accent-foreground flex items-center font-semibold"
    >
      <Icon className="mr-2 h-4 w-4" />
      {label}
    </a>
  );
};

  const renderAgentDashboard = () => (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <StatsCard title="Total Submissions" value={agentStats.totalSubmissions} description="Insurance claims filed" icon={FileText} trend={{ value: 12, isPositive: true }} />
        <StatsCard title="Success Rate" value={`${Math.round((agentStats.successfulSubmissions / agentStats.totalSubmissions) * 100)}%`} description="Claims approved" icon={CheckCircle} trend={{ value: 5, isPositive: true }} />
        <StatsCard title="Total Insurance" value={formatCurrency(agentStats.totalInsuranceAmount)} description="Amount raised" icon={TrendingUp} trend={{ value: 8, isPositive: true }} />
        <StatsCard title="Pending Claims" value={agentStats.pendingClaims} description="Awaiting review" icon={Clock} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="border rounded-2xl p-6 bg-white">
          <h3 className="text-xl font-semibold">Quick Actions</h3>
          <p className="text-sm text-muted-foreground mb-4">Common tasks for your daily workflow</p>
          <div className="space-y-2">
            {renderQuickButton(`/add-farmer`, PlusCircle, 'Add New Farmer')}
            {renderQuickButton('/all-farmers', FileText, 'Farmers under me')}
            {renderQuickButton('#', TrendingUp, 'View Submission History')}
          </div>
        </div>

        <div className="border rounded-2xl p-6">
          <h3 className="text-xl font-semibold">Recent Activity</h3>
          <p className="text-sm text-muted-foreground mb-2">Your recent submissions and updates</p>
          <div className="space-y-3">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium">{activity.action}</p>
                  <p className="text-xs text-muted-foreground">{activity.time}</p>
                </div>
                <StatusBadge status={activity.status} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderAdminDashboard = () => (
    <div className="space-y-6 my-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 my-4">
        <StatsCard title="Total Agents" value={adminStats.totalAgents} description="Active field agents" icon={Users} trend={{ value: 2, isPositive: true }} />
        <StatsCard title="Total Submissions" value={adminStats.totalSubmissions} description="Across all agents" icon={FileText} trend={{ value: 15, isPositive: true }} />
        <StatsCard title="Total Insurance" value={formatCurrency(adminStats.totalInsuranceAmount)} description="Amount processed" icon={TrendingUp} trend={{ value: 23, isPositive: true }} />
        <StatsCard title="Pending Reviews" value={adminStats.pendingReviews} description="Awaiting approval" icon={Clock} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="border rounded-2xl p-8 bg-white">
          <h3 className="text-xl font-semibold">Admin Actions</h3>
          <p className="text-sm text-muted-foreground mb-2">Management and oversight tools</p>
          <div className="space-y-2 mt-4">
            {renderQuickButton('/add-kiosk', Users, 'Add New Agent/Kiosk')}
            {renderQuickButton('/all-kiosks', FileText, 'All kiosks')}
            {renderQuickButton('#', TrendingUp, 'Performance Reports')}
          </div>
        </div>

        <div className="border rounded-2xl p-8">
          <h3 className="text-lg font-semibold">System Overview</h3>
          <p className="text-md text-muted-foreground">Platform health and metrics</p>
          <div className="flex flex-col flex-1 ">
            <div className="flex items-center justify-between my-4">
              <span className="text-base">Active Agents : <strong>{adminStats.totalAgents - 4}</strong></span>
              <StatusBadge status="approved" />
            </div>
            <div className="flex items-center justify-between my-4">
              <span className="text-base">Total amount : <strong>{formatCurrency(adminStats.totalInsuranceAmount)}</strong></span>
              <StatusBadge status="approved" />
            </div>
            <div className="flex items-center justify-between my-4">
              <span className="text-base">Pending Approvals : <strong>{adminStats.pendingReviews}</strong></span>
              <StatusBadge status="pending" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
  <div className="min-h-screen bg-background">
    {/* Header */}
    <header className="border-b bg-card">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="h-8 w-8 bg-primary rounded-full flex items-center justify-center">
              <FileText className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-foreground">
                Crop Insurance Portal
              </h1>
              <p className="text-sm text-muted-foreground">
                {user?.role === 'admin' ? 'Admin Dashboard' : 'Agent Dashboard'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <button variant="ghost" className='hover:bg-yellow-500/70 p-2 
            aspect-square rounded-full flex items-center justify-center' size="icon">
              <Bell className="h-4 w-4 mr-2" />
            </button>
            <div className="flex items-center space-x-2">
              <div className="text-right">
                <p className="text-sm font-medium text-foreground">{user?.name}</p>
                <p className="text-xs text-muted-foreground">
                  {user?.jurisdiction || user?.role}
                </p>
              </div>
              <button variant="ghost" size="icon" className='hover:bg-yellow-500/70 p-2 rounded-full' onClick={handleLogout}>
                <LogOut className="h-4 w-4 ml-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>

    {/* Main Content */}
    <main className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-foreground">
          Welcome back, {user?.name}
        </h2>
        <p className="text-muted-foreground">
          {user?.role === 'admin'
            ? 'Manage your team and oversee crop insurance operations'
            : `Serving farmers in ${user?.jurisdiction || 'your assigned area'}`}
        </p>
        {user?.location && (
          <div className="flex items-center mt-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 mr-1" />
            {user.location}
          </div>
        )}
      </div>

      {user?.role === 'admin' ? renderAdminDashboard() : renderAgentDashboard()}
    </main>
  </div>
);
}
