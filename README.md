## Getting Started

### Prerequisites
- Node.js 18+
- Reactjs ^19
- typescript ^5
- npm or pnpm package manager
- Modern web browser with JavaScript enabled
- API backend running (separate service)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd arcgisn-ov2025/frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   pnpm install
   ```

3. **Configure environment variables**
   
   Copy `.env.example` to `.env.local` and configure:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:8000/api
   # Add other required environment variables
   ```

4. **Start the development server**
   ```bash
   npm run dev
   # or
   pnpm dev
   ```

5. **Open your browser**
   
   Navigate to `http://localhost:3000` to view the application.

## Technical Architecture

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **UI Library**: React 18
- **Styling**: Tailwind CSS
- **Components**: shadcn/ui
- **State Management**: React Query (TanStack Query)
- **Maps**: Leaflet with OpenStreetMap
- **Forms**: React Hook Form
- **Icons**: Lucide React

### Key Libraries
- **React Query**: Data fetching and caching
- **Leaflet**: Interactive maps
- **React Hook Form**: Form handling
- **shadcn/ui**: Modern UI components
- **Tailwind CSS**: Utility-first styling
- **Lucide React**: Icon library

### Project Structure
```
├── app/                    # Next.js App Router directory
│   ├── dashboard/         # Dashboard page with compliance overview
│   ├── login/            # Authentication page
│   ├── globals.css       # Global styles and Tailwind CSS
│   ├── layout.tsx        # Root layout component
│   └── page.tsx          # Landing page
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   ├── dashboard-layout.tsx  # Main layout wrapper
│   ├── leaflet-map.tsx   # Interactive Leaflet map component
│   ├── mapView.tsx       # Map view with filters and data
│   ├── siteManagement.tsx # Site management interface
│   ├── communities-management.tsx # Communities management
│   └── site-form-dialog.tsx # Site creation/editing form
├── features/             # Feature-based architecture
│   ├── sites/           # Site management logic and hooks
│   ├── communities/     # Communities management logic
│   ├── compliance/      # Compliance calculation logic
│   ├── census-year/     # Census year management
│   └── regions/         # Regional data management
├── hooks/               # Custom React hooks
├── lib/                 # Utility libraries and configurations
├── providers/           # React context providers
└── types/               # TypeScript type definitions
```

### Running in Development
The application uses Next.js development server with hot reloading:
```bash
npm run dev
# or
pnpm dev
```

The application will be available at `http://localhost:3000`.

### Building for Production
```bash
npm run build
npm start
```

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
