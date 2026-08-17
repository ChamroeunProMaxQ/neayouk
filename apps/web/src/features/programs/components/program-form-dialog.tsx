import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@/shared/lib/zod-resolver";
import {
  CreateProgramSchema,
  UpdateProgramSchema,
  type CreateProgramDto,
  type UpdateProgramDto,
  type ProgramAttribute,
} from "@repo/contracts";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  useCreateProgramMutation,
  useUpdateProgramMutation,
} from "../hooks/use-program-mutations";
import { Loader2, Plus, X, BookOpen, AlertCircle } from "lucide-react";

interface ProgramFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  program?: ProgramAttribute | null;
}

export function ProgramFormDialog({
  open,
  onOpenChange,
  program,
}: ProgramFormDialogProps) {
  const isEdit = !!program;
  const createMutation = useCreateProgramMutation();
  const updateMutation = useUpdateProgramMutation();

  const activeSchema = isEdit ? UpdateProgramSchema : CreateProgramSchema;

  const [books, setBooks] = useState<string[]>([]);
  const [newBookInput, setNewBookInput] = useState("");

  const [gradeLevels, setGradeLevels] = useState<string[]>([]);
  const [newLevelInput, setNewLevelInput] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CreateProgramDto>({
    resolver: zodResolver(activeSchema),
    mode: "onChange",
    defaultValues: {
      name: "",
      code: "",
      books: [],
      gradeLevels: [],
      status: "ACTIVE",
    },
  });

  useEffect(() => {
    if (program) {
      const progBooks = Array.isArray(program.books) ? program.books : [];
      const levels = Array.isArray(program.gradeLevels) ? program.gradeLevels : [];
      setBooks(progBooks);
      setGradeLevels(levels);
      reset({
        name: program.name,
        code: program.code,
        books: progBooks,
        gradeLevels: levels,
        status: program.status ?? "ACTIVE",
      });
    } else {
      setBooks([]);
      setGradeLevels(["1", "2", "3", "4", "5", "6"]);
      reset({
        name: "",
        code: "",
        books: [],
        gradeLevels: ["1", "2", "3", "4", "5", "6"],
        status: "ACTIVE",
      });
    }
  }, [program, reset, open]);

  // Book handlers
  const handleAddBook = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = newBookInput.trim();
    if (trimmed && !books.includes(trimmed)) {
      const nextBooks = [...books, trimmed];
      setBooks(nextBooks);
      setValue("books", nextBooks, { shouldValidate: true });
      setNewBookInput("");
    }
  };

  const handleRemoveBook = (bookToRemove: string) => {
    const nextBooks = books.filter((b) => b !== bookToRemove);
    setBooks(nextBooks);
    setValue("books", nextBooks, { shouldValidate: true });
  };

  const applyBookPreset = (presetBooks: string[]) => {
    const combined = Array.from(new Set([...books, ...presetBooks]));
    setBooks(combined);
    setValue("books", combined, { shouldValidate: true });
  };

  // Grade Level handlers
  const handleAddLevel = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = newLevelInput.trim();
    if (trimmed && !gradeLevels.includes(trimmed)) {
      const nextLevels = [...gradeLevels, trimmed];
      setGradeLevels(nextLevels);
      setValue("gradeLevels", nextLevels, { shouldValidate: true });
      setNewLevelInput("");
    }
  };

  const handleRemoveLevel = (levelToRemove: string) => {
    const nextLevels = gradeLevels.filter((lvl) => lvl !== levelToRemove);
    setGradeLevels(nextLevels);
    setValue("gradeLevels", nextLevels, { shouldValidate: true });
  };

  const applyLevelPreset = (levels: string[]) => {
    const combined = Array.from(new Set([...gradeLevels, ...levels]));
    setGradeLevels(combined);
    setValue("gradeLevels", combined, { shouldValidate: true });
  };

  const onSubmit = async (data: CreateProgramDto) => {
    try {
      const payload: CreateProgramDto = {
        ...data,
        books,
        gradeLevels,
      };

      if (isEdit && program) {
        await updateMutation.mutateAsync({
          id: program.id,
          dto: payload,
        });
      } else {
        await createMutation.mutateAsync(payload);
      }
      onOpenChange(false);
    } catch (err: any) {
      console.error("Failed to save program:", err);
    }
  };

  const errorMessage =
    createMutation.error?.message || updateMutation.error?.message;

  const validationErrorsList = Object.entries(errors)
    .map(([_, err]) => err?.message)
    .filter(Boolean);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto p-6">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-slate-800">
            {isEdit ? "Edit Academic Program" : "Create Academic Program"}
          </DialogTitle>
        </DialogHeader>

        {/* API Server Error Banner */}
        {errorMessage && (
          <div className="rounded-md bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Zod Validation Errors Banner */}
        {validationErrorsList.length > 0 && (
          <div className="rounded-lg bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200 space-y-1">
            <div className="font-semibold flex items-center gap-1.5 text-rose-800">
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
              <span>Please resolve the following form errors:</span>
            </div>
            <ul className="list-disc list-inside pl-1 text-[11px] space-y-0.5 text-rose-600">
              {validationErrorsList.map((msg, i) => (
                <li key={i}>{String(msg)}</li>
              ))}
            </ul>
          </div>
        )}

        <form
          onSubmit={handleSubmit(onSubmit, (invalid) => {
            console.warn("ProgramFormDialog validation failed:", invalid);
          })}
          className="space-y-5 py-2"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="prog-name" className="text-xs font-semibold text-slate-700">
                Program Name <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="prog-name"
                placeholder="e.g. English For Kids, GEP For Teenagers"
                {...register("name")}
                className={`h-9 text-sm ${errors.name ? "border-rose-500 focus-visible:ring-rose-500" : ""}`}
              />
              {errors.name && (
                <p className="text-xs text-rose-500">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="prog-code" className="text-xs font-semibold text-slate-700">
                Program Code <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="prog-code"
                placeholder="e.g. EFKIDS, GEP-TEEN, GCP-KIDS"
                {...register("code")}
                className={`h-9 text-sm uppercase ${errors.code ? "border-rose-500 focus-visible:ring-rose-500" : ""}`}
              />
              {errors.code && (
                <p className="text-xs text-rose-500">{errors.code.message}</p>
              )}
            </div>
          </div>

          {/* 1. Books / Course Materials Builder */}
          <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50/50 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
                <BookOpen className="h-4 w-4 text-[#45AC5E]" />
                <span>Curriculum Books / Course Materials</span>
              </div>
              <span className="text-[11px] text-slate-500">
                {books.length} book{books.length === 1 ? "" : "s"} configured
              </span>
            </div>

            <div className="flex gap-2">
              <Input
                value={newBookInput}
                onChange={(e) => setNewBookInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddBook();
                  }
                }}
                placeholder="Type book name (e.g. Oxford Discover, Phonics World) & Enter"
                className="h-8 text-xs bg-white"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleAddBook()}
                className="h-8 px-2.5 text-xs text-slate-700 shrink-0"
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                Add Book
              </Button>
            </div>

            {/* Quick Book Presets */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[10px] text-slate-400 font-medium">Quick Presets:</span>
              <button
                type="button"
                onClick={() => applyBookPreset(["Phonics World"])}
                className="text-[11px] px-1.5 py-0.5 rounded border border-slate-200 bg-white text-slate-600 hover:border-[#45AC5E] hover:text-[#45AC5E] transition-colors"
              >
                + Phonics World
              </button>
              <button
                type="button"
                onClick={() => applyBookPreset(["Oxford Discover"])}
                className="text-[11px] px-1.5 py-0.5 rounded border border-slate-200 bg-white text-slate-600 hover:border-[#45AC5E] hover:text-[#45AC5E] transition-colors"
              >
                + Oxford Discover
              </button>
              <button
                type="button"
                onClick={() => applyBookPreset(["Solutions"])}
                className="text-[11px] px-1.5 py-0.5 rounded border border-slate-200 bg-white text-slate-600 hover:border-[#45AC5E] hover:text-[#45AC5E] transition-colors"
              >
                + Solutions
              </button>
              <button
                type="button"
                onClick={() => applyBookPreset(["New Headway"])}
                className="text-[11px] px-1.5 py-0.5 rounded border border-slate-200 bg-white text-slate-600 hover:border-[#45AC5E] hover:text-[#45AC5E] transition-colors"
              >
                + New Headway
              </button>
              <button
                type="button"
                onClick={() => applyBookPreset(["Easy Step to Chinese"])}
                className="text-[11px] px-1.5 py-0.5 rounded border border-slate-200 bg-white text-slate-600 hover:border-[#45AC5E] hover:text-[#45AC5E] transition-colors"
              >
                + Easy Step to Chinese
              </button>
              <button
                type="button"
                onClick={() => applyBookPreset(["Discover China"])}
                className="text-[11px] px-1.5 py-0.5 rounded border border-slate-200 bg-white text-slate-600 hover:border-[#45AC5E] hover:text-[#45AC5E] transition-colors"
              >
                + Discover China
              </button>
              <button
                type="button"
                onClick={() =>
                  applyBookPreset([
                    "Computer Fundamentals",
                    "Microsoft Word",
                    "Microsoft Excel",
                    "Canva",
                  ])
                }
                className="text-[11px] px-1.5 py-0.5 rounded border border-slate-200 bg-white text-slate-600 hover:border-[#45AC5E] hover:text-[#45AC5E] transition-colors"
              >
                + Computer Suite (Word, Excel, Canva)
              </button>
            </div>

            {/* Display configured Book Badges */}
            <div className="flex flex-wrap gap-1.5 pt-2 min-h-[38px] p-2 bg-white rounded border border-dashed border-slate-200">
              {books.length === 0 ? (
                <span className="text-xs text-slate-400 italic">
                  No books added yet. Click presets or enter custom book titles above.
                </span>
              ) : (
                books.map((b) => (
                  <Badge
                    key={b}
                    variant="secondary"
                    className="flex items-center gap-1 bg-blue-50 text-blue-800 border-blue-200 text-xs px-2 py-0.5"
                  >
                    <span>{b}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveBook(b)}
                      className="text-blue-600 hover:text-rose-600 focus:outline-none"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))
              )}
            </div>
          </div>

          {/* 2. Grade / Class Levels Builder */}
          <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50/50 p-4">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold text-slate-800">
                Levels (1 to 6)
              </Label>
              <span className="text-[11px] text-slate-500">
                {gradeLevels.length} level{gradeLevels.length === 1 ? "" : "s"} configured
              </span>
            </div>

            <div className="flex gap-2">
              <Input
                value={newLevelInput}
                onChange={(e) => setNewLevelInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddLevel();
                  }
                }}
                placeholder="Type level (e.g. 1, 2, 3, 4, 5, 6) & Enter"
                className="h-8 text-xs bg-white"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleAddLevel()}
                className="h-8 px-2.5 text-xs text-slate-700 shrink-0"
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                Add Level
              </Button>
            </div>

            {/* Quick Level Presets */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[10px] text-slate-400 font-medium">Presets:</span>
              <button
                type="button"
                onClick={() => applyLevelPreset(["1", "2", "3", "4", "5", "6"])}
                className="text-[11px] px-1.5 py-0.5 rounded border border-slate-200 bg-white text-slate-600 hover:border-[#45AC5E] hover:text-[#45AC5E] transition-colors"
              >
                + Levels 1 to 6 (Standard)
              </button>
              <button
                type="button"
                onClick={() =>
                  applyLevelPreset([
                    "1",
                    "2",
                    "3",
                    "4",
                    "5",
                    "6",
                    "7",
                    "8",
                    "9",
                    "10",
                    "11",
                    "12",
                  ])
                }
                className="text-[11px] px-1.5 py-0.5 rounded border border-slate-200 bg-white text-slate-600 hover:border-[#45AC5E] hover:text-[#45AC5E] transition-colors"
              >
                + Levels 1 to 12
              </button>
            </div>

            {/* Display configured Level Badges */}
            <div className="flex flex-wrap gap-1.5 pt-2 min-h-[38px] p-2 bg-white rounded border border-dashed border-slate-200">
              {gradeLevels.length === 0 ? (
                <span className="text-xs text-slate-400 italic">
                  No levels added yet. Click &quot;+ Levels 1 to 6 (Standard)&quot; above.
                </span>
              ) : (
                gradeLevels.map((lvl) => (
                  <Badge
                    key={lvl}
                    variant="secondary"
                    className="flex items-center gap-1 bg-emerald-50 text-emerald-800 border-emerald-200 text-xs px-2 py-0.5"
                  >
                    <span>{lvl}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveLevel(lvl)}
                      className="text-emerald-600 hover:text-rose-600 focus:outline-none"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="prog-status" className="text-xs font-semibold text-slate-700">
                Status
              </Label>
              <select
                id="prog-status"
                {...register("status")}
                className="w-full h-9 rounded-md border border-slate-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#45AC5E]"
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="INACTIVE">INACTIVE</option>
              </select>
            </div>
          </div>

          <DialogFooter className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-[#45AC5E] hover:bg-[#3d9852] text-white"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isEdit ? "Save Changes" : "Create Program"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
