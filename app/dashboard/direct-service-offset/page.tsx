import { DashboardLayout } from "@/components/dashboard-layout"
import DirectServiceOffset from "@/components/DIrectServiceOffset"

export default function DirectServiceOffsetPage() {
    return (
        <DashboardLayout 
            title="Direct Service Offset" 
            description="Manage direct service offsets"
            breadcrumb={["Dashboard", "Direct Service Offset"]}
        >
            <DirectServiceOffset />
        </DashboardLayout>
    )
}