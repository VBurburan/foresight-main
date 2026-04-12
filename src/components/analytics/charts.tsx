'use client';

import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import {
  type CJFunctionScore,
  type DomainPerformance,
  type TEIPerformance,
  type HeatmapCell,
  type ErrorByCategory,
  type SpecificError,
  getAssessmentLabel,
  getAssessmentBg,
  heatmapColor,
  heatmapBorder,
  formatDelta,
  deltaColor,
} from '@/lib/analytics';

const CHART_PRE = '#f97316';   // orange
const CHART_POST = '#14b8a6';  // teal

const tooltipStyle = {
  borderRadius: '10px',
  border: '1px solid rgba(0,0,0,0.08)',
  backgroundColor: '#ffffff',
  color: '#18181b',
  fontSize: 12,
  boxShadow: '0 8px 30px rgba(0,0,0,0.1)',
};

// ─── 1. Clinical Judgment Radar Chart ─────────────────────────────
export function CJRadarChart({ data }: { data: CJFunctionScore[] }) {
  const radarData = data.map((d) => ({
    subject: d.shortName,
    'Pre-Test': d.pre ?? 0,
    'Post-Test': d.post ?? 0,
    fullMark: 100,
  }));

  const hasPre = data.some((d) => d.pre !== null);
  const hasPost = data.some((d) => d.post !== null);

  return (
    <div>
      <ResponsiveContainer width="100%" height={340}>
        <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="75%">
          <PolarGrid stroke="#e4e4e7" strokeWidth={0.5} />
          <PolarAngleAxis
            dataKey="subject"
            tick={{ fill: '#a1a1aa', fontSize: 12, fontWeight: 500 }}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 100]}
            tick={{ fill: '#52525b', fontSize: 10 }}
            tickCount={6}
          />
          {hasPre && (
            <Radar
              name="Pre-Test"
              dataKey="Pre-Test"
              stroke={CHART_PRE}
              fill={CHART_PRE}
              fillOpacity={0.1}
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={{ r: 4, fill: CHART_PRE, stroke: '#ffffff', strokeWidth: 2 }}
            />
          )}
          {hasPost && (
            <Radar
              name="Post-Test"
              dataKey="Post-Test"
              stroke={CHART_POST}
              fill={CHART_POST}
              fillOpacity={0.15}
              strokeWidth={2.5}
              dot={{ r: 4, fill: CHART_POST, stroke: '#ffffff', strokeWidth: 2 }}
            />
          )}
          <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v}%`]} />
          <Legend
            wrapperStyle={{ fontSize: 12, color: '#a1a1aa' }}
            iconType="line"
          />
        </RadarChart>
      </ResponsiveContainer>

      {/* Data table below radar */}
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-200">
              <th className="text-left py-2 px-3 text-xs font-medium text-zinc-400 uppercase tracking-wider">Cognitive Function</th>
              {hasPre && <th className="text-center py-2 px-3 text-xs font-medium text-zinc-400 uppercase tracking-wider">Pre-Test</th>}
              {hasPost && <th className="text-center py-2 px-3 text-xs font-medium text-zinc-400 uppercase tracking-wider">Post-Test</th>}
              {hasPre && hasPost && <th className="text-center py-2 px-3 text-xs font-medium text-zinc-400 uppercase tracking-wider">Change</th>}
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr key={row.function} className="border-b border-zinc-100 hover:bg-zinc-50">
                <td className="py-2 px-3 text-zinc-700 font-medium">{row.function}</td>
                {hasPre && (
                  <td className="py-2 px-3 text-center text-zinc-600 tabular-nums">
                    {row.pre !== null ? `${row.pre.toFixed(1)}%` : '--'}
                  </td>
                )}
                {hasPost && (
                  <td className="py-2 px-3 text-center text-zinc-600 tabular-nums">
                    {row.post !== null ? `${row.post.toFixed(1)}%` : '--'}
                  </td>
                )}
                {hasPre && hasPost && (
                  <td className={`py-2 px-3 text-center font-semibold tabular-nums ${deltaColor(row.change)}`}>
                    {formatDelta(row.change)}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── 2. Domain Performance Bars ───────────────────────────────────
export function DomainBars({ data }: { data: DomainPerformance[] }) {
  const hasPre = data.some((d) => d.pre !== null);
  const hasPost = data.some((d) => d.post !== null);

  const chartData = data.map((d) => ({
    domain: d.domain.length > 18 ? d.domain.slice(0, 16) + '...' : d.domain,
    fullDomain: d.domain,
    'Pre-Test': d.pre ?? 0,
    'Post-Test': d.post ?? 0,
  }));

  return (
    <div>
      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={chartData} barGap={2} barCategoryGap="15%">
          <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" vertical={false} />
          <XAxis
            dataKey="domain"
            tick={{ fill: '#a1a1aa', fontSize: 11 }}
            axisLine={{ stroke: '#27272a' }}
            tickLine={false}
            interval={0}
            angle={-15}
            textAnchor="end"
            height={50}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fill: '#71717a', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={36}
            tickFormatter={(v) => `${v}%`}
          />
          <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v}%`]} />
          {hasPre && (
            <Bar dataKey="Pre-Test" fill={CHART_PRE} radius={[3, 3, 0, 0]} maxBarSize={36} />
          )}
          {hasPost && (
            <Bar dataKey="Post-Test" fill={CHART_POST} radius={[3, 3, 0, 0]} maxBarSize={36} />
          )}
          <Legend wrapperStyle={{ fontSize: 12, color: '#a1a1aa' }} iconType="square" />
        </BarChart>
      </ResponsiveContainer>

      {/* Assessment table */}
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-200">
              <th className="text-left py-2 px-3 text-xs font-medium text-zinc-400 uppercase tracking-wider">Domain</th>
              {hasPre && <th className="text-center py-2 px-3 text-xs font-medium text-zinc-400 uppercase tracking-wider">Pre-Test</th>}
              {hasPost && <th className="text-center py-2 px-3 text-xs font-medium text-zinc-400 uppercase tracking-wider">Post-Test</th>}
              {hasPre && hasPost && <th className="text-center py-2 px-3 text-xs font-medium text-zinc-400 uppercase tracking-wider">Change</th>}
              <th className="text-center py-2 px-3 text-xs font-medium text-zinc-400 uppercase tracking-wider">Assessment</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row) => {
              const label = getAssessmentLabel(row.pre, row.post);
              return (
                <tr key={row.domain} className="border-b border-zinc-100 hover:bg-zinc-50">
                  <td className="py-2 px-3 text-zinc-700">{row.domain}</td>
                  {hasPre && (
                    <td className="py-2 px-3 text-center text-zinc-600 tabular-nums">{row.pre !== null ? `${row.pre}%` : '--'}</td>
                  )}
                  {hasPost && (
                    <td className="py-2 px-3 text-center text-zinc-600 tabular-nums">{row.post !== null ? `${row.post}%` : '--'}</td>
                  )}
                  {hasPre && hasPost && (
                    <td className={`py-2 px-3 text-center font-semibold tabular-nums ${deltaColor(row.change)}`}>
                      {formatDelta(row.change)}
                    </td>
                  )}
                  <td className="py-2 px-3 text-center">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold border ${getAssessmentBg(label)}`}>
                      {label}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── 3. TEI Format Performance ────────────────────────────────────
export function TEIBars({ data }: { data: TEIPerformance[] }) {
  const hasPre = data.some((d) => d.pre !== null);
  const hasPost = data.some((d) => d.post !== null);

  const chartData = data.map((d) => ({
    type: d.type,
    label: `${d.type}\n(${d.label})`,
    'Pre-Test': d.pre ?? 0,
    'Post-Test': d.post ?? 0,
  }));

  // Volume breakdown data
  const hasVolume = data.some((d) => d.preTotal || d.postTotal);

  return (
    <div className="space-y-8">
      {/* Accuracy bars */}
      <div>
        <h4 className="text-sm font-medium text-zinc-700 mb-3">TEI Format Performance: Pre-Test vs Post-Test</h4>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={chartData} barGap={2} barCategoryGap="20%">
            <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" vertical={false} />
            <XAxis dataKey="type" tick={{ fill: '#a1a1aa', fontSize: 12 }} axisLine={{ stroke: '#27272a' }} tickLine={false} />
            <YAxis domain={[0, 100]} tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} width={36} tickFormatter={(v) => `${v}%`} />
            <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v}%`]} />
            {hasPre && <Bar dataKey="Pre-Test" fill={CHART_PRE} radius={[3, 3, 0, 0]} maxBarSize={40} />}
            {hasPost && <Bar dataKey="Post-Test" fill={CHART_POST} radius={[3, 3, 0, 0]} maxBarSize={40} />}
            <Legend wrapperStyle={{ fontSize: 12, color: '#a1a1aa' }} iconType="square" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Volume & accuracy breakdown */}
      {hasVolume && (
        <div>
          <h4 className="text-sm font-medium text-zinc-700 mb-3">TEI Volume & Accuracy Breakdown</h4>
          <div className="grid grid-cols-2 gap-4">
            {data.filter((d) => d.preTotal || d.postTotal).map((d) => {
              const preAcc = d.preTotal ? Math.round(((d.preCorrect ?? 0) / d.preTotal) * 100) : null;
              const postAcc = d.postTotal ? Math.round(((d.postCorrect ?? 0) / d.postTotal) * 100) : null;
              return (
                <div key={d.type} className="bg-zinc-100 border border-zinc-200 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-zinc-700">{d.type}</span>
                    <span className="text-xs text-zinc-400">{d.label}</span>
                  </div>
                  {d.preTotal != null && (
                    <div className="mb-1.5">
                      <div className="flex justify-between text-xs mb-0.5">
                        <span className="text-zinc-400">Pre</span>
                        <span className="text-zinc-600">{d.preCorrect}/{d.preTotal} ({preAcc}%)</span>
                      </div>
                      <div className="h-2 bg-zinc-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-orange-500/70" style={{ width: `${preAcc}%` }} />
                      </div>
                    </div>
                  )}
                  {d.postTotal != null && (
                    <div>
                      <div className="flex justify-between text-xs mb-0.5">
                        <span className="text-zinc-400">Post</span>
                        <span className="text-zinc-600">{d.postCorrect}/{d.postTotal} ({postAcc}%)</span>
                      </div>
                      <div className="h-2 bg-zinc-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-teal-500/70" style={{ width: `${postAcc}%` }} />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── 4. Domain × TEI Heatmap ──────────────────────────────────────
export function DomainTEIHeatmap({ data }: { data: HeatmapCell[] }) {
  const domains = [...new Set(data.map((d) => d.domain))];
  const teiTypes = [...new Set(data.map((d) => d.teiType))];

  const getCell = (domain: string, tei: string) =>
    data.find((d) => d.domain === domain && d.teiType === tei);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr>
            <th className="text-left py-2 px-3 text-xs font-medium text-zinc-400 uppercase tracking-wider min-w-[140px]">Domain</th>
            {teiTypes.map((t) => (
              <th key={t} className="text-center py-2 px-3 text-xs font-medium text-zinc-400 uppercase tracking-wider min-w-[80px]">{t}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {domains.map((domain) => (
            <tr key={domain}>
              <td className="py-1 px-3 text-zinc-700 text-xs font-medium">{domain}</td>
              {teiTypes.map((tei) => {
                const cell = getCell(domain, tei);
                if (!cell || cell.total === 0) {
                  return (
                    <td key={tei} className="py-1 px-1">
                      <div className="flex items-center justify-center h-12 rounded-md bg-zinc-100 text-zinc-500 text-xs">--</div>
                    </td>
                  );
                }
                return (
                  <td key={tei} className="py-1 px-1">
                    <div className={`flex flex-col items-center justify-center h-12 rounded-md border ${heatmapColor(cell.percentage)} ${heatmapBorder(cell.percentage)} transition-colors`}>
                      <span className="text-xs font-bold">{cell.correct}/{cell.total}</span>
                      <span className="text-[10px] opacity-80">({cell.percentage}%)</span>
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── 5. Error Distribution Donuts ─────────────────────────────────
export function ErrorDistribution({
  byDomain,
  byTEI,
}: {
  byDomain: ErrorByCategory[];
  byTEI: ErrorByCategory[];
}) {
  const renderLabel = ({ name, value }: { name: string; value: number }) => `${name} (${value}%)`;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
      <div>
        <h4 className="text-sm font-medium text-zinc-700 mb-2 text-center">Errors by Domain</h4>
        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <Pie
              data={byDomain}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={90}
              paddingAngle={2}
              dataKey="value"
              label={renderLabel}
              labelLine={{ stroke: '#52525b' }}
            >
              {byDomain.map((entry, i) => (
                <Cell key={i} fill={entry.color} stroke="transparent" />
              ))}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v}%`]} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div>
        <h4 className="text-sm font-medium text-zinc-700 mb-2 text-center">Errors by TEI Format</h4>
        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <Pie
              data={byTEI}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={90}
              paddingAngle={2}
              dataKey="value"
              label={renderLabel}
              labelLine={{ stroke: '#52525b' }}
            >
              {byTEI.map((entry, i) => (
                <Cell key={i} fill={entry.color} stroke="transparent" />
              ))}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v}%`]} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ─── 6. Specific Error Table ──────────────────────────────────────
export function SpecificErrorTable({ data }: { data: SpecificError[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-200">
            <th className="text-left py-2.5 px-3 text-xs font-medium text-zinc-400 uppercase tracking-wider">Q#</th>
            <th className="text-left py-2.5 px-3 text-xs font-medium text-zinc-400 uppercase tracking-wider">Type</th>
            <th className="text-left py-2.5 px-3 text-xs font-medium text-zinc-400 uppercase tracking-wider">Domain</th>
            <th className="text-left py-2.5 px-3 text-xs font-medium text-zinc-400 uppercase tracking-wider">CJ Function</th>
            <th className="text-left py-2.5 px-3 text-xs font-medium text-zinc-400 uppercase tracking-wider">Error Pattern</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i} className="border-b border-zinc-100 hover:bg-zinc-50 transition-colors">
              <td className="py-2 px-3 text-zinc-600 font-mono tabular-nums">{row.questionNumber}</td>
              <td className="py-2 px-3">
                <span className="inline-block px-1.5 py-0.5 rounded text-xs font-medium bg-zinc-100 text-zinc-600 border border-zinc-300">
                  {row.type}
                </span>
              </td>
              <td className="py-2 px-3 text-zinc-600">{row.domain}</td>
              <td className="py-2 px-3 text-zinc-400">{row.cjFunction}</td>
              <td className="py-2 px-3 text-zinc-600 text-xs">{row.errorPattern}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── 7. Readiness Projection ──────────────────────────────────────
export function ReadinessProjection({
  score,
  preScore,
  postScore,
}: {
  score: number | null;
  preScore: number | null;
  postScore: number | null;
}) {
  if (score === null) {
    return (
      <div className="flex items-center justify-center h-48">
        <p className="text-sm text-zinc-400">Not enough data for readiness projection</p>
      </div>
    );
  }

  const passingThreshold = 950;
  const minScale = 700;
  const maxScale = 1100;
  const range = maxScale - minScale;
  const scorePos = ((score - minScale) / range) * 100;
  const passingPos = ((passingThreshold - minScale) / range) * 100;
  const isPassing = score >= passingThreshold;

  // Projected range
  const projLow = Math.max(minScale, score - 20);
  const projHigh = Math.min(maxScale, score + 20);
  const projLowPos = ((projLow - minScale) / range) * 100;
  const projWidth = ((projHigh - projLow) / range) * 100;

  return (
    <div className="space-y-6">
      <h4 className="text-sm font-medium text-zinc-700">NREMT Scaled Score Projection (100 – 1,500 Scale)</h4>

      {/* Scale bar */}
      <div className="relative h-14 mt-8 mb-12">
        {/* Background gradient */}
        <div className="absolute inset-x-0 top-4 h-6 rounded-full overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-red-500/40 via-amber-500/30 to-emerald-500/40" />
        </div>

        {/* Projected range highlight */}
        <div
          className="absolute top-3 h-8 rounded-md border-2 border-emerald-400/40 bg-emerald-600/10"
          style={{ left: `${projLowPos}%`, width: `${projWidth}%` }}
        />

        {/* Passing threshold line */}
        <div
          className="absolute top-0 bottom-0 w-px"
          style={{ left: `${passingPos}%` }}
        >
          <div className="w-px h-full bg-red-600" />
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap">
            <span className="text-xs font-bold text-red-600">{passingThreshold} PASSING</span>
          </div>
        </div>

        {/* Score marker */}
        <div
          className="absolute top-2"
          style={{ left: `${scorePos}%`, transform: 'translateX(-50%)' }}
        >
          <div className={`w-5 h-5 rounded-full border-2 ${isPassing ? 'bg-emerald-600 border-emerald-300' : 'bg-amber-400 border-amber-300'} shadow-lg`} />
          <div className="absolute -bottom-7 left-1/2 -translate-x-1/2 whitespace-nowrap">
            <span className={`text-sm font-bold ${isPassing ? 'text-emerald-600' : 'text-amber-600'}`}>~{score}</span>
          </div>
        </div>
      </div>

      {/* Readiness stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-8">
        {preScore !== null && (
          <div className="bg-zinc-100 border border-zinc-200 rounded-lg p-3 text-center">
            <p className="text-xs text-zinc-400">Pre-Test</p>
            <p className="text-lg font-bold text-zinc-700 tabular-nums">{preScore}%</p>
          </div>
        )}
        {postScore !== null && (
          <div className="bg-zinc-100 border border-zinc-200 rounded-lg p-3 text-center">
            <p className="text-xs text-zinc-400">Post-Test</p>
            <p className="text-lg font-bold text-zinc-700 tabular-nums">{postScore}%</p>
          </div>
        )}
        {preScore !== null && postScore !== null && (
          <div className="bg-zinc-100 border border-zinc-200 rounded-lg p-3 text-center">
            <p className="text-xs text-zinc-400">Improvement</p>
            <p className={`text-lg font-bold tabular-nums ${postScore > preScore ? 'text-emerald-600' : 'text-red-600'}`}>
              {postScore > preScore ? '+' : ''}{(postScore - preScore).toFixed(1)}%
            </p>
          </div>
        )}
        <div className="bg-zinc-100 border border-zinc-200 rounded-lg p-3 text-center">
          <p className="text-xs text-zinc-400">Projected Range</p>
          <p className={`text-lg font-bold tabular-nums ${isPassing ? 'text-emerald-600' : 'text-amber-600'}`}>
            {projLow} – {projHigh}
          </p>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="bg-zinc-100 border border-zinc-200 rounded-lg p-3 border-l-2 border-blue-400/40">
        <p className="text-xs text-zinc-400 leading-relaxed">
          <span className="font-medium text-zinc-600">Important:</span> These projections are estimates, not guarantees.
          Practice exams and the NREMT use different item pools, and the adaptive algorithm introduces variability.
        </p>
      </div>
    </div>
  );
}

// ─── Overall Score Summary Card ───────────────────────────────────
export function ScoreSummaryCard({
  preScore,
  postScore,
  change,
  preLabel,
  postLabel,
}: {
  preScore: number | null;
  postScore: number | null;
  change: number | null;
  preLabel?: string;
  postLabel?: string;
}) {
  return (
    <div className="grid grid-cols-3 gap-4">
      {preScore !== null && (
        <div className="section-card p-5 text-center">
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-400 mb-1">
            {preLabel ?? 'Pre-Test'}
          </p>
          <p className="text-3xl font-bold text-orange-400 tabular-nums">{preScore}%</p>
        </div>
      )}
      {postScore !== null && (
        <div className="section-card p-5 text-center">
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-400 mb-1">
            {postLabel ?? 'Post-Test'}
          </p>
          <p className="text-3xl font-bold text-teal-600 tabular-nums">{postScore}%</p>
        </div>
      )}
      {change !== null && (
        <div className="section-card p-5 text-center">
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-400 mb-1">Change</p>
          <p className={`text-3xl font-bold tabular-nums ${change > 0 ? 'text-emerald-600' : change < 0 ? 'text-red-600' : 'text-zinc-600'}`}>
            {change > 0 ? '+' : ''}{change.toFixed(1)}%
          </p>
        </div>
      )}
    </div>
  );
}
