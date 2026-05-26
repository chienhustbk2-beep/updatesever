"use client";
import { useState, useRef, useCallback, useEffect } from "react";
import { Upload, X, ImageIcon } from "lucide-react";

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
}

function extractUrl(value: string): string | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed[0];
    return value;
  } catch {
    return value;
  }
}

export default function ImageUpload({ value, onChange, label }: ImageUploadProps) {
  const [dragging, setDragging] = useState(false);
  const [preview, setPreview] = useState<string | null>(() => extractUrl(value));
  const [inputUrl, setInputUrl] = useState(() => extractUrl(value) || "");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const url = extractUrl(value);
    setPreview(url);
    if (!inputUrl) setInputUrl(url || "");
  }, [value]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      uploadFile(file);
    }
  }, [onChange]);

  const uploadFile = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: formData });
    if (res.ok) {
      const data = await res.json();
      setPreview(data.url);
      onChange(data.url);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      uploadFile(file);
    }
  };

  const handleUrlChange = (url: string) => {
    setInputUrl(url);
    onChange(url);
    if (url) setPreview(url);
  };

  const clearImage = () => {
    setPreview(null);
    setInputUrl("");
    onChange("");
  };

  return (
    <div className="space-y-2">
      {label && <label className="block text-sm font-medium text-muted">{label}</label>}
      <div
        className={`relative rounded-xl border-2 border-dashed p-4 transition text-center ${
          dragging ? "border-[var(--primary)] bg-[var(--primary)]/5" : "border-divider hover:border-[var(--primary)]/40"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {preview ? (
          <div className="relative mx-auto w-full max-w-xs">
            <div className="aspect-[4/3] overflow-hidden rounded-lg border border-divider bg-card">
              <img src={preview} alt="Preview" className="h-full w-full object-scale-down" />
            </div>
            <button
              type="button"
              onClick={clearImage}
              className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-[var(--danger)] text-white shadow transition hover:bg-[var(--danger)]/80"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ) : (
          <div
            className="cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--primary)]/10">
              <Upload className="h-5 w-5 text-[var(--primary)]" />
            </div>
            <p className="text-sm text-muted">
              <span className="font-medium text-[var(--primary)]">Kéo thả ảnh</span> hoặc click để chọn
            </p>
            <p className="text-xs text-muted/60 mt-1">PNG, JPG, WebP tối đa 5MB</p>
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <input
            type="text"
            value={inputUrl}
            onChange={(e) => handleUrlChange(e.target.value)}
            placeholder="Hoặc nhập URL ảnh..."
            className="w-full rounded-lg bg-main border border-divider px-3 py-2 text-sm text-main placeholder-muted focus:border-[var(--primary)] focus:outline-none"
          />
        </div>
        {inputUrl && (
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-card border border-divider">
            <ImageIcon className="h-4 w-4 text-muted" />
          </div>
        )}
      </div>
      <p className="text-xs text-muted">Gợi ý: up ảnh lên <a href="https://freeimage.host/" target="_blank" className="text-[var(--primary)] underline hover:opacity-80">freeimage.host</a> → copy <strong>Direct Link</strong> → dán vào ô trên</p>
    </div>
  );
}
