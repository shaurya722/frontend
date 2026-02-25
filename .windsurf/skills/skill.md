# API Integration Guide - CRUD Operations

## Overview

This guide provides comprehensive patterns for implementing CRUD (Create, Read, Update, Delete) operations using React Query, Axios, and TypeScript in a feature-based architecture.

## Architecture Pattern

```
features/
├── [feature-name]/
│   ├── api.ts          # Axios API functions
│   ├── hooks.ts        # React Query hooks
│   ├── types.ts        # TypeScript interfaces
│   └── index.ts        # Feature exports
```

## 1. GET ALL (List/Paginated Data)

### API Function (`api.ts`)
```typescript
export async function fetchEntities(params: QueryParams = {}): Promise<ApiResponse<PaginatedResponse<Entity>>> {
  const { page = 1, limit = 20, search, searchFields, filters, sort, sortBy } = params

  // Build query string for pagination
  const queryParams = new URLSearchParams()
  queryParams.append('page', page.toString())
  queryParams.append('limit', limit.toString())

  // Build request body for advanced filtering
  const body: RequestBody = {}

  if (search) body.search = search
  if (searchFields?.length) body.searchFields = searchFields
  if (filters && Object.keys(filters).length > 0) body.filters = filters
  if (sort !== undefined) body.sort = sort
  if (sortBy) body.sortBy = sortBy

  const response = await axiosInstance.post<ApiResponse<PaginatedResponse<Entity>>>(
    `/entities/?${queryParams.toString()}`,
    body
  )

  return response.data
}
```

### React Query Hook (`hooks.ts`)
```typescript
export function useEntities(params: QueryParams = {}) {
  return useQuery({
    queryKey: [ENTITIES_QUERY_KEY, params],
    queryFn: () => fetchEntities(params),
    staleTime: 30000, // 30 seconds
    retry: 2,
  })
}
```

### TypeScript Types (`types.ts`)
```typescript
export interface Entity {
  id: string | number
  // ... other properties
}

export interface QueryParams {
  page?: number
  limit?: number
  search?: string
  searchFields?: string[]
  filters?: Record<string, any>
  sort?: 1 | -1
  sortBy?: string
}

export interface RequestBody {
  search?: string
  searchFields?: string[]
  filters?: Record<string, any>
  sort?: 1 | -1
  sortBy?: string
}

export interface PaginatedResponse<T> {
  docs: T[]
  hasNextPage: boolean
  hasPrevPage: boolean
  limit: number
  nextPage: number | null
  page: number
  prevPage: number | null
  totalDocs: number
  totalPages: number
}

export interface ApiResponse<T> {
  status: number
  message: string
  results?: number
  data: T
}
```

### Usage in Component
```typescript
const { data: entitiesResponse, isLoading, error } = useEntities({
  page: 1,
  limit: 20,
  search: searchQuery,
  filters: { status: 'active' }
})

const entities = entitiesResponse?.data?.docs || []
```

## 2. GET BY ID (Single Entity)

### API Function (`api.ts`)
```typescript
export async function fetchEntityById(id: string): Promise<Entity> {
  const response = await axiosInstance.get<ApiResponse<Entity>>(`/entities/${id}/`)
  return response.data.data
}
```

### React Query Hook (`hooks.ts`)
```typescript
export function useEntity(id: string, enabled = true) {
  return useQuery({
    queryKey: [ENTITIES_QUERY_KEY, id],
    queryFn: () => fetchEntityById(id),
    enabled: enabled && !!id,
    staleTime: 30000,
  })
}
```

### Usage in Component
```typescript
const { data: entity, isLoading, error } = useEntity(entityId)

// Loading state
if (isLoading) return <div>Loading...</div>

// Error state
if (error) return <div>Error loading entity</div>

// Success state
if (entity) return <EntityDetails entity={entity} />
```

## 3. CREATE (New Entity)

### API Function (`api.ts`)
```typescript
export async function createEntity(data: CreateEntityDto) {
  const response = await axiosInstance.post<ApiResponse<Entity>>('/entities/', data)
  return response.data
}
```

### React Query Hook (`hooks.ts`)
```typescript
export function useCreateEntity() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateEntityDto) => createEntity(data),
    onSuccess: () => {
      // Invalidate and refetch entities list
      queryClient.invalidateQueries({ queryKey: [ENTITIES_QUERY_KEY] })
    },
  })
}
```

### TypeScript Types (`types.ts`)
```typescript
export interface CreateEntityDto {
  name: string
  // ... required fields for creation
}
```

### Usage in Component
```typescript
const createMutation = useCreateEntity()

const handleCreate = async (formData: CreateEntityDto) => {
  try {
    await createMutation.mutateAsync(formData)
    // Success handling (form reset, navigation, etc.)
  } catch (error) {
    // Error handling
  }
}

// In JSX
<Button
  onClick={() => handleCreate(formData)}
  disabled={createMutation.isPending}
>
  {createMutation.isPending ? 'Creating...' : 'Create Entity'}
</Button>
```

## 4. UPDATE (Modify Entity)

### API Function (`api.ts`)
```typescript
export async function updateEntity(id: string, data: UpdateEntityDto) {
  const response = await axiosInstance.put<ApiResponse<Entity>>(`/entities/${id}/`, data)
  return response.data
}
```

### React Query Hook (`hooks.ts`)
```typescript
export function useUpdateEntity() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateEntityDto }) =>
      updateEntity(id, data),
    onSuccess: (_, variables) => {
      // Invalidate specific entity and list
      queryClient.invalidateQueries({ queryKey: [ENTITIES_QUERY_KEY, variables.id] })
      queryClient.invalidateQueries({ queryKey: [ENTITIES_QUERY_KEY] })
    },
  })
}
```

### TypeScript Types (`types.ts`)
```typescript
export interface UpdateEntityDto {
  name?: string
  // ... optional fields for updates
}
```

### Usage in Component
```typescript
const updateMutation = useUpdateEntity()

const handleUpdate = async (id: string, formData: UpdateEntityDto) => {
  try {
    await updateMutation.mutateAsync({ id, data: formData })
    // Success handling
  } catch (error) {
    // Error handling
  }
}
```

## 5. DELETE (Remove Entity)

### API Function (`api.ts`)
```typescript
export async function deleteEntity(id: string) {
  const response = await axiosInstance.delete<ApiResponse<void>>(`/entities/${id}`)
  return response.data
}
```

### React Query Hook (`hooks.ts`)
```typescript
export function useDeleteEntity() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteEntity(id),
    onSuccess: () => {
      // Invalidate entities list
      queryClient.invalidateQueries({ queryKey: [ENTITIES_QUERY_KEY] })
    },
  })
}
```

### Usage in Component
```typescript
const deleteMutation = useDeleteEntity()

const handleDelete = async (id: string) => {
  if (confirm('Are you sure you want to delete this entity?')) {
    try {
      await deleteMutation.mutateAsync(id)
      // Success handling
    } catch (error) {
      // Error handling
    }
  }
}
```

## 6. Additional Operations

### Bulk Import (File Upload)
```typescript
// API function
export async function bulkImportEntities(file: File) {
  const formData = new FormData()
  formData.append('file', file)

  const response = await axiosInstance.post<ApiResponse<any>>('/entities/bulk-import/', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })

  return response.data
}

// Hook
export function useBulkImportEntities() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (file: File) => bulkImportEntities(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ENTITIES_QUERY_KEY] })
    },
  })
}
```

### Export (File Download)
```typescript
// API function
export async function exportEntities(params: QueryParams = {}) {
  const response = await axiosInstance.post('/entities/export/', params, {
    responseType: 'blob',
  })

  return response.data
}

// Hook
export function useExportEntities() {
  return useMutation({
    mutationFn: (params: QueryParams) => exportEntities(params),
  })
}
```

## 7. Component Integration Patterns

### List Component with CRUD
```typescript
export default function EntitiesManagement() {
  // State management
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(1)
  const [editingId, setEditingId] = useState<string | null>(null)

  // API hooks
  const { data: entitiesResponse, isLoading } = useEntities({
    page,
    search: searchQuery,
  })

  const createMutation = useCreateEntity()
  const updateMutation = useUpdateEntity()
  const deleteMutation = useDeleteEntity()

  // Fresh data fetching for editing
  const { data: editingEntity } = useEntity(editingId || '', !!editingId)

  // Handlers
  const handleEdit = (entity: Entity) => setEditingEntity(entity.id.toString())
  const handleCreate = (data: CreateEntityDto) => createMutation.mutateAsync(data)
  const handleUpdate = (id: string, data: UpdateEntityDto) =>
    updateMutation.mutateAsync({ id, data })
  const handleDelete = (id: string) => deleteMutation.mutateAsync(id)

  // Render
  return (
    <div>
      {/* List entities */}
      {/* Create form */}
      {/* Edit form with fresh data */}
      {/* Delete confirmations */}
    </div>
  )
}
```

### Form Component with Validation
```typescript
function EntityForm({ entity, onSubmit, loading }: EntityFormProps) {
  const form = useForm({
    resolver: yupResolver(entitySchema),
    defaultValues: {
      name: entity?.name || '',
      // ... other fields
    },
  })

  const handleSubmit = form.handleSubmit((data) => {
    onSubmit(data)
  })

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields with validation */}
      <Button type="submit" disabled={loading}>
        {loading ? 'Saving...' : 'Save'}
      </Button>
    </form>
  )
}
```

## 8. Error Handling Patterns

### Global Error Handling
```typescript
// In axios interceptor (lib/axios-instance.ts)
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized
    }
    if (error.response?.status === 403) {
      // Handle forbidden
    }
    return Promise.reject(error)
  }
)
```

### Component-Level Error Handling
```typescript
const { data, error, isError } = useEntities()

if (isError) {
  return (
    <Alert variant="destructive">
      <AlertDescription>
        Failed to load entities: {error?.message}
      </AlertDescription>
    </Alert>
  )
}
```

## 9. Loading States

### Multiple Loading States
```typescript
const { isLoading: listLoading } = useEntities()
const createMutation = useCreateEntity()
const updateMutation = useUpdateEntity()

const isAnyLoading = listLoading || createMutation.isPending || updateMutation.isPending
```

### Skeleton Loading
```typescript
if (isLoading) {
  return (
    <div className="space-y-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  )
}
```

## 10. Caching and Invalidation

### Query Keys Pattern
```typescript
export const ENTITIES_QUERY_KEY = 'entities'

// Use in hooks
queryKey: [ENTITIES_QUERY_KEY, params]      // List with params
queryKey: [ENTITIES_QUERY_KEY, entityId]    // Single entity
queryKey: [ENTITIES_QUERY_KEY]              // All entities
```

### Selective Invalidation
```typescript
// Invalidate all entities
queryClient.invalidateQueries({ queryKey: [ENTITIES_QUERY_KEY] })

// Invalidate specific entity
queryClient.invalidateQueries({ queryKey: [ENTITIES_QUERY_KEY, entityId] })

// Invalidate with predicate
queryClient.invalidateQueries({
  predicate: (query) => query.queryKey[0] === ENTITIES_QUERY_KEY
})
```

## 11. Best Practices

### 1. Consistent Naming
- Use plural for collections: `entities`, `users`, `products`
- Use singular for individual: `entity`, `user`, `product`
- Follow REST conventions: `GET /entities`, `POST /entities`, `PUT /entities/:id`

### 2. Type Safety
- Define comprehensive TypeScript interfaces
- Use generic types for reusable patterns
- Validate API responses with types

### 3. Error Boundaries
- Wrap API calls in try-catch blocks
- Provide user-friendly error messages
- Handle network errors gracefully

### 4. Optimistic Updates
```typescript
onMutate: async (newEntity) => {
  // Cancel outgoing refetches
  await queryClient.cancelQueries({ queryKey: [ENTITIES_QUERY_KEY] })

  // Snapshot previous value
  const previousEntities = queryClient.getQueryData([ENTITIES_QUERY_KEY])

  // Optimistically update
  queryClient.setQueryData([ENTITIES_QUERY_KEY], (old: any) => ({
    ...old,
    data: { ...old.data, docs: [...old.data.docs, newEntity] }
  }))

  return { previousEntities }
},

onError: (err, newEntity, context) => {
  // Revert on error
  if (context?.previousEntities) {
    queryClient.setQueryData([ENTITIES_QUERY_KEY], context.previousEntities)
  }
}
```

### 5. Debounced Search
```typescript
useEffect(() => {
  const timer = setTimeout(() => {
    setDebouncedSearch(searchQuery)
    setPage(1) // Reset to first page on search
  }, 300)

  return () => clearTimeout(timer)
}, [searchQuery])
```

### 6. Loading States
- Show loading indicators for async operations
- Disable buttons during mutations
- Provide feedback for long-running operations

This guide provides a complete reference for implementing CRUD operations in this codebase. Always refer to existing implementations in the `features/` directory for specific examples.
