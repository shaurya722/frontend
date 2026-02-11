"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import UserManagement from "@/components/user-management"
import type { User } from "@/lib/supabase"

export default function UsersPage() {
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
      title="User Management"
      description="Manage user accounts and permissions"
      breadcrumb={["Dashboard", "User Management"]}
    >
      <UserManagement currentUser={currentUser} />
    </DashboardLayout>
  )
}
