/**
 * Enrichment Card Component
 * Displays Google Places + Facility Analysis data for a service center
 */

import React from 'react';
import { Star, MapPin, TrendingUp, AlertCircle, Zap } from 'lucide-react';

interface EnrichmentData {
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

export default function EnrichmentCard({ data, serviceName }: { data: EnrichmentData; serviceName: string }) {
  if (!data) return null;

  return (
    <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg border border-slate-700 p-6 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <h3 className="text-lg font-semibold text-white">{serviceName}</h3>
        <span className={`px-2 py-1 rounded text-xs font-medium ${
          data.confidence === 'high' ? 'bg-green-500/20 text-green-400' :
          data.confidence === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
          'bg-red-500/20 text-red-400'
        }`}>
          {data.confidence ? `${data.confidence} confidence` : 'No data'}
        </span>
      </div>

      {/* Google Rating */}
      {data.googleRating && (
        <div className="flex items-center gap-3 pb-3 border-b border-slate-700">
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            <span className="text-lg font-bold text-white">{data.googleRating.toFixed(1)}</span>
          </div>
          <div className="flex-1">
            <div className="w-full bg-slate-700 rounded-full h-2">
              <div
                className="bg-yellow-400 h-2 rounded-full"
                style={{ width: `${(data.googleRating / 5) * 100}%` }}
              />
            </div>
          </div>
          <span className="text-xs text-slate-400">Rating</span>
        </div>
      )}

      {/* Sentiment Score */}
      {data.sentimentScore !== undefined && (
        <div className="flex items-center gap-3">
          <TrendingUp className="w-4 h-4 text-blue-400" />
          <div className="flex-1">
            <div className="text-sm font-medium text-slate-300">Sentiment</div>
            <div className="w-full bg-slate-700 rounded-full h-2 mt-1">
              <div
                className="bg-blue-400 h-2 rounded-full"
                style={{ width: `${data.sentimentScore * 100}%` }}
              />
            </div>
          </div>
          <span className="text-xs text-slate-400">{(data.sentimentScore * 100).toFixed(0)}%</span>
        </div>
      )}

      {/* Facility Info */}
      {data.facilityType && (
        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-700">
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase">Type</div>
            <div className="text-sm text-white capitalize">{data.facilityType}</div>
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase">Activity</div>
            <div className="text-sm text-white capitalize">{data.activityLevel || '—'}</div>
          </div>
          {data.estimatedBays && (
            <div>
              <div className="text-xs font-semibold text-slate-400 uppercase">Bays</div>
              <div className="text-sm text-white">{data.estimatedBays}</div>
            </div>
          )}
          {data.trucksVisible !== undefined && (
            <div>
              <div className="text-xs font-semibold text-slate-400 uppercase">Trucks</div>
              <div className="text-sm text-white">{data.trucksVisible}</div>
            </div>
          )}
        </div>
      )}

      {/* Sales Intel */}
      {data.salesIntel && (
        <div className="pt-3 border-t border-slate-700">
          <div className="flex items-start gap-2 text-sm">
            <Zap className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-slate-300 mb-1">Sales Intel</div>
              <p className="text-slate-400 text-xs leading-relaxed">{data.salesIntel}</p>
            </div>
          </div>
        </div>
      )}

      {/* Image Preview */}
      {data.imageUrl && (
        <div className="pt-3 border-t border-slate-700">
          <img
            src={data.imageUrl}
            alt="Satellite view"
            className="w-full h-32 object-cover rounded border border-slate-600"
          />
          <p className="text-xs text-slate-500 mt-1">Satellite view</p>
        </div>
      )}
    </div>
  );
}
