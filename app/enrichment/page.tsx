/**
 * Enrichment Page - Service Center Intelligence
 * Displays Google Places + AI Facility Analysis for all service centers
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Search, Filter, Download, RefreshCw } from 'lucide-react';
import EnrichmentCard from './EnrichmentCard';
import EnrichmentFilters from './EnrichmentFilters';

interface ServiceCenterEnrichment {
  id: string;
  name: string;
  googleRating?: number;
  sentimentScore?: number;
  facilityType?: string;
  estimatedBays?: number;
  trucksVisible?: number;
  activityLevel?: string;
  confidence?: string;
  salesIntel?: string;
  imageUrl?: string;
}

export default function EnrichmentPage() {
  const [centers, setCenters] = useState<ServiceCenterEnrichment[]>([]);
  const [filtered, setFiltered] = useState<ServiceCenterEnrichment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedConfidence, setSelectedConfidence] = useState('all');
  const [selectedActivity, setSelectedActivity] = useState('all');

  // Load enrichment data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/enrichment/list');
        if (response.ok) {
          const data = await response.json();
          setCenters(data.centers || []);
          setFiltered(data.centers || []);
        }
      } catch (error) {
        console.error('Failed to load enrichment data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Apply filters
  useEffect(() => {
    let result = centers;

    // Search filter
    if (searchTerm) {
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.facilityType?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Confidence filter
    if (selectedConfidence !== 'all') {
      result = result.filter((c) => c.confidence === selectedConfidence);
    }

    // Activity filter
    if (selectedActivity !== 'all') {
      result = result.filter((c) => c.activityLevel === selectedActivity);
    }

    setFiltered(result);
  }, [centers, searchTerm, selectedConfidence, selectedActivity]);

  const refreshEnrichment = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/enrichment/refresh', { method: 'POST' });
      if (response.ok) {
        const data = await response.json();
        setCenters(data.centers || []);
      }
    } catch (error) {
      console.error('Failed to refresh enrichment:', error);
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = () => {
    const csv = [
      ['Name', 'Rating', 'Sentiment', 'Facility Type', 'Activity', 'Confidence'].join(','),
      ...filtered.map((c) =>
        [
          c.name,
          c.googleRating || '',
          c.sentimentScore || '',
          c.facilityType || '',
          c.activityLevel || '',
          c.confidence || '',
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `enrichment-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-slate-950 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Service Center Intelligence</h1>
          <p className="text-slate-400 mt-1">
            {filtered.length} centers with enrichment data
          </p>
        </div>
        <button
          onClick={refreshEnrichment}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white rounded-lg font-medium transition"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="space-y-4">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search service centers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>
          <button
            onClick={downloadReport}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white rounded-lg font-medium flex items-center gap-2 transition"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>

        {/* Filters */}
        <EnrichmentFilters
          selectedConfidence={selectedConfidence}
          onConfidenceChange={setSelectedConfidence}
          selectedActivity={selectedActivity}
          onActivityChange={setSelectedActivity}
        />
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-slate-400">Loading enrichment data...</div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-slate-400">No service centers match your filters</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((center) => (
            <EnrichmentCard key={center.id} data={center} serviceName={center.name} />
          ))}
        </div>
      )}
    </div>
  );
}
