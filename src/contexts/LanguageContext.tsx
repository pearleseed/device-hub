import React, { createContext, useContext, useState, useCallback } from "react";

type Language = "en" | "ja";

interface Translations {
  [key: string]: {
    en: string;
    ja: string;
  };
}

const translations: Translations = {
  // Navigation
  "nav.dashboard": { en: "Dashboard", ja: "ダッシュボード" },
  "nav.inventory": { en: "Inventory", ja: "在庫管理" },
  "nav.calendar": { en: "Calendar", ja: "カレンダー" },
  "nav.requests": { en: "Requests", ja: "リクエスト" },
  "nav.users": { en: "Users", ja: "ユーザー" },
  "nav.settings": { en: "Settings", ja: "設定" },
  "nav.catalog": { en: "Device Catalog", ja: "デバイスカタログ" },
  "nav.myDashboard": { en: "My Dashboard", ja: "マイダッシュボード" },
  "nav.collapse": { en: "Collapse", ja: "折りたたむ" },

  // Common
  "common.search": { en: "Search", ja: "検索" },
  "common.add": { en: "Add", ja: "追加" },
  "common.edit": { en: "Edit", ja: "編集" },
  "common.delete": { en: "Delete", ja: "削除" },
  "common.save": { en: "Save", ja: "保存" },
  "common.cancel": { en: "Cancel", ja: "キャンセル" },
  "common.actions": { en: "Actions", ja: "アクション" },
  "common.status": { en: "Status", ja: "ステータス" },
  "common.name": { en: "Name", ja: "名前" },
  "common.email": { en: "Email", ja: "メール" },
  "common.department": { en: "Department", ja: "部署" },
  "common.role": { en: "Role", ja: "役割" },
  "common.logout": { en: "Log out", ja: "ログアウト" },
  "common.profile": { en: "Profile", ja: "プロフィール" },
  "common.selectAll": { en: "Select All", ja: "すべて選択" },
  "common.deselectAll": { en: "Deselect All", ja: "すべて解除" },
  "common.more": { en: "more", ja: "件" },
  "common.clearAll": { en: "Clear all", ja: "すべてクリア" },
  "common.back": { en: "Back", ja: "戻る" },
  "common.next": { en: "Next", ja: "次へ" },
  "common.done": { en: "Done", ja: "完了" },
  "common.close": { en: "Close", ja: "閉じる" },
  "common.confirm": { en: "Confirm", ja: "確認" },
  "common.submit": { en: "Submit", ja: "送信" },
  "common.refresh": { en: "Refresh", ja: "更新" },
  "common.export": { en: "Export", ja: "エクスポート" },
  "common.exportCSV": { en: "Export CSV", ja: "CSVエクスポート" },
  "common.viewDetails": { en: "View details", ja: "詳細を見る" },
  "common.lastUpdated": { en: "Last updated", ja: "最終更新" },
  "common.showing": { en: "Showing", ja: "表示中" },
  "common.devices": { en: "devices", ja: "デバイス" },
  "common.available": { en: "available", ja: "利用可能" },
  "common.undo": { en: "Undo", ja: "元に戻す" },
  "common.restored": { en: "Restored", ja: "復元しました" },

  // Dashboard
  "dashboard.title": { en: "Dashboard", ja: "ダッシュボード" },
  "dashboard.overview": {
    en: "Overview of your device management system",
    ja: "デバイス管理システムの概要",
  },
  "dashboard.totalDevices": { en: "Total Devices", ja: "総デバイス数" },
  "dashboard.devicesOut": { en: "Devices Out", ja: "貸出中" },
  "dashboard.pendingRequests": {
    en: "Pending Requests",
    ja: "保留中のリクエスト",
  },
  "dashboard.totalUsers": { en: "Total Users", ja: "総ユーザー数" },
  "dashboard.usageTrends": { en: "Usage Trends", ja: "利用傾向" },
  "dashboard.deviceDistribution": {
    en: "Device Distribution",
    ja: "デバイス分布",
  },
  "dashboard.overdue": { en: "Overdue", ja: "期限超過" },
  "dashboard.awaitingApproval": { en: "Awaiting approval", ja: "承認待ち" },
  "dashboard.activeAccounts": {
    en: "Active accounts",
    ja: "アクティブアカウント",
  },
  "dashboard.needAttention": { en: "Need attention", ja: "対応が必要" },
  "dashboard.allOnTime": { en: "All on time", ja: "すべて期限内" },
  "dashboard.currentlyBorrowed": { en: "Currently borrowed", ja: "現在貸出中" },

  // Users page
  "users.title": { en: "User Management", ja: "ユーザー管理" },
  "users.subtitle": {
    en: "Manage all users in your organization",
    ja: "組織内の全ユーザーを管理",
  },
  "users.addUser": { en: "Add User", ja: "ユーザー追加" },
  "users.allUsers": { en: "All Users", ja: "全ユーザー" },
  "users.admin": { en: "Admin", ja: "管理者" },
  "users.user": { en: "User", ja: "ユーザー" },
  "users.activeLoans": { en: "Active Loans", ja: "アクティブな貸出" },

  // Settings page
  "settings.title": { en: "Settings", ja: "設定" },
  "settings.subtitle": {
    en: "Manage your application settings",
    ja: "アプリケーション設定を管理",
  },
  "settings.general": { en: "General", ja: "一般" },
  "settings.language": { en: "Language", ja: "言語" },
  "settings.languageDesc": {
    en: "Select your preferred language",
    ja: "希望の言語を選択",
  },
  "settings.notifications": { en: "Notifications", ja: "通知" },
  "settings.notificationsDesc": {
    en: "Configure notification preferences",
    ja: "通知設定を構成",
  },
  "settings.emailNotifications": {
    en: "Email Notifications",
    ja: "メール通知",
  },
  "settings.emailNotificationsDesc": {
    en: "Receive email notifications for important updates",
    ja: "重要な更新のメール通知を受信",
  },
  "settings.appearance": { en: "Appearance", ja: "外観" },
  "settings.darkMode": { en: "Dark Mode", ja: "ダークモード" },
  "settings.darkModeDesc": {
    en: "Enable dark mode for the interface",
    ja: "インターフェースのダークモードを有効化",
  },
  "settings.security": { en: "Security", ja: "セキュリティ" },
  "settings.changePassword": { en: "Change Password", ja: "パスワード変更" },
  "settings.twoFactor": { en: "Two-Factor Authentication", ja: "二要素認証" },
  "settings.twoFactorDesc": {
    en: "Add an extra layer of security to your account",
    ja: "アカウントにセキュリティ層を追加",
  },

  // Inventory
  "inventory.title": { en: "Inventory Management", ja: "在庫管理" },
  "inventory.subtitle": {
    en: "Manage all devices in your inventory",
    ja: "在庫内の全デバイスを管理",
  },
  "inventory.addDevice": { en: "Add Device", ja: "デバイス追加" },
  "inventory.allDevices": { en: "All Devices", ja: "全デバイス" },
  "inventory.device": { en: "Device", ja: "デバイス" },
  "inventory.assetTag": { en: "Asset Tag", ja: "資産タグ" },
  "inventory.category": { en: "Category", ja: "カテゴリー" },
  "inventory.assignedTo": { en: "Assigned To", ja: "割り当て先" },
  "inventory.searchDevices": {
    en: "Search devices...",
    ja: "デバイスを検索...",
  },
  "inventory.noDevicesFound": {
    en: "No devices found",
    ja: "デバイスが見つかりません",
  },
  "inventory.addFirstDevice": {
    en: "Add your first device to get started",
    ja: "最初のデバイスを追加して始めましょう",
  },
  "inventory.deviceAdded": { en: "Device added", ja: "デバイスを追加しました" },
  "inventory.deviceUpdated": {
    en: "Device updated",
    ja: "デバイスを更新しました",
  },
  "inventory.deviceDeleted": {
    en: "Device deleted",
    ja: "デバイスを削除しました",
  },
  "inventory.devicesDeleted": {
    en: "Devices deleted",
    ja: "デバイスを削除しました",
  },
  "inventory.hasBeenAdded": {
    en: "has been added to inventory",
    ja: "が在庫に追加されました",
  },
  "inventory.hasBeenUpdated": {
    en: "has been updated",
    ja: "が更新されました",
  },
  "inventory.hasBeenRemoved": {
    en: "has been removed",
    ja: "が削除されました",
  },
  "inventory.haveBeenRemoved": {
    en: "devices have been removed",
    ja: "台のデバイスが削除されました",
  },
  "inventory.haveBeenRestored": {
    en: "devices have been restored",
    ja: "台のデバイスが復元されました",
  },

  // Requests
  "requests.title": { en: "Request Management", ja: "リクエスト管理" },
  "requests.subtitle": {
    en: "Review and manage device requests",
    ja: "デバイスリクエストを確認・管理",
  },
  "requests.dragHint": {
    en: "Drag cards between columns or use keyboard shortcuts",
    ja: "カードを列間でドラッグするか、キーボードショートカットを使用",
  },
  "requests.pending": { en: "Pending", ja: "保留中" },
  "requests.approved": { en: "Approved", ja: "承認済み" },
  "requests.active": { en: "Active", ja: "アクティブ" },
  "requests.returned": { en: "Returned", ja: "返却済み" },
  "requests.approve": { en: "Approve", ja: "承認" },
  "requests.reject": { en: "Reject", ja: "却下" },
  "requests.rejected": { en: "Rejected", ja: "却下済み" },
  "requests.statusUpdated": {
    en: "Status updated",
    ja: "ステータスを更新しました",
  },
  "requests.movedTo": {
    en: "Request moved to",
    ja: "リクエストを移動しました：",
  },
  "requests.kanban": { en: "Kanban", ja: "カンバン" },
  "requests.list": { en: "List", ja: "リスト" },
  "requests.exportComplete": { en: "Export complete", ja: "エクスポート完了" },
  "requests.historyDownloaded": {
    en: "Request history has been downloaded as CSV",
    ja: "リクエスト履歴がCSVとしてダウンロードされました",
  },

  // Calendar
  "calendar.title": {
    en: "Device Availability Calendar",
    ja: "デバイス空き状況カレンダー",
  },
  "calendar.subtitle": {
    en: "View device bookings and availability",
    ja: "デバイスの予約と空き状況を確認",
  },
  "calendar.calendarView": { en: "Calendar", ja: "カレンダー" },
  "calendar.timelineView": { en: "Timeline", ja: "タイムライン" },
  "calendar.monthlyView": { en: "Monthly View", ja: "月間表示" },
  "calendar.filters": { en: "Filters", ja: "フィルター" },
  "calendar.categories": { en: "Categories", ja: "カテゴリー" },
  "calendar.devices": { en: "Devices", ja: "デバイス" },
  "calendar.device": { en: "Device", ja: "デバイス" },
  "calendar.selectDate": { en: "Select a date", ja: "日付を選択" },
  "calendar.noBookingsForDate": {
    en: "No bookings for this date",
    ja: "この日の予約はありません",
  },
  "calendar.noDevicesSelected": {
    en: "No devices match the current filters",
    ja: "現在のフィルターに一致するデバイスがありません",
  },
  "calendar.today": { en: "Today", ja: "今日" },
  "calendar.availableToday": { en: "Available Today", ja: "本日空き" },
  "calendar.availableThisWeek": {
    en: "Available This Week",
    ja: "今週空きあり",
  },
  "calendar.pendingBookings": { en: "Pending Bookings", ja: "保留中の予約" },
  "calendar.noBookings": { en: "No Scheduled Bookings", ja: "予約なし" },
  "calendar.availabilitySummary": {
    en: "Availability Summary",
    ja: "空き状況サマリー",
  },
  "calendar.upcomingAvailability": {
    en: "Becoming Available Soon",
    ja: "まもなく利用可能",
  },
  "calendar.requestedOn": { en: "Requested on", ja: "リクエスト日" },

  // Overdue alerts
  "overdue.title": { en: "Overdue Returns", ja: "返却期限超過" },
  "overdue.overdueDevices": { en: "overdue devices", ja: "台が期限超過" },
  "overdue.critical": { en: "critical", ja: "緊急" },
  "overdue.viewAll": { en: "View All", ja: "すべて表示" },
  "overdue.dueOn": { en: "Due:", ja: "返却日:" },
  "overdue.daysOverdue": { en: "days overdue", ja: "日超過" },

  // Login page
  "login.welcomeBack": { en: "Welcome back", ja: "おかえりなさい" },
  "login.enterCredentials": {
    en: "Enter your credentials to access your account",
    ja: "認証情報を入力してアカウントにアクセス",
  },
  "login.email": { en: "Email", ja: "メールアドレス" },
  "login.password": { en: "Password", ja: "パスワード" },
  "login.forgotPassword": {
    en: "Forgot password?",
    ja: "パスワードをお忘れですか？",
  },
  "login.rememberMe": {
    en: "Remember me for 30 days",
    ja: "30日間ログイン状態を保持",
  },
  "login.signIn": { en: "Sign In", ja: "サインイン" },
  "login.quickDemoAccess": {
    en: "Quick Demo Access:",
    ja: "クイックデモアクセス：",
  },
  "login.admin": { en: "Admin", ja: "管理者" },
  "login.user": { en: "User", ja: "ユーザー" },
  "login.fullAccess": { en: "Full access", ja: "フルアクセス" },
  "login.standardAccess": { en: "Standard access", ja: "標準アクセス" },
  "login.adminEmail": { en: "Admin email:", ja: "管理者メール：" },
  "login.userEmail": { en: "User email:", ja: "ユーザーメール：" },
  "login.anyPasswordWorks": {
    en: "Any password works",
    ja: "どのパスワードでも可",
  },
  "login.manageDevices": {
    en: "Manage company's devices with ease",
    ja: "会社のデバイスを簡単に管理",
  },
  "login.streamlineEquipment": {
    en: "Streamline equipment tracking, borrowing, and returns. Keep team equipped with the tools they need.",
    ja: "機器の追跡、貸出、返却を効率化。チームに必要なツールを提供します。",
  },
  "login.laptops": { en: "Laptops", ja: "ノートPC" },
  "login.mobile": { en: "Mobile", ja: "モバイル" },
  "login.monitors": { en: "Monitors", ja: "モニター" },

  // 404 Not Found page
  "notFound.title": { en: "Page not found", ja: "ページが見つかりません" },
  "notFound.description": {
    en: "The page you're looking for doesn't exist or has been moved. Let's get you back on track.",
    ja: "お探しのページは存在しないか、移動されました。正しいページへご案内します。",
  },
  "notFound.goHome": { en: "Go to", ja: "へ移動" },
  "notFound.goBack": { en: "Go Back", ja: "戻る" },
  "notFound.orTryThese": {
    en: "Or try one of these:",
    ja: "または以下をお試しください：",
  },
  "notFound.browseCatalog": { en: "Browse Catalog", ja: "カタログを見る" },
  "notFound.myProfile": { en: "My Profile", ja: "マイプロフィール" },
  "notFound.needHelp": { en: "Need help?", ja: "お困りですか？" },
  "notFound.contactSupport": { en: "Contact Support", ja: "サポートに連絡" },

  // Device Catalog page
  "catalog.title": { en: "Device Catalog", ja: "デバイスカタログ" },
  "catalog.subtitle": {
    en: "Browse and request equipment for your projects.",
    ja: "プロジェクト用の機器を閲覧・リクエスト",
  },
  "catalog.devicesAvailable": { en: "devices available", ja: "台利用可能" },
  "catalog.searchDevices": { en: "Search devices...", ja: "デバイスを検索..." },
  "catalog.allCategories": { en: "All Categories", ja: "すべてのカテゴリー" },
  "catalog.allStatus": { en: "All Status", ja: "すべてのステータス" },
  "catalog.available": { en: "Available", ja: "利用可能" },
  "catalog.borrowed": { en: "Borrowed", ja: "貸出中" },
  "catalog.maintenance": { en: "Maintenance", ja: "メンテナンス中" },
  "catalog.sortNameAsc": { en: "Name (A-Z)", ja: "名前 (A-Z)" },
  "catalog.sortNameDesc": { en: "Name (Z-A)", ja: "名前 (Z-A)" },
  "catalog.sortNewest": { en: "Newest First", ja: "新しい順" },
  "catalog.sortAvailability": { en: "Available First", ja: "利用可能順" },
  "catalog.sortFavorites": { en: "Favorites First", ja: "お気に入り順" },
  "catalog.favoritesOnly": { en: "Favorites only", ja: "お気に入りのみ" },
  "catalog.active": { en: "Active:", ja: "アクティブ：" },
  "catalog.clearAll": { en: "Clear all", ja: "すべてクリア" },
  "catalog.showingDevices": { en: "Showing", ja: "表示中" },
  "catalog.quickRequest": { en: "Quick Request", ja: "クイックリクエスト" },
  "catalog.addedToFavorites": {
    en: "Added to favorites",
    ja: "お気に入りに追加しました",
  },
  "catalog.removedFromFavorites": {
    en: "Removed from favorites",
    ja: "お気に入りから削除しました",
  },
  "catalog.openingRequestForm": {
    en: "Opening request form for",
    ja: "リクエストフォームを開いています：",
  },

  // Device categories
  "category.laptop": { en: "Laptops", ja: "ノートPC" },
  "category.mobile": { en: "Mobile", ja: "モバイル" },
  "category.tablet": { en: "Tablets", ja: "タブレット" },
  "category.monitor": { en: "Monitors", ja: "モニター" },
  "category.accessories": { en: "Accessories", ja: "アクセサリー" },

  // Device Detail Modal
  "deviceDetail.requestDevice": {
    en: "Request this Device",
    ja: "このデバイスをリクエスト",
  },
  "deviceDetail.quickSelect": { en: "Quick select:", ja: "クイック選択：" },
  "deviceDetail.oneWeek": { en: "1 Week", ja: "1週間" },
  "deviceDetail.twoWeeks": { en: "2 Weeks", ja: "2週間" },
  "deviceDetail.oneMonth": { en: "1 Month", ja: "1ヶ月" },
  "deviceDetail.selectDateRange": {
    en: "Select Date Range",
    ja: "日付範囲を選択",
  },
  "deviceDetail.selectStartEnd": {
    en: "Select start and end dates",
    ja: "開始日と終了日を選択",
  },
  "deviceDetail.reasonForRequest": {
    en: "Reason for Request",
    ja: "リクエスト理由",
  },
  "deviceDetail.reasonPlaceholder": {
    en: "Please describe why you need this device...",
    ja: "このデバイスが必要な理由を説明してください...",
  },
  "deviceDetail.reviewRequest": {
    en: "Review Request",
    ja: "リクエストを確認",
  },
  "deviceDetail.currentlyAssigned": {
    en: "Currently assigned to",
    ja: "現在の割り当て先",
  },
  "deviceDetail.specifications": { en: "Specifications", ja: "仕様" },
  "deviceDetail.operatingSystem": {
    en: "Operating System:",
    ja: "オペレーティングシステム：",
  },
  "deviceDetail.processor": { en: "Processor", ja: "プロセッサー" },
  "deviceDetail.storage": { en: "Storage", ja: "ストレージ" },
  "deviceDetail.display": { en: "Display", ja: "ディスプレイ" },
  "deviceDetail.battery": { en: "Battery", ja: "バッテリー" },
  "deviceDetail.assetTag": { en: "Asset Tag", ja: "資産タグ" },
  "deviceDetail.alsoAvailable": {
    en: "Also Available",
    ja: "その他の利用可能デバイス",
  },
  "deviceDetail.deviceUnavailable": {
    en: "This device is currently",
    ja: "このデバイスは現在",
  },
  "deviceDetail.checkBackLater": {
    en: "Check back later or browse other available devices.",
    ja: "後で確認するか、他の利用可能なデバイスをご覧ください。",
  },
  "deviceDetail.underMaintenance": {
    en: "under maintenance",
    ja: "メンテナンス中",
  },
  "deviceDetail.pleaseSelectDates": {
    en: "Please select dates",
    ja: "日付を選択してください",
  },
  "deviceDetail.bothDatesRequired": {
    en: "Both start and end dates are required.",
    ja: "開始日と終了日の両方が必要です。",
  },
  "deviceDetail.pleaseProvideReason": {
    en: "Please provide a reason",
    ja: "理由を入力してください",
  },
  "deviceDetail.reasonRequired": {
    en: "A reason for the request is required.",
    ja: "リクエストの理由が必要です。",
  },
  "deviceDetail.days": { en: "days", ja: "日間" },
  "deviceDetail.day": { en: "day", ja: "日" },

  // Confirm Request Modal
  "confirmRequest.title": {
    en: "Confirm Your Request",
    ja: "リクエストを確認",
  },
  "confirmRequest.reviewDetails": {
    en: "Please review the details before submitting.",
    ja: "送信前に詳細をご確認ください。",
  },
  "confirmRequest.loanPeriod": { en: "Loan Period", ja: "貸出期間" },
  "confirmRequest.reason": { en: "Reason", ja: "理由" },
  "confirmRequest.submitRequest": {
    en: "Submit Request",
    ja: "リクエストを送信",
  },

  // Success Modal
  "success.requestSubmitted": {
    en: "Request Submitted!",
    ja: "リクエストを送信しました！",
  },
  "success.requestSentForApproval": {
    en: "Your request for",
    ja: "リクエストが承認のために送信されました：",
  },
  "success.hasBeen": { en: "has been sent for approval.", ja: "" },
  "success.estimatedApproval": {
    en: "Estimated approval time",
    ja: "承認予定時間",
  },
  "success.businessDays": { en: "1-2 business days", ja: "1〜2営業日" },
  "success.viewMyRequests": {
    en: "View My Requests",
    ja: "マイリクエストを見る",
  },

  // User Dashboard
  "userDashboard.goodMorning": { en: "Good morning", ja: "おはようございます" },
  "userDashboard.goodAfternoon": { en: "Good afternoon", ja: "こんにちは" },
  "userDashboard.goodEvening": { en: "Good evening", ja: "こんばんは" },
  "userDashboard.overview": {
    en: "Here's an overview of your device loans and requests.",
    ja: "デバイスの貸出とリクエストの概要です。",
  },
  "userDashboard.activeLoans": { en: "Active Loans", ja: "アクティブな貸出" },
  "userDashboard.devicesCurrentlyBorrowed": {
    en: "Devices currently borrowed",
    ja: "現在借りているデバイス",
  },
  "userDashboard.pendingRequests": {
    en: "Pending Requests",
    ja: "保留中のリクエスト",
  },
  "userDashboard.awaitingApproval": { en: "Awaiting approval", ja: "承認待ち" },
  "userDashboard.quickActions": {
    en: "Quick Actions",
    ja: "クイックアクション",
  },
  "userDashboard.browseCatalog": { en: "Browse Catalog", ja: "カタログを見る" },
  "userDashboard.currentlyBorrowed": {
    en: "Currently Borrowed",
    ja: "現在借りているもの",
  },
  "userDashboard.requestHistory": {
    en: "Request History",
    ja: "リクエスト履歴",
  },
  "userDashboard.estimatedApproval": {
    en: "Estimated approval: 1-2 business days",
    ja: "承認予定：1〜2営業日",
  },
  "userDashboard.returnSubmitted": {
    en: "Return request submitted",
    ja: "返却リクエストを送信しました",
  },
  "userDashboard.adminWillProcess": {
    en: "An admin will process your return shortly.",
    ja: "管理者がまもなく返却を処理します。",
  },

  // User Profile
  "profile.title": { en: "Profile", ja: "プロフィール" },
  "profile.memberSince": { en: "Member since", ja: "登録日" },
  "profile.totalRequests": { en: "Total Requests", ja: "総リクエスト数" },
  "profile.allTime": { en: "All time", ja: "全期間" },
  "profile.activeLoans": { en: "Active Loans", ja: "アクティブな貸出" },
  "profile.currentlyBorrowed": {
    en: "Currently borrowed",
    ja: "現在借りているもの",
  },
  "profile.completed": { en: "Completed", ja: "完了" },
  "profile.returnedOnTime": { en: "Returned on time", ja: "期限内に返却" },
  "profile.approvalRate": { en: "Approval Rate", ja: "承認率" },
  "profile.approved": { en: "approved", ja: "承認済み" },
  "profile.rejected": { en: "rejected", ja: "却下" },
  "profile.recentActivity": {
    en: "Recent Activity",
    ja: "最近のアクティビティ",
  },
  "profile.latestRequests": {
    en: "Your latest device requests",
    ja: "最新のデバイスリクエスト",
  },
  "profile.noActivityYet": {
    en: "No activity yet",
    ja: "まだアクティビティがありません",
  },
  "profile.browseDevices": { en: "Browse devices", ja: "デバイスを見る" },
  "profile.quickActions": { en: "Quick Actions", ja: "クイックアクション" },
  "profile.commonTasks": {
    en: "Common tasks and shortcuts",
    ja: "一般的なタスクとショートカット",
  },
  "profile.browseDeviceCatalog": {
    en: "Browse Device Catalog",
    ja: "デバイスカタログを見る",
  },
  "profile.viewMyRequests": {
    en: "View My Requests",
    ja: "マイリクエストを見る",
  },
  "profile.notificationSettings": {
    en: "Notification Settings",
    ja: "通知設定",
  },
  "profile.needHelp": { en: "Need help?", ja: "お困りですか？" },
  "profile.contactITSupport": {
    en: "Contact IT support for device-related questions.",
    ja: "デバイスに関する質問はITサポートにお問い合わせください。",
  },
  "profile.contactSupport": { en: "Contact Support", ja: "サポートに連絡" },

  // Active Loan Card
  "loan.daysOverdue": { en: "overdue", ja: "日超過" },
  "loan.dueToday": { en: "Due today", ja: "本日返却" },
  "loan.dayLeft": { en: "day left", ja: "日残り" },
  "loan.daysLeft": { en: "days left", ja: "日残り" },
  "loan.returnBy": { en: "Return by:", ja: "返却期限：" },
  "loan.returnDevice": { en: "Return Device", ja: "デバイスを返却" },

  // Recently Viewed
  "recentlyViewed.title": { en: "Recently Viewed", ja: "最近閲覧したもの" },
  "recentlyViewed.clear": { en: "Clear", ja: "クリア" },

  // Notifications
  "notifications.title": { en: "Notifications", ja: "通知" },
  "notifications.new": { en: "new", ja: "件の新着" },
  "notifications.markAllRead": { en: "Mark all read", ja: "すべて既読にする" },
  "notifications.earlier": { en: "Earlier", ja: "以前" },
  "notifications.viewDetails": { en: "View details", ja: "詳細を見る" },
  "notifications.allCaughtUp": { en: "All caught up!", ja: "すべて確認済み！" },
  "notifications.noNotifications": {
    en: "You don't have any notifications right now. We'll let you know when something arrives.",
    ja: "現在通知はありません。新しい通知があればお知らせします。",
  },
  "notifications.showing": { en: "Showing", ja: "表示中" },
  "notifications.notification": { en: "notification", ja: "件の通知" },
  "notifications.notifications": { en: "notifications", ja: "件の通知" },
  "notifications.requestApproved": { en: "Approved", ja: "承認済み" },
  "notifications.requestRejected": { en: "Rejected", ja: "却下" },
  "notifications.newRequest": { en: "New Request", ja: "新規リクエスト" },
  "notifications.overdue": { en: "Overdue", ja: "期限超過" },
  "notifications.deviceReturned": { en: "Returned", ja: "返却済み" },
  "notifications.info": { en: "Info", ja: "情報" },

  // Empty States
  "empty.noDevices": {
    en: "No devices available",
    ja: "利用可能なデバイスがありません",
  },
  "empty.noDevicesDesc": {
    en: "Check back later for new devices in the catalog.",
    ja: "後でカタログの新しいデバイスを確認してください。",
  },
  "empty.noResults": { en: "No results found", ja: "結果が見つかりません" },
  "empty.noResultsDesc": {
    en: "Try adjusting your search or filter criteria.",
    ja: "検索条件やフィルターを調整してみてください。",
  },
  "empty.noFavorites": { en: "No favorites yet", ja: "お気に入りがありません" },
  "empty.noFavoritesDesc": {
    en: "Click the heart icon on any device to add it to your favorites.",
    ja: "デバイスのハートアイコンをクリックしてお気に入りに追加してください。",
  },
  "empty.noRequests": { en: "No requests yet", ja: "リクエストがありません" },
  "empty.noRequestsDesc": {
    en: "Browse the catalog to request your first device.",
    ja: "カタログを見て最初のデバイスをリクエストしてください。",
  },
  "empty.noNotifications": { en: "All caught up!", ja: "すべて確認済み！" },
  "empty.noNotificationsDesc": {
    en: "You don't have any notifications right now.",
    ja: "現在通知はありません。",
  },
  "empty.noLoans": {
    en: "No active loans",
    ja: "アクティブな貸出がありません",
  },
  "empty.noLoansDesc": {
    en: "Request a device from the catalog to get started.",
    ja: "カタログからデバイスをリクエストして始めましょう。",
  },
  "empty.comingSoon": { en: "Coming soon", ja: "近日公開" },
  "empty.comingSoonDesc": {
    en: "This feature is currently under development.",
    ja: "この機能は現在開発中です。",
  },
  "empty.getStarted": { en: "Get Started", ja: "始める" },
  "empty.viewAllDevices": {
    en: "View all devices",
    ja: "すべてのデバイスを見る",
  },

  // Add/Edit Device Modal
  "deviceModal.addNewDevice": {
    en: "Add New Device",
    ja: "新しいデバイスを追加",
  },
  "deviceModal.editDevice": { en: "Edit Device", ja: "デバイスを編集" },
  "deviceModal.deviceName": { en: "Device Name", ja: "デバイス名" },
  "deviceModal.assetTag": { en: "Asset Tag", ja: "資産タグ" },
  "deviceModal.brand": { en: "Brand", ja: "ブランド" },
  "deviceModal.model": { en: "Model", ja: "モデル" },
  "deviceModal.category": { en: "Category", ja: "カテゴリー" },
  "deviceModal.status": { en: "Status", ja: "ステータス" },
  "deviceModal.imageUrl": { en: "Image URL", ja: "画像URL" },
  "deviceModal.specifications": {
    en: "Specifications (Optional)",
    ja: "仕様（オプション）",
  },
  "deviceModal.os": { en: "OS", ja: "OS" },
  "deviceModal.processor": { en: "Processor", ja: "プロセッサー" },
  "deviceModal.ram": { en: "RAM", ja: "RAM" },
  "deviceModal.storage": { en: "Storage", ja: "ストレージ" },
  "deviceModal.addDevice": { en: "Add Device", ja: "デバイスを追加" },
  "deviceModal.saveChanges": { en: "Save Changes", ja: "変更を保存" },
  "deviceModal.selectCategory": {
    en: "Select category",
    ja: "カテゴリーを選択",
  },
  "deviceModal.selectStatus": { en: "Select status", ja: "ステータスを選択" },
  "deviceModal.enterDeviceName": {
    en: "Enter device name",
    ja: "デバイス名を入力",
  },
  "deviceModal.enterAssetTag": { en: "Enter asset tag", ja: "資産タグを入力" },
  "deviceModal.enterBrand": { en: "Enter brand", ja: "ブランドを入力" },
  "deviceModal.enterModel": { en: "Enter model", ja: "モデルを入力" },
  "deviceModal.enterImageUrl": { en: "Enter image URL", ja: "画像URLを入力" },
  "deviceModal.enterOS": {
    en: "e.g., Windows 11, macOS Sonoma",
    ja: "例：Windows 11、macOS Sonoma",
  },
  "deviceModal.enterProcessor": {
    en: "e.g., Intel Core i7, M2 Pro",
    ja: "例：Intel Core i7、M2 Pro",
  },
  "deviceModal.enterRAM": { en: "e.g., 16GB, 32GB", ja: "例：16GB、32GB" },
  "deviceModal.enterStorage": {
    en: "e.g., 512GB SSD, 1TB SSD",
    ja: "例：512GB SSD、1TB SSD",
  },

  // Table/Data
  "table.device": { en: "Device", ja: "デバイス" },
  "table.dates": { en: "Dates", ja: "日付" },
  "table.status": { en: "Status", ja: "ステータス" },
  "table.requested": { en: "Requested", ja: "リクエスト日" },
  "table.to": { en: "to", ja: "〜" },
  "table.requester": { en: "Requester", ja: "リクエスト者" },
  "table.assignedTo": { en: "Assigned To", ja: "割り当て先" },
  "table.dueDate": { en: "Due Date", ja: "返却期限" },
  "table.returnDate": { en: "Return Date", ja: "返却日" },
  "table.actions": { en: "Actions", ja: "アクション" },
  "table.noData": { en: "No data available", ja: "データがありません" },
  "table.loading": { en: "Loading...", ja: "読み込み中..." },

  // Chart labels
  "chart.requests": { en: "Requests", ja: "リクエスト" },
  "chart.returns": { en: "Returns", ja: "返却" },
  "chart.available": { en: "Available", ja: "利用可能" },
  "chart.borrowed": { en: "Borrowed", ja: "貸出中" },
  "chart.maintenance": { en: "Maintenance", ja: "メンテナンス" },
  "chart.last7Days": { en: "Last 7 days", ja: "過去7日間" },
  "chart.last30Days": { en: "Last 30 days", ja: "過去30日間" },
  "chart.thisMonth": { en: "This month", ja: "今月" },
  "chart.pickDateRange": { en: "Pick a date range", ja: "日付範囲を選択" },

  // Delete confirmation
  "delete.confirmTitle": { en: "Confirm Deletion", ja: "削除の確認" },
  "delete.confirmMessage": {
    en: "Are you sure you want to delete",
    ja: "本当に削除しますか",
  },
  "delete.confirmMultiple": {
    en: "Are you sure you want to delete these",
    ja: "本当にこれらを削除しますか",
  },
  "delete.cannotBeUndone": {
    en: "This action cannot be undone.",
    ja: "この操作は元に戻せません。",
  },
  "delete.confirmButton": { en: "Delete", ja: "削除" },
  "delete.cancelButton": { en: "Cancel", ja: "キャンセル" },

  // Keyboard shortcuts
  "shortcuts.title": {
    en: "Keyboard Shortcuts",
    ja: "キーボードショートカット",
  },
  "shortcuts.navigation": { en: "Navigation", ja: "ナビゲーション" },
  "shortcuts.actions": { en: "Actions", ja: "アクション" },
  "shortcuts.search": { en: "Search", ja: "検索" },
  "shortcuts.newDevice": { en: "New Device", ja: "新しいデバイス" },
  "shortcuts.newRequest": { en: "New Request", ja: "新しいリクエスト" },
  "shortcuts.toggleTheme": { en: "Toggle Theme", ja: "テーマ切替" },
  "shortcuts.toggleLanguage": { en: "Toggle Language", ja: "言語切替" },
  "shortcuts.help": { en: "Help", ja: "ヘルプ" },

  // Filters
  "filter.all": { en: "All", ja: "すべて" },
  "filter.active": { en: "Active", ja: "アクティブ" },
  "filter.inactive": { en: "Inactive", ja: "非アクティブ" },
  "filter.apply": { en: "Apply Filters", ja: "フィルターを適用" },
  "filter.reset": { en: "Reset Filters", ja: "フィルターをリセット" },
  "filter.showFilters": { en: "Show Filters", ja: "フィルターを表示" },
  "filter.hideFilters": { en: "Hide Filters", ja: "フィルターを非表示" },

  // Pagination
  "pagination.previous": { en: "Previous", ja: "前へ" },
  "pagination.next": { en: "Next", ja: "次へ" },
  "pagination.page": { en: "Page", ja: "ページ" },
  "pagination.of": { en: "of", ja: "/" },
  "pagination.rowsPerPage": { en: "Rows per page", ja: "1ページあたりの行数" },
  "pagination.showing": { en: "Showing", ja: "表示中" },
  "pagination.to": { en: "to", ja: "〜" },
  "pagination.results": { en: "results", ja: "件の結果" },

  // Date/Time
  "date.today": { en: "Today", ja: "今日" },
  "date.yesterday": { en: "Yesterday", ja: "昨日" },
  "date.tomorrow": { en: "Tomorrow", ja: "明日" },
  "date.thisWeek": { en: "This Week", ja: "今週" },
  "date.lastWeek": { en: "Last Week", ja: "先週" },
  "date.thisMonth": { en: "This Month", ja: "今月" },
  "date.lastMonth": { en: "Last Month", ja: "先月" },
  "date.custom": { en: "Custom", ja: "カスタム" },
  "date.from": { en: "From", ja: "開始日" },
  "date.to": { en: "To", ja: "終了日" },
  "date.selectDate": { en: "Select date", ja: "日付を選択" },
  "date.selectDateRange": { en: "Select date range", ja: "日付範囲を選択" },

  // Time ago
  "time.justNow": { en: "Just now", ja: "たった今" },
  "time.minuteAgo": { en: "minute ago", ja: "分前" },
  "time.minutesAgo": { en: "minutes ago", ja: "分前" },
  "time.hourAgo": { en: "hour ago", ja: "時間前" },
  "time.hoursAgo": { en: "hours ago", ja: "時間前" },
  "time.dayAgo": { en: "day ago", ja: "日前" },
  "time.daysAgo": { en: "days ago", ja: "日前" },
  "time.weekAgo": { en: "week ago", ja: "週間前" },
  "time.weeksAgo": { en: "weeks ago", ja: "週間前" },
  "time.monthAgo": { en: "month ago", ja: "ヶ月前" },
  "time.monthsAgo": { en: "months ago", ja: "ヶ月前" },
  "time.yearAgo": { en: "year ago", ja: "年前" },
  "time.yearsAgo": { en: "years ago", ja: "年前" },

  // Error messages
  "error.somethingWentWrong": {
    en: "Something went wrong",
    ja: "エラーが発生しました",
  },
  "error.tryAgain": { en: "Please try again", ja: "もう一度お試しください" },
  "error.notFound": { en: "Not found", ja: "見つかりません" },
  "error.unauthorized": { en: "Unauthorized", ja: "権限がありません" },
  "error.forbidden": { en: "Forbidden", ja: "アクセス禁止" },
  "error.serverError": { en: "Server error", ja: "サーバーエラー" },
  "error.networkError": { en: "Network error", ja: "ネットワークエラー" },
  "error.invalidInput": { en: "Invalid input", ja: "無効な入力" },
  "error.required": { en: "This field is required", ja: "この項目は必須です" },
  "error.invalidEmail": {
    en: "Invalid email address",
    ja: "無効なメールアドレス",
  },
  "error.invalidDate": { en: "Invalid date", ja: "無効な日付" },
  "error.dateInPast": {
    en: "Date cannot be in the past",
    ja: "過去の日付は指定できません",
  },
  "error.endBeforeStart": {
    en: "End date must be after start date",
    ja: "終了日は開始日より後である必要があります",
  },

  // Success messages
  "success.saved": { en: "Saved successfully", ja: "保存しました" },
  "success.updated": { en: "Updated successfully", ja: "更新しました" },
  "success.deleted": { en: "Deleted successfully", ja: "削除しました" },
  "success.created": { en: "Created successfully", ja: "作成しました" },
  "success.sent": { en: "Sent successfully", ja: "送信しました" },
  "success.copied": {
    en: "Copied to clipboard",
    ja: "クリップボードにコピーしました",
  },

  // Loading states
  "loading.loading": { en: "Loading...", ja: "読み込み中..." },
  "loading.pleaseWait": { en: "Please wait", ja: "お待ちください" },
  "loading.processing": { en: "Processing...", ja: "処理中..." },
  "loading.saving": { en: "Saving...", ja: "保存中..." },
  "loading.deleting": { en: "Deleting...", ja: "削除中..." },
  "loading.uploading": { en: "Uploading...", ja: "アップロード中..." },

  // Accessibility
  "a11y.skipToContent": { en: "Skip to content", ja: "コンテンツへスキップ" },
  "a11y.openMenu": { en: "Open menu", ja: "メニューを開く" },
  "a11y.closeMenu": { en: "Close menu", ja: "メニューを閉じる" },
  "a11y.toggleSidebar": { en: "Toggle sidebar", ja: "サイドバーを切替" },
  "a11y.openDialog": { en: "Open dialog", ja: "ダイアログを開く" },
  "a11y.closeDialog": { en: "Close dialog", ja: "ダイアログを閉じる" },
  "a11y.loading": { en: "Loading", ja: "読み込み中" },
  "a11y.sortAscending": { en: "Sort ascending", ja: "昇順で並べ替え" },
  "a11y.sortDescending": { en: "Sort descending", ja: "降順で並べ替え" },

  // Bulk actions
  "bulk.selected": { en: "selected", ja: "件選択中" },
  "bulk.selectAll": { en: "Select all", ja: "すべて選択" },
  "bulk.deselectAll": { en: "Deselect all", ja: "すべて解除" },
  "bulk.deleteSelected": { en: "Delete selected", ja: "選択項目を削除" },
  "bulk.exportSelected": {
    en: "Export selected",
    ja: "選択項目をエクスポート",
  },
  "bulk.actions": { en: "Bulk Actions", ja: "一括操作" },

  // User roles
  "role.admin": { en: "Administrator", ja: "管理者" },
  "role.user": { en: "User", ja: "ユーザー" },
  "role.manager": { en: "Manager", ja: "マネージャー" },
  "role.viewer": { en: "Viewer", ja: "閲覧者" },

  // Device status
  "status.available": { en: "Available", ja: "利用可能" },
  "status.borrowed": { en: "Borrowed", ja: "貸出中" },
  "status.maintenance": { en: "Maintenance", ja: "メンテナンス中" },
  "status.retired": { en: "Retired", ja: "廃棄済み" },
  "status.reserved": { en: "Reserved", ja: "予約済み" },

  // Request status
  "requestStatus.pending": { en: "Pending", ja: "保留中" },
  "requestStatus.approved": { en: "Approved", ja: "承認済み" },
  "requestStatus.rejected": { en: "Rejected", ja: "却下" },
  "requestStatus.active": { en: "Active", ja: "アクティブ" },
  "requestStatus.returned": { en: "Returned", ja: "返却済み" },
  "requestStatus.overdue": { en: "Overdue", ja: "期限超過" },
  "requestStatus.cancelled": { en: "Cancelled", ja: "キャンセル済み" },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined,
);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [language, setLanguage] = useState<Language>("en");

  const t = useCallback(
    (key: string): string => {
      const translation = translations[key];
      if (!translation) return key;
      return translation[language];
    },
    [language],
  );

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
