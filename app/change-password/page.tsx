'use client'

import type React from 'react'

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
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Eye, EyeOff, Shield, CheckCircle, AlertCircle } from 'lucide-react'
import { DashboardLayout } from '@/components/dashboard-layout'

interface UserData {
  username: string
  name: string
  role: string
  loginTime: string
}

export default function ChangePasswordPage() {
  const [user, setUser] = useState<UserData | null>(null)
  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: '',
  })
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  })
  const [errors, setErrors] = useState<string[]>([])
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (userData) {
      setUser(JSON.parse(userData))
    }
  }, [])

  const validatePassword = (password: string): string[] => {
    const errors: string[] = []

    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long')
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter')
    }

    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter')
    }

    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number')
    }

    return errors
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setErrors([])
    setSuccess(false)

    const currentPasswordValid =
      passwords.current === 'admin123' ||
      passwords.current === 'analyst123' ||
      passwords.current === 'viewer123'

    if (!currentPasswordValid) {
      setErrors(['Current password is incorrect'])
      setIsLoading(false)
      return
    }

    const passwordErrors = validatePassword(passwords.new)
    if (passwordErrors.length > 0) {
      setErrors(passwordErrors)
      setIsLoading(false)
      return
    }

    if (passwords.new !== passwords.confirm) {
      setErrors(['New passwords do not match'])
      setIsLoading(false)
      return
    }

    if (passwords.current === passwords.new) {
      setErrors(['New password must be different from current password'])
      setIsLoading(false)
      return
    }

    await new Promise((resolve) => setTimeout(resolve, 1500))

    setSuccess(true)
    setPasswords({ current: '', new: '', confirm: '' })
    setIsLoading(false)

    setTimeout(() => {
      router.push('/profile')
    }, 2000)
  }

  const togglePasswordVisibility = (field: keyof typeof showPasswords) => {
    setShowPasswords((prev) => ({
      ...prev,
      [field]: !prev[field],
    }))
  }

  const getPasswordStrength = (password: string) => {
    if (password.length === 0) return { strength: 0, label: '', color: '' }

    let score = 0
    if (password.length >= 8) score++
    if (/[A-Z]/.test(password)) score++
    if (/[a-z]/.test(password)) score++
    if (/[0-9]/.test(password)) score++
    if (/[^A-Za-z0-9]/.test(password)) score++

    if (score <= 2) return { strength: 25, label: 'Weak', color: 'bg-red-500' }
    if (score === 3)
      return { strength: 50, label: 'Fair', color: 'bg-yellow-500' }
    if (score === 4)
      return { strength: 75, label: 'Good', color: 'bg-blue-500' }
    return { strength: 100, label: 'Strong', color: 'bg-green-500' }
  }

  const passwordStrength = getPasswordStrength(passwords.new)

  if (!user) {
    return (
      <DashboardLayout
        description='Loading...'
        breadcrumb={['Dashboard', 'Change Password']}
      >
        <div className='flex items-center justify-center h-64'>
          <div className='text-center'>
            <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4'></div>
            <p className='text-gray-600'>Loading...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout breadcrumb={['Dashboard', 'Profile', 'Change Password']}>
      <div className='max-w-2xl mx-auto'>
        {success && (
          <Alert className='mb-6 bg-green-50 border-green-200'>
            <CheckCircle className='h-4 w-4 text-green-600' />
            <AlertDescription className='text-green-800'>
              Password changed successfully! Redirecting to profile...
            </AlertDescription>
          </Alert>
        )}

        {errors.length > 0 && (
          <Alert variant='destructive' className='mb-6'>
            <AlertCircle className='h-4 w-4' />
            <AlertDescription>
              <div className='space-y-1'>
                {errors.map((error, index) => (
                  <div key={index}>• {error}</div>
                ))}
              </div>
            </AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Shield className='w-5 h-5' />
              Change Password
            </CardTitle>
            <CardDescription>
              Enter your current password and choose a new secure password
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className='space-y-6'>
              {/* Current Password */}
              <div className='space-y-2'>
                <Label htmlFor='current-password'>Current Password</Label>
                <div className='relative'>
                  <Input
                    id='current-password'
                    type={showPasswords.current ? 'text' : 'password'}
                    value={passwords.current}
                    onChange={(e) =>
                      setPasswords({ ...passwords, current: e.target.value })
                    }
                    placeholder='Enter your current password'
                    required
                  />
                  <Button
                    type='button'
                    variant='ghost'
                    size='sm'
                    className='absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent'
                    onClick={() => togglePasswordVisibility('current')}
                  >
                    {showPasswords.current ? (
                      <EyeOff className='h-4 w-4 text-gray-400' />
                    ) : (
                      <Eye className='h-4 w-4 text-gray-400' />
                    )}
                  </Button>
                </div>
              </div>

              {/* New Password */}
              <div className='space-y-2'>
                <Label htmlFor='new-password'>New Password</Label>
                <div className='relative'>
                  <Input
                    id='new-password'
                    type={showPasswords.new ? 'text' : 'password'}
                    value={passwords.new}
                    onChange={(e) =>
                      setPasswords({ ...passwords, new: e.target.value })
                    }
                    placeholder='Enter your new password'
                    required
                  />
                  <Button
                    type='button'
                    variant='ghost'
                    size='sm'
                    className='absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent'
                    onClick={() => togglePasswordVisibility('new')}
                  >
                    {showPasswords.new ? (
                      <EyeOff className='h-4 w-4 text-gray-400' />
                    ) : (
                      <Eye className='h-4 w-4 text-gray-400' />
                    )}
                  </Button>
                </div>

                {/* Password Strength Indicator */}
                {passwords.new && (
                  <div className='space-y-2'>
                    <div className='flex items-center justify-between text-sm'>
                      <span>Password Strength:</span>
                      <span
                        className={`font-medium ${
                          passwordStrength.label === 'Weak'
                            ? 'text-red-600'
                            : passwordStrength.label === 'Fair'
                              ? 'text-yellow-600'
                              : passwordStrength.label === 'Good'
                                ? 'text-blue-600'
                                : 'text-green-600'
                        }`}
                      >
                        {passwordStrength.label}
                      </span>
                    </div>
                    <div className='w-full bg-gray-200 rounded-full h-2'>
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${passwordStrength.color}`}
                        style={{ width: `${passwordStrength.strength}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div className='space-y-2'>
                <Label htmlFor='confirm-password'>Confirm New Password</Label>
                <div className='relative'>
                  <Input
                    id='confirm-password'
                    type={showPasswords.confirm ? 'text' : 'password'}
                    value={passwords.confirm}
                    onChange={(e) =>
                      setPasswords({ ...passwords, confirm: e.target.value })
                    }
                    placeholder='Confirm your new password'
                    required
                  />
                  <Button
                    type='button'
                    variant='ghost'
                    size='sm'
                    className='absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent'
                    onClick={() => togglePasswordVisibility('confirm')}
                  >
                    {showPasswords.confirm ? (
                      <EyeOff className='h-4 w-4 text-gray-400' />
                    ) : (
                      <Eye className='h-4 w-4 text-gray-400' />
                    )}
                  </Button>
                </div>

                {/* Password Match Indicator */}
                {passwords.confirm && (
                  <div
                    className={`text-sm ${passwords.new === passwords.confirm ? 'text-green-600' : 'text-red-600'}`}
                  >
                    {passwords.new === passwords.confirm ? (
                      <div className='flex items-center gap-1'>
                        <CheckCircle className='w-4 h-4' />
                        Passwords match
                      </div>
                    ) : (
                      <div className='flex items-center gap-1'>
                        <AlertCircle className='w-4 h-4' />
                        Passwords do not match
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Password Requirements */}
              <div className='bg-gray-50 p-4 rounded-lg'>
                <h4 className='text-sm font-medium mb-2'>
                  Password Requirements:
                </h4>
                <ul className='text-sm text-gray-600 space-y-1'>
                  <li>• At least 8 characters long</li>
                  <li>• Contains uppercase and lowercase letters</li>
                  <li>• Contains at least one number</li>
                  <li>• Different from your current password</li>
                </ul>
              </div>

              {/* Submit Button */}
              <div className='flex items-center gap-4 pt-4'>
                <Button type='submit' disabled={isLoading || success}>
                  {isLoading ? 'Changing Password...' : 'Change Password'}
                </Button>
                <Button
                  type='button'
                  variant='outline'
                  onClick={() => router.push('/profile')}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
