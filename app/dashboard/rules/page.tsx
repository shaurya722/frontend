"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import RegulatoryRulesManagement from "@/components/regulatory-rules-management"

export default function RulesPage() {
  // Static mock user for UI display
  const currentUser = {
    id: "1",
    name: "Administrator",
    role: "Administrator",
  }

  return (
    <DashboardLayout
      title="Regulatory Rules"
      description="Manage regulatory rules and compliance requirements"
      breadcrumb={["Dashboard", "Regulatory Rules"]}
    >
      <RegulatoryRulesManagement currentUser={currentUser} />
    </DashboardLayout>
  )
}
