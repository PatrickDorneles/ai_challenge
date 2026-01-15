import axios from "axios"

export function toErrorString(err: unknown) {
  if (axios.isAxiosError(err)) {
    const status = err.response?.status
    const msg = err.message
    return status ? `AxiosError status=${status} message=${msg}` : `AxiosError message=${msg}`
  }
  if (err instanceof Error) return `${err.name}: ${err.message}`
  try {
    return JSON.stringify(err)
  } catch {
    return String(err)
  }
}
