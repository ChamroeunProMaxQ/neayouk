import { useState, useRef, type ChangeEvent, type DragEvent } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  UploadCloud,
  Image as ImageIcon,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import {
  useDeleteSchoolLogoMutation,
  useUploadSchoolLogoMutation,
} from "../hooks/use-school-settings-mutations";

interface SchoolLogoUploaderProps {
  currentLogoUrl?: string | null;
  schoolName?: string;
  motto?: string;
}

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_TYPES = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/svg+xml",
  "image/webp",
];

export function SchoolLogoUploader({
  currentLogoUrl,
  schoolName = "Neayouk School",
  motto = "Excellence in Education",
}: SchoolLogoUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadMutation = useUploadSchoolLogoMutation();
  const deleteMutation = useDeleteSchoolLogoMutation();

  const handleValidateAndSelect = (file: File) => {
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!ALLOWED_TYPES.includes(file.type)) {
      setErrorMessage("Please select a valid image file (PNG, JPG, SVG, or WebP).");
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setErrorMessage("Image file size must be 2MB or less.");
      return;
    }

    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  };

  const onFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleValidateAndSelect(file);
    }
  };

  const onDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleValidateAndSelect(file);
    }
  };

  const handleUpload = () => {
    if (!selectedFile) return;

    uploadMutation.mutate(selectedFile, {
      onSuccess: () => {
        setSuccessMessage("Official logo uploaded successfully!");
        setSelectedFile(null);
        setPreviewUrl(null);
        setTimeout(() => setSuccessMessage(null), 4000);
      },
      onError: (err: any) => {
        const msg =
          err?.response?.data?.message || err?.message || "Failed to upload logo.";
        setErrorMessage(typeof msg === "string" ? msg : JSON.stringify(msg));
      },
    });
  };

  const handleDelete = () => {
    if (
      !window.confirm(
        "Are you sure you want to remove the official school logo and revert to the system default?"
      )
    ) {
      return;
    }

    deleteMutation.mutate(undefined, {
      onSuccess: () => {
        setSuccessMessage("Custom logo removed. Default system logo restored.");
        setSelectedFile(null);
        setPreviewUrl(null);
        setTimeout(() => setSuccessMessage(null), 4000);
      },
      onError: (err: any) => {
        const msg =
          err?.response?.data?.message || err?.message || "Failed to delete logo.";
        setErrorMessage(typeof msg === "string" ? msg : JSON.stringify(msg));
      },
    });
  };

  const activeLogo = previewUrl || currentLogoUrl || "/neayouk_logo.svg";

  return (
    <Card className="border-slate-200 shadow-xs">
      <CardHeader>
        <div className="flex items-center gap-2">
          <ImageIcon className="h-5 w-5 text-[#45AC5E]" />
          <CardTitle className="text-lg font-bold text-slate-900">
            School Branding & Logo
          </CardTitle>
        </div>
        <CardDescription>
          Upload your official school crest or logo. This will dynamically appear in the application header, bill receipts, and progress report cards.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {successMessage && (
          <div className="flex items-center gap-2 rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-sm text-emerald-800">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            <span>{successMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="flex items-center gap-2 rounded-lg bg-rose-50 border border-rose-200 p-3 text-sm text-rose-800">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          {/* Upload Zone */}
          <div className="space-y-3">
            <div
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${
                isDragging
                  ? "border-[#45AC5E] bg-emerald-50/50"
                  : "border-slate-300 hover:border-slate-400 bg-slate-50/50"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept={ALLOWED_TYPES.join(",")}
                onChange={onFileInputChange}
                className="hidden"
              />
              <div className="p-3 bg-white rounded-full shadow-xs border border-slate-200 mb-3 text-slate-500">
                <UploadCloud className="h-6 w-6 text-[#45AC5E]" />
              </div>
              <p className="text-sm font-semibold text-slate-700 text-center">
                Click to browse or drag &amp; drop
              </p>
              <p className="text-xs text-slate-500 text-center mt-1">
                PNG, SVG, JPG, or WebP (max 2MB)
              </p>
              <p className="text-[11px] text-slate-400 text-center mt-0.5">
                Recommended: 256×256px square or horizontal transparent emblem
              </p>
            </div>

            {selectedFile && (
              <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-50/60 border border-emerald-200 text-xs">
                <span className="font-medium text-emerald-900 truncate max-w-[200px]">
                  {selectedFile.name} ({(selectedFile.size / 1024).toFixed(0)} KB)
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setSelectedFile(null);
                      setPreviewUrl(null);
                    }}
                    className="h-7 text-xs text-slate-600 hover:text-slate-900"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleUpload}
                    disabled={uploadMutation.isPending}
                    className="h-7 bg-[#45AC5E] hover:bg-[#3d9652] text-white text-xs"
                  >
                    {uploadMutation.isPending && (
                      <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                    )}
                    Upload Logo
                  </Button>
                </div>
              </div>
            )}

            {currentLogoUrl && !selectedFile && (
              <div className="flex justify-end">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleDelete}
                  disabled={deleteMutation.isPending}
                  className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200"
                >
                  {deleteMutation.isPending ? (
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                  )}
                  Remove Custom Logo
                </Button>
              </div>
            )}
          </div>

          {/* Live Preview Column */}
          <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50/40 p-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Live Touchpoint Previews
            </h4>

            {/* Preview 1: Header Brand Simulation */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold text-slate-600">
                1. Top Navigation Bar Appearance:
              </span>
              <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-slate-200 shadow-2xs">
                <img
                  src={activeLogo}
                  alt="Header Logo Preview"
                  className="h-9 w-9 shrink-0 object-contain rounded-md"
                />
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-slate-900 leading-tight">
                    {schoolName}
                  </span>
                  <span className="text-[10px] font-bold text-[#45AC5E] bg-[#EBF6EE] px-1.5 py-0.2 rounded-xs w-fit">
                    CMS_ADMIN
                  </span>
                </div>
              </div>
            </div>

            {/* Preview 2: Official A5 Receipt Header Simulation */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold text-slate-600">
                2. A5 Bill Receipt Letterhead Appearance:
              </span>
              <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-slate-200 shadow-2xs font-serif">
                <div className="relative w-12 h-12 rounded-full border border-sky-600 bg-sky-50/50 flex flex-col items-center justify-center p-1 overflow-hidden shrink-0">
                  <img
                    src={activeLogo}
                    alt="Receipt Emblem"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-[#b91c1c] truncate">
                    {schoolName}
                  </p>
                  <p className="text-[9px] text-slate-500 truncate">{motto}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
