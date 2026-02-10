"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import DataManagement from "@/components/data-management"

export default function DataPage() {
  return (
    <DashboardLayout
      title="Data Management"
      description="Import and manage system data"
      breadcrumb={["Dashboard", "Data Management"]}
    >
      <DataManagement onDataImport={(data) => console.log("Data imported:", data)} />
    </DashboardLayout>
  )
}
