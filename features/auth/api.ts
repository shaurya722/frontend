import axiosInstance from '@/lib/axios-instance'

export interface LogoutPayload {
  refresh: string
}

export const logout = async (payload: LogoutPayload): Promise<void> => {
  await axiosInstance.post('/api/auth/logout/', payload)
}
