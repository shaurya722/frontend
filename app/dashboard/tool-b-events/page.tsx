import { Suspense } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import ToolBEventApplication from "@/components/tool-b-event-application"

export default function ToolBEventsPage() {
    return (
        <DashboardLayout 
            title="Event Application" 
            description="Apply collection events to offset community shortfalls"
            breadcrumb={["Dashboard", "Event Application"]}
        >
            <Suspense fallback={<div>Loading...</div>}>
                <ToolBEventApplication />
            </Suspense>
        </DashboardLayout>
    )
}