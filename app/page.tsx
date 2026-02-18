'use client';

import { useState, useEffect } from 'react';
import { Search, Filter, Download, MapPin, Phone, Globe, Building2 } from 'lucide-react';

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
  serviceType: string;
  subServiceType: string;
}

export default function ResellerIntel() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [filters, setFilters] = useState<Filters>({
    search: '',
    state: '',
    serviceType: '',
    subServiceType: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    fetchCompanies();
  }, [filters, currentPage]);

  const fetchCompanies = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('Fetching companies with filters:', filters);
      const params = new URLSearchParams();
      params.append('page', currentPage.toString());
      params.append('limit', '50');
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
      
      console.log('Making request to:', `/api/companies?${params}`);
      const response = await fetch(`/api/companies?${params}`);
      
      if (!response.ok) {
        console.error('API response not ok:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('Error response body:', errorText);
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('API response data:', data);
      
      setCompanies(data.companies || []);
      setTotalPages(data.pagination?.totalPages || data.totalPages || 1);
      setTotalCount(data.pagination?.totalCount || data.totalCount || 0);
    } catch (error: any) {
      console.error('Failed to fetch companies:', error);
      setError(error.message || 'Failed to fetch companies');
      setCompanies([]);
      setTotalPages(1);
      setTotalCount(0);
    }
    setLoading(false);
  };

  const handleFilterChange = (key: keyof Filters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const exportCompanies = async () => {
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
      const response = await fetch(`/api/companies/export?${params}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `reseller-intel-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Export failed:', error);
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
                {totalCount.toLocaleString()} service centers
              </span>
              <button
                onClick={exportCompanies}
                className="btn-primary flex items-center space-x-2"
              >
                <Download className="h-4 w-4" />
                <span>Export</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Filters */}
        <div className="card p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Search Companies
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Company name, city..."
                  className="input-field pl-10 w-full"
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                State
              </label>
              <select
                className="input-field w-full"
                value={filters.state}
                onChange={(e) => handleFilterChange('state', e.target.value)}
              >
                <option value="">All States</option>
                <option value="AL">Alabama</option>
                <option value="CA">California</option>
                <option value="FL">Florida</option>
                <option value="TX">Texas</option>
                {/* Add more states as needed */}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Service Type
              </label>
              <select
                className="input-field w-full"
                value={filters.serviceType}
                onChange={(e) => handleFilterChange('serviceType', e.target.value)}
              >
                <option value="">All Services</option>
                <option value="Dealer-Trailer">Dealer-Trailer</option>
                <option value="Service Center">Service Center</option>
                <option value="Parts Supplier">Parts Supplier</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Sub-Service Type
              </label>
              <select
                className="input-field w-full"
                value={filters.subServiceType}
                onChange={(e) => handleFilterChange('subServiceType', e.target.value)}
              >
                <option value="">All Sub-Types</option>
                <option value="Thermo King">Thermo King</option>
                <option value="Carrier Transicold">Carrier Transicold</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Companies List */}
          <div className="lg:col-span-2">
            <div className="card">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Service Centers ({totalCount.toLocaleString()})
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
                      className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                      onClick={() => setSelectedCompany(company)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-medium text-gray-900 dark:text-white truncate">
                            {company.company_name}
                          </h3>
                          <div className="mt-1 flex items-center text-sm text-gray-500">
                            <MapPin className="h-4 w-4 mr-1" />
                            <span>{company.city}, {company.state} {company.zip_code}</span>
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
      </div>
    </div>
  );
}