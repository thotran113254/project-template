import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { User as UserIcon, Lock } from "lucide-react";
import {
  updateProfileSchema,
  changePasswordSchema,
  type UpdateProfileInput,
  type ChangePasswordInput,
} from "@app/shared";
import { useAuth } from "@/hooks/use-auth";
import { apiClient } from "@/lib/api-client";
import { getErrorMessage } from "@/lib/error-utils";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";

function ProfileInfoCard() {
  const { user } = useAuth();
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const { register, handleSubmit, formState: { errors } } = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: { name: user?.name ?? "", email: user?.email ?? "" },
  });

  const mutation = useMutation({
    mutationFn: (data: UpdateProfileInput) =>
      apiClient.patch("/auth/profile", data),
    onSuccess: () => {
      setSuccessMsg("Profile updated. Refresh to see changes.");
      setErrorMsg("");
    },
    onError: (err) => {
      setErrorMsg(getErrorMessage(err));
      setSuccessMsg("");
    },
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <UserIcon className="h-5 w-5 text-[var(--primary)]" />
          <CardTitle className="text-lg">Profile Information</CardTitle>
        </div>
        <CardDescription>Update your name and email address</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
          <FormField label="Name" error={errors.name?.message} required>
            <Input {...register("name")} placeholder="Your name" />
          </FormField>
          <FormField label="Email" error={errors.email?.message} required>
            <Input {...register("email")} type="email" placeholder="you@example.com" />
          </FormField>
          {successMsg && <p className="text-sm text-green-600">{successMsg}</p>}
          {errorMsg && <p className="text-sm text-[var(--destructive)]">{errorMsg}</p>}
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function ChangePasswordCard() {
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
  });

  const mutation = useMutation({
    mutationFn: (data: ChangePasswordInput) =>
      apiClient.post("/auth/change-password", data),
    onSuccess: () => {
      setSuccessMsg("Password changed successfully.");
      setErrorMsg("");
      reset();
    },
    onError: (err) => {
      setErrorMsg(getErrorMessage(err));
      setSuccessMsg("");
    },
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Lock className="h-5 w-5 text-[var(--primary)]" />
          <CardTitle className="text-lg">Change Password</CardTitle>
        </div>
        <CardDescription>Update your account password</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
          <FormField label="Current Password" error={errors.currentPassword?.message} required>
            <Input {...register("currentPassword")} type="password" placeholder="Current password" />
          </FormField>
          <FormField label="New Password" error={errors.newPassword?.message} required>
            <Input {...register("newPassword")} type="password" placeholder="New password (min 6 chars)" />
          </FormField>
          {successMsg && <p className="text-sm text-green-600">{successMsg}</p>}
          {errorMsg && <p className="text-sm text-[var(--destructive)]">{errorMsg}</p>}
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? "Changing..." : "Change Password"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export default function ProfilePage() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--foreground)]">Profile Settings</h1>
        <p className="text-sm text-[var(--muted-foreground)]">
          Manage your account as {user?.email}
        </p>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <ProfileInfoCard />
        <ChangePasswordCard />
      </div>
    </div>
  );
}
