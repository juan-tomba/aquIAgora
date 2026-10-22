"use client"

import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Mic,
  MicOff,
  Pause,
  Play,
  Download,
  Search,
  BookOpen,
  Clock,
  Star,
  AlertCircle,
  Volume2,
  VolumeX,
} from "lucide-react"
import { useAlertSound } from "@/hooks/use-audio-context"
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
  onstart: (() => void) | null
  onresult: ((event: SpeechRecognitionResultEvent) => void) | null
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null
  onend: (() => void) | null
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor
    webkitSpeechRecognition?: SpeechRecognitionConstructor
  }
}

interface TranscriptionSegment {
  id: string
  text: string
  timestamp: Date
  confidence: number
  isKeyword?: boolean
  isImportant?: boolean
  summary?: string
}

interface EnhancedTranscriptionProps {
  accessibilitySettings: any
  onTranscriptionUpdate?: (segments: TranscriptionSegment[]) => void
}

export function EnhancedTranscription({ accessibilitySettings, onTranscriptionUpdate }: EnhancedTranscriptionProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [transcriptionSegments, setTranscriptionSegments] = useState<TranscriptionSegment[]>([])
  const [currentText, setCurrentText] = useState("")
  const [continuousText, setContinuousText] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [customKeywords, setCustomKeywords] = useState("")
  const [notes, setNotes] = useState("")
  const [isSupported, setIsSupported] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isMuted, setIsMuted] = useState(false)

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null)
  const transcriptionRef = useRef<HTMLDivElement>(null)
  const sessionStartTimeRef = useRef<Date | null>(null)
  const isOperatingRef = useRef(false)
  const recordingRef = useRef(false)
  const pausedRef = useRef(false)
  const transcriptBufferRef = useRef("")
  const interimTextRef = useRef("")

  const { playAlertSound } = useAlertSound()

  const defaultKeywords = [
    "importante",
    "atenção",
    "lembrar",
    "prova",
    "exercício",
    "tarefa",
    "deadline",
    "prazo",
    "resumo",
    "conclusão",
    "pergunta",
    "dúvida",
    "exemplo",
    "fórmula",
    "definição",
    "conceito",
    "teoria",
  ]

  const allKeywords = useMemo(
    () => [
      ...defaultKeywords,
      ...customKeywords
        .split(",")
        .map((k) => k.trim())
        .filter((k) => k.length > 0),
    ],
    [customKeywords],
  )

  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      if (SpeechRecognition) {
        setIsSupported(true)
        console.log("[v0] Speech Recognition API is supported")
      } else {
        setError("Seu navegador não suporta reconhecimento de voz. Tente usar Chrome ou Edge.")
        console.log("[v0] Speech Recognition API not supported")
      }
    }

    return () => {
      cleanup()
    }
  }, [])

  const cleanup = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop()
        console.log("[v0] Recognition stopped and cleaned up")
      } catch (error) {
        console.log("[v0] Error stopping recognition:", error)
      }
      recognitionRef.current = null
    }
  }, [])

  const setupSpeechRecognition = useCallback(() => {
    if (!isSupported) return null

    const SpeechRecognition = (window.SpeechRecognition || window.webkitSpeechRecognition)!
    const recognition = new SpeechRecognition()

    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = "pt-BR"
    recognition.maxAlternatives = 1

    // Configurações específicas para aumentar sensibilidade
    try {
      // Configurações experimentais para maior sensibilidade (se disponíveis)
      if ("serviceURI" in recognition) {
        ;(recognition as any).serviceURI = null // Remove limitações de serviço
      }
      if ("audioTrack" in recognition) {
        ;(recognition as any).audioTrack = true // Força uso de track de áudio
      }
      if ("sensitivity" in recognition) {
        ;(recognition as any).sensitivity = 1.0 // Máxima sensibilidade (experimental)
      }
    } catch (e) {
      console.log("[v0] Advanced sensitivity settings not available")
    }

    recognition.onstart = () => {
      console.log("[v0] Speech recognition started")
      setError(null)
    }

    recognition.onresult = (event: SpeechRecognitionResultEvent) => {
      let interimTranscript = ""
      let finalTranscript = ""

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        const transcript = result[0].transcript
        const confidence = result[0].confidence || 0.5

        // Aceita resultados com confiança mais baixa para maior sensibilidade
        if (result.isFinal) {
          finalTranscript += transcript + " "
          console.log("[v0] Final result:", transcript, "confidence:", confidence)
        } else if (!result.isFinal) {
          interimTranscript += transcript
          console.log("[v0] Interim result:", transcript)
        }
      }

      if (interimTranscript) {
        interimTextRef.current = interimTranscript
        setCurrentText(interimTranscript)
        setContinuousText(`${transcriptBufferRef.current} ${interimTranscript}`.trim())
      }

      if (finalTranscript.trim()) {
        transcriptBufferRef.current = `${transcriptBufferRef.current} ${finalTranscript}`.trim()
        interimTextRef.current = ""
        setContinuousText(transcriptBufferRef.current)
        setCurrentText("")

        const hasKeywords = allKeywords.some((keyword) =>
          finalTranscript.toLowerCase().includes(keyword.toLowerCase()),
        )
        if (accessibilitySettings?.pauseOnKeywords && hasKeywords) {
          pauseRecording()
          if (!isMuted) playAlertSound()
        }
      }
    }

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error("[v0] Speech recognition error:", event.error)
      if (event.error === "no-speech" || event.error === "audio-capture") {
        // Não mostra erro para no-speech ou problemas de captura, apenas continua
        console.log("[v0] Continuing despite audio issue:", event.error)
        return
      }
      if (event.error === "network") {
        // Tenta continuar mesmo com problemas de rede
        console.log("[v0] Network issue, attempting to continue")
        return
      }
      setError(`Erro no reconhecimento de voz: ${event.error}`)
    }

    recognition.onend = () => {
      console.log("[v0] Speech recognition ended")

      const textToSave = (transcriptBufferRef.current || continuousText || currentText).trim()
      if (textToSave) {
        console.log("[v0] Saving text on recognition end:", textToSave)

        const hasKeywords = allKeywords.some((keyword) => textToSave.toLowerCase().includes(keyword.toLowerCase()))

        const newSegment: TranscriptionSegment = {
          id: Date.now().toString(),
          text: textToSave,
          timestamp: sessionStartTimeRef.current || new Date(),
          confidence: 0.85,
          isKeyword: hasKeywords,
          isImportant: hasKeywords && accessibilitySettings?.pauseOnKeywords,
        }

        setTranscriptionSegments((prev) => {
          const updated = [...prev, newSegment]
          if (onTranscriptionUpdate) {
            setTimeout(() => onTranscriptionUpdate(updated), 0)
          }
          return updated
        })

        transcriptBufferRef.current = ""
        setContinuousText("")
        setCurrentText("")
        console.log("[v0] Text successfully saved to segments")
      }

      if (recordingRef.current && !pausedRef.current && !isOperatingRef.current) {
        window.setTimeout(() => {
          if (!recordingRef.current || pausedRef.current || !recognitionRef.current) return
          try {
            recognitionRef.current.start()
          } catch {
            // O navegador pode estar iniciando novamente; o próximo evento onend tenta outra vez.
          }
        }, 150)
      }
    }

    return recognition
  }, [isSupported, isRecording, isPaused, allKeywords, accessibilitySettings, isMuted, playAlertSound])

  const startRecording = useCallback(async () => {
    if (!isSupported || isOperatingRef.current) return

    console.log("[v0] Starting recording...")
    isOperatingRef.current = true
    setError(null)
    recordingRef.current = true
    pausedRef.current = false
    setIsRecording(true)
    setIsPaused(false)
    transcriptBufferRef.current = ""
    interimTextRef.current = ""
    setContinuousText("")
    setCurrentText("")
    sessionStartTimeRef.current = new Date()

    try {
      recognitionRef.current = setupSpeechRecognition()
      if (recognitionRef.current) {
        recognitionRef.current.start()
      }
    } catch (error) {
      console.error("[v0] Error starting recording:", error)
      setError("Erro ao iniciar reconhecimento de voz")
      setIsRecording(false)
    }

    isOperatingRef.current = false
  }, [isSupported, setupSpeechRecognition])

  const stopRecording = useCallback(() => {
    if (isOperatingRef.current) return

    console.log("[v0] Stopping recording...")
    isOperatingRef.current = true
    recordingRef.current = false
    pausedRef.current = false
    setIsRecording(false)
    setIsPaused(false)
    setCurrentText("")
    interimTextRef.current = ""

    const textToSave = (transcriptBufferRef.current || continuousText).trim()
    if (textToSave) {
      const hasKeywords = allKeywords.some((keyword) => textToSave.toLowerCase().includes(keyword.toLowerCase()))

      const newSegment: TranscriptionSegment = {
        id: Date.now().toString(),
        text: textToSave,
        timestamp: sessionStartTimeRef.current || new Date(),
        confidence: 0.95,
        isKeyword: hasKeywords,
        isImportant: hasKeywords && accessibilitySettings?.pauseOnKeywords,
      }

      setTranscriptionSegments((prev) => {
        const updated = [...prev, newSegment]
        if (onTranscriptionUpdate) {
          setTimeout(() => onTranscriptionUpdate(updated), 0)
        }
        return updated
      })

      transcriptBufferRef.current = ""
      setContinuousText("")
    }

    cleanup()
    sessionStartTimeRef.current = null

    setTimeout(() => {
      isOperatingRef.current = false
    }, 200)
  }, [continuousText, allKeywords, accessibilitySettings, onTranscriptionUpdate, cleanup])

  const pauseRecording = useCallback(() => {
    if (isOperatingRef.current) return

    console.log("[v0] Pausing recording...")
    isOperatingRef.current = true
    pausedRef.current = true
    setIsPaused(true)
    setCurrentText("")
    interimTextRef.current = ""

    const textToSave = (transcriptBufferRef.current || continuousText).trim()
    if (textToSave) {
      const hasKeywords = allKeywords.some((keyword) => textToSave.toLowerCase().includes(keyword.toLowerCase()))

      const newSegment: TranscriptionSegment = {
        id: Date.now().toString(),
        text: textToSave,
        timestamp: sessionStartTimeRef.current || new Date(),
        confidence: 0.9,
        isKeyword: hasKeywords,
        isImportant: hasKeywords && accessibilitySettings?.pauseOnKeywords,
      }

      setTranscriptionSegments((prev) => {
        const updated = [...prev, newSegment]
        if (onTranscriptionUpdate) {
          setTimeout(() => onTranscriptionUpdate(updated), 0)
        }
        return updated
      })

      transcriptBufferRef.current = ""
      setContinuousText("")
    }

    cleanup()

    setTimeout(() => {
      isOperatingRef.current = false
    }, 200)
  }, [continuousText, allKeywords, accessibilitySettings, onTranscriptionUpdate, cleanup])

  const resumeRecording = useCallback(async () => {
    if (!isRecording || isOperatingRef.current) return

    console.log("[v0] Resuming recording...")
    isOperatingRef.current = true
    pausedRef.current = false
    setIsPaused(false)
    sessionStartTimeRef.current = new Date()

    try {
      recognitionRef.current = setupSpeechRecognition()
      if (recognitionRef.current) {
        recognitionRef.current.start()
      }
    } catch (error) {
      console.error("[v0] Error resuming recording:", error)
      setError("Erro ao retomar reconhecimento de voz")
    }

    isOperatingRef.current = false
  }, [isRecording, setupSpeechRecognition])

  const highlightText = (text: string) => {
    if (!accessibilitySettings?.highlightKeywords) return text

    let highlightedText = text

    if (searchTerm) {
      const regex = new RegExp(`(${searchTerm})`, "gi")
      highlightedText = highlightedText.replace(regex, '<mark class="bg-yellow-200 dark:bg-yellow-800">$1</mark>')
    }

    defaultKeywords.forEach((keyword) => {
      const regex = new RegExp(`\\b(${keyword})\\b`, "gi")
      highlightedText = highlightedText.replace(regex, '<span class="text-highlight font-semibold">$1</span>')
    })

    return highlightedText
  }

  const filteredSegments = transcriptionSegments.filter(
    (segment) => !searchTerm || segment.text.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const generateSummary = () => {
    if (transcriptionSegments.length === 0) {
      setNotes((prev) => prev + "\n\nResumo Automático:\nNenhum conteúdo transcrito para resumir.")
      return
    }

    const fullText = transcriptionSegments.map((segment) => segment.text).join(" ")

    const sentences = fullText.split(/[.!?]+/).filter((s) => s.trim().length > 10)
    const keywordSegments = transcriptionSegments.filter((segment) => segment.isKeyword)
    const totalSegments = transcriptionSegments.length
    const duration =
      transcriptionSegments.length > 0
        ? Math.round(
            (transcriptionSegments[transcriptionSegments.length - 1].timestamp.getTime() -
              transcriptionSegments[0].timestamp.getTime()) /
              60000,
          )
        : 0

    const themes = new Map<string, number>()
    const commonWords = ["importante", "atenção", "exemplo", "conceito", "teoria", "prova", "exercício", "fórmula"]

    sentences.forEach((sentence) => {
      commonWords.forEach((word) => {
        if (sentence.toLowerCase().includes(word)) {
          themes.set(word, (themes.get(word) || 0) + 1)
        }
      })
    })

    const relevantSentences = sentences
      .filter((sentence) => sentence.trim().length > 20)
      .sort((a, b) => {
        const scoreA = commonWords.reduce((score, word) => score + (a.toLowerCase().includes(word) ? 1 : 0), 0)
        const scoreB = commonWords.reduce((score, word) => score + (b.toLowerCase().includes(word) ? 1 : 0), 0)
        return scoreB - scoreA
      })
      .slice(0, 5)

    let summary = `\n\nResumo Inteligente da Aula:\n`
    summary += `📊 Duração: ${duration} minutos | ${totalSegments} segmentos capturados\n\n`

    if (themes.size > 0) {
      summary += `🎯 Temas principais identificados:\n`
      Array.from(themes.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .forEach(([theme, count]) => {
          summary += `• ${theme.charAt(0).toUpperCase() + theme.slice(1)} (mencionado ${count}x)\n`
        })
      summary += `\n`
    }

    if (keywordSegments.length > 0) {
      summary += `⭐ Pontos-chave destacados:\n`
      keywordSegments.slice(0, 3).forEach((segment, index) => {
        const shortText = segment.text.length > 80 ? segment.text.substring(0, 80) + "..." : segment.text
        summary += `${index + 1}. ${shortText}\n`
      })
      summary += `\n`
    }

    if (relevantSentences.length > 0) {
      summary += `📝 Principais conceitos abordados:\n`
      relevantSentences.forEach((sentence, index) => {
        const cleanSentence = sentence.trim()
        if (cleanSentence) {
          summary += `• ${cleanSentence}\n`
        }
      })
    }

    setNotes((prev) => prev + summary)
  }

  const exportData = () => {
    const content = {
      transcription: transcriptionSegments.map((segment) => ({
        time: segment.timestamp.toLocaleTimeString(),
        text: segment.text,
        isKeyword: segment.isKeyword,
      })),
      notes: notes,
      keywords: allKeywords,
      summary: transcriptionSegments.filter((s) => s.isKeyword).map((s) => s.text),
    }

    const blob = new Blob([JSON.stringify(content, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `aula-transcricao-${new Date().toISOString().split("T")[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  useEffect(() => {
    if (accessibilitySettings?.autoScroll && transcriptionRef.current) {
      transcriptionRef.current.scrollTop = transcriptionRef.current.scrollHeight
    }
  }, [transcriptionSegments, currentText, accessibilitySettings])

  if (!isSupported) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            <Mic className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg mb-2">Reconhecimento de voz não suportado</p>
            <p className="text-sm">Para usar a transcrição, acesse com Chrome, Edge ou outro navegador compatível.</p>
          </div>
          <div className="mt-6 border-t pt-6">
            <Label htmlFor="unsupported-notes">Notas da Aula</Label>
            <Textarea
              id="unsupported-notes"
              aria-label="Notas da aula"
              placeholder="Escreva suas anotações aqui..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="mt-2 min-h-[220px] resize-y focus-visible"
            />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-4">
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl font-bold text-balance">Transcrição Inteligente para Aulas</CardTitle>
            <div className="flex items-center gap-2">
              {isRecording && (
                <Badge variant="secondary" className="animate-pulse">
                  {isPaused ? "Pausado" : "Gravando"}
                </Badge>
              )}
              <Button variant="outline" size="sm" onClick={() => setIsMuted(!isMuted)} className="focus-visible">
                {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={exportData}
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
            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-destructive" />
              <p className="text-destructive text-sm">{error}</p>
            </div>
          )}

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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Buscar na Transcrição</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Digite para buscar..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 focus-visible"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="keywords">Palavras-chave Personalizadas</Label>
              <Input
                id="keywords"
                placeholder="palavra1, palavra2, palavra3..."
                value={customKeywords}
                onChange={(e) => setCustomKeywords(e.target.value)}
                className="focus-visible"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Transcrição ao Vivo
                {filteredSegments.length !== transcriptionSegments.length && (
                  <Badge variant="outline">
                    {filteredSegments.length} de {transcriptionSegments.length}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div
                ref={transcriptionRef}
                className="min-h-[500px] max-h-[600px] overflow-y-auto p-4 bg-card border rounded-lg space-y-4"
                role="log"
                aria-live="polite"
                aria-label="Transcrição em tempo real"
                style={{
                  fontSize: `${accessibilitySettings?.fontSize || 16}px`,
                  lineHeight: accessibilitySettings?.lineHeight || 1.6,
                }}
              >
                {filteredSegments.length === 0 && !continuousText && !currentText && (
                  <div className="text-center text-muted-foreground py-12">
                    <p className="text-lg mb-2">Pronto para transcrever</p>
                    <p className="text-sm">
                      Clique em "Iniciar Transcrição" e comece a falar para ver o texto aparecer aqui.
                    </p>
                  </div>
                )}

                {filteredSegments.map((segment, index) => (
                  <div key={segment.id} className="space-y-2">
                    <div className={`flex items-start gap-3 ${segment.isKeyword ? "bg-accent/10 p-2 rounded" : ""}`}>
                      {accessibilitySettings?.showTimestamps && (
                        <Badge variant="outline" className="text-xs shrink-0 mt-1">
                          <Clock className="h-3 w-3 mr-1" />
                          {segment.timestamp.toLocaleTimeString()}
                        </Badge>
                      )}
                      {segment.isKeyword && <Star className="h-4 w-4 text-accent shrink-0 mt-1" />}
                      <p
                        className="text-base leading-relaxed flex-1"
                        dangerouslySetInnerHTML={{
                          __html: highlightText(segment.text),
                        }}
                      />
                    </div>
                  </div>
                ))}

                {continuousText && (
                  <div className="flex items-start gap-3 bg-primary/5 p-3 rounded-lg">
                    <Badge variant="secondary" className="text-xs shrink-0 mt-1">
                      Sessão Atual
                    </Badge>
                    <p
                      className="text-base leading-relaxed flex-1"
                      dangerouslySetInnerHTML={{
                        __html: highlightText(continuousText),
                      }}
                    />
                  </div>
                )}

                {currentText && (
                  <div className="flex items-start gap-3 opacity-70">
                    <Badge variant="secondary" className="text-xs shrink-0 mt-1">
                      Ouvindo...
                    </Badge>
                    <p className="text-base leading-relaxed flex-1 italic">{currentText}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Estatísticas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Segmentos:</span>
                <span className="font-medium">{transcriptionSegments.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Palavras-chave:</span>
                <span className="font-medium">{transcriptionSegments.filter((s) => s.isKeyword).length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Duração:</span>
                <span className="font-medium">
                  {transcriptionSegments.length > 0 &&
                    Math.round((Date.now() - transcriptionSegments[0].timestamp.getTime()) / 60000)}{" "}
                  min
                </span>
              </div>
              <Button
                onClick={generateSummary}
                variant="outline"
                size="sm"
                className="w-full focus-visible bg-transparent"
                disabled={transcriptionSegments.length === 0}
              >
                Gerar Resumo
              </Button>
            </CardContent>
          </Card>

        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Notas da Aula</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            aria-label="Notas da aula"
            placeholder="Escreva suas anotações aqui..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="min-h-[220px] resize-y focus-visible"
          />
        </CardContent>
      </Card>
    </div>
  )
}
