'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Search, Plus, Edit, Trash2, UserCheck, UserX } from 'lucide-react'
import type { User } from '@/lib/supabase'
import * as api from '@/lib/api'

interface UserManagementProps {
  currentUser?: User | null
}

export default function UserManagement({ currentUser }: UserManagementProps) {
  const [users, setUsers] = useState<User[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isAddUserOpen, setIsAddUserOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [newUser, setNewUser] = useState({
    username: '',
    email: '',
    name: '',
    role: 'Viewer' as 'Administrator' | 'Compliance Analyst' | 'Viewer',
  })

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      const data = await api.users.list()
      setUsers(data)
    } catch (error) {
      console.error('Failed to load users:', error)
      // Fallback to empty array if API fails
      setUsers([])
    }
  }

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.username.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleAddUser = async () => {
    try {
      const user = await api.users.create({
        ...newUser,
        is_active: true,
      })
      setUsers([...users, user])
      setIsAddUserOpen(false)
      setNewUser({
        username: '',
        email: '',
        name: '',
        role: 'Viewer',
      })
    } catch (error) {
      console.error('Failed to add user:', error)
      alert('Failed to add user. Please try again.')
    }
  }

  const handleUpdateUser = async (updatedUser: User) => {
    try {
      await api.users.update(updatedUser.id, updatedUser)
      setUsers(users.map((u) => (u.id === updatedUser.id ? updatedUser : u)))
      setEditingUser(null)
    } catch (error) {
      console.error('Failed to update user:', error)
      alert('Failed to update user. Please try again.')
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return

    try {
      await api.users.delete(userId)
      setUsers(users.filter((u) => u.id !== userId))
    } catch (error) {
      console.error('Failed to delete user:', error)
      alert('Failed to delete user. Please try again.')
    }
  }

  const handleToggleActive = async (user: User) => {
    const updatedUser = { ...user, is_active: !user.is_active }
    await handleUpdateUser(updatedUser)
  }

  const getStatusBadge = (user: User) => {
    if (user.is_active) {
      return <Badge variant='default'>Active</Badge>
    }
    return <Badge variant='secondary'>Inactive</Badge>
  }

  const canManageUsers = currentUser?.role === 'Administrator'

  return (
    <div className='space-y-6'>
      {/* Header Actions */}
      <div className='flex items-center justify-end'>
        <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
          <DialogTrigger asChild>
            <Button size='sm'>
              <Plus className='w-4 h-4 mr-2' />
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent className='w-[95vw] max-w-2xl'>
            <DialogHeader>
              <DialogTitle>Add New User</DialogTitle>
              <DialogDescription>
                Create a new user account with the appropriate role
              </DialogDescription>
            </DialogHeader>

            <div className='space-y-4'>
              <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                <div className='space-y-2'>
                  <Label htmlFor='name'>Full Name</Label>
                  <Input
                    id='name'
                    value={newUser.name}
                    onChange={(e) =>
                      setNewUser({ ...newUser, name: e.target.value })
                    }
                    placeholder='Enter full name'
                  />
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='email'>Email Address</Label>
                  <Input
                    id='email'
                    type='email'
                    value={newUser.email}
                    onChange={(e) =>
                      setNewUser({ ...newUser, email: e.target.value })
                    }
                    placeholder='Enter email address'
                  />
                </div>
              </div>

              <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                <div className='space-y-2'>
                  <Label htmlFor='username'>Username</Label>
                  <Input
                    id='username'
                    value={newUser.username}
                    onChange={(e) =>
                      setNewUser({ ...newUser, username: e.target.value })
                    }
                    placeholder='Enter username'
                  />
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='role'>Role</Label>
                  <Select
                    value={newUser.role}
                    onValueChange={(
                      value: 'Administrator' | 'Compliance Analyst' | 'Viewer',
                    ) => setNewUser({ ...newUser, role: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder='Select role' />
                    </SelectTrigger>
                    <SelectContent>
                      {[
                        {
                          value: 'Administrator',
                          label: 'Administrator',
                          description:
                            'Full system access, user management, configuration',
                        },
                        {
                          value: 'Compliance Analyst',
                          label: 'Compliance Analyst',
                          description:
                            'Site management, compliance analysis, data import/export',
                        },
                        {
                          value: 'Viewer',
                          label: 'Viewer',
                          description:
                            'Read-only access to maps, reports, and compliance data',
                        },
                      ].map((role) => (
                        <SelectItem key={role.value} value={role.value}>
                          <div>
                            <div className='font-medium'>{role.label}</div>
                            <div className='text-xs text-gray-500'>
                              {role.description}
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant='outline' onClick={() => setIsAddUserOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleAddUser}
                disabled={!newUser.name || !newUser.email}
              >
                Add User
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Users Table */}
      <div className='space-y-6'>
        {filteredUsers.length === 0 ? (
          <div className='text-center py-8 text-gray-500'>
            <Search className='w-12 h-12 mx-auto mb-4 opacity-50' />
            <div className='text-lg font-medium mb-2'>No users found</div>
            <p className='text-sm'>
              {users.length === 0
                ? 'Add your first user to get started'
                : 'Try adjusting your search criteria'}
            </p>
          </div>
        ) : (
          <div className='overflow-x-auto -mx-4 sm:mx-0'>
            <div className='inline-block min-w-full align-middle px-4 sm:px-0'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Login</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div>
                          <div className='font-medium'>{user.name}</div>
                          <div className='text-sm text-gray-600 whitespace-nowrap'>
                            {user.email}
                          </div>
                          <div className='text-xs text-gray-500'>
                            @{user.username}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant='outline'
                          className='bg-green-100 text-green-800 border-green-200'
                        >
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(user)}</TableCell>
                      <TableCell>
                        {user.last_login ? (
                          <div className='text-sm'>
                            {new Date(user.last_login).toLocaleDateString()}
                          </div>
                        ) : (
                          <span className='text-gray-400 text-sm'>Never</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className='text-sm'>
                          {new Date(user.created_at).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className='flex items-center gap-1'>
                          {canManageUsers && (
                            <Button
                              variant='ghost'
                              size='sm'
                              onClick={() => setEditingUser(user)}
                            >
                              <Edit className='w-4 h-4' />
                            </Button>
                          )}

                          {canManageUsers && (
                            <Button
                              variant='ghost'
                              size='sm'
                              onClick={() => handleToggleActive(user)}
                              className={
                                user.is_active
                                  ? 'text-yellow-600 hover:text-yellow-700'
                                  : 'text-green-600 hover:text-green-700'
                              }
                            >
                              {user.is_active ? (
                                <UserX className='w-4 h-4' />
                              ) : (
                                <UserCheck className='w-4 h-4' />
                              )}
                            </Button>
                          )}

                          {canManageUsers && (
                            <Button
                              variant='ghost'
                              size='sm'
                              onClick={() => handleDeleteUser(user.id)}
                              className='text-red-600 hover:text-red-700'
                            >
                              <Trash2 className='w-4 h-4' />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </div>

      {/* Edit User Dialog */}
      {editingUser && (
        <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
          <DialogContent className='max-w-2xl'>
            <DialogHeader>
              <DialogTitle>Edit User</DialogTitle>
              <DialogDescription>
                Update user information and role
              </DialogDescription>
            </DialogHeader>

            <div className='space-y-4'>
              <div className='grid grid-cols-2 gap-4'>
                <div className='space-y-2'>
                  <Label htmlFor='edit-name'>Full Name</Label>
                  <Input
                    id='edit-name'
                    value={editingUser.name}
                    onChange={(e) =>
                      setEditingUser({ ...editingUser, name: e.target.value })
                    }
                    placeholder='Enter full name'
                  />
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='edit-email'>Email Address</Label>
                  <Input
                    id='edit-email'
                    type='email'
                    value={editingUser.email}
                    onChange={(e) =>
                      setEditingUser({ ...editingUser, email: e.target.value })
                    }
                    placeholder='Enter email address'
                  />
                </div>
              </div>

              <div className='grid grid-cols-2 gap-4'>
                <div className='space-y-2'>
                  <Label htmlFor='edit-username'>Username</Label>
                  <Input
                    id='edit-username'
                    value={editingUser.username}
                    onChange={(e) =>
                      setEditingUser({
                        ...editingUser,
                        username: e.target.value,
                      })
                    }
                    placeholder='Enter username'
                  />
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='edit-role'>Role</Label>
                  <Select
                    value={editingUser.role}
                    onValueChange={(
                      value: 'Administrator' | 'Compliance Analyst' | 'Viewer',
                    ) => setEditingUser({ ...editingUser, role: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder='Select role' />
                    </SelectTrigger>
                    <SelectContent>
                      {[
                        {
                          value: 'Administrator',
                          label: 'Administrator',
                          description:
                            'Full system access, user management, configuration',
                        },
                        {
                          value: 'Compliance Analyst',
                          label: 'Compliance Analyst',
                          description:
                            'Site management, compliance analysis, data import/export',
                        },
                        {
                          value: 'Viewer',
                          label: 'Viewer',
                          description:
                            'Read-only access to maps, reports, and compliance data',
                        },
                      ].map((role) => (
                        <SelectItem key={role.value} value={role.value}>
                          <div>
                            <div className='font-medium'>{role.label}</div>
                            <div className='text-xs text-gray-500'>
                              {role.description}
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant='outline' onClick={() => setEditingUser(null)}>
                Cancel
              </Button>
              <Button onClick={() => handleUpdateUser(editingUser)}>
                Update User
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
