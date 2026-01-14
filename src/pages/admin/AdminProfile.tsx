import React, { useState, useRef } from "react";
import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { BreadcrumbNav } from "@/components/ui/breadcrumb-nav";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { ImageCropperModal } from "@/components/ui/ImageCropperModal";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "@/hooks/use-toast";
import {
  Mail,
  Building2,
  Shield,
  Key,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Camera,
  Crown,
  ShieldCheck,
  Calendar,
  Clock,
  Hash,
  User,
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL || "";
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB

const AdminProfile: React.FC = () => {
  const { user, updateUser } = useAuth();
  const { t } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Avatar upload state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isCropperOpen, setIsCropperOpen] = useState(false);

  // Password change state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");

  const userId = user?.id || "0";

  // Avatar handlers
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      toast({
        title: t("userProfile.invalidFormatTitle"),
        description: t("userProfile.invalidFormatDesc"),
        variant: "destructive",
      });
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      toast({
        title: t("userProfile.fileTooLargeTitle"),
        description: t("userProfile.fileTooLargeDesc"),
        variant: "destructive",
      });
      return;
    }

    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(file));
    setSelectedFile(file);
    setIsCropperOpen(true);
    e.target.value = "";
  };

  const handleCropComplete = async (croppedBlob: Blob) => {
    setIsCropperOpen(false);
    setIsUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      const ext = selectedFile?.name.split(".").pop() || "jpg";
      formData.append(
        "avatar",
        new File([croppedBlob], `avatar.${ext}`, { type: croppedBlob.type }),
      );

      const xhr = new XMLHttpRequest();
      const result = await new Promise<{ avatarUrl: string }>(
        (resolve, reject) => {
          xhr.upload.onprogress = (e) => {
            if (e.lengthComputable)
              setUploadProgress(Math.round((e.loaded / e.total) * 100));
          };
          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              const res = JSON.parse(xhr.responseText);
              if (res.success) {
                resolve(res.data);
              } else {
                reject(new Error(res.error));
              }
            } else {
              reject(new Error("Upload failed"));
            }
          };
          xhr.onerror = () => reject(new Error("Network error"));
          xhr.open("POST", `/api/avatars/user/${userId}`);
          xhr.send(formData);
        },
      );

      updateUser({ avatar_url: result.avatarUrl });
      toast({
        title: t("userProfile.avatarUpdatedTitle"),
        description: t("userProfile.avatarUpdatedDesc"),
      });
    } catch (err) {
      toast({
        title: t("error.title"),
        description:
          err instanceof Error ? err.message : t("error.uploadFailed"),
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      setSelectedFile(null);
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }
    }
  };

  // Password handler
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");

    if (passwordForm.newPassword.length < 6) {
      setPasswordError(t("userProfile.passwordMinLengthError"));
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError(t("userProfile.passwordMismatchError"));
      return;
    }
    if (passwordForm.currentPassword === passwordForm.newPassword) {
      setPasswordError(t("userProfile.passwordSameAsCurrentError"));
      return;
    }

    setIsChangingPassword(true);
    try {
      const token = localStorage.getItem("auth-token");
      const response = await fetch(`${API_BASE}/api/auth/change-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });
      const data = await response.json();
      if (data.success) {
        setPasswordSuccess(t("success.passwordChanged"));
        setPasswordForm({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
        setTimeout(() => setPasswordSuccess(""), 3000);
      } else {
        setPasswordError(data.error || "Failed to change password");
      }
    } catch {
      setPasswordError("An error occurred. Please try again.");
    } finally {
      setIsChangingPassword(false);
    }
  };

  const getRoleBadge = () =>
    user?.role === "superuser" ? (
      <Badge variant="default" className="gap-1">
        <Crown className="h-3 w-3" />
        {t("role.superuser")}
      </Badge>
    ) : (
      <Badge variant="secondary" className="gap-1">
        <ShieldCheck className="h-3 w-3" />
        {t("users.admin")}
      </Badge>
    );

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      <main
        id="main-content"
        className="flex-1 p-8"
        tabIndex={-1}
        role="main"
        aria-label="Admin profile"
      >
        <BreadcrumbNav />

        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-2 py-2">{t("adminProfile.title")}</h1>
          <p className="text-muted-foreground">{t("adminProfile.subtitle")}</p>
        </div>

        {/* Profile Card with Modern Design */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start">
              {/* Avatar Section */}
              <div className="flex flex-col items-center">
                <div className="relative group">
                  <div className="absolute -inset-1 bg-linear-to-r from-primary/40 to-purple-500/40 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <Avatar
                    className="relative h-28 w-28 ring-2 ring-border shadow-lg cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <AvatarImage src={user?.avatar_url} alt={user?.name} />
                    <AvatarFallback className="text-3xl bg-linear-to-br from-primary to-purple-500 text-white">
                      {user?.name?.charAt(0) || "A"}
                    </AvatarFallback>
                  </Avatar>

                  {/* Upload Overlay */}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="absolute inset-0 flex items-center justify-center rounded-full bg-black/60 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                  >
                    {isUploading ? (
                      <Loader2 className="h-8 w-8 text-white animate-spin" />
                    ) : (
                      <Camera className="h-8 w-8 text-white" />
                    )}
                  </button>
                </div>

                {/* Upload Progress */}
                {isUploading && (
                  <div className="w-28 mt-2">
                    <Progress value={uploadProgress} className="h-1" />
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept={ALLOWED_MIME_TYPES.join(",")}
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>

              {/* User Info */}
              <div className="flex-1 text-center sm:text-left">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-3">
                  <h2 className="text-2xl font-bold">
                    {user?.name || t("users.admin")}
                  </h2>
                  {getRoleBadge()}
                </div>
                <div className="space-y-1.5 text-sm text-muted-foreground">
                  <p className="flex items-center justify-center sm:justify-start gap-2">
                    <Mail className="h-4 w-4" />
                    {user?.email}
                  </p>
                  <p className="flex items-center justify-center sm:justify-start gap-2">
                    <Building2 className="h-4 w-4" />
                    {user?.department_name || t("common.administration")}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Account Information Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                {t("userProfile.accountInformationTitle")}
              </CardTitle>
              <CardDescription>
                {t("userProfile.accountDetailsDesc")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-lg border bg-card">
                <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <User className="h-5 w-5 text-blue-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">
                    {t("userProfile.fullNameLabel")}
                  </p>
                  <p className="text-sm font-medium">{user?.name || "—"}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg border bg-card">
                <div className="h-10 w-10 rounded-full bg-indigo-500/10 flex items-center justify-center">
                  <Mail className="h-5 w-5 text-indigo-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">
                    {t("userProfile.emailLabel")}
                  </p>
                  <p className="text-sm font-medium truncate">{user?.email}</p>
                </div>
                <Badge variant="secondary">
                  {t("userProfile.verifiedBadge")}
                </Badge>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg border bg-card">
                <div className="h-10 w-10 rounded-full bg-purple-500/10 flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-purple-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">
                    {t("userProfile.departmentLabel")}
                  </p>
                  <p className="text-sm font-medium">
                    {user?.department_name || t("common.administration")}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg border bg-card">
                <div className="h-10 w-10 rounded-full bg-cyan-500/10 flex items-center justify-center">
                  <Shield className="h-5 w-5 text-cyan-500" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">
                    {t("userProfile.roleLabel")}
                  </p>
                  <p className="text-sm font-medium capitalize">{user?.role}</p>
                </div>
                {getRoleBadge()}
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg border bg-card">
                <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">
                    {t("userProfile.accountStatusLabel")}
                  </p>
                  <p className="text-sm font-medium">
                    {t("userProfile.activeStatus")}
                  </p>
                </div>
                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg border bg-card">
                <div className="h-10 w-10 rounded-full bg-rose-500/10 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-rose-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">
                    {t("userProfile.lastLoginLabel")}
                  </p>
                  <p className="text-sm font-medium">
                    {user?.last_login_at
                      ? new Date(user.last_login_at).toLocaleString("vi-VN")
                      : "—"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Change Password Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                {t("userProfile.changePasswordTitle")}
              </CardTitle>
              <CardDescription>
                {t("userProfile.updatePasswordDesc")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current-password">
                    {t("userProfile.currentPasswordLabel")}
                  </Label>
                  <div className="relative">
                    <Input
                      id="current-password"
                      type={showCurrentPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={passwordForm.currentPassword}
                      onChange={(e) =>
                        setPasswordForm({
                          ...passwordForm,
                          currentPassword: e.target.value,
                        })
                      }
                      required
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full w-10 hover:bg-transparent"
                      onClick={() =>
                        setShowCurrentPassword(!showCurrentPassword)
                      }
                    >
                      {showCurrentPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="new-password">
                    {t("userProfile.newPasswordLabel")}
                  </Label>
                  <div className="relative">
                    <Input
                      id="new-password"
                      type={showNewPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={passwordForm.newPassword}
                      onChange={(e) =>
                        setPasswordForm({
                          ...passwordForm,
                          newPassword: e.target.value,
                        })
                      }
                      required
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full w-10 hover:bg-transparent"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {t("userProfile.passwordMinLength")}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password">
                    {t("userProfile.confirmPasswordLabel")}
                  </Label>
                  <div className="relative">
                    <Input
                      id="confirm-password"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={passwordForm.confirmPassword}
                      onChange={(e) =>
                        setPasswordForm({
                          ...passwordForm,
                          confirmPassword: e.target.value,
                        })
                      }
                      required
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full w-10 hover:bg-transparent"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                </div>

                {passwordError && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{passwordError}</span>
                  </div>
                )}

                {passwordSuccess && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/10 text-emerald-600 text-sm">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    <span>{passwordSuccess}</span>
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isChangingPassword}
                >
                  {isChangingPassword ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t("common.processing")}
                    </>
                  ) : (
                    <>
                      <Key className="mr-2 h-4 w-4" />
                      {t("userProfile.changePasswordButton")}
                    </>
                  )}
                </Button>
              </form>

              <Separator className="my-6" />

              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-medium mb-1">
                  {t("userProfile.passwordTips")}
                </h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• {t("userProfile.useAtLeast6Chars")}</li>
                  <li>• {t("userProfile.mixLettersNumbers")}</li>
                  <li>• {t("userProfile.avoidPersonalInfo")}</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Admin Privileges Card */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5" />
                {t("adminProfile.privilegesTitle")}
              </CardTitle>
              <CardDescription>
                {t("adminProfile.privilegesDesc")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  { label: t("adminProfile.manageDevices"), enabled: true },
                  { label: t("adminProfile.approveRequests"), enabled: true },
                  { label: t("adminProfile.viewAnalytics"), enabled: true },
                  {
                    label: t("adminProfile.manageUsers"),
                    enabled:
                      user?.role === "superuser" || user?.role === "admin",
                  }
                ].map((priv) => (
                  <div
                    key={priv.label}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                  >
                    <span className="text-sm">{priv.label}</span>
                    <Badge
                      variant="outline"
                      className={
                        priv.enabled
                          ? "text-emerald-600"
                          : "text-muted-foreground"
                      }
                    >
                      {priv.enabled
                        ? t("adminProfile.enabled")
                        : t("adminProfile.limited")}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Image Cropper Modal */}
        {selectedFile && previewUrl && (
          <ImageCropperModal
            imageFile={selectedFile}
            imageSrc={previewUrl}
            isOpen={isCropperOpen}
            onClose={() => {
              setIsCropperOpen(false);
              setSelectedFile(null);
              if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
                setPreviewUrl(null);
              }
            }}
            onCropComplete={handleCropComplete}
            aspectRatio={1}
          />
        )}
      </main>
    </div>
  );
};

export default AdminProfile;
