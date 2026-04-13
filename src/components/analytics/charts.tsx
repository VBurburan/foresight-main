'use client';

import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine, Cell, Legend, LabelList,
} from 'recharts';
import {
  type CJFunctionScore,
  type DomainPerformance,
  type TEIPerformance,
  type HeatmapCell,
  type ErrorByCategory,
  type SpecificError,
  scoreColor,
  heatmapColor,
  heatmapBorder,
  formatDelta,
  deltaColor,
} from '@/lib/analytics';

const CHART_POST = '#2563eb';  // blue-600 (primary data color)
const PASSING = 70;

const tooltipStyle = {
  borderRadius: '10px',
  border: '1px solid rgba(0,0,0,0.08)',
  backgroundColor: '#ffffff',
  color: '#18181b',
  fontSize: 12,
  boxShadow: '0 8px 30px rgba(0,0,0,0.1)',
};

// ─── Objective Insight Box ───────────────────────────────────────
export function InsightBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-4 bg-slate-50 border border-slate-200 rounded-lg p-4 border-l-4 border-l-blue-400">
      <p className="text-sm text-slate-700 leading-relaxed">{children}</p>
    </div>
  );
}

// ─── 1. Clinical Judgment Radar Chart ─────────────────────────────
export function CJRadarChart({ data }: { data: CJFunctionScore[] }) {
  const radarData = data.map((d) => ({
    subject: d.shortName,
    'Score': d.post ?? 0,
    fullMark: 100,
  }));

  const hasPost = data.some((d) => d.post !== null);

  // Compute insight
  const scored = data.filter((d) => d.post !== null);
  const strongest = scored.length > 0
    ? scored.reduce((a, b) => ((a.post ?? 0) > (b.post ?? 0) ? a : b))
    : null;
  const weakest = scored.length > 0
    ? scored.reduce((a, b) => ((a.post ?? 0) < (b.post ?? 0) ? a : b))
    : null;

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
          {hasPost && (
            <Radar
              name="Score"
              dataKey="Score"
              stroke={CHART_POST}
              fill={CHART_POST}
              fillOpacity={0.15}
              strokeWidth={2.5}
              dot={{ r: 4, fill: CHART_POST, stroke: '#ffffff', strokeWidth: 2 }}
            />
          )}
          <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v}%`]} />
        </RadarChart>
      </ResponsiveContainer>

      {/* Data table below radar */}
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-800 text-white">
              <th className="text-left py-2.5 px-3 text-xs font-medium uppercase tracking-wider">Cognitive Function</th>
              <th className="text-center py-2.5 px-3 text-xs font-medium uppercase tracking-wider">Score</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr key={row.function} className="border-b border-zinc-100 hover:bg-zinc-50">
                <td className="py-2 px-3 text-zinc-700 font-medium">{row.function}</td>
                <td className={`py-2 px-3 text-center tabular-nums font-semibold ${scoreColor(row.post ?? 0)}`}>
                  {row.post !== null ? `${row.post.toFixed(1)}%` : '--'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {strongest && weakest && strongest.function !== weakest.function && (
        <InsightBox>
          Highest-performing CJ function: <strong>{strongest.function}</strong> ({strongest.post?.toFixed(1)}%).
          {' '}Lowest: <strong>{weakest.function}</strong> ({weakest.post?.toFixed(1)}%).
          {(weakest.post ?? 0) < 60 && ` ${weakest.function} is below 60% and may need targeted reinforcement.`}
        </InsightBox>
      )}
    </div>
  );
}

// ─── 2. Domain Performance Bars ───────────────────────────────────
export function DomainBars({ data }: { data: DomainPerformance[] }) {
  const chartData = data.map((d) => ({
    domain: d.domain.length > 22 ? d.domain.slice(0, 20) + '...' : d.domain,
    fullDomain: d.domain,
    Score: d.post ?? 0,
  }));

  // Compute insights
  const belowPassing = data.filter((d) => (d.post ?? 0) < PASSING);
  const aboveEighty = data.filter((d) => (d.post ?? 0) >= 80);
  const totalCorrect = data.reduce((s, d) => s + d.correct, 0);
  const totalAll = data.reduce((s, d) => s + d.total, 0);

  return (
    <div>
      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={chartData} barCategoryGap="15%">
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
          <ReferenceLine y={PASSING} stroke="#dc2626" strokeDasharray="6 4" strokeWidth={1.5} label={{ value: `${PASSING}% Passing`, position: 'right', fill: '#dc2626', fontSize: 11, fontWeight: 600 }} />
          <Bar dataKey="Score" fill={CHART_POST} radius={[3, 3, 0, 0]} maxBarSize={48}>
            <LabelList dataKey="Score" position="top" formatter={(v: number) => `${v}%`} style={{ fill: '#3f3f46', fontSize: 11, fontWeight: 600 }} />
            {chartData.map((entry, i) => (
              <Cell key={i} fill={entry.Score >= 80 ? '#16a34a' : entry.Score >= PASSING ? '#2563eb' : entry.Score >= 60 ? '#d97706' : '#dc2626'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Domain data table with correct/total */}
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-800 text-white">
              <th className="text-left py-2.5 px-3 text-xs font-medium uppercase tracking-wider">Domain</th>
              <th className="text-center py-2.5 px-3 text-xs font-medium uppercase tracking-wider">Correct / Total</th>
              <th className="text-center py-2.5 px-3 text-xs font-medium uppercase tracking-wider">Score</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr key={row.domain} className="border-b border-zinc-100 hover:bg-zinc-50">
                <td className="py-2 px-3 text-zinc-700 font-medium">{row.domain}</td>
                <td className="py-2 px-3 text-center text-zinc-600 tabular-nums">
                  {row.total > 0 ? `${row.correct} / ${row.total}` : '--'}
                </td>
                <td className={`py-2 px-3 text-center font-semibold tabular-nums ${scoreColor(row.post ?? 0)}`}>
                  {row.post !== null ? `${row.post}%` : '--'}
                </td>
              </tr>
            ))}
            {totalAll > 0 && (
              <tr className="bg-zinc-50 font-semibold border-t-2 border-zinc-300">
                <td className="py-2 px-3 text-zinc-900">Total</td>
                <td className="py-2 px-3 text-center text-zinc-700 tabular-nums">{totalCorrect} / {totalAll}</td>
                <td className={`py-2 px-3 text-center tabular-nums ${scoreColor(totalAll > 0 ? Math.round((totalCorrect / totalAll) * 100) : 0)}`}>
                  {totalAll > 0 ? `${Math.round((totalCorrect / totalAll) * 100)}%` : '--'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <InsightBox>
        {totalAll > 0 && <>Overall: <strong>{totalCorrect} of {totalAll}</strong> questions answered correctly ({Math.round((totalCorrect / totalAll) * 100)}%). </>}
        {belowPassing.length > 0 && (
          <>{belowPassing.length} domain{belowPassing.length > 1 ? 's' : ''} below {PASSING}% passing threshold: {belowPassing.map((d) => d.domain).join(', ')}. </>
        )}
        {belowPassing.length === 0 && aboveEighty.length > 0 && (
          <>All domains at or above passing. {aboveEighty.length} domain{aboveEighty.length > 1 ? 's' : ''} above 80%.</>
        )}
      </InsightBox>
    </div>
  );
}

// ─── 3. TEI Format Performance ────────────────────────────────────
export function TEIBars({ data }: { data: TEIPerformance[] }) {
  const chartData = data.map((d) => ({
    type: d.type,
    label: d.label,
    Score: d.post ?? 0,
  }));

  const belowPassing = data.filter((d) => (d.post ?? 0) < PASSING);
  const totalCorrect = data.reduce((s, d) => s + (d.postCorrect ?? 0), 0);
  const totalAll = data.reduce((s, d) => s + (d.postTotal ?? 0), 0);

  return (
    <div>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={chartData} barCategoryGap="20%">
          <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" vertical={false} />
          <XAxis dataKey="type" tick={{ fill: '#a1a1aa', fontSize: 12 }} axisLine={{ stroke: '#27272a' }} tickLine={false} />
          <YAxis domain={[0, 100]} tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} width={36} tickFormatter={(v) => `${v}%`} />
          <Tooltip
            contentStyle={tooltipStyle}
            formatter={(v: number, name: string, props: any) => {
              const d = data.find((t) => t.type === props.payload?.type);
              const detail = d?.postTotal ? ` (${d.postCorrect}/${d.postTotal})` : '';
              return [`${v}%${detail}`];
            }}
          />
          <ReferenceLine y={PASSING} stroke="#dc2626" strokeDasharray="6 4" strokeWidth={1.5} label={{ value: `${PASSING}%`, position: 'right', fill: '#dc2626', fontSize: 11, fontWeight: 600 }} />
          <Bar dataKey="Score" radius={[3, 3, 0, 0]} maxBarSize={48}>
            <LabelList dataKey="Score" position="top" formatter={(v: number) => `${v}%`} style={{ fill: '#3f3f46', fontSize: 11, fontWeight: 600 }} />
            {chartData.map((entry, i) => (
              <Cell key={i} fill={entry.Score >= 80 ? '#16a34a' : entry.Score >= PASSING ? '#2563eb' : entry.Score >= 60 ? '#d97706' : '#dc2626'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* TEI data table with correct/total */}
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-800 text-white">
              <th className="text-left py-2.5 px-3 text-xs font-medium uppercase tracking-wider">Format</th>
              <th className="text-left py-2.5 px-3 text-xs font-medium uppercase tracking-wider">Description</th>
              <th className="text-center py-2.5 px-3 text-xs font-medium uppercase tracking-wider">Correct / Total</th>
              <th className="text-center py-2.5 px-3 text-xs font-medium uppercase tracking-wider">Accuracy</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr key={row.type} className="border-b border-zinc-100 hover:bg-zinc-50">
                <td className="py-2 px-3">
                  <span className="inline-block px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-300">{row.type}</span>
                </td>
                <td className="py-2 px-3 text-zinc-600">{row.label}</td>
                <td className="py-2 px-3 text-center text-zinc-600 tabular-nums">
                  {row.postTotal ? `${row.postCorrect} / ${row.postTotal}` : '--'}
                </td>
                <td className={`py-2 px-3 text-center font-semibold tabular-nums ${scoreColor(row.post ?? 0)}`}>
                  {row.post !== null ? `${row.post}%` : '--'}
                </td>
              </tr>
            ))}
            {totalAll > 0 && (
              <tr className="bg-zinc-50 font-semibold border-t-2 border-zinc-300">
                <td className="py-2 px-3 text-zinc-900" colSpan={2}>Total</td>
                <td className="py-2 px-3 text-center text-zinc-700 tabular-nums">{totalCorrect} / {totalAll}</td>
                <td className={`py-2 px-3 text-center tabular-nums ${scoreColor(totalAll > 0 ? Math.round((totalCorrect / totalAll) * 100) : 0)}`}>
                  {totalAll > 0 ? `${Math.round((totalCorrect / totalAll) * 100)}%` : '--'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {belowPassing.length > 0 && (
        <InsightBox>
          {belowPassing.length} TEI format{belowPassing.length > 1 ? 's' : ''} below {PASSING}%: {belowPassing.map((d) => `${d.type} (${d.label}) at ${d.post}%`).join(', ')}.
          {' '}These question types may require additional practice.
        </InsightBox>
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

  // Find weakest cells for insight
  const weakCells = [...data]
    .filter((d) => d.total >= 2 && d.percentage < 50)
    .sort((a, b) => a.percentage - b.percentage)
    .slice(0, 3);

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-800 text-white">
              <th className="text-left py-2.5 px-3 text-xs font-medium uppercase tracking-wider min-w-[140px]">Domain</th>
              {teiTypes.map((t) => (
                <th key={t} className="text-center py-2.5 px-3 text-xs font-medium uppercase tracking-wider min-w-[80px]">{t}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {domains.map((domain) => (
              <tr key={domain}>
                <td className="py-1.5 px-3 text-zinc-700 text-xs font-medium">{domain}</td>
                {teiTypes.map((tei) => {
                  const cell = getCell(domain, tei);
                  if (!cell || cell.total === 0) {
                    return (
                      <td key={tei} className="py-1 px-1">
                        <div className="flex items-center justify-center h-14 rounded-md bg-zinc-50 text-zinc-400 text-xs">--</div>
                      </td>
                    );
                  }
                  return (
                    <td key={tei} className="py-1 px-1">
                      <div className={`flex flex-col items-center justify-center h-14 rounded-md border ${heatmapColor(cell.percentage)} ${heatmapBorder(cell.percentage)} transition-colors`}>
                        <span className="text-sm font-bold tabular-nums">{cell.percentage}%</span>
                        <span className="text-[10px] opacity-70 tabular-nums">{cell.correct}/{cell.total}</span>
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Color legend */}
      <div className="flex items-center gap-4 mt-3 text-xs text-zinc-500">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-100 border border-red-400/20" /> &lt;40%</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-amber-50 border border-amber-400/20" /> 40–59%</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-emerald-50 border border-emerald-500/20" /> 60–79%</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-emerald-100 border border-emerald-400/30" /> 80%+</span>
      </div>

      {weakCells.length > 0 && (
        <InsightBox>
          Weakest intersections: {weakCells.map((c) => `${c.domain} × ${c.teiType} (${c.correct}/${c.total}, ${c.percentage}%)`).join('; ')}.
          {' '}These combinations show where content knowledge and format difficulty overlap.
        </InsightBox>
      )}
    </div>
  );
}

// ─── 5. Error Distribution — Horizontal Bars (replaces donuts) ───
export function ErrorDistribution({
  byDomain,
  byTEI,
}: {
  byDomain: ErrorByCategory[];
  byTEI: ErrorByCategory[];
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {byDomain.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-zinc-700 mb-3">Error Rate by Domain</h4>
          <ResponsiveContainer width="100%" height={Math.max(180, byDomain.length * 40)}>
            <BarChart data={byDomain} layout="vertical" barCategoryGap="20%">
              <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" horizontal={false} />
              <XAxis type="number" domain={[0, 100]} tick={{ fill: '#71717a', fontSize: 11 }} tickFormatter={(v) => `${v}%`} />
              <YAxis type="category" dataKey="name" tick={{ fill: '#52525b', fontSize: 11 }} width={140} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v}% error rate`]} />
              <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={24}>
                <LabelList dataKey="value" position="right" formatter={(v: number) => `${v}%`} style={{ fill: '#52525b', fontSize: 11, fontWeight: 500 }} />
                {byDomain.map((entry, i) => (
                  <Cell key={i} fill={entry.value > 30 ? '#dc2626' : entry.value > 15 ? '#d97706' : '#16a34a'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
      {byTEI.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-zinc-700 mb-3">Error Rate by TEI Format</h4>
          <ResponsiveContainer width="100%" height={Math.max(180, byTEI.length * 40)}>
            <BarChart data={byTEI} layout="vertical" barCategoryGap="20%">
              <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" horizontal={false} />
              <XAxis type="number" domain={[0, 100]} tick={{ fill: '#71717a', fontSize: 11 }} tickFormatter={(v) => `${v}%`} />
              <YAxis type="category" dataKey="name" tick={{ fill: '#52525b', fontSize: 11 }} width={80} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v}% error rate`]} />
              <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={24}>
                <LabelList dataKey="value" position="right" formatter={(v: number) => `${v}%`} style={{ fill: '#52525b', fontSize: 11, fontWeight: 500 }} />
                {byTEI.map((entry, i) => (
                  <Cell key={i} fill={entry.value > 30 ? '#dc2626' : entry.value > 15 ? '#d97706' : '#16a34a'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

// ─── 6. Specific Error Table ──────────────────────────────────────
export function SpecificErrorTable({ data }: { data: SpecificError[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-slate-800 text-white">
            <th className="text-left py-2.5 px-3 text-xs font-medium uppercase tracking-wider">Q#</th>
            <th className="text-left py-2.5 px-3 text-xs font-medium uppercase tracking-wider">Type</th>
            <th className="text-left py-2.5 px-3 text-xs font-medium uppercase tracking-wider">Domain</th>
            <th className="text-left py-2.5 px-3 text-xs font-medium uppercase tracking-wider">CJ Function</th>
            <th className="text-left py-2.5 px-3 text-xs font-medium uppercase tracking-wider">Error Pattern</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i} className="border-b border-zinc-100 hover:bg-zinc-50 transition-colors">
              <td className="py-2 px-3 text-zinc-600 font-mono tabular-nums">{row.questionNumber}</td>
              <td className="py-2 px-3">
                <span className="inline-block px-1.5 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600 border border-slate-300">
                  {row.type}
                </span>
              </td>
              <td className="py-2 px-3 text-zinc-600">{row.domain}</td>
              <td className="py-2 px-3 text-zinc-500">{row.cjFunction}</td>
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

  const projLow = Math.max(minScale, score - 20);
  const projHigh = Math.min(maxScale, score + 20);
  const projLowPos = ((projLow - minScale) / range) * 100;
  const projWidth = ((projHigh - projLow) / range) * 100;

  return (
    <div className="space-y-6">
      <h4 className="text-sm font-medium text-zinc-700">NREMT Scaled Score Projection (100 – 1,500 Scale)</h4>

      <div className="relative h-14 mt-8 mb-12">
        <div className="absolute inset-x-0 top-4 h-6 rounded-full overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-red-500/40 via-amber-500/30 to-emerald-500/40" />
        </div>

        <div
          className="absolute top-3 h-8 rounded-md border-2 border-emerald-600/40 bg-emerald-600/10"
          style={{ left: `${projLowPos}%`, width: `${projWidth}%` }}
        />

        <div
          className="absolute top-0 bottom-0 w-px"
          style={{ left: `${passingPos}%` }}
        >
          <div className="w-px h-full bg-red-600" />
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap">
            <span className="text-xs font-bold text-red-600">{passingThreshold} PASSING</span>
          </div>
        </div>

        <div
          className="absolute top-2"
          style={{ left: `${scorePos}%`, transform: 'translateX(-50%)' }}
        >
          <div className={`w-5 h-5 rounded-full border-2 ${isPassing ? 'bg-emerald-600 border-emerald-500' : 'bg-amber-500 border-amber-500'} shadow-lg`} />
          <div className="absolute -bottom-7 left-1/2 -translate-x-1/2 whitespace-nowrap">
            <span className={`text-sm font-bold ${isPassing ? 'text-emerald-600' : 'text-amber-600'}`}>~{score}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-8">
        {postScore !== null && (
          <div className="bg-zinc-100 border border-zinc-200 rounded-lg p-3 text-center">
            <p className="text-xs text-zinc-400">Score</p>
            <p className="text-lg font-bold text-zinc-700 tabular-nums">{postScore}%</p>
          </div>
        )}
        <div className="bg-zinc-100 border border-zinc-200 rounded-lg p-3 text-center">
          <p className="text-xs text-zinc-400">Projected Range</p>
          <p className={`text-lg font-bold tabular-nums ${isPassing ? 'text-emerald-600' : 'text-amber-600'}`}>
            {projLow} – {projHigh}
          </p>
        </div>
        <div className="bg-zinc-100 border border-zinc-200 rounded-lg p-3 text-center">
          <p className="text-xs text-zinc-400">Status</p>
          <p className={`text-lg font-bold ${isPassing ? 'text-emerald-600' : 'text-amber-600'}`}>
            {isPassing ? 'Above Threshold' : 'Below Threshold'}
          </p>
        </div>
      </div>

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
            {preLabel ?? 'Cohort Avg'}
          </p>
          <p className="text-3xl font-bold text-orange-600 tabular-nums">{preScore}%</p>
        </div>
      )}
      {postScore !== null && (
        <div className="section-card p-5 text-center">
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-400 mb-1">
            {postLabel ?? 'Score'}
          </p>
          <p className="text-3xl font-bold text-blue-600 tabular-nums">{postScore}%</p>
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
