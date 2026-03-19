import { Suspense } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import CensusYearManagement from "@/components/census-year-management"

export default function CensusYearPage() {
    return (
        <DashboardLayout 
            title="Census Year Management" 
            description="Manage census years"
            breadcrumb={["Dashboard", "Census Years"]}
        >
            <Suspense fallback={<div>Loading census years...</div>}>
                <CensusYearManagement />
            </Suspense>
        </DashboardLayout>
    )
}