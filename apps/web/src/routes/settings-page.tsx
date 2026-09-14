import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  SchoolProfileCard,
  SchoolLogoUploader,
  TelegramIntegrationCard,
  useSchoolProfileQuery,
  useTelegramIntegrationQuery,
} from "@/features/settings";
import { Building2, Send } from "lucide-react";

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState<string>("profile");

  const { data: profile, isLoading: isProfileLoading } = useSchoolProfileQuery();
  const { data: telegram, isLoading: isTelegramLoading } = useTelegramIntegrationQuery();

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-2">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black tracking-tight text-slate-900 font-sans">
          School Settings &amp; Integrations
        </h1>
        <p className="text-sm text-slate-500">
          Manage your institution&apos;s identity, branding crest/logo, bill receipt customization, and automated Telegram alert channels.
        </p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-slate-100 p-1 border border-slate-200">
          <TabsTrigger
            value="profile"
            className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-2xs text-xs font-semibold"
          >
            <Building2 className="h-4 w-4 text-[#45AC5E]" />
            <span>School Profile &amp; Branding</span>
          </TabsTrigger>
          <TabsTrigger
            value="telegram"
            className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-2xs text-xs font-semibold"
          >
            <Send className="h-4 w-4 text-[#0088cc]" />
            <span>Telegram Bot Integration</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6 mt-0">
          <SchoolProfileCard profile={profile} isLoading={isProfileLoading} />
          <SchoolLogoUploader
            currentLogoUrl={profile?.logoUrl}
            schoolName={profile?.name}
            motto={profile?.motto || undefined}
          />
        </TabsContent>

        <TabsContent value="telegram" className="space-y-6 mt-0">
          <TelegramIntegrationCard
            integration={telegram}
            isLoading={isTelegramLoading}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
