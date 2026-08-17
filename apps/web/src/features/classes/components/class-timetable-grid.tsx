import { useState } from "react";
import {
  DayOfWeekEnum,
  type ClassTimetableAttribute,
} from "@repo/contracts";
import {
  useClassTimetableQuery,
  useDeleteTimetableSlotMutation,
} from "../hooks/use-class-timetable-query";
import { TimetableSlotDialog } from "./timetable-slot-dialog";
import { Button } from "@/components/ui/button";
import {
  Plus,
  Clock,
  MapPin,
  User,
  Edit2,
  Trash2,
  Calendar,
  Loader2,
} from "lucide-react";

interface ClassTimetableGridProps {
  classId: number;
  className?: string;
}

const DAYS: DayOfWeekEnum[] = [
  DayOfWeekEnum.MONDAY,
  DayOfWeekEnum.TUESDAY,
  DayOfWeekEnum.WEDNESDAY,
  DayOfWeekEnum.THURSDAY,
  DayOfWeekEnum.FRIDAY,
  DayOfWeekEnum.SATURDAY,
  DayOfWeekEnum.SUNDAY,
];

export function ClassTimetableGrid({ classId }: ClassTimetableGridProps) {
  const { data, isLoading } = useClassTimetableQuery(classId);
  const deleteMutation = useDeleteTimetableSlotMutation();

  const [activeDay, setActiveDay] = useState<DayOfWeekEnum | "ALL">("ALL");
  const [slotModalOpen, setSlotModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<ClassTimetableAttribute | null>(null);
  const [selectedDay, setSelectedDay] = useState<DayOfWeekEnum>(DayOfWeekEnum.MONDAY);

  const slots = data?.data ?? [];

  const handleAddSlot = (day: DayOfWeekEnum) => {
    setSelectedDay(day);
    setSelectedSlot(null);
    setSlotModalOpen(true);
  };

  const handleEditSlot = (slot: ClassTimetableAttribute) => {
    setSelectedSlot(slot);
    setSelectedDay(slot.dayOfWeek);
    setSlotModalOpen(true);
  };

  const handleDeleteSlot = async (slotId: number) => {
    if (confirm("Are you sure you want to remove this schedule slot?")) {
      await deleteMutation.mutateAsync({ slotId, classId });
    }
  };

  const daysToRender = activeDay === "ALL" ? DAYS : [activeDay];

  return (
    <div className="space-y-4">
      {/* Header with Day Filters & Add Button */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setActiveDay("ALL")}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
              activeDay === "ALL"
                ? "bg-[#45AC5E] text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            All Days
          </button>
          {DAYS.map((day) => (
            <button
              key={day}
              onClick={() => setActiveDay(day)}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                activeDay === day
                  ? "bg-[#45AC5E] text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {day.slice(0, 3)}
            </button>
          ))}
        </div>

        <Button
          size="sm"
          onClick={() => handleAddSlot(activeDay === "ALL" ? DayOfWeekEnum.MONDAY : activeDay)}
          className="bg-[#45AC5E] hover:bg-[#3d9853] text-white text-xs h-8 gap-1.5"
        >
          <Plus className="h-3.5 w-3.5" />
          Add Schedule Slot
        </Button>
      </div>

      {isLoading ? (
        <div className="py-12 text-center">
          <Loader2 className="mx-auto h-6 w-6 animate-spin text-slate-400" />
          <p className="mt-2 text-xs text-slate-500">Loading timetable schedule...</p>
        </div>
      ) : slots.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-200 p-8 text-center bg-slate-50/50">
          <Calendar className="mx-auto h-8 w-8 text-slate-300 mb-2" />
          <h4 className="text-sm font-semibold text-slate-700">No Schedule Slots Yet</h4>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Click &ldquo;Add Schedule Slot&rdquo; to build the weekly timetable for this class.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {daysToRender.map((day) => {
            const daySlots = slots
              .filter((s) => s.dayOfWeek === day)
              .sort((a, b) => a.startTime.localeCompare(b.startTime));

            return (
              <div
                key={day}
                className="rounded-lg border border-slate-200 bg-white p-3.5 shadow-sm space-y-3"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-[#45AC5E]" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                      {day}
                    </h4>
                  </div>
                  <button
                    onClick={() => handleAddSlot(day)}
                    className="text-slate-400 hover:text-[#45AC5E] text-xs font-medium flex items-center gap-0.5"
                    title="Add slot to this day"
                  >
                    <Plus className="h-3 w-3" />
                    <span>Add</span>
                  </button>
                </div>

                {daySlots.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-3 text-center">
                    No classes scheduled
                  </p>
                ) : (
                  <div className="space-y-2.5">
                    {daySlots.map((slot) => (
                      <div
                        key={slot.id}
                        className="group relative rounded-md border border-slate-100 bg-slate-50/80 p-2.5 transition-all hover:bg-slate-50 hover:shadow-sm"
                        style={{
                          borderLeftWidth: "4px",
                          borderLeftColor: slot.colorTag || "#45AC5E",
                        }}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="text-xs font-bold text-slate-800">
                              {slot.subject}
                            </span>
                            {slot.subjectCode && (
                              <span className="ml-1.5 text-[10px] text-slate-400 font-mono">
                                ({slot.subjectCode})
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleEditSlot(slot)}
                              className="p-1 hover:text-[#45AC5E] text-slate-400"
                              title="Edit slot"
                            >
                              <Edit2 className="h-3 w-3" />
                            </button>
                            <button
                              onClick={() => handleDeleteSlot(slot.id)}
                              className="p-1 hover:text-red-500 text-slate-400"
                              title="Delete slot"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </div>

                        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3 text-slate-400" />
                            <span>
                              {slot.startTime} - {slot.endTime}
                            </span>
                          </div>

                          {slot.room && (
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3 text-slate-400" />
                              <span>{slot.room}</span>
                            </div>
                          )}

                          {slot.teacherName && (
                            <div className="flex items-center gap-1">
                              <User className="h-3 w-3 text-slate-400" />
                              <span>{slot.teacherName}</span>
                            </div>
                          )}
                        </div>

                        {slot.notes && (
                          <p className="mt-1.5 text-[10px] text-slate-400 border-t border-slate-200/50 pt-1">
                            {slot.notes}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Timetable Slot Editor Dialog */}
      <TimetableSlotDialog
        open={slotModalOpen}
        onOpenChange={setSlotModalOpen}
        classId={classId}
        slot={selectedSlot}
        defaultDay={selectedDay}
      />
    </div>
  );
}
