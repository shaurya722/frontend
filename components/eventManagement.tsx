"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Calendar, CheckCircle, AlertTriangle, Zap } from "lucide-react";
import { useCensusYears } from "@/features/communities/hooks";
import { useApproveEvents, useEventListing } from "@/features/events/hooks";

interface Event {
  id: number;
  site_id: string;
  site_name: string;
  is_active: boolean;
}

interface ApiResponse {
  community: {
    id: string;
    name: string;
  };
  Events: Event[];
  shortfall: number;
  applied_event: number;
  availabel_event: number;
}

interface ShortfallCommunity {
  id: string;
  name: string;
  shortfall: number;
  eventsCount: number;
  events: Event[];
  appliedEvents: number[];
}

export default function ToolBEventApplication() {
  const [shortfallCommunities, setShortfallCommunities] = useState<
    ShortfallCommunity[]
  >([]);
  const [selectedProgram, setSelectedProgram] = useState<string>("Paint");
  const [selectedYear, setSelectedYear] = useState<number>(
    new Date().getFullYear(),
  );

  // Dialog state
  const [isEventDialogOpen, setIsEventDialogOpen] = useState(false);
  const [selectedCommunity, setSelectedCommunity] =
    useState<ShortfallCommunity | null>(null);
  const [selectedEvents, setSelectedEvents] = useState<number[]>([]);

  // UI state
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // Search and pagination state
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sortBy, setSortBy] = useState("-shortfall");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  const programs = ["Paint", "Pesticides", "Solvents", "Lighting"];

  // Max events offset is 35% of total required sites
  const MAX_EVENT_OFFSET_PERCENTAGE = 35;

  const { data: censusYearsData } = useCensusYears();

  const { data: eventData, isLoading } = useEventListing({
    year: selectedYear,
    search: debouncedSearch || undefined,
    page: currentPage,
    limit: pageSize,
  });

  const approveEventsMutation = useApproveEvents();

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1); // reset page on search change
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    if (eventData) {
      // Transform API response to ShortfallCommunity
      const transformedData: ShortfallCommunity[] = eventData.results.map(
        (item: ApiResponse) => ({
          id: item.community.id,
          name: item.community.name,
          shortfall: item.shortfall,
          eventsCount: item.Events.length,
          events: item.Events.map((e: Event) => ({
            id: e.id,
            site_id: e.site_id,
            site_name: e.site_name,
            is_active: e.is_active,
          })),
          appliedEvents: item.Events.slice(0, item.applied_event).map(
            (e: Event) => e.id,
          ),
        }),
      );

      setShortfallCommunities(transformedData);
    }
  }, [eventData]);

  // Calculate total available events and max allowed
  const totalEvents = shortfallCommunities.reduce(
    (sum, c) => sum + c.eventsCount,
    0,
  );
  const totalApplied = shortfallCommunities.reduce(
    (sum, c) => sum + c.appliedEvents.length,
    0,
  );
  const totalRequired = 100; // Static value
  const maxEventsAllowed = Math.floor(
    totalRequired * (MAX_EVENT_OFFSET_PERCENTAGE / 100),
  );
  const remainingToApply = Math.max(0, totalEvents - totalApplied); // Prevent negative values
  const offsetsRemaining = shortfallCommunities.reduce(
    (sum, c) => sum + Math.max(0, c.shortfall - c.appliedEvents.length),
    0,
  );
  useEffect(() => {
    if (censusYearsData?.years && censusYearsData.years.length > 0) {
      const latestYear = Math.max(
        ...censusYearsData.years.map((y: { year: number }) => y.year),
      );
      setSelectedYear(latestYear);
    }
  }, [censusYearsData]);
  // Handle opening event selection dialog
  const handleOpenEventDialog = (community: ShortfallCommunity) => {
    setSelectedCommunity(community);
    // Initialize with currently applied events so user can edit them
    setSelectedEvents([...community.appliedEvents]);
    setIsEventDialogOpen(true);
  };

  // Handle event selection toggle
  const handleEventToggle = (eventId: number, checked: boolean | string) => {
    if (checked === true) {
      setSelectedEvents((prev) => [...prev, eventId]);
    } else {
      setSelectedEvents((prev) => prev.filter((id) => id !== eventId));
    }
  };

  // Handle select all events
  const handleSelectAll = () => {
    if (!selectedCommunity) return;
    const remainingShortfall = Math.max(
      0,
      selectedCommunity.shortfall - selectedCommunity.appliedEvents.length,
    );
    const maxToSelect = Math.min(
      remainingShortfall,
      selectedCommunity.events.length,
    );
    // Select up to the remaining shortfall, prioritizing unapplied events
    const unappliedEvents = selectedCommunity.events
      .filter((e) => !selectedCommunity.appliedEvents.includes(e.id))
      .slice(0, maxToSelect)
      .map((e) => e.id);
    // Include already applied events
    setSelectedEvents([...selectedCommunity.appliedEvents, ...unappliedEvents]);
  };

  // Apply selected events
  const handleApplyEvents = async () => {
    if (!selectedCommunity) return;

    try {
      const siteIdsSelected = selectedEvents;
      const siteIdsUnchecked = selectedCommunity.appliedEvents.filter(
        (id) => !selectedEvents.includes(id),
      );

      // Call API for unchecked events with false and selected with true
      await Promise.all([
        siteIdsUnchecked.length > 0
          ? approveEventsMutation.mutateAsync({
              site_ids: siteIdsUnchecked,
              is_event: false,
            })
          : Promise.resolve(),
        siteIdsSelected.length > 0
          ? approveEventsMutation.mutateAsync({
              site_ids: siteIdsSelected,
              is_event: true,
            })
          : Promise.resolve(),
      ]);

      // Update local state
      setShortfallCommunities((prev) =>
        prev.map((c) =>
          c.id === selectedCommunity.id
            ? { ...c, appliedEvents: selectedEvents }
            : c,
        ),
      );

      setIsEventDialogOpen(false);
      setSelectedCommunity(null);
      setSelectedEvents([]);
      setSuccessMessage(
        `Events updated successfully for ${selectedCommunity.name}`,
      );
    } catch (error: any) {
      setErrorMessage(error.message || "Failed to update events");
    }
  };

  // Apply all events across all communities (static)
  const handleApplyAllEvents = async () => {
    // Check if we've already reached the max
    if (totalApplied >= maxEventsAllowed) {
      alert(
        `Maximum event offset reached (${MAX_EVENT_OFFSET_PERCENTAGE}% of required sites)`,
      );
      return;
    }

    // Simulate applying all remaining events
    setShortfallCommunities((prev) =>
      prev.map((c) => ({
        ...c,
        appliedEvents: c.events.map((e) => e.id),
      })),
    );
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col xl:flex-row xl:items-end xl:justify-between gap-4">
            {/* Filters */}
            <div className="grid grid-cols-2 gap-4">
              {/* <div className='space-y-1 [&_button]:min-w-40 [&_button]:md:min-w-full'>
                <label className='text-sm font-medium'>Program</label>
                <Select
                  value={selectedProgram}
                  onValueChange={setSelectedProgram}
                >
                  <SelectTrigger className='w-full sm:w-40'>
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
              </div> */}

              {/* Search and Sort */}
              <div className="space-y-1 [&_button]:min-w-40 [&_button]:md:min-w-full">
                <label className="text-sm font-medium">Search</label>

                <Input
                  placeholder="Search communities..."
                  value={searchQuery}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setSearchQuery(e.target.value)
                  }
                  className="flex-1"
                />
              </div>
              <div className="space-y-1 [&_button]:min-w-40 [&_button]:md:min-w-full">
                <label className="text-sm font-medium">Year</label>
                <Select
                  value={selectedYear.toString()}
                  onValueChange={(v) => setSelectedYear(Number.parseInt(v))}
                >
                  <SelectTrigger className="w-full sm:w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {censusYearsData?.years?.map((year) => (
                      <SelectItem key={year.id} value={year.year.toString()}>
                        {year.year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Stats and Action */}
            {/* <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 lg:gap-0'>
              <div className='text-center sm:text-right pr-2 mr-2 border-r border-gray-200'>
                <div className='text-xs sm:text-sm text-muted-foreground'>
                  Events Remaining
                </div>
                <div className='text-xl sm:text-2xl font-bold'>
                  {remainingToApply}
                </div>
              </div>
              <div className='text-center sm:text-right pr-2 mr-2 border-r border-gray-200'>
                <div className='text-xs sm:text-sm text-muted-foreground'>
                  Offsets Remaining
                </div>
                <div className='text-xl sm:text-2xl font-bold'>
                  {offsetsRemaining}
                </div>
              </div>
              <div className='text-center sm:text-right mr-5'>
                <div className='text-xs sm:text-sm text-muted-foreground'>
                  Max ({MAX_EVENT_OFFSET_PERCENTAGE}%)
                </div>
                <div className='text-xl sm:text-2xl font-bold text-blue-600'>
                  {maxEventsAllowed}
                </div>
              </div>
              <div className='col-span-2 sm:col-span-1 md:col-end-4 lg:col-end-auto text-right'>
                <Button
                  onClick={handleApplyAllEvents}
                  disabled={
                    remainingToApply === 0 || totalApplied >= maxEventsAllowed
                  }
                  className='w-full sm:w-auto'
                >
                  <Zap className='w-4 h-4 mr-2' />
                  Apply All
                </Button>
              </div>
            </div> */}
          </div>
        </CardContent>
      </Card>

      {/* Shortfall Communities Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Communities with Shortfalls and Available Events
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
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
                      <TableHead className="cursor-pointer hover:bg-muted/50 bg-gray-50">
                        Community
                      </TableHead>
                      <TableHead className="cursor-pointer hover:bg-muted/50 bg-gray-50 text-right">
                        Shortfall
                      </TableHead>
                      <TableHead className="cursor-pointer hover:bg-muted/50 bg-gray-50 text-right">
                        Events Available
                      </TableHead>
                      <TableHead className="cursor-pointer hover:bg-muted/50 bg-gray-50 text-right">
                        Events Applied
                      </TableHead>
                      <TableHead className="cursor-pointer hover:bg-muted/50 bg-gray-50 text-center">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {shortfallCommunities.map((community) => (
                      <TableRow key={community.id}>
                        <TableCell className="font-medium">
                          {community.name}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge
                            variant={
                              community.shortfall > 0
                                ? "destructive"
                                : "secondary"
                            }
                          >
                            {community.shortfall}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {community.eventsCount}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge
                            variant="outline"
                            className="bg-green-50 text-green-700"
                          >
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

      {/* Pagination */}
      <div className="flex justify-between items-center mt-4">
        <Button
          variant="outline"
          onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
          disabled={currentPage <= 1 || isLoading}
        >
          Previous
        </Button>
        <span>Page {currentPage}</span>
        <Button
          variant="outline"
          onClick={() => setCurrentPage((prev) => prev + 1)}
          disabled={isLoading}
        >
          Next
        </Button>
      </div>

      {/* Event Selection Dialog */}
      <Dialog open={isEventDialogOpen} onOpenChange={setIsEventDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Events for {selectedCommunity?.name}</DialogTitle>
            <DialogDescription>
              Select events to apply. Remaining shortfall:{" "}
              {selectedCommunity?.shortfall || 0}. Total events available:{" "}
              {selectedCommunity?.eventsCount || 0}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Select events ({selectedEvents.length} of{" "}
                {selectedCommunity?.eventsCount || 0} selected):
              </span>
              <Button variant="outline" size="sm" onClick={handleSelectAll}>
                Select All
              </Button>
            </div>

            <div className="max-h-64 overflow-y-auto space-y-2">
              {selectedCommunity?.events.map((event) => {
                const isApplied = selectedCommunity.appliedEvents.includes(
                  event.id,
                );
                const isSelected = selectedEvents.includes(event.id);
                const handleClick = () =>
                  handleEventToggle(event.id, !isSelected);
                return (
                  <div
                    key={event.id}
                    className={`flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer ${
                      isApplied ? "bg-green-50 border-green-200" : ""
                    }`}
                    onClick={handleClick}
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={(checked) =>
                        handleEventToggle(event.id, checked as boolean)
                      }
                    />
                    <div className="flex-1">
                      <div className="font-medium flex items-center gap-2">
                        {event.site_name}
                        {isApplied && (
                          <Badge
                            variant="outline"
                            className="bg-green-100 text-green-700 text-xs"
                          >
                            Applied
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Site ID: {event.site_id}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {selectedCommunity && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  {selectedEvents.length} event(s) selected. Current shortfall:{" "}
                  {selectedCommunity.shortfall}. After applying:{" "}
                  {Math.max(
                    0,
                    selectedCommunity.shortfall -
                      (selectedEvents.length -
                        selectedCommunity.appliedEvents.length),
                  )}
                  .
                  {selectedEvents.length > selectedCommunity.shortfall && (
                    <span className="block mt-1 text-yellow-700">
                      Note: You're selecting more events than the remaining
                      shortfall.
                    </span>
                  )}
                </AlertDescription>
              </Alert>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEventDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleApplyEvents}
              disabled={approveEventsMutation.isPending}
            >
              {approveEventsMutation.isPending
                ? "Saving..."
                : `Save ${selectedEvents.length} Event(s)`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
