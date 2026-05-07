'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Building2,
  CheckCircle,
  TrendingUp,
} from 'lucide-react'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import { Bar, BarChart, CartesianGrid, Cell, LabelList, Pie, PieChart, XAxis, YAxis } from 'recharts'
import { cn } from '@/lib/utils'
import { useComplianceDashboardGraph } from '@/features/compliance/hooks'
import type { ComplianceDashboardChartColors } from '@/features/compliance/dashboard-graph'
import { useCensusYearsList } from '@/features/census-year/useCensusYearsManagement'
import { useEventListing } from '@/features/events/hooks'

const TOP_EVENTS_BY_COMMUNITY_LIMIT = 8

const DEFAULT_COLORS: ComplianceDashboardChartColors = {
  navy: '#1e3a8a',
  royal: '#2563eb',
  light_blue: '#93c5fd',
  sky_fill: '#dbeafe',
}

function formatInt(n: number) {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(n)
}

function formatPct(n: number, digits = 1) {
  return `${n.toFixed(digits)}%`
}

function TopCommunitiesYAxisTick({
  x,
  y,
  payload,
  sitesByName,
}: {
  x?: string | number
  y?: string | number
  payload?: { value?: unknown }
  sitesByName: Map<string, number>
}) {
  const xNum = typeof x === 'number' ? x : Number(x ?? 0) || 0
  const yNum = typeof y === 'number' ? y : Number(y ?? 0) || 0
  const name = typeof payload?.value === 'string' ? payload.value : String(payload?.value ?? '')
  const sites = sitesByName.get(name) ?? 0
  return (
    <g transform={`translate(${xNum},${yNum})`}>
      <text x={0} y={0} dy={-5} textAnchor='end' className='fill-foreground' style={{ fontSize: 11, fontWeight: 600 }}>
        {name}
      </text>
      <text x={0} y={0} dy={9} textAnchor='end' className='fill-muted-foreground' style={{ fontSize: 10 }}>
        {formatInt(sites)} sites
      </text>
    </g>
  )
}

/** Ranked list + proportional bars vs leader — clearer than a cramped horizontal chart for ≤10 rows */
function TopEventsLeaderboard({
  rows,
  accentColor,
}: {
  rows: { name: string; events: number }[]
  accentColor: string
}) {
  const maxEvents = rows.reduce((m, r) => Math.max(m, r.events), 0) || 1

  return (
    <div className='flex max-h-[520px] min-h-[380px] flex-col'>
      <ul className='flex-1 space-y-2 overflow-y-auto pr-1'>
        {rows.map((row, i) => {
          const pct = maxEvents > 0 ? Math.round((row.events / maxEvents) * 100) : 0
          const rank = i + 1
          const rankMuted = rank > 3
          return (
            <li
              key={`${row.name}-${rank}`}
              className='rounded-lg border border-border/70 bg-card px-3 py-2.5 shadow-[0_1px_2px_rgba(15,23,42,0.03)]'
            >
              <div className='flex gap-3'>
                <span
                  className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-xs font-bold tabular-nums',
                    rankMuted ? 'bg-muted text-muted-foreground' : 'bg-primary/12 text-primary',
                  )}
                  aria-hidden
                >
                  {rank}
                </span>
                <div className='min-w-0 flex-1'>
                  <div className='flex items-start justify-between gap-2'>
                    <p className='truncate text-sm font-medium leading-tight text-foreground' title={row.name}>
                      {row.name}
                    </p>
                    <div className='shrink-0 text-right'>
                      <span className='tabular-nums text-sm font-semibold text-foreground'>{formatInt(row.events)}</span>
                      <span className='ml-1 text-xs font-normal text-muted-foreground'>
                        {row.events === 1 ? 'event' : 'events'}
                      </span>
                    </div>
                  </div>
                  <div className='mt-2 h-1.5 overflow-hidden rounded-full bg-muted' aria-hidden>
                    <div
                      className='h-full max-w-full rounded-full transition-[width] duration-500 ease-out'
                      style={{ width: `${pct}%`, backgroundColor: accentColor }}
                    />
                  </div>
                </div>
              </div>
            </li>
          )
        })}
      </ul>
      <p className='mt-3 border-t border-border/50 pt-3 text-[11px] leading-snug text-muted-foreground'>
        Bar length shows each community&apos;s share of the highest count ({formatInt(maxEvents)} events).
      </p>
    </div>
  )
}

function normalizeSiteStatus(status: string): 'Active' | 'Inactive' | 'Pending' {
  const s = status.trim().toLowerCase()
  if (s === 'active') return 'Active'
  if (s === 'inactive') return 'Inactive'
  return 'Pending'
}

function StatusBadge({ status }: { status: 'Active' | 'Inactive' | 'Pending' }) {
  const styles = {
    Active: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    Inactive: 'bg-red-50 text-red-800 border-red-200',
    Pending: 'bg-muted text-foreground border-border',
  }
  return (
    <Badge variant='outline' className={cn('rounded-full px-2.5 py-0.5 text-xs font-medium', styles[status])}>
      {status}
    </Badge>
  )
}

function KpiCard({
  title,
  value,
  hint,
  icon: Icon,
  trend,
  trendDown,
  accentBorder,
}: {
  title: string
  value: string
  hint: string
  icon: typeof Building2
  trend?: string
  trendDown?: boolean
  accentBorder: string
}) {
  return (
    <Card className={cn('overflow-hidden border-t-[3px]', accentBorder)}>
      <CardContent className='p-5'>
        <div className='flex items-start justify-between gap-3'>
          <div className='space-y-3'>
            <p className='text-xs font-semibold uppercase tracking-wide text-muted-foreground'>{title}</p>
            <p className='text-3xl font-bold tabular-nums tracking-tight text-foreground'>{value}</p>
            <p className='text-xs text-muted-foreground'>{hint}</p>
          </div>
          <div className='flex flex-col items-end gap-2'>
            <div className='flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-primary'>
              <Icon className='h-4 w-4' />
            </div>
            {trend != null && trend !== '' && (
              <span
                className={cn(
                  'flex items-center gap-0.5 text-xs font-semibold tabular-nums',
                  trendDown ? 'text-orange-600' : 'text-emerald-600',
                )}
              >
                {trendDown ? <ArrowDownRight className='h-3.5 w-3.5' /> : <ArrowUpRight className='h-3.5 w-3.5' />}
                {trend}
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function PlatformDashboard() {
  const [selectedYear, setSelectedYear] = useState<number | null>(null)

  const { data: censusYearsData, isLoading: censusYearsLoading } = useCensusYearsList({
    page: 1,
    limit: 100,
  })

  const censusYearOptions = useMemo(() => {
    const rows = censusYearsData?.results ?? []
    return [...rows].sort((a, b) => b.year - a.year)
  }, [censusYearsData?.results])

  useEffect(() => {
    if (selectedYear != null || censusYearOptions.length === 0) return
    setSelectedYear(censusYearOptions[0]!.year)
  }, [censusYearOptions, selectedYear])

  const graphParams =
    selectedYear != null
      ? {
          year: selectedYear,
          exclude_events: true,
          top_communities_limit: 15,
          sites_table_limit: 20,
        }
      : null

  const { data, isLoading: graphLoading, isError, error, refetch } = useComplianceDashboardGraph(
    graphParams,
    selectedYear != null,
  )

  const colors = data?.chart_colors ?? DEFAULT_COLORS
  const NAVY = colors.navy
  const ROYAL = colors.royal
  const LIGHT_BLUE = colors.light_blue
  const SKY_FILL = colors.sky_fill

  const eventListingFilters = useMemo(
    () => ({
      year: selectedYear ?? 0,
      page: 1,
      limit: 250,
    }),
    [selectedYear],
  )

  const {
    data: eventListingData,
    isLoading: eventListingLoading,
    isFetching: eventListingFetching,
    isError: eventListingIsError,
    refetch: refetchEventListing,
  } = useEventListing(eventListingFilters)

  const topEventsByCommunity = useMemo(() => {
    const apiRows = data?.top_communities_events
    if (apiRows?.length) {
      return [...apiRows]
        .filter((r) => r.events > 0)
        .sort((a, b) => b.events - a.events)
        .slice(0, TOP_EVENTS_BY_COMMUNITY_LIMIT)
        .map((r) => ({ name: r.name, events: r.events }))
    }
    const results = eventListingData?.results ?? []
    const derived = results.map((r) => ({
      name: r.community.name,
      events: Array.isArray(r.Events) ? r.Events.length : 0,
    }))
    derived.sort((a, b) => b.events - a.events)
    return derived
      .filter((r) => r.events > 0)
      .slice(0, TOP_EVENTS_BY_COMMUNITY_LIMIT)
  }, [data?.top_communities_events, eventListingData?.results])

  const sitesByCommunityName = useMemo(() => {
    const m = new Map<string, number>()
    for (const row of data?.top_communities ?? []) {
      m.set(row.name, row.sites)
    }
    return m
  }, [data?.top_communities])

  const programBars = useMemo(
    () =>
      (data?.program_compliance ?? []).map((p) => ({
        program: p.program_display || p.program,
        compliant: p.compliant,
        shortfall: p.shortfall,
      })),
    [data?.program_compliance],
  )

  const donutConfig = useMemo(() => {
    const slices = data?.donut ?? []
    const cfg: Record<string, { label: string; color: string }> = {}
    for (const d of slices) {
      cfg[d.name] = { label: d.name, color: d.fill }
    }
    return cfg
  }, [data?.donut])

  const loadingShell = censusYearsLoading || (selectedYear != null && graphLoading)
  /** First fetch for this year — avoid mounting Recharts with empty payloads */
  const graphAwaitingData = selectedYear != null && graphLoading && !data

  const eventsChartNeedsListing = !data?.top_communities_events?.length
  const eventsChartLoading =
    Boolean(selectedYear) && eventsChartNeedsListing && (eventListingLoading || eventListingFetching) && !eventListingData

  return (
    <DashboardLayout
      complianceChrome
      title='Compliance Dashboard'
      description='Monitor municipal sites, program coverage, and reporting health across all regions.'
      breadcrumb={[{ label: 'Arc Ontario', href: '/dashboard' }, 'Dashboard']}
    >
      <div className='flex flex-wrap items-center justify-end gap-3'>
        <p className='text-sm text-muted-foreground'>Census Year</p>
        <Select
          value={selectedYear != null ? String(selectedYear) : ''}
          onValueChange={(v) => setSelectedYear(Number.parseInt(v, 10))}
          disabled={censusYearsLoading || censusYearOptions.length === 0}
        >
          <SelectTrigger className='h-10 w-[140px] shadow-sm'>
            <SelectValue placeholder={censusYearsLoading ? 'Loading years…' : 'Census year'} />
          </SelectTrigger>
          <SelectContent>
            {censusYearOptions.map((cy) => (
              <SelectItem key={cy.id} value={String(cy.year)}>
                {cy.year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isError && (
        <Alert variant='destructive' className='mt-4'>
          <AlertTitle>Could not load dashboard</AlertTitle>
          <AlertDescription className='flex flex-wrap items-center gap-3'>
            <span>{error instanceof Error ? error.message : 'Request failed'}</span>
            <Button type='button' variant='outline' size='sm' onClick={() => refetch()}>
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {!censusYearsLoading && censusYearOptions.length === 0 && (
        <Alert className='mt-4'>
          <AlertTitle>No census years</AlertTitle>
          <AlertDescription>Add a census year to load dashboard metrics.</AlertDescription>
        </Alert>
      )}

      {/* KPI strip */}
      <div className='mb-8 mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4'>
        <KpiCard
          title='Total Sites'
          value={data ? formatInt(data.kpi.total_site_rows) : loadingShell ? '…' : '—'}
          hint={
            data
              ? `${formatInt(data.kpi.municipalities_tracked)} municipalities tracked`
              : 'Sites in scope for selected year'
          }
          icon={Building2}
          accentBorder='border-t-[#2563eb]'
        />
        <KpiCard
          title='Compliance rate'
          value={data ? formatPct((data.compliance_summary?.overall_rate ?? data.kpi.compliance_rate_municipalities_pct)) : loadingShell ? '…' : '—'}
          hint={
            data
              ? `${formatInt((data.compliance_summary?.compliant_communities ?? data.kpi.municipalities_compliant_no_shortfall))} compliant communities`
              : 'Municipalities meeting targets'
          }
          icon={CheckCircle}
          accentBorder='border-t-emerald-600'
        />
        <KpiCard
          title='Totol Communities'
          value={data ? formatInt(data.kpi.municipalities_with_calculations) : loadingShell ? '…' : '—'}
          hint={data ? `${formatInt(data.kpi.total_shortfall_units)} total shortfall units` : 'Any program shortfall'}
          icon={AlertTriangle}
          accentBorder='border-t-amber-500'
        />
        <KpiCard
          title='Excess units'
          value={data ? formatInt(data.kpi.total_excess_units) : loadingShell ? '…' : '—'}
          hint={
            data
              ? `${formatInt(data.kpi.municipalities_excess_only)} excess-only municipalities`
              : 'Available vs requirement'
          }
          icon={TrendingUp}
          accentBorder='border-t-[#1e3a8a]'
        />
      </div>

      {/* Top communities + top events */}
      <div className='mb-8 grid gap-6 lg:grid-cols-12'>
        <Card className='lg:col-span-8'>
          <CardHeader className='flex flex-row flex-wrap items-center justify-between gap-4 pb-2'>
            <div>
              <CardTitle className='text-base font-semibold'>Top communities</CardTitle>
              <CardDescription className='text-xs'>
                Municipalities with the most sites — site totals shown under each name.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className='pt-0'>
            {graphAwaitingData ? (
              <div className='flex min-h-[420px] items-center justify-center text-sm text-muted-foreground'>
                Loading communities…
              </div>
            ) : (data?.top_communities?.length ?? 0) === 0 ? (
              <div className='flex min-h-[420px] items-center justify-center text-sm text-muted-foreground'>
                No communities ranked.
              </div>
            ) : (
              <ChartContainer
                config={{ sites: { label: 'Sites', color: NAVY } }}
                className='aspect-auto h-[520px] w-full'
              >
                <BarChart
                  layout='vertical'
                  data={data?.top_communities ?? []}
                  margin={{ top: 8, right: 44, bottom: 8, left: 8 }}
                  barCategoryGap={14}
                >
                  <CartesianGrid horizontal vertical={false} stroke='#e8ecf1' />
                  <XAxis type='number' tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis
                    type='category'
                    dataKey='name'
                    width={168}
                    interval={0}
                    axisLine={false}
                    tickLine={false}
                    tick={(tickProps) => <TopCommunitiesYAxisTick {...tickProps} sitesByName={sitesByCommunityName} />}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey='sites' fill={NAVY} radius={[0, 4, 4, 0]} barSize={14} maxBarSize={18}>
                    <LabelList
                      dataKey='sites'
                      position='right'
                      className='fill-foreground tabular-nums'
                      style={{ fontSize: 11, fontWeight: 600 }}
                    />
                  </Bar>
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        <Card className='lg:col-span-4'>
          <CardHeader className='pb-2'>
            <CardTitle className='text-base font-semibold text-foreground'>Top events</CardTitle>
            <CardDescription className='text-xs'>
              Ranked municipalities; progress bars show share of the leader (most events).
            </CardDescription>
          </CardHeader>
          <CardContent className='pt-0'>
            {!selectedYear ? (
              <div className='flex h-[520px] items-center justify-center text-sm text-muted-foreground'>
                Select a census year.
              </div>
            ) : graphAwaitingData ? (
              <div className='flex h-[520px] items-center justify-center text-sm text-muted-foreground'>
                Loading…
              </div>
            ) : eventsChartLoading ? (
              <div className='flex h-[520px] items-center justify-center text-sm text-muted-foreground'>
                Loading events…
              </div>
            ) : eventsChartNeedsListing && eventListingIsError ? (
              <div className='flex h-[520px] flex-col items-center justify-center gap-3 px-2 text-center text-sm'>
                <p className='text-muted-foreground'>Could not load event listing.</p>
                <Button type='button' variant='outline' size='sm' onClick={() => refetchEventListing()}>
                  Retry
                </Button>
              </div>
            ) : topEventsByCommunity.length === 0 ? (
              <div className='flex h-[520px] items-center justify-center px-2 text-center text-sm text-muted-foreground'>
                No event sites found for communities this year.
              </div>
            ) : (
              <TopEventsLeaderboard rows={topEventsByCommunity} accentColor={ROYAL} />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Program compliance + compliance status */}
      <div className='mb-8 grid gap-6 lg:grid-cols-12'>
        <Card className='lg:col-span-8'>
          <CardHeader className='pb-2'>
            <CardTitle className='text-base font-semibold text-foreground'>Program compliance</CardTitle>
            <CardDescription className='text-xs'>Compliant vs shortfall by stewardship program</CardDescription>
          </CardHeader>
          <CardContent className='pt-0'>
            {graphAwaitingData ? (
              <div className='flex h-[300px] items-center justify-center text-sm text-muted-foreground'>
                Loading programs…
              </div>
            ) : programBars.length === 0 ? (
              <div className='flex h-[300px] items-center justify-center text-sm text-muted-foreground'>
                No program breakdown.
              </div>
            ) : (
              <>
                <ChartContainer
                  config={{
                    compliant: { label: 'Compliant', color: NAVY },
                    shortfall: { label: 'Shortfall', color: SKY_FILL },
                  }}
                  className='aspect-auto h-[300px] w-full'
                >
                  <BarChart
                    data={programBars}
                    margin={{ top: 8, right: 8, left: 4, bottom: 8 }}
                    barGap={1}
                    barCategoryGap='28%'
                  >
                    <CartesianGrid strokeDasharray='3 3' stroke='#e8ecf1' vertical={false} />
                    <XAxis
                      dataKey='program'
                      tick={{ fontSize: 12, fill: '#334155' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} width={36} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey='compliant' fill={NAVY} radius={[3, 3, 0, 0]} maxBarSize={22} />
                    <Bar dataKey='shortfall' fill={LIGHT_BLUE} radius={[3, 3, 0, 0]} maxBarSize={22} />
                  </BarChart>
                </ChartContainer>
                <div className='mt-4 flex flex-wrap justify-center gap-6 text-xs text-muted-foreground'>
                  <span className='flex items-center gap-2'>
                    <span className='h-2.5 w-2.5 rounded-sm' style={{ backgroundColor: NAVY }} /> Compliant
                  </span>
                  <span className='flex items-center gap-2'>
                    <span className='h-2.5 w-2.5 rounded-sm' style={{ backgroundColor: LIGHT_BLUE }} /> Shortfall
                  </span>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card className='lg:col-span-4'>
          <CardHeader className='pb-2'>
            <CardTitle className='text-base font-semibold text-foreground'>Compliance status</CardTitle>
            <CardDescription className='text-xs'>Municipality distribution</CardDescription>
          </CardHeader>
          <CardContent className='flex flex-col items-center justify-center pt-0 lg:min-h-[340px]'>
            {graphAwaitingData ? (
              <div className='flex h-[220px] items-center justify-center text-sm text-muted-foreground'>
                Loading chart…
              </div>
            ) : (data?.donut?.length ?? 0) === 0 ? (
              <div className='flex h-[220px] items-center justify-center text-sm text-muted-foreground'>
                No distribution data.
              </div>
            ) : (
              <>
                <ChartContainer config={donutConfig} className='aspect-auto mx-auto h-[220px] w-full max-w-[260px]'>
                  <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Pie
                      data={data?.donut ?? []}
                      dataKey='value'
                      nameKey='name'
                      cx='50%'
                      cy='50%'
                      innerRadius={56}
                      outerRadius={78}
                      strokeWidth={2}
                      stroke='#fff'
                    >
                      {(data?.donut ?? []).map((entry, i) => (
                        <Cell key={`cell-${entry.name}-${i}`} fill={entry.fill} />
                      ))}
                    </Pie>
                  </PieChart>
                </ChartContainer>
                <ul className='mt-4 w-full space-y-2 border-t border-border/50 pt-4 text-sm'>
                  {(data?.donut_legend ?? []).map((row) => (
                    <li key={row.name} className='flex justify-between gap-2 tabular-nums'>
                      <span className='text-muted-foreground'>{row.label}</span>
                      <span className='font-semibold text-foreground'>{formatInt(row.count)}</span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* End dates + activity */}
      <div className='grid gap-6 lg:grid-cols-12'>
        <Card className='lg:col-span-5'>
          <CardHeader className='pb-3'>
            <CardTitle className='text-base font-semibold text-foreground'>Upcoming end dates</CardTitle>
            <CardDescription className='text-xs'>Sites approaching registration end</CardDescription>
          </CardHeader>
          <CardContent className='space-y-6 pt-0'>
            {graphAwaitingData ? (
              <div className='flex h-[320px] items-center justify-center text-sm text-muted-foreground'>
                Loading end dates…
              </div>
            ) : (
            <>
            <div className='space-y-4'>
              {(data?.end_date_buckets ?? []).map((row) => (
                <div key={row.key} className='flex items-center gap-3'>
                  <div className='h-2 flex-1 overflow-hidden rounded-full bg-muted'>
                    <div
                      className='h-full rounded-full transition-all'
                      style={{ width: `${Math.min(100, Math.max(0, row.pct))}%`, backgroundColor: row.fill }}
                    />
                  </div>
                  <span className='w-28 shrink-0 text-right text-xs tabular-nums text-muted-foreground'>
                    {formatInt(row.count)} sites
                  </span>
                </div>
              ))}
              <div className='flex justify-between border-t border-border/50 pt-2 text-[11px] text-muted-foreground'>
                {(data?.end_date_buckets ?? []).map((row) => (
                  <span key={row.key}>{row.label}</span>
                ))}
              </div>
            </div>
            <ChartContainer config={{ sites: { label: 'Sites', color: NAVY } }} className='aspect-auto h-[180px] w-full'>
              <BarChart data={data?.end_date_bar_chart ?? []} margin={{ top: 8, right: 8, left: 4, bottom: 28 }}>
                <CartesianGrid strokeDasharray='3 3' stroke='#e8ecf1' vertical={false} />
                <XAxis
                  dataKey='bucket'
                  tick={{ fontSize: 10, fill: '#64748b' }}
                  interval={0}
                  angle={-15}
                  textAnchor='end'
                  height={48}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} width={28} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey='sites' radius={[4, 4, 0, 0]} maxBarSize={40}>
                  {(data?.end_date_bar_chart ?? []).map((entry, i) => (
                    <Cell key={`end-${entry.bucket}-${i}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
            </>
            )}
          </CardContent>
        </Card>

        <Card className='lg:col-span-7'>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-3'>
            <div>
              <CardTitle className='text-base font-semibold text-foreground'>Site ending dates</CardTitle>
              <CardDescription className='text-xs'>Sites approaching closing dates</CardDescription>
            </div>
          </CardHeader>
          <CardContent className='pt-0'>
            {graphAwaitingData ? (
              <div className='py-12 text-center text-sm text-muted-foreground'>Loading sites…</div>
            ) : (data?.sites_ending_soon?.length ?? 0) === 0 ? (
              <div className='py-12 text-center text-sm text-muted-foreground'>No sites in this window.</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className='border-border hover:bg-transparent'>
                    <TableHead className='text-xs font-semibold uppercase tracking-wide text-muted-foreground'>Site</TableHead>
                    <TableHead className='text-xs font-semibold uppercase tracking-wide text-muted-foreground'>Program</TableHead>
                    <TableHead className='text-xs font-semibold uppercase tracking-wide text-muted-foreground'>Status</TableHead>
                    <TableHead className='text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground'>
                      Updated
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(data?.sites_ending_soon ?? []).map((row) => (
                    <TableRow key={`${row.site}-${row.sub}-${row.program}`} className='border-border/50'>
                      <TableCell className='py-3'>
                        <div className='font-medium text-foreground'>{row.site}</div>
                        <div className='text-xs text-muted-foreground'>{row.sub}</div>
                      </TableCell>
                      <TableCell className='py-3 text-sm text-foreground'>{row.program}</TableCell>
                      <TableCell className='py-3'>
                        <StatusBadge status={normalizeSiteStatus(row.status)} />
                      </TableCell>
                      <TableCell className='py-3 text-right text-sm tabular-nums text-muted-foreground'>{row.updated}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
