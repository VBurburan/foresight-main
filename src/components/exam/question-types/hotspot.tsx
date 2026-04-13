'use client';

import { useState } from 'react';
import { Check, X, MousePointer2 } from 'lucide-react';

interface Region {
  id: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface HotspotProps {
  question: {
    id: string;
    options: any;
    correct_answer: any;
    raw_options?: any;
  };
  response: any;
  onAnswer: (answer: any) => void;
  showFeedback: boolean;
}

export default function Hotspot({
  question,
  response,
  onAnswer,
  showFeedback,
}: HotspotProps) {
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);

  // HS data can come from raw_options (DB format) or options (adapted)
  const rawOpts = question.raw_options || question.options || {};
  const imageUrl = rawOpts?.imageUrl || '';
  const regions: Region[] = rawOpts?.regions || question.correct_answer?.regions || [];
  const correctRegionId = question.correct_answer?.correctRegionId || rawOpts?.correctRegionId || '';
  const selectedRegionId = response?.selectedRegionId;
  const isAnswered = !!selectedRegionId;
  const isCorrect = selectedRegionId === correctRegionId;

  const handleRegionClick = (regionId: string) => {
    if (showFeedback) return; // Don't allow changes after feedback
    onAnswer(regionId);
  };

  if (!imageUrl) {
    return (
      <div className="flex items-center justify-center h-48 bg-slate-50 rounded-lg border border-slate-200">
        <p className="text-sm text-slate-400">No image provided for this hotspot question.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {!isAnswered && (
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <MousePointer2 className="w-4 h-4" />
          <span>Click on the correct region in the image below.</span>
        </div>
      )}

      {/* Image with clickable region overlays */}
      <div className="relative border border-slate-200 rounded-lg overflow-hidden bg-slate-50 select-none">
        <img
          src={imageUrl}
          alt="Hotspot question image"
          className="w-full max-h-[500px] object-contain"
          draggable={false}
        />

        {/* Clickable region overlays */}
        <svg className="absolute inset-0 w-full h-full">
          {regions.map((region) => {
            const isSelected = selectedRegionId === region.id;
            const isCorrectRegion = region.id === correctRegionId;
            const isHovered = hoveredRegion === region.id;

            // Determine fill/stroke based on state
            let fill = 'transparent';
            let stroke = 'transparent';
            let strokeWidth = 2;

            if (showFeedback && isAnswered) {
              // After feedback: show correct in green, wrong selection in red
              if (isCorrectRegion) {
                fill = 'rgba(34,197,94,0.3)';
                stroke = '#16a34a';
                strokeWidth = 3;
              } else if (isSelected && !isCorrect) {
                fill = 'rgba(239,68,68,0.25)';
                stroke = '#dc2626';
                strokeWidth = 3;
              }
            } else if (isSelected) {
              // Selected but no feedback yet
              fill = 'rgba(59,130,246,0.25)';
              stroke = '#2563eb';
              strokeWidth = 3;
            } else if (isHovered) {
              // Hover state
              fill = 'rgba(59,130,246,0.1)';
              stroke = '#93c5fd';
              strokeWidth = 2;
            }

            return (
              <rect
                key={region.id}
                x={`${region.x}%`}
                y={`${region.y}%`}
                width={`${region.width}%`}
                height={`${region.height}%`}
                fill={fill}
                stroke={stroke}
                strokeWidth={strokeWidth}
                rx="4"
                className={`${!showFeedback ? 'cursor-pointer' : ''} transition-all duration-150`}
                style={{ pointerEvents: 'all' }}
                onMouseEnter={() => !showFeedback && setHoveredRegion(region.id)}
                onMouseLeave={() => setHoveredRegion(null)}
                onClick={() => handleRegionClick(region.id)}
              />
            );
          })}

          {/* Labels shown on feedback */}
          {showFeedback && isAnswered && regions.map((region) => {
            const isCorrectRegion = region.id === correctRegionId;
            const isSelected = selectedRegionId === region.id;
            if (!isCorrectRegion && !isSelected) return null;

            return (
              <text
                key={`label-${region.id}`}
                x={`${region.x + region.width / 2}%`}
                y={`${region.y + region.height / 2}%`}
                textAnchor="middle"
                dominantBaseline="central"
                className="text-xs font-bold pointer-events-none"
                fill={isCorrectRegion ? '#15803d' : '#dc2626'}
              >
                {region.label}
              </text>
            );
          })}
        </svg>
      </div>

      {/* Selection indicator */}
      {isAnswered && !showFeedback && (
        <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
          <Check className="w-4 h-4" />
          <span>Region selected: <strong>{regions.find(r => r.id === selectedRegionId)?.label || 'Unknown'}</strong></span>
        </div>
      )}

      {/* Feedback */}
      {showFeedback && isAnswered && (
        <div className={`flex items-center gap-2 text-sm rounded-lg px-3 py-2 ${
          isCorrect
            ? 'text-emerald-700 bg-emerald-50 border border-emerald-200'
            : 'text-red-700 bg-red-50 border border-red-200'
        }`}>
          {isCorrect ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
          <span>
            {isCorrect
              ? `Correct — ${regions.find(r => r.id === correctRegionId)?.label}`
              : `Incorrect. The correct region was: ${regions.find(r => r.id === correctRegionId)?.label}`
            }
          </span>
        </div>
      )}
    </div>
  );
}
