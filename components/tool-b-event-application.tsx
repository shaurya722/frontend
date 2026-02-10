"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Calendar, CheckCircle, AlertTriangle, Zap } from "lucide-react"
import type { Municipality, CollectionSite } from "@/lib/supabase"
import { getMunicipalities, getSites } from "@/lib/sites"
import * as api from "@/lib/api"
import { getToolBData, applyEventsToCommunit } from "@/lib/api"

interface ShortfallCommunity {
    id: string
    name: string
    shortfall: number
    eventsCount: number
    events: CollectionSite[]
    appliedEvents: string[]
}

export default function ToolBEventApplication() {
    const [communities, setCommunities] = useState<Municipality[]>([])
    const [sites, setSites] = useState<CollectionSite[]>([])
    const [shortfallCommunities, setShortfallCommunities] = useState<ShortfallCommunity[]>([])
    const [selectedProgram, setSelectedProgram] = useState<string>("Paint")
    const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear())
    const [loading, setLoading] = useState(true)

    // Dialog state
    const [isEventDialogOpen, setIsEventDialogOpen] = useState(false)
    const [selectedCommunity, setSelectedCommunity] = useState<ShortfallCommunity | null>(null)
    const [selectedEvents, setSelectedEvents] = useState<string[]>([])

    const programs = ["Paint", "Pesticides", "Solvents", "Lighting"]

    // Max events offset is 35% of total required sites
    const MAX_EVENT_OFFSET_PERCENTAGE = 35

    useEffect(() => {
        fetchData()
    }, [selectedProgram, selectedYear])

    const fetchData = async () => {
        setLoading(true)
        try {
            console.log("[ToolB] Fetching data for program:", selectedProgram, "year:", selectedYear)
            
            // Fetch municipalities and sites first
            const [communitiesResponse, sitesData] = await Promise.all([
                getMunicipalities({ page_size: 1000 }),
                getSites(),
            ])
            
            // Transform ApiMunicipality to Municipality
            const communitiesData: Municipality[] = communitiesResponse.results.map(m => ({
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
            
            setCommunities(communitiesData)
            setSites(sitesData)
            
            // Fetch tool B data separately to handle errors
            try {
                console.log("[ToolB] Fetching tool B data...")
                const toolBData = await getToolBData({ program: selectedProgram, year: selectedYear })
                console.log("[ToolB] Tool B data:", toolBData)
                
                // Store applied events from backend for use in calculateShortfalls
                if (toolBData.data?.communities) {
                    const appliedMap = toolBData.data.communities.reduce((acc: Record<string, string[]>, c: any) => {
                        acc[c.id] = c.applied_events || []
                        return acc
                    }, {})
                    console.log("[ToolB] Applied events map:", appliedMap)
                    setAppliedEventsFromBackend(appliedMap)
                } else {
                    console.log("[ToolB] No communities in tool B data")
                }
            } catch (toolBError) {
                console.error("[ToolB] Error fetching tool B data:", toolBError)
            }
        } catch (error) {
            console.error("Error fetching data:", error)
        } finally {
            setLoading(false)
        }
    }
    
    // Store applied events from backend
    const [appliedEventsFromBackend, setAppliedEventsFromBackend] = useState<Record<string, string[]>>({})

    // Calculate base requirement
    const calculateRequirement = useCallback((population: number, program: string): number => {
        switch (program) {
            case "Paint":
                if (population >= 5000 && population <= 500000) return Math.ceil(population / 40000)
                if (population > 500000) return 13 + Math.ceil((population - 500000) / 150000)
                return population >= 1000 ? 1 : 0
            case "Solvents":
            case "Pesticides":
                if (population >= 10000 && population <= 500000) return Math.ceil(population / 250000)
                if (population > 500000) return 2 + Math.ceil((population - 500000) / 300000)
                return population >= 1000 ? 1 : 0
            case "Lighting":
                if (population >= 1000 && population <= 500000) return Math.ceil(population / 15000)
                if (population > 500000) return 34 + Math.ceil((population - 500000) / 50000)
                return 0
            default:
                return 0
        }
    }, [])

    // Calculate shortfalls and available events
    const calculateShortfalls = useCallback(() => {
        const result: ShortfallCommunity[] = []

        communities.forEach((community) => {
            const required = calculateRequirement(community.population, selectedProgram)
            const communitySites = sites.filter(
                (s) =>
                    s.municipality_id === community.id &&
                    s.programs.includes(selectedProgram) &&
                    (s.status === "Active" || s.status === "Scheduled") &&
                    s.site_type !== "Event",
            )
            const actual = communitySites.length
            
            // Get applied events for this community from backend
            const appliedEvents = appliedEventsFromBackend[community.id] || []
            
            // Shortfall should account for already applied events
            const shortfall = Math.max(0, required - actual - appliedEvents.length)

            // Get events in this community
            const events = sites.filter(
                (s) =>
                    s.municipality_id === community.id &&
                    s.programs.includes(selectedProgram) &&
                    s.site_type === "Event" &&
                    (s.status === "Active" || s.status === "Scheduled"),
            )

            // Show communities with available events (even if shortfall is 0 after applied events)
            // so users can see and manage their applied events
            if (events.length > 0 && (shortfall > 0 || appliedEvents.length > 0)) {
                result.push({
                    id: community.id,
                    name: community.name,
                    shortfall: Math.max(0, required - actual), // Original shortfall before events
                    eventsCount: events.length,
                    events,
                    appliedEvents, // Use applied events from backend
                })
            }
        })

        setShortfallCommunities(result)
    }, [communities, sites, selectedProgram, calculateRequirement, appliedEventsFromBackend])

    useEffect(() => {
        if (communities.length > 0 && sites.length > 0) {
            calculateShortfalls()
        }
    }, [communities, sites, selectedProgram, appliedEventsFromBackend, calculateShortfalls])

    // Calculate total available events and max allowed
    const totalEvents = shortfallCommunities.reduce((sum, c) => sum + c.eventsCount, 0)
    const totalApplied = shortfallCommunities.reduce((sum, c) => sum + c.appliedEvents.length, 0)
    const totalRequired = communities.reduce((sum, c) => sum + calculateRequirement(c.population, selectedProgram), 0)
    const maxEventsAllowed = Math.floor(totalRequired * (MAX_EVENT_OFFSET_PERCENTAGE / 100))
    const remainingToApply = Math.max(0, totalEvents - totalApplied) // Prevent negative values
    const offsetsRemaining = shortfallCommunities.reduce((sum, c) => sum + Math.max(0, c.shortfall - c.appliedEvents.length), 0)

    // Handle opening event selection dialog
    const handleOpenEventDialog = (community: ShortfallCommunity) => {
        setSelectedCommunity(community)
        // Initialize with currently applied events so user can edit them
        setSelectedEvents([...community.appliedEvents])
        setIsEventDialogOpen(true)
    }

    // Handle event selection toggle
    const handleEventToggle = (eventId: string) => {
        setSelectedEvents((prev) => (prev.includes(eventId) ? prev.filter((id) => id !== eventId) : [...prev, eventId]))
    }

    // Handle select all events
    const handleSelectAll = () => {
        if (!selectedCommunity) return
        const remainingShortfall = Math.max(0, selectedCommunity.shortfall - selectedCommunity.appliedEvents.length)
        const maxToSelect = Math.min(remainingShortfall, selectedCommunity.events.length)
        // Select up to the remaining shortfall, prioritizing unapplied events
        const unappliedEvents = selectedCommunity.events
            .filter((e) => !selectedCommunity.appliedEvents.includes(e.id))
            .slice(0, maxToSelect)
            .map((e) => e.id)
        // Include already applied events
        setSelectedEvents([...selectedCommunity.appliedEvents, ...unappliedEvents])
    }

    // Apply selected events (replace existing, not add to them)
    const handleApplyEvents = async () => {
        if (!selectedCommunity) return

        try {
            // Use the backend's POST endpoint which replaces all events for the community
            await api.applyEventsToCommunit({
                community_id: selectedCommunity.id,
                event_ids: selectedEvents,
                program: selectedProgram,
                year: selectedYear,
            })

            // Refresh data from backend to get updated state
            const toolBData = await getToolBData({ program: selectedProgram, year: selectedYear })
            if (toolBData.data?.communities) {
                setAppliedEventsFromBackend(
                    toolBData.data.communities.reduce((acc: Record<string, string[]>, c: any) => {
                        acc[c.id] = c.applied_events || []
                        return acc
                    }, {})
                )
            }

            setIsEventDialogOpen(false)
            setSelectedCommunity(null)
            setSelectedEvents([])
        } catch (error) {
            console.error("Error applying events:", error)
        }
    }

    // Apply all events across all communities
    const handleApplyAllEvents = async () => {
        // Check if we've already reached the max
        if (totalApplied >= maxEventsAllowed) {
            alert(`Maximum event offset reached (${MAX_EVENT_OFFSET_PERCENTAGE}% of required sites)`)
            return
        }

        // Calculate how many more events we can apply
        const remainingCapacity = maxEventsAllowed - totalApplied
        if (remainingCapacity <= 0) {
            alert(`Maximum event offset reached (${MAX_EVENT_OFFSET_PERCENTAGE}% of required sites)`)
            return
        }

        try {
            // Use the backend's apply-all endpoint
            await api.tools.eventApplication.applyAll({
                program: selectedProgram,
                year: selectedYear,
            })

            // Refresh data from backend to get updated state
            const toolBData = await getToolBData({ program: selectedProgram, year: selectedYear })
            if (toolBData.data?.communities) {
                setAppliedEventsFromBackend(
                    toolBData.data.communities.reduce((acc: Record<string, string[]>, c: any) => {
                        acc[c.id] = c.applied_events || []
                        return acc
                    }, {})
                )
            }
        } catch (error) {
            console.error("Error applying all events:", error)
        }
    }

    return (
        <div className="space-y-6">
            {/* Controls */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
                        {/* Filters */}
                        <div className="grid grid-cols-2 sm:flex sm:flex-row gap-4">
                            <div className="space-y-1">
                                <label className="text-sm font-medium">Program</label>
                                <Select value={selectedProgram} onValueChange={setSelectedProgram}>
                                    <SelectTrigger className="w-full sm:w-40">
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
                            <div className="space-y-1">
                                <label className="text-sm font-medium">Year</label>
                                <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(Number.parseInt(v))}>
                                    <SelectTrigger className="w-full sm:w-32">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="2024">2024</SelectItem>
                                        <SelectItem value="2025">2025</SelectItem>
                                        <SelectItem value="2026">2026</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        {/* Stats and Action */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 lg:flex lg:items-end">
                            <div className="text-center sm:text-right pr-2 mr-2 border-r border-gray-200">
                                <div className="text-xs sm:text-sm text-muted-foreground">Events Remaining</div>
                                <div className="text-xl sm:text-2xl font-bold">{remainingToApply}</div>
                            </div>
                            <div className="text-center sm:text-right pr-2 mr-2 border-r border-gray-200">
                                <div className="text-xs sm:text-sm text-muted-foreground">Offsets Remaining</div>
                                <div className="text-xl sm:text-2xl font-bold">{offsetsRemaining}</div>
                            </div>
                            <div className="text-center sm:text-right mr-5">
                                <div className="text-xs sm:text-sm text-muted-foreground">Max ({MAX_EVENT_OFFSET_PERCENTAGE}%)</div>
                                <div className="text-xl sm:text-2xl font-bold text-blue-600">{maxEventsAllowed}</div>
                            </div>
                            <div className="col-span-2 sm:col-span-1">
                                <Button
                                    onClick={handleApplyAllEvents}
                                    disabled={remainingToApply === 0 || totalApplied >= maxEventsAllowed}
                                    className="w-full sm:w-auto"
                                >
                                    <Zap className="w-4 h-4 mr-2" />
                                    Apply All
                                </Button>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Shortfall Communities Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Communities with Shortfalls and Available Events</CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="text-center py-8">Loading...</div>
                    ) : shortfallCommunities.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <CheckCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p>No communities with both shortfalls and available events</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto -mx-4 sm:mx-0">
                            <div className="inline-block min-w-full align-middle px-4 sm:px-0">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="cursor-pointer hover:bg-muted/50 bg-gray-50">Community</TableHead>
                                            <TableHead className="cursor-pointer hover:bg-muted/50 bg-gray-50 text-right">Shortfall</TableHead>
                                            <TableHead className="cursor-pointer hover:bg-muted/50 bg-gray-50 text-right">Events Available</TableHead>
                                            <TableHead className="cursor-pointer hover:bg-muted/50 bg-gray-50 text-right">Events Applied</TableHead>
                                            <TableHead className="cursor-pointer hover:bg-muted/50 bg-gray-50 text-center">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {shortfallCommunities.map((community) => (
                                            <TableRow key={community.id}>
                                                <TableCell className="font-medium">{community.name}</TableCell>
                                                <TableCell className="text-right">
                                                    <Badge variant={community.shortfall > 0 ? "destructive" : "secondary"}>
                                                        {community.shortfall}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">{community.eventsCount}</TableCell>
                                                <TableCell className="text-right">
                                                    <Badge variant="outline" className="bg-green-50 text-green-700">
                                                        {community.appliedEvents.length}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <Button
                                                        size="sm"
                                                        onClick={() => handleOpenEventDialog(community)}
                                                        disabled={community.eventsCount === 0}
                                                    >
                                                        Edit Events
                                                    </Button>
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

            {/* Event Selection Dialog */}
            <Dialog open={isEventDialogOpen} onOpenChange={setIsEventDialogOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Edit Events for {selectedCommunity?.name}</DialogTitle>
                        <DialogDescription>
                            Select events to apply. Remaining shortfall: {selectedCommunity?.shortfall || 0}. Total events available:{" "}
                            {selectedCommunity?.eventsCount || 0}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">
                                Select events ({selectedEvents.length} of {selectedCommunity?.eventsCount || 0} selected):
                            </span>
                            <Button variant="outline" size="sm" onClick={handleSelectAll}>
                                Select All
                            </Button>
                        </div>

                        <div className="max-h-64 overflow-y-auto space-y-2">
                            {selectedCommunity?.events.map((event) => {
                                const isApplied = selectedCommunity.appliedEvents.includes(event.id)
                                const isSelected = selectedEvents.includes(event.id)
                                return (
                                    <div
                                        key={event.id}
                                        className={`flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer ${
                                            isApplied ? "bg-green-50 border-green-200" : ""
                                        }`}
                                        onClick={() => handleEventToggle(event.id)}
                                    >
                                        <Checkbox checked={isSelected} onCheckedChange={() => handleEventToggle(event.id)} />
                                        <div className="flex-1">
                                            <div className="font-medium flex items-center gap-2">
                                                {event.name}
                                                {isApplied && (
                                                    <Badge variant="outline" className="bg-green-100 text-green-700 text-xs">
                                                        Applied
                                                    </Badge>
                                                )}
                                            </div>
                                            <div className="text-sm text-muted-foreground">{event.address}</div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>

                        {selectedCommunity && (
                            <Alert>
                                <AlertTriangle className="h-4 w-4" />
                                <AlertDescription>
                                    {selectedEvents.length} event(s) selected. Current shortfall: {selectedCommunity.shortfall}. After
                                    applying: {Math.max(0, selectedCommunity.shortfall - (selectedEvents.length - selectedCommunity.appliedEvents.length))}.
                                    {selectedEvents.length > selectedCommunity.shortfall && (
                                        <span className="block mt-1 text-yellow-700">
                                            Note: You're selecting more events than the remaining shortfall.
                                        </span>
                                    )}
                                </AlertDescription>
                            </Alert>
                        )}
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEventDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleApplyEvents}>
                            Save {selectedEvents.length} Event(s)
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
