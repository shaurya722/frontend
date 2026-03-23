import { Suspense } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import MapView from "@/components/mapView"

export default function mapPage() {
    return (
        <DashboardLayout 
            title="Map View" 
            description="View communities on a map"
            breadcrumb={["Dashboard", "Map"]}
        >
            <Suspense fallback={<div>Loading map...</div>}>
                <MapView />
            </Suspense>
        </DashboardLayout>
    )
}