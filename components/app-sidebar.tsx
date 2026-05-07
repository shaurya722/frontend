"use client"

import { useState, useEffect } from "react"
import axiosInstance from "@/lib/axios-instance"
import { useLogout } from "@/features/auth"
import { useRouter, usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Map,
  Building2,
  FileBarChart,
  FileText,
  Database,
  Scale,
  Users,
  User,
  Settings,
  LogOut,
  ChevronDown,
  Calculator,
  Calendar,
  GitBranch,
} from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface UserData {
  id: number
  email: string
  first_name: string
  username: string
  last_name: string
}

export function AppSidebar() {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<UserData | null>()
  const [showLogoutDialog, setShowLogoutDialog] = useState(false)
  const logoutMutation = useLogout()

  const fetchProfile = async () => {
    try {
      const res = await axiosInstance.get<UserData>("/api/auth/profile/")
      const data = res.data
      setUser(data)
      if (typeof window !== 'undefined') {
        localStorage.setItem('user', JSON.stringify(data))
      }
    } catch (e) {
      // Silently ignore; UI will continue to show last known data
    }
  }

  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (userData) {
      setUser(JSON.parse(userData))
    }
    // Always refresh from API so latest profile is shown
    fetchProfile()
    const onFocus = () => fetchProfile()
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [])

  const isAdmin = true // TODO: Implement role-based access when roles are available from API
  const isAnalyst = true // TODO: Implement role-based access when roles are available from API

  const handleLogout = async () => {
    // Call logout API to invalidate refresh token on the server
    if (typeof window !== 'undefined') {
      const refreshToken = localStorage.getItem('refresh_token')
      if (refreshToken) {
        try {
          await logoutMutation.mutateAsync({ refresh: refreshToken })
        } catch (e) {
          // Ignore errors; proceed with local cleanup regardless
          console.warn('Logout API call failed:', e)
        }
      }
    }

    // Clear all user-related data from localStorage
    localStorage.removeItem("user")
    localStorage.removeItem("access_token")
    localStorage.removeItem("refresh_token")
    localStorage.removeItem("authToken")
    localStorage.removeItem("session")

    // Clear any other session-related data
    sessionStorage.clear()

    // Redirect to login page
    router.push("/login")
    router.refresh() // Force a refresh to clear any cached state
  }

  const handleLogoutClick = () => {
    setShowLogoutDialog(true)
  }

  const getInitials = (name: string | undefined) => {
    if (!name || name.trim() === '') {
      return 'U'
    }
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case "Administrator":
        return "bg-red-100 text-red-800 border-red-200"
      case "Compliance Analyst":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "Viewer":
        return "bg-green-100 text-green-800 border-green-200"
      default:
        return "bg-muted text-muted-foreground border-border"
    }
  }

  // Navigation items organized by category
  const navigationItems = [
    {
      title: "Overview",
      items: [
        {
          title: "Dashboard",
          icon: LayoutDashboard,
          href: "/dashboard",
          visible: true,
        },
        {
          title: "Map View",
          icon: Map,
          href: "/dashboard/map",
          visible: true,
        },
        {
          title: "Compliance Analysis",
          icon: FileBarChart,
          href: "/dashboard/compliance",
          visible: true,
        },
        // {
        //   title: "Compliance Reports",
        //   icon: FileText,
        //   href: "/dashboard/compliance-reports",
        //   visible: true,
        // },
      ],
    },
    {
      title: "Management",
      items: [
        {
          title: "Site Management",
          icon: Building2,
          href: "/dashboard/sites",
          visible: isAnalyst,
        },
        {
          title: "Communities",
          icon: Building2,
          href: "/dashboard/communities",
          visible: isAdmin,
        },
        {
          title: "Adjacent Community",
          icon: Building2,
          href: "/dashboard/adjacent-community-management",
          visible: isAdmin,
        }
      ],
    },
    {
      title: "Analysis & Tools",
      items: [
         {
          title: "Direct Service Offset",
          icon: FileBarChart,
          href: "/dashboard/direct-service-offset",
          visible: isAnalyst,
        },
        {
          title: "Event Application",
          icon: Calendar,
          href: "/dashboard/events",
          visible: isAnalyst,
        },
        {
          title: "Adjacent Reallocation",
          icon: GitBranch,
          href: "/dashboard/reallocation",
          visible: isAnalyst,
        },
      ],
    },
    {
      title: "Data & Reports",
      items: [
        {
          title: "Reports & Export",
          icon: FileText,
          // href: "/dashboard/reports",
          href: "/dashboard/compliance-reports",

          visible: true,
        },
        // {
        //   title: "Data Management",
        //   icon: Database,
        //   href: "/dashboard/data",
        //   visible: isAnalyst,
        // },
      ],
    },
    {
      title: "Administration",
      items: [
        {
          title: "Regulatory Rules",
          icon: Scale,
          href: "/dashboard/rules",
          visible: isAdmin,
        },
        {
          title: "Census Years",
          icon: Calendar,
          href: "/dashboard/census-years",
          visible: isAdmin,
        },
        // {
        //   title: "User Management",
        //   icon: Users,
        //   href: "/dashboard/users",
        //   visible: isAdmin,
        // },
      ],
    },
  ]

  if (!user) return null

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex items-center gap-2 px-2 py-2">
              <div className="flex size-8 items-center justify-center rounded-md border border-sidebar-border bg-sidebar-accent font-semibold text-xs text-sidebar-accent-foreground">
                AG
              </div>
              <div className="flex flex-col gap-0.5 leading-none group-data-[collapsible=icon]:hidden">
                <span className="font-semibold text-sidebar-foreground">Arc Ontario Compliance</span>
                <span className="text-xs text-sidebar-foreground/55">Ontario HSP & EEE</span>
              </div>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {navigationItems.map((group, index) => {
          const visibleItems = group.items.filter((item) => item.visible)
          if (visibleItems.length === 0) return null

          return (
            <SidebarGroup key={index}>
              <SidebarGroupLabel className='text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/45'>
                {group.title}
              </SidebarGroupLabel>
              {/* <SidebarGroupLabel>{group.title}</SidebarGroupLabel> */}
              <SidebarGroupContent>
                <SidebarMenu>
                  {visibleItems.map((item) => (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={pathname === item.href}
                        tooltip={item.title}
                        className={
                          pathname === item.href
                            ? '!border-l-[3px] !border-sidebar-primary !bg-sidebar-accent !text-sidebar-accent-foreground !font-medium hover:!bg-sidebar-accent'
                            : 'border-l-[3px] border-transparent text-sidebar-foreground/85 hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground'
                        }
                      >
                        {/* <SidebarMenuButton asChild isActive={pathname === item.href} tooltip={item.title}></SidebarMenuButton> */}
                        <a href={item.href}>
                          <item.icon />
                          <span>{item.title}</span>
                        </a>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )
        })}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu onOpenChange={(open) => { if (open) fetchProfile() }}>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground cursor-pointer"
                  onClick={() => router.push("/dashboard/profile")}
                >
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarFallback className="rounded-lg border border-sidebar-border bg-sidebar-accent text-sidebar-accent-foreground">
                      {getInitials(`${user.first_name}`)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">{`${user.first_name} ${user.last_name}`.trim() || user.email}</span>
                    <span className="truncate text-xs text-muted-foreground">{user.email}</span>
                  </div>
                  <ChevronDown className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
                side="bottom"
                align="end"
                sideOffset={4}
              >
                <DropdownMenuLabel className="p-0 font-normal">
                  <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                    <Avatar className="h-8 w-8 rounded-lg">
                      <AvatarFallback className="rounded-lg border border-sidebar-border bg-sidebar-accent text-sidebar-accent-foreground">
                        {getInitials(`${user.first_name}`)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold">{`${user.first_name} ${user.last_name}`.trim() || user.email}</span>
                      <span className="truncate text-xs text-muted-foreground">{user.email}</span>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push("/dashboard/profile")}>
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogoutClick} className="text-red-600 focus:text-red-600">
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />

      {/* Logout Confirmation Dialog */}
      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Logout</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to log out? You will need to sign in again to access the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLogout}
              className="bg-black hover:bg-black focus:ring-black"
            >
              Log out
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Sidebar>
  )
}