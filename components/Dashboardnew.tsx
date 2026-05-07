"use client";

import { useEffect, useMemo, useState } from "react";
import { Calendar, Clock, Database, MapPin, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useCensusYears } from "@/hooks/useCensusYears";
import { useSites } from "@/features/sites/hooks";
import { useEventListing } from "@/features/events/hooks";
import { useDirectServiceOffsets } from "@/hooks/useDirectServiceOffsets";
import { useMapCommunities } from "@/hooks/useMapCommunities";

type ExpiryBucket = {
  expired: number;
  expiring30: number;
  expiring60: number;
  noEndDate: number;
};

function parseDateOnly(value: string | null | undefined): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isFinite(d.getTime()) ? d : null;
}

function daysUntil(target: Date, now: Date) {
  const ms = target.getTime() - now.getTime();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

function nearestEndDate(row: Record<string, unknown>): Date | null {
  const endKeys = Object.keys(row).filter((k) => k.endsWith("_end_date"));
  const candidates: Date[] = [];

  for (const key of endKeys) {
    const v = row[key];
    if (typeof v === "string" || v === null) {
      const d = parseDateOnly(v);
      if (d) candidates.push(d);
    }
  }

  if (!candidates.length) return null;
  candidates.sort((a, b) => a.getTime() - b.getTime());
  return candidates[0];
}

function computeExpiryBucket(rows: Record<string, unknown>[], now: Date): ExpiryBucket {
  const bucket: ExpiryBucket = { expired: 0, expiring30: 0, expiring60: 0, noEndDate: 0 };

  for (const row of rows) {
    const end = nearestEndDate(row);
    if (!end) {
      bucket.noEndDate += 1;
      continue;
    }
    const d = daysUntil(end, now);
    if (d < 0) bucket.expired += 1;
    else if (d <= 30) bucket.expiring30 += 1;
    else if (d <= 60) bucket.expiring60 += 1;
  }

  return bucket;
}

export default function Dashboardnew() {
  const now = useMemo(() => new Date(), []);
  const { data: censusYearsData } = useCensusYears();
  const [selectedYear, setSelectedYear] = useState<number>(0);

  const availableYears = useMemo(() => {
    const years = censusYearsData?.years?.map((y) => y.year) ?? [];
    return [...years].sort((a, b) => b - a);
  }, [censusYearsData]);

  useEffect(() => {
    if (selectedYear !== 0) return;
    if (!availableYears.length) return;
    setSelectedYear(availableYears[0]);
  }, [availableYears, selectedYear]);

  const sitesQuery = useSites(
    { year: selectedYear || undefined, limit: 5000, page: 1 },
    Boolean(selectedYear),
  );

  const eventListingQuery = useEventListing({
    year: selectedYear,
    page: 1,
    limit: 200,
    sort: "-shortfall",
  });

  const directOffsetsQuery = useDirectServiceOffsets();
  const mapCommunitiesQuery = useMapCommunities();

  const sites = sitesQuery.data?.results ?? [];
  const totalSites = sitesQuery.data?.count ?? sites.length;
  const activeSites = useMemo(
    () => sites.filter((s) => Boolean((s as any).is_active)).length,
    [sites],
  );
  const eventSites = useMemo(
    () => sites.filter((s) => String((s as any).site_type).toLowerCase() === "event").length,
    [sites],
  );

  const siteExpiry = useMemo(() => computeExpiryBucket(sites as any[], now), [sites, now]);
  const eventExpiry = useMemo(() => {
    const eventRows = (sites as any[]).filter(
      (s) => String(s.site_type).toLowerCase() === "event",
    );
    return computeExpiryBucket(eventRows, now);
  }, [sites, now]);

  const eventListingCount = eventListingQuery.data?.count ?? 0;
  const eventListingApplied = useMemo(() => {
    const results = eventListingQuery.data?.results ?? [];
    return results.reduce((sum: number, r: any) => sum + (r.applied_event ?? 0), 0);
  }, [eventListingQuery.data]);

  const eventListingAvailable = useMemo(() => {
    const results = eventListingQuery.data?.results ?? [];
    return results.reduce((sum: number, r: any) => sum + (r.availabel_event ?? 0), 0);
  }, [eventListingQuery.data]);

  const offsetsForYear = useMemo(() => {
    const all = directOffsetsQuery.data ?? [];
    return all.filter((o) => o.census_year === selectedYear);
  }, [directOffsetsQuery.data, selectedYear]);

  const activeOffsets = useMemo(
    () => offsetsForYear.filter((o) => o.is_active),
    [offsetsForYear],
  );

  const offsetPrograms = useMemo(() => {
    const set = new Set(offsetsForYear.map((o) => o.program).filter(Boolean));
    return Array.from(set).sort();
  }, [offsetsForYear]);

  const mapCommunitiesCount = (mapCommunitiesQuery.data as any[])?.length ?? 0;

  const isLoading =
    (selectedYear ? sitesQuery.isLoading : false) ||
    (selectedYear ? eventListingQuery.isLoading : false) ||
    directOffsetsQuery.isLoading ||
    mapCommunitiesQuery.isLoading;

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div className="space-y-2">
              <div className="text-sm font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Census Year
              </div>
              <Select
                value={selectedYear ? String(selectedYear) : ""}
                onValueChange={(v) => setSelectedYear(Number.parseInt(v))}
              >
                <SelectTrigger className="w-[220px]">
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
                  {availableYears.map((y) => (
                    <SelectItem key={y} value={String(y)}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="text-sm text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Updated: {now.toLocaleString()}
              {isLoading ? <Badge variant="secondary">Loading</Badge> : null}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sites</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSites}</div>
            <div className="text-xs text-muted-foreground">
              Active: {activeSites} • Event sites: {eventSites}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Offsets (Direct Service)</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{offsetsForYear.length}</div>
            <div className="text-xs text-muted-foreground">
              Active: {activeOffsets.length} • Programs: {offsetPrograms.length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Event Application Data</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{eventListingCount}</div>
            <div className="text-xs text-muted-foreground">
              Available events: {eventListingAvailable} • Applied: {eventListingApplied}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Map Community Boundaries</CardTitle>
            <ShieldCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mapCommunitiesCount}</div>
            <div className="text-xs text-muted-foreground">Saved polygons for communities</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Site Expiry (from end dates)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span>Expired</span>
              <Badge variant="destructive">{siteExpiry.expired}</Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>Expiring in 30 days</span>
              <Badge variant="secondary">{siteExpiry.expiring30}</Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>Expiring in 31–60 days</span>
              <Badge variant="outline">{siteExpiry.expiring60}</Badge>
            </div>
            <Separator />
            <div className="flex items-center justify-between text-sm">
              <span>No end date found</span>
              <Badge variant="outline">{siteExpiry.noEndDate}</Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Uses the earliest non-null field ending with <code>_end_date</code> per site (includes program end dates).
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Event / Site Expiry (event sites only)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span>Expired</span>
              <Badge variant="destructive">{eventExpiry.expired}</Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>Expiring in 30 days</span>
              <Badge variant="secondary">{eventExpiry.expiring30}</Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>Expiring in 31–60 days</span>
              <Badge variant="outline">{eventExpiry.expiring60}</Badge>
            </div>
            <Separator />
            <div className="flex items-center justify-between text-sm">
              <span>No end date found</span>
              <Badge variant="outline">{eventExpiry.noEndDate}</Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              This is derived from the sites dataset where <code>site_type</code> is <code>Event</code>.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

