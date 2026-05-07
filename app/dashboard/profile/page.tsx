'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import axiosInstance from '@/lib/axios-instance'

interface Profile {
  id?: number
  email?: string
  first_name?: string
  last_name?: string
  username?: string
  date_joined?: string
  is_active?: boolean
  is_staff?: boolean
}

export default function ProfilePage() {
  const { toast } = useToast()

  const [email, setEmail] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [username, setUsername] = useState('')
  const fetchedOnceRef = useRef(false)

  // Load profile from API
  useEffect(() => {
    if (fetchedOnceRef.current) return
    fetchedOnceRef.current = true
    let mounted = true
    setLoading(true)
    // Prefill from localStorage if available for immediate display
    try {
      const raw = typeof window !== 'undefined' ? localStorage.getItem('user') : null
      if (raw) {
        const cached = JSON.parse(raw) || {}
        if (cached) {
          setEmail(String(cached.email ?? ''))
          setFirstName(String(cached.first_name ?? ''))
          setLastName(String(cached.last_name ?? ''))
          setUsername(String(cached.username ?? cached.name ?? ''))
        }
      }
    } catch {}
    axiosInstance
      .get<Profile>('/api/auth/profile/')
      .then((res) => {
        if (!mounted) return
        const p = res.data || {}
        setEmail(String(p.email ?? ''))
        setFirstName(String(p.first_name ?? ''))
        setLastName(String(p.last_name ?? ''))
        const uname = p.username ?? (p.email ? String(p.email).split('@')[0] : '')
        setUsername(String(uname))
        // Update cache for sidebar and future loads
        try {
          if (typeof window !== 'undefined') {
            localStorage.setItem('user', JSON.stringify(p))
          }
        } catch {}
      })
      .catch((e: any) => {
        if (!mounted) return
        toast({
          title: 'Failed to load profile',
          description: e?.message || 'Could not fetch profile from server.',
          variant: 'destructive',
        })
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })
    return () => { mounted = false }
  }, [])

  const displayName = useMemo(() => {
    const fn = (firstName || '').trim()
    const ln = (lastName || '').trim()
    const combined = `${fn} ${ln}`.trim()
    if (combined) return combined
    return 'User'
  }, [firstName, lastName])

  const handleSave = async () => {
    setSaving(true)
    try {
      const payload = {
        first_name: firstName,
        last_name: lastName,
      }
      const res = await axiosInstance.patch<Profile>('/api/auth/profile/', payload)
      const p = res.data || {}
      setEmail(String(p.email ?? email))
      setFirstName(String(p.first_name ?? firstName))
      setLastName(String(p.last_name ?? lastName))
      setUsername(String(p.username ?? username))
      toast({
        title: 'Profile updated',
        description: 'Your profile details were saved.',
      })
    } catch (e: any) {
      toast({
        title: 'Update failed',
        description: e?.message || 'Could not save profile.',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <DashboardLayout
      title='Profile'
      description='View and update your profile details.'
      breadcrumb={['Dashboard', 'Profile']}
    >
      <div className='space-y-6'>
        <Card>
          <CardHeader>
            <CardTitle>{displayName}</CardTitle>
            <CardDescription>These details are synced with your account.</CardDescription>
            {username ? (
              <div className='text-xs text-muted-foreground mt-1'>Username: {username}</div>
            ) : null}
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <Label>Email</Label>
                <Input value={email} disabled />
              </div>
              <div className='space-y-2'>
                <Label>Username</Label>
                <Input value={username} disabled />
              </div>
              <div className='space-y-2'>
                <Label>First name</Label>
                <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} />
              </div>
              <div className='space-y-2 md:col-span-2'>
                <Label>Last name</Label>
                <Input value={lastName} onChange={(e) => setLastName(e.target.value)} />
              </div>
            </div>

            <div className='flex justify-end'>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? 'Saving…' : 'Save changes'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}

