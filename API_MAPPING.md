# API Mapping: Frontend to Django Backend

This document provides a comprehensive mapping between the frontend codebase and the Django backend API endpoints as defined in `backend/postman_collection.json`.

## Configuration

To enable the Django backend API, set the following environment variable in your `.env.local`:

```bash
NEXT_PUBLIC_USE_BACKEND_API=true
NEXT_PUBLIC_API_URL=http://localhost:8000
```

When `NEXT_PUBLIC_USE_BACKEND_API` is not set or is `false`, the frontend will fall back to Supabase or local mock data.

---

## API Client Library

**File:** `lib/api.ts`

The central API client that handles:
- JWT token management (access/refresh tokens)
- Request/response formatting
- Error handling
- Automatic token refresh on 401 responses

### Token Storage
- Access token: `localStorage.getItem("access_token")`
- Refresh token: `localStorage.getItem("refresh_token")`

---

## Authentication API

### Postman Collection: `Authentication` folder

| Postman Request | Backend Endpoint | Frontend Function | Frontend File |
|-----------------|------------------|-------------------|---------------|
| Login | `POST /api/v1/auth/login/` | `api.login()` → `auth.login()` | `lib/auth.ts` |
| Login as Analyst | `POST /api/v1/auth/login/` | `api.login()` | `lib/api.ts` |
| Login as Viewer | `POST /api/v1/auth/login/` | `api.login()` | `lib/api.ts` |
| Refresh Token | `POST /api/v1/auth/refresh/` | `api.refreshToken()` | `lib/api.ts` |

### Frontend Usage

```typescript
// lib/auth.ts - login function
import * as api from "./api"

export async function login(credentials: LoginCredentials): Promise<AuthUser | null> {
  const response = await api.login(credentials)
  if (response.data) {
    // Tokens stored automatically by api.login()
    return { id, username, name, role, email }
  }
  return null
}
```

**Components using authentication:**
- `app/login/page.tsx` - Login page
- `components/auth-guard.tsx` - Authentication guard
- `components/user-menu.tsx` - User menu with logout

---

## Users API

### Postman Collection: `Users` folder

| Postman Request | Backend Endpoint | Frontend Function | Frontend File |
|-----------------|------------------|-------------------|---------------|
| List All Users | `GET /api/v1/auth/users/` | `api.getUsers()` | `lib/api.ts` |
| Get Current User (Me) | `GET /api/v1/auth/users/me/` | `api.getCurrentUser()` → `auth.getCurrentUser()` | `lib/auth.ts` |
| Get User by ID | `GET /api/v1/auth/users/{id}/` | `api.getUserById(id)` | `lib/api.ts` |
| Create User | `POST /api/v1/auth/users/` | `api.createUser()` → `auth.inviteUser()` | `lib/auth.ts` |
| Update User | `PUT /api/v1/auth/users/{id}/` | `api.updateUser(id, data)` | `lib/api.ts` |
| Update Profile | `PUT /api/v1/auth/users/update_profile/` | `api.updateProfile()` → `auth.updateUserProfile()` | `lib/auth.ts` |
| Change Password | `POST /api/v1/auth/users/change_password/` | `api.changePassword()` → `auth.changePassword()` | `lib/auth.ts` |
| Delete User | `DELETE /api/v1/auth/users/{id}/` | `api.deleteUser(id)` | `lib/api.ts` |

**Components using Users API:**
- `components/user-management.tsx` - User CRUD operations
- `app/profile/page.tsx` - Profile management
- `app/change-password/page.tsx` - Password change
- `app/dashboard/users/page.tsx` - Users dashboard page

---

## Municipalities API

### Postman Collection: `Municipalities` folder

| Postman Request | Backend Endpoint | Frontend Function | Frontend File |
|-----------------|------------------|-------------------|---------------|
| List All Municipalities | `GET /api/v1/municipalities/` | `api.getMunicipalities()` → `sites.getMunicipalities()` | `lib/sites.ts` |
| List with Filters | `GET /api/v1/municipalities/?tier=&region=&search=` | `api.getMunicipalities(filters)` | `lib/api.ts` |
| Get Municipality by ID | `GET /api/v1/municipalities/{id}/` | `api.getMunicipalityById(id)` | `lib/api.ts` |
| Create Municipality | `POST /api/v1/municipalities/` | `api.createMunicipality(data)` | `lib/api.ts` |
| Update Municipality | `PUT /api/v1/municipalities/{id}/` | `api.updateMunicipality(id, data)` | `lib/api.ts` |
| Delete Municipality | `DELETE /api/v1/municipalities/{id}/` | `api.deleteMunicipality(id)` | `lib/api.ts` |
| Get Municipality Stats | `GET /api/v1/municipalities/stats/` | `api.getMunicipalityStats()` → `sites.getMunicipalityStats()` | `lib/sites.ts` |
| Get Adjacent Communities | `GET /api/v1/municipalities/{id}/adjacent/` | `api.getAdjacentCommunities(id)` → `sites.getAdjacentCommunities(id)` | `lib/sites.ts` |
| Get Census History | `GET /api/v1/municipalities/{id}/census_history/` | `api.getCensusHistory(id)` | `lib/api.ts` |

**Components using Municipalities API:**
- `components/municipality-management.tsx` - Municipality CRUD
- `components/communities-management.tsx` - Communities management
- `app/dashboard/municipalities/page.tsx` - Municipalities page
- `app/dashboard/communities/page.tsx` - Communities page

---

## Collection Sites API

### Postman Collection: `Collection Sites` folder

| Postman Request | Backend Endpoint | Frontend Function | Frontend File |
|-----------------|------------------|-------------------|---------------|
| List All Sites | `GET /api/v1/sites/` | `api.getSites()` → `sites.getSites()` | `lib/sites.ts` |
| List Sites with Filters | `GET /api/v1/sites/?status=&site_type=&operator_type=&programs=` | `api.getSites(filters)` | `lib/api.ts` |
| Search Sites | `GET /api/v1/sites/?search=` | `api.getSites({ search })` | `lib/api.ts` |
| Get Site by ID | `GET /api/v1/sites/{id}/` | `api.getSiteById(id)` | `lib/api.ts` |
| Create Site | `POST /api/v1/sites/` | `api.createSite(data)` → `sites.createSite(data)` | `lib/sites.ts` |
| Update Site | `PUT /api/v1/sites/{id}/` | `api.updateSite(id, data)` → `sites.updateSite(id, data)` | `lib/sites.ts` |
| Delete Site | `DELETE /api/v1/sites/{id}/` | `api.deleteSite(id)` → `sites.deleteSite(id)` | `lib/sites.ts` |
| Get Sites for Map | `GET /api/v1/sites/map/` | `api.getSitesForMap()` → `sites.getSitesForMap()` | `lib/sites.ts` |
| Get Site Stats | `GET /api/v1/sites/stats/` | `api.getSiteStats()` → `sites.getSiteStats()` | `lib/sites.ts` |
| Get Sites by Program | `GET /api/v1/sites/by_program/` | `api.getSitesByProgram()` | `lib/api.ts` |
| Export Sites to CSV | `GET /api/v1/sites/export/` | `api.exportSites()` | `lib/api.ts` |
| Import Sites from CSV | `POST /api/v1/sites/import_csv/` | (file upload) | `lib/api.ts` |

**Components using Sites API:**
- `components/site-management.tsx` - Site CRUD operations
- `components/map-view.tsx` - Map display
- `components/leaflet-map.tsx` - Leaflet map integration
- `app/dashboard/sites/page.tsx` - Sites dashboard
- `app/dashboard/map/page.tsx` - Map page

---

## Compliance API

### Postman Collection: `Compliance` folder

| Postman Request | Backend Endpoint | Frontend Function | Frontend File |
|-----------------|------------------|-------------------|---------------|
| Analyze Compliance (All) | `GET /api/v1/compliance/analyze/` | `api.analyzeCompliance()` → `compliance.calculateCompliance()` | `lib/compliance.ts` |
| Analyze with Filters | `GET /api/v1/compliance/analyze/?program=&municipality=&offset_percentage=` | `api.analyzeCompliance(filters)` | `lib/api.ts` |
| Save Compliance Calculation | `POST /api/v1/compliance/analyze/` | `api.saveComplianceCalculation()` → `compliance.saveComplianceCalculation()` | `lib/compliance.ts` |
| Calculate Requirements | `POST /api/v1/compliance/calculate/` | `api.calculateRequirements()` → `compliance.calculateRequirementsFromAPI()` | `lib/compliance.ts` |
| List Compliance Calculations | `GET /api/v1/compliance/calculations/` | `api.getComplianceCalculations()` → `compliance.getComplianceHistory()` | `lib/compliance.ts` |
| List Regulatory Rules | `GET /api/v1/compliance/rules/` | `api.getRegulatoryRules()` → `compliance.getRegulatoryRules()` | `lib/compliance.ts` |
| Filter Regulatory Rules | `GET /api/v1/compliance/rules/?program=&category=` | `api.getRegulatoryRules(filters)` | `lib/api.ts` |
| Create Regulatory Rule | `POST /api/v1/compliance/rules/` | `api.createRegulatoryRule(data)` | `lib/api.ts` |

**Components using Compliance API:**
- `components/compliance-analysis.tsx` - Compliance analysis
- `components/regulatory-rules-management.tsx` - Rules management
- `app/dashboard/compliance/page.tsx` - Compliance page
- `app/dashboard/rules/page.tsx` - Rules page

### Compliance Calculation Logic

The compliance calculation logic is implemented both in frontend (`lib/compliance.ts`) and backend (`backend/apps/compliance/services.py`):

```typescript
// Frontend: lib/compliance.ts
export function calculateRequirements(population: number, program: string): number {
  switch (program) {
    case "Paint":
      if (population >= 5000 && population <= 500000) {
        return Math.ceil(population / 40000)
      } else if (population > 500000) {
        return 13 + Math.ceil((population - 500000) / 150000)
      }
      return population >= 1000 ? 1 : 0
    // ... other programs
  }
}
```

---

## Reallocations API

### Postman Collection: `Reallocations` folder

| Postman Request | Backend Endpoint | Frontend Function | Frontend File |
|-----------------|------------------|-------------------|---------------|
| List All Reallocations | `GET /api/v1/reallocations/` | `api.getReallocations()` → `reallocations.getReallocations()` | `lib/reallocations.ts` |
| Filter Reallocations | `GET /api/v1/reallocations/?status=&program=&reallocation_type=` | `api.getReallocations(filters)` | `lib/api.ts` |
| Get Reallocation by ID | `GET /api/v1/reallocations/{id}/` | `api.getReallocationById(id)` | `lib/api.ts` |
| Create Reallocation | `POST /api/v1/reallocations/` | `api.createReallocation()` → `reallocations.createReallocation()` | `lib/reallocations.ts` |
| Approve Reallocation | `POST /api/v1/reallocations/{id}/approve/` | `api.approveReallocation(id)` → `reallocations.updateReallocationStatus()` | `lib/reallocations.ts` |
| Reject Reallocation | `POST /api/v1/reallocations/{id}/reject/` | `api.rejectReallocation(id, rationale)` → `reallocations.updateReallocationStatus()` | `lib/reallocations.ts` |
| Get Reallocation Stats | `GET /api/v1/reallocations/stats/` | `api.getReallocationStats()` → `reallocations.getReallocationStats()` | `lib/reallocations.ts` |
| Delete Reallocation | `DELETE /api/v1/reallocations/{id}/` | `api.deleteReallocation(id)` → `reallocations.deleteReallocation()` | `lib/reallocations.ts` |

**Components using Reallocations API:**
- `components/reallocation-tools.tsx` - Reallocation management
- `app/dashboard/reallocation/page.tsx` - Reallocation page

---

## Tool A - Direct Service Offset API

### Postman Collection: `Tool A - Direct Service Offset` folder

| Postman Request | Backend Endpoint | Frontend Function | Frontend File |
|-----------------|------------------|-------------------|---------------|
| Get Offset Calculations | `GET /api/v1/tools/tool-a/?program=&year=&global_percentage=` | `api.getToolAOffsets()` → `reallocations.getToolAOffsets()` | `lib/reallocations.ts` |
| Apply Global Offset | `POST /api/v1/tools/tool-a/` | `api.applyToolAOffset()` → `reallocations.applyToolAOffset()` | `lib/reallocations.ts` |
| List Global Offsets | `GET /api/v1/tools/offsets/global/` | `api.getGlobalOffsets()` | `lib/api.ts` |
| Create Global Offset | `POST /api/v1/tools/offsets/global/` | `api.createGlobalOffset(data)` | `lib/api.ts` |
| List Community Offsets | `GET /api/v1/tools/offsets/community/` | `api.getCommunityOffsets()` | `lib/api.ts` |
| Create Community Offset Override | `POST /api/v1/tools/offsets/community/` | `api.createCommunityOffset(data)` | `lib/api.ts` |

**Components using Tool A API:**
- `components/tool-a-direct-service-offset.tsx` - Tool A interface
- `app/dashboard/tool-a-offset/page.tsx` - Tool A page

---

## Tool B - Event Application API

### Postman Collection: `Tool B - Event Application` folder

| Postman Request | Backend Endpoint | Frontend Function | Frontend File |
|-----------------|------------------|-------------------|---------------|
| Get Shortfalls and Events | `GET /api/v1/tools/tool-b/?program=&year=` | `api.getToolBData()` → `reallocations.getToolBData()` | `lib/reallocations.ts` |
| Apply Events to Community | `POST /api/v1/tools/tool-b/` | `api.applyEventsToCommunit()` → `reallocations.applyEventsToCommunit()` | `lib/reallocations.ts` |
| Apply All Events | `POST /api/v1/tools/tool-b/apply-all/` | `api.applyAllEvents()` | `lib/api.ts` |
| List Event Applications | `GET /api/v1/tools/events/applications/` | `api.getEventApplications()` | `lib/api.ts` |
| Filter Event Applications | `GET /api/v1/tools/events/applications/?program=&year=` | `api.getEventApplications(filters)` | `lib/api.ts` |

**Components using Tool B API:**
- `components/tool-b-event-application.tsx` - Tool B interface
- `app/dashboard/tool-b-events/page.tsx` - Tool B page

---

## Tool C - Adjacent Reallocation API

### Postman Collection: `Tool C - Adjacent Reallocation` folder

| Postman Request | Backend Endpoint | Frontend Function | Frontend File |
|-----------------|------------------|-------------------|---------------|
| Get Excess Communities | `GET /api/v1/tools/tool-c/?program=` | `api.getToolCData()` → `reallocations.getToolCData()` | `lib/reallocations.ts` |
| Create Reallocation Request | `POST /api/v1/tools/tool-c/` | `api.createToolCReallocation()` → `reallocations.createToolCReallocation()` | `lib/reallocations.ts` |

**Components using Tool C API:**
- `components/tool-c-adjacent-reallocation.tsx` - Tool C interface
- `app/dashboard/tool-c-reallocation/page.tsx` - Tool C page

---

## API Documentation Endpoints

### Postman Collection: `API Documentation` folder

| Postman Request | Backend Endpoint | Description |
|-----------------|------------------|-------------|
| OpenAPI Schema | `GET /api/schema/` | JSON OpenAPI schema |
| Swagger UI | `GET /api/docs/` | Interactive Swagger documentation |
| ReDoc | `GET /api/redoc/` | ReDoc documentation |

---

## Data Type Mappings

### Frontend to Backend Type Mapping

| Frontend Type (lib/supabase.ts) | Backend Model | API Type (lib/api.ts) |
|--------------------------------|---------------|----------------------|
| `User` | `apps.users.models.User` | `ApiUser` |
| `Municipality` | `apps.municipalities.models.Municipality` | `ApiMunicipality` |
| `CollectionSite` | `apps.sites.models.CollectionSite` | `ApiCollectionSite` |
| `Reallocation` | `apps.reallocations.models.Reallocation` | `ApiReallocation` |
| `ComplianceCalculation` | `apps.compliance.models.ComplianceCalculation` | `ApiComplianceCalculation` |
| `RegulatoryRule` | `apps.compliance.models.RegulatoryRule` | `ApiRegulatoryRule` |
| `DirectServiceOffset` | `apps.tools.models.DirectServiceOffset` | `ApiDirectServiceOffset` |
| `CommunityOffset` | `apps.tools.models.CommunityOffset` | `ApiCommunityOffset` |
| `EventApplication` | `apps.tools.models.EventApplication` | `ApiEventApplication` |

---

## Error Handling

The API client (`lib/api.ts`) handles errors consistently:

```typescript
interface ApiResponse<T> {
  data: T | null
  error: string | null
  status: number
}
```

**Error handling in components:**
```typescript
const response = await api.getSites()
if (response.error) {
  console.error("Failed to fetch sites:", response.error)
  // Show error toast or fallback to cached data
} else {
  setSites(response.data.results)
}
```

---

## Migration Guide

### Switching from Supabase to Django Backend

1. **Set environment variables:**
   ```bash
   NEXT_PUBLIC_USE_BACKEND_API=true
   NEXT_PUBLIC_API_URL=http://localhost:8000
   ```

2. **Start Django backend:**
   ```bash
   cd backend
   source venv/bin/activate
   python manage.py runserver
   ```

3. **Seed database:**
   ```bash
   python manage.py seed_data --clear
   ```

4. **Test with Postman:**
   Import `backend/postman_collection.json` and run the authentication flow first.

### Keeping Both Options

The frontend is designed to work with both Supabase and Django backend. When `NEXT_PUBLIC_USE_BACKEND_API` is:
- `true`: Uses Django REST API
- `false` or not set: Uses Supabase client directly

This allows gradual migration and easy switching between backends.

---

## Testing

### Postman Collection Variables

The Postman collection uses these variables:
- `{{base_url}}`: Default `http://localhost:8000`
- `{{access_token}}`: Set automatically after login
- `{{refresh_token}}`: Set automatically after login
- `{{user_id}}`: Set from user list response
- `{{municipality_id}}`: Set from municipalities list response
- `{{site_id}}`: Set from sites list response
- `{{reallocation_id}}`: Set from reallocations list response

### Test Flow

1. **Authentication:** Login → Get tokens
2. **Users:** List → Create → Update → Delete
3. **Municipalities:** List → Create → Get adjacent → Delete
4. **Sites:** List → Create → Update → Get stats → Delete
5. **Compliance:** Analyze → Calculate → List rules
6. **Reallocations:** List → Create → Approve/Reject → Delete
7. **Tools:** Tool A → Tool B → Tool C

