'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { 
  MapPin, 
  AlertTriangle, 
  CheckCircle, 
  FileText, 
  TrendingUp,
  Calendar,
  Building2,
  Loader2,
  BarChart3,
  PieChart as PieChartIcon
} from "lucide-react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { useDashboardStats } from '@/hooks/useDashboardStats'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

export default function Dashboard() {
  const currentYear = new Date().getFullYear()
  const [selectedYear, setSelectedYear] = useState<number | undefined>(undefined)
  
  const { data: stats, isLoading, complianceData, censusYearsData } = useDashboardStats(selectedYear)

  const availableYears = censusYearsData?.results?.map(y => y.year).sort((a, b) => b - a) || []

  return (
    <DashboardLayout
      title='Dashboard'
      description='Ontario HSP & EEE Collection Site Assessment Overview'
      breadcrumb={['Dashboard', 'Overview']}
    >
      {/* Year Selector */}
      <div className='mb-6 flex items-center gap-4'>
        <label className='text-sm font-medium'>Census Year:</label>
        <Select
          value={selectedYear?.toString() || 'all'}
          onValueChange={(value) => setSelectedYear(value === 'all' ? undefined : parseInt(value))}
        >
          <SelectTrigger className='w-[180px]'>
            <SelectValue placeholder='All Years' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>All Years</SelectItem>
            {availableYears.map((year) => (
              <SelectItem key={year} value={year.toString()}>
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className='flex items-center justify-center h-64'>
          <div className='text-center'>
            <Loader2 className='h-8 w-8 animate-spin text-blue-600 mx-auto mb-4' />
            <p className='text-gray-600'>Loading dashboard data...</p>
          </div>
        </div>
      ) : (
        <div className='space-y-6'>
          {/* Main Statistics Cards */}
          <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
            <Card>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>Total Sites</CardTitle>
                <MapPin className='h-4 w-4 text-muted-foreground' />
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold'>
                  {stats?.totalSites || 0}
                </div>
                <p className='text-xs text-muted-foreground'>
                  Across {stats?.totalMunicipalities || 0} municipalities
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>
                  Compliance Rate
                </CardTitle>
                <CheckCircle className='h-4 w-4 text-green-600' />
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold text-green-600'>
                  {stats?.complianceRate ? Math.round(stats.complianceRate) : 0}%
                </div>
                <p className='text-xs text-muted-foreground'>
                  {stats?.compliantMunicipalities || 0} of{' '}
                  {stats?.totalMunicipalities || 0} compliant
                </p>
                <Progress 
                  value={stats?.complianceRate || 0} 
                  className='mt-2 h-2'
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>Shortfalls</CardTitle>
                <AlertTriangle className='h-4 w-4 text-red-600' />
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold text-red-600'>
                  {stats?.shortfalls || 0}
                </div>
                <p className='text-xs text-muted-foreground'>
                  Sites needed for compliance
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>Excesses</CardTitle>
                <TrendingUp className='h-4 w-4 text-blue-600' />
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold text-blue-600'>
                  {stats?.excesses || 0}
                </div>
                <p className='text-xs text-muted-foreground'>
                  Available for reallocation
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Secondary Statistics */}
          <div className='grid gap-4 md:grid-cols-2'>
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Calendar className='h-5 w-5' />
                  Census Years
                </CardTitle>
                <CardDescription>
                  Available census year data
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className='text-3xl font-bold'>
                  {stats?.totalCensusYears || 0}
                </div>
                <p className='text-sm text-muted-foreground mt-2'>
                  Latest: {stats?.latestYear || 'N/A'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Building2 className='h-5 w-5' />
                  Municipalities
                </CardTitle>
                <CardDescription>
                  Total municipalities tracked
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className='text-3xl font-bold'>
                  {stats?.totalMunicipalities || 0}
                </div>
                <p className='text-sm text-muted-foreground mt-2'>
                  {stats?.compliantMunicipalities || 0} compliant ({stats?.totalMunicipalities ? Math.round((stats.compliantMunicipalities / stats.totalMunicipalities) * 100) : 0}%)
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Charts Section */}
          {stats?.programBreakdown && stats.programBreakdown.length > 0 && (
            <div className='grid gap-4 md:grid-cols-2'>
              {/* Program Sites Bar Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2'>
                    <BarChart3 className='h-5 w-5' />
                    Sites by Program
                  </CardTitle>
                  <CardDescription>
                    Total sites per program
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer
                    config={{
                      sites: {
                        label: 'Sites',
                        color: 'hsl(var(--chart-1))',
                      },
                    }}
                    className='h-[300px]'
                  >
                    <BarChart data={stats.programBreakdown}>
                      <CartesianGrid strokeDasharray='3 3' />
                      <XAxis dataKey='program' />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey='sites' fill='hsl(var(--chart-1))' radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>

              {/* Compliance Status Pie Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2'>
                    <PieChartIcon className='h-5 w-5' />
                    Compliance Status
                  </CardTitle>
                  <CardDescription>
                    Distribution of compliance status
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer
                    config={{
                      compliant: {
                        label: 'Compliant',
                        color: 'hsl(142, 76%, 36%)',
                      },
                      shortfall: {
                        label: 'Shortfall',
                        color: 'hsl(0, 84%, 60%)',
                      },
                      excess: {
                        label: 'Excess',
                        color: 'hsl(217, 91%, 60%)',
                      },
                    }}
                    className='h-[300px]'
                  >
                    <PieChart>
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Pie
                        data={[
                          { name: 'Compliant', value: stats.compliantMunicipalities, fill: 'hsl(142, 76%, 36%)' },
                          { name: 'Shortfall', value: stats.shortfalls, fill: 'hsl(0, 84%, 60%)' },
                          { name: 'Excess', value: stats.excesses, fill: 'hsl(217, 91%, 60%)' },
                        ]}
                        cx='50%'
                        cy='50%'
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                        outerRadius={80}
                        dataKey='value'
                      />
                    </PieChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Program Compliance Breakdown Chart */}
          {stats?.programBreakdown && stats.programBreakdown.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <BarChart3 className='h-5 w-5' />
                  Program Compliance Breakdown
                </CardTitle>
                <CardDescription>
                  Compliant vs Shortfall by program
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    compliant: {
                      label: 'Compliant',
                      color: 'hsl(142, 76%, 36%)',
                    },
                    shortfall: {
                      label: 'Shortfall',
                      color: 'hsl(0, 84%, 60%)',
                    },
                  }}
                  className='h-[350px]'
                >
                  <BarChart data={stats.programBreakdown}>
                    <CartesianGrid strokeDasharray='3 3' />
                    <XAxis dataKey='program' />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <ChartLegend content={<ChartLegendContent />} />
                    <Bar dataKey='compliant' fill='hsl(142, 76%, 36%)' radius={[8, 8, 0, 0]} />
                    <Bar dataKey='shortfall' fill='hsl(0, 84%, 60%)' radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
          )}

          {/* Compliance Trend by Community (Top 10) */}
          {complianceData?.results && complianceData.results.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <TrendingUp className='h-5 w-5' />
                  Top Communities by Sites
                </CardTitle>
                <CardDescription>
                  Communities with most collection sites
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    actual: {
                      label: 'Actual Sites',
                      color: 'hsl(217, 91%, 60%)',
                    },
                    required: {
                      label: 'Required Sites',
                      color: 'hsl(142, 76%, 36%)',
                    },
                  }}
                  className='h-[400px]'
                >
                  <BarChart
                    data={complianceData.results
                      .slice(0, 10)
                      .map((item) => ({
                        name: item.community_name.length > 15 
                          ? item.community_name.substring(0, 15) + '...' 
                          : item.community_name,
                        actual: item.actual_sites,
                        required: item.required_sites,
                      }))}
                    layout='vertical'
                  >
                    <CartesianGrid strokeDasharray='3 3' />
                    <XAxis type='number' />
                    <YAxis dataKey='name' type='category' width={100} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <ChartLegend content={<ChartLegendContent />} />
                    <Bar dataKey='actual' fill='hsl(217, 91%, 60%)' radius={[0, 8, 8, 0]} />
                    <Bar dataKey='required' fill='hsl(142, 76%, 36%)' radius={[0, 8, 8, 0]} />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
          )}

          {/* Recent Compliance Data */}
          {complianceData?.results && complianceData.results.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <FileText className='h-5 w-5' />
                  Recent Compliance Calculations
                </CardTitle>
                <CardDescription>
                  Latest compliance assessments
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className='space-y-3'>
                  {complianceData.results.slice(0, 5).map((item) => (
                    <div key={item.id} className='flex items-center justify-between p-3 border rounded-lg'>
                      <div className='flex-1'>
                        <div className='font-medium'>{item.community_name}</div>
                        <div className='text-sm text-muted-foreground'>
                          {item.program} • Year {item.census_year_value}
                        </div>
                      </div>
                      <div className='text-right'>
                        <div className='text-sm font-semibold'>
                          {item.actual_sites}/{item.required_sites} sites
                        </div>
                        <div className={
                          item.status === 'compliant' 
                            ? 'text-xs text-green-600 font-medium'
                            : item.status === 'shortfall'
                            ? 'text-xs text-red-600 font-medium'
                            : 'text-xs text-blue-600 font-medium'
                        }>
                          {item.status === 'compliant' ? '✓ Compliant' : 
                           item.status === 'shortfall' ? `⚠ -${item.shortfall}` :
                           `+ ${item.excess}`}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </DashboardLayout>
  )
}
