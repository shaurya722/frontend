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
import { Zap, Calculator, MapPin, Info, Loader2, Edit, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useCensusYears } from "@/hooks/useCensusYears"
import {
  useDirectServiceOffsets,
  useCreateDirectServiceOffset,
  useUpdateDirectServiceOffset,
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
  const { data: offsets, isLoading, isError, error } = useDirectServiceOffsets()
  const createMutation = useCreateDirectServiceOffset()
  const updateMutation = useUpdateDirectServiceOffset()

  const [newOffset, setNewOffset] = useState({
    census_year: 0,
    program: 'Paint' as string,
    percentage: 0,
    is_active: true,
  })

  const [editingId, setEditingId] = useState<number | null>(null)
  const [editPercentage, setEditPercentage] = useState(0)
  const [editIsActive, setEditIsActive] = useState(true)

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

  const getStatusColor = (isActive: boolean) => {
    return isActive
      ? "bg-green-100 text-green-800 border-green-200"
      : "bg-gray-100 text-gray-800 border-gray-200"
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

      {isError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {(error as Error)?.message ?? 'Failed to load direct service offsets.'}
          </AlertDescription>
        </Alert>
      )}

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

      {/* Active Offsets */}
      <Card>
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
      </Card>

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