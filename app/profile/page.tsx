'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { User, Calendar, Shield, CheckCircle, ArrowLeft } from 'lucide-react'
import { DashboardLayout } from '@/components/dashboard-layout'

interface UserData {
  username: string
  name: string
  role: string
  loginTime: string
}

export default function ProfilePage() {
  const [user, setUser] = useState<UserData | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editedName, setEditedName] = useState('')
  const [saveSuccess, setSaveSuccess] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (userData) {
      const parsedUser = JSON.parse(userData)
      setUser(parsedUser)
      setEditedName(parsedUser.name)
    }
  }, [])

  const handleSave = () => {
    if (user) {
      const updatedUser = { ...user, name: editedName }
      localStorage.setItem('user', JSON.stringify(updatedUser))
      setUser(updatedUser)
      setIsEditing(false)
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    }
  }

  const handleCancel = () => {
    setEditedName(user?.name || '')
    setIsEditing(false)
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'Administrator':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'Compliance Analyst':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'Viewer':
        return 'bg-green-100 text-green-800 border-green-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getRolePermissions = (role: string) => {
    switch (role) {
      case 'Administrator':
        return [
          'Full system access',
          'User management',
          'Site management',
          'Compliance analysis',
          'Report generation',
          'System configuration',
        ]
      case 'Compliance Analyst':
        return [
          'Site management',
          'Compliance analysis',
          'Report generation',
          'Reallocation tools',
          'Data import/export',
        ]
      case 'Viewer':
        return [
          'View sites and maps',
          'View compliance reports',
          'Export basic reports',
        ]
      default:
        return []
    }
  }

  if (!user) {
    return (
      <DashboardLayout
        title='Profile'
        description='Loading your profile...'
        breadcrumb={['Dashboard', 'Profile']}
      >
        <div className='flex items-center justify-center h-64'>
          <div className='text-center'>
            <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4'></div>
            <p className='text-gray-600'>Loading profile...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout
      title='User Profile'
      description='Manage your account settings and preferences'
      breadcrumb={['Dashboard', 'Profile']}
    >
      {saveSuccess && (
        <Alert className='bg-green-50 border-green-200 mb-6'>
          <CheckCircle className='h-4 w-4 text-green-600' />
          <AlertDescription className='text-green-800'>
            Profile updated successfully!
          </AlertDescription>
        </Alert>
      )}

      <div className='grid grid-cols-1 xl:grid-cols-3 gap-6'>
        {/* Profile Information */}
        <div className='xl:col-span-2 space-y-6'>
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <User className='w-5 h-5' />
                Personal Information
              </CardTitle>
              <CardDescription>
                Update your personal details and contact information
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='grid grid-cols-2 gap-4'>
                <div className='space-y-2'>
                  <Label htmlFor='name'>Full Name</Label>
                  {isEditing ? (
                    <Input
                      id='name'
                      value={editedName}
                      onChange={(e) => setEditedName(e.target.value)}
                      placeholder='Enter your full name'
                    />
                  ) : (
                    <div className='p-2 bg-gray-50 rounded-md'>{user.name}</div>
                  )}
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='username'>Username</Label>
                  <div className='p-2 bg-gray-50 rounded-md text-gray-600'>
                    @{user.username}
                  </div>
                </div>
              </div>

              <div className='space-y-2'>
                <Label htmlFor='email'>Email Address</Label>
                <div className='p-2 bg-gray-50 rounded-md text-gray-600'>
                  {user.username}@arcgis-compliance.com
                </div>
              </div>

              <div className='space-y-2'>
                <Label htmlFor='role'>Role</Label>
                <div className='flex items-center gap-2'>
                  <Badge variant='outline' className={getRoleColor(user.role)}>
                    {user.role}
                  </Badge>
                </div>
              </div>

              <div className='flex items-center gap-2 pt-4'>
                {isEditing ? (
                  <>
                    <Button onClick={handleSave}>Save Changes</Button>
                    <Button variant='outline' onClick={handleCancel}>
                      Cancel
                    </Button>
                  </>
                ) : (
                  <Button onClick={() => setIsEditing(true)}>
                    Edit Profile
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Account Activity */}
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Calendar className='w-5 h-5' />
                Account Activity
              </CardTitle>
              <CardDescription>
                Recent account activity and session information
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <Label className='text-sm font-medium'>Last Login</Label>
                  <div className='text-sm text-gray-600'>
                    {new Date(user.loginTime).toLocaleString()}
                  </div>
                </div>

                <div>
                  <Label className='text-sm font-medium'>Session Status</Label>
                  <div className='flex items-center gap-2'>
                    <div className='w-2 h-2 bg-green-500 rounded-full'></div>
                    <span className='text-sm text-green-600'>Active</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Role & Permissions */}
        <div className='space-y-6'>
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Shield className='w-5 h-5' />
                Role & Permissions
              </CardTitle>
              <CardDescription>
                Your current role and system permissions
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='text-center'>
                <Badge
                  variant='outline'
                  className={`${getRoleColor(user.role)} text-lg px-4 py-2`}
                >
                  {user.role}
                </Badge>
              </div>

              <Separator />

              <div>
                <Label className='text-sm font-medium mb-2 block'>
                  Permissions
                </Label>
                <div className='space-y-2'>
                  {getRolePermissions(user.role).map((permission, index) => (
                    <div
                      key={index}
                      className='flex items-center gap-2 text-sm'
                    >
                      <CheckCircle className='w-4 h-4 text-green-600' />
                      <span>{permission}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common account management tasks</CardDescription>
            </CardHeader>
            <CardContent className='space-y-3'>
              <Button
                variant='outline'
                className='w-full justify-start bg-transparent'
                onClick={() => router.push('/change-password')}
              >
                <Shield className='w-4 h-4 mr-2' />
                Change Password
              </Button>

              <Button
                variant='outline'
                className='w-full justify-start bg-transparent'
                onClick={() => router.push('/dashboard')}
              >
                <ArrowLeft className='w-4 h-4 mr-2' />
                Back to Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
