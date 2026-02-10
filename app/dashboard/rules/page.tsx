"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import RegulatoryRulesManagement from "@/components/regulatory-rules-management"
import type { User } from "@/lib/supabase"

export default function RulesPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null)

  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (userData) {
      setCurrentUser(JSON.parse(userData))
    }
  }, [])

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
