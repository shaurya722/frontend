"use client"

import type React from "react"
import Link from "next/link"

import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { Separator } from "@/components/ui/separator"
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import { Badge } from "@/components/ui/badge"
import AuthGuard from "@/components/auth-guard"

// Define breadcrumb items with labels and their corresponding routes
interface BreadcrumbItemConfig {
  label: string
  href?: string
}

interface DashboardLayoutProps {
  children: React.ReactNode
  title: string
  description?: string
  breadcrumb?: (string | BreadcrumbItemConfig)[]
}

// Map breadcrumb labels to their routes
const breadcrumbRoutes: Record<string, string> = {
  "Dashboard": "/dashboard",
  "Overview": "/dashboard",
  "Map View": "/dashboard/map",
  "Compliance Analysis": "/dashboard/compliance",
  "Site Management": "/dashboard/sites",
  "Communities": "/dashboard/communities",
  "Communities Management": "/dashboard/communities",
  "Direct Service Offset": "/dashboard/tool-a-offset",
  "Event Application": "/dashboard/tool-b-events",
  "Adjacent Reallocation": "/dashboard/tool-c-reallocation",
  "Reports & Export": "/dashboard/reports",
  "Reports": "/dashboard/reports",
  "Data Management": "/dashboard/data",
  "Regulatory Rules": "/dashboard/rules",
  "User Management": "/dashboard/users",
  "Municipalities": "/dashboard/municipalities",
  "Municipality Management": "/dashboard/municipalities",
  "Reallocation": "/dashboard/reallocation",
  "Reallocation Tools": "/dashboard/reallocation",
  "Offset": "/dashboard/offset",
}

export function DashboardLayout({ children, title, description, breadcrumb }: DashboardLayoutProps) {
  // Helper to get href for a breadcrumb item
  const getHref = (item: string | BreadcrumbItemConfig): string | undefined => {
    if (typeof item === "string") {
      return breadcrumbRoutes[item]
    }
    return item.href
  }

  // Helper to get label for a breadcrumb item
  const getLabel = (item: string | BreadcrumbItemConfig): string => {
    if (typeof item === "string") {
      return item
    }
    return item.label
  }

  return (
    <AuthGuard>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-14 sm:h-16 shrink-0 items-center gap-2 border-b px-2 sm:px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-1 sm:mr-2 h-4 hidden sm:block" />
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {breadcrumb && breadcrumb.length > 0 && (
                <Breadcrumb className="hidden md:block">
                  <BreadcrumbList>
                    {breadcrumb.map((item, index) => {
                      const label = getLabel(item)
                      const href = getHref(item)
                      const isLast = index === breadcrumb.length - 1

                      return (
                        <BreadcrumbItem key={index}>
                          {!isLast && href ? (
                            <>
                              <BreadcrumbLink asChild>
                                <Link href={href} className="hover:text-foreground transition-colors">
                                  {label}
                                </Link>
                              </BreadcrumbLink>
                              <BreadcrumbSeparator />
                            </>
                          ) : (
                            <BreadcrumbPage className="truncate">{label}</BreadcrumbPage>
                          )}
                        </BreadcrumbItem>
                      )
                    })}
                  </BreadcrumbList>
                </Breadcrumb>
              )}
              <div className="ml-auto shrink-0">
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs sm:text-sm">
                  Phase 1 - Ontario
                </Badge>
              </div>
            </div>
          </header>
          <div className="flex flex-1 flex-col gap-3 sm:gap-4 p-3 sm:p-4 md:p-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight">{title}</h2>
              {description && <p className="text-sm sm:text-base text-muted-foreground mt-1">{description}</p>}
            </div>
            {children}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </AuthGuard>
  )
}
