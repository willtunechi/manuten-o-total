import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useTheme, type ThemeColors } from "@/contexts/ThemeContext";
import { toast } from "@/hooks/use-toast";
import { Sun, Moon, Palette } from "lucide-react";

function hslToHex(hslStr: string): string {
  const parts = hslStr.trim().split(/\s+/);
  const h = parseFloat(parts[0]) || 0;
  const s = (parseFloat(parts[1]) || 0) / 100;
  const l = (parseFloat(parts[2]) || 0) / 100;

  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

function hexToHsl(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0, s = 0;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) * 60; break;
      case g: h = ((b - r) / d + 2) * 60; break;
      case b: h = ((r - g) / d + 4) * 60; break;
    }
  }

  return `${Math.round(h)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

const COLOR_FIELDS: { key: keyof ThemeColors; label: string }[] = [
  { key: "primary", label: "Cor Primária" },
  { key: "secondary", label: "Cor Secundária" },
  { key: "accent", label: "Cor de Destaque" },
  { key: "sidebar", label: "Cor da Sidebar" },
];

const PRESETS: { name: string; mode: "light" | "dark"; colors: ThemeColors }[] = [
  {
    name: "Padrão Claro",
    mode: "light",
    colors: { primary: "0 0% 10%", secondary: "0 0% 96%", accent: "0 0% 92%", sidebar: "0 0% 98%" },
  },
  {
    name: "Azul Profissional",
    mode: "light",
    colors: { primary: "215 70% 45%", secondary: "215 30% 95%", accent: "215 20% 90%", sidebar: "215 30% 97%" },
  },
  {
    name: "Verde Industrial",
    mode: "light",
    colors: { primary: "142 50% 35%", secondary: "142 20% 95%", accent: "142 15% 90%", sidebar: "142 15% 97%" },
  },
  {
    name: "Escuro Moderno",
    mode: "dark",
    colors: { primary: "215 70% 55%", secondary: "215 15% 18%", accent: "215 10% 22%", sidebar: "215 15% 10%" },
  },
  {
    name: "Escuro Verde",
    mode: "dark",
    colors: { primary: "142 60% 45%", secondary: "142 10% 18%", accent: "142 8% 22%", sidebar: "142 10% 10%" },
  },
];

export function ThemeSettings() {
  const { mode, colors, setMode, setColors, saveTheme } = useTheme();
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveTheme();
      toast({ title: "Tema salvo com sucesso!" });
    } catch {
      toast({ title: "Erro ao salvar tema", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const applyPreset = (preset: typeof PRESETS[0]) => {
    setMode(preset.mode);
    setColors(preset.colors);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            {mode === "dark" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            Modo do Tema
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <Sun className="h-4 w-4 text-muted-foreground" />
            <Switch
              checked={mode === "dark"}
              onCheckedChange={(checked) => setMode(checked ? "dark" : "light")}
            />
            <Moon className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground ml-2">
              {mode === "dark" ? "Modo Escuro" : "Modo Claro"}
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Temas Pré-definidos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
            {PRESETS.map((preset) => (
              <button
                key={preset.name}
                onClick={() => applyPreset(preset)}
                className="border rounded-lg p-3 text-left hover:border-primary transition-colors space-y-2"
              >
                <div className="flex gap-1">
                  {Object.values(preset.colors).map((c, i) => (
                    <div
                      key={i}
                      className="h-4 w-4 rounded-full border border-border"
                      style={{ backgroundColor: `hsl(${c})` }}
                    />
                  ))}
                </div>
                <p className="text-xs font-medium truncate">{preset.name}</p>
                <p className="text-[10px] text-muted-foreground">{preset.mode === "dark" ? "Escuro" : "Claro"}</p>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Cores Personalizadas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {COLOR_FIELDS.map(({ key, label }) => (
              <div key={key} className="space-y-2">
                <Label className="text-sm">{label}</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={hslToHex(colors[key])}
                    onChange={(e) => setColors({ [key]: hexToHsl(e.target.value) })}
                    className="h-10 w-14 rounded border border-input cursor-pointer"
                  />
                  <div
                    className="h-10 flex-1 rounded border border-input"
                    style={{ backgroundColor: `hsl(${colors[key]})` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Salvando..." : "Salvar Tema"}
        </Button>
      </div>
    </div>
  );
}
