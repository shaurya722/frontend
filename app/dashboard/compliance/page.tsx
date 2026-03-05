import { Suspense } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import Complaince from "@/components/compliance-analysis"

export default function compliancePage() {
    return (
        <DashboardLayout 
            title="Communities Management" 
            description="Manage census subdivisions and community data"
            breadcrumb={["Dashboard", "Complaince"]}
        >
            <Suspense fallback={<div>Loading communities...</div>}>
                <Complaince />
            </Suspense>
        </DashboardLayout>
    )
}