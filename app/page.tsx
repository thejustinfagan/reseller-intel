'use client';

import { useState, useEffect } from 'react';
import { Search, X, ExternalLink, MapPin, Phone, Building2, Truck, Star } from 'lucide-react';

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
  parts_capabilities: string[];
  service_capabilities: string[];
  vehicle_types: string[];
  ai_analyzed_at: string | null;
  satellite_image_url: string | null;
  visual_analyzed_at: string | null;
  facility_size_acres: number | null;
  building_count: number | null;
  bay_count: number | null;
  trucks_visible: number | null;
  cleanliness_score: number | null;
  building_condition: number | null;
  place_id: string | null;
}

export default function ResellerIntelDashboard() {
  const [companies, setCompanies] = useState<Company[]>([]);
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
      params.set('limit', '200');
      
      const res = await fetch(`/api/companies?${params}`);
      const data = await res.json();
      
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
    if (score >= 80) return 'bg-green-600 text-white';
    if (score >= 50) return 'bg-yellow-600 text-white';
    if (score >= 0) return 'bg-orange-600 text-white';
    return 'bg-red-600 text-white';
  }

  function getGradeLetter(score: number) {
    if (score >= 90) return 'A+';
    if (score >= 80) return 'A';
    if (score >= 70) return 'B';
    if (score >= 60) return 'C';
    if (score >= 50) return 'D';
    return 'F';
  }

  function getFacilityImageUrl(placeId: string | null): string | null {
    if (!placeId) return null;
    return `/api/facility-image/${placeId}`;
  }

  function getCleanlinessLabel(score: number | null): string {
    if (!score) return '—';
    if (score >= 8) return '✨ Excellent';
    if (score >= 6) return '✓ Good';
    if (score >= 4) return '⚠ Fair';
    return '✗ Poor';
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-xl font-bold text-gray-900">Reseller Intel</h1>
            <span className="text-sm text-gray-500">{totalCount.toLocaleString()} companies</span>
          </div>
          
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

      {/* Dense Table */}
      <div className="overflow-x-auto">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : companies.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No companies found</div>
        ) : (
          <table className="w-full text-sm border-collapse">
            <thead className="bg-gray-100 sticky top-[73px] z-5">
              <tr className="border-b border-gray-300">
                <th className="text-left p-3 font-semibold text-gray-700">Visual</th>
                <th className="text-left p-3 font-semibold text-gray-700">Grade</th>
                <th className="text-left p-3 font-semibold text-gray-700">Company</th>
                <th className="text-left p-3 font-semibold text-gray-700">Location</th>
                <th className="text-left p-3 font-semibold text-gray-700">Facility</th>
                <th className="text-left p-3 font-semibold text-gray-700">Brands</th>
                <th className="text-left p-3 font-semibold text-gray-700">Capabilities</th>
                <th className="text-left p-3 font-semibold text-gray-700">Vehicle Types</th>
                <th className="text-left p-3 font-semibold text-gray-700">Contact</th>
              </tr>
            </thead>
            <tbody>
              {companies.map((company) => {
                const imageUrl = getFacilityImageUrl(company.place_id);
                return (
                  <tr key={company.id} className="border-b border-gray-200 hover:bg-blue-50">
                    {/* Visual */}
                    <td className="p-3">
                      {imageUrl && company.visual_analyzed_at ? (
                        <img 
                          src={imageUrl} 
                          alt={company.company_name}
                          className="w-24 h-24 object-cover rounded border border-gray-300"
                        />
                      ) : (
                        <div className="w-24 h-24 bg-gray-200 rounded flex items-center justify-center text-gray-400 text-xs">
                          No Image
                        </div>
                      )}
                    </td>

                    {/* Grade */}
                    <td className="p-3">
                      {company.ai_analyzed_at ? (
                        <span className={`inline-block px-2 py-1 text-xs font-bold rounded ${getGradeColor(company.confidence_score)}`}>
                          {getGradeLetter(company.confidence_score)}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs">—</span>
                      )}
                    </td>

                    {/* Company */}
                    <td className="p-3">
                      <div className="font-semibold text-gray-900 max-w-xs">{company.company_name}</div>
                      {company.company_detail_url && (
                        <a
                          href={company.company_detail_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline text-xs inline-flex items-center gap-1 mt-1"
                        >
                          Website <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </td>

                    {/* Location */}
                    <td className="p-3">
                      <div className="text-gray-900">{company.city}, {company.state}</div>
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                          `${company.company_name} ${company.city} ${company.state}`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline text-xs inline-flex items-center gap-1 mt-1"
                      >
                        <MapPin className="w-3 h-3" /> Map
                      </a>
                    </td>

                    {/* Facility Stats */}
                    <td className="p-3">
                      {company.visual_analyzed_at ? (
                        <div className="text-xs space-y-1">
                          {company.facility_size_acres && (
                            <div className="flex items-center gap-1">
                              <Building2 className="w-3 h-3 text-gray-500" />
                              <span>{company.facility_size_acres} acres</span>
                            </div>
                          )}
                          {company.bay_count && (
                            <div className="flex items-center gap-1">
                              <span className="text-gray-500">🏭</span>
                              <span>{company.bay_count} bays</span>
                            </div>
                          )}
                          {company.trucks_visible && (
                            <div className="flex items-center gap-1">
                              <Truck className="w-3 h-3 text-gray-500" />
                              <span>{company.trucks_visible} trucks</span>
                            </div>
                          )}
                          {company.cleanliness_score !== null && (
                            <div className="flex items-center gap-1">
                              <Star className="w-3 h-3 text-gray-500" />
                              <span>{getCleanlinessLabel(company.cleanliness_score)}</span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs">—</span>
                      )}
                    </td>

                    {/* Brands */}
                    <td className="p-3">
                      {company.brands_served && company.brands_served.length > 0 ? (
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {company.brands_served.slice(0, 5).map((brand, i) => (
                            <span key={i} className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded whitespace-nowrap">
                              {brand}
                            </span>
                          ))}
                          {company.brands_served.length > 5 && (
                            <span className="text-xs text-gray-500">+{company.brands_served.length - 5}</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs">—</span>
                      )}
                    </td>

                    {/* Capabilities */}
                    <td className="p-3">
                      {(company.parts_capabilities?.length > 0 || company.service_capabilities?.length > 0) ? (
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {[...(company.parts_capabilities || []), ...(company.service_capabilities || [])].slice(0, 4).map((cap, i) => (
                            <span key={i} className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded whitespace-nowrap">
                              {cap}
                            </span>
                          ))}
                          {(company.parts_capabilities?.length || 0) + (company.service_capabilities?.length || 0) > 4 && (
                            <span className="text-xs text-gray-500">
                              +{(company.parts_capabilities?.length || 0) + (company.service_capabilities?.length || 0) - 4}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs">—</span>
                      )}
                    </td>

                    {/* Vehicle Types */}
                    <td className="p-3">
                      {company.vehicle_types && company.vehicle_types.length > 0 ? (
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {company.vehicle_types.slice(0, 3).map((type, i) => (
                            <span key={i} className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs rounded whitespace-nowrap">
                              {type}
                            </span>
                          ))}
                          {company.vehicle_types.length > 3 && (
                            <span className="text-xs text-gray-500">+{company.vehicle_types.length - 3}</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs">—</span>
                      )}
                    </td>

                    {/* Contact */}
                    <td className="p-3">
                      {company.primary_phone ? (
                        <a
                          href={`tel:${company.primary_phone}`}
                          className="inline-flex items-center gap-1 text-blue-600 hover:underline text-xs"
                        >
                          <Phone className="w-3 h-3" />
                          {company.primary_phone}
                        </a>
                      ) : (
                        <span className="text-gray-400 text-xs">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
