import { type FC } from "react";
import { type TelegramIntegrationDto } from "@repo/contracts";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Send,
  MessageSquare,
  QrCode,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  Loader2,
} from "lucide-react";

interface IntegrationListTableProps {
  integration?: TelegramIntegrationDto | null;
  isLoading?: boolean;
  onConfigureTelegram?: () => void;
}

export const IntegrationListTable: FC<IntegrationListTableProps> = ({
  integration,
  isLoading,
  onConfigureTelegram,
}) => {
  const isTelegramConfigured = Boolean(
    integration?.isConfigured || integration?.botTokenMasked
  );
  const isTelegramActive = Boolean(integration?.isEnabled && isTelegramConfigured);

  const activeEventCount = integration?.notificationEvents
    ? Object.values(integration.notificationEvents).filter(Boolean).length
    : 0;

  const integrations = [
    {
      id: "telegram",
      name: "Telegram Bot Notifications",
      provider: "TELEGRAM",
      description: "Automated student attendance, fee receipts, and staff leave alerts.",
      icon: Send,
      iconBg: "bg-[#0088cc]/10 text-[#0088cc]",
      destination: integration?.botUsername
        ? `@${integration.botUsername}`
        : integration?.defaultChatId || "Not configured",
      routingSummary: `${activeEventCount} alert triggers active`,
      status: isTelegramActive
        ? "CONNECTED"
        : isTelegramConfigured
        ? "DISABLED"
        : "NOT_CONFIGURED",
      lastTested: integration?.lastTestedAt
        ? new Date(integration.lastTestedAt).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })
        : "Never tested",
      testStatus: integration?.lastTestStatus || "NOT_TESTED",
      isConfigurable: true,
    },
    {
      id: "khqr",
      name: "Bakong KHQR Payment Gateway",
      provider: "BAKONG",
      description: "Direct merchant QR code generation and instant settlement verification.",
      icon: QrCode,
      iconBg: "bg-rose-50 text-rose-600",
      destination: "National Bank of Cambodia Open API",
      routingSummary: "Tuition & fee collections",
      status: "SYSTEM_BUILTIN",
      lastTested: "Online",
      testStatus: "SUCCESS",
      isConfigurable: false,
    },
    {
      id: "sms",
      name: "SMS Gateway (Cellcard / Smart)",
      provider: "SMS",
      description: "Direct SMS delivery for emergency absent alerts and critical security OTPs.",
      icon: MessageSquare,
      iconBg: "bg-amber-50 text-amber-600",
      destination: "Local Telco SMS Aggregator",
      routingSummary: "Emergency broadcasts",
      status: "COMING_SOON",
      lastTested: "—",
      testStatus: "NOT_TESTED",
      isConfigurable: false,
    },
  ];

  return (
    <Card className="border-slate-200 shadow-xs">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <CardTitle className="text-lg font-bold text-slate-900">
              Connected Channels &amp; Integrations
            </CardTitle>
            <CardDescription>
              Overview of all external notification engines, messaging bots, and communication gateways connected to this branch.
            </CardDescription>
          </div>
          <Badge variant="outline" className="w-fit gap-1 text-slate-600 border-slate-200 text-xs">
            <Sparkles className="h-3 w-3 text-[#45AC5E]" />
            <span>3 Channels Registered</span>
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50/80">
              <TableRow className="border-b border-slate-100">
                <TableHead className="py-3 text-xs font-bold text-slate-700 w-2/5">
                  Integration / Provider
                </TableHead>
                <TableHead className="py-3 text-xs font-bold text-slate-700 w-1/5">
                  Destination / Channel
                </TableHead>
                <TableHead className="py-3 text-xs font-bold text-slate-700 w-1/6">
                  Status
                </TableHead>
                <TableHead className="py-3 text-xs font-bold text-slate-700 w-1/6">
                  Last Verification
                </TableHead>
                <TableHead className="py-3 text-right text-xs font-bold text-slate-700 w-24">
                  Action
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-slate-100">
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-slate-400">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-[#0088cc]" />
                  </TableCell>
                </TableRow>
              ) : (
                integrations.map((item) => {
                  const Icon = item.icon;
                  return (
                    <TableRow key={item.id} className="hover:bg-slate-50/60 transition-colors">
                    {/* Provider & Description */}
                    <TableCell className="py-3.5">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg shrink-0 mt-0.5 ${item.iconBg}`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-slate-900 truncate">
                              {item.name}
                            </span>
                            <span className="text-[10px] font-mono text-slate-400 uppercase bg-slate-100 px-1.5 py-0.2 rounded-xs">
                              {item.provider}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                            {item.description}
                          </p>
                        </div>
                      </div>
                    </TableCell>

                    {/* Destination Channel */}
                    <TableCell className="py-3.5 text-xs text-slate-700">
                      <div className="font-mono text-[11px] text-slate-800 font-medium truncate max-w-[180px]">
                        {item.destination}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {item.routingSummary}
                      </div>
                    </TableCell>

                    {/* Status Badge */}
                    <TableCell className="py-3.5">
                      {item.status === "CONNECTED" && (
                        <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-emerald-200 gap-1 font-semibold text-[11px]">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          Connected &amp; Active
                        </Badge>
                      )}
                      {item.status === "DISABLED" && (
                        <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 border-amber-200 gap-1 font-semibold text-[11px]">
                          <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                          Configured (Disabled)
                        </Badge>
                      )}
                      {item.status === "NOT_CONFIGURED" && (
                        <Badge variant="outline" className="text-slate-500 border-slate-200 font-normal text-[11px]">
                          Not Configured
                        </Badge>
                      )}
                      {item.status === "SYSTEM_BUILTIN" && (
                        <Badge className="bg-sky-100 text-sky-800 hover:bg-sky-100 border-sky-200 gap-1 font-semibold text-[11px]">
                          <CheckCircle2 className="h-3 w-3 text-sky-600" />
                          Built-in
                        </Badge>
                      )}
                      {item.status === "COMING_SOON" && (
                        <Badge variant="outline" className="text-slate-400 border-dashed border-slate-300 font-normal text-[11px]">
                          Coming Soon
                        </Badge>
                      )}
                    </TableCell>

                    {/* Last Verification */}
                    <TableCell className="py-3.5 text-xs">
                      <div className="flex items-center gap-1.5 text-slate-600">
                        {item.testStatus === "SUCCESS" ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                        ) : item.testStatus === "FAILED" ? (
                          <AlertCircle className="h-3.5 w-3.5 text-rose-500 shrink-0" />
                        ) : (
                          <Clock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        )}
                        <span className="text-[11px] font-medium">{item.lastTested}</span>
                      </div>
                    </TableCell>

                    {/* Action Button */}
                    <TableCell className="py-3.5 text-right">
                      {item.isConfigurable ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={onConfigureTelegram}
                          className="h-7 text-xs border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-100"
                        >
                          Configure
                        </Button>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">Static</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              }))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
