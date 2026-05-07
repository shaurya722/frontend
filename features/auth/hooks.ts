import { useMutation } from '@tanstack/react-query'
import { logout, type LogoutPayload } from './api'

export const useLogout = () => {
  return useMutation({
    mutationFn: (payload: LogoutPayload) => logout(payload),
  })
}
