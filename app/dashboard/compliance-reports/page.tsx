import { Suspense } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import ReportConfiguration from "@/components/report-configuration"

export default function ComplianceReportsPage() {
    return (
        <DashboardLayout
            title="Report Configuration"
            description="Configure and generate compliance reports for export."
            breadcrumb={["Dashboard", "Compliance Reports"]}
        >
            <Suspense fallback={<div>Loading report configuration...</div>}>
                <ReportConfiguration />
            </Suspense>
        </DashboardLayout>
    )
}
