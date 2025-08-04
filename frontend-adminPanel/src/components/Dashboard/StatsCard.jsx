import React from 'react';

export function StatsCard({ title, value, description, icon: Icon, trend }) {
  return (
    <div className="border rounded-2xl shadow-sm p-4 bg-white">
      <div className="flex flex-row items-center justify-between pb-2">
        <h3 className="text-sm font-medium">{title}</h3>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="pt-1">
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
        {trend && (
          <p className={`text-xs mt-1 ${trend.isPositive ? 'text-green-600' : 'text-orange-600'}`}>
            {trend.isPositive ? '+' : ''}{trend.value}% from last month
          </p>
        )}
      </div>
    </div>
  );
}