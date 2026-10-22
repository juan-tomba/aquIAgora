"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Mic, MicOff, Pause, Play, Download } from "lucide-react"
interface SpeechRecognitionResultEvent extends Event {
  resultIndex: number
  results: SpeechRecognitionResultList
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string
}

interface SpeechRecognitionInstance {
  continuous: boolean
  interimResults: boolean
  lang: string
  maxAlternatives: number
  start(): void
  stop(): void
  onresult: ((event: SpeechRecognitionResultEvent) => void) | null
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null
  onend: (() => void) | null
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance

interface TranscriptionSegment {
  id: string
  text: string
  timestamp: Date
  confidence: number
  isKeyword?: boolean
}

interface LiveTranscriptionProps {
  onTranscriptionUpdate?: (segments: TranscriptionSegment[]) => void
}

export function LiveTranscription({ onTranscriptionUpdate }: LiveTranscriptionProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [transcriptionSegments, setTranscriptionSegments] = useState<TranscriptionSegment[]>([])
  const [currentText, setCurrentText] = useState("")
  const [isSupported, setIsSupported] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null)
  const transcriptionRef = useRef<HTMLDivElement>(null)

  // Palavras-chave para destacar (podem ser personalizadas)
  const keywords = ["importante", "atenção", "lembrar", "prova", "exercício", "tarefa", "deadline", "prazo"]

  useEffect(() => {
    // Verificar se o navegador suporta Web Speech API
    const SpeechRecognition =
      typeof window !== "undefined" && (window.SpeechRecognition || window.webkitSpeechRecognition)

    if (SpeechRecognition) {
      setIsSupported(true)
      recognitionRef.current = new SpeechRecognition()

      const recognition = recognitionRef.current
      recognition.continuous = true
      recognition.interimResults = true
      recognition.lang = "pt-BR"
      recognition.maxAlternatives = 1

      recognition.onresult = (event: SpeechRecognitionResultEvent) => {
        let interimTranscript = ""
        let finalTranscript = ""

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript
          if (event.results[i].isFinal) {
            finalTranscript += transcript
          } else {
            interimTranscript += transcript
          }
        }

        if (finalTranscript) {
          const newSegment: TranscriptionSegment = {
            id: Date.now().toString(),
            text: finalTranscript.trim(),
            timestamp: new Date(),
            confidence: event.results[event.results.length - 1][0].confidence || 0.8,
          }

          setTranscriptionSegments((prev) => {
            const updated = [...prev, newSegment]
            onTranscriptionUpdate?.(updated)
            return updated
          })
          setCurrentText("")
        } else {
          setCurrentText(interimTranscript)
        }
      }

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error("Speech recognition error:", event.error)
        setError(`Erro na transcrição: ${event.error}`)
        setIsRecording(false)
      }

      recognition.onend = () => {
        if (isRecording && !isPaused) {
          // Reiniciar automaticamente se ainda estiver gravando
          recognition.start()
        }
      }
    } else {
      setError("Seu navegador não suporta reconhecimento de voz. Tente usar Chrome ou Edge.")
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
    }
  }, [isRecording, isPaused, onTranscriptionUpdate])

  const startRecording = useCallback(() => {
    if (!recognitionRef.current || !isSupported) return

    setError(null)
    setIsRecording(true)
    setIsPaused(false)
    recognitionRef.current.start()
  }, [isSupported])

  const stopRecording = useCallback(() => {
    if (!recognitionRef.current) return

    setIsRecording(false)
    setIsPaused(false)
    recognitionRef.current.stop()
    setCurrentText("")
  }, [])

  const pauseRecording = useCallback(() => {
    if (!recognitionRef.current) return

    setIsPaused(true)
    recognitionRef.current.stop()
    setCurrentText("")
  }, [])

  const resumeRecording = useCallback(() => {
    if (!recognitionRef.current || !isRecording) return

    setIsPaused(false)
    recognitionRef.current.start()
  }, [isRecording])

  const highlightKeywords = (text: string) => {
    let highlightedText = text
    keywords.forEach((keyword) => {
      const regex = new RegExp(`\\b${keyword}\\b`, "gi")
      highlightedText = highlightedText.replace(regex, `<span class="text-highlight">${keyword}</span>`)
    })
    return highlightedText
  }

  const exportTranscription = () => {
    const content = transcriptionSegments
      .map((segment) => `[${segment.timestamp.toLocaleTimeString()}] ${segment.text}`)
      .join("\n\n")

    const blob = new Blob([content], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `transcricao-${new Date().toISOString().split("T")[0]}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Auto-scroll para o final da transcrição
  useEffect(() => {
    if (transcriptionRef.current) {
      transcriptionRef.current.scrollTop = transcriptionRef.current.scrollHeight
    }
  }, [transcriptionSegments, currentText])

  if (!isSupported) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            <Mic className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg mb-2">Reconhecimento de voz não suportado</p>
            <p className="text-sm">Para usar esta ferramenta, acesse com Chrome, Edge ou outro navegador compatível.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl font-bold text-balance">Transcrição ao Vivo</CardTitle>
          <div className="flex items-center gap-2">
            {isRecording && (
              <Badge variant="secondary" className="animate-pulse">
                {isPaused ? "Pausado" : "Gravando"}
              </Badge>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={exportTranscription}
              disabled={transcriptionSegments.length === 0}
              className="focus-visible bg-transparent"
            >
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {error && (
          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
            <p className="text-destructive text-sm">{error}</p>
          </div>
        )}

        {/* Controles de gravação */}
        <div className="flex items-center justify-center gap-4 p-4 bg-muted/50 rounded-lg">
          {!isRecording ? (
            <Button onClick={startRecording} size="lg" className="focus-visible" aria-label="Iniciar transcrição">
              <Mic className="h-5 w-5 mr-2" />
              Iniciar Transcrição
            </Button>
          ) : (
            <div className="flex items-center gap-3">
              <Button
                onClick={isPaused ? resumeRecording : pauseRecording}
                variant="outline"
                size="lg"
                className="focus-visible bg-transparent"
                aria-label={isPaused ? "Retomar transcrição" : "Pausar transcrição"}
              >
                {isPaused ? (
                  <>
                    <Play className="h-5 w-5 mr-2" />
                    Retomar
                  </>
                ) : (
                  <>
                    <Pause className="h-5 w-5 mr-2" />
                    Pausar
                  </>
                )}
              </Button>
              <Button
                onClick={stopRecording}
                variant="destructive"
                size="lg"
                className="focus-visible"
                aria-label="Parar transcrição"
              >
                <MicOff className="h-5 w-5 mr-2" />
                Parar
              </Button>
            </div>
          )}
        </div>

        {/* Área de transcrição */}
        <div
          ref={transcriptionRef}
          className="min-h-[400px] max-h-[600px] overflow-y-auto p-6 bg-card border rounded-lg space-y-4"
          role="log"
          aria-live="polite"
          aria-label="Transcrição em tempo real"
        >
          {transcriptionSegments.length === 0 && !currentText && (
            <div className="text-center text-muted-foreground py-12">
              <p className="text-lg mb-2">Pronto para transcrever</p>
              <p className="text-sm">
                Clique em "Iniciar Transcrição" e comece a falar para ver o texto aparecer aqui.
              </p>
            </div>
          )}

          {transcriptionSegments.map((segment, index) => (
            <div key={segment.id} className="space-y-2">
              {index > 0 && index % 5 === 0 && (
                <div className="pause-indicator">
                  <p className="text-sm text-muted-foreground italic">Pausa natural na conversa</p>
                </div>
              )}
              <div className="flex items-start gap-3">
                <Badge variant="outline" className="text-xs shrink-0 mt-1">
                  {segment.timestamp.toLocaleTimeString()}
                </Badge>
                <p
                  className="text-base leading-relaxed flex-1"
                  dangerouslySetInnerHTML={{
                    __html: highlightKeywords(segment.text),
                  }}
                />
              </div>
            </div>
          ))}

          {currentText && (
            <div className="flex items-start gap-3 opacity-70">
              <Badge variant="secondary" className="text-xs shrink-0 mt-1">
                Agora
              </Badge>
              <p className="text-base leading-relaxed flex-1 italic">{currentText}</p>
            </div>
          )}
        </div>

        {/* Estatísticas */}
        {transcriptionSegments.length > 0 && (
          <div className="flex items-center justify-between text-sm text-muted-foreground p-4 bg-muted/30 rounded-lg">
            <span>{transcriptionSegments.length} segmentos transcritos</span>
            <span>
              Palavras destacadas:{" "}
              {transcriptionSegments.reduce((count, segment) => {
                return (
                  count +
                  keywords.filter((keyword) => segment.text.toLowerCase().includes(keyword.toLowerCase())).length
                )
              }, 0)}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
