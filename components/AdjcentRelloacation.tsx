'use client'

import { useState } from 'react'
import {
  Card, CardContent, CardHeader, CardTitle
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Info, ArrowRight } from 'lucide-react'

/* ---------------- MOCK DATA ---------------- */

const mockData = [
  {
    id: '1',
    name: 'Community A',
    eligibleExcess: 3,
    eligibleSites: [
      { id: 's1', name: 'Site 1', operator_type: 'Retailer', address: 'Address 1' },
      { id: 's2', name: 'Site 2', operator_type: 'Distributor', address: 'Address 2' },
    ],
    adjacentWithShortfalls: [
      { id: 'c2', name: 'Community B', shortfall: 2, total_reallocated: 1 },
      { id: 'c3', name: 'Community C', shortfall: 1, total_reallocated: 0 },
    ],
  },
]

export default function StaticUI() {
  const [data] = useState(mockData)
  const [search, setSearch] = useState('')
  const [program, setProgram] = useState('Paint')

  // dialog
  const [open, setOpen] = useState(false)
  const [selectedCommunity, setSelectedCommunity] = useState<any>(null)
  const [selectedSites, setSelectedSites] = useState<string[]>([])
  const [target, setTarget] = useState('')

  const handleOpen = (community: any) => {
    setSelectedCommunity(community)
    setSelectedSites([])
    setTarget('')
    setOpen(true)
  }

  const toggleSite = (id: string) => {
    setSelectedSites((prev) =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  return (
    <div className='space-y-6'>

      {/* INFO */}
      <Alert>
        <Info className='h-4 w-4' />
        <AlertDescription>
          Static UI demo (no backend)
        </AlertDescription>
      </Alert>

      {/* CONTROLS */}
      <Card>
        <CardContent className='pt-6 flex gap-4'>
          <Input
            placeholder='Search...'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <Select value={program} onValueChange={setProgram}>
            <SelectTrigger className='w-40'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='Paint'>Paint</SelectItem>
              <SelectItem value='Lighting'>Lighting</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* TABLE */}
      <Card>
        <CardHeader>
          <CardTitle>Communities</CardTitle>
        </CardHeader>

        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Community</TableHead>
                <TableHead>Excess</TableHead>
                <TableHead>Adjacent</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {data.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>{c.name}</TableCell>

                  <TableCell>
                    <Badge>{c.eligibleExcess}</Badge>
                  </TableCell>

                  <TableCell>
                    {c.adjacentWithShortfalls.map((a) => (
                      <Badge key={a.id} className='mr-1'>
                        {a.name} ({a.shortfall})
                      </Badge>
                    ))}
                  </TableCell>

                  <TableCell>
                    <Button onClick={() => handleOpen(c)}>
                      Reallocate
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* DIALOG */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>

          <DialogHeader>
            <DialogTitle>
              Reallocate from {selectedCommunity?.name}
            </DialogTitle>
          </DialogHeader>

          {/* TARGET */}
          <div className='space-y-2'>
            <Label>Target Community</Label>
            <Select value={target} onValueChange={setTarget}>
              <SelectTrigger>
                <SelectValue placeholder='Select' />
              </SelectTrigger>
              <SelectContent>
                {selectedCommunity?.adjacentWithShortfalls.map((a: any) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* SITES */}
          <div className='space-y-2'>
            <Label>Sites</Label>
            <div className='border p-2 rounded max-h-40 overflow-y-auto'>
              {selectedCommunity?.eligibleSites.map((s: any) => (
                <div
                  key={s.id}
                  className='flex items-center gap-2 p-2 cursor-pointer'
                  onClick={() => toggleSite(s.id)}
                >
                  <Checkbox checked={selectedSites.includes(s.id)} />
                  <div>
                    <div>{s.name}</div>
                    <div className='text-xs text-gray-500'>
                      {s.address}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SUMMARY */}
          {selectedSites.length > 0 && target && (
            <Alert>
              <ArrowRight className='h-4 w-4' />
              <AlertDescription>
                {selectedSites.length} site(s) selected
              </AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button variant='outline' onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button>
              Confirm
            </Button>
          </DialogFooter>

        </DialogContent>
      </Dialog>
    </div>
  )
}