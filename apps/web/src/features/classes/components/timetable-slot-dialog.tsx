import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@/shared/lib/zod-resolver";
import {
  CreateClassTimetableSchema,
  UpdateClassTimetableSchema,
  type CreateClassTimetableDto,
  type UpdateClassTimetableDto,
  DayOfWeekEnum,
  type ClassTimetableAttribute,
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
import { Textarea } from "@/components/ui/textarea";
import {
  useCreateTimetableSlotMutation,
  useUpdateTimetableSlotMutation,
} from "../hooks/use-class-timetable-query";
import { Loader2 } from "lucide-react";

export type TimetableSlotFormValues = CreateClassTimetableDto | UpdateClassTimetableDto;

interface TimetableSlotDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classId: number;
  slot?: ClassTimetableAttribute | null;
  defaultDay?: DayOfWeekEnum;
}

const COLOR_PRESETS = [
  { label: "Green", value: "#45AC5E" },
  { label: "Blue", value: "#3B82F6" },
  { label: "Purple", value: "#8B5CF6" },
  { label: "Amber", value: "#F59E0B" },
  { label: "Pink", value: "#EC4899" },
  { label: "Emerald", value: "#10B981" },
  { label: "Cyan", value: "#06B6D4" },
  { label: "Orange", value: "#F97316" },
];

export function TimetableSlotDialog({
  open,
  onOpenChange,
  classId,
  slot,
  defaultDay = DayOfWeekEnum.MONDAY,
}: TimetableSlotDialogProps) {
  const isEdit = !!slot;
  const createMutation = useCreateTimetableSlotMutation();
  const updateMutation = useUpdateTimetableSlotMutation();

  const activeSchema = isEdit ? UpdateClassTimetableSchema : CreateClassTimetableSchema;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<TimetableSlotFormValues>({
    resolver: zodResolver(activeSchema),
    mode: "onChange",
    defaultValues: {
      classId,
      dayOfWeek: defaultDay,
      subject: "",
      subjectCode: "",
      teacherName: "",
      room: "",
      startTime: "07:30",
      endTime: "09:00",
      colorTag: "#45AC5E",
      notes: "",
    },
  });

  const selectedColor = watch("colorTag");

  useEffect(() => {
    if (slot) {
      reset({
        classId,
        dayOfWeek: slot.dayOfWeek,
        subject: slot.subject,
        subjectCode: slot.subjectCode ?? "",
        teacherName: slot.teacherName ?? "",
        room: slot.room ?? "",
        startTime: slot.startTime,
        endTime: slot.endTime,
        colorTag: slot.colorTag ?? "#45AC5E",
        notes: slot.notes ?? "",
      });
    } else {
      reset({
        classId,
        dayOfWeek: defaultDay,
        subject: "",
        subjectCode: "",
        teacherName: "",
        room: "",
        startTime: "07:30",
        endTime: "09:00",
        colorTag: "#45AC5E",
        notes: "",
      });
    }
  }, [slot, classId, defaultDay, reset, open]);

  const onSubmit = async (data: TimetableSlotFormValues) => {
    try {
      if (isEdit && slot) {
        await updateMutation.mutateAsync({
          slotId: slot.id,
          classId,
          dto: data as UpdateClassTimetableDto,
        });
      } else {
        await createMutation.mutateAsync({
          classId,
          dto: data as CreateClassTimetableDto,
        });
      }
      onOpenChange(false);
    } catch (error: unknown) {
      console.error("Failed to save timetable slot", error);
    }
  };

  const errorMessage =
    createMutation.error?.message || updateMutation.error?.message;

  const validationErrorsList = Object.entries(errors)
    .map(([_, err]) => err?.message)
    .filter(Boolean);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-white">
        <DialogHeader>
          <DialogTitle className="text-slate-800 text-lg font-bold">
            {isEdit ? "Edit Schedule Slot" : "Add Schedule Slot"}
          </DialogTitle>
        </DialogHeader>

        {errorMessage && (
          <div className="rounded-md bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200">
            {errorMessage}
          </div>
        )}

        {validationErrorsList.length > 0 && (
          <div className="rounded-lg bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200 space-y-1">
            <div className="font-semibold text-rose-800">
              Please resolve the following errors:
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
            console.warn("TimetableSlotDialog validation failed:", invalid);
          })}
          className="space-y-4"
        >
          <div>
            <Label className="text-xs font-semibold text-slate-700">Day of Week</Label>
            <select
              {...register("dayOfWeek")}
              className="mt-1 flex h-9 w-full rounded-md border border-slate-200 bg-white px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500"
            >
              {Object.values(DayOfWeekEnum).map((day) => (
                <option key={day} value={day}>
                  {day}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-semibold text-slate-700">Lesson / Module Title *</Label>
              <Input
                {...register("subject")}
                placeholder="e.g. Reading & Vocabulary, Excel Practice"
                className="mt-1 h-9 text-sm"
              />
              {errors.subject && (
                <p className="mt-1 text-xs text-rose-500">{errors.subject.message}</p>
              )}
            </div>

            <div>
              <Label className="text-xs font-semibold text-slate-700">Module Code</Label>
              <Input
                {...register("subjectCode")}
                placeholder="e.g. VOC-101, ICT-101"
                className="mt-1 h-9 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-semibold text-slate-700">Start Time (HH:mm) *</Label>
              <Input
                type="time"
                {...register("startTime")}
                className="mt-1 h-9 text-sm"
              />
              {errors.startTime && (
                <p className="mt-1 text-xs text-red-500">{errors.startTime.message}</p>
              )}
            </div>

            <div>
              <Label className="text-xs font-semibold text-slate-700">End Time (HH:mm) *</Label>
              <Input
                type="time"
                {...register("endTime")}
                className="mt-1 h-9 text-sm"
              />
              {errors.endTime && (
                <p className="mt-1 text-xs text-red-500">{errors.endTime.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-semibold text-slate-700">Teacher Name</Label>
              <Input
                {...register("teacherName")}
                placeholder="e.g. Mr. Sokha"
                className="mt-1 h-9 text-sm"
              />
            </div>

            <div>
              <Label className="text-xs font-semibold text-slate-700">Room / Lab</Label>
              <Input
                {...register("room")}
                placeholder="e.g. Room 101"
                className="mt-1 h-9 text-sm"
              />
            </div>
          </div>

          <div>
            <Label className="text-xs font-semibold text-slate-700">Color Tag</Label>
            <div className="mt-1.5 flex items-center gap-2">
              {COLOR_PRESETS.map((color) => (
                <button
                  type="button"
                  key={color.value}
                  onClick={() => setValue("colorTag", color.value)}
                  className={`h-6 w-6 rounded-full transition-transform ${
                    selectedColor === color.value
                      ? "ring-2 ring-slate-800 scale-110"
                      : "hover:scale-105"
                  }`}
                  style={{ backgroundColor: color.value }}
                  title={color.label}
                />
              ))}
            </div>
          </div>

          <div>
            <Label className="text-xs font-semibold text-slate-700">Notes / Remarks</Label>
            <Textarea
              {...register("notes")}
              placeholder="e.g. Bring scientific calculator"
              rows={2}
              className="mt-1 text-sm"
            />
          </div>

          <DialogFooter className="mt-4 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || createMutation.isPending || updateMutation.isPending}
              className="bg-[#45AC5E] hover:bg-[#3d9853] text-white"
            >
              {(createMutation.isPending || updateMutation.isPending) && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {isEdit ? "Update Slot" : "Add Slot"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
