"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Zap, Calculator, MapPin, Info, Loader2, Edit, AlertCircle, FileText, RefreshCw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useCensusYears } from "@/hooks/useCensusYears"
import {
  useDirectServiceOffsets,
  useCreateDirectServiceOffset,
  useUpdateDirectServiceOffset,
  useDirectServiceOffsetPreview,
  useCreateCommunityOffset,
  useUpdateCommunityOffset,
} from "@/hooks/useDirectServiceOffsets"

const PROGRAMS = [
  'Paint',
  'Lighting',
  'Solvents',
  'Pesticides',
  'Fertilizers',
] as const

export default function DirectServiceOffset() {
  const { toast } = useToast()
  const { data: censusYearsData } = useCensusYears()
  // const { data: offsets, isLoading, isError, error } = useDirectServiceOffsets()
  const createMutation = useCreateDirectServiceOffset()
  const updateMutation = useUpdateDirectServiceOffset()
  const createCommunityMutation = useCreateCommunityOffset()
  const updateCommunityMutation = useUpdateCommunityOffset()

  const [newOffset, setNewOffset] = useState({
    census_year: 0,
    program: 'Paint' as string,
    percentage: 0,
    is_active: true,
  })

  const [editingId, setEditingId] = useState<number | null>(null)
  const [editPercentage, setEditPercentage] = useState(0)
  const [editIsActive, setEditIsActive] = useState(true)

  // Global percentage reduction state - default to year 2050 and Paint
  const [globalReduction, setGlobalReduction] = useState({
    program: 'Paint' as string,
    year: 2050 as number,
    percentage: 0,
  })
  const [isApplyingGlobal, setIsApplyingGlobal] = useState(false)

  // Community editing state
  const [editingCommunityId, setEditingCommunityId] = useState<string | null>(null)
  const [editingCommunityPercentage, setEditingCommunityPercentage] = useState(0)

  const censusYearOptions = useMemo(() => {
    const fromApi = censusYearsData?.years?.map((y) => y) ?? []
    return fromApi
  }, [censusYearsData])

  const handleCreateOffset = async () => {
    if (!newOffset.census_year || newOffset.percentage === 0) {
      toast({
        title: 'Missing fields',
        description: 'Please select a census year and enter a percentage.',
        variant: 'destructive',
      })
      return
    }

    try {
      await createMutation.mutateAsync({
        census_year: newOffset.census_year,
        program: newOffset.program,
        percentage: newOffset.percentage,
        is_active: newOffset.is_active,
      })
      toast({
        title: 'Offset created',
        description: 'Direct service offset has been created successfully.',
      })
      setNewOffset({
        census_year: 0,
        program: 'Paint',
        percentage: 0,
        is_active: true,
      })
    } catch (e: unknown) {
      const message =
        e && typeof e === 'object' && 'message' in e
          ? String((e as { message?: string }).message)
          : 'Failed to create offset'
      toast({
        title: 'Request failed',
        description: message,
        variant: 'destructive',
      })
    }
  }

  const handleUpdateOffset = async (id: number) => {
    try {
      await updateMutation.mutateAsync({
        id,
        payload: {
          percentage: editPercentage,
          is_active: editIsActive,
        },
      })
      toast({
        title: 'Offset updated',
        description: 'Direct service offset has been updated successfully.',
      })
      setEditingId(null)
    } catch (e: unknown) {
      const message =
        e && typeof e === 'object' && 'message' in e
          ? String((e as { message?: string }).message)
          : 'Failed to update offset'
      toast({
        title: 'Request failed',
        description: message,
        variant: 'destructive',
      })
    }
  }

  const startEditing = (id: number, percentage: number, isActive: boolean) => {
    setEditingId(id)
    setEditPercentage(percentage)
    setEditIsActive(isActive)
  }

  // Find census year ID for the selected year
  const selectedCensusYearId = useMemo(() => {
    const yearOption = censusYearOptions.find((y) => y.year === globalReduction.year)
    return yearOption?.id ?? null
  }, [censusYearOptions, globalReduction.year])

  // Fetch preview data
  const {
    data: previewData,
    isLoading: isPreviewLoading,
    isError: isPreviewError,
    refetch: refetchPreview,
  } = useDirectServiceOffsetPreview(selectedCensusYearId, globalReduction.program)

  const handleApplyGlobalReduction = async () => {
    if (globalReduction.percentage <= 0 || globalReduction.percentage > 100) {
      toast({
        title: 'Invalid percentage',
        description: 'Please enter a percentage between 1 and 100.',
        variant: 'destructive',
      })
      return
    }

    if (!selectedCensusYearId) {
      toast({
        title: 'Invalid year',
        description: 'Please select a valid census year.',
        variant: 'destructive',
      })
      return
    }

    setIsApplyingGlobal(true)
    try {
      // Create the global offset
      await createMutation.mutateAsync({
        census_year: selectedCensusYearId,
        program: globalReduction.program,
        percentage: globalReduction.percentage,
        is_active: true,
      })
      toast({
        title: 'Global reduction applied',
        description: `Applied ${globalReduction.percentage}% reduction to ${globalReduction.program} for ${globalReduction.year}.`,
      })
      // Refresh preview data
      refetchPreview()
    } catch (e: unknown) {
      const message =
        e && typeof e === 'object' && 'message' in e
          ? String((e as { message?: string }).message)
          : 'Failed to apply global reduction'
      toast({
        title: 'Request failed',
        description: message,
        variant: 'destructive',
      })
    } finally {
      setIsApplyingGlobal(false)
    }
  }

  const getStatusColor = (isActive: boolean) => {
    return isActive
      ? "bg-green-100 text-green-800 border-green-200"
      : "bg-gray-100 text-gray-800 border-gray-200"
  }

  // Community editing handlers
  const startEditingCommunity = (communityId: string, currentPercentage: number) => {
    setEditingCommunityId(communityId)
    setEditingCommunityPercentage(currentPercentage)
  }

  const cancelEditingCommunity = () => {
    setEditingCommunityId(null)
    setEditingCommunityPercentage(0)
  }

  const saveCommunityOverride = async (communityId: string, communityName: string) => {
    if (!selectedCensusYearId) {
      toast({
        title: 'Invalid year',
        description: 'Please select a valid census year.',
        variant: 'destructive',
      })
      return
    }

    try {
      // Note: The preview API returns community_id (UUID), but for the actual override
      // we need to either create a new one or update an existing one.
      // Since we don't have the offset ID from preview, we create a new override.
      await createCommunityMutation.mutateAsync({
        census_year: selectedCensusYearId,
        program: globalReduction.program,
        community: communityId,
        percentage: editingCommunityPercentage,
        is_active: true,
      })
      toast({
        title: 'Community override saved',
        description: `${communityName} now has ${editingCommunityPercentage}% reduction.`,
      })
      setEditingCommunityId(null)
      // Refresh the preview list to show updated data
      refetchPreview()
    } catch (e: unknown) {
      const message =
        e && typeof e === 'object' && 'message' in e
          ? String((e as { message?: string }).message)
          : 'Failed to save community override'
      toast({
        title: 'Request failed',
        description: message,
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Direct Service Program Offset
          </CardTitle>
          <CardDescription>Manage annual percentage-based reductions for direct pickup programs</CardDescription>
        </CardHeader>
      </Card>

      {/* {isError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {(error as Error)?.message ?? 'Failed to load direct service offsets.'}
          </AlertDescription>
        </Alert>
      )} */}

      {/* Create New Offset */}
      <Card>
        <CardHeader>
          <CardTitle>Create Direct Service Offset</CardTitle>
          <CardDescription>Configure percentage reduction based on direct pickup volume</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="census-year">Census Year</Label>
              <Select
                value={newOffset.census_year ? String(newOffset.census_year) : ""}
                onValueChange={(value) =>
                  setNewOffset({ ...newOffset, census_year: Number(value) })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select census year" />
                </SelectTrigger>
                <SelectContent>
                  {censusYearOptions.map((y) => (
                    <SelectItem key={y.id} value={String(y.id)}>
                      {y.year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="program">Program</Label>
              <Select
                value={newOffset.program}
                onValueChange={(value) => setNewOffset({ ...newOffset, program: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select program" />
                </SelectTrigger>
                <SelectContent>
                  {PROGRAMS.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="percentage-reduction">Percentage Reduction (%)</Label>
              <Input
                id="percentage-reduction"
                type="number"
                min="0"
                max="100"
                value={newOffset.percentage}
                onChange={(e) =>
                  setNewOffset({ ...newOffset, percentage: Number(e.target.value) || 0 })
                }
                placeholder="Enter percentage reduction"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="is-active">Status</Label>
              <Select
                value={newOffset.is_active ? "active" : "inactive"}
                onValueChange={(value) =>
                  setNewOffset({ ...newOffset, is_active: value === "active" })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button
            onClick={handleCreateOffset}
            disabled={createMutation.isPending || !newOffset.census_year || newOffset.percentage === 0}
          >
            {createMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Creating...
              </>
            ) : (
              'Create Direct Service Offset'
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Global Percentage Reduction */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5" />
            Global Percentage Reduction
          </CardTitle>
          <CardDescription>Apply a global percentage reduction across all communities</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-4 gap-4 items-end">
            <div className="space-y-2">
              <Label htmlFor="global-program">Program</Label>
              <Select
                value={globalReduction.program}
                onValueChange={(value) =>
                  setGlobalReduction({ ...globalReduction, program: value })
                }
              >
                <SelectTrigger id="global-program">
                  <SelectValue placeholder="Select program" />
                </SelectTrigger>
                <SelectContent>
                  {PROGRAMS.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="global-year">Year</Label>
              <Select
                value={String(globalReduction.year)}
                onValueChange={(value) =>
                  setGlobalReduction({ ...globalReduction, year: Number(value) })
                }
              >
                <SelectTrigger id="global-year">
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
                  {censusYearOptions.map((y) => (
                    <SelectItem key={y.id} value={String(y.year)}>
                      {y.year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="global-reduction">Global % Reduction</Label>
              <div className="relative">
                <Input
                  id="global-reduction"
                  type="number"
                  min="0"
                  max="100"
                  value={globalReduction.percentage}
                  onChange={(e) =>
                    setGlobalReduction({ ...globalReduction, percentage: Number(e.target.value) || 0 })
                  }
                  placeholder="0"
                  className="pr-8"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">%</span>
              </div>
            </div>

            <Button
              onClick={handleApplyGlobalReduction}
              disabled={isApplyingGlobal || globalReduction.percentage === 0}
              className="bg-black hover:bg-gray-800"
            >
              {isApplyingGlobal ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                  Applying...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Apply All
                </>
              )}
            </Button>
          </div>

          <Alert className="bg-gray-50 border-gray-200">
            <FileText className="h-4 w-4 text-gray-600" />
            <AlertDescription className="text-gray-700">
              <span className="font-medium">Calculation:</span> New Required = ceil(Required × (1 - %reduction)). Every community requiring at least 1 site will still require minimum 1 site (cannot be reduced below 1).
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Communities Preview Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Communities Affected
          </CardTitle>
          <CardDescription>
            Preview of site requirements for {globalReduction.program} in {globalReduction.year}
            {previewData && ` (${previewData.total_communities} communities)`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isPreviewLoading ? (
            <div className="text-center py-10">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
            </div>
          ) : isPreviewError ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>Failed to load preview data.</AlertDescription>
            </Alert>
          ) : !previewData || previewData.communities.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <MapPin className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No communities found for the selected year and program</p>
            </div>
          ) : (
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="font-medium text-gray-700">Community</TableHead>
                    <TableHead className="font-medium text-gray-700 text-center">Required</TableHead>
                    <TableHead className="font-medium text-gray-700 text-center">% Reduction</TableHead>
                    <TableHead className="font-medium text-gray-700 text-center">New Required</TableHead>
                    <TableHead className="font-medium text-gray-700 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previewData.communities.map((community) => (
                    <TableRow key={community.community_id} className="hover:bg-gray-50">
                      <TableCell>
                        <div className="font-medium text-gray-900">{community.community_name}</div>
                        <div className="text-sm text-gray-500">Pop: {community.population.toLocaleString()}</div>
                      </TableCell>
                      <TableCell className="text-center text-gray-700">
                        {community.base_required_sites}
                      </TableCell>
                      <TableCell className="text-center">
                        {editingCommunityId === community.community_id ? (
                          <div className="flex items-center justify-center gap-1">
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              value={editingCommunityPercentage}
                              onChange={(e) => setEditingCommunityPercentage(Number(e.target.value) || 0)}
                              className="w-16 h-8 text-center px-1"
                            />
                            <span className="text-xs text-gray-500">%</span>
                          </div>
                        ) : (
                          <Badge
                            variant="outline"
                            className={`text-xs ${
                              community.offset_source === 'community'
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : 'bg-blue-50 text-blue-700 border-blue-200'
                            }`}
                          >
                            {community.offset_percentage}%
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <span
                          className={`font-medium ${
                            community.new_required_sites < community.base_required_sites
                              ? 'text-green-600'
                              : 'text-gray-700'
                          }`}
                        >
                          {community.new_required_sites}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        {editingCommunityId === community.community_id ? (
                          <div className="flex justify-end gap-1">
                            <Button
                              size="sm"
                              className="h-8 px-2"
                              onClick={() => saveCommunityOverride(community.community_id, community.community_name)}
                              disabled={createCommunityMutation.isPending}
                            >
                              {createCommunityMutation.isPending ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                'Save'
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 px-2"
                              onClick={cancelEditingCommunity}
                            >
                              Cancel
                            </Button>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0"
                            onClick={() => startEditingCommunity(community.community_id, community.offset_percentage)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Active Offsets */}
      {/* <Card>
        <CardHeader>
          <CardTitle>Active Direct Service Offsets</CardTitle>
          <CardDescription>Current percentage-based reductions for lighting program requirements</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-10">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
            </div>
          ) : !offsets || offsets.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Zap className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No direct service offsets configured</p>
              <p className="text-sm">Create an offset to reduce site requirements</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Census Year</TableHead>
                  <TableHead>Program</TableHead>
                  <TableHead>Percentage</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {offsets.map((offset) => (
                  <TableRow key={offset.id}>
                    <TableCell className="font-medium">{offset.id}</TableCell>
                    <TableCell>
                      {censusYearOptions.find((y) => y.id === offset.census_year)?.year ?? offset.census_year}
                    </TableCell>
                    <TableCell>{offset.program}</TableCell>
                    <TableCell>
                      {editingId === offset.id ? (
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          value={editPercentage}
                          onChange={(e) => setEditPercentage(Number(e.target.value) || 0)}
                          className="w-20"
                        />
                      ) : (
                        <Badge variant="outline" className="bg-blue-50 text-blue-700">
                          {offset.percentage}%
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {editingId === offset.id ? (
                        <Select
                          value={editIsActive ? "active" : "inactive"}
                          onValueChange={(value) => setEditIsActive(value === "active")}
                        >
                          <SelectTrigger className="w-28">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <Badge variant="outline" className={getStatusColor(offset.is_active)}>
                          {offset.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {offset.created_at
                        ? new Date(offset.created_at).toLocaleDateString()
                        : '—'}
                    </TableCell>
                    <TableCell className="text-right">
                      {editingId === offset.id ? (
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleUpdateOffset(offset.id)}
                            disabled={updateMutation.isPending}
                          >
                            {updateMutation.isPending ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              'Save'
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingId(null)}
                          >
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => startEditing(offset.id, offset.percentage, offset.is_active)}
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          Edit
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card> */}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Strategic Geographic Allocation
          </CardTitle>
          <CardDescription>Distribute site reductions across strategic locations</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Direct service offsets should be strategically allocated to areas with highest pickup density to
              maximize program effectiveness while maintaining regulatory compliance.
            </AlertDescription>
          </Alert>

          <div className="mt-4 space-y-2">
            <h4 className="font-medium">Allocation Guidelines:</h4>
            <ul className="text-sm space-y-1 text-gray-600">
              <li>• Prioritize high-density urban areas with established pickup routes</li>
              <li>• Maintain minimum coverage in rural and remote areas</li>
              <li>• Consider transportation logistics and service efficiency</li>
              <li>• Ensure equitable access across census subdivisions</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}