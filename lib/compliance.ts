import type { Municipality, CollectionSite, ComplianceCalculation } from "./supabase"
import * as api from "./api"

export interface ComplianceResult {
  municipality: string
  municipalityId: string
  program: string
  required: number
  actual: number
  shortfall: number
  excess: number
  complianceRate: number
  status: "compliant" | "shortfall" | "excess"
}

/**
 * Calculate compliance requirements based on regulatory logic
 * 
 * This function implements the site requirement formulas:
 * - Paint: 1 site per 40,000 population (5K-500K), then 1 per 150,000 above 500K
 * - Solvents/Pesticides: 1 site per 250,000 population (10K-500K), then 1 per 300,000 above 500K
 * - Lighting: 1 site per 15,000 population (1K-500K), then 1 per 50,000 above 500K
 * 
 * Backend API: POST /api/v1/compliance/calculate/
 * Postman: Compliance > Calculate Requirements
 */
export function calculateRequirements(population: number, program: string): number {
  switch (program) {
    case "Paint":
      if (population >= 5000 && population <= 500000) {
        return Math.ceil(population / 40000)
      } else if (population > 500000) {
        return 13 + Math.ceil((population - 500000) / 150000)
      }
      return population >= 1000 ? 1 : 0

    case "Solvents":
    case "Pesticides":
      if (population >= 10000 && population <= 500000) {
        return Math.ceil(population / 250000)
      } else if (population > 500000) {
        return 2 + Math.ceil((population - 500000) / 300000)
      }
      return population >= 1000 ? 1 : 0

    case "Lighting":
      if (population >= 1000 && population <= 500000) {
        return Math.ceil(population / 15000)
      } else if (population > 500000) {
        return 34 + Math.ceil((population - 500000) / 50000)
      }
      return 0

    default:
      return 0
  }
}

/**
 * Calculate new required sites after applying offset percentage
 * Rounds UP, minimum 1 site if any are required
 * 
 * Backend API: POST /api/v1/compliance/calculate/
 * Postman: Compliance > Calculate Requirements (with offset_percentage)
 */
export function calculateNewRequired(required: number, offsetPercentage: number): number {
  if (required === 0) return 0
  const reduction = required * (offsetPercentage / 100)
  const newRequired = Math.ceil(required - reduction)
  return Math.max(1, newRequired) // Minimum 1 site required
}

/**
 * Calculate compliance for all municipalities and programs
 * 
 * Backend API: GET /api/v1/compliance/analyze/
 * Postman: Compliance > Analyze Compliance (All)
 */
export async function calculateCompliance(
  municipalities: Municipality[],
  sites: CollectionSite[],
  offsetPercentage?: number,
): Promise<ComplianceResult[]> {
  console.log("[compliance] Calculating compliance for", municipalities.length, "municipalities and", sites.length, "sites")

  // Try backend API first
  try {
    const response = await api.analyzeCompliance({
      offset_percentage: offsetPercentage,
    })
    
    if (response.data && response.data.results) {
      console.log("[compliance] Got compliance data from API")
      return response.data.results.map((r: any) => ({
        municipality: r.municipality_name || r.municipality,
        municipalityId: r.municipality_id || r.municipality,
        program: r.program,
        required: r.required_sites || r.required,
        actual: r.actual_sites || r.actual,
        shortfall: r.shortfall,
        excess: r.excess,
        complianceRate: r.compliance_rate || r.complianceRate,
        status: r.shortfall > 0 ? "shortfall" : r.excess > 0 ? "excess" : "compliant",
      }))
    }
  } catch (error) {
    console.error("[compliance] API error, using local calculation:", error)
  }

  // Local calculation fallback
  const results: ComplianceResult[] = []
  const programs = ["Paint", "Lighting", "Solvents", "Pesticides"]

  for (const municipality of municipalities) {
    for (const program of programs) {
      let required = calculateRequirements(municipality.population, program)
      
      // Apply offset if provided
      if (offsetPercentage && offsetPercentage > 0) {
        required = calculateNewRequired(required, offsetPercentage)
      }
      
      const municipalitySites = sites.filter(
        (site) =>
          site.municipality_id === municipality.id && site.programs.includes(program) && site.status === "Active",
      )

      const actual = municipalitySites.length
      const shortfall = Math.max(0, required - actual)
      const excess = Math.max(0, actual - required)
      const complianceRate = required > 0 ? (actual / required) * 100 : 100

      let status: "compliant" | "shortfall" | "excess" = "compliant"
      if (shortfall > 0) status = "shortfall"
      else if (excess > 0) status = "excess"

      results.push({
        municipality: municipality.name,
        municipalityId: municipality.id,
        program,
        required,
        actual,
        shortfall,
        excess,
        complianceRate,
        status,
      })
    }
  }

  console.log("[compliance] Compliance calculation complete:", results.length, "results")
  return results
}

/**
 * Save a compliance calculation to the database
 * 
 * Backend API: POST /api/v1/compliance/analyze/
 * Postman: Compliance > Save Compliance Calculation
 */
export async function saveComplianceCalculation(
  calculation: Omit<ComplianceCalculation, "id" | "calculation_date">,
): Promise<ComplianceCalculation> {
  console.log("[compliance] Saving compliance calculation")

  const response = await api.saveComplianceCalculation({
    municipality: calculation.municipality_id,
    program: calculation.program,
    offset_percentage: 0,
  })
  
  if (response.data) {
    console.log("[compliance] Compliance calculation saved via API")
    return {
      id: response.data.id,
      municipality_id: response.data.municipality,
      program: response.data.program,
      required_sites: response.data.required_sites,
      actual_sites: response.data.actual_sites,
      shortfall: response.data.shortfall,
      excess: response.data.excess,
      compliance_rate: response.data.compliance_rate,
      calculation_date: response.data.calculation_date,
      created_by: response.data.created_by,
    }
  }
  
  if (response.error) {
    throw new Error(response.error)
  }

  // Fallback: return mock calculation
  const mockCalculation: ComplianceCalculation = {
    ...calculation,
    id: crypto.randomUUID(),
    calculation_date: new Date().toISOString(),
  }

  console.log("[compliance] Compliance calculation saved (mock)")
  return mockCalculation
}

/**
 * Get compliance calculation history
 * 
 * Backend API: GET /api/v1/compliance/calculations/
 * Postman: Compliance > List Compliance Calculations
 */
export async function getComplianceHistory(
  municipalityId?: string,
  program?: string,
): Promise<ComplianceCalculation[]> {
  try {
    console.log("[compliance] Fetching compliance history")

    const response = await api.getComplianceCalculations()
    if (response.data) {
      return response.data.results.map((calc: api.ApiComplianceCalculation) => ({
        id: calc.id,
        municipality_id: calc.municipality,
        program: calc.program,
        required_sites: calc.required_sites,
        actual_sites: calc.actual_sites,
        shortfall: calc.shortfall,
        excess: calc.excess,
        compliance_rate: calc.compliance_rate,
        calculation_date: calc.calculation_date,
        created_by: calc.created_by,
      }))
    }

    return []
  } catch (error) {
    console.error("[compliance] Error fetching compliance history:", error)
    return []
  }
}

/**
 * Get regulatory rules
 * 
 * Backend API: GET /api/v1/compliance/rules/
 * Postman: Compliance > List Regulatory Rules
 */
export async function getRegulatoryRules(filters?: {
  program?: string
  category?: string
}): Promise<any[]> {
  try {
    const response = await api.getRegulatoryRules(filters)
    if (response.data) {
      return response.data.results
    }
    return []
  } catch (error) {
    console.error("[compliance] Error fetching regulatory rules:", error)
    return []
  }
}

/**
 * Calculate requirements using backend API
 * 
 * Backend API: POST /api/v1/compliance/calculate/
 * Postman: Compliance > Calculate Requirements
 */
export async function calculateRequirementsFromAPI(
  population: number,
  program: string,
  offsetPercentage?: number,
): Promise<{ required: number; adjusted_required: number } | null> {
  try {
    const response = await api.calculateRequirements({
      population,
      program,
      offset_percentage: offsetPercentage,
    })
    if (response.data) {
      return response.data
    }
    
    // Fallback to local calculation
    const required = calculateRequirements(population, program)
    const adjusted = offsetPercentage ? calculateNewRequired(required, offsetPercentage) : required
    return { required, adjusted_required: adjusted }
  } catch (error) {
    console.error("[compliance] Error calculating requirements:", error)
    return null
  }
}
