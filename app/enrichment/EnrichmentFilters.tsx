/**
 * Enrichment Filters Component
 * Filter service centers by confidence level and activity
 */

import React from 'react';

interface EnrichmentFiltersProps {
  selectedConfidence: string;
  onConfidenceChange: (value: string) => void;
  selectedActivity: string;
  onActivityChange: (value: string) => void;
}

export default function EnrichmentFilters({
  selectedConfidence,
  onConfidenceChange,
  selectedActivity,
  onActivityChange,
}: EnrichmentFiltersProps) {
  return (
    <div className="flex gap-3 flex-wrap">
      {/* Confidence Filter */}
      <div className="flex gap-2">
        <label className="text-sm text-slate-400 font-medium pt-2">Confidence:</label>
        <select
          value={selectedConfidence}
          onChange={(e) => onConfidenceChange(e.target.value)}
          className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
        >
          <option value="all">All</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>

      {/* Activity Filter */}
      <div className="flex gap-2">
        <label className="text-sm text-slate-400 font-medium pt-2">Activity:</label>
        <select
          value={selectedActivity}
          onChange={(e) => onActivityChange(e.target.value)}
          className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
        >
          <option value="all">All</option>
          <option value="active">Active</option>
          <option value="dormant">Dormant</option>
          <option value="moderate">Moderate</option>
        </select>
      </div>
    </div>
  );
}
