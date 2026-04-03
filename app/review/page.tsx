'use client';

import { useState, useEffect, useCallback } from 'react';
import ProspectCard from './components/ProspectCard';
import FlagSheet from './components/FlagSheet';

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

interface Stats {
  total_enriched: number;
  total_reviewed: number;
  total_approved: number;
  total_flagged: number;
}

type CardState = 'visible' | 'exiting-approve' | 'exiting-flag' | 'exiting-skip' | 'entering';

export default function ReviewPage() {
  const [company, setCompany] = useState<Company | null>(null);
  const [nextCompany, setNextCompany] = useState<Company | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [cardState, setCardState] = useState<CardState>('visible');
  const [showFlagSheet, setShowFlagSheet] = useState(false);
  const [done, setDone] = useState(false);

  const loadStats = useCallback(async () => {
    try {
      const res = await fetch('/api/qa/stats');
      const data = await res.json();
      setStats(data);
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  }, []);

  const fetchCompany = useCallback(async (): Promise<Company | null> => {
    try {
      const res = await fetch('/api/qa/next');
      const data = await res.json();
      return data.company ?? null;
    } catch {
      return null;
    }
  }, []);

  // Initial load
  useEffect(() => {
    async function init() {
      try {
        setLoading(true);
        const [c, s] = await Promise.all([
          fetch('/api/qa/next').then(r => r.json()).then(d => d.company ?? null).catch(() => null),
          fetch('/api/qa/stats').then(r => r.json()).catch(() => null)
        ]);
        setCompany(c);
        setStats(s);
        if (!c) setDone(true);
      } catch(e) {
        console.error('Init failed:', e);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  // Prefetch next card whenever current changes
  useEffect(() => {
    if (!company) return;
    // small delay to not block current render
    const t = setTimeout(async () => {
      const next = await fetchCompany();
      setNextCompany(next);
    }, 500);
    return () => clearTimeout(t);
  }, [company, fetchCompany]);

  function transitionToNext(exitClass: CardState) {
    setCardState(exitClass);
    setTimeout(() => {
      setCompany(nextCompany);
      setNextCompany(null);
      if (!nextCompany) {
        setDone(true);
      } else {
        setCardState('entering');
        setTimeout(() => setCardState('visible'), 50);
      }
      loadStats();
    }, 300);
  }

  async function handleApprove() {
    if (!company) return;
    try {
      await fetch('/api/qa/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: company.id }),
      });
    } catch (err) {
      console.error(err);
    }
    transitionToNext('exiting-approve');
  }

  function handleFlagClick() {
    setShowFlagSheet(true);
  }

  async function handleFlagSubmit(reason: string, note: string) {
    if (!company) return;
    setShowFlagSheet(false);
    // Combine reason + optional note into a single note string (flag route stores qa_flag_note)
    const combinedNote = note ? `${reason} — ${note}` : reason;
    try {
      await fetch('/api/qa/flag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: company.id, note: combinedNote }),
      });
    } catch (err) {
      console.error(err);
    }
    transitionToNext('exiting-flag');
  }

  async function handleSkip() {
    if (!company) return;
    try {
      await fetch('/api/qa/skip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: company.id }),
      });
    } catch (err) {
      console.error(err);
    }
    transitionToNext('exiting-skip');
  }

  const progressPct = stats
    ? Math.round((stats.total_reviewed / Math.max(stats.total_enriched, 1)) * 100)
    : 0;

  const remaining = stats
    ? stats.total_enriched - stats.total_reviewed
    : null;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          <span className="text-gray-500 text-sm">Loading intel...</span>
        </div>
      </div>
    );
  }

  if (done || !company) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center px-6">
        <div className="text-center max-w-xs">
          <div className="text-6xl mb-4">🎯</div>
          <h1 className="text-3xl font-bold text-white mb-2">Queue Clear</h1>
          <p className="text-gray-400 mb-6">All prospects have been reviewed.</p>
          {stats && (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 text-left space-y-2">
              <Stat label="Total Enriched" value={String(stats.total_enriched)} />
              <Stat label="Reviewed" value={String(stats.total_reviewed)} />
              <Stat label="Approved" value={String(stats.total_approved)} color="text-green-400" />
              <Stat label="Flagged" value={String(stats.total_flagged)} color="text-red-400" />
            </div>
          )}
          <a
            href="/"
            className="mt-6 inline-block text-sm text-gray-500 hover:text-gray-300 transition-colors"
          >
            ← Back to dashboard
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f]">
      {/* ── STICKY TOP PROGRESS BAR ───────────────────────────────────── */}
      <div className="sticky top-0 z-30 bg-[#0f0f0f]/95 backdrop-blur-sm border-b border-white/8 px-4 py-2.5">
        <div className="max-w-[430px] mx-auto">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-gray-500 font-medium">
              {stats ? `${stats.total_reviewed} reviewed` : 'QA Review'}
            </span>
            <span className="text-xs font-semibold text-gray-300">
              {remaining != null ? `${remaining} remaining` : ''}
            </span>
          </div>
          <div className="w-full h-1 bg-white/8 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-600 to-blue-400 rounded-full transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* ── CARD CONTAINER ────────────────────────────────────────────── */}
      <div className="max-w-[430px] mx-auto px-3 py-4">
        <div
          style={{
            opacity: cardState === 'visible' ? 1 : cardState === 'entering' ? 0 : 0,
            transform:
              cardState === 'exiting-approve'
                ? 'translateX(110%) rotate(8deg)'
                : cardState === 'exiting-flag'
                ? 'translateX(-110%) rotate(-8deg)'
                : cardState === 'exiting-skip'
                ? 'translateY(-40px) scale(0.95)'
                : cardState === 'entering'
                ? 'translateY(16px) scale(0.98)'
                : 'none',
            transition: 'opacity 0.28s ease, transform 0.28s ease',
          }}
        >
          <ProspectCard
            company={company}
            onApprove={handleApprove}
            onFlag={handleFlagClick}
            onSkip={handleSkip}
          />
        </div>
      </div>

      {/* ── FLAG SHEET ────────────────────────────────────────────────── */}
      {showFlagSheet && (
        <FlagSheet
          onSubmit={handleFlagSubmit}
          onCancel={() => setShowFlagSheet(false)}
        />
      )}
    </div>
  );
}

function Stat({ label, value, color = 'text-white' }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-gray-500 text-sm">{label}</span>
      <span className={`font-bold text-sm ${color}`}>{value}</span>
    </div>
  );
}
