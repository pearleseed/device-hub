import React, { useState, useEffect, useRef, useMemo } from "react";
import { Link } from "react-router-dom";
import { UserNavbar } from "@/components/layout/UserNavbar";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useUserBorrowRequests, useDevices } from "@/hooks/use-api-queries";
import { StatsCard } from "@/components/ui/stats-card";
import { SkeletonKPICard, SkeletonAvatar } from "@/components/ui/skeleton-card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ImageCropperModal } from "@/components/ui/ImageCropperModal";
import { toast } from "@/hooks/use-toast";
import {
  Mail,
  Building2,
  Package,
  Clock,
  CheckCircle2,
  XCircle,
  TrendingUp,
  ArrowRight,
  Activity,
  History,
  Shield,
  Sparkles,
  Key,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  Camera,
} from "lucide-react";
import { format, differenceInDays } from "date-fns";

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_SIZE = 2 * 1024 * 1024;

const UserProfile: React.FC = () => {
  const { user, updateUser } = useAuth();
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isCropperOpen, setIsCropperOpen] = useState(false);
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

  const userId = user?.id ?? 0;
  const { data: userRequests = [] } = useUserBorrowRequests(userId);
  const { data: devices = [] } = useDevices();

  // Create device lookup map
  const deviceMap = useMemo(
    () => new Map(devices.map((d) => [d.id, d])),
    [devices],
  );
  const getDeviceById = (id: number) => deviceMap.get(id);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  const stats = {
    totalRequests: userRequests.length,
    activeLoans: userRequests.filter((r) => r.status === "active").length,
    pendingRequests: userRequests.filter((r) => r.status === "pending").length,
    completedLoans: userRequests.filter((r) => r.status === "returned").length,
    approvedRequests: userRequests.filter((r) =>
      ["approved", "active", "returned"].includes(r.status),
    ).length,
    rejectedRequests: userRequests.filter((r) => r.status === "rejected")
      .length,
  };
  const approvalRate =
    stats.totalRequests > 0
      ? Math.round((stats.approvedRequests / stats.totalRequests) * 100)
      : 0;
  const categoriesBorrowed = [
    ...new Set(
      userRequests
        .map((r) => getDeviceById(r.device_id)?.category)
        .filter(Boolean),
    ),
  ];
  const completedLoans = userRequests.filter((r) => r.status === "returned");
  const avgLoanDuration =
    completedLoans.length > 0
      ? Math.round(
          completedLoans.reduce(
            (acc, loan) =>
              acc +
              differenceInDays(
                new Date(loan.end_date),
                new Date(loan.start_date),
              ),
            0,
          ) / completedLoans.length,
        )
      : 0;
  const recentActivity = userRequests.slice(0, 5);

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
      formData.append(
        "avatar",
        new File(
          [croppedBlob],
          `avatar.${selectedFile?.name.split(".").pop() || "jpg"}`,
          { type: croppedBlob.type },
        ),
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
              reject(new Error(t("userProfile.uploadError")));
            }
          };
          xhr.onerror = () => reject(new Error("Network error"));
          xhr.open("POST", `/api/avatars/user/${userId}`);
          xhr.send(formData);
        },
      );
      toast({
        title: t("userProfile.avatarUpdatedTitle"),
        description: t("userProfile.avatarUpdatedDesc"),
      });
    } catch (err) {
      toast({
        title: t("userProfile.uploadErrorTitle"),
        description:
          err instanceof Error ? err.message : t("userProfile.uploadError"),
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
      const response = await fetch("/api/auth/change-password", {
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
        setPasswordSuccess(t("userProfile.passwordChangedSuccess"));
        setPasswordForm({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
        setTimeout(() => setPasswordSuccess(""), 3000);
      } else {
        setPasswordError(data.error || t("userProfile.passwordChangeError"));
      }
    } catch {
      setPasswordError(t("userProfile.passwordChangeError"));
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <UserNavbar />
      <div className="container px-4 md:px-6 pt-4">
        <BreadcrumbNav />
      </div>
      <main
        id="main-content"
        className="container px-4 md:px-6 py-8"
        tabIndex={-1}
      >
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="h-5 w-5 text-primary" />
            <span className="text-sm text-muted-foreground">
              {t("userProfile.yourProfileTitle")}
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold mb-2">
            {t("userProfile.accountOverviewTitle")}
          </h1>
          <p className="text-muted-foreground">
            {t("userProfile.manageProfileDesc")}
          </p>
        </div>

        {isLoading ? (
          <Card className="mb-8">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                <SkeletonAvatar size="lg" className="h-24 w-24" />
                <div className="flex-1 space-y-3">
                  <div className="h-7 w-48 rounded bg-muted animate-shimmer" />
                  <div className="h-4 w-64 rounded bg-muted animate-shimmer" />
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="mb-8">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start">
                <div className="flex flex-col items-center">
                  <div className="relative group">
                    <div className="absolute -inset-1 bg-linear-to-r from-primary/40 to-purple-500/40 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <Avatar
                      className="relative h-28 w-28 ring-2 ring-border shadow-lg cursor-pointer"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <AvatarImage src={user?.avatar_url} alt={user?.name} />
                      <AvatarFallback className="text-3xl bg-linear-to-br from-primary to-purple-500 text-white">
                        {user?.name?.charAt(0) || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                      className="absolute inset-0 flex items-center justify-center rounded-full bg-black/60 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                    >
                      {isUploading ? (
                        <Loader2 className="h-7 w-7 text-white animate-spin" />
                      ) : (
                        <Camera className="h-7 w-7 text-white" />
                      )}
                    </button>
                  </div>
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
                <div className="flex-1 text-center sm:text-left">
                  <h2 className="text-2xl font-bold mb-2">
                    {user?.name || t("users.user")}
                  </h2>
                  <div className="flex flex-col gap-1.5 text-sm text-muted-foreground mb-3">
                    <p className="flex items-center justify-center sm:justify-start gap-2">
                      <Mail className="h-4 w-4" />
                      {user?.email}
                    </p>
                    <p className="flex items-center justify-center sm:justify-start gap-2">
                      <Building2 className="h-4 w-4" />
                      {user?.department_name || t("common.department")}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Overview */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[...Array(4)].map((_, i) => (
              <SkeletonKPICard key={i} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatsCard
              title={t("userDashboard.activeLoansTitle")}
              value={stats.activeLoans}
              subtitle={t("userProfile.currentlyBorrowed")}
              icon={Package}
              accentColor="success"
              href="/loans"
            />
            <StatsCard
              title={t("userDashboard.pendingRequestsTitle")}
              value={stats.pendingRequests}
              subtitle={t("userProfile.awaitingApproval")}
              icon={Clock}
              accentColor="warning"
              href="/dashboard"
            />
            <StatsCard
              title={t("userProfile.completedLoans")}
              value={stats.completedLoans}
              subtitle={t("userProfile.successfullyReturned")}
              icon={CheckCircle2}
              accentColor="primary"
            />
            <StatsCard
              title={t("userProfile.totalRequests")}
              value={stats.totalRequests}
              subtitle={t("userProfile.allTimeRequests")}
              icon={TrendingUp}
              accentColor="primary"
            />
          </div>
        )}

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="overview" className="gap-2">
              <Activity className="h-4 w-4" />
              <span className="hidden sm:inline">
                {t("userProfile.overviewTab")}
              </span>
            </TabsTrigger>
            <TabsTrigger value="activity" className="gap-2">
              <History className="h-4 w-4" />
              <span className="hidden sm:inline">
                {t("userProfile.activityTab")}
              </span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">
                {t("userProfile.settingsTab")}
              </span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    {t("userProfile.borrowingInsightsTitle")}
                  </CardTitle>
                  <CardDescription>
                    {t("userProfile.borrowingPatternsDesc")}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg bg-muted/50">
                      <p className="text-sm text-muted-foreground mb-1">
                        {t("userProfile.totalRequests")}
                      </p>
                      <p className="text-2xl font-bold">
                        {stats.totalRequests}
                      </p>
                    </div>
                    <div className="p-4 rounded-lg bg-muted/50">
                      <p className="text-sm text-muted-foreground mb-1">
                        {t("userProfile.avgLoanDurationLabel")}
                      </p>
                      <p className="text-2xl font-bold">
                        {avgLoanDuration} {t("ui.days")}
                      </p>
                    </div>
                    <div className="p-4 rounded-lg bg-muted/50">
                      <p className="text-sm text-muted-foreground mb-1">
                        {t("userProfile.categoriesUsedLabel")}
                      </p>
                      <p className="text-2xl font-bold">
                        {categoriesBorrowed.length}
                      </p>
                    </div>
                    <div className="p-4 rounded-lg bg-muted/50">
                      <p className="text-sm text-muted-foreground mb-1">
                        {t("userProfile.successRate")}
                      </p>
                      <p className="text-2xl font-bold">
                        {stats.completedLoans + stats.activeLoans > 0
                          ? Math.round(
                              ((stats.completedLoans + stats.activeLoans) /
                                (stats.completedLoans + stats.activeLoans + stats.rejectedRequests)) *
                                100
                            )
                          : 0}
                        %
                      </p>
                    </div>
                  </div>
                  <Separator />
                  <div>
                    <h4 className="text-sm font-medium mb-3">
                      {t("userProfile.requestStatusBreakdownTitle")}
                    </h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm flex items-center gap-2">
                          <div className="h-3 w-3 rounded-full bg-green-500" />
                          {t("userProfile.statusApprovedActive")}
                        </span>
                        <span className="text-sm font-medium">
                          {stats.approvedRequests}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm flex items-center gap-2">
                          <div className="h-3 w-3 rounded-full bg-yellow-500" />
                          {t("userProfile.statusPending")}
                        </span>
                        <span className="text-sm font-medium">
                          {stats.pendingRequests}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm flex items-center gap-2">
                          <div className="h-3 w-3 rounded-full bg-red-500" />
                          {t("userProfile.statusRejected")}
                        </span>
                        <span className="text-sm font-medium">
                          {stats.rejectedRequests}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5" />
                    {t("userProfile.quickActionsTitle")}
                  </CardTitle>
                  <CardDescription>
                    {t("userProfile.quickActionsDesc")}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    asChild
                    variant="outline"
                    className="w-full justify-between"
                  >
                    <Link to="/catalog">
                      <span className="flex items-center gap-2">
                        <Package className="h-4 w-4" />
                        {t("userProfile.browseDeviceCatalog")}
                      </span>
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    className="w-full justify-between"
                  >
                    <Link to="/loans">
                      <span className="flex items-center gap-2">
                        <Activity className="h-4 w-4" />
                        {t("userProfile.manageMyLoans")}
                      </span>
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    className="w-full justify-between"
                  >
                    <Link to="/dashboard">
                      <span className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        {t("userProfile.viewMyRequests")}
                      </span>
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Separator className="my-4" />
                  <div className="p-4 bg-muted rounded-lg">
                    <h4 className="font-medium mb-1">
                      {t("userProfile.needHelp")}
                    </h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      {t("userProfile.contactSupportDesc")}
                    </p>
                    <Button variant="secondary" size="sm">
                      {t("userProfile.contactSupportButton")}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="activity">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  {t("userProfile.recentActivityTitle")}
                </CardTitle>
                <CardDescription>
                  {t("userProfile.latestDeviceRequestsDesc")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {recentActivity.length > 0 ? (
                  <div className="space-y-4">
                    {recentActivity.map((request) => {
                      const device = getDeviceById(request.device_id);
                      if (!device) return null;
                      const statusConfig: Record<
                        string,
                        {
                          icon: typeof Clock;
                          color: string;
                          bg: string;
                          label: string;
                        }
                      > = {
                        pending: {
                          icon: Clock,
                          color: "text-yellow-500",
                          bg: "bg-yellow-500/10",
                          label: t("requests.status.pending"),
                        },
                        approved: {
                          icon: CheckCircle2,
                          color: "text-blue-500",
                          bg: "bg-blue-500/10",
                          label: t("requests.status.approved"),
                        },
                        active: {
                          icon: Package,
                          color: "text-green-500",
                          bg: "bg-green-500/10",
                          label: t("requests.status.active"),
                        },
                        returned: {
                          icon: CheckCircle2,
                          color: "text-muted-foreground",
                          bg: "bg-muted",
                          label: t("requests.status.returned"),
                        },
                        rejected: {
                          icon: XCircle,
                          color: "text-destructive",
                          bg: "bg-destructive/10",
                          label: t("requests.status.rejected"),
                        },
                      };
                      const config = statusConfig[request.status];
                      const Icon = config.icon;
                      return (
                        <div
                          key={request.id}
                          className="flex items-center gap-4 p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                        >
                          <div
                            className={`h-12 w-12 rounded-full flex items-center justify-center ${config.bg}`}
                          >
                            <Icon className={`h-6 w-6 ${config.color}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-medium truncate">
                                {device.name}
                              </p>
                              <Badge
                                variant="outline"
                                className="capitalize shrink-0"
                              >
                                {config.label}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(request.start_date), "MMM d")} -{" "}
                              {format(
                                new Date(request.end_date),
                                "MMM d, yyyy",
                              )}
                            </p>
                          </div>
                          <div className="text-right hidden sm:block">
                            <p className="text-sm text-muted-foreground">
                              {t("userProfile.requestedStatus")}
                            </p>
                            <p className="text-sm font-medium">
                              {format(
                                new Date(request.created_at),
                                "MMM d, yyyy",
                              )}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                    <div className="pt-4 text-center">
                      <Button asChild variant="outline">
                        <Link to="/dashboard">
                          {t("userProfile.viewAllRequests")}
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                ) : (
                  <EmptyState
                    type="no-requests"
                    title={t("userProfile.noActivityYetTitle")}
                    description={t("userProfile.activityWillAppearDesc")}
                    actionLabel={t("userProfile.browseDeviceCatalog")}
                    actionHref="/catalog"
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <div className="grid gap-6 lg:grid-cols-2">
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
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3 p-3 rounded-lg border bg-card">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Mail className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground">
                        {t("userProfile.emailLabel")}
                      </p>
                      <p className="text-sm font-medium truncate">
                        {user?.email}
                      </p>
                    </div>
                    <Badge variant="secondary">
                      {t("userProfile.verifiedBadge")}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg border bg-card">
                    <div className="h-10 w-10 rounded-full bg-purple-500/10 flex items-center justify-center">
                      <Building2 className="h-5 w-5 text-purple-500" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground">
                        {t("userProfile.departmentLabel")}
                      </p>
                      <p className="text-sm font-medium">
                        {user?.department_name || t("common.department")}
                      </p>
                    </div>
                    <Badge variant="outline">{t("userProfile.fullTime")}</Badge>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg border bg-card">
                    <div className="h-10 w-10 rounded-full bg-cyan-500/10 flex items-center justify-center">
                      <Shield className="h-5 w-5 text-cyan-500" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">
                        {t("userProfile.employeeIdLabel")}
                      </p>
                      <p className="text-sm font-medium">
                        {userId.toString().padStart(5, "0")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg border bg-card">
                    <div className="h-10 w-10 rounded-full bg-orange-500/10 flex items-center justify-center">
                      <Activity className="h-5 w-5 text-orange-500" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground">
                        {t("userProfile.roleLabel")}
                      </p>
                      <p className="text-sm font-medium capitalize">
                        {user?.role || t("users.user")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg border bg-card">
                    <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                      <Clock className="h-5 w-5 text-blue-500" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground">
                        {t("userProfile.memberSinceLabel")}
                      </p>
                      <p className="text-sm font-medium">
                        {format(new Date("2024-01-15"), "MMMM d, yyyy")}
                      </p>
                    </div>
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
                </CardContent>
              </Card>

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
                        {t("userProfile.passwordMinLength") ||
                          "Must be at least 6 characters"}
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
            </div>
          </TabsContent>
        </Tabs>

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

export default UserProfile;
