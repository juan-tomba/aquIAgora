"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Settings, Type, Palette, Volume2, Eye, Brain, RotateCcw } from "lucide-react"

interface AccessibilitySettings {
  fontSize: number
  lineHeight: number
  contrast: "normal" | "high" | "low"
  colorScheme: "light" | "dark" | "auto"
  highlightKeywords: boolean
  showTimestamps: boolean
  autoScroll: boolean
  pauseOnKeywords: boolean
  readingSpeed: number
  focusMode: boolean
  dyslexiaFont: boolean
  reducedMotion: boolean
}

interface AccessibilityControlsProps {
  onSettingsChange: (settings: AccessibilitySettings) => void
  isOpen: boolean
  onToggle: () => void
}

const defaultSettings: AccessibilitySettings = {
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
}

export function AccessibilityControls({ onSettingsChange, isOpen, onToggle }: AccessibilityControlsProps) {
  const [settings, setSettings] = useState<AccessibilitySettings>(defaultSettings)

  useEffect(() => {
    // Carregar configurações salvas do localStorage
    const savedSettings = localStorage.getItem("transcription-accessibility-settings")
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings)
        setSettings({ ...defaultSettings, ...parsed })
      } catch (error) {
        console.error("Erro ao carregar configurações:", error)
      }
    }
  }, [])

  useEffect(() => {
    // Salvar configurações no localStorage
    localStorage.setItem("transcription-accessibility-settings", JSON.stringify(settings))
    onSettingsChange(settings)

    // Aplicar configurações globais
    applyGlobalSettings(settings)
  }, [settings, onSettingsChange])

  const applyGlobalSettings = (settings: AccessibilitySettings) => {
    const root = document.documentElement

    // Aplicar tamanho da fonte
    root.style.setProperty("--base-font-size", `${settings.fontSize}px`)
    root.style.setProperty("--line-height", settings.lineHeight.toString())

    // Aplicar esquema de cores
    if (settings.colorScheme !== "auto") {
      root.classList.toggle("dark", settings.colorScheme === "dark")
    }

    // Aplicar fonte para dislexia
    if (settings.dyslexiaFont) {
      root.style.setProperty("--font-family", "OpenDyslexic, Arial, sans-serif")
    } else {
      root.style.removeProperty("--font-family")
    }

    // Aplicar movimento reduzido
    if (settings.reducedMotion) {
      root.style.setProperty("--animation-duration", "0.01ms")
    } else {
      root.style.removeProperty("--animation-duration")
    }
  }

  const updateSetting = <K extends keyof AccessibilitySettings>(key: K, value: AccessibilitySettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  const resetSettings = () => {
    setSettings(defaultSettings)
    localStorage.removeItem("transcription-accessibility-settings")
  }

  if (!isOpen) {
    return (
      <Button
        onClick={onToggle}
        variant="outline"
        size="sm"
        className="fixed top-4 right-4 z-50 focus-visible bg-transparent"
        aria-label="Abrir controles de acessibilidade"
      >
        <Settings className="h-4 w-4" />
      </Button>
    )
  }

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              Controles de Acessibilidade
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button onClick={resetSettings} variant="outline" size="sm" className="focus-visible bg-transparent">
                <RotateCcw className="h-4 w-4 mr-2" />
                Resetar
              </Button>
              <Button onClick={onToggle} variant="outline" size="sm" className="focus-visible bg-transparent">
                Fechar
              </Button>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">Personalize a interface para suas necessidades específicas</p>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Configurações de Texto */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-3">
              <Type className="h-4 w-4 text-primary" />
              <h3 className="font-semibold">Texto e Leitura</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="font-size">Tamanho da Fonte: {settings.fontSize}px</Label>
                <Slider
                  id="font-size"
                  min={12}
                  max={24}
                  step={1}
                  value={[settings.fontSize]}
                  onValueChange={([value]) => updateSetting("fontSize", value)}
                  className="focus-visible"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="line-height">Espaçamento entre Linhas: {settings.lineHeight}</Label>
                <Slider
                  id="line-height"
                  min={1.2}
                  max={2.0}
                  step={0.1}
                  value={[settings.lineHeight]}
                  onValueChange={([value]) => updateSetting("lineHeight", value)}
                  className="focus-visible"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="dyslexia-font" className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Fonte para Dislexia
              </Label>
              <Switch
                id="dyslexia-font"
                checked={settings.dyslexiaFont}
                onCheckedChange={(checked) => updateSetting("dyslexiaFont", checked)}
              />
            </div>
          </div>

          {/* Configurações Visuais */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-3">
              <Palette className="h-4 w-4 text-primary" />
              <h3 className="font-semibold">Aparência</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="color-scheme">Esquema de Cores</Label>
                <Select
                  value={settings.colorScheme}
                  onValueChange={(value: AccessibilitySettings["colorScheme"]) => updateSetting("colorScheme", value)}
                >
                  <SelectTrigger id="color-scheme" className="focus-visible">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">Automático</SelectItem>
                    <SelectItem value="light">Claro</SelectItem>
                    <SelectItem value="dark">Escuro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="contrast">Contraste</Label>
                <Select
                  value={settings.contrast}
                  onValueChange={(value: AccessibilitySettings["contrast"]) => updateSetting("contrast", value)}
                >
                  <SelectTrigger id="contrast" className="focus-visible">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">Alto</SelectItem>
                    <SelectItem value="low">Baixo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="reduced-motion" className="flex items-center gap-2">
                Reduzir Animações
              </Label>
              <Switch
                id="reduced-motion"
                checked={settings.reducedMotion}
                onCheckedChange={(checked) => updateSetting("reducedMotion", checked)}
              />
            </div>
          </div>

          {/* Configurações de Transcrição */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-3">
              <Volume2 className="h-4 w-4 text-primary" />
              <h3 className="font-semibold">Transcrição</h3>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="highlight-keywords">Destacar Palavras-chave</Label>
                <Switch
                  id="highlight-keywords"
                  checked={settings.highlightKeywords}
                  onCheckedChange={(checked) => updateSetting("highlightKeywords", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="show-timestamps">Mostrar Horários</Label>
                <Switch
                  id="show-timestamps"
                  checked={settings.showTimestamps}
                  onCheckedChange={(checked) => updateSetting("showTimestamps", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="auto-scroll">Rolagem Automática</Label>
                <Switch
                  id="auto-scroll"
                  checked={settings.autoScroll}
                  onCheckedChange={(checked) => updateSetting("autoScroll", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="pause-keywords">Pausar em Palavras-chave</Label>
                <Switch
                  id="pause-keywords"
                  checked={settings.pauseOnKeywords}
                  onCheckedChange={(checked) => updateSetting("pauseOnKeywords", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="focus-mode">Modo Foco</Label>
                <Switch
                  id="focus-mode"
                  checked={settings.focusMode}
                  onCheckedChange={(checked) => updateSetting("focusMode", checked)}
                />
              </div>
            </div>
          </div>

          {/* Perfis Pré-definidos */}
          <div className="space-y-4">
            <h3 className="font-semibold">Perfis Rápidos</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setSettings({
                    ...defaultSettings,
                    fontSize: 18,
                    lineHeight: 1.8,
                    highlightKeywords: true,
                    dyslexiaFont: true,
                  })
                }
                className="focus-visible"
              >
                <Badge variant="secondary" className="mr-2">
                  TDAH
                </Badge>
                Foco
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setSettings({
                    ...defaultSettings,
                    fontSize: 20,
                    lineHeight: 2.0,
                    dyslexiaFont: true,
                    reducedMotion: true,
                  })
                }
                className="focus-visible"
              >
                <Badge variant="secondary" className="mr-2">
                  Dislexia
                </Badge>
                Leitura
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setSettings({
                    ...defaultSettings,
                    contrast: "high",
                    fontSize: 18,
                    reducedMotion: true,
                    focusMode: true,
                  })
                }
                className="focus-visible"
              >
                <Badge variant="secondary" className="mr-2">
                  Autismo
                </Badge>
                Calmo
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
