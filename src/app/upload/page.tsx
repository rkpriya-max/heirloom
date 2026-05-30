"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Upload, Camera, Loader2 } from "lucide-react";

export default function UploadPage() {
  const router = useRouter();
  const [dragging, setDragging] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback((f: File) => {
    if (!f.type.startsWith("image/")) {
      setError("Please upload an image file.");
      return;
    }
    setFile(f);
    setError(null);
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(f);
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const dropped = e.dataTransfer.files[0];
      if (dropped) handleFile(dropped);
    },
    [handleFile]
  );

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) handleFile(selected);
  };

  const handleDigitize = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("image", file);

      const res = await fetch("/api/digitize", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong.");
        setLoading(false);
        return;
      }

      // Store result in sessionStorage for the review page
      sessionStorage.setItem("heirloom_recipes", JSON.stringify(data.recipes));
      sessionStorage.setItem("heirloom_image", data.imageBase64);
      sessionStorage.setItem("heirloom_media_type", data.mediaType);

      router.push("/review");
    } catch {
      setError("Failed to connect. Check your internet and try again.");
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-stone-50 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-serif text-stone-800 mb-2">Heirloom</h1>
          <p className="text-stone-500 text-sm">
            Photograph a recipe card. We will read the handwriting.
          </p>
        </div>

        {/* Drop zone */}
        <div
          className={`relative border-2 border-dashed rounded-2xl transition-all cursor-pointer
            ${dragging ? "border-amber-400 bg-amber-50" : "border-stone-200 bg-white hover:border-stone-300"}
            ${preview ? "border-solid border-stone-200" : ""}`}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => document.getElementById("file-input")?.click()}
        >
          <input
            id="file-input"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={onInputChange}
          />

          {preview ? (
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={preview}
                alt="Recipe card preview"
                className="w-full rounded-2xl object-contain max-h-96"
              />
              <button
                className="absolute top-3 right-3 bg-white/90 text-stone-600 text-xs px-3 py-1 rounded-full shadow"
                onClick={(e) => {
                  e.stopPropagation();
                  setPreview(null);
                  setFile(null);
                }}
              >
                Replace
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 px-6">
              <div className="bg-stone-100 rounded-full p-4 mb-4">
                <Upload className="w-6 h-6 text-stone-400" />
              </div>
              <p className="text-stone-600 font-medium mb-1">
                Drop a photo here
              </p>
              <p className="text-stone-400 text-sm">or tap to use your camera</p>
              <div className="flex items-center gap-2 mt-4 text-stone-300 text-xs">
                <Camera className="w-3 h-3" />
                <span>JPG, PNG, WebP up to 10MB</span>
              </div>
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <p className="mt-3 text-red-600 text-sm text-center">{error}</p>
        )}

        {/* Digitize button */}
        <button
          onClick={handleDigitize}
          disabled={!file || loading}
          className={`w-full mt-6 py-4 rounded-xl font-medium text-sm transition-all
            ${file && !loading
              ? "bg-amber-600 hover:bg-amber-700 text-white shadow-sm"
              : "bg-stone-200 text-stone-400 cursor-not-allowed"
            }`}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Reading handwriting...
            </span>
          ) : (
            "Digitize this recipe"
          )}
        </button>

        {loading && (
          <p className="text-center text-stone-400 text-xs mt-3">
            Claude is reading the handwriting. This takes 10-20 seconds.
          </p>
        )}
      </div>
    </main>
  );
}
