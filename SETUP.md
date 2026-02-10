# Quick Setup Guide

## Option 1: Demo Mode (No Database Required)

The application will automatically run in demo mode if Supabase is not configured:

1. Install dependencies: `npm install`
2. Run dev server: `npm run dev`
3. Open [http://localhost:3000](http://localhost:3000)
4. Login with demo credentials: `admin` / `admin123`

Demo mode uses in-memory mock data and is perfect for testing the UI and features.

## Option 2: Full Setup with Supabase

### Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Wait for project initialization

### Step 2: Get API Credentials

1. Go to Project Settings > API
2. Copy your project URL and anon key:
   - Project URL: `https://xxxxx.supabase.co`
   - Anon key: `eyJhbGci...`

### Step 3: Configure Environment Variables

Create `.env.local` in the project root:

\`\`\`env
NEXT_PUBLIC_SUPABASE_URL=your_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
\`\`\`

The other environment variables listed in `.env.example` are already configured in your v0 workspace.

### Step 4: Run Database Migrations

You can run the SQL scripts directly from v0:

1. The scripts are in the `/scripts` folder
2. v0 can execute them for you automatically
3. Or copy-paste them into Supabase SQL Editor

The scripts will:
- Create all necessary tables
- Set up indexes for performance
- Enable Row Level Security
- Seed initial test data
- Configure RLS policies

### Step 5: Start Development

\`\`\`bash
npm run dev
\`\`\`

Navigate to [http://localhost:3000](http://localhost:3000) and login!

## Verification Checklist

- [ ] Application loads without errors
- [ ] Can login with demo credentials
- [ ] Dashboard displays data
- [ ] Map view renders (may show placeholder in demo mode)
- [ ] Can navigate between tabs
- [ ] User menu works
- [ ] No console errors (warnings are OK)

## Common Issues

**"Module not found" errors**
- Run `npm install` or `rm -rf node_modules && npm install`

**Build errors about TypeScript**
- The project has `typescript.ignoreBuildErrors: false` for type safety
- Check for any TypeScript errors in your files

**Middleware redirect loop**
- Clear browser cache and localStorage
- Delete `.next` folder and rebuild

## Next Steps

1. Customize the municipality list in seed data
2. Configure authentication methods in Supabase
3. Set up email templates for user invitations
4. Deploy to Vercel for production
