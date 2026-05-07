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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Download,
  Search,
  FileText,
  Users,
  MapPin,
  Scale,
  CheckCircle,
  Loader2,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { PaginationControls } from '@/components/pagination-controls'

import { useCensusYears, useCommunities, useExportCommunities } from '@/features/communities'
import { useCompliance, useExportCompliance } from '@/features/compliance/hooks'
import { ComplianceFilters } from '@/features/compliance/types'
import { useSites, useExportSiteCensusData } from '@/features/sites/hooks'
import { SitesFilters } from '@/features/sites/types'
import { useRegulatoryRules, useExportRegulatoryRules } from '@/features/regulatory-rules'
import { CommunitiesQueryParams } from '@/features/communities/types'
import { RegulatoryRulesQueryParams } from '@/features/regulatory-rules/types'

// ─── Report type metadata ─────────────────────────────────────────────────────

type ReportType = 'compliance-summary' | 'site-management' | 'rules' | 'community'

const REPORT_TYPE_META: Record<
  ReportType,
  { label: string; description: string; Icon: React.ElementType; color: string }
> = {
  'compliance-summary': {
    label: 'Compliance Summary Report',
    description: 'Compliance rates, shortfalls and excesses by community and program.',
    Icon: CheckCircle,
    color: 'text-primary',
  },
  'site-management': {
    label: 'Site Management Report',
    description: 'Collection sites filtered by type, operator, status and census year.',
    Icon: MapPin,
    color: 'text-indigo-600',
  },
  'rules': {
    label: 'Rules Report',
    description: 'Regulatory rules filtered by program, category, type and status.',
    Icon: Scale,
    color: 'text-violet-600',
  },
  'community': {
    label: 'Community Report',
    description: 'Community census data filtered by status and census year.',
    Icon: Users,
    color: 'text-sky-600',
  },
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function downloadBlob(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  window.URL.revokeObjectURL(url)
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ReportConfiguration() {
  const { toast } = useToast()

  // ── Shared ──────────────────────────────────────────────────────────────────
  const [reportType, setReportType] = useState<ReportType>('compliance-summary')
  const [selectedYear, setSelectedYear] = useState<number | undefined>(undefined)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const { data: censusYearsData } = useCensusYears()

  // Default to the latest census year once data loads
  useEffect(() => {
    if (censusYearsData?.years?.length && !selectedYear) {
      const latest = Math.max(...censusYearsData.years.map((y: { year: number }) => y.year))
      setSelectedYear(latest)
    }
  }, [censusYearsData, selectedYear])

  // ── Compliance filters (mirrors compliance-analysis.tsx) ─────────────────
  const [compSearch, setCompSearch] = useState('')
  const [compDebSearch, setCompDebSearch] = useState('')
  const [compProgram, setCompProgram] = useState('')
  const [compStatus, setCompStatus] = useState('')

  useEffect(() => {
    const t = setTimeout(() => setCompDebSearch(compSearch), 300)
    return () => clearTimeout(t)
  }, [compSearch])

  const compFilters: ComplianceFilters = useMemo(
    () => ({
      search: compDebSearch || undefined,
      program: compProgram || undefined,
      status: (compStatus as 'compliant' | 'shortfall' | 'excess') || undefined,
      year: selectedYear?.toString(),
      page,
      limit: pageSize,
    }),
    [compDebSearch, compProgram, compStatus, selectedYear, page, pageSize],
  )

  // ── Sites filters (mirrors siteManagement.tsx) ────────────────────────────
  const [siteSearch, setSiteSearch] = useState('')
  const [siteDebSearch, setSiteDebSearch] = useState('')
  const [siteSiteType, setSiteSiteType] = useState('')
  const [siteOperatorType, setSiteOperatorType] = useState('all')
  const [siteIsActive, setSiteIsActive] = useState('all')

  useEffect(() => {
    const t = setTimeout(() => setSiteDebSearch(siteSearch), 300)
    return () => clearTimeout(t)
  }, [siteSearch])

  const siteFilters: SitesFilters = useMemo(
    () => ({
      search: siteDebSearch || undefined,
      site_type: siteSiteType || undefined,
      operator_type: siteOperatorType !== 'all' ? siteOperatorType : undefined,
      is_active: siteIsActive !== 'all' ? (siteIsActive as any) : undefined,
      year: selectedYear,
      page,
      limit: pageSize,
    }),
    [siteDebSearch, siteSiteType, siteOperatorType, siteIsActive, selectedYear, page, pageSize],
  )

  // ── Rules filters (mirrors regulatory-rules-management.tsx) ──────────────
  const [rulesSearch, setRulesSearch] = useState('')
  const [rulesDebSearch, setRulesDebSearch] = useState('')
  const [rulesProgram, setRulesProgram] = useState('all')
  const [rulesCategory, setRulesCategory] = useState('all')
  const [rulesRuleType, setRulesRuleType] = useState('all')
  const [rulesIsActive, setRulesIsActive] = useState('all')

  useEffect(() => {
    const t = setTimeout(() => setRulesDebSearch(rulesSearch), 300)
    return () => clearTimeout(t)
  }, [rulesSearch])

  const rulesFilters: RegulatoryRulesQueryParams = useMemo(
    () => ({
      search: rulesDebSearch || undefined,
      program: rulesProgram !== 'all' ? rulesProgram : undefined,
      category: rulesCategory !== 'all' ? rulesCategory : undefined,
      rule_type: rulesRuleType !== 'all' ? rulesRuleType : undefined,
      is_active: rulesIsActive !== 'all' ? rulesIsActive : undefined,
      year: selectedYear,
      page,
      limit: pageSize,
    }),
    [rulesDebSearch, rulesProgram, rulesCategory, rulesRuleType, rulesIsActive, selectedYear, page, pageSize],
  )

  // ── Community filters (mirrors communities-management.tsx) ────────────────
  const [commSearch, setCommSearch] = useState('')
  const [commDebSearch, setCommDebSearch] = useState('')
  const [commIsActive, setCommIsActive] = useState('all')

  useEffect(() => {
    const t = setTimeout(() => setCommDebSearch(commSearch), 300)
    return () => clearTimeout(t)
  }, [commSearch])

  const communityFilters: CommunitiesQueryParams = useMemo(
    () => ({
      search: commDebSearch || undefined,
      is_active: commIsActive !== 'all' ? commIsActive : undefined,
      year: selectedYear,
      page,
      limit: pageSize,
    }),
    [commDebSearch, commIsActive, selectedYear, page, pageSize],
  )

  // Reset to first page when report type, page size, or any listing filter changes
  useEffect(() => {
    setPage(1)
  }, [
    reportType,
    selectedYear,
    pageSize,
    compDebSearch,
    compProgram,
    compStatus,
    siteDebSearch,
    siteSiteType,
    siteOperatorType,
    siteIsActive,
    rulesDebSearch,
    rulesProgram,
    rulesCategory,
    rulesRuleType,
    rulesIsActive,
    commDebSearch,
    commIsActive,
  ])

  // ── Data queries (each enabled only for its report type) ──────────────────
  const { data: compData, isLoading: compLoading } = useCompliance(
    compFilters,
    reportType === 'compliance-summary',
  )
  const { data: sitesData, isLoading: sitesLoading } = useSites(
    siteFilters,
    reportType === 'site-management',
  )
  const { data: rulesData, isLoading: rulesLoading } = useRegulatoryRules(
    rulesFilters,
    reportType === 'rules',
  )
  const { data: communityData, isLoading: communityLoading } = useCommunities(
    communityFilters,
    reportType === 'community',
  )

  // ── Export mutations ──────────────────────────────────────────────────────
  const exportCompMutation = useExportCompliance()
  const exportSitesMutation = useExportSiteCensusData()
  const exportRulesMutation = useExportRegulatoryRules()
  const exportCommMutation = useExportCommunities()

  const isExporting =
    exportCompMutation.isPending ||
    exportSitesMutation.isPending ||
    exportRulesMutation.isPending ||
    exportCommMutation.isPending

  const handleExport = async () => {
    try {
      let blob: Blob
      let filename: string

      switch (reportType) {
        case 'compliance-summary': {
          blob = await exportCompMutation.mutateAsync({
            search: compDebSearch || undefined,
            program: compProgram || undefined,
            status: (compStatus as any) || undefined,
            year: selectedYear?.toString(),
          } as ComplianceFilters)
          filename = `compliance-report-${selectedYear ?? 'all'}.csv`
          break
        }
        case 'site-management': {
          blob = await exportSitesMutation.mutateAsync({
            search: siteDebSearch || undefined,
            site_type: siteSiteType || undefined,
            operator_type: siteOperatorType !== 'all' ? siteOperatorType : undefined,
            is_active: siteIsActive !== 'all' ? (siteIsActive as any) : undefined,
            year: selectedYear,
          } as SitesFilters)
          filename = `sites-report-${selectedYear ?? 'all'}.csv`
          break
        }
        case 'rules': {
          blob = await exportRulesMutation.mutateAsync({
            search: rulesDebSearch || undefined,
            program: rulesProgram !== 'all' ? rulesProgram : undefined,
            category: rulesCategory !== 'all' ? rulesCategory : undefined,
            rule_type: rulesRuleType !== 'all' ? rulesRuleType : undefined,
            is_active: rulesIsActive !== 'all' ? rulesIsActive : undefined,
            year: selectedYear,
          } as RegulatoryRulesQueryParams)
          filename = `rules-report-${selectedYear ?? 'all'}.csv`
          break
        }
        case 'community': {
          blob = await exportCommMutation.mutateAsync({
            search: commDebSearch || undefined,
            is_active: commIsActive !== 'all' ? commIsActive : undefined,
            year: selectedYear,
          } as CommunitiesQueryParams)
          filename = `community-report-${selectedYear ?? 'all'}.csv`
          break
        }
      }

      downloadBlob(blob!, filename!)
      toast({ title: 'Export complete', description: `${filename!} downloaded.` })
    } catch (err: any) {
      toast({
        title: 'Export failed',
        description: err?.message || 'Unable to export data.',
        variant: 'destructive',
      })
    }
  }

  // ── Derived ───────────────────────────────────────────────────────────────
  const meta = REPORT_TYPE_META[reportType]
  const sortedYears = useMemo(
    () =>
      [...(censusYearsData?.years ?? [])].sort(
        (a: { year: number }, b: { year: number }) => b.year - a.year,
      ),
    [censusYearsData],
  )

  // ── Preview counts (for badge in header) ─────────────────────────────────
  const previewCount =
    reportType === 'compliance-summary'
      ? compData?.count
      : reportType === 'site-management'
      ? sitesData?.count
      : reportType === 'rules'
      ? rulesData?.count
      : communityData?.count

  const isLoading =
    reportType === 'compliance-summary'
      ? compLoading
      : reportType === 'site-management'
      ? sitesLoading
      : reportType === 'rules'
      ? rulesLoading
      : communityLoading

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className='space-y-5'>

      {/* ── Report type + Year ─────────────────────────────────────────────── */}
      <Card>
        <CardHeader className='pb-3'>
          <CardTitle className='flex items-center gap-2 text-base'>
            <FileText className='h-5 w-5' />
            Report Configuration
          </CardTitle>
          <CardDescription>
            Select a report type and apply filters, then preview or export the data.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-end'>
            <div className='space-y-1'>
              <Label>Report Type</Label>
              <Select
                value={reportType}
                onValueChange={(v) => setReportType(v as ReportType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.entries(REPORT_TYPE_META) as [ReportType, typeof meta][]).map(
                    ([key, m]) => (
                      <SelectItem key={key} value={key}>
                        {m.label}
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className='space-y-1'>
              <Label>Census Year</Label>
              <Select
                value={selectedYear?.toString() ?? ''}
                onValueChange={(v) => setSelectedYear(parseInt(v))}
              >
                <SelectTrigger>
                  <SelectValue placeholder='Select year' />
                </SelectTrigger>
                <SelectContent>
                  {sortedYears.map((y: { id: number; year: number }) => (
                    <SelectItem key={y.id} value={y.year.toString()}>
                      {y.year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className='flex items-end gap-2'>
              <Button
                onClick={handleExport}
                disabled={isExporting}
                className='w-full'
                variant='outline'
              >
                {isExporting ? (
                  <Loader2 className='h-4 w-4 mr-2 animate-spin' />
                ) : (
                  <Download className='h-4 w-4 mr-2' />
                )}
                {isExporting ? 'Exporting…' : 'Export CSV'}
              </Button>
            </div>
          </div>

          {/* Active report description badge */}
          <div className='mt-4 flex items-center gap-2'>
            <meta.Icon className={`h-4 w-4 ${meta.color}`} />
            <span className='text-sm text-muted-foreground'>{meta.description}</span>
            {previewCount !== undefined && (
              <Badge variant='secondary' className='ml-auto'>
                {previewCount} record{previewCount !== 1 ? 's' : ''}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── Filters ────────────────────────────────────────────────────────── */}
      <Card>
        <CardHeader className='pb-3'>
          <CardTitle className='text-sm font-semibold text-muted-foreground uppercase tracking-wide'>
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* ── Compliance filters ── */}
          {reportType === 'compliance-summary' && (
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'>
              <div className='space-y-1 sm:col-span-2 lg:col-span-2'>
                <Label>Search (Census Subdivision)</Label>
                <div className='relative'>
                  <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
                  <Input
                    className='pl-9'
                    placeholder='Search by census subdivision…'
                    value={compSearch}
                    onChange={(e) => setCompSearch(e.target.value)}
                  />
                </div>
              </div>

              <div className='space-y-1'>
                <Label>Program</Label>
                <Select value={compProgram || 'all'} onValueChange={(v) => setCompProgram(v === 'all' ? '' : v)}>
                  <SelectTrigger><SelectValue placeholder='All Programs' /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value='all'>All Programs</SelectItem>
                    <SelectItem value='Paint'>Paint</SelectItem>
                    <SelectItem value='Lighting'>Lighting</SelectItem>
                    <SelectItem value='Solvents'>Solvents</SelectItem>
                    <SelectItem value='Pesticides'>Pesticides</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className='space-y-1'>
                <Label>Status</Label>
                <Select value={compStatus || 'all'} onValueChange={(v) => setCompStatus(v === 'all' ? '' : v)}>
                  <SelectTrigger><SelectValue placeholder='All Statuses' /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value='all'>All Statuses</SelectItem>
                    <SelectItem value='compliant'>Compliant</SelectItem>
                    <SelectItem value='shortfall'>Shortfall</SelectItem>
                    <SelectItem value='excess'>Excess</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* ── Site Management filters ── */}
          {reportType === 'site-management' && (
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'>
              <div className='space-y-1 sm:col-span-2'>
                <Label>Search</Label>
                <div className='relative'>
                  <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
                  <Input
                    className='pl-9'
                    placeholder='Search sites…'
                    value={siteSearch}
                    onChange={(e) => setSiteSearch(e.target.value)}
                  />
                </div>
              </div>

              <div className='space-y-1'>
                <Label>Site Type</Label>
                <Select value={siteSiteType || 'all'} onValueChange={(v) => setSiteSiteType(v === 'all' ? '' : v)}>
                  <SelectTrigger><SelectValue placeholder='All Types' /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value='all'>All Types</SelectItem>
                    <SelectItem value='Collection Site'>Collection Site</SelectItem>
                    <SelectItem value='Event'>Event</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className='space-y-1'>
                <Label>Operator Type</Label>
                <Select value={siteOperatorType} onValueChange={setSiteOperatorType}>
                  <SelectTrigger><SelectValue placeholder='All Operators' /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value='all'>All Operators</SelectItem>
                    <SelectItem value='Retailer'>Retailer</SelectItem>
                    <SelectItem value='Distributor'>Distributor</SelectItem>
                    <SelectItem value='Municipal'>Municipal</SelectItem>
                    <SelectItem value='First Nation/Indigenous'>First Nation / Indigenous</SelectItem>
                    <SelectItem value='Private Depot'>Private Depot</SelectItem>
                    <SelectItem value='Product Care'>Product Care</SelectItem>
                    <SelectItem value='Regional District'>Regional District</SelectItem>
                    <SelectItem value='Others'>Others</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className='space-y-1'>
                <Label>Status</Label>
                <Select value={siteIsActive} onValueChange={setSiteIsActive}>
                  <SelectTrigger><SelectValue placeholder='All Status' /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value='all'>All Status</SelectItem>
                    <SelectItem value='true'>Active</SelectItem>
                    <SelectItem value='false'>Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* ── Rules filters ── */}
          {reportType === 'rules' && (
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'>
              <div className='space-y-1 sm:col-span-2'>
                <Label>Search</Label>
                <div className='relative'>
                  <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
                  <Input
                    className='pl-9'
                    placeholder='Search rules…'
                    value={rulesSearch}
                    onChange={(e) => setRulesSearch(e.target.value)}
                  />
                </div>
              </div>

              <div className='space-y-1'>
                <Label>Program</Label>
                <Select value={rulesProgram} onValueChange={setRulesProgram}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value='all'>All Programs</SelectItem>
                    <SelectItem value='Paint'>Paint</SelectItem>
                    <SelectItem value='Solvents'>Solvents</SelectItem>
                    <SelectItem value='Pesticides'>Pesticides</SelectItem>
                    <SelectItem value='Lighting'>Lighting</SelectItem>
                    <SelectItem value='All'>All (Offsets)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className='space-y-1'>
                <Label>Category</Label>
                <Select value={rulesCategory} onValueChange={setRulesCategory}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value='all'>All Categories</SelectItem>
                    <SelectItem value='HSP'>HSP (Hazardous & Special Products)</SelectItem>
                    <SelectItem value='EEE'>EEE (Electrical & Electronic Equipment)</SelectItem>
                    <SelectItem value='Offset'>Offset Rules</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className='space-y-1'>
                <Label>Rule Type</Label>
                <Select value={rulesRuleType} onValueChange={setRulesRuleType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value='all'>All Rule Types</SelectItem>
                    <SelectItem value='Site Requirements'>Site Requirements</SelectItem>
                    <SelectItem value='Events'>Events</SelectItem>
                    <SelectItem value='Reallocation'>Reallocation</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className='space-y-1'>
                <Label>Status</Label>
                <Select value={rulesIsActive} onValueChange={setRulesIsActive}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value='all'>All Status</SelectItem>
                    <SelectItem value='true'>Active</SelectItem>
                    <SelectItem value='false'>Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* ── Community filters ── */}
          {reportType === 'community' && (
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
              <div className='space-y-1 sm:col-span-2'>
                <Label>Search</Label>
                <div className='relative'>
                  <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
                  <Input
                    className='pl-9'
                    placeholder='Search communities…'
                    value={commSearch}
                    onChange={(e) => setCommSearch(e.target.value)}
                  />
                </div>
              </div>

              <div className='space-y-1'>
                <Label>Status</Label>
                <Select value={commIsActive} onValueChange={setCommIsActive}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value='all'>All Status</SelectItem>
                    <SelectItem value='true'>Active</SelectItem>
                    <SelectItem value='false'>Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Preview Results ────────────────────────────────────────────────── */}
      <Card>
        <CardHeader className='pb-3'>
          <div className='flex items-center justify-between'>
            <div>
              <CardTitle className='text-base'>Preview</CardTitle>
              <CardDescription>
                Paginated listing using the same APIs as the management pages.{' '}
                <span className='font-medium'>Export CSV</span> downloads the full filtered dataset (not limited to this page).
              </CardDescription>
            </div>
            <Button
              onClick={handleExport}
              disabled={isExporting}
              size='sm'
              variant='outline'
            >
              {isExporting ? (
                <Loader2 className='h-4 w-4 mr-2 animate-spin' />
              ) : (
                <Download className='h-4 w-4 mr-2' />
              )}
              {isExporting ? 'Exporting…' : 'Export CSV'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className='p-0'>
          <div className='overflow-x-auto'>

            {/* ── Compliance preview ── */}
            {reportType === 'compliance-summary' && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Census Subdivision</TableHead>
                    <TableHead>Program</TableHead>
                    <TableHead>Required</TableHead>
                    <TableHead>Actual</TableHead>
                    <TableHead>Shortfall</TableHead>
                    <TableHead>Excess</TableHead>
                    <TableHead>Rate</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {compLoading ? (
                    <TableRow>
                      <TableCell colSpan={8} className='text-center py-10 text-muted-foreground'>
                        <Loader2 className='h-5 w-5 animate-spin inline-block mr-2' />Loading…
                      </TableCell>
                    </TableRow>
                  ) : (compData?.results ?? []).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className='text-center py-10 text-muted-foreground'>
                        No results found
                      </TableCell>
                    </TableRow>
                  ) : (
                    (compData?.results ?? []).map((row) => (
                      <TableRow key={row.id}>
                        <TableCell className='font-medium'>{row.community_name}</TableCell>
                        <TableCell>{row.program}</TableCell>
                        <TableCell>{row.required_sites}</TableCell>
                        <TableCell>{row.actual_sites}</TableCell>
                        <TableCell>{row.shortfall}</TableCell>
                        <TableCell>{row.excess}</TableCell>
                        <TableCell>{row.compliance_rate}%</TableCell>
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
            )}

            {/* ── Sites preview ── */}
            {reportType === 'site-management' && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Site</TableHead>
                    <TableHead>Site #</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Operator Type</TableHead>
                    <TableHead>Community</TableHead>
                    <TableHead>Programs</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sitesLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className='text-center py-10 text-muted-foreground'>
                        <Loader2 className='h-5 w-5 animate-spin inline-block mr-2' />Loading…
                      </TableCell>
                    </TableRow>
                  ) : (sitesData?.results ?? []).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className='text-center py-10 text-muted-foreground'>
                        No sites found
                      </TableCell>
                    </TableRow>
                  ) : (
                    (sitesData?.results ?? []).map((site) => (
                      <TableRow key={site.id}>
                        <TableCell>
                          <div className='font-medium'>{site.site_name}</div>
                          <div className='text-xs text-muted-foreground'>{site.address_city}</div>
                        </TableCell>
                        <TableCell className='text-sm text-muted-foreground'>
                          {site.site_number?.trim() || site.site?.trim() || '—'}
                        </TableCell>
                        <TableCell>{site.site_type || '—'}</TableCell>
                        <TableCell>{site.operator_type || '—'}</TableCell>
                        <TableCell>{site.community_name || site.community || '—'}</TableCell>
                        <TableCell>
                          {[
                            site.program_paint && 'Paint',
                            site.program_lights && 'Lighting',
                            site.program_solvents && 'Solvents',
                            site.program_pesticides && 'Pesticides',
                            site.program_fertilizers && 'Fertilizers',
                          ]
                            .filter(Boolean)
                            .join(', ') || '—'}
                        </TableCell>
                        <TableCell>
                          {site.is_active ? (
                            <Badge className='bg-green-100 text-green-800'>Active</Badge>
                          ) : (
                            <Badge variant='secondary'>Inactive</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}

            {/* ── Rules preview ── */}
            {reportType === 'rules' && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rule</TableHead>
                    <TableHead>Program</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Rule Type</TableHead>
                    <TableHead>Population Range</TableHead>
                    <TableHead>Year</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rulesLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className='text-center py-10 text-muted-foreground'>
                        <Loader2 className='h-5 w-5 animate-spin inline-block mr-2' />Loading…
                      </TableCell>
                    </TableRow>
                  ) : (rulesData?.results ?? []).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className='text-center py-10 text-muted-foreground'>
                        No rules found
                      </TableCell>
                    </TableRow>
                  ) : (
                    (rulesData?.results ?? []).map((rule) => (
                      <TableRow key={rule.id}>
                        <TableCell>
                          <div className='font-medium'>{rule.name || rule.regulatory_rule}</div>
                          {rule.description && (
                            <div className='text-xs text-muted-foreground line-clamp-1'>
                              {rule.description}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>{rule.program}</TableCell>
                        <TableCell>{rule.category}</TableCell>
                        <TableCell>{rule.rule_type}</TableCell>
                        <TableCell className='text-sm'>
                          {rule.min_population !== null && rule.min_population !== undefined
                            ? rule.min_population.toLocaleString()
                            : '—'}
                          {' – '}
                          {rule.max_population !== null && rule.max_population !== undefined
                            ? rule.max_population.toLocaleString()
                            : '∞'}
                        </TableCell>
                        <TableCell>{rule.year}</TableCell>
                        <TableCell>
                          {rule.is_active ? (
                            <Badge className='bg-green-100 text-green-800'>Active</Badge>
                          ) : (
                            <Badge variant='secondary'>Inactive</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}

            {/* ── Community preview ── */}
            {reportType === 'community' && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Community</TableHead>
                    <TableHead>Population</TableHead>
                    <TableHead>Tier</TableHead>
                    <TableHead>Region</TableHead>
                    <TableHead>Province</TableHead>
                    <TableHead>Census Year</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {communityLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className='text-center py-10 text-muted-foreground'>
                        <Loader2 className='h-5 w-5 animate-spin inline-block mr-2' />Loading…
                      </TableCell>
                    </TableRow>
                  ) : (communityData?.results ?? []).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className='text-center py-10 text-muted-foreground'>
                        No communities found
                      </TableCell>
                    </TableRow>
                  ) : (
                    (communityData?.results ?? []).map((comm) => (
                      <TableRow key={comm.id}>
                        <TableCell className='font-medium'>{comm.community_name}</TableCell>
                        <TableCell>
                          {comm.population != null ? comm.population.toLocaleString() : '—'}
                        </TableCell>
                        <TableCell>{comm.tier || '—'}</TableCell>
                        <TableCell>{comm.region || '—'}</TableCell>
                        <TableCell>{comm.province || '—'}</TableCell>
                        <TableCell>{comm.census_year_value}</TableCell>
                        <TableCell>
                          {comm.is_active ? (
                            <Badge className='bg-green-100 text-green-800'>
                              <CheckCircle className='h-3 w-3 mr-1' />
                              Active
                            </Badge>
                          ) : (
                            <Badge variant='secondary'>Inactive</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}

          </div>

          <div className='px-4 pb-4 pt-2 border-t'>
            {reportType === 'compliance-summary' && compData && (
              <PaginationControls
                page={page}
                pageSize={pageSize}
                totalCount={compData.count}
                currentCount={compData.results?.length ?? 0}
                onPageChange={setPage}
                isLoading={compLoading}
                hasNext={!!compData.next}
                hasPrev={!!compData.previous}
                label='results'
                pageSizeOptions={[10, 20, 50, 100]}
                onPageSizeChange={setPageSize}
              />
            )}
            {reportType === 'site-management' && sitesData && (
              <PaginationControls
                page={page}
                pageSize={pageSize}
                totalCount={sitesData.count}
                currentCount={sitesData.results?.length ?? 0}
                onPageChange={setPage}
                isLoading={sitesLoading}
                hasNext={!!sitesData.next}
                hasPrev={!!sitesData.previous}
                label='sites'
                pageSizeOptions={[10, 20, 50, 100]}
                onPageSizeChange={setPageSize}
              />
            )}
            {reportType === 'rules' && rulesData && (
              <PaginationControls
                page={page}
                pageSize={pageSize}
                totalCount={rulesData.count}
                currentCount={rulesData.results?.length ?? 0}
                onPageChange={setPage}
                isLoading={rulesLoading}
                hasNext={!!rulesData.next}
                hasPrev={!!rulesData.previous}
                label='rules'
                pageSizeOptions={[10, 20, 50, 100]}
                onPageSizeChange={setPageSize}
              />
            )}
            {reportType === 'community' && communityData && (
              <PaginationControls
                page={page}
                pageSize={pageSize}
                totalCount={communityData.count}
                currentCount={communityData.results?.length ?? 0}
                onPageChange={setPage}
                isLoading={communityLoading}
                hasNext={!!communityData.next}
                hasPrev={!!communityData.previous}
                label='communities'
                pageSizeOptions={[10, 20, 50, 100]}
                onPageSizeChange={setPageSize}
              />
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
