'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MapPin, AlertTriangle, CheckCircle, FileText } from 'lucide-react'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Skeleton } from '@/components/ui/skeleton'
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import type { ChartConfig } from '@/components/ui/chart'
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from 'recharts'
import { useCompliance } from '@/features/compliance'
import type { ComplianceFilters } from '@/features/compliance'

type TrendDatum = {
  year: string
  required: number
  actual: number
  shortfall: number
  excess: number
}

const numberFormatter = (value?: number) =>
  typeof value === 'number' ? value.toLocaleString('en-CA') : '--'

export default function Dashboard() {
  const filters = useMemo<ComplianceFilters>(() => ({ limit: 120, ordering: '-census_year' }), [])
  const { data, isLoading } = useCompliance(filters)

  const summary = data?.summary
  const complianceRate = summary?.overall_rate ?? 0
  const totalMunicipalities = data?.count ?? 0

  const trendData = useMemo<TrendDatum[]>(() => {
    if (!data?.results?.length) return []

    const grouped = data.results.reduce<Record<string, TrendDatum>>((acc, item) => {
      const yearLabel = item.census_year ? item.census_year.toString() : 'Unknown'
      if (!acc[yearLabel]) {
        acc[yearLabel] = {
          year: yearLabel,
          required: 0,
          actual: 0,
          shortfall: 0,
          excess: 0,
        }
      }

      acc[yearLabel].required += item.required_sites
      acc[yearLabel].actual += item.actual_sites
      acc[yearLabel].shortfall += item.shortfall
      acc[yearLabel].excess += item.excess

      return acc
    }, {})

    return Object.values(grouped).sort((a, b) => Number(a.year) - Number(b.year))
  }, [data?.results])

  const chartConfig = useMemo<ChartConfig>(
    () => ({
      required: {
        label: 'Required Sites',
        color: 'var(--chart-1)',
      },
      actual: {
        label: 'Actual Sites',
        color: 'var(--chart-2)',
      },
    }),
    [],
  )

  const programBreakdown = useMemo(() => {
    if (!data?.results?.length) return []

    const aggregated = data.results.reduce<Record<string, { program: string; required: number; actual: number }>>(
      (acc, item) => {
        const key = item.program || 'Other'
        if (!acc[key]) {
          acc[key] = { program: key, required: 0, actual: 0 }
        }
        acc[key].required += item.required_sites
        acc[key].actual += item.actual_sites
        return acc
      },
      {},
    )

    return Object.values(aggregated)
      .sort((a, b) => b.required - a.required)
      .slice(0, 5)
  }, [data?.results])

  const statusBreakdown = useMemo(() => {
    if (!data?.results?.length) return []

    const counts = data.results.reduce(
      (acc, item) => {
        const status = (item.status as 'compliant' | 'shortfall' | 'excess') || 'compliant'
        acc[status] += 1
        return acc
      },
      { compliant: 0, shortfall: 0, excess: 0 },
    )

    return (['compliant', 'shortfall', 'excess'] as const)
      .map((status) => ({ status, value: counts[status] }))
      .filter((entry) => entry.value > 0)
  }, [data?.results])

  const totalStatusCount = statusBreakdown.reduce((sum, entry) => sum + entry.value, 0)

  const statusChartConfig = useMemo<ChartConfig>(
    () => ({
      compliant: {
        label: 'Compliant',
        color: 'var(--chart-2)',
      },
      shortfall: {
        label: 'Shortfall',
        color: 'var(--chart-3)',
      },
      excess: {
        label: 'Excess',
        color: 'var(--chart-4)',
      },
    }),
    [],
  )

  const varianceChartConfig = useMemo<ChartConfig>(
    () => ({
      shortfall: {
        label: 'Shortfall',
        color: 'var(--chart-3)',
      },
      excess: {
        label: 'Excess',
        color: 'var(--chart-4)',
      },
    }),
    [],
  )

  const varianceData = useMemo(() => {
    if (!trendData.length) return []
    return trendData.map(({ year, shortfall, excess }) => ({ year, shortfall, excess }))
  }, [trendData])

  const varianceHasValues = varianceData.some((item) => item.shortfall !== 0 || item.excess !== 0)

  const topShortfallCommunities = useMemo(() => {
    if (!data?.results?.length) return []

    return [...data.results]
      .filter((item) => item.shortfall > 0)
      .sort((a, b) => b.shortfall - a.shortfall)
      .slice(0, 5)
      .map((item) => ({
        id: item.id,
        community: item.community_name || 'Unknown',
        program: item.program || 'All Programs',
        shortfall: item.shortfall,
        actual: item.actual_sites,
      }))
  }, [data?.results])

  const shortfallLeadersConfig = useMemo<ChartConfig>(
    () => ({
      shortfall: {
        label: 'Shortfall',
        color: 'var(--chart-3)',
      },
    }),
    [],
  )

  return (
    <DashboardLayout
      title='Dashboard'
      description='Ontario HSP & EEE Collection Site Assessment Overview'
      breadcrumb={['Dashboard', 'Overview']}
    >
      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Total Sites</CardTitle>
            <MapPin className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {isLoading ? <Skeleton className='h-7 w-16 rounded-md' /> : numberFormatter(summary?.total_sites ?? 0)}
            </div>
            <p className='text-xs text-muted-foreground'>
              Across {numberFormatter(totalMunicipalities)} municipalities
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Compliance Rate</CardTitle>
            <CheckCircle className='h-4 w-4 text-green-600' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-green-600'>
              {isLoading ? <Skeleton className='h-7 w-16 rounded-md' /> : `${Math.round(complianceRate)}%`}
            </div>
            <p className='text-xs text-muted-foreground'>
              {numberFormatter(summary?.compliant_communities ?? 0)} communities compliant
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Shortfalls</CardTitle>
            <AlertTriangle className='h-4 w-4 text-red-600' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-red-600'>
              {isLoading ? <Skeleton className='h-7 w-12 rounded-md' /> : numberFormatter(summary?.shortfalls ?? 0)}
            </div>
            <p className='text-xs text-muted-foreground'>Sites needed for compliance</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Excesses</CardTitle>
            <FileText className='h-4 w-4 text-blue-600' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-blue-600'>
              {isLoading ? <Skeleton className='h-7 w-12 rounded-md' /> : numberFormatter(summary?.excesses ?? 0)}
            </div>
            <p className='text-xs text-muted-foreground'>Available for reallocation</p>
          </CardContent>
        </Card>
      </div>

      <Card className='mt-4'>
        <CardHeader>
          <div>
            <CardTitle>Collection Site Trend</CardTitle>
            <p className='text-sm text-muted-foreground'>Required vs actual sites by census year</p>
          </div>
        </CardHeader>
        <CardContent className='pt-6'>
          {isLoading ? (
            <Skeleton className='h-[320px] w-full rounded-lg' />
          ) : trendData.length ? (
            <ChartContainer config={chartConfig} className='h-[320px] w-full'>
              <LineChart data={trendData} margin={{ left: 12, right: 12 }}>
                <CartesianGrid strokeDasharray='4 4' vertical={false} />
                <XAxis dataKey='year' tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} width={40} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
                <Line
                  type='monotone'
                  dataKey='required'
                  stroke='var(--color-required)'
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
                <Line
                  type='monotone'
                  dataKey='actual'
                  stroke='var(--color-actual)'
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              </LineChart>
            </ChartContainer>
          ) : (
            <div className='flex h-[240px] flex-col items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground'>
              Not enough compliance data to plot a trend yet.
            </div>
          )}
        </CardContent>
      </Card>

      <div className='mt-4 grid gap-4 lg:grid-cols-2'>
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Program Performance</CardTitle>
              <p className='text-sm text-muted-foreground'>Comparison of required vs actual sites per program</p>
            </div>
          </CardHeader>
          <CardContent className='pt-6'>
            {isLoading ? (
              <Skeleton className='h-[320px] w-full rounded-lg' />
            ) : programBreakdown.length ? (
              <ChartContainer config={chartConfig} className='h-[320px] w-full'>
                <BarChart data={programBreakdown} margin={{ left: 12, right: 12 }}>
                  <CartesianGrid strokeDasharray='4 4' vertical={false} />
                  <XAxis dataKey='program' tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} width={40} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Bar dataKey='required' fill='var(--color-required)' radius={[4, 4, 0, 0]} barSize={24} />
                  <Bar dataKey='actual' fill='var(--color-actual)' radius={[4, 4, 0, 0]} barSize={24} />
                </BarChart>
              </ChartContainer>
            ) : (
              <div className='flex h-[240px] flex-col items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground'>
                Program-level totals will appear once compliance data loads.
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Status Distribution</CardTitle>
              <p className='text-sm text-muted-foreground'>Communities grouped by compliance status</p>
            </div>
          </CardHeader>
          <CardContent className='pt-6'>
            {isLoading ? (
              <Skeleton className='h-[320px] w-full rounded-lg' />
            ) : statusBreakdown.length ? (
              <div className='flex flex-col gap-6 lg:flex-row lg:items-center'>
                <ChartContainer config={statusChartConfig} className='mx-auto h-[250px] w-full max-w-[360px]'>
                  <PieChart>
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Pie
                      data={statusBreakdown}
                      dataKey='value'
                      nameKey='status'
                      innerRadius={60}
                      outerRadius={90}
                      strokeWidth={4}
                    >
                      {statusBreakdown.map((entry) => (
                        <Cell key={entry.status} fill={`var(--color-${entry.status})`} />
                      ))}
                    </Pie>
                    <ChartLegend content={<ChartLegendContent />} />
                  </PieChart>
                </ChartContainer>
                <div className='flex-1 space-y-3'>
                  <div>
                    <p className='text-sm text-muted-foreground'>Total communities</p>
                    <p className='text-3xl font-semibold'>{numberFormatter(totalStatusCount)}</p>
                  </div>
                  <div className='space-y-2'>
                    {statusBreakdown.map((entry) => (
                      <div key={entry.status} className='flex items-center justify-between text-sm'>
                        <div className='flex items-center gap-2'>
                          <span
                            className='h-2.5 w-2.5 rounded-sm'
                            style={{ backgroundColor: `var(--color-${entry.status})` }}
                          />
                          <span className='capitalize'>{entry.status}</span>
                        </div>
                        <span className='font-medium'>{((entry.value / totalStatusCount) * 100).toFixed(0)}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className='flex h-[240px] flex-col items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground'>
                Status segmentation appears here once results are available.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className='mt-4 grid gap-4 lg:grid-cols-2'>
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Variance Trend</CardTitle>
              <p className='text-sm text-muted-foreground'>Shortfall vs excess volume over time</p>
            </div>
          </CardHeader>
          <CardContent className='pt-6'>
            {isLoading ? (
              <Skeleton className='h-[320px] w-full rounded-lg' />
            ) : varianceData.length && varianceHasValues ? (
              <ChartContainer config={varianceChartConfig} className='h-[320px] w-full'>
                <AreaChart data={varianceData} margin={{ left: 12, right: 12 }}>
                  <CartesianGrid strokeDasharray='4 4' />
                  <XAxis dataKey='year' tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} width={40} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Area
                    type='monotone'
                    dataKey='shortfall'
                    stroke='var(--color-shortfall)'
                    fill='var(--color-shortfall)'
                    fillOpacity={0.25}
                    strokeWidth={2}
                    activeDot={{ r: 4 }}
                  />
                  <Area
                    type='monotone'
                    dataKey='excess'
                    stroke='var(--color-excess)'
                    fill='var(--color-excess)'
                    fillOpacity={0.2}
                    strokeWidth={2}
                    activeDot={{ r: 4 }}
                  />
                </AreaChart>
              </ChartContainer>
            ) : (
              <div className='flex h-[240px] flex-col items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground'>
                Variance trends will display once multiple census years are available.
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Top Shortfall Communities</CardTitle>
              <p className='text-sm text-muted-foreground'>Greatest collection gaps by community</p>
            </div>
          </CardHeader>
          <CardContent className='pt-6 space-y-6'>
            {isLoading ? (
              <Skeleton className='h-[280px] w-full rounded-lg' />
            ) : topShortfallCommunities.length ? (
              <>
                <ChartContainer config={shortfallLeadersConfig} className='h-[260px] w-full'>
                  <BarChart data={topShortfallCommunities} layout='vertical' margin={{ left: 12, right: 12 }}>
                    <CartesianGrid strokeDasharray='4 4' horizontal={false} />
                    <XAxis type='number' tickLine={false} axisLine={false} />
                    <YAxis type='category' dataKey='community' tickLine={false} axisLine={false} width={120} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey='shortfall' fill='var(--color-shortfall)' radius={[0, 4, 4, 0]} barSize={18} />
                  </BarChart>
                </ChartContainer>
                <div className='space-y-3 text-sm'>
                  {topShortfallCommunities.map((entry) => (
                    <div key={entry.id} className='flex items-center justify-between gap-4 rounded-md border p-3'>
                      <div>
                        <p className='font-medium'>{entry.community}</p>
                        <p className='text-muted-foreground'>Program: {entry.program}</p>
                      </div>
                      <div className='text-right'>
                        <p className='text-lg font-semibold'>{numberFormatter(entry.shortfall)}</p>
                        <p className='text-xs text-muted-foreground'>Actual: {numberFormatter(entry.actual)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className='flex h-[240px] flex-col items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground'>
                No outstanding community shortfalls detected.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
