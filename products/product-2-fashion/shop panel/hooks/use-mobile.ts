"use client"

import { useEffect, useState } from "react"

const MOBILE_BREAKPOINT = 500

export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState<boolean>(false)

  useEffect(() => {
    const mediaQuery = globalThis.matchMedia(
      `(max-width: ${MOBILE_BREAKPOINT - 1}px)`
    )

    const update = () => {
      setIsMobile(mediaQuery.matches)
    }

    update()

    mediaQuery.addEventListener("change", update)

    return () => {
      mediaQuery.removeEventListener("change", update)
    }
  }, [])

  return isMobile
}
