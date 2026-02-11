"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import RegulatoryRulesManagement from "@/components/regulatory-rules-management"
import type { User } from "@/lib/supabase"

export default function RulesPage() {
  // Static mock user for UI display
  const currentUser: User = {
    id: "1",
    username: "admin",
    email: "admin@example.com",
    name: "Administrator",
    role: "Administrator",
    created_at: "2023-01-01T00:00:00Z",
    updated_at: "2023-01-01T00:00:00Z",
    is_active: true,
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
