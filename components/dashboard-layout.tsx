'use client'

import React, { type ReactNode } from 'react'
import Link from 'next/link'

import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/app-sidebar'
import { Separator } from '@/components/ui/separator'
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Bell, Search } from 'lucide-react'
// import AuthGuard from '@/components/auth-guard'

// Define breadcrumb items with labels and their corresponding routes
interface BreadcrumbItemConfig {
  label: string
  href?: string
}

interface DashboardLayoutProps {
  children: ReactNode
  title?: string
  description?: string
  breadcrumb?: (string | BreadcrumbItemConfig)[]
  /** Search + notifications + avatar row (compliance dashboard chrome) */
  complianceChrome?: boolean
}

// Map breadcrumb labels to their routes
const breadcrumbRoutes: Record<string, string> = {
  'Arc Ontario': '/dashboard',
  Dashboard: '/dashboard',
  Overview: '/dashboard',
  'Map View': '/dashboard/map',
  'Compliance Analysis': '/dashboard/compliance',
  'Compliance Reports': '/dashboard/compliance-reports',
  'Site Management': '/dashboard/sites',
  Communities: '/dashboard/communities',
  'Communities Management': '/dashboard/communities',
  'Direct Service Offset': '/dashboard/tool-a-offset',
  'Event Application': '/dashboard/tool-b-events',
  'Adjacent Reallocation': '/dashboard/tool-c-reallocation',
  'Reports & Export': '/dashboard/reports',
  Reports: '/dashboard/reports',
  'Data Management': '/dashboard/data',
  'Regulatory Rules': '/dashboard/rules',
  'User Management': '/dashboard/users',
  Municipalities: '/dashboard/municipalities',
  'Municipality Management': '/dashboard/municipalities',
  Reallocation: '/dashboard/reallocation',
  'Reallocation Tools': '/dashboard/reallocation',
  Offset: '/dashboard/offset',
}

export function DashboardLayout({
  children,
  title,
  description,
  breadcrumb,
  complianceChrome,
}: DashboardLayoutProps) {
  // Helper to get href for a breadcrumb item
  const getHref = (item: string | BreadcrumbItemConfig): string | undefined => {
    if (typeof item === 'string') {
      return breadcrumbRoutes[item]
    }
    return item.href
  }

  // Helper to get label for a breadcrumb item
  const getLabel = (item: string | BreadcrumbItemConfig): string => {
    if (typeof item === 'string') {
      return item
    }
    return item.label
  }

  return (
    // <AuthGuard>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset className='bg-background'>
          <header
            className={cn(
              'flex h-14 shrink-0 items-center gap-2 border-b border-border bg-card px-2 shadow-[0_1px_2px_rgba(15,23,42,0.04)] sm:h-16 sm:px-4',
            )}
          >
            <SidebarTrigger className='-ml-1' />
            <Separator
              orientation='vertical'
              className='mr-1 sm:mr-2 h-4 hidden sm:block'
            />
            <div className='flex min-w-0 flex-1 flex-wrap items-center gap-3'>
              {breadcrumb && breadcrumb.length > 0 && (
                <Breadcrumb className='hidden shrink-0 md:block'>
                  <BreadcrumbList>
                    {breadcrumb.map((item, index) => {
                      const label = getLabel(item)
                      const href = getHref(item)
                      const isLast = index === breadcrumb.length - 1

                      return (
                        <React.Fragment key={`${label}-${index}`}>
                          <BreadcrumbItem>
                            {!isLast && href ? (
                              <BreadcrumbLink asChild>
                                <Link
                                  href={href}
                                  className='hover:text-foreground transition-colors'
                                >
                                  {label}
                                </Link>
                              </BreadcrumbLink>
                            ) : (
                              <BreadcrumbPage className='truncate'>
                                {label}
                              </BreadcrumbPage>
                            )}
                          </BreadcrumbItem>
                          {!isLast && <BreadcrumbSeparator />}
                        </React.Fragment>
                      )
                    })}
                  </BreadcrumbList>
                </Breadcrumb>
              )}
              {complianceChrome ? (
                <>
                  <div className='relative mx-auto hidden min-w-[200px] max-w-xl flex-1 md:block'>
                    {/* <Search className='pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' /> */}
                    {/* <Input
                      readOnly
                      placeholder='Search sites, programs…'
                      className='h-9 rounded-full border-input bg-muted/50 pl-9 pr-4 text-sm shadow-inner'
                      aria-label='Search sites and programs'
                    /> */}
                  </div>
                  <div className='ml-auto flex shrink-0 items-center gap-2'>
                    {/* <Button type='button' variant='ghost' size='icon' className='rounded-full text-slate-600' aria-label='Notifications'>
                      <Bell className='h-5 w-5' />
                    </Button> */}
                   
                    <Badge className='hidden border-0 bg-[#1e3a8a] px-2.5 py-1 text-xs font-medium text-white hover:bg-[#172554] sm:inline-flex'>
                      Phase 1 — Ontario
                    </Badge>
                  </div>
                </>
              ) : (
                <div className='ml-auto shrink-0'>
                  <Badge className='border-0 bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground hover:bg-primary/90 sm:text-sm'>
                    Phase 1 — Ontario
                  </Badge>
                </div>
              )}
            </div>
          </header>
          <div className='flex flex-1 flex-col gap-3 sm:gap-4 p-3 sm:p-4 md:p-6 lg:p-8'>
            {(title || description) && (
              <div>
                {title ? (
                  <h2 className='text-2xl font-bold tracking-tight text-foreground sm:text-3xl'>{title}</h2>
                ) : null}
                {description ? (
                  <p className='mt-1 text-sm text-muted-foreground sm:text-base'>{description}</p>
                ) : null}
              </div>
            )}
            {children}
          </div>
        </SidebarInset>
      </SidebarProvider>
    // </AuthGuard>
  )
}
