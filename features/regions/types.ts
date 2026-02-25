// Regions feature types

export interface Region {
  id: string
  name: string
  zone_id: string
  zone_name: string
}

export interface RegionsResponse {
  status: number
  message: string
  data: Region[]
}
