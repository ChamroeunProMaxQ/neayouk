import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import {
  UpdateSchoolProfileSchema,
  type SchoolProfileDto,
  type UpdateSchoolProfileDto,
} from "@repo/contracts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Building2, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { useUpdateSchoolProfileMutation } from "../hooks/use-school-settings-mutations";

interface SchoolProfileCardProps {
  profile?: SchoolProfileDto | null;
  isLoading?: boolean;
}

function createZodResolver(schema: typeof UpdateSchoolProfileSchema) {
  return async (values: UpdateSchoolProfileDto) => {
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

export function SchoolProfileCard({ profile, isLoading }: SchoolProfileCardProps) {
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const updateMutation = useUpdateSchoolProfileMutation();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<UpdateSchoolProfileDto>({
    resolver: createZodResolver(UpdateSchoolProfileSchema),
    defaultValues: {
      name: "",
      nameKhmer: "",
      code: "",
      phone: "",
      email: "",
      website: "",
      motto: "",
      address: "",
      receiptFooterTerms: "",
      receiptSignatureTitle: "",
    },
  });

  useEffect(() => {
    if (profile) {
      reset({
        name: profile.name || "",
        nameKhmer: profile.nameKhmer || "",
        code: profile.code || "",
        phone: profile.phone || "",
        email: profile.email || "",
        website: profile.website || "",
        motto: profile.motto || "",
        address: profile.address || "",
        receiptFooterTerms: profile.receiptFooterTerms || "",
        receiptSignatureTitle: profile.receiptSignatureTitle || "Authorized Cashier",
      });
    }
  }, [profile, reset]);

  const onSubmit = (data: UpdateSchoolProfileDto) => {
    setSuccessMessage(null);
    setErrorMessage(null);

    updateMutation.mutate(data, {
      onSuccess: () => {
        setSuccessMessage("School profile updated successfully!");
        setTimeout(() => setSuccessMessage(null), 4000);
      },
      onError: (err: any) => {
        const msg =
          err?.response?.data?.message || err?.message || "Failed to update profile";
        setErrorMessage(typeof msg === "string" ? msg : JSON.stringify(msg));
      },
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#45AC5E]" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-slate-200 shadow-xs">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-[#45AC5E]" />
          <CardTitle className="text-lg font-bold text-slate-900">
            School & Branch Identity
          </CardTitle>
        </div>
        <CardDescription>
          Configure official institutional names, contact channels, campus location, and receipt terms.
        </CardDescription>
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

          {/* Section 1: Names */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-xs font-semibold text-slate-700">
                School Name (English) <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="name"
                placeholder="e.g. Neayouk International School"
                {...register("name")}
                className={errors.name ? "border-rose-500" : ""}
              />
              {errors.name && (
                <p className="text-xs text-rose-500">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="nameKhmer" className="text-xs font-semibold text-slate-700">
                School Name (Khmer)
              </Label>
              <Input
                id="nameKhmer"
                placeholder="e.g. សាលាអន្តរជាតិ នាយក"
                {...register("nameKhmer")}
              />
            </div>
          </div>

          {/* Section 2: Code & Motto */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="code" className="text-xs font-semibold text-slate-700">
                Branch Code / Identifier <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="code"
                placeholder="e.g. MAIN"
                {...register("code")}
                className={errors.code ? "border-rose-500" : ""}
              />
              {errors.code && (
                <p className="text-xs text-rose-500">{errors.code.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="motto" className="text-xs font-semibold text-slate-700">
                School Motto / Tagline
              </Label>
              <Input
                id="motto"
                placeholder="e.g. Morality, Quality, Virtue"
                {...register("motto")}
              />
            </div>
          </div>

          {/* Section 3: Contact Channels */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="phone" className="text-xs font-semibold text-slate-700">
                Contact Phone / Hotline
              </Label>
              <Input
                id="phone"
                placeholder="e.g. 023 888 999"
                {...register("phone")}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-semibold text-slate-700">
                Official Support Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="e.g. contact@school.edu.kh"
                {...register("email")}
                className={errors.email ? "border-rose-500" : ""}
              />
              {errors.email && (
                <p className="text-xs text-rose-500">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="website" className="text-xs font-semibold text-slate-700">
                School Website URL
              </Label>
              <Input
                id="website"
                placeholder="e.g. https://school.edu.kh"
                {...register("website")}
                className={errors.website ? "border-rose-500" : ""}
              />
              {errors.website && (
                <p className="text-xs text-rose-500">{errors.website.message}</p>
              )}
            </div>
          </div>

          {/* Section 4: Address */}
          <div className="space-y-1.5">
            <Label htmlFor="address" className="text-xs font-semibold text-slate-700">
              Campus Physical Address
            </Label>
            <Input
              id="address"
              placeholder="e.g. No. 123, Russian Federation Blvd, Sangkat Teuk Laak I, Phnom Penh"
              {...register("address")}
            />
          </div>

          {/* Section 5: Bill Receipt Customization */}
          <div className="border-t border-slate-100 pt-5">
            <h4 className="text-sm font-bold text-slate-800 mb-1">
              Receipt & Invoice Customization
            </h4>
            <p className="text-xs text-slate-500 mb-4">
              These terms appear directly on official printable A5 school receipts.
            </p>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label
                  htmlFor="receiptFooterTerms"
                  className="text-xs font-semibold text-slate-700"
                >
                  Custom Receipt Terms & Policies
                </Label>
                <Textarea
                  id="receiptFooterTerms"
                  rows={3}
                  placeholder="e.g. 1. All fee payments are strictly non-refundable.\n2. Please retain this receipt for verification."
                  {...register("receiptFooterTerms")}
                />
              </div>

              <div className="w-full sm:w-1/2 space-y-1.5">
                <Label
                  htmlFor="receiptSignatureTitle"
                  className="text-xs font-semibold text-slate-700"
                >
                  Cashier / Signature Box Title
                </Label>
                <Input
                  id="receiptSignatureTitle"
                  placeholder="e.g. Authorized Cashier / Finance Office"
                  {...register("receiptSignatureTitle")}
                />
              </div>
            </div>
          </div>
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
            Save Profile Changes
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
