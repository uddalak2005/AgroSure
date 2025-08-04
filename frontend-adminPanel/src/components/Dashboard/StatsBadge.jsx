import React from 'react';

export function StatusBadge({ status }) {
  const getColorClasses = () => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'in-progress':
      case 'in-review':
        return 'bg-orange-100 text-orange-800';
      case 'submitted':
        return 'bg-gray-100 text-gray-800';
      case 'pending':
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getLabel = () => {
    switch (status) {
      case 'in-progress':
        return 'In Progress';
      case 'in-review':
        return 'In Review';
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getColorClasses()}`}>
      {getLabel()}
    </span>
  );
}
