"use client"

import { useRef, useCallback, useEffect } from "react"

export function useAudioContext() {
  const audioContextRef = useRef<AudioContext | null>(null)
  const isClosingRef = useRef(false)

  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current || audioContextRef.current.state === "closed") {
      audioContextRef.current = new AudioContext()
      isClosingRef.current = false
    }
    return audioContextRef.current
  }, [])

  const closeAudioContext = useCallback(() => {
    if (audioContextRef.current && audioContextRef.current.state !== "closed" && !isClosingRef.current) {
      isClosingRef.current = true
      audioContextRef.current
        .close()
        .then(() => {
          audioContextRef.current = null
          isClosingRef.current = false
        })
        .catch((error) => {
          console.warn("Error closing AudioContext:", error)
          isClosingRef.current = false
        })
    }
  }, [])

  const isContextActive = useCallback(() => {
    return audioContextRef.current && audioContextRef.current.state !== "closed" && !isClosingRef.current
  }, [])

  useEffect(() => {
    return () => {
      closeAudioContext()
    }
  }, [closeAudioContext])

  return {
    getAudioContext,
    closeAudioContext,
    isContextActive,
  }
}

export function useAlertSound() {
  const playAlertSound = useCallback(() => {
    let alertAudioContext: AudioContext | null = null

    try {
      alertAudioContext = new AudioContext()
      const oscillator = alertAudioContext.createOscillator()
      const gainNode = alertAudioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(alertAudioContext.destination)

      oscillator.frequency.setValueAtTime(800, alertAudioContext.currentTime)
      oscillator.frequency.setValueAtTime(600, alertAudioContext.currentTime + 0.1)

      gainNode.gain.setValueAtTime(0.3, alertAudioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, alertAudioContext.currentTime + 0.2)

      oscillator.start(alertAudioContext.currentTime)
      oscillator.stop(alertAudioContext.currentTime + 0.2)

      // Cleanup após o som terminar
      setTimeout(() => {
        if (alertAudioContext && alertAudioContext.state !== "closed") {
          alertAudioContext.close().catch(() => {
            // Ignorar erros de fechamento
          })
        }
      }, 300)
    } catch (error) {
      console.warn("Error playing alert sound:", error)
      if (alertAudioContext && alertAudioContext.state !== "closed") {
        alertAudioContext.close().catch(() => {
          // Ignorar erros de fechamento
        })
      }
    }
  }, [])

  return { playAlertSound }
}
