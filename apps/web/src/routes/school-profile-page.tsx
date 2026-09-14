import { type FC } from "react";
import {
  SchoolProfileCard,
  SchoolLogoUploader,
  useSchoolProfileQuery,
} from "@/features/settings";

export const SchoolProfilePage: FC = () => {
  const { data: profile, isLoading: isProfileLoading } = useSchoolProfileQuery();

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-2 p-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-black tracking-tight text-slate-900 font-sans">
          School Profile &amp; Identity
        </h1>
        <p className="text-sm text-slate-500">
          Manage your institutional identity, campus location, official contact numbers, crest/logo, and bill receipt policies.
        </p>
      </div>

      {/* Cards */}
      <div className="space-y-6">
        <SchoolProfileCard profile={profile} isLoading={isProfileLoading} />
        <SchoolLogoUploader
          currentLogoUrl={profile?.logoUrl}
          schoolName={profile?.name}
          motto={profile?.motto || undefined}
        />
      </div>
    </div>
  );
};
