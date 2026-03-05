"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import SiteManagement from "@/components/siteManagement"

export default function SitesPage() {

  return (
    <DashboardLayout
      title="Site Management"
      description="Manage regulatory rules and compliance requirements"
      breadcrumb={["Dashboard", "Sites"]}
    >
      <SiteManagement />
    </DashboardLayout>
  )
}
