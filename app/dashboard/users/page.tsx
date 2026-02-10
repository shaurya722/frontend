"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import UserManagement from "@/components/user-management"
import type { User } from "@/lib/supabase"

export default function UsersPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null)

  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (userData) {
      setCurrentUser(JSON.parse(userData))
    }
  }, [])

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
