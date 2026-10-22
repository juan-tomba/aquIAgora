"use client"

import { useState } from "react"
import { EnhancedTranscription } from "@/components/enhanced-transcription"
import { AccessibilityControls } from "@/components/accessibility-controls"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Brain, Mic, Eye, Volume2, Settings, Heart } from "lucide-react"

export default function TranscriptionApp() {
  const [accessibilitySettings, setAccessibilitySettings] = useState({
    fontSize: 16,
    lineHeight: 1.6,
    contrast: "normal",
    colorScheme: "auto",
    highlightKeywords: true,
    showTimestamps: true,
    autoScroll: true,
    pauseOnKeywords: false,
    readingSpeed: 1,
    focusMode: false,
    dyslexiaFont: false,
    reducedMotion: false,
  })

  const [showAccessibilityControls, setShowAccessibilityControls] = useState(false)
  const [transcriptionData, setTranscriptionData] = useState([])

  const handleSettingsChange = (newSettings: any) => {
    setAccessibilitySettings(newSettings)
  }

  const handleTranscriptionUpdate = (segments: any) => {
    setTranscriptionData(segments)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Brain className="h-8 w-8 text-primary" />
                <div>
                  <h1 className="text-2xl font-bold text-balance">aquIAgora</h1>
                  <p className="text-sm text-muted-foreground">Ferramenta inclusiva para transcrição de aulas</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="hidden sm:flex">
                <Heart className="h-3 w-3 mr-1" />
                Neurodivergente Friendly
              </Badge>
            </div>
          </div>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="container mx-auto px-4 py-8">
        {/* Seção de Boas-vindas */}
        {transcriptionData.length === 0 && (
          <div className="mb-8">
            <Card className="bg-gradient-to-r from-primary/5 to-secondary/5 border-primary/20">
              <CardHeader>
                <CardTitle className="text-xl text-balance flex items-center gap-2">
                  <Brain className="h-5 w-5 text-primary" />
                  Bem-vindo à sua ferramenta de transcrição inclusiva
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground leading-relaxed">
                  Esta ferramenta foi especialmente desenvolvida para pessoas neurodivergentes, oferecendo recursos de
                  acessibilidade avançados para facilitar o acompanhamento de aulas e palestras.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-3 p-3 bg-card rounded-lg border">
                    <Mic className="h-5 w-5 text-primary shrink-0" />
                    <div>
                      <h3 className="font-medium text-sm">Transcrição em Tempo Real</h3>
                      <p className="text-xs text-muted-foreground">Converte fala em texto instantaneamente</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-card rounded-lg border">
                    <Eye className="h-5 w-5 text-primary shrink-0" />
                    <div>
                      <h3 className="font-medium text-sm">Interface Adaptável</h3>
                      <p className="text-xs text-muted-foreground">Personalize cores, fontes e layout</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-card rounded-lg border">
                    <Volume2 className="h-5 w-5 text-primary shrink-0" />
                    <div>
                      <h3 className="font-medium text-sm">Destaque Inteligente</h3>
                      <p className="text-xs text-muted-foreground">Palavras-chave são automaticamente destacadas</p>
                    </div>
                  </div>
                </div>

                <div className="bg-muted/50 p-4 rounded-lg">
                  <h3 className="font-medium mb-2 flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    Dica: Configure sua experiência
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Clique no ícone de configurações no canto superior direito para personalizar a interface de acordo
                    com suas necessidades específicas. Temos perfis pré-configurados para TDAH, Dislexia e Autismo.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Componente Principal de Transcrição */}
        <EnhancedTranscription
          accessibilitySettings={accessibilitySettings}
          onTranscriptionUpdate={handleTranscriptionUpdate}
        />

        {/* Informações de Suporte */}
        <div className="mt-8">
          <Card>
            <CardContent className="p-6">
              <div className="text-center space-y-2">
                <h3 className="font-medium">Precisa de ajuda?</h3>
                <p className="text-sm text-muted-foreground">
                  Esta ferramenta funciona melhor no Chrome ou Edge. Certifique-se de permitir o acesso ao microfone
                  quando solicitado.
                </p>
                <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
                  <span>✓ Chrome</span>
                  <span>✓ Edge</span>
                  <span>✓ Safari (limitado)</span>
                  <span>✗ Firefox</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Controles de Acessibilidade */}
      <AccessibilityControls
        onSettingsChange={handleSettingsChange}
        isOpen={showAccessibilityControls}
        onToggle={() => setShowAccessibilityControls(!showAccessibilityControls)}
      />

      {/* Footer */}
      <footer className="border-t bg-card/30 mt-16">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center text-sm text-muted-foreground">
            <p>Desenvolvido com acessibilidade em mente para a comunidade neurodivergente</p>
            <p className="mt-1">Código aberto • Privacidade respeitada • Sem dados enviados para servidores</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
