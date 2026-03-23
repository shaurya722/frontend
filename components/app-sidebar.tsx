"use client"

import { useState, useEffect } from "react"
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
import { number } from "yup"

interface UserData {
  id: number
  email: string
  first_name: string
  last_name: string
}

export function AppSidebar() {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<UserData | null>({
    id: 1,
    email: "test@example.com",
    first_name: "John",
    last_name: "Doe",
  })
  const [showLogoutDialog, setShowLogoutDialog] = useState(false)

  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (userData) {
      setUser(JSON.parse(userData))
    }
  }, [])

  const isAdmin = true // TODO: Implement role-based access when roles are available from API
  const isAnalyst = true // TODO: Implement role-based access when roles are available from API

  const handleLogout = () => {
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
        return "bg-gray-100 text-gray-800 border-gray-200"
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
      ],
    },
    {
      title: "Analysis & Tools",
      items: [
        {
          title: "Direct Service Offset",
          icon: Calculator,
          href: "/dashboard/tool-a-offset",
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
          href: "/dashboard/reports",
          visible: true,
        },
        {
          title: "Data Management",
          icon: Database,
          href: "/dashboard/data",
          visible: isAnalyst,
        },
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
        {
          title: "User Management",
          icon: Users,
          href: "/dashboard/users",
          visible: isAdmin,
        },
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
              <div className="flex size-8 items-center justify-center rounded-lg bg-blue-600 text-white font-bold">
                AG
              </div>
              <div className="flex flex-col gap-0.5 leading-none group-data-[collapsible=icon]:hidden">
                <span className="font-semibold">ArcGIS Compliance</span>
                <span className="text-xs text-muted-foreground">Ontario HSP & EEE</span>
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
              <SidebarGroupLabel>{group.title}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {visibleItems.map((item) => (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton asChild isActive={pathname === item.href} tooltip={item.title}>
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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarFallback className="rounded-lg bg-blue-600 text-white">
                      {getInitials(`${user.first_name} ${user.last_name}`)}
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
                      <AvatarFallback className="rounded-lg bg-blue-600 text-white">
                        {getInitials(`${user.first_name} ${user.last_name}`)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold">{`${user.first_name} ${user.last_name}`.trim() || user.email}</span>
                      <span className="truncate text-xs text-muted-foreground">{user.email}</span>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push("/profile")}>
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/change-password")}>
                  <Settings className="mr-2 h-4 w-4" />
                  Change Password
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
