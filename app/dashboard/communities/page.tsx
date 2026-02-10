import { Suspense } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import CommunitiesManagement from "@/components/communities-management"

export default function CommunitiesPage() {
    return (
        <DashboardLayout 
            title="Communities Management" 
            description="Manage census subdivisions and community data"
            breadcrumb={["Dashboard", "Communities"]}
        >
            <Suspense fallback={<div>Loading communities...</div>}>
                <CommunitiesManagement />
            </Suspense>
        </DashboardLayout>
    )
}