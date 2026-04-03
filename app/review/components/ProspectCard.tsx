'use client';

import { useState } from 'react';

interface Company {
  id: number;
  company_name: string;
  city: string;
  state: string;
  full_address?: string;
  primary_phone?: string;
  company_detail_url?: string;
  place_id?: string;
  rating?: number;
  review_count?: number;
  google_business_status?: string;
  primary_entity_type?: string;
  confidence_score?: number;
  confidence_label?: string;
  is_target_account?: boolean;
  brands_served?: string[];
  parts_capabilities?: string[];
  service_capabilities?: string[];
  mobile_service?: boolean;
  fleet_focus?: boolean;
  dot_inspection?: boolean;
  roadside_service?: boolean;
  leasing_rental?: boolean;
  used_truck_sales?: boolean;
  new_truck_sales?: boolean;
  evidence_snippets?: string[];
  deep_analysis?: any;
  satellite_image_url?: string;
  facility_type?: string;
  facility_size_acres?: number;
  bay_count?: number;
  trucks_visible?: number;
  trailers_visible?: number;
  building_count?: number;
  building_condition?: number;
  cleanliness_score?: number;
  has_signage?: boolean;
  has_fencing?: boolean;
  lot_organized?: boolean;
  features?: string;
}

interface ProspectCardProps {
  company: Company;
  onApprove: () => void;
  onFlag: () => void;
  onSkip: () => void;
}

function safeArray(val: any): string[] {
  if (!val) return [];
  if (Array.isArray(val)) return val.filter(Boolean);
  if (typeof val === 'string') {
    try { return JSON.parse(val); } catch { return []; }
  }
  return [];
}

function getImageUrl(company: Company): string | null {
  if (company.satellite_image_url) {
    return `/api/facility-image?path=${encodeURIComponent(company.satellite_image_url)}`;
  }
  return null;
}

function getMapsStaticUrl(company: Company): string | null {
  // Try to build a Google Maps Static embed from address
  if (company.full_address) {
    const addr = encodeURIComponent(company.full_address);
    return `https://maps.googleapis.com/maps/api/staticmap?center=${addr}&zoom=17&size=600x300&maptype=satellite`;
  }
  return null;
}

function getScoreColor(score: number): string {
  if (score >= 80) return '#22c55e';
  if (score >= 50) return '#eab308';
  return '#ef4444';
}

function getScoreRingColor(score: number): string {
  if (score >= 80) return '#15803d';
  if (score >= 50) return '#a16207';
  return '#b91c1c';
}

function getEntityBadge(type: string): { color: string; bg: string; label: string } {
  switch ((type || '').toLowerCase()) {
    case 'dealer': return { color: '#93c5fd', bg: '#1e3a5f', label: 'Dealer' };
    case 'repair shop': return { color: '#fdba74', bg: '#4a2000', label: 'Repair Shop' };
    case 'parts supplier': return { color: '#c4b5fd', bg: '#2e1065', label: 'Parts Supplier' };
    default: return { color: '#9ca3af', bg: '#1f2937', label: type || 'Unknown' };
  }
}

function getAiVerdict(deepAnalysis: any): string {
  if (!deepAnalysis) return '';
  if (typeof deepAnalysis === 'string') {
    try { deepAnalysis = JSON.parse(deepAnalysis); } catch { return deepAnalysis.substring(0, 160); }
  }
  const desc = deepAnalysis?.meta_description || deepAnalysis?.summary || deepAnalysis?.description || '';
  if (desc) {
    // Take up to 2 sentences
    const sentences = desc.match(/[^.!?]+[.!?]+/g) || [];
    return sentences.slice(0, 2).join(' ').trim() || desc.substring(0, 180);
  }
  return '';
}

function getDomainFromUrl(url: string): string {
  try {
    const u = new URL(url.startsWith('http') ? url : 'https://' + url);
    return u.hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

function getMapsLink(company: Company): string {
  const addr = company.full_address || `${company.company_name} ${company.city} ${company.state}`;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addr)}`;
}

function getSocialFromFeatures(features: string | undefined, platform: string): 'active' | 'none' {
  if (!features) return 'none';
  const lower = features.toLowerCase();
  if (lower.includes(platform.toLowerCase())) return 'active';
  return 'none';
}

function getSocialFromDeepAnalysis(deepAnalysis: any, platform: string): 'active' | 'none' {
  if (!deepAnalysis) return 'none';
  let da = deepAnalysis;
  if (typeof da === 'string') {
    try { da = JSON.parse(da); } catch { 
      return da.toLowerCase().includes(platform.toLowerCase()) ? 'active' : 'none';
    }
  }
  const text = JSON.stringify(da).toLowerCase();
  if (text.includes(platform.toLowerCase())) return 'active';
  return 'none';
}

export default function ProspectCard({ company, onApprove, onFlag, onSkip }: ProspectCardProps) {
  const [evidenceOpen, setEvidenceOpen] = useState(false);
  const [imgError, setImgError] = useState(false);

  const imageUrl = getImageUrl(company);
  const mapsStaticUrl = getMapsStaticUrl(company);
  const score = company.confidence_score ?? 0;
  const scoreColor = getScoreColor(score);
  const scoreRingColor = getScoreRingColor(score);
  const entityBadge = getEntityBadge(company.primary_entity_type || '');
  const aiVerdict = getAiVerdict(company.deep_analysis);
  const brands = safeArray(company.brands_served);
  const partsCaps = safeArray(company.parts_capabilities);
  const serviceCaps = safeArray(company.service_capabilities);
  const allServices = [...new Set([...partsCaps, ...serviceCaps])];
  const evidence = safeArray(company.evidence_snippets);

  const capFlags = [
    company.mobile_service && { icon: '🚚', label: 'Mobile' },
    company.fleet_focus && { icon: '🏢', label: 'Fleet' },
    company.dot_inspection && { icon: '🔍', label: 'DOT' },
    company.roadside_service && { icon: '🛣', label: 'Roadside' },
    company.leasing_rental && { icon: '📋', label: 'Leasing' },
    company.used_truck_sales && { icon: '🔄', label: 'Used Trucks' },
    company.new_truck_sales && { icon: '✨', label: 'New Trucks' },
  ].filter(Boolean) as { icon: string; label: string }[];

  const fbStatus = getSocialFromFeatures(company.features, 'facebook') === 'active' || getSocialFromDeepAnalysis(company.deep_analysis, 'facebook') === 'active' ? 'active' : 'none';
  const igStatus = getSocialFromFeatures(company.features, 'instagram') === 'active' || getSocialFromDeepAnalysis(company.deep_analysis, 'instagram') === 'active' ? 'active' : 'none';
  const liStatus = getSocialFromFeatures(company.features, 'linkedin') === 'active' || getSocialFromDeepAnalysis(company.deep_analysis, 'linkedin') === 'active' ? 'active' : 'none';

  const circumference = 2 * Math.PI * 28;
  const offset = circumference - (score / 100) * circumference;

  // Decide which image source to use
  const showLocalImage = imageUrl && !imgError;
  const showMapsStatic = !showLocalImage && mapsStaticUrl;
  const showPlaceholder = !showLocalImage && !showMapsStatic;

  return (
    <div className="w-full bg-[#161616] rounded-2xl overflow-hidden shadow-2xl border border-white/8">

      {/* ── 1. VISUAL HEADER ───────────────────────────────────────────── */}
      <div className="relative w-full" style={{ height: '220px' }}>
        {showLocalImage && (
          <img
            src={imageUrl!}
            alt="Facility satellite view"
            className="absolute inset-0 w-full h-full object-cover"
            onError={() => setImgError(true)}
          />
        )}
        {showMapsStatic && !showLocalImage && (
          <img
            src={mapsStaticUrl!}
            alt="Maps satellite view"
            className="absolute inset-0 w-full h-full object-cover"
            onError={() => {}}
          />
        )}
        {showPlaceholder && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0d1117]">
            <span className="text-4xl mb-2">📍</span>
            <span className="text-gray-500 text-sm text-center px-6">
              {company.full_address || `${company.city}, ${company.state}`}
            </span>
          </div>
        )}

        {/* Gradient overlay bottom */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#161616] via-transparent to-transparent" />

        {/* Top-right overlay: fencing + organized */}
        <div className="absolute top-3 right-3 flex gap-1.5">
          {company.has_fencing && (
            <span className="bg-black/60 backdrop-blur-sm text-white text-xs px-2 py-0.5 rounded-full">🔒 Fenced</span>
          )}
          {company.lot_organized && (
            <span className="bg-black/60 backdrop-blur-sm text-white text-xs px-2 py-0.5 rounded-full">✓ Organized</span>
          )}
        </div>

        {/* Bottom-left: facility type badge */}
        {company.facility_type && (
          <div className="absolute bottom-3 left-3">
            <span className="bg-black/70 backdrop-blur-sm text-white text-xs font-medium px-2.5 py-1 rounded-full uppercase tracking-wider border border-white/15">
              {company.facility_type}
            </span>
          </div>
        )}
      </div>

      {/* ── CARD BODY ───────────────────────────────────────────────────── */}
      <div className="px-4 pt-3 pb-2 space-y-4">

        {/* ── 2. IDENTITY BLOCK ──────────────────────────────────────────── */}
        <div>
          <h1 className="text-2xl font-bold text-white leading-tight">{company.company_name}</h1>
          <p className="text-gray-400 text-sm mt-0.5">{company.city}, {company.state}</p>

          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span
              className="text-xs font-semibold px-2.5 py-1 rounded-full"
              style={{ color: entityBadge.color, backgroundColor: entityBadge.bg }}
            >
              {entityBadge.label}
            </span>
          </div>

          {aiVerdict && (
            <p className="text-gray-400 text-sm italic mt-2 leading-relaxed">{aiVerdict}</p>
          )}
        </div>

        {/* ── 3. OPPORTUNITY SCORE ───────────────────────────────────────── */}
        <div className="flex items-center gap-4">
          {/* Circular score gauge */}
          <div className="relative flex-shrink-0">
            <svg width="72" height="72" className="-rotate-90">
              <circle cx="36" cy="36" r="28" fill="none" stroke="#2a2a2a" strokeWidth="6" />
              <circle
                cx="36" cy="36" r="28"
                fill="none"
                stroke={scoreColor}
                strokeWidth="6"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 0.6s ease' }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xl font-bold" style={{ color: scoreColor }}>{score}</span>
            </div>
          </div>

          <div>
            <div className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-0.5">
              {company.confidence_label || 'Score'}
            </div>
            <div className={`text-sm font-bold ${company.is_target_account ? 'text-green-400' : 'text-gray-500'}`}>
              {company.is_target_account ? '🎯 TARGET ACCOUNT ✓' : 'NOT TARGET'}
            </div>
          </div>
        </div>

        {/* ── 4. PROPERTY INTEL ─────────────────────────────────────────── */}
        <div>
          <h2 className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-2">Property Intel</h2>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2">
            {[
              { icon: '📐', label: 'Acreage', value: company.facility_size_acres != null ? `${company.facility_size_acres} ac` : null },
              { icon: '🏗', label: 'Bays', value: company.bay_count != null ? String(company.bay_count) : null },
              { icon: '🚛', label: 'Trucks', value: company.trucks_visible != null ? String(company.trucks_visible) : null },
              { icon: '🚌', label: 'Trailers', value: company.trailers_visible != null ? String(company.trailers_visible) : null },
              { icon: '🏢', label: 'Buildings', value: company.building_count != null ? String(company.building_count) : null },
              { icon: '⭐', label: 'Condition', value: company.building_condition != null ? `${company.building_condition}/5` : null },
              { icon: '🧹', label: 'Cleanliness', value: company.cleanliness_score != null ? `${company.cleanliness_score}/5` : null },
              { icon: '🪧', label: 'Signage', value: company.has_signage != null ? (company.has_signage ? 'Yes' : 'No') : null },
            ].map(({ icon, label, value }) => (
              <div key={label} className="flex items-center gap-2">
                <span className="text-base w-5 text-center flex-shrink-0">{icon}</span>
                <span className="text-xs text-gray-500 w-16 flex-shrink-0">{label}</span>
                <span className={`text-xs font-medium ${value ? 'text-white' : 'text-gray-600'}`}>
                  {value ?? '—'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ── 5. DIGITAL PRESENCE ───────────────────────────────────────── */}
        <div>
          <h2 className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-2">Digital Presence</h2>
          <div className="grid grid-cols-5 gap-1">
            {/* Web */}
            <div className="flex flex-col items-center gap-1">
              <span className="text-lg">🌐</span>
              {company.company_detail_url ? (
                <a
                  href={company.company_detail_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] text-blue-400 truncate w-full text-center"
                >
                  {getDomainFromUrl(company.company_detail_url)}
                </a>
              ) : (
                <span className="text-[10px] text-gray-600">None</span>
              )}
              <div className={`w-1.5 h-1.5 rounded-full ${company.company_detail_url ? 'bg-green-500' : 'bg-gray-700'}`} />
            </div>

            {/* Google */}
            <div className="flex flex-col items-center gap-1">
              <span className="text-lg">⭐</span>
              {company.rating ? (
                <>
                  <span className="text-[10px] text-yellow-400 font-bold">{company.rating.toFixed(1)} ★</span>
                  <span className="text-[10px] text-gray-500">{company.review_count ?? 0} rev</span>
                </>
              ) : (
                <span className="text-[10px] text-gray-600">None</span>
              )}
              <div className={`w-1.5 h-1.5 rounded-full ${company.rating ? 'bg-green-500' : 'bg-gray-700'}`} />
            </div>

            {/* Facebook */}
            <div className="flex flex-col items-center gap-1">
              <span className="text-lg">📘</span>
              <span className={`text-[10px] ${fbStatus === 'active' ? 'text-blue-400' : 'text-gray-600'}`}>
                {fbStatus === 'active' ? 'Active' : 'None'}
              </span>
              <div className={`w-1.5 h-1.5 rounded-full ${fbStatus === 'active' ? 'bg-green-500' : 'bg-gray-700'}`} />
            </div>

            {/* Instagram */}
            <div className="flex flex-col items-center gap-1">
              <span className="text-lg">📸</span>
              <span className={`text-[10px] ${igStatus === 'active' ? 'text-pink-400' : 'text-gray-600'}`}>
                {igStatus === 'active' ? 'Active' : 'None'}
              </span>
              <div className={`w-1.5 h-1.5 rounded-full ${igStatus === 'active' ? 'bg-green-500' : 'bg-gray-700'}`} />
            </div>

            {/* LinkedIn */}
            <div className="flex flex-col items-center gap-1">
              <span className="text-lg">💼</span>
              <span className={`text-[10px] ${liStatus === 'active' ? 'text-blue-300' : 'text-gray-600'}`}>
                {liStatus === 'active' ? 'Active' : 'None'}
              </span>
              <div className={`w-1.5 h-1.5 rounded-full ${liStatus === 'active' ? 'bg-green-500' : 'bg-gray-700'}`} />
            </div>
          </div>
        </div>

        {/* ── 6. BRANDS ──────────────────────────────────────────────────── */}
        <div>
          <h2 className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-2">Brands</h2>
          {brands.length > 0 ? (
            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
              {brands.map((brand, i) => (
                <span
                  key={i}
                  className="flex-shrink-0 bg-blue-900 text-blue-200 rounded-full px-2 py-0.5 text-xs whitespace-nowrap"
                >
                  {brand}
                </span>
              ))}
            </div>
          ) : (
            <span className="text-gray-500 text-xs">No brands detected</span>
          )}
        </div>

        {/* ── 7. SERVICES ───────────────────────────────────────────────── */}
        {allServices.length > 0 && (
          <div>
            <h2 className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-2">Services</h2>
            <div className="flex flex-wrap gap-1.5">
              {allServices.map((svc, i) => (
                <span
                  key={i}
                  className="bg-gray-800 text-gray-300 rounded-full px-2 py-0.5 text-xs"
                >
                  {svc}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* ── 8. CAPABILITY FLAGS ───────────────────────────────────────── */}
        {capFlags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {capFlags.map(({ icon, label }) => (
              <span
                key={label}
                className="bg-white/5 border border-white/10 text-gray-300 rounded-full px-2.5 py-1 text-xs flex items-center gap-1"
              >
                <span>{icon}</span>
                <span>{label}</span>
              </span>
            ))}
          </div>
        )}

        {/* ── 9. EVIDENCE (collapsible) ─────────────────────────────────── */}
        {evidence.length > 0 && (
          <div className="border border-white/8 rounded-xl overflow-hidden">
            <button
              onClick={() => setEvidenceOpen(!evidenceOpen)}
              className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-white/3 transition-colors"
            >
              <span className="text-sm font-medium text-gray-300">Why this score?</span>
              <span className="text-gray-500 text-sm">{evidenceOpen ? '▲' : '▼'}</span>
            </button>
            {evidenceOpen && (
              <div className="px-4 pb-3 border-t border-white/8">
                <ul className="space-y-1.5 mt-2">
                  {evidence.map((snippet, i) => (
                    <li key={i} className="text-xs text-gray-400 flex items-start gap-1.5">
                      <span className="text-gray-600 mt-0.5">›</span>
                      <span>{snippet}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* ── 10. STICKY BOTTOM ACTION BAR ─────────────────────────────── */}
        {/* Quick links row */}
        <div className="flex justify-around pt-1 pb-1 border-t border-white/8">
          {company.primary_phone && (
            <a
              href={`tel:${company.primary_phone}`}
              className="flex flex-col items-center gap-1 text-gray-400 hover:text-white transition-colors py-1"
            >
              <span className="text-xl">📞</span>
              <span className="text-[10px]">Call</span>
            </a>
          )}
          {company.company_detail_url && (
            <a
              href={company.company_detail_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-1 text-gray-400 hover:text-white transition-colors py-1"
            >
              <span className="text-xl">🌐</span>
              <span className="text-[10px]">Website</span>
            </a>
          )}
          <a
            href={getMapsLink(company)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center gap-1 text-gray-400 hover:text-white transition-colors py-1"
          >
            <span className="text-xl">📍</span>
            <span className="text-[10px]">Maps</span>
          </a>
        </div>

        {/* Swipe action buttons */}
        <div className="space-y-2 pb-2">
          <div className="flex gap-3">
            <button
              onClick={onApprove}
              className="flex-1 bg-green-600 hover:bg-green-500 active:scale-95 text-white font-bold py-4 rounded-2xl text-lg transition-all flex items-center justify-center gap-2"
            >
              <span>✓</span>
              <span>APPROVE</span>
            </button>
            <button
              onClick={onFlag}
              className="flex-1 bg-red-700 hover:bg-red-600 active:scale-95 text-white font-bold py-4 rounded-2xl text-lg transition-all flex items-center justify-center gap-2"
            >
              <span>✗</span>
              <span>FLAG</span>
            </button>
          </div>
          <div className="text-center">
            <button
              onClick={onSkip}
              className="text-gray-500 hover:text-gray-300 text-sm py-1 transition-colors"
            >
              Skip →
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
