'use client';

import { useState, useEffect } from 'react';

interface Company {
  id: number;
  company_name: string;
  city: string;
  state: string;
  primary_entity_type: string;
  confidence_score: number;
  confidence_label: string;
  brands_served: string[];
  parts_capabilities: string[];
  service_capabilities: string[];
  mobile_service: boolean;
  fleet_focus: boolean;
  dot_inspection: boolean;
  roadside_service: boolean;
  leasing_rental: boolean;
  used_truck_sales: boolean;
  new_truck_sales: boolean;
  evidence_snippets: string[];
  deep_analysis: any;
  company_detail_url: string;
}

interface Stats {
  total_enriched: number;
  total_reviewed: number;
  total_approved: number;
  total_flagged: number;
}

export default function ReviewPage() {
  const [company, setCompany] = useState<Company | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showFlagInput, setShowFlagInput] = useState(false);
  const [flagNote, setFlagNote] = useState('');
  const [showAnalysis, setShowAnalysis] = useState(false);

  useEffect(() => {
    loadNext();
    loadStats();
  }, []);

  async function loadStats() {
    try {
      const res = await fetch('/api/qa/stats');
      const data = await res.json();
      setStats(data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  }

  async function loadNext() {
    setLoading(true);
    setShowFlagInput(false);
    setFlagNote('');
    setShowAnalysis(false);
    
    try {
      const res = await fetch('/api/qa/next');
      const data = await res.json();
      setCompany(data.company);
    } catch (error) {
      console.error('Failed to load next company:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove() {
    if (!company) return;
    
    try {
      await fetch('/api/qa/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: company.id }),
      });
      
      loadNext();
      loadStats();
    } catch (error) {
      console.error('Failed to approve:', error);
    }
  }

  async function handleFlag() {
    if (!company) return;
    
    try {
      await fetch('/api/qa/flag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: company.id, note: flagNote }),
      });
      
      loadNext();
      loadStats();
    } catch (error) {
      console.error('Failed to flag:', error);
    }
  }

  async function handleSkip() {
    loadNext();
  }

  function getConfidenceBadgeColor(score: number) {
    if (score >= 80) return 'bg-green-600';
    if (score >= 50) return 'bg-yellow-600';
    return 'bg-red-600';
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-4">All Done! 🎉</h1>
          <p className="text-gray-400">No more unreviewed enriched records.</p>
          {stats && (
            <div className="mt-6 text-gray-300">
              <p>Reviewed: {stats.total_reviewed} / {stats.total_enriched}</p>
              <p>Approved: {stats.total_approved}</p>
              <p>Flagged: {stats.total_flagged}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  const services = [
    ...(company.parts_capabilities || []),
    ...(company.service_capabilities || []),
  ];

  const flags = [
    company.mobile_service && { label: 'Mobile Service', icon: '🚐' },
    company.fleet_focus && { label: 'Fleet Focus', icon: '🚛' },
    company.dot_inspection && { label: 'DOT Inspection', icon: '✅' },
    company.roadside_service && { label: 'Roadside Service', icon: '🛣️' },
    company.leasing_rental && { label: 'Leasing/Rental', icon: '📋' },
    company.used_truck_sales && { label: 'Used Truck Sales', icon: '🚚' },
    company.new_truck_sales && { label: 'New Truck Sales', icon: '✨' },
  ].filter(Boolean);

  return (
    <div className="min-h-screen bg-gray-900 text-white py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Progress */}
        {stats && (
          <div className="mb-6 text-center text-gray-400">
            {stats.total_reviewed} of {stats.total_enriched} reviewed
          </div>
        )}

        {/* Card */}
        <div className="bg-gray-800 rounded-lg shadow-xl border border-gray-700 p-6 space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-2xl font-bold mb-2">{company.company_name}</h1>
            <p className="text-gray-400">{company.city}, {company.state}</p>
            <p className="text-gray-400 mt-1">{company.primary_entity_type}</p>
            <div className="mt-3">
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getConfidenceBadgeColor(company.confidence_score)}`}>
                {company.confidence_score}% - {company.confidence_label}
              </span>
            </div>
          </div>

          {/* Brands */}
          <div>
            <h2 className="text-lg font-semibold mb-2">Brands Detected</h2>
            {company.brands_served && company.brands_served.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {company.brands_served.map((brand, i) => (
                  <span key={i} className="px-3 py-1 bg-blue-900 text-blue-200 rounded-full text-sm">
                    {brand}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">None detected</p>
            )}
          </div>

          {/* Services */}
          <div>
            <h2 className="text-lg font-semibold mb-2">Services</h2>
            {services.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {services.map((service, i) => (
                  <span key={i} className="px-3 py-1 bg-purple-900 text-purple-200 rounded-full text-sm">
                    {service}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">None detected</p>
            )}
          </div>

          {/* Flags */}
          {flags.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-2">Flags</h2>
              <div className="flex flex-wrap gap-2">
                {flags.map((flag: any, i) => (
                  <span key={i} className="px-3 py-1 bg-gray-700 text-gray-200 rounded-full text-sm">
                    {flag.icon} {flag.label}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Evidence Snippets */}
          <div>
            <h2 className="text-lg font-semibold mb-2">Evidence Snippets</h2>
            {company.evidence_snippets && company.evidence_snippets.length > 0 ? (
              <ul className="list-disc list-inside space-y-1 text-gray-300 text-sm">
                {company.evidence_snippets.map((snippet, i) => (
                  <li key={i}>{snippet}</li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500">No evidence provided</p>
            )}
          </div>

          {/* AI Analysis (collapsible) */}
          <div>
            <button
              onClick={() => setShowAnalysis(!showAnalysis)}
              className="flex items-center justify-between w-full text-left"
            >
              <h2 className="text-lg font-semibold">AI Analysis</h2>
              <span className="text-gray-400">{showAnalysis ? '▼' : '▶'}</span>
            </button>
            {showAnalysis && company.deep_analysis && (
              <pre className="mt-3 p-4 bg-gray-900 rounded text-xs text-gray-300 overflow-x-auto">
                {JSON.stringify(company.deep_analysis, null, 2)}
              </pre>
            )}
          </div>

          {/* Source Link */}
          {company.company_detail_url && (
            <div>
              <h2 className="text-lg font-semibold mb-2">Source</h2>
              <a
                href={company.company_detail_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 underline"
              >
                View Company Details →
              </a>
            </div>
          )}

          {/* Flag Input (conditional) */}
          {showFlagInput && (
            <div>
              <label className="block text-sm font-medium mb-2">Flag Note</label>
              <textarea
                value={flagNote}
                onChange={(e) => setFlagNote(e.target.value)}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                rows={3}
                placeholder="Why are you flagging this record?"
              />
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            {!showFlagInput ? (
              <>
                <button
                  onClick={handleApprove}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-6 rounded-md transition-colors"
                >
                  Approve
                </button>
                <button
                  onClick={() => setShowFlagInput(true)}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-3 px-6 rounded-md transition-colors"
                >
                  Flag
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleFlag}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-3 px-6 rounded-md transition-colors"
                >
                  Submit Flag
                </button>
                <button
                  onClick={() => setShowFlagInput(false)}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-medium py-3 px-6 rounded-md transition-colors"
                >
                  Cancel
                </button>
              </>
            )}
          </div>

          {/* Skip Button */}
          <div className="text-center">
            <button
              onClick={handleSkip}
              className="text-gray-400 hover:text-gray-300 text-sm underline"
            >
              Skip this one
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
