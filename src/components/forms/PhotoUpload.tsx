import { useState, useRef } from "react";
import { Camera, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  value?: string;
  onChange: (url: string | undefined) => void;
  folder?: string;
}

export function PhotoUpload({ value, onChange, folder = "general" }: Props) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const upload = async (file: File) => {
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${folder}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("asset-photos").upload(path, file);
    if (error) { console.error(error); setUploading(false); return; }
    const { data } = supabase.storage.from("asset-photos").getPublicUrl(path);
    onChange(data.publicUrl);
    setUploading(false);
  };

  return (
    <div className="space-y-2">
      {value ? (
        <div className="relative w-full h-32 rounded-md overflow-hidden border border-border">
          <img src={value} alt="Foto" className="w-full h-full object-cover" />
          <Button size="icon" variant="destructive" className="absolute top-1 right-1 h-6 w-6" onClick={() => onChange(undefined)}>
            <X className="h-3 w-3" />
          </Button>
        </div>
      ) : (
        <Button type="button" variant="outline" className="w-full h-20 gap-2 border-dashed" disabled={uploading} onClick={() => inputRef.current?.click()}>
          {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Camera className="h-5 w-5" />}
          {uploading ? "Enviando..." : "Adicionar Foto"}
        </Button>
      )}
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); e.target.value = ""; }} />
    </div>
  );
}
