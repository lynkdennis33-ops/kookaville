"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CheckCircle, XCircle, Clock, ChefHat, Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Modal } from "@/components/ui/modal";
import { getPendingChefs, approveChef, rejectChef } from "@/services/admin.service";
import { cn } from "@/lib/utils";

export default function AdminChefsPage() {
  const [search, setSearch] = useState("");
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin-pending-chefs", search],
    queryFn: () => getPendingChefs({ search: search || undefined, limit: 50 }),
  });

  const approveMutation = useMutation({
    mutationFn: approveChef,
    onSuccess: () => {
      toast.success("Chef application approved. User role updated to chef.");
      queryClient.invalidateQueries({ queryKey: ["admin-pending-chefs"] });
    },
    onError: (err) => {
      toast.error(
        err.response?.data?.message || "Failed to approve application.",
      );
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ chefId, reason }) => rejectChef(chefId, reason),
    onSuccess: () => {
      toast.success("Chef application rejected.");
      setRejectTarget(null);
      setRejectReason("");
      queryClient.invalidateQueries({ queryKey: ["admin-pending-chefs"] });
    },
    onError: (err) => {
      toast.error(
        err.response?.data?.message || "Failed to reject application.",
      );
    },
  });

  const pendingChefs = data?.chefs ?? [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">
          Chef Approvals
        </h1>
        <p className="text-muted-foreground">
          Review applications and verify chef credentials.
        </p>
      </div>

      <div className="max-w-sm">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or email…"
          leftIcon={<Search className="h-4 w-4" />}
        />
      </div>

      {isLoading ? (
        <div className="text-center py-16 text-muted-foreground">
          Loading applications…
        </div>
      ) : pendingChefs.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <ChefHat className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="font-medium text-muted-foreground">
              No pending applications
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              All chef applications have been reviewed.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {pendingChefs.length} pending application
            {pendingChefs.length !== 1 ? "s" : ""}
          </p>

          {pendingChefs.map((chef) => (
            <ChefApplicationCard
              key={chef._id}
              chef={chef}
              onApprove={() => approveMutation.mutate(chef._id)}
              onReject={() =>
                setRejectTarget({
                  chefId: chef._id,
                  chefName: [chef.user?.firstName, chef.user?.lastName]
                    .filter(Boolean)
                    .join(" "),
                })
              }
              isApproving={
                approveMutation.isPending &&
                approveMutation.variables === chef._id
              }
            />
          ))}
        </div>
      )}

      {/* Reject modal */}
      <Modal
        isOpen={Boolean(rejectTarget)}
        onClose={() => {
          setRejectTarget(null);
          setRejectReason("");
        }}
        title="Reject Chef Application"
        description={
          rejectTarget
            ? `Provide a reason for rejecting ${rejectTarget.chefName || "this"}'s application. The applicant will be notified.`
            : undefined
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Rejection Reason <span className="text-red-500">*</span>
            </label>
            <Textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Explain why this application is being rejected so the applicant can address it…"
              rows={4}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setRejectTarget(null);
                setRejectReason("");
              }}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() =>
                rejectMutation.mutate({
                  chefId: rejectTarget.chefId,
                  reason: rejectReason,
                })
              }
              disabled={!rejectReason.trim()}
              isLoading={rejectMutation.isPending}
            >
              Reject Application
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function ChefApplicationCard({ chef, onApprove, onReject, isApproving }) {
  const user = chef.user ?? {};
  const name =
    [user.firstName, user.lastName].filter(Boolean).join(" ") || "Unknown";
  const appliedDate = new Date(chef.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <Card className="border-amber-200 bg-amber-50/20">
      <CardContent className="pt-6">
        <div className="flex flex-col lg:flex-row lg:items-start gap-6">
          {/* Left: applicant details */}
          <div className="flex-1 space-y-4 min-w-0">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-xl font-bold font-serif flex-shrink-0">
                {(user.firstName?.[0] ?? "?").toUpperCase()}
              </div>
              <div className="min-w-0">
                <h3 className="text-lg font-bold">{name}</h3>
                <p className="text-sm text-muted-foreground truncate">
                  {user.email}
                </p>
                <div className="flex items-center gap-1 mt-1">
                  <Clock className="h-3.5 w-3.5 text-amber-500" />
                  <span className="text-xs text-amber-600">
                    Applied {appliedDate}
                  </span>
                </div>
              </div>
            </div>

            {chef.bio && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {chef.bio}
              </p>
            )}

            <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                  Experience
                </p>
                <p>
                  {chef.yearsOfExperience} year
                  {chef.yearsOfExperience !== 1 ? "s" : ""}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                  Price / Person
                </p>
                <p>${chef.pricePerPerson}</p>
              </div>

              {chef.specialties?.length > 0 && (
                <div className="col-span-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                    Specialties
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {chef.specialties.slice(0, 5).map((s) => (
                      <span
                        key={s}
                        className="bg-secondary text-secondary-foreground rounded-full px-2 py-0.5 text-xs"
                      >
                        {s}
                      </span>
                    ))}
                    {chef.specialties.length > 5 && (
                      <span className="text-xs text-muted-foreground">
                        +{chef.specialties.length - 5} more
                      </span>
                    )}
                  </div>
                </div>
              )}

              {chef.cuisines?.length > 0 && (
                <div className="col-span-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                    Cuisines
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {chef.cuisines.slice(0, 5).map((c) => (
                      <span
                        key={c}
                        className="bg-primary/10 text-primary rounded-full px-2 py-0.5 text-xs"
                      >
                        {c}
                      </span>
                    ))}
                    {chef.cuisines.length > 5 && (
                      <span className="text-xs text-muted-foreground">
                        +{chef.cuisines.length - 5} more
                      </span>
                    )}
                  </div>
                </div>
              )}

              {chef.serviceAreas?.length > 0 && (
                <div className="col-span-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                    Service Areas
                  </p>
                  <p className="text-sm">{chef.serviceAreas.join(", ")}</p>
                </div>
              )}
            </div>
          </div>

          {/* Right: action buttons */}
          <div className="flex flex-row lg:flex-col gap-2 lg:w-36 flex-shrink-0">
            <Button
              size="sm"
              onClick={onApprove}
              isLoading={isApproving}
              className="flex-1 lg:flex-none bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <CheckCircle className="mr-1.5 h-4 w-4" /> Approve
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onReject}
              className="flex-1 lg:flex-none text-red-500 border-red-200 hover:bg-red-50 hover:border-red-300"
            >
              <XCircle className="mr-1.5 h-4 w-4" /> Reject
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
