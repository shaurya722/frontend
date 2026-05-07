import { Suspense } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import AdjcentRelloacation from "@/components/AdjcentRelloacation"

export default function AdjcentRelloacationPage() {
    return (
        <DashboardLayout 
            title="Adjacent Relloacation" 
            description="Manage adjacent reloacation and adjacent reloacation data"
            breadcrumb={["Dashboard", "Adjcent Relloacation"]}
        >
            <Suspense fallback={<div>Loading adjcent reloacation...</div>}>
                <AdjcentRelloacation />
            </Suspense>
        </DashboardLayout>
    )
}