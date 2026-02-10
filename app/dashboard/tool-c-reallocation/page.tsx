import { Suspense } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import ToolCAdjacentReallocation from "@/components/tool-c-adjacent-reallocation"

export default function ToolCReallocationPage() {
    return (
        <DashboardLayout 
            title="Adjacent Reallocation" 
            description="Reallocate excess collection sites to adjacent communities with shortfalls. Only eligible sites can be reallocated (excludes Municipal, First Nation/Indigenous, and Regional District operators, and Event site types)."
            breadcrumb={["Dashboard", "Adjacent Reallocation"]}
        >
            <Suspense fallback={<div>Loading...</div>}>
                <ToolCAdjacentReallocation />
            </Suspense>
        </DashboardLayout>
    )
}