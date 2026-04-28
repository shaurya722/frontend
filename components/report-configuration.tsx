'use client'

import { useState, useMemo, useEffect } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Search,
  FileSpreadsheet,
  FileText,
  FileCode,
  Eye,
  ArrowLeft,
  Building2,
  CheckCircle,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  BarChart3,
  Info,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import {
  useReportConfig,
  useReportPreview,
  useExportReport,
} from '@/features/compliance-reports/hooks'
import { useCensusYears } from '@/features/communities'
import {
  DateFilter,
  ReportOptions,
  ReportPreviewData,
} from '@/features/compliance-reports/types'

export default function ReportConfiguration() {
  const [selectedYear, setSelectedYear] = useState<number>(2000)
  const [reportType, setReportType] = useState<string>('compliance-summary')
  const [selectedPrograms, setSelectedPrograms] = useState<string[]>([])
  const [selectedMunicipalities, setSelectedMunicipalities] = useState<string[]>([])
  const [municipalitySearch, setMunicipalitySearch] = useState('')
  const [allSites, setAllSites] = useState(false)
  const [dateFilter, setDateFilter] = useState<DateFilter>({
    filterType: 'all',
    startDate: '',
    endDate: '',
  })
  const [options, setOptions] = useState<ReportOptions>({
    include_charts: true,
    include_details: true,
  })
  const [showPreview, setShowPreview] = useState(false)
  const [previewData, setPreviewData] = useState<ReportPreviewData | null>(null)

  const { toast } = useToast()
  const { data: censusYearsData } = useCensusYears()
  const { data: config, isLoading: configLoading } = useReportConfig(selectedYear)
  const previewMutation = useReportPreview()
  const exportMutation = useExportReport()

  // Set default year from census years
  useEffect(() => {
    if (censusYearsData?.years && censusYearsData.years.length > 0) {
      const latestYear = Math.max(...censusYearsData.years.map((y: { year: number }) => y.year))
      setSelectedYear(latestYear)
    }
  }, [censusYearsData])

  const filteredMunicipalities = useMemo(() => {
    if (!config?.municipalities) return []
    if (!municipalitySearch.trim()) return config.municipalities
    return config.municipalities.filter((m) =>
      m.name.toLowerCase().includes(municipalitySearch.toLowerCase())
    )
  }, [config?.municipalities, municipalitySearch])

  const handleToggleProgram = (name: string) => {
    setSelectedPrograms((prev) =>
      prev.includes(name) ? prev.filter((p) => p !== name) : [...prev, name]
    )
  }

  const handleToggleMunicipality = (name: string) => {
    setSelectedMunicipalities((prev) =>
      prev.includes(name) ? prev.filter((m) => m !== name) : [...prev, name]
    )
  }

  const handleToggleAllSites = (checked: boolean) => {
    setAllSites(checked)
    if (checked) {
      setSelectedMunicipalities([])
    }
  }

  const handleSelectAllMunicipalities = () => {
    if (config?.municipalities) {
      const all = config.municipalities.map((m) => m.name)
      setSelectedMunicipalities(all)
      setAllSites(false)
    }
  }

  const handleClearMunicipalities = () => {
    setSelectedMunicipalities([])
    setAllSites(false)
  }

  const buildPayload = () => {
    return {
      report_type: reportType,
      year: selectedYear,
      programs: selectedPrograms,
      municipalities: allSites ? [] : selectedMunicipalities,
      date_filter: dateFilter,
      options,
    }
  }

  const handlePreview = async () => {
    try {
      const data = await previewMutation.mutateAsync(buildPayload())
      setPreviewData(data)
      setShowPreview(true)
    } catch (err: any) {
      toast({
        title: 'Preview failed',
        description: err?.message || 'Unable to generate preview. Please try again.',
        variant: 'destructive',
      })
    }
  }

  const handleExport = async (format: 'excel' | 'word' | 'pdf') => {
    try {
      const blob = await exportMutation.mutateAsync({
        ...buildPayload(),
        format,
      })

      const extensionMap = { excel: 'xlsx', word: 'docx', pdf: 'pdf' }
      const mimeMap = {
        excel: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        word: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        pdf: 'application/pdf',
      }

      const url = window.URL.createObjectURL(new Blob([blob], { type: mimeMap[format] }))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `compliance-report-${selectedYear}.${extensionMap[format]}`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)

      toast({
        title: 'Generating report',
        description: 'Your download will begin shortly.',
      })
    } catch (err: any) {
      toast({
        title: 'Export failed',
        description: err?.message || 'Failed to generate report. Please check your selections and try again.',
        variant: 'destructive',
      })
    }
  }

  if (showPreview && previewData) {
    return (
      <div className='space-y-6'>
        <div className='flex items-center gap-2'>
          <Button variant='outline' onClick={() => setShowPreview(false)}>
            <ArrowLeft className='h-4 w-4 mr-2' />
            Back to Configuration
          </Button>
        </div>

        <div>
          <h3 className='text-xl font-bold tracking-tight'>Report Preview</h3>
          <p className='text-sm text-muted-foreground mt-1'>
            Preview of Compliance Summary Report
          </p>
        </div>

        {/* Executive Summary */}
        <div className='grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4'>
          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>Total Sites</CardTitle>
              <Building2 className='h-4 w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>
                {previewData.complianceData.totalSites}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>Compliance Rate</CardTitle>
              <CheckCircle className='h-4 w-4 text-green-600' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold text-green-600'>
                {previewData.complianceData.totalMunicipalities > 0
                  ? Math.round(
                      (previewData.complianceData.compliantMunicipalities /
                        previewData.complianceData.totalMunicipalities) *
                        100
                    )
                  : 0}
                %
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>Shortfalls</CardTitle>
              <TrendingDown className='h-4 w-4 text-red-600' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold text-red-600'>
                {previewData.complianceData.shortfalls}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>Excesses</CardTitle>
              <TrendingUp className='h-4 w-4 text-blue-600' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold text-blue-600'>
                {previewData.complianceData.excesses}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Program Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Program Breakdown</CardTitle>
            <CardDescription>Compliance status by program</CardDescription>
          </CardHeader>
          <CardContent>
            <div className='overflow-x-auto'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className='bg-gray-50'>Program</TableHead>
                    <TableHead className='bg-gray-50'>Active Sites</TableHead>
                    <TableHead className='bg-gray-50'>Municipalities Served</TableHead>
                    <TableHead className='bg-gray-50'>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previewData.programBreakdown.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className='text-center py-8 text-muted-foreground'>
                        No program data available
                      </TableCell>
                    </TableRow>
                  ) : (
                    previewData.programBreakdown.map((row, i) => (
                      <TableRow key={i}>
                        <TableCell className='font-medium'>{row.program}</TableCell>
                        <TableCell>{row.activeSites}</TableCell>
                        <TableCell>{row.municipalitiesServed}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              row.status === 'compliant'
                                ? 'default'
                                : row.status === 'shortfall'
                                ? 'destructive'
                                : 'secondary'
                            }
                          >
                            {row.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Municipality Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Municipality Summary</CardTitle>
            <CardDescription>Compliance summary by municipality</CardDescription>
          </CardHeader>
          <CardContent>
            <div className='overflow-x-auto'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className='bg-gray-50'>Municipality</TableHead>
                    <TableHead className='bg-gray-50'>Population</TableHead>
                    <TableHead className='bg-gray-50'>Active Sites</TableHead>
                    <TableHead className='bg-gray-50'>Programs Served</TableHead>
                    <TableHead className='bg-gray-50'>Tier</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previewData.municipalitySummary.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className='text-center py-8 text-muted-foreground'>
                        No municipality data available
                      </TableCell>
                    </TableRow>
                  ) : (
                    previewData.municipalitySummary.map((row, i) => (
                      <TableRow key={i}>
                        <TableCell className='font-medium'>{row.municipality}</TableCell>
                        <TableCell>{row.population.toLocaleString()}</TableCell>
                        <TableCell>{row.activeSites}</TableCell>
                        <TableCell>{row.programsServed.join(', ')}</TableCell>
                        <TableCell>{row.tier}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div>
        <h3 className='text-xl font-bold tracking-tight'>Report Configuration</h3>
        <p className='text-sm text-muted-foreground mt-1'>
          Configure and generate compliance reports for export.
        </p>
      </div>

      {/* Year + Report Type */}
      <Card>
        <CardContent className='pt-6'>
          <div className='flex flex-col sm:flex-row gap-4'>
            <div className='flex-1 space-y-2'>
              <Label>Census Year</Label>
              <Select
                value={selectedYear.toString()}
                onValueChange={(v) => setSelectedYear(Number(v))}
              >
                <SelectTrigger>
                  <SelectValue placeholder='Select year' />
                </SelectTrigger>
                <SelectContent>
                  {censusYearsData?.years
                    ?.sort((a: { year: number }, b: { year: number }) => b.year - a.year)
                    .map((year: { year: number; id: number }) => (
                      <SelectItem key={year.id} value={year.year.toString()}>
                        {year.year}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className='flex-1 space-y-2'>
              <Label>Report Type</Label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger>
                  <SelectValue placeholder='Select report type' />
                </SelectTrigger>
                <SelectContent>
                  {(config?.report_types || []).map((rt) => (
                    <SelectItem key={rt.value} value={rt.value}>
                      {rt.label}
                    </SelectItem>
                  ))}
                  {!config && (
                    <SelectItem value='compliance-summary'>
                      Compliance Summary Report
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters Section */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        {/* Programs */}
        <Card>
          <CardHeader>
            <CardTitle className='text-base'>Programs</CardTitle>
            <CardDescription>
              Select programs to include in the report
            </CardDescription>
          </CardHeader>
          <CardContent>
            {configLoading ? (
              <div className='text-sm text-muted-foreground'>Loading programs...</div>
            ) : (
              <div className='space-y-3 max-h-80 overflow-y-auto pr-2'>
                {(config?.programs || []).map((program) => (
                  <div key={program.name} className='flex items-center space-x-3'>
                    <Checkbox
                      id={`program-${program.name}`}
                      checked={selectedPrograms.includes(program.name)}
                      onCheckedChange={() => handleToggleProgram(program.name)}
                    />
                    <Label
                      htmlFor={`program-${program.name}`}
                      className='flex-1 text-sm cursor-pointer'
                    >
                      {program.name}
                    </Label>
                    <Badge variant='outline' className='text-xs'>
                      {program.active_site_count} sites
                    </Badge>
                  </div>
                ))}
                {(!config?.programs || config.programs.length === 0) && (
                  <div className='text-sm text-muted-foreground'>No programs available</div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Municipalities */}
        <Card>
          <CardHeader>
            <CardTitle className='text-base'>Municipalities</CardTitle>
            <CardDescription>
              Select municipalities to include in the report
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className='space-y-3'>
              <div className='flex items-center space-x-3'>
                <Checkbox
                  id='all-sites'
                  checked={allSites}
                  onCheckedChange={(c) => handleToggleAllSites(!!c)}
                />
                <Label htmlFor='all-sites' className='text-sm font-medium cursor-pointer'>
                  All Sites
                </Label>
              </div>
              <Separator />
              <div className='relative'>
                <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground' />
                <Input
                  placeholder='Search municipalities...'
                  className='pl-10'
                  value={municipalitySearch}
                  onChange={(e) => setMunicipalitySearch(e.target.value)}
                  disabled={allSites}
                />
              </div>
              <div className='flex gap-2'>
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={handleSelectAllMunicipalities}
                  disabled={allSites}
                >
                  Select All
                </Button>
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={handleClearMunicipalities}
                  disabled={allSites || selectedMunicipalities.length === 0}
                >
                  Clear
                </Button>
              </div>
              <div className='space-y-2 max-h-60 overflow-y-auto pr-2'>
                {configLoading ? (
                  <div className='text-sm text-muted-foreground'>Loading municipalities...</div>
                ) : (
                  filteredMunicipalities.map((m) => (
                    <div key={m.name} className='flex items-center space-x-3'>
                      <Checkbox
                        id={`municipality-${m.name}`}
                        checked={selectedMunicipalities.includes(m.name)}
                        onCheckedChange={() => handleToggleMunicipality(m.name)}
                        disabled={allSites}
                      />
                      <Label
                        htmlFor={`municipality-${m.name}`}
                        className='flex-1 text-sm cursor-pointer'
                      >
                        {m.name}
                      </Label>
                      <div className='flex items-center gap-2'>
                        <span className='text-xs text-muted-foreground'>
                          {m.active_site_count} sites
                        </span>
                      </div>
                    </div>
                  ))
                )}
                {!configLoading && filteredMunicipalities.length === 0 && (
                  <div className='text-sm text-muted-foreground'>
                    No municipalities found
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Date Range + Options */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        <Card>
          <CardHeader>
            <CardTitle className='text-base'>Date Filter</CardTitle>
            <CardDescription>
              Filter sites by activation or deactivation date
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='space-y-2'>
              <Label>Filter Type</Label>
              <Select
                value={dateFilter.filterType}
                onValueChange={(v) =>
                  setDateFilter((prev) => ({
                    ...prev,
                    filterType: v as DateFilter['filterType'],
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder='Select filter type' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All Dates</SelectItem>
                  <SelectItem value='activated'>Activated</SelectItem>
                  <SelectItem value='deactivated'>Deactivated</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className='grid grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <Label>Start Date</Label>
                <Input
                  type='date'
                  value={dateFilter.startDate}
                  onChange={(e) =>
                    setDateFilter((prev) => ({ ...prev, startDate: e.target.value }))
                  }
                />
              </div>
              <div className='space-y-2'>
                <Label>End Date</Label>
                <Input
                  type='date'
                  value={dateFilter.endDate}
                  onChange={(e) =>
                    setDateFilter((prev) => ({ ...prev, endDate: e.target.value }))
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className='text-base'>Report Options</CardTitle>
            <CardDescription>
              Customize the content of the report
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='flex items-center space-x-3'>
              <Checkbox
                id='include-charts'
                checked={options.include_charts}
                onCheckedChange={(c) =>
                  setOptions((prev) => ({ ...prev, include_charts: !!c }))
                }
              />
              <Label htmlFor='include-charts' className='text-sm cursor-pointer flex items-center gap-2'>
                <BarChart3 className='h-4 w-4 text-muted-foreground' />
                Include charts and visualizations
              </Label>
            </div>
            <div className='flex items-center space-x-3'>
              <Checkbox
                id='include-details'
                checked={options.include_details}
                onCheckedChange={(c) =>
                  setOptions((prev) => ({ ...prev, include_details: !!c }))
                }
              />
              <Label htmlFor='include-details' className='text-sm cursor-pointer flex items-center gap-2'>
                <Info className='h-4 w-4 text-muted-foreground' />
                Include detailed site information
              </Label>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <Card>
        <CardContent className='pt-6'>
          <div className='flex flex-col sm:flex-row gap-3'>
            <Button
              variant='secondary'
              onClick={handlePreview}
              disabled={previewMutation.isPending}
              className='flex-1'
            >
              <Eye className='h-4 w-4 mr-2' />
              {previewMutation.isPending ? 'Generating Preview…' : 'Preview Report'}
            </Button>
            <Button
              variant='outline'
              onClick={() => handleExport('excel')}
              disabled={exportMutation.isPending}
            >
              <FileSpreadsheet className='h-4 w-4 mr-2' />
              Export to Excel
            </Button>
            <Button
              variant='outline'
              onClick={() => handleExport('word')}
              disabled={exportMutation.isPending}
            >
              <FileText className='h-4 w-4 mr-2' />
              Export to Word
            </Button>
            <Button
              variant='outline'
              onClick={() => handleExport('pdf')}
              disabled={exportMutation.isPending}
            >
              <FileCode className='h-4 w-4 mr-2' />
              Export to PDF
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
