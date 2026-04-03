'use client';

import { useState, useEffect } from 'react';
import { Search, X, ExternalLink, MapPin, Phone, Globe } from 'lucide-react';

interface Company {
  id: number;
  company_name: string;
  city: string;
  state: string;
  zip_code: string;
  primary_phone: string;
  company_detail_url: string;
  primary_entity_type: string;
  confidence_score: number;
  confidence_label: string;
  brands_served: string[];
  vehicle_types: string[];
  parts_capabilities: string[];
  service_capabilities: string[];
  ai_analyzed_at: string | null;
  qa_approved: boolean;
  qa_flagged: boolean;
}

export default function ResellerIntelDashboard() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    loadCompanies();
  }, [search]);

  async function loadCompanies() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      params.set('limit', '100');
      
      const res = await fetch(`/api/companies?${params}`);
      const data = await res.json();
      
      // Parse JSON fields
      const parsedCompanies = (data.companies || []).map((c: any) => ({
        ...c,
        brands_served: parseJSON(c.brands_served),
        vehicle_types: parseJSON(c.vehicle_types),
        parts_capabilities: parseJSON(c.parts_capabilities),
        service_capabilities: parseJSON(c.service_capabilities),
      }));
      
      setCompanies(parsedCompanies);
      setTotalCount(data.total || parsedCompanies.length);
    } catch (error) {
      console.error('Failed to load companies:', error);
    } finally {
      setLoading(false);
    }
  }

  function parseJSON(value: any): any[] {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    try {
      return JSON.parse(value);
    } catch {
      return [];
    }
  }

  function getGradeColor(score: number) {
    if (score >= 80) return 'text-green-600 bg-green-50';
    if (score >= 50) return 'text-yellow-600 bg-yellow-50';
    if (score >= 0) return 'text-orange-600 bg-orange-50';
    return 'text-red-600 bg-red-50';
  }

  function getGradeLetter(score: number) {
    if (score >= 90) return 'A+';
    if (score >= 80) return 'A';
    if (score >= 70) return 'B';
    if (score >= 60) return 'C';
    if (score >= 50) return 'D';
    return 'F';
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-xl font-bold text-gray-900">Reseller Intel</h1>
            <span className="text-sm text-gray-500">{totalCount.toLocaleString()} companies</span>
          </div>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, city, brand..."
              className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Main Table */}
        <div className={`flex-1 overflow-auto ${selectedCompany ? 'hidden md:block md:w-1/2' : 'w-full'}`}>
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading...</div>
          ) : companies.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No companies found</div>
          ) : (
            <div className="divide-y divide-gray-200">
              {companies.map((company) => (
                <button
                  key={company.id}
                  onClick={() => setSelectedCompany(company)}
                  className={`w-full text-left p-4 hover:bg-gray-50 transition-colors ${
                    selectedCompany?.id === company.id ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900 truncate">{company.company_name}</h3>
                        {company.ai_analyzed_at && (
                          <span className={`px-2 py-0.5 text-xs font-bold rounded ${getGradeColor(company.confidence_score)}`}>
                            {getGradeLetter(company.confidence_score)}
                          </span>
                        )}
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-2">
                        {company.city}, {company.state}
                        {company.primary_entity_type && ` • ${company.primary_entity_type}`}
                      </p>
                      
                      {company.brands_served && company.brands_served.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {company.brands_served.slice(0, 3).map((brand, i) => (
                            <span key={i} className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">
                              {brand}
                            </span>
                          ))}
                          {company.brands_served.length > 3 && (
                            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                              +{company.brands_served.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    
                    {company.vehicle_types && company.vehicle_types.length > 0 && (
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        {company.vehicle_types.slice(0, 2).map((type, i) => (
                          <span key={i} className="text-xs text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">{type}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Reading Pane */}
        {selectedCompany && (
          <div className="fixed inset-0 md:relative md:w-1/2 bg-white border-l border-gray-200 overflow-auto z-20">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Company Details</h2>
              <button
                onClick={() => setSelectedCompany(null)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-4 space-y-6">
              {/* Header */}
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">{selectedCompany.company_name}</h1>
                <div className="flex flex-wrap gap-2 mb-4">
                  {selectedCompany.ai_analyzed_at && (
                    <span className={`px-3 py-1 text-sm font-bold rounded ${getGradeColor(selectedCompany.confidence_score)}`}>
                      Grade: {getGradeLetter(selectedCompany.confidence_score)} ({selectedCompany.confidence_score}%)
                    </span>
                  )}
                  {selectedCompany.qa_approved && (
                    <span className="px-3 py-1 bg-green-100 text-green-700 text-sm rounded">✓ Approved</span>
                  )}
                  {selectedCompany.qa_flagged && (
                    <span className="px-3 py-1 bg-red-100 text-red-700 text-sm rounded">⚠ Flagged</span>
                  )}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex flex-wrap gap-2">
                {selectedCompany.primary_phone && (
                  <a
                    href={`tel:${selectedCompany.primary_phone}`}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
                  >
                    <Phone className="w-4 h-4" />
                    Call
                  </a>
                )}
                {selectedCompany.company_detail_url && (
                  <a
                    href={selectedCompany.company_detail_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg text-sm font-medium hover:bg-gray-700"
                  >
                    <Globe className="w-4 h-4" />
                    Website
                  </a>
                )}
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                    `${selectedCompany.company_name} ${selectedCompany.city} ${selectedCompany.state}`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700"
                >
                  <MapPin className="w-4 h-4" />
                  Map
                </a>
              </div>

              {/* Contact Info */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Contact</h3>
                <div className="space-y-1 text-sm text-gray-600">
                  <p>{selectedCompany.city}, {selectedCompany.state} {selectedCompany.zip_code}</p>
                  {selectedCompany.primary_phone && <p>{selectedCompany.primary_phone}</p>}
                  {selectedCompany.primary_entity_type && <p>{selectedCompany.primary_entity_type}</p>}
                </div>
              </div>

              {/* Brands */}
              {selectedCompany.brands_served && selectedCompany.brands_served.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Brands Served</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedCompany.brands_served.map((brand, i) => (
                      <span key={i} className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded">
                        {brand}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Services */}
              {(selectedCompany.parts_capabilities?.length > 0 || selectedCompany.service_capabilities?.length > 0) && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Capabilities</h3>
                  <div className="flex flex-wrap gap-2">
                    {[...(selectedCompany.parts_capabilities || []), ...(selectedCompany.service_capabilities || [])].map((cap, i) => (
                      <span key={i} className="px-3 py-1 bg-purple-100 text-purple-700 text-sm rounded">
                        {cap}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Vehicle Types */}
              {selectedCompany.vehicle_types && selectedCompany.vehicle_types.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Vehicle Types</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedCompany.vehicle_types.map((type, i) => (
                      <span key={i} className="px-3 py-1 bg-indigo-100 text-indigo-700 text-sm rounded">{type}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
