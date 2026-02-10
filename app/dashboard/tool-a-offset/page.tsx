import { Suspense } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import ToolADirectServiceOffset from "@/components/tool-a-direct-service-offset"

export default function ToolAOffsetPage() {
    return (
        <DashboardLayout 
            title="Direct Service Offset" 
            description="A one-time per year reduction of collection sites applied equally across all communities. Product Care manually inputs the %, and the tool automatically reduces the number of collection sites required across all communities equally by that percentage."
            breadcrumb={["Dashboard", "Direct Service Offset"]}
        >
            <Suspense fallback={<div>Loading...</div>}>
                <ToolADirectServiceOffset />
            </Suspense>
        </DashboardLayout>
    )
}