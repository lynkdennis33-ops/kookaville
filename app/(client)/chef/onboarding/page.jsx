"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ChefHat,
  CheckCircle2,
  XCircle,
  Clock,
  X,
  AlertCircle,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  DollarSign,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Stepper } from "@/components/ui/stepper";
import { RequireAuth } from "@/components/shared/require-auth";
import { LoadingPage } from "@/components/shared/loading";
import { useAuth } from "@/context/AuthContext";
import {
  getMyChefProfile,
  createChefProfile,
  updateChefProfile,
  resubmitChefProfile,
} from "@/services/chef.service";
import { cn } from "@/lib/utils";

// ─── Constants ────────────────────────────────────────────────────────────────

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const CUISINE_OPTIONS = [
  "American",
  "Asian Fusion",
  "Barbecue",
  "Brazilian",
  "Caribbean",
  "Chinese",
  "French",
  "Greek",
  "Indian",
  "Italian",
  "Japanese",
  "Korean",
  "Mediterranean",
  "Mexican",
  "Middle Eastern",
  "Moroccan",
  "Spanish",
  "Thai",
  "Vietnamese",
];

const STEPS = [
  { title: "Your Story" },
  { title: "Expertise" },
  { title: "Schedule" },
  { title: "Review" },
];

function buildTimeOptions() {
  const opts = [];
  for (let h = 6; h <= 23; h++) {
    ["00", "30"].forEach((m) => {
      opts.push(`${String(h).padStart(2, "0")}:${m}`);
    });
  }
  return opts;
}

const TIME_OPTIONS = buildTimeOptions();

function getDefaultAvailability() {
  return DAYS.reduce((acc, day) => {
    acc[day] = { enabled: false, startTime: "09:00", endTime: "17:00" };
    return acc;
  }, {});
}

// ─── ChipInput ────────────────────────────────────────────────────────────────

function ChipInput({ chips, onAdd, onRemove, placeholder = "Type and press Enter", error }) {
  const [val, setVal] = useState("");

  function tryAdd() {
    const trimmed = val.trim();
    if (!trimmed || chips.includes(trimmed) || chips.length >= 30) return;
    onAdd(trimmed);
    setVal("");
  }

  return (
    <div
      className={cn(
        "flex flex-wrap gap-2 min-h-11 border border-border rounded-lg p-2 bg-background focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2",
        error && "border-red-500 focus-within:ring-red-500",
      )}
    >
      {chips.map((chip) => (
        <span
          key={chip}
          className="inline-flex items-center gap-1.5 bg-primary/10 text-primary rounded-full px-3 py-1 text-sm font-medium"
        >
          {chip}
          <button
            type="button"
            onClick={() => onRemove(chip)}
            className="hover:text-red-500 transition-colors"
            aria-label={`Remove ${chip}`}
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}
      <input
        type="text"
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            tryAdd();
          } else if (e.key === "Backspace" && !val && chips.length > 0) {
            onRemove(chips[chips.length - 1]);
          }
        }}
        onBlur={tryAdd}
        placeholder={chips.length === 0 ? placeholder : "Add more…"}
        className="flex-1 min-w-[140px] outline-none text-sm bg-transparent placeholder:text-muted-foreground"
      />
    </div>
  );
}

// ─── Page entry point ─────────────────────────────────────────────────────────

export default function ChefOnboardingPage() {
  return (
    <RequireAuth>
      <OnboardingContent />
    </RequireAuth>
  );
}

// ─── Main content ─────────────────────────────────────────────────────────────

function OnboardingContent() {
  const { refreshUser } = useAuth();
  const queryClient = useQueryClient();

  const { data: profile, isLoading } = useQuery({
    queryKey: ["my-chef-profile"],
    queryFn: async () => {
      try {
        return await getMyChefProfile();
      } catch (err) {
        if (err.response?.status === 404) return null;
        throw err;
      }
    },
    retry: false,
  });

  const handleRefresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ["my-chef-profile"] });
    await refreshUser();
  };

  if (isLoading) return <LoadingPage text="Checking your application status…" />;

  if (profile) {
    return <ProfileStatusView profile={profile} onRefresh={handleRefresh} />;
  }

  return <ApplicationForm onSuccess={handleRefresh} />;
}

// ─── Status views ─────────────────────────────────────────────────────────────

function ProfileStatusView({ profile, onRefresh }) {
  const { verificationStatus } = profile;
  if (verificationStatus === "approved") return <ApprovedView />;
  if (verificationStatus === "pending") return <PendingView profile={profile} />;
  if (verificationStatus === "rejected") {
    return <RejectedView profile={profile} onRefresh={onRefresh} />;
  }
  return null;
}

function ApprovedView() {
  const router = useRouter();
  const { refreshUser } = useAuth();

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  async function handleGoToPortal() {
    await refreshUser();
    router.push("/chef-portal/dashboard");
  }

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 py-16">
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-10 text-center">
        <CheckCircle2 className="h-16 w-16 text-emerald-500 mx-auto mb-6" />
        <h1 className="text-2xl font-bold text-emerald-900 mb-3">
          Application Approved!
        </h1>
        <p className="text-emerald-700 mb-8">
          Congratulations! Your chef account has been approved. You can now
          access your chef portal to manage bookings, menus, and earnings.
        </p>
        <Button onClick={handleGoToPortal} size="lg">
          Go to Chef Portal <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function PendingView({ profile }) {
  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 py-16">
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-8">
        <div className="flex items-center gap-3 mb-4">
          <Clock className="h-6 w-6 text-amber-600" />
          <h1 className="text-xl font-bold text-amber-900">
            Application Under Review
          </h1>
        </div>
        <p className="text-amber-700 mb-8">
          Your chef application has been submitted and is currently being
          reviewed by our admin team. You&apos;ll receive a notification once a
          decision has been made.
        </p>

        <div className="bg-white/70 rounded-xl p-6 border border-amber-100">
          <h2 className="text-sm font-semibold text-amber-900 uppercase tracking-wide mb-4">
            Your Application
          </h2>
          <ProfileSummary profile={profile} />
        </div>
      </div>
    </div>
  );
}

function RejectedView({ profile, onRefresh }) {
  const [showEditForm, setShowEditForm] = useState(false);

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 py-16 space-y-6">
      <div className="bg-red-50 border border-red-200 rounded-2xl p-8">
        <div className="flex items-center gap-3 mb-4">
          <XCircle className="h-6 w-6 text-red-600" />
          <h1 className="text-xl font-bold text-red-900">
            Application Not Approved
          </h1>
        </div>

        {profile.verificationNotes && (
          <div className="bg-white border border-red-200 rounded-xl p-4 mb-5">
            <p className="text-xs font-semibold text-red-500 uppercase tracking-wide mb-1">
              Reason
            </p>
            <p className="text-red-700 text-sm">{profile.verificationNotes}</p>
          </div>
        )}

        <p className="text-red-700 text-sm mb-6">
          Please update your application information below and resubmit for
          admin review.
        </p>

        {!showEditForm && (
          <Button
            variant="outline"
            onClick={() => setShowEditForm(true)}
            className="border-red-300 text-red-700 hover:bg-red-100"
          >
            Update &amp; Resubmit Application
          </Button>
        )}
      </div>

      {showEditForm && (
        <ApplicationForm
          initialData={profile}
          isEditing
          onSuccess={onRefresh}
        />
      )}
    </div>
  );
}

// ─── Profile summary (used in pending view) ───────────────────────────────────

function ProfileSummary({ profile }) {
  const availableDays =
    profile.availability?.map((a) => a.day).join(", ") || "—";

  return (
    <dl className="space-y-3">
      {[
        { label: "Bio", value: profile.bio },
        {
          label: "Experience",
          value: `${profile.yearsOfExperience} year${profile.yearsOfExperience === 1 ? "" : "s"}`,
        },
        {
          label: "Specialties",
          value: profile.specialties?.join(", ") || "—",
        },
        { label: "Cuisines", value: profile.cuisines?.join(", ") || "—" },
        {
          label: "Service Areas",
          value: profile.serviceAreas?.join(", ") || "—",
        },
        { label: "Price / Person", value: `$${profile.pricePerPerson}` },
        { label: "Availability", value: availableDays },
      ].map(({ label, value }) => (
        <div key={label} className="grid grid-cols-3 gap-2">
          <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
          <dd className="col-span-2 text-sm text-foreground break-words">
            {value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

// ─── Application form ─────────────────────────────────────────────────────────

function ApplicationForm({ onSuccess, initialData = null, isEditing = false }) {
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState({});

  const [bio, setBio] = useState(initialData?.bio ?? "");
  const [yearsOfExperience, setYearsOfExperience] = useState(
    initialData?.yearsOfExperience != null
      ? String(initialData.yearsOfExperience)
      : "",
  );
  const [specialties, setSpecialties] = useState(
    initialData?.specialties ?? [],
  );
  const [cuisines, setCuisines] = useState(initialData?.cuisines ?? []);
  const [serviceAreas, setServiceAreas] = useState(
    initialData?.serviceAreas ?? [],
  );
  const [pricePerPerson, setPricePerPerson] = useState(
    initialData?.pricePerPerson != null
      ? String(initialData.pricePerPerson)
      : "",
  );
  const [availability, setAvailability] = useState(() => {
    const defaults = getDefaultAvailability();
    initialData?.availability?.forEach(({ day, startTime, endTime }) => {
      if (defaults[day]) defaults[day] = { enabled: true, startTime, endTime };
    });
    return defaults;
  });

  const mutation = useMutation({
    mutationFn: async (payload) => {
      if (isEditing) {
        await updateChefProfile(payload);
        return resubmitChefProfile();
      }
      return createChefProfile(payload);
    },
    onSuccess: async () => {
      toast.success(
        isEditing
          ? "Application updated and resubmitted for review."
          : "Your chef application has been submitted!",
      );
      await onSuccess();
    },
    onError: (err) => {
      const msg =
        err.response?.data?.message || "Failed to submit application.";
      toast.error(msg);
    },
  });

  function validateStep(s) {
    const errs = {};
    if (s === 0) {
      if (!bio.trim() || bio.trim().length < 10)
        errs.bio = "Bio must be at least 10 characters.";
      if (bio.trim().length > 1000)
        errs.bio = "Bio must not exceed 1000 characters.";
      const yoe = Number(yearsOfExperience);
      if (
        yearsOfExperience === "" ||
        isNaN(yoe) ||
        yoe < 0 ||
        !Number.isInteger(yoe)
      )
        errs.yearsOfExperience =
          "Enter a valid number of years (0 or more, whole number).";
    }
    if (s === 1) {
      if (specialties.length === 0)
        errs.specialties = "Add at least one specialty.";
      if (cuisines.length === 0) errs.cuisines = "Select at least one cuisine.";
      if (serviceAreas.length === 0)
        errs.serviceAreas = "Add at least one service area.";
    }
    if (s === 2) {
      const p = Number(pricePerPerson);
      if (!pricePerPerson || isNaN(p) || p <= 0)
        errs.pricePerPerson = "Enter a valid price per person (must be > $0).";
      const enabled = DAYS.filter((d) => availability[d].enabled);
      if (enabled.length === 0)
        errs.availability = "Select at least one available day.";
      enabled.forEach((day) => {
        const { startTime, endTime } = availability[day];
        if (startTime >= endTime)
          errs[`avail_${day}`] = `End time must be after start time.`;
      });
    }
    return errs;
  }

  function handleNext() {
    const errs = validateStep(step);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setStep((s) => s + 1);
  }

  function handleBack() {
    setErrors({});
    setStep((s) => Math.max(0, s - 1));
  }

  async function handleSubmit() {
    const allErrors = {};
    [0, 1, 2].forEach((s) => Object.assign(allErrors, validateStep(s)));
    if (Object.keys(allErrors).length > 0) {
      setErrors(allErrors);
      return;
    }

    mutation.mutate({
      bio: bio.trim(),
      yearsOfExperience: parseInt(yearsOfExperience, 10),
      specialties,
      cuisines,
      serviceAreas,
      pricePerPerson: parseFloat(pricePerPerson),
      availability: DAYS.filter((d) => availability[d].enabled).map((d) => ({
        day: d,
        startTime: availability[d].startTime,
        endTime: availability[d].endTime,
      })),
    });
  }

  function toggleDay(day, checked) {
    setAvailability((prev) => ({
      ...prev,
      [day]: { ...prev[day], enabled: checked },
    }));
  }

  function setTime(day, field, value) {
    setAvailability((prev) => ({
      ...prev,
      [day]: { ...prev[day], [field]: value },
    }));
  }

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-12">
      {!isEditing && (
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-primary/10 mb-6">
            <ChefHat className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-3">
            Become a Kookaville Chef
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Join our exclusive network of culinary professionals. Your
            application will be reviewed by our team.
          </p>
        </div>
      )}

      {isEditing && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold tracking-tight mb-1">
            Update Your Application
          </h2>
          <p className="text-muted-foreground">
            Address the feedback above and resubmit for review.
          </p>
        </div>
      )}

      <div className="bg-card border border-border shadow-sm rounded-2xl p-8">
        <div className="mb-10 max-w-lg mx-auto">
          <Stepper steps={STEPS} currentStep={step} />
        </div>

        {/* ── Step 0: Your Story ──────────────────────────── */}
        {step === 0 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-300">
            <h2 className="text-xl font-bold border-b border-border pb-4">
              Your Story
            </h2>

            <div>
              <label className="block text-sm font-medium mb-2">
                Bio <span className="text-red-500">*</span>
              </label>
              <Textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell clients about your culinary background, signature dishes, and what makes your cooking unique…"
                rows={5}
                error={errors.bio}
                maxLength={1000}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {bio.length}/1000 characters
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Years of Experience <span className="text-red-500">*</span>
              </label>
              <Input
                type="number"
                min="0"
                max="50"
                step="1"
                value={yearsOfExperience}
                onChange={(e) => setYearsOfExperience(e.target.value)}
                placeholder="e.g. 5"
                error={errors.yearsOfExperience}
                className="max-w-xs"
              />
            </div>

            <div className="pt-4 flex justify-end">
              <Button onClick={handleNext}>
                Continue <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* ── Step 1: Expertise ──────────────────────────── */}
        {step === 1 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-3 duration-300">
            <h2 className="text-xl font-bold border-b border-border pb-4">
              Culinary Expertise
            </h2>

            {/* Cuisines */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Cuisines <span className="text-red-500">*</span>
              </label>
              <p className="text-xs text-muted-foreground mb-3">
                Select all cuisines you specialise in.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {CUISINE_OPTIONS.map((c) => (
                  <label
                    key={c}
                    className={cn(
                      "flex items-center gap-2 rounded-lg border px-3 py-2 cursor-pointer text-sm transition-colors",
                      cuisines.includes(c)
                        ? "border-primary bg-primary/10 text-primary font-medium"
                        : "border-border hover:bg-secondary",
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={cuisines.includes(c)}
                      onChange={(e) =>
                        setCuisines((prev) =>
                          e.target.checked
                            ? [...prev, c]
                            : prev.filter((x) => x !== c),
                        )
                      }
                      className="h-3.5 w-3.5 rounded"
                    />
                    {c}
                  </label>
                ))}
              </div>
              {errors.cuisines && (
                <p className="mt-2 text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />{" "}
                  {errors.cuisines}
                </p>
              )}
            </div>

            {/* Specialties */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Specialties <span className="text-red-500">*</span>
              </label>
              <p className="text-xs text-muted-foreground mb-2">
                Type a specialty and press{" "}
                <kbd className="px-1 py-0.5 text-xs bg-muted rounded border border-border">
                  Enter
                </kbd>{" "}
                to add. E.g.: Fine Dining, Farm-to-Table, Pastry &amp; Desserts.
              </p>
              <ChipInput
                chips={specialties}
                onAdd={(v) => setSpecialties((p) => [...p, v])}
                onRemove={(v) =>
                  setSpecialties((p) => p.filter((x) => x !== v))
                }
                placeholder="e.g. Fine Dining"
                error={!!errors.specialties}
              />
              {errors.specialties && (
                <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />{" "}
                  {errors.specialties}
                </p>
              )}
            </div>

            {/* Service Areas */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Service Areas <span className="text-red-500">*</span>
              </label>
              <p className="text-xs text-muted-foreground mb-2">
                Add cities or regions where you&apos;re available to cook. Press{" "}
                <kbd className="px-1 py-0.5 text-xs bg-muted rounded border border-border">
                  Enter
                </kbd>{" "}
                to add each.
              </p>
              <ChipInput
                chips={serviceAreas}
                onAdd={(v) => setServiceAreas((p) => [...p, v])}
                onRemove={(v) =>
                  setServiceAreas((p) => p.filter((x) => x !== v))
                }
                placeholder="e.g. New York, NY"
                error={!!errors.serviceAreas}
              />
              {errors.serviceAreas && (
                <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />{" "}
                  {errors.serviceAreas}
                </p>
              )}
            </div>

            <div className="pt-4 flex justify-between">
              <Button variant="outline" onClick={handleBack}>
                <ChevronLeft className="mr-2 h-4 w-4" /> Back
              </Button>
              <Button onClick={handleNext}>
                Continue <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* ── Step 2: Schedule & Pricing ──────────────────── */}
        {step === 2 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-3 duration-300">
            <h2 className="text-xl font-bold border-b border-border pb-4">
              Schedule &amp; Pricing
            </h2>

            {/* Price */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Price Per Person <span className="text-red-500">*</span>
              </label>
              <Input
                type="number"
                min="1"
                step="1"
                value={pricePerPerson}
                onChange={(e) => setPricePerPerson(e.target.value)}
                placeholder="e.g. 150"
                leftIcon={<DollarSign className="h-4 w-4" />}
                error={errors.pricePerPerson}
                className="max-w-xs"
              />
            </div>

            {/* Availability */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Weekly Availability <span className="text-red-500">*</span>
              </label>
              <p className="text-xs text-muted-foreground mb-4">
                Toggle the days you&apos;re available and set working hours for
                each.
              </p>

              <div className="border border-border rounded-xl overflow-hidden divide-y divide-border">
                {DAYS.map((day) => {
                  const { enabled, startTime, endTime } = availability[day];
                  const timeErr = errors[`avail_${day}`];
                  return (
                    <div
                      key={day}
                      className={cn(
                        "flex items-center gap-4 px-4 py-3 transition-colors",
                        enabled ? "bg-primary/5" : "bg-background",
                      )}
                    >
                      <label className="flex items-center gap-3 cursor-pointer w-32 flex-shrink-0">
                        <input
                          type="checkbox"
                          checked={enabled}
                          onChange={(e) => toggleDay(day, e.target.checked)}
                          className="h-4 w-4 rounded accent-primary"
                        />
                        <span
                          className={cn(
                            "text-sm font-medium",
                            !enabled && "text-muted-foreground",
                          )}
                        >
                          {day}
                        </span>
                      </label>

                      {enabled ? (
                        <div className="flex items-center gap-2 flex-wrap">
                          <select
                            value={startTime}
                            onChange={(e) =>
                              setTime(day, "startTime", e.target.value)
                            }
                            className="h-9 rounded-lg border border-border bg-background px-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                          >
                            {TIME_OPTIONS.map((t) => (
                              <option key={t} value={t}>
                                {t}
                              </option>
                            ))}
                          </select>
                          <span className="text-sm text-muted-foreground">
                            to
                          </span>
                          <select
                            value={endTime}
                            onChange={(e) =>
                              setTime(day, "endTime", e.target.value)
                            }
                            className="h-9 rounded-lg border border-border bg-background px-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                          >
                            {TIME_OPTIONS.map((t) => (
                              <option key={t} value={t}>
                                {t}
                              </option>
                            ))}
                          </select>
                          {timeErr && (
                            <span className="text-xs text-red-500 flex items-center gap-1">
                              <AlertCircle className="h-3 w-3 shrink-0" />{" "}
                              {timeErr}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          Not available
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {errors.availability && (
                <p className="mt-2 text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />{" "}
                  {errors.availability}
                </p>
              )}
            </div>

            <div className="pt-4 flex justify-between">
              <Button variant="outline" onClick={handleBack}>
                <ChevronLeft className="mr-2 h-4 w-4" /> Back
              </Button>
              <Button onClick={handleNext}>
                Review Application <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* ── Step 3: Review & Submit ─────────────────────── */}
        {step === 3 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-3 duration-300">
            <h2 className="text-xl font-bold border-b border-border pb-4">
              Review &amp; Submit
            </h2>

            <p className="text-sm text-muted-foreground">
              Please review your information before submitting. Your application
              will be reviewed by our admin team before you can access the chef
              portal.
            </p>

            <div className="grid gap-4">
              <ReviewSection title="Your Story">
                <ReviewRow label="Bio" value={bio} />
                <ReviewRow
                  label="Experience"
                  value={`${yearsOfExperience} year${yearsOfExperience === "1" ? "" : "s"}`}
                />
              </ReviewSection>

              <ReviewSection title="Culinary Expertise">
                <ReviewRow
                  label="Cuisines"
                  value={cuisines.length > 0 ? cuisines.join(", ") : "—"}
                />
                <ReviewRow
                  label="Specialties"
                  value={
                    specialties.length > 0 ? specialties.join(", ") : "—"
                  }
                />
                <ReviewRow
                  label="Service Areas"
                  value={
                    serviceAreas.length > 0 ? serviceAreas.join(", ") : "—"
                  }
                />
              </ReviewSection>

              <ReviewSection title="Schedule &amp; Pricing">
                <ReviewRow label="Price / Person" value={`$${pricePerPerson}`} />
                <ReviewRow
                  label="Available Days"
                  value={
                    DAYS.filter((d) => availability[d].enabled)
                      .map(
                        (d) =>
                          `${d} (${availability[d].startTime}–${availability[d].endTime})`,
                      )
                      .join(", ") || "—"
                  }
                />
              </ReviewSection>
            </div>

            <div className="bg-secondary/50 border border-border rounded-xl p-4 text-sm text-muted-foreground">
              <strong className="text-foreground">Note:</strong> Gallery images
              and certificates can be added from your chef portal after your
              application is approved.
            </div>

            <div className="pt-4 flex justify-between">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={mutation.isPending}
              >
                <ChevronLeft className="mr-2 h-4 w-4" /> Back
              </Button>
              <Button
                onClick={handleSubmit}
                isLoading={mutation.isPending}
                className="min-w-[180px]"
              >
                {isEditing ? "Update & Resubmit" : "Submit Application"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Review helpers ───────────────────────────────────────────────────────────

function ReviewSection({ title, children }) {
  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <div className="bg-secondary/30 px-4 py-2 border-b border-border">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          {title}
        </h3>
      </div>
      <div className="px-4 py-3 space-y-2">{children}</div>
    </div>
  );
}

function ReviewRow({ label, value }) {
  return (
    <div className="flex gap-4 text-sm">
      <span className="w-32 flex-shrink-0 text-muted-foreground font-medium">
        {label}
      </span>
      <span className="flex-1 text-foreground break-words">{value}</span>
    </div>
  );
}
