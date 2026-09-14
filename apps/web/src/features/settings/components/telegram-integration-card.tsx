import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import {
  UpdateTelegramIntegrationSchema,
  type TelegramIntegrationDto,
  type UpdateTelegramIntegrationDto,
} from "@repo/contracts";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Send,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Loader2,
  HelpCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  useTestTelegramMutation,
  useUpdateTelegramIntegrationMutation,
} from "../hooks/use-school-settings-mutations";

interface TelegramIntegrationCardProps {
  integration?: TelegramIntegrationDto | null;
  isLoading?: boolean;
}

function createZodResolver(schema: typeof UpdateTelegramIntegrationSchema) {
  return async (values: UpdateTelegramIntegrationDto) => {
    const result = await schema.safeParseAsync(values);
    if (result.success) {
      return { values: result.data, errors: {} };
    }
    const errors: Record<string, { type: string; message: string }> = {};
    for (const issue of result.error.issues) {
      const path = String(issue.path[0] || "");
      if (path && !errors[path]) {
        errors[path] = {
          type: issue.code,
          message: issue.message,
        };
      }
    }
    return { values: {}, errors };
  };
}

export function TelegramIntegrationCard({
  integration,
  isLoading,
}: TelegramIntegrationCardProps) {
  const [showToken, setShowToken] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [showAdvancedChannels, setShowAdvancedChannels] = useState(false);
  const [testCategory, setTestCategory] = useState<
    "default" | "attendance" | "payment" | "leave" | "announcement"
  >("default");

  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [testFeedback, setTestFeedback] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const updateMutation = useUpdateTelegramIntegrationMutation();
  const testMutation = useTestTelegramMutation();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isDirty },
  } = useForm<UpdateTelegramIntegrationDto>({
    resolver: createZodResolver(UpdateTelegramIntegrationSchema),
    defaultValues: {
      isEnabled: false,
      botToken: "",
      defaultChatId: "",
      attendanceChatId: "",
      paymentChatId: "",
      leaveChatId: "",
      announcementChatId: "",
      notificationEvents: {
        attendance: true,
        payment: true,
        leave: true,
        announcement: false,
      },
    },
  });

  const isEnabled = watch("isEnabled");
  const notificationEvents = watch("notificationEvents");

  useEffect(() => {
    if (integration) {
      reset({
        isEnabled: integration.isEnabled ?? false,
        botToken: integration.botTokenMasked || "",
        defaultChatId: integration.defaultChatId || "",
        attendanceChatId: integration.attendanceChatId || "",
        paymentChatId: integration.paymentChatId || "",
        leaveChatId: integration.leaveChatId || "",
        announcementChatId: integration.announcementChatId || "",
        notificationEvents: integration.notificationEvents || {
          attendance: true,
          payment: true,
          leave: true,
          announcement: false,
        },
      });
    }
  }, [integration, reset]);

  const onSubmit = (data: UpdateTelegramIntegrationDto) => {
    setSuccessMessage(null);
    setErrorMessage(null);
    setTestFeedback(null);

    updateMutation.mutate(data, {
      onSuccess: () => {
        setSuccessMessage("Telegram configuration saved successfully!");
        setTimeout(() => setSuccessMessage(null), 4000);
      },
      onError: (err: any) => {
        const msg =
          err?.response?.data?.message ||
          err?.message ||
          "Failed to update Telegram settings.";
        setErrorMessage(typeof msg === "string" ? msg : JSON.stringify(msg));
      },
    });
  };

  const handleTestConnection = () => {
    setTestFeedback(null);
    testMutation.mutate(
      { targetCategory: testCategory },
      {
        onSuccess: (res) => {
          setTestFeedback({
            success: res.success,
            message: res.message,
          });
        },
        onError: (err: any) => {
          const msg =
            err?.response?.data?.message ||
            err?.message ||
            "Test connection failed.";
          setTestFeedback({
            success: false,
            message: typeof msg === "string" ? msg : JSON.stringify(msg),
          });
        },
      }
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#0088cc]" />
        </CardContent>
      </Card>
    );
  }

  const isConfigured = Boolean(
    integration?.isConfigured || integration?.botTokenMasked
  );

  return (
    <Card className="border-slate-200 shadow-xs">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-[#0088cc]/10 text-[#0088cc]">
              <Send className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg font-bold text-slate-900">
                Telegram Bot Integration
              </CardTitle>
              <CardDescription>
                Connect your institution&apos;s custom Telegram bot to dispatch automated real-time alerts.
              </CardDescription>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isConfigured && integration?.lastTestStatus === "SUCCESS" ? (
              <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-emerald-200 gap-1 font-semibold">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Connected ({integration.botUsername || "Bot"})
              </Badge>
            ) : isConfigured ? (
              <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 border-amber-200 gap-1 font-semibold">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                Configured (Unverified)
              </Badge>
            ) : (
              <Badge variant="outline" className="text-slate-500 font-normal">
                Not Configured
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <form onSubmit={handleSubmit(onSubmit)}>
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

          {/* Collapsible Setup Guide */}
          <div className="rounded-xl border border-sky-100 bg-sky-50/60 p-4">
            <button
              type="button"
              onClick={() => setShowGuide((prev) => !prev)}
              className="flex w-full items-center justify-between text-left text-xs font-bold text-sky-900"
            >
              <div className="flex items-center gap-1.5">
                <HelpCircle className="h-4 w-4 text-sky-600" />
                <span>How to set up your Telegram School Bot (4 Steps)</span>
              </div>
              {showGuide ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>

            {showGuide && (
              <ol className="mt-3 list-decimal list-inside space-y-1.5 text-xs text-sky-800/90 pl-1 leading-relaxed">
                <li>
                  Open Telegram and search for <strong>@BotFather</strong>.
                </li>
                <li>
                  Send <code>/newbot</code>, choose a display name (e.g. &quot;My School Alerts&quot;) and username ending in <code>_bot</code>.
                </li>
                <li>
                  Copy the generated <strong>HTTP API Token</strong> and paste it into the Bot Token field below.
                </li>
                <li>
                  Create a Telegram group or channel for your department (Finance, Attendance, Staff), add your bot as an <strong>Administrator</strong>, and paste the Chat ID.
                </li>
              </ol>
            )}
          </div>

          {/* Master Enable Switch */}
          <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-slate-50/50">
            <div>
              <p className="text-sm font-bold text-slate-800">
                Enable Telegram Dispatch
              </p>
              <p className="text-xs text-slate-500">
                Toggle all automated background Telegram notifications on or off.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={Boolean(isEnabled)}
                onChange={(e) => setValue("isEnabled", e.target.checked, { shouldDirty: true })}
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0088cc]" />
            </label>
          </div>

          {/* Credentials Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label
                htmlFor="botToken"
                className="text-xs font-semibold text-slate-700"
              >
                Telegram Bot API Token <span className="text-rose-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="botToken"
                  type={showToken ? "text" : "password"}
                  placeholder="e.g. 123456789:ABCdef..."
                  {...register("botToken")}
                  className={errors.botToken ? "border-rose-500 pr-10 font-mono text-xs" : "pr-10 font-mono text-xs"}
                />
                <button
                  type="button"
                  onClick={() => setShowToken((prev) => !prev)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showToken ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.botToken && (
                <p className="text-xs text-rose-500">{errors.botToken.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="defaultChatId"
                className="text-xs font-semibold text-slate-700"
              >
                Master Default Chat ID / Channel <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="defaultChatId"
                placeholder="e.g. -1001234567890 or @MySchoolAlerts"
                {...register("defaultChatId")}
                className={errors.defaultChatId ? "border-rose-500 font-mono text-xs" : "font-mono text-xs"}
              />
              {errors.defaultChatId && (
                <p className="text-xs text-rose-500">
                  {errors.defaultChatId.message}
                </p>
              )}
            </div>
          </div>

          {/* Advanced Channel Routing Override */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => setShowAdvancedChannels((prev) => !prev)}
              className="flex w-full items-center justify-between p-3.5 text-left text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 transition-colors"
            >
              <span>Multi-Channel Department Routing (Optional Overrides)</span>
              {showAdvancedChannels ? (
                <ChevronUp className="h-4 w-4 text-slate-500" />
              ) : (
                <ChevronDown className="h-4 w-4 text-slate-500" />
              )}
            </button>

            {showAdvancedChannels && (
              <div className="p-4 space-y-3 bg-white">
                <p className="text-xs text-slate-500">
                  If left empty, alerts automatically route to your Master Default Chat ID.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label
                      htmlFor="paymentChatId"
                      className="text-[11px] font-semibold text-slate-600"
                    >
                      💳 Finance &amp; Payment Receipts Group
                    </Label>
                    <Input
                      id="paymentChatId"
                      placeholder="e.g. -1009876543210"
                      {...register("paymentChatId")}
                      className="font-mono text-xs h-8"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label
                      htmlFor="attendanceChatId"
                      className="text-[11px] font-semibold text-slate-600"
                    >
                      📢 Attendance Truancy &amp; Absent Alerts Group
                    </Label>
                    <Input
                      id="attendanceChatId"
                      placeholder="e.g. -1009876543211"
                      {...register("attendanceChatId")}
                      className="font-mono text-xs h-8"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label
                      htmlFor="leaveChatId"
                      className="text-[11px] font-semibold text-slate-600"
                    >
                      📝 HR &amp; Staff Leave Requests Group
                    </Label>
                    <Input
                      id="leaveChatId"
                      placeholder="e.g. -1009876543212"
                      {...register("leaveChatId")}
                      className="font-mono text-xs h-8"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label
                      htmlFor="announcementChatId"
                      className="text-[11px] font-semibold text-slate-600"
                    >
                      📣 School-wide Announcements Channel
                    </Label>
                    <Input
                      id="announcementChatId"
                      placeholder="e.g. @MySchoolPublicNews"
                      {...register("announcementChatId")}
                      className="font-mono text-xs h-8"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Automated Notification Subscriptions */}
          <div className="space-y-2">
            <Label className="text-xs font-bold text-slate-700">
              Subscribed Event Alerts
            </Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {[
                {
                  key: "attendance",
                  label: "Student Daily Attendance",
                  desc: "Send alerts when a student is marked absent or unexcused",
                },
                {
                  key: "payment",
                  label: "Fee Payments & Receipts",
                  desc: "Send instant notification when a payment receipt is issued",
                },
                {
                  key: "leave",
                  label: "Staff & Student Leave Requests",
                  desc: "Notify on new submissions and manager approvals/rejections",
                },
                {
                  key: "announcement",
                  label: "Broadcast Announcements",
                  desc: "Dispatch official school circulars to Telegram subscribers",
                },
              ].map((item) => {
                const checked = Boolean(
                  notificationEvents?.[item.key as keyof typeof notificationEvents]
                );
                return (
                  <label
                    key={item.key}
                    className="flex items-start gap-2.5 p-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50/60 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) =>
                        setValue(
                          `notificationEvents.${item.key as keyof typeof notificationEvents}`,
                          e.target.checked,
                          { shouldDirty: true }
                        )
                      }
                      className="mt-0.5 rounded-sm border-slate-300 text-[#0088cc] focus:ring-[#0088cc]"
                    />
                    <div>
                      <p className="text-xs font-bold text-slate-800">
                        {item.label}
                      </p>
                      <p className="text-[11px] text-slate-500 leading-snug">
                        {item.desc}
                      </p>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Test Connection Zone */}
          {isConfigured && (
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <p className="text-xs font-bold text-slate-800">
                    Live Telegram Connection Test
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Dispatches a styled test announcement to verify channel reachability.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={testCategory}
                    onChange={(e: any) => setTestCategory(e.target.value)}
                    className="text-xs border border-slate-300 rounded-md px-2 py-1 bg-white"
                  >
                    <option value="default">Default Channel</option>
                    <option value="payment">Finance Channel</option>
                    <option value="attendance">Attendance Channel</option>
                    <option value="leave">HR Channel</option>
                  </select>

                  <Button
                    type="button"
                    size="sm"
                    onClick={handleTestConnection}
                    disabled={testMutation.isPending}
                    className="bg-[#0088cc] hover:bg-[#0077b5] text-white text-xs"
                  >
                    {testMutation.isPending && (
                      <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    )}
                    Send Test Message
                  </Button>
                </div>
              </div>

              {testFeedback && (
                <div
                  className={`flex items-start gap-2 p-3 rounded-lg text-xs ${
                    testFeedback.success
                      ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
                      : "bg-rose-50 border border-rose-200 text-rose-800"
                  }`}
                >
                  {testFeedback.success ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
                  ) : (
                    <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
                  )}
                  <span>{testFeedback.message}</span>
                </div>
              )}
            </div>
          )}
        </CardContent>

        <CardFooter className="flex justify-end border-t border-slate-100 pt-4">
          <Button
            type="submit"
            disabled={updateMutation.isPending || !isDirty}
            className="bg-[#45AC5E] hover:bg-[#3d9652] text-white"
          >
            {updateMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Save Telegram Settings
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
