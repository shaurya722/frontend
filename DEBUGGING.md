# Debugging Guide: Frontend Not Showing Data

## Issue
Data is added to the database successfully, but the frontend is not displaying any sites or municipalities.

## Potential Causes

### 1. RLS Policies Blocking Data
Even though data is inserted, RLS policies might be blocking reads. Check:
- Run the RLS fix script: `06-fix-rls-recursion.sql`
- Verify policies allow authenticated users to read:
  ```sql
  SELECT * FROM collection_sites LIMIT 1;
  ```

### 2. Date Filtering Issue
The `isSiteActiveInYear` function might be filtering out all sites. Check browser console for:
- `[MapView] Total sites received: X`
- `[MapView] Filtered sites count: X`
- Any warnings about date parsing

### 3. Data Format Issues
Supabase returns DATERANGE as a string like `[2020-01-01,)` or `[2020-01-01,2023-12-31)`. The parsing should handle this, but verify in console.

## Debugging Steps

1. **Check Browser Console**
   - Open DevTools → Console
   - Look for logs starting with `[v0]` and `[MapView]`
   - Check if sites are being fetched: `[v0] Successfully fetched sites: X`

2. **Check Network Tab**
   - Open DevTools → Network
   - Look for requests to Supabase
   - Check response status (should be 200)
   - Check response data (should contain sites array)

3. **Verify RLS Policies**
   ```sql
   -- Check if you can read data directly
   SELECT COUNT(*) FROM collection_sites;
   SELECT COUNT(*) FROM municipalities;
   
   -- Check RLS policies
   SELECT * FROM pg_policies WHERE tablename = 'collection_sites';
   ```

4. **Temporarily Disable Performance Period Filter**
   In `components/map-view.tsx`, temporarily change:
   ```typescript
   const matchesPerformancePeriod = true; // Always true for debugging
   ```

5. **Check Data in Database**
   ```sql
   -- Verify data exists
   SELECT id, name, status, operator_type, active_dates 
   FROM collection_sites 
   LIMIT 10;
   
   -- Check if active_dates are in correct format
   SELECT name, active_dates::text 
   FROM collection_sites 
   WHERE active_dates IS NOT NULL 
   LIMIT 5;
   ```

## Quick Fixes Applied

1. ✅ Improved date parsing in `isSiteActiveInYear` function
2. ✅ Added comprehensive debug logging
3. ✅ Made date filter more lenient (includes sites without active_dates)
4. ✅ Added error handling for date parsing failures

## Next Steps

If data still doesn't show:
1. Check browser console for specific error messages
2. Verify RLS policies are correct
3. Test with a simple query: `SELECT * FROM collection_sites WHERE status = 'Active' LIMIT 1;`
4. Check if the issue is specific to certain filters (status, program, etc.)

