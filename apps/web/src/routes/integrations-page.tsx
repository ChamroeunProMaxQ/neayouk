import { useRef, type FC } from "react";
import {
  IntegrationListTable,
  TelegramIntegrationCard,
  useTelegramIntegrationQuery,
} from "@/features/settings";

export const IntegrationsPage: FC = () => {
  const { data: telegram, isLoading: isTelegramLoading } = useTelegramIntegrationQuery();
  const configRef = useRef<HTMLDivElement>(null);

  const handleScrollToConfig = () => {
    configRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-2 p-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-black tracking-tight text-slate-900 font-sans">
          School Integrations
        </h1>
        <p className="text-sm text-slate-500">
          Connect your institution with third-party messaging services, Telegram bot notification channels, and external platforms.
        </p>
      </div>

      {/* Sub-Table of Integrations */}
      <IntegrationListTable
        integration={telegram}
        isLoading={isTelegramLoading}
        onConfigureTelegram={handleScrollToConfig}
      />

      {/* Dedicated Integration Config Card */}
      <div ref={configRef}>
        <TelegramIntegrationCard
          integration={telegram}
          isLoading={isTelegramLoading}
        />
      </div>
    </div>
  );
};
