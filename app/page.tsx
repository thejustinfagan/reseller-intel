'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Search, Download, MapPin, Phone, Globe, Building2, Map as MapIcon, X } from 'lucide-react';

interface Company {
  id: number;
  company_name: string;
  normalized_name: string;
  full_address: string;
  city: string;
  state: string;
  zip_code: string;
  primary_phone: string;
  secondary_phone?: string;
  company_detail_url?: string;
  input_service_type: string;
  input_sub_service_type?: string;
  features?: string;
}

interface Filters {
  search: string;
  state: string;
  subServiceType: string;
}

interface OemDealer {
  id: number;
  company_name: string;
  address: string;
  city: string;
  state: string;
  zip: string | null;
  phone: string | null;
  website: string | null;
  dealer_type: string | null;
  brand: string | null;
  latitude: number | null;
  longitude: number | null;
  scraped_at: string | null;
}

interface OemFilters {
  search: string;
  state: string;
  brand: string;
}

interface OemBrandSummary {
  brand: string;
  count: number;
}

interface FeedbackMessage {
  type: 'success' | 'error';
  message: string;
}

interface MapsImageryResponse {
  location: string;
  interactiveSatelliteUrl: string;
  interactiveStreetViewUrl: string;
  satelliteStaticUrl?: string;
  streetViewStaticUrl?: string;
  satelliteEmbedUrl?: string;
  streetViewEmbedUrl?: string;
  openStreetMapUrl?: string;
  usesApiKey: boolean;
}

const ZIP_SEARCH_PATTERN = /^\d{5}$/;
const DEFAULT_RADIUS_MILES = 50;
const DEFAULT_PAGE_SIZE = 50;
const OEM_EXPORT_LIMIT = 5000;

export default function ResellerIntel() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [draftFilters, setDraftFilters] = useState<Filters>({
    search: '',
    state: '',
    subServiceType: ''
  });
  const [appliedFilters, setAppliedFilters] = useState<Filters>({
    search: '',
    state: '',
    subServiceType: ''
  });
  const [radiusMiles, setRadiusMiles] = useState(DEFAULT_RADIUS_MILES);
  const [appliedRadiusMiles, setAppliedRadiusMiles] = useState(DEFAULT_RADIUS_MILES);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [stateOptions, setStateOptions] = useState<string[]>([]);
  const [subServiceTypeOptions, setSubServiceTypeOptions] = useState<string[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [exportFeedback, setExportFeedback] = useState<FeedbackMessage | null>(null);
  const [oemDealers, setOemDealers] = useState<OemDealer[]>([]);
  const [oemLoading, setOemLoading] = useState(true);
  const [oemError, setOemError] = useState<string | null>(null);
  const [oemDraftFilters, setOemDraftFilters] = useState<OemFilters>({
    search: '',
    state: '',
    brand: ''
  });
  const [oemAppliedFilters, setOemAppliedFilters] = useState<OemFilters>({
    search: '',
    state: '',
    brand: ''
  });
  const [oemCurrentPage, setOemCurrentPage] = useState(1);
  const [oemTotalPages, setOemTotalPages] = useState(1);
  const [oemTotalCount, setOemTotalCount] = useState(0);
  const [oemBrandOptions, setOemBrandOptions] = useState<OemBrandSummary[]>([]);
  const [oemIsExporting, setOemIsExporting] = useState(false);
  const [oemExportFeedback, setOemExportFeedback] = useState<FeedbackMessage | null>(null);

  // Map state
  const [showMapModal, setShowMapModal] = useState(false);
  const [mapData, setMapData] = useState<MapsImageryResponse | null>(null);
  const [loadingMap, setLoadingMap] = useState(false);

  useEffect(() => {
    fetchCompanies();
  }, [appliedFilters, appliedRadiusMiles, currentPage]);

  useEffect(() => {
    fetchOemDealers();
  }, [oemAppliedFilters, oemCurrentPage]);

  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const response = await fetch('/api/filters');
        if (!response.ok) {
          throw new Error(`Failed to fetch filters: ${response.status}`);
        }
        const data = await response.json();
        setStateOptions(data.states || []);
        setSubServiceTypeOptions(data.subServiceTypes || []);
      } catch (error) {
        console.error('Failed to fetch filters:', error);
        setStateOptions([]);
        setSubServiceTypeOptions([]);
      }
    };

    fetchFilters();
  }, []);

  const buildFilterParams = (activeFilters: Filters, activeRadiusMiles: number) => {
    const params = new URLSearchParams();
    const trimmedSearch = activeFilters.search.trim();

    if (ZIP_SEARCH_PATTERN.test(trimmedSearch)) {
      params.append('nearZip', trimmedSearch);
      params.append('radiusMiles', String(activeRadiusMiles));
    } else if (trimmedSearch) {
      params.append('search', trimmedSearch);
    }

    if (activeFilters.state) {
      params.append('state', activeFilters.state);
    }

    if (activeFilters.subServiceType) {
      params.append('subServiceType', activeFilters.subServiceType);
    }

    return params;
  };

  const buildOemFilterParams = (activeFilters: OemFilters) => {
    const params = new URLSearchParams();
    const trimmedSearch = activeFilters.search.trim();

    if (trimmedSearch) {
      params.append('search', trimmedSearch);
    }

    if (activeFilters.state) {
      params.append('state', activeFilters.state);
    }

    if (activeFilters.brand) {
      params.append('brand', activeFilters.brand);
    }

    return params;
  };

  const applyDraftFilters = () => {
    const nextRadius = Number.isFinite(radiusMiles) && radiusMiles > 0
      ? Math.round(radiusMiles)
      : DEFAULT_RADIUS_MILES;

    setRadiusMiles(nextRadius);
    setAppliedRadiusMiles(nextRadius);
    setAppliedFilters({ ...draftFilters });
    setExportFeedback(null);
    setCurrentPage(1);
  };

  const applyOemDraftFilters = () => {
    setOemAppliedFilters({ ...oemDraftFilters });
    setOemExportFeedback(null);
    setOemCurrentPage(1);
  };

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    applyDraftFilters();
  };

  const handleOemSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    applyOemDraftFilters();
  };

  const handleDraftFilterChange = (key: keyof Filters, value: string) => {
    setDraftFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleOemDraftFilterChange = (key: keyof OemFilters, value: string) => {
    setOemDraftFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleRadiusChange = (value: string) => {
    const parsed = Number.parseInt(value, 10);
    setRadiusMiles(Number.isFinite(parsed) ? parsed : 0);
  };

  const fetchCompanies = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = buildFilterParams(appliedFilters, appliedRadiusMiles);
      params.append('page', currentPage.toString());
      params.append('limit', DEFAULT_PAGE_SIZE.toString());
      const response = await fetch(`/api/companies?${params}`);

      if (!response.ok) {
        let errorMessage = `API request failed: ${response.status} ${response.statusText}`;
        try {
          const errorData = await response.json();
          if (typeof errorData?.error === 'string' && errorData.error.trim()) {
            errorMessage = errorData.error;
          }
        } catch {
          // Keep fallback error message when response body is not JSON.
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();

      setCompanies(data.companies || []);
      setTotalPages(data.pagination?.totalPages || data.totalPages || 1);
      setTotalCount(data.pagination?.totalCount || data.totalCount || 0);
    } catch (error: unknown) {
      console.error('Failed to fetch companies:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch companies';
      setError(errorMessage);
      setCompanies([]);
      setTotalPages(1);
      setTotalCount(0);
    }
    setLoading(false);
  };

  const fetchOemDealers = async () => {
    setOemLoading(true);
    setOemError(null);
    try {
      const params = buildOemFilterParams(oemAppliedFilters);
      params.append('page', oemCurrentPage.toString());
      params.append('limit', DEFAULT_PAGE_SIZE.toString());
      const response = await fetch(`/api/oem-dealers?${params.toString()}`);

      if (!response.ok) {
        let errorMessage = `OEM API request failed: ${response.status} ${response.statusText}`;
        try {
          const errorData = await response.json();
          if (typeof errorData?.error === 'string' && errorData.error.trim()) {
            errorMessage = errorData.error;
          }
        } catch {
          // Keep fallback error message when response body is not JSON.
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      setOemDealers(data.dealers || []);
      setOemBrandOptions(data.brands || []);
      setOemTotalPages(data.pagination?.totalPages || 1);
      setOemTotalCount(data.pagination?.totalCount || 0);
    } catch (error: unknown) {
      console.error('Failed to fetch OEM dealers:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch OEM dealers';
      setOemError(errorMessage);
      setOemDealers([]);
      setOemTotalPages(1);
      setOemTotalCount(0);
      setOemBrandOptions([]);
    } finally {
      setOemLoading(false);
    }
  };

  const exportCompanies = async () => {
    if (isExporting) {
      return;
    }

    setIsExporting(true);
    setExportFeedback(null);

    try {
      const params = buildFilterParams(appliedFilters, appliedRadiusMiles);
      const response = await fetch(`/api/companies/export?${params.toString()}`);
      if (!response.ok) {
        let errorMessage = `Export failed: ${response.status} ${response.statusText}`;

        try {
          const errorData = await response.json();
          if (typeof errorData?.error === 'string' && errorData.error.trim()) {
            errorMessage = errorData.error;
          }
        } catch {
          // Keep fallback error when body is not JSON.
        }

        throw new Error(errorMessage);
      }

      const blob = await response.blob();
      const contentDisposition = response.headers.get('content-disposition');
      const filenameFromHeader = contentDisposition?.match(/filename="?([^"]+)"?/i)?.[1];
      const fallbackFilename = `reseller-intel-export-${new Date().toISOString().split('T')[0]}.csv`;
      const filename = filenameFromHeader || fallbackFilename;
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setExportFeedback({
        type: 'success',
        message: `Export complete. Downloaded ${filename} using the currently applied filters.`
      });
    } catch (error: unknown) {
      console.error('Export failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to export companies';
      setExportFeedback({
        type: 'error',
        message: errorMessage
      });
    } finally {
      setIsExporting(false);
    }
  };

  const exportOemDealers = async () => {
    if (oemIsExporting) {
      return;
    }

    setOemIsExporting(true);
    setOemExportFeedback(null);

    try {
      const params = buildOemFilterParams(oemAppliedFilters);
      params.append('limit', OEM_EXPORT_LIMIT.toString());
      const response = await fetch(`/api/oem-dealers/export?${params.toString()}`);
      if (!response.ok) {
        let errorMessage = `OEM export failed: ${response.status} ${response.statusText}`;

        try {
          const errorData = await response.json();
          if (typeof errorData?.error === 'string' && errorData.error.trim()) {
            errorMessage = errorData.error;
          }
        } catch {
          // Keep fallback error when body is not JSON.
        }

        throw new Error(errorMessage);
      }

      const blob = await response.blob();
      const contentDisposition = response.headers.get('content-disposition');
      const filenameFromHeader = contentDisposition?.match(/filename="?([^"]+)"?/i)?.[1];
      const fallbackFilename = `oem-dealers-export-${new Date().toISOString().split('T')[0]}.csv`;
      const filename = filenameFromHeader || fallbackFilename;
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setOemExportFeedback({
        type: 'success',
        message: `Export complete. Downloaded ${filename} using the currently applied OEM filters.`
      });
    } catch (error: unknown) {
      console.error('OEM export failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to export OEM dealers';
      setOemExportFeedback({
        type: 'error',
        message: errorMessage
      });
    } finally {
      setOemIsExporting(false);
    }
  };

  const toWebsiteHref = (website: string) => {
    if (website.startsWith('http://') || website.startsWith('https://')) {
      return website;
    }

    return `https://${website}`;
  };

  const fetchMapData = async (address: string) => {
    setLoadingMap(true);
    try {
      const response = await fetch(`/api/maps/imagery?location=${encodeURIComponent(address)}`);
      if (!response.ok) {
        throw new Error('Failed to fetch map data');
      }
      const data = await response.json();
      setMapData(data);
      setShowMapModal(true);
    } catch (error) {
      console.error('Failed to fetch map data:', error);
      alert('Failed to load map. Please try again.');
    } finally {
      setLoadingMap(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Building2 className="h-8 w-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Reseller Intel
              </h1>
            </div>
            <div className="flex items-center space-x-3">
              <span className="text-sm text-gray-600 dark:text-gray-300">
                {loading ? 'Loading service centers…' : `${totalCount.toLocaleString()} service centers`}
              </span>
              <div className="flex flex-col items-end">
                <button
                  onClick={exportCompanies}
                  disabled={isExporting}
                  className="btn-primary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Download className="h-4 w-4" />
                  <span>{isExporting ? 'Exporting...' : 'Export Filtered CSV'}</span>
                </button>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Uses currently applied filters. Export status: {isExporting ? 'Exporting' : 'Idle'}.
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {exportFeedback && (
          <div
            role={exportFeedback.type === 'error' ? 'alert' : 'status'}
            aria-live="polite"
            className={`mb-4 rounded-md border px-4 py-3 text-sm ${
              exportFeedback.type === 'success'
                ? 'border-green-200 bg-green-50 text-green-800 dark:border-green-700 dark:bg-green-900/30 dark:text-green-300'
                : 'border-red-200 bg-red-50 text-red-800 dark:border-red-700 dark:bg-red-900/30 dark:text-red-300'
            }`}
          >
            {exportFeedback.message}
          </div>
        )}

        {/* Filters */}
        <div className="card p-4 mb-6">
          <form onSubmit={handleSearchSubmit}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4 items-end">
              <div className="sm:col-span-2 lg:col-span-4 min-w-0">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Search Companies or ZIP
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Company name, city, or 5-digit ZIP"
                    className="input-field pl-10 w-full"
                    value={draftFilters.search}
                    onChange={(e) => handleDraftFilterChange('search', e.target.value)}
                  />
                </div>
              </div>

              <div className="lg:col-span-2 min-w-0">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  State
                </label>
                <select
                  className="input-field w-full"
                  value={draftFilters.state}
                  onChange={(e) => handleDraftFilterChange('state', e.target.value)}
                >
                  <option value="">All States</option>
                  {stateOptions.map((state) => (
                    <option key={state} value={state}>
                      {state}
                    </option>
                  ))}
                </select>
              </div>

              <div className="lg:col-span-3 min-w-0">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Sub-Service Type
                </label>
                <select
                  className="input-field w-full"
                  value={draftFilters.subServiceType}
                  onChange={(e) => handleDraftFilterChange('subServiceType', e.target.value)}
                >
                  <option value="">All Sub-Types</option>
                  {subServiceTypeOptions.map((subType) => (
                    <option key={subType} value={subType}>
                      {subType}
                    </option>
                  ))}
                </select>
              </div>

              <div className="lg:col-span-1 min-w-0">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Radius (mi)
                </label>
                <input
                  type="number"
                  min={1}
                  step={1}
                  className="input-field w-full"
                  value={radiusMiles}
                  onChange={(e) => handleRadiusChange(e.target.value)}
                />
              </div>

              <div className="sm:col-span-2 lg:col-span-2 min-w-0">
                <button
                  type="submit"
                  className="btn-primary w-full flex items-center justify-center space-x-2"
                >
                  <Search className="h-4 w-4" />
                  <span>Search</span>
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Results */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Companies List */}
          <div className="lg:col-span-2">
            <div className="card">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {loading ? 'Service Centers (loading...)' : `Service Centers (${totalCount.toLocaleString()})`}
                </h2>
              </div>
              
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {loading ? (
                  <div className="p-8 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-2 text-gray-500">Loading companies...</p>
                  </div>
                ) : error ? (
                  <div className="p-8 text-center">
                    <div className="text-red-500 mb-4">
                      <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.732 15.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Error Loading Data</h3>
                    <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
                    <button
                      onClick={() => {
                        setError(null);
                        fetchCompanies();
                      }}
                      className="btn-primary"
                    >
                      Try Again
                    </button>
                    <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900 rounded border-l-4 border-blue-500 text-sm">
                      <strong>Debug Info:</strong> API Test Page: <a href="/test" className="text-blue-600 underline">Click here</a> to verify data access
                    </div>
                  </div>
                ) : companies.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    No companies found matching your criteria.
                  </div>
                ) : (
                  companies.map((company) => (
                    <div
                      key={company.id}
                      className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <div 
                        className="cursor-pointer"
                        onClick={() => setSelectedCompany(company)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white truncate">
                              {company.company_name}
                            </h3>
                            <div className="mt-1 flex items-center text-sm text-gray-500">
                              <MapPin className="h-4 w-4 mr-1" />
                              <span>{company.city}, {company.state}</span>
                            </div>
                            <div className="mt-1 flex items-center text-sm text-gray-500">
                              <Building2 className="h-4 w-4 mr-1" />
                              <span>{company.input_service_type}</span>
                              {company.input_sub_service_type && (
                                <span> • {company.input_sub_service_type}</span>
                              )}
                            </div>
                          </div>
                          <div className="ml-4 flex-shrink-0">
                            {company.primary_phone && (
                              <div className="flex items-center text-sm text-gray-500">
                                <Phone className="h-4 w-4 mr-1" />
                                <span>{company.primary_phone}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      {/* Map button directly on card */}
                      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            fetchMapData(company.full_address);
                          }}
                          className="w-full sm:w-auto btn-secondary text-sm flex items-center justify-center"
                        >
                          <MapIcon className="h-4 w-4 mr-2" />
                          View Map
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-500">
                      Page {currentPage} of {totalPages}
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                        className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Company Detail Panel */}
          <div className="lg:col-span-1">
            <div className="card sticky top-6">
              {selectedCompany ? (
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    {selectedCompany.company_name}
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Address
                      </label>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {selectedCompany.full_address}
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Service Type
                      </label>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {selectedCompany.input_service_type}
                        {selectedCompany.input_sub_service_type && (
                          <> • {selectedCompany.input_sub_service_type}</>
                        )}
                      </p>
                    </div>

                    {selectedCompany.primary_phone && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Primary Phone
                        </label>
                        <a
                          href={`tel:${selectedCompany.primary_phone}`}
                          className="text-sm text-blue-600 hover:text-blue-800"
                        >
                          {selectedCompany.primary_phone}
                        </a>
                      </div>
                    )}

                    {selectedCompany.secondary_phone && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Secondary Phone
                        </label>
                        <a
                          href={`tel:${selectedCompany.secondary_phone}`}
                          className="text-sm text-blue-600 hover:text-blue-800"
                        >
                          {selectedCompany.secondary_phone}
                        </a>
                      </div>
                    )}

                    {selectedCompany.company_detail_url && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Website
                        </label>
                        <a
                          href={selectedCompany.company_detail_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                        >
                          <Globe className="h-4 w-4 mr-1" />
                          View Details
                        </a>
                      </div>
                    )}

                    {selectedCompany.features && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Features
                        </label>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {selectedCompany.features}
                        </p>
                      </div>
                    )}

                    {/* View Map Button */}
                    <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                      <button
                        onClick={() => fetchMapData(selectedCompany.full_address)}
                        disabled={loadingMap}
                        className="w-full btn-primary flex items-center justify-center"
                      >
                        <MapIcon className="h-4 w-4 mr-2" />
                        {loadingMap ? 'Loading Map...' : 'View Map'}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-6 text-center text-gray-500">
                  <Building2 className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>Select a company to view details</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* OEM Dealers */}
        <div className="mt-8">
          <div className="card">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  OEM Dealers
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {oemLoading ? 'Loading OEM dealers…' : `${oemTotalCount.toLocaleString()} OEM dealers`}
                </p>
              </div>
              <div className="flex flex-col items-start sm:items-end">
                <button
                  onClick={exportOemDealers}
                  disabled={oemIsExporting}
                  className="btn-primary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Download className="h-4 w-4" />
                  <span>{oemIsExporting ? 'Exporting...' : 'Export OEM CSV'}</span>
                </button>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Uses currently applied OEM filters. Export status: {oemIsExporting ? 'Exporting' : 'Idle'}.
                </p>
              </div>
            </div>

            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <form onSubmit={handleOemSearchSubmit}>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4 items-end">
                  <div className="sm:col-span-2 lg:col-span-5 min-w-0">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Search Dealers
                    </label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Company, city, or address"
                        className="input-field pl-10 w-full"
                        value={oemDraftFilters.search}
                        onChange={(e) => handleOemDraftFilterChange('search', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="lg:col-span-3 min-w-0">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Brand
                    </label>
                    <select
                      className="input-field w-full"
                      value={oemDraftFilters.brand}
                      onChange={(e) => handleOemDraftFilterChange('brand', e.target.value)}
                    >
                      <option value="">All Brands</option>
                      {oemBrandOptions.map((brandOption) => (
                        <option key={brandOption.brand} value={brandOption.brand}>
                          {brandOption.brand} ({brandOption.count.toLocaleString()})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="lg:col-span-2 min-w-0">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      State
                    </label>
                    <select
                      className="input-field w-full"
                      value={oemDraftFilters.state}
                      onChange={(e) => handleOemDraftFilterChange('state', e.target.value)}
                    >
                      <option value="">All States</option>
                      {stateOptions.map((state) => (
                        <option key={`oem-${state}`} value={state}>
                          {state}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-2 lg:col-span-2 min-w-0">
                    <button
                      type="submit"
                      className="btn-primary w-full flex items-center justify-center space-x-2"
                    >
                      <Search className="h-4 w-4" />
                      <span>Search</span>
                    </button>
                  </div>
                </div>
              </form>

              {oemExportFeedback && (
                <div
                  role={oemExportFeedback.type === 'error' ? 'alert' : 'status'}
                  aria-live="polite"
                  className={`mt-4 rounded-md border px-4 py-3 text-sm ${
                    oemExportFeedback.type === 'success'
                      ? 'border-green-200 bg-green-50 text-green-800 dark:border-green-700 dark:bg-green-900/30 dark:text-green-300'
                      : 'border-red-200 bg-red-50 text-red-800 dark:border-red-700 dark:bg-red-900/30 dark:text-red-300'
                  }`}
                >
                  {oemExportFeedback.message}
                </div>
              )}
            </div>

            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {oemLoading ? (
                <div className="p-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-gray-500">Loading OEM dealers...</p>
                </div>
              ) : oemError ? (
                <div className="p-8 text-center">
                  <div className="text-red-500 mb-4">
                    <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.732 15.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Error Loading OEM Dealers</h3>
                  <p className="text-red-600 dark:text-red-400 mb-4">{oemError}</p>
                  <button
                    onClick={() => {
                      setOemError(null);
                      fetchOemDealers();
                    }}
                    className="btn-primary"
                  >
                    Try Again
                  </button>
                </div>
              ) : oemDealers.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  No OEM dealers found matching your criteria.
                </div>
              ) : (
                oemDealers.map((dealer) => (
                  <div key={dealer.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white truncate">
                          {dealer.company_name}
                        </h3>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-gray-500">
                          <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-0.5 font-medium text-gray-700 dark:bg-gray-600 dark:text-gray-100">
                            {dealer.brand || 'Unknown Brand'}
                          </span>
                          {dealer.dealer_type && <span>{dealer.dealer_type}</span>}
                        </div>
                        <div className="mt-1 flex items-center text-sm text-gray-500">
                          <MapPin className="h-4 w-4 mr-1" />
                          <span>
                            {dealer.city}, {dealer.state}
                            {dealer.zip ? ` ${dealer.zip}` : ''}
                          </span>
                        </div>
                      </div>
                      <div className="shrink-0 text-right space-y-1">
                        {dealer.phone && (
                          <div className="flex items-center justify-end text-sm text-gray-500">
                            <Phone className="h-4 w-4 mr-1" />
                            <span>{dealer.phone}</span>
                          </div>
                        )}
                        {dealer.website && (
                          <a
                            href={toWebsiteHref(dealer.website)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
                          >
                            <Globe className="h-4 w-4 mr-1" />
                            Website
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {oemTotalPages > 1 && (
              <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-500">
                    Page {oemCurrentPage} of {oemTotalPages}
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setOemCurrentPage((prev) => Math.max(1, prev - 1))}
                      disabled={oemCurrentPage === 1}
                      className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setOemCurrentPage((prev) => Math.min(oemTotalPages, prev + 1))}
                      disabled={oemCurrentPage === oemTotalPages}
                      className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Map Modal */}
      {showMapModal && mapData && (
        <div className="fixed inset-0 z-50 overflow-y-auto" onClick={() => setShowMapModal(false)}>
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="fixed inset-0 bg-black bg-opacity-50" />
            
            <div 
              className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    <MapIcon className="inline h-5 w-5 mr-2" />
                    Map View: {mapData.location}
                  </h3>
                  <button
                    onClick={() => setShowMapModal(false)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                {/* Embedded Maps */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Satellite View */}
                  {mapData.satelliteEmbedUrl && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Satellite View
                      </label>
                      <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-600">
                        <iframe
                          src={mapData.satelliteEmbedUrl}
                          width="100%"
                          height="400"
                          style={{ border: 0 }}
                          allowFullScreen
                          loading="lazy"
                          referrerPolicy="no-referrer-when-downgrade"
                          title="Satellite Map"
                        />
                      </div>
                    </div>
                  )}

                  {/* Street View */}
                  {mapData.streetViewEmbedUrl && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Street View
                      </label>
                      <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-600">
                        <iframe
                          src={mapData.streetViewEmbedUrl}
                          width="100%"
                          height="400"
                          style={{ border: 0 }}
                          allowFullScreen
                          loading="lazy"
                          referrerPolicy="no-referrer-when-downgrade"
                          title="Street View Map"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Interactive Links */}
                <div className="flex flex-wrap gap-3">
                  <a
                    href={mapData.interactiveSatelliteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-secondary flex items-center"
                  >
                    <MapIcon className="h-4 w-4 mr-2" />
                    Open in Google Maps (Satellite)
                  </a>
                  <a
                    href={mapData.interactiveStreetViewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-secondary flex items-center"
                  >
                    <MapIcon className="h-4 w-4 mr-2" />
                    Open Street View
                  </a>
                  {mapData.openStreetMapUrl && (
                    <a
                      href={mapData.openStreetMapUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-secondary flex items-center"
                    >
                      <MapIcon className="h-4 w-4 mr-2" />
                      Open in OpenStreetMap
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
