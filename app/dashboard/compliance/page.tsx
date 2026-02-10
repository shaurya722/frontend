"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import ComplianceAnalysis from "@/components/compliance-analysis"

export default function CompliancePage() {
  return (
    <DashboardLayout
      title="Compliance Analysis"
      description="Analyze compliance status and requirements"
      breadcrumb={["Dashboard", "Compliance Analysis"]}
    >
      <ComplianceAnalysis />
    </DashboardLayout>
  )
}
