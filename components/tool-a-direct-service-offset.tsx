"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Calculator, Percent, Save, RefreshCw, Edit2, Check, X } from "lucide-react"
import type { Municipality } from "@/lib/supabase"
import { getMunicipalities } from "@/lib/sites"
import * as api from "@/lib/api"

interface CommunityOffsetResult {
    id: string
    name: string
    population: number
    required: number
    percentageReduction: number
    newRequired: number
    isEditing: boolean
    customPercentage?: number
}

export default function ToolADirectServiceOffset() {
    const [communities, setCommunities] = useState<Municipality[]>([])
    const [results, setResults] = useState<CommunityOffsetResult[]>([])
    const [globalPercentage, setGlobalPercentage] = useState<number>(0)
    const [selectedProgram, setSelectedProgram] = useState<string>("Paint")
    const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear())
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    const programs = ["Paint", "Pesticides", "Solvents", "Lighting"]

    useEffect(() => {
        fetchCommunities()
    }, [])

    const fetchCommunities = async () => {
        try {
            const data = await getMunicipalities({ page_size: 1000 })
            // Transform ApiMunicipality to Municipality
            const transformedCommunities: Municipality[] = data.results.map(m => ({
                id: m.id,
                name: m.name,
                population: m.population,
                tier: m.tier,
                region: m.region,
                province: m.province,
                census_year: m.census_year,
                created_at: m.created_at,
                updated_at: m.updated_at,
            }))
            setCommunities(transformedCommunities)
        } catch (error) {
            console.error("Error fetching communities:", error)
        } finally {
            setLoading(false)
        }
    }

    // Calculate base requirement based on program and population
    const calculateBaseRequirement = useCallback((population: number, program: string): number => {
        switch (program) {
            case "Paint":
                if (population >= 5000 && population <= 500000) {
                    return Math.ceil(population / 40000)
                } else if (population > 500000) {
                    return 13 + Math.ceil((population - 500000) / 150000)
                } else {
                    return population >= 1000 ? 1 : 0
                }
            case "Solvents":
            case "Pesticides":
                if (population >= 10000 && population <= 500000) {
                    return Math.ceil(population / 250000)
                } else if (population > 500000) {
                    return 2 + Math.ceil((population - 500000) / 300000)
                } else {
                    return population >= 1000 ? 1 : 0
                }
            case "Lighting":
                if (population >= 1000 && population <= 500000) {
                    return Math.ceil(population / 15000)
                } else if (population > 500000) {
                    return 34 + Math.ceil((population - 500000) / 50000)
                }
                return 0
            default:
                return 0
        }
    }, [])

    // Calculate new required after offset (rounds UP, minimum 1)
    const calculateNewRequired = useCallback((required: number, percentage: number): number => {
        if (required === 0) return 0
        const reduction = required * (percentage / 100)
        const newRequired = Math.ceil(required - reduction)
        return Math.max(1, newRequired) // Minimum 1 site required
    }, [])

    // Apply global percentage to all communities
    const handleApplyAll = useCallback(() => {
        const newResults = communities.map((community) => {
            const required = calculateBaseRequirement(community.population, selectedProgram)
            return {
                id: community.id,
                name: community.name,
                population: community.population,
                required,
                percentageReduction: globalPercentage,
                newRequired: calculateNewRequired(required, globalPercentage),
                isEditing: false,
            }
        })
        setResults(newResults)
    }, [communities, globalPercentage, selectedProgram, calculateBaseRequirement, calculateNewRequired])

    // Handle individual community percentage edit
    const handleEditCommunity = (id: string) => {
        setResults(
            results.map((r) => (r.id === id ? { ...r, isEditing: true, customPercentage: r.percentageReduction } : r)),
        )
    }

    const handleSaveCommunityEdit = (id: string) => {
        setResults(
            results.map((r) => {
                if (r.id === id) {
                    const newPercentage = r.customPercentage || 0
                    return {
                        ...r,
                        percentageReduction: newPercentage,
                        newRequired: calculateNewRequired(r.required, newPercentage),
                        isEditing: false,
                    }
                }
                return r
            }),
        )
    }

    const handleCancelEdit = (id: string) => {
        setResults(results.map((r) => (r.id === id ? { ...r, isEditing: false, customPercentage: undefined } : r)))
    }

    const handleCustomPercentageChange = (id: string, value: number) => {
        setResults(results.map((r) => (r.id === id ? { ...r, customPercentage: Math.min(100, Math.max(0, value)) } : r)))
    }

    // Save offsets to database
    const handleSaveOffsets = async () => {
        setSaving(true)
        try {
            // Save global offset
            await api.tools.directServiceOffset.create({
                program: selectedProgram,
                year: selectedYear,
                global_percentage: globalPercentage,
            })

            // Save community-specific offsets
            for (const result of results) {
                if (result.percentageReduction !== globalPercentage) {
                    await api.tools.communityOffset.create({
                        community_id: result.id,
                        program: selectedProgram,
                        year: selectedYear,
                        percentage_override: result.percentageReduction,
                        new_required: result.newRequired,
                    })
                }
            }

            alert("Offsets saved successfully!")
        } catch (error) {
            console.error("Error saving offsets:", error)
            alert("Error saving offsets")
        } finally {
            setSaving(false)
        }
    }

    const totalOriginalRequired = results.reduce((sum, r) => sum + r.required, 0)
    const totalNewRequired = results.reduce((sum, r) => sum + r.newRequired, 0)
    const totalReduction = totalOriginalRequired - totalNewRequired

    return (
        <div className="space-y-6">
            {/* <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Calculator className="w-5 h-5" />
                        Direct Service Offset
                    </CardTitle>
                    <CardDescription>
                        A one-time per year reduction of collection sites applied equally across all communities. Product Care
                        manually inputs the %, and the tool automatically reduces the number of collection sites required across all
                        communities equally by that percentage.
                    </CardDescription>
                </CardHeader>
            </Card> */}

            {/* Global Controls */}
            <Card>
                <CardHeader>
                    <CardTitle>Global Percentage Reduction</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                        <div className="space-y-2">
                            <Label>Program</Label>
                            <Select value={selectedProgram} onValueChange={setSelectedProgram}>
                                <SelectTrigger className="w-full">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {programs.map((p) => (
                                        <SelectItem key={p} value={p}>
                                            {p}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Year</Label>
                            <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(Number.parseInt(v))}>
                                <SelectTrigger className="w-full">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="2024">2024</SelectItem>
                                    <SelectItem value="2025">2025</SelectItem>
                                    <SelectItem value="2026">2026</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Global % Reduction</Label>
                            <div className="flex items-center gap-2">
                                <Input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={globalPercentage}
                                    onChange={(e) =>
                                        setGlobalPercentage(Math.min(100, Math.max(0, Number.parseFloat(e.target.value) || 0)))
                                    }
                                    className="flex-1"
                                />
                                <Percent className="w-4 h-4 text-muted-foreground shrink-0" />
                            </div>
                        </div>
                        <Button onClick={handleApplyAll} className="w-full">
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Apply All
                        </Button>
                    </div>

                    <Alert className="mt-4">
                        <Calculator className="h-4 w-4" />
                        <AlertDescription>
                            <strong>Calculation:</strong> New Required = ceil(Required × (1 - %reduction)). Every community requiring
                            at least 1 site will still require minimum 1 site (cannot be reduced below 1).
                        </AlertDescription>
                    </Alert>
                </CardContent>
            </Card>

            {/* Summary Stats */}
            {results.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Original Sites Required</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{totalOriginalRequired}</div>
                            <p className="text-xs text-muted-foreground">sites before offset</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Remaining Sites Required </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">{totalNewRequired}</div>
                            <p className="text-xs text-muted-foreground">sites after offset</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Total Sites Reduced</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-blue-600">{totalReduction}</div>
                            <p className="text-xs text-muted-foreground">sites reduced</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Reduction Rate</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {totalOriginalRequired > 0 ? Math.round((totalReduction / totalOriginalRequired) * 100) : 0}%
                            </div>
                            <p className="text-xs text-muted-foreground">effective reduction</p>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Results Table */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>Community Offset Results</CardTitle>
                        {results.length > 0 && (
                            <Button onClick={handleSaveOffsets} disabled={saving}>
                                <Save className="w-4 h-4 mr-2" />
                                {saving ? "Saving..." : "Save Offsets"}
                            </Button>
                        )}
                    </div>
                </CardHeader>
                <CardContent>
                    {results.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <Calculator className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p>No offset calculations yet</p>
                            <p className="text-sm">Set a global percentage and click "Apply All" to calculate</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto -mx-4 sm:mx-0">
                            <div className="inline-block min-w-full align-middle px-4 sm:px-0">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Community</TableHead>
                                            <TableHead className="text-right">Required</TableHead>
                                            <TableHead className="text-right">% Reduction</TableHead>
                                            <TableHead className="text-right">New Required</TableHead>
                                            <TableHead className="text-center">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {results.map((result) => (
                                            <TableRow key={result.id}>
                                                <TableCell>
                                                    <div>
                                                        <div className="font-medium">{result.name}</div>
                                                        <div className="text-sm text-muted-foreground">Pop: {result.population.toLocaleString()}</div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right">{result.required}</TableCell>
                                                <TableCell className="text-right">
                                                    {result.isEditing ? (
                                                        <div className="flex items-center justify-end gap-1">
                                                            <Input
                                                                type="number"
                                                                min="0"
                                                                max="100"
                                                                value={result.customPercentage || 0}
                                                                onChange={(e) =>
                                                                    handleCustomPercentageChange(result.id, Number.parseFloat(e.target.value) || 0)
                                                                }
                                                                className="w-20 text-right"
                                                            />
                                                            <span>%</span>
                                                        </div>
                                                    ) : (
                                                        <Badge variant={result.percentageReduction !== globalPercentage ? "default" : "secondary"}>
                                                            {result.percentageReduction}%
                                                        </Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <span className="font-bold text-green-600">{result.newRequired}</span>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    {result.isEditing ? (
                                                        <div className="flex items-center justify-center gap-1">
                                                            <Button variant="ghost" size="icon" onClick={() => handleSaveCommunityEdit(result.id)}>
                                                                <Check className="w-4 h-4 text-green-600" />
                                                            </Button>
                                                            <Button variant="ghost" size="icon" onClick={() => handleCancelEdit(result.id)}>
                                                                <X className="w-4 h-4 text-red-600" />
                                                            </Button>
                                                        </div>
                                                    ) : (
                                                        <Button variant="ghost" size="icon" onClick={() => handleEditCommunity(result.id)}>
                                                            <Edit2 className="w-4 h-4" />
                                                        </Button>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
