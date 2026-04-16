"use client";

import { useState, useEffect, type ComponentProps } from "react";
import {
  MapContainer,
  TileLayer,
  FeatureGroup,
  GeoJSON,
  LayerGroup,
} from "react-leaflet";
import { EditControl } from "react-leaflet-draw";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import {
  useAvailableMapCommunities,
  useCreateMapCommunity,
  useDeleteMapCommunity,
  useMapCommunities,
  useUpdateMapCommunity,
} from "@/hooks/useMapCommunities";
import type {
  MapCommunity,
  MapCommunityBoundary,
} from "@/features/map-communities/types";

const TORONTO_CENTER: [number, number] = [43.72, -79.38];

function MapCommunityCrudRow({ community }: { community: MapCommunity }) {
  const { toast } = useToast();
  const [name, setName] = useState(community.name);
  const updateMutation = useUpdateMapCommunity();
  const deleteMutation = useDeleteMapCommunity();

  useEffect(() => {
    setName(community.name);
  }, [community.id, community.name]);

  return (
    <div className="flex flex-wrap items-end gap-2 border-b border-border py-2 last:border-0">
      <div className="min-w-0 flex-1 space-y-1">
        <Label className="text-xs text-muted-foreground font-mono truncate block">
          {community.id}
        </Label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="h-9"
        />
      </div>
      <div className="flex gap-2 shrink-0">
        <Button
          type="button"
          size="sm"
          variant="secondary"
          disabled={updateMutation.isPending || !name.trim()}
          onClick={() =>
            void updateMutation
              .mutateAsync({
                id: community.id,
                payload: {
                  community_id: community.id,
                  name: name.trim(),
                },
              })
              .then(() =>
                toast({ title: "Updated", description: community.id }),
              )
              .catch((err: Error) =>
                toast({
                  title: "PATCH failed",
                  description: err.message,
                  variant: "destructive",
                }),
              )
          }
        >
          PATCH
        </Button>
        <Button
          type="button"
          size="sm"
          variant="destructive"
          disabled={deleteMutation.isPending}
          onClick={() =>
            void deleteMutation
              .mutateAsync(community.id)
              .then(() =>
                toast({ title: "Deleted", description: community.id }),
              )
              .catch((err: Error) =>
                toast({
                  title: "DELETE failed",
                  description: err.message,
                  variant: "destructive",
                }),
              )
          }
        >
          DELETE
        </Button>
      </div>
    </div>
  );
}

export default function MapDraw() {
  const { toast } = useToast();
  const { data: mapCommunities = [], isLoading } = useMapCommunities();
  const createMutation = useCreateMapCommunity();
  const [drawCommunitySearch, setDrawCommunitySearch] = useState("");
  const [debouncedDrawSearch, setDebouncedDrawSearch] = useState("");
  const [selectedDrawCommunityId, setSelectedDrawCommunityId] = useState("");
  const [polygons, setPolygons] = useState<object[]>([]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedDrawSearch(drawCommunitySearch), 300);
    return () => clearTimeout(t);
  }, [drawCommunitySearch]);

  const { data: drawAvailableData, isLoading: drawAvailableLoading } =
    useAvailableMapCommunities(debouncedDrawSearch, 100, true);

  const handleCreate = (e: { layer: { toGeoJSON: () => object } }) => {
    const geoJSON = e.layer.toGeoJSON() as {
      type?: string;
      geometry?: MapCommunityBoundary;
    };
    const boundary = geoJSON.geometry;
    if (
      !boundary ||
      (boundary.type !== "Polygon" && boundary.type !== "MultiPolygon")
    ) {
      toast({
        title: "Invalid shape",
        description: "Draw a polygon to save as a map community.",
        variant: "destructive",
      });
      return;
    }

    if (!selectedDrawCommunityId) {
      toast({
        title: "Pick a community",
        description:
          "Select a community id from the searchable list before drawing.",
        variant: "destructive",
      });
      return;
    }

    setPolygons((prev) => [...prev, geoJSON]);

    const cid = selectedDrawCommunityId;

    createMutation.mutate(
      {
        community_id: cid,
        boundary: boundary as MapCommunityBoundary,
      },
      {
        onSuccess: () => {
          toast({
            title: "Map community saved",
            description: `POST community_id=${cid}`,
          });
        },
        onError: (err: Error) => {
          toast({
            title: "Request failed",
            description: err.message,
            variant: "destructive",
          });
        },
      },
    );
  };

  const handleDelete = (e: any) => {
    e.layers.eachLayer((layer: any) => {
      const gj = layer.toGeoJSON();
      console.log("Polygon deleted:", gj);
      setPolygons((prev) => prev.filter((p) => p !== gj));
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex flex-wrap items-center justify-between gap-2">
            Map communities API demo
            <div className="flex items-center gap-2">
              <Badge variant={isLoading ? "secondary" : "outline"}>
                {isLoading
                  ? "Loading boundaries…"
                  : `${mapCommunities.length} from API`}
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid gap-3 sm:max-w-lg">
              <div className="space-y-1">
                <Label htmlFor="demo-community-search">
                  Community for next draw (POST{" "}
                  <code className="text-xs">community_id</code>)
                </Label>
                <Input
                  id="demo-community-search"
                  value={drawCommunitySearch}
                  onChange={(e) => setDrawCommunitySearch(e.target.value)}
                  placeholder="Search (available/?search=…)"
                />
              </div>
              {drawAvailableLoading ? (
                <p className="text-sm text-muted-foreground">Loading…</p>
              ) : (
                <ScrollArea className="h-40 rounded-md border p-2">
                  <div className="space-y-2 pr-3">
                    {(drawAvailableData?.communities ?? []).map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setSelectedDrawCommunityId(c.id)}
                        className={`w-full text-left rounded-md border px-2 py-1.5 text-sm hover:bg-muted ${
                          selectedDrawCommunityId === c.id
                            ? "border-primary bg-muted"
                            : ""
                        }`}
                      >
                        <div className="font-medium truncate">{c.name}</div>
                        <div className="font-mono text-[10px] text-muted-foreground break-all">
                          {c.id}
                        </div>
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() => setPolygons([])}
                variant="outline"
                disabled={polygons.length === 0}
              >
                Clear local list ({polygons.length})
              </Button>
            </div>

            <div className="text-sm text-muted-foreground space-y-1">
              <p>
                • GET <code className="text-xs">/api/community/map-communities/</code>{" "}
                — green polygons on the map
              </p>
              <p>
                • Draw a polygon — POST{" "}
                <code className="text-xs">
                  {"{ community_id, boundary }"}
                </code>
              </p>
              <p>
                • Available list:{" "}
                <code className="text-xs">
                  /api/community/map-communities/available/
                </code>
              </p>
              <p>
                • GET one:{" "}
                <code className="text-xs">
                  /api/community/map-communities/{"{uuid}"}/
                </code>
              </p>
              <p>
                • PATCH / DELETE same URL (see list below)
              </p>
            </div>

            {mapCommunities.length > 0 && (
              <div className="space-y-1 pt-2 border-t">
                <Label className="text-sm font-medium">
                  Update or delete (CRUD)
                </Label>
                <div className="max-h-56 overflow-y-auto rounded-md border p-2">
                  {mapCommunities.map((c) => (
                    <MapCommunityCrudRow key={c.id} community={c} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <MapContainer
            center={TORONTO_CENTER}
            zoom={12}
            style={{ height: "500px", width: "100%" }}
          >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

            <LayerGroup>
              {mapCommunities.map((c) => (
                <GeoJSON
                  key={c.id}
                  data={
                    {
                      type: "Feature",
                      properties: { name: c.name, id: c.id },
                      geometry: c.boundary,
                    } as ComponentProps<typeof GeoJSON>["data"]
                  }
                  style={{
                    color: "#059669",
                    weight: 2,
                    opacity: 0.9,
                    fillColor: "#10b981",
                    fillOpacity: 0.15,
                  }}
                />
              ))}
            </LayerGroup>

            <FeatureGroup>
              <EditControl
                position="topright"
                onCreated={handleCreate}
                onDeleted={handleDelete}
                draw={{
                  polygon: {
                    allowIntersection: false,
                    drawError: {
                      color: "#e1e100",
                      message:
                        "<strong>Error:</strong> Shape edges cannot cross!",
                    },
                    shapeOptions: {
                      color: "#3b82f6",
                      weight: 3,
                      opacity: 0.8,
                      fill: true,
                      fillColor: "#3b82f6",
                      fillOpacity: 0.2,
                    },
                  },
                  rectangle: false,
                  circle: false,
                  marker: false,
                  polyline: false,
                  circlemarker: false,
                }}
              />
            </FeatureGroup>
          </MapContainer>
        </CardContent>
      </Card>
    </div>
  );
}
