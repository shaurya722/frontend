# ArcGIS Compliance Tool New

Ontario HSP & EEE Collection Site Assessment System

## Overview

The ArcGIS Compliance Tool is a comprehensive web application designed to help Ontario municipalities and organizations track compliance with Hazardous and Special Products (HSP) and Electrical and Electronic Equipment (EEE) collection site requirements.

## Features

### Core Functionality
- **Interactive Map View**: Visualize collection sites and municipal boundaries
- **Site Management**: Add, edit, and track collection sites across Ontario
- **Compliance Analysis**: Real-time compliance calculations and reporting
- **Reallocation Tools**: Manage site reallocations between municipalities
- **Direct Service Offset**: Track direct service to generators
- **Reports & Export**: Generate comprehensive compliance reports

### User Roles
- **Administrator**: Full system access, user management, regulatory rules
- **Compliance Analyst**: Site management, compliance analysis, reallocations
- **Viewer**: Read-only access to maps and reports

## Getting Started

### Prerequisites
- Node.js 18+ 
- Supabase account (for production database)
- Modern web browser

### Installation

1. **Clone or download the project**

2. **Install dependencies** (handled automatically by v0)

3. **Configure environment variables**
   The following environment variables are already configured in your v0 workspace:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `POSTGRES_*` variables for database access

4. **Database Setup**
   The database is already set up with:
   - ✅ 5 demo users (admin, analyst, viewer, etc.)
   - ✅ 10 municipalities across Ontario
   - ✅ 10 collection sites with realistic data
   - ✅ Row Level Security (RLS) policies enabled

### Demo Credentials

| Role | Username | Password |
|------|----------|----------|
| Administrator | admin | admin123 |
| Compliance Analyst | analyst | analyst123 |
| Viewer | viewer | viewer123 |

## Usage

### Login
1. Navigate to the login page
2. Use one of the demo credentials above
3. You'll be redirected to the dashboard upon successful login

### Dashboard Overview
The dashboard provides:
- Total sites count
- Compliance rate percentage
- Shortfalls (sites needed for compliance)
- Excesses (sites available for reallocation)

### Managing Sites (Analyst/Admin)
1. Go to the "Site Management" tab
2. Click "Add New Site" to create a collection site
3. Fill in required information: name, address, municipality, programs
4. Sites can be edited or deleted as needed

### Compliance Analysis
1. Navigate to the "Compliance Analysis" tab
2. View compliance status by municipality
3. See detailed calculations for each program (Paint, Solvents, etc.)
4. Identify municipalities with shortfalls or excesses

### Reallocations (Analyst/Admin)
1. Go to the "Reallocation" tab
2. Create reallocations to address compliance shortfalls
3. Submit for approval
4. Track reallocation status

### Generating Reports
1. Navigate to the "Reports" tab
2. Select report type (Compliance Summary, Site Inventory, etc.)
3. Choose format (PDF, Excel, CSV)
4. Download or print the report

## Technical Architecture

### Frontend
- **Framework**: Next.js 14 (App Router)
- **UI Library**: React 18
- **Styling**: Tailwind CSS v4
- **Components**: shadcn/ui
- **Maps**: Leaflet (OpenStreetMap)

### Backend
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth + Custom Auth
- **API**: Next.js Server Actions & Route Handlers

### Database Schema
- `users` - User accounts and roles
- `municipalities` - Ontario municipalities
- `collection_sites` - HSP/EEE collection locations
- `compliance_calculations` - Compliance tracking
- `reallocations` - Site reallocation records
- `audit_logs` - System audit trail

## Development

### Project Structure
\`\`\`
├── app/                    # Next.js app directory
│   ├── dashboard/         # Main dashboard page
│   ├── login/            # Authentication
│   └── globals.css       # Global styles
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   ├── map-view.tsx      # Interactive map
│   ├── site-management.tsx
│   └── ...
├── lib/                   # Utility libraries
│   ├── supabase.ts       # Database client
│   ├── auth.ts           # Authentication logic
│   ├── sites.ts          # Site management
│   └── compliance.ts     # Compliance calculations
└── scripts/               # Database scripts
    ├── 01-create-tables.sql
    ├── 02-seed-data.sql
    └── 03-create-policies.sql
\`\`\`

### Running in Development
The application runs automatically in the v0 preview environment. Any changes to files will hot-reload instantly.

### Debugging
Debug logs are prefixed with `[v0]` in the browser console:
\`\`\`javascript
console.log("[v0] User logged in:", user)
\`\`\`

## Troubleshooting

### Login Issues
- Ensure you're using the correct demo credentials
- Clear browser localStorage if you encounter session issues
- Check browser console for `[v0]` debug messages

### Data Not Loading
- Verify Supabase environment variables are configured
- Check the Connect tab in v0 sidebar to confirm Supabase integration
- Database has been seeded with sample data

### CSS Errors
- All Tailwind v4 configuration is in `globals.css`
- No `tailwind.config.js` file is needed
- Font loading uses Google Fonts (Inter) instead of local files

## Support

For issues or questions:
1. Check the browser console for `[v0]` debug logs
2. Verify your user role has appropriate permissions
3. Review the SETUP.md file for detailed configuration

## License

© 2025 ArcGIS Compliance Tool. All rights reserved.
Phase 1 - Ontario Implementation
