import { Suspense } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import EventManagement from "@/components/eventManagement"

export default function EventsPage() {
    return (
        <DashboardLayout 
            title="Events Management" 
            description="Manage events and event data"
            breadcrumb={["Dashboard", "Events"]}
        >
            <Suspense fallback={<div>Loading events...</div>}>
                <EventManagement />
            </Suspense>
        </DashboardLayout>
    )
}