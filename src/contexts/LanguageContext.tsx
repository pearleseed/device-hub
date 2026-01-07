import React, { createContext, useContext, useState, useCallback } from 'react';

type Language = 'en' | 'ja';

interface Translations {
  [key: string]: {
    en: string;
    ja: string;
  };
}

const translations: Translations = {
  // Navigation
  'nav.dashboard': { en: 'Dashboard', ja: 'ダッシュボード' },
  'nav.inventory': { en: 'Inventory', ja: '在庫管理' },
  'nav.requests': { en: 'Requests', ja: 'リクエスト' },
  'nav.users': { en: 'Users', ja: 'ユーザー' },
  'nav.settings': { en: 'Settings', ja: '設定' },
  'nav.catalog': { en: 'Device Catalog', ja: 'デバイスカタログ' },
  'nav.myDashboard': { en: 'My Dashboard', ja: 'マイダッシュボード' },
  
  // Common
  'common.search': { en: 'Search', ja: '検索' },
  'common.add': { en: 'Add', ja: '追加' },
  'common.edit': { en: 'Edit', ja: '編集' },
  'common.delete': { en: 'Delete', ja: '削除' },
  'common.save': { en: 'Save', ja: '保存' },
  'common.cancel': { en: 'Cancel', ja: 'キャンセル' },
  'common.actions': { en: 'Actions', ja: 'アクション' },
  'common.status': { en: 'Status', ja: 'ステータス' },
  'common.name': { en: 'Name', ja: '名前' },
  'common.email': { en: 'Email', ja: 'メール' },
  'common.department': { en: 'Department', ja: '部署' },
  'common.role': { en: 'Role', ja: '役割' },
  'common.logout': { en: 'Log out', ja: 'ログアウト' },
  'common.profile': { en: 'Profile', ja: 'プロフィール' },
  
  // Dashboard
  'dashboard.title': { en: 'Dashboard', ja: 'ダッシュボード' },
  'dashboard.overview': { en: 'Overview of your device management system', ja: 'デバイス管理システムの概要' },
  'dashboard.totalDevices': { en: 'Total Devices', ja: '総デバイス数' },
  'dashboard.devicesOut': { en: 'Devices Out', ja: '貸出中' },
  'dashboard.pendingRequests': { en: 'Pending Requests', ja: '保留中のリクエスト' },
  'dashboard.totalUsers': { en: 'Total Users', ja: '総ユーザー数' },
  'dashboard.usageTrends': { en: 'Usage Trends', ja: '利用傾向' },
  'dashboard.deviceDistribution': { en: 'Device Distribution', ja: 'デバイス分布' },
  
  // Users page
  'users.title': { en: 'User Management', ja: 'ユーザー管理' },
  'users.subtitle': { en: 'Manage all users in your organization', ja: '組織内の全ユーザーを管理' },
  'users.addUser': { en: 'Add User', ja: 'ユーザー追加' },
  'users.allUsers': { en: 'All Users', ja: '全ユーザー' },
  'users.admin': { en: 'Admin', ja: '管理者' },
  'users.user': { en: 'User', ja: 'ユーザー' },
  'users.activeLoans': { en: 'Active Loans', ja: 'アクティブな貸出' },
  
  // Settings page
  'settings.title': { en: 'Settings', ja: '設定' },
  'settings.subtitle': { en: 'Manage your application settings', ja: 'アプリケーション設定を管理' },
  'settings.general': { en: 'General', ja: '一般' },
  'settings.language': { en: 'Language', ja: '言語' },
  'settings.languageDesc': { en: 'Select your preferred language', ja: '希望の言語を選択' },
  'settings.notifications': { en: 'Notifications', ja: '通知' },
  'settings.notificationsDesc': { en: 'Configure notification preferences', ja: '通知設定を構成' },
  'settings.emailNotifications': { en: 'Email Notifications', ja: 'メール通知' },
  'settings.emailNotificationsDesc': { en: 'Receive email notifications for important updates', ja: '重要な更新のメール通知を受信' },
  'settings.appearance': { en: 'Appearance', ja: '外観' },
  'settings.darkMode': { en: 'Dark Mode', ja: 'ダークモード' },
  'settings.darkModeDesc': { en: 'Enable dark mode for the interface', ja: 'インターフェースのダークモードを有効化' },
  'settings.security': { en: 'Security', ja: 'セキュリティ' },
  'settings.changePassword': { en: 'Change Password', ja: 'パスワード変更' },
  'settings.twoFactor': { en: 'Two-Factor Authentication', ja: '二要素認証' },
  'settings.twoFactorDesc': { en: 'Add an extra layer of security to your account', ja: 'アカウントにセキュリティ層を追加' },
  
  // Inventory
  'inventory.title': { en: 'Inventory Management', ja: '在庫管理' },
  'inventory.subtitle': { en: 'Manage all devices in your inventory', ja: '在庫内の全デバイスを管理' },
  'inventory.addDevice': { en: 'Add Device', ja: 'デバイス追加' },
  'inventory.allDevices': { en: 'All Devices', ja: '全デバイス' },
  
  // Requests
  'requests.title': { en: 'Request Management', ja: 'リクエスト管理' },
  'requests.subtitle': { en: 'Review and manage device requests', ja: 'デバイスリクエストを確認・管理' },
  'requests.pending': { en: 'Pending', ja: '保留中' },
  'requests.approved': { en: 'Approved', ja: '承認済み' },
  'requests.active': { en: 'Active', ja: 'アクティブ' },
  'requests.returned': { en: 'Returned', ja: '返却済み' },
  'requests.approve': { en: 'Approve', ja: '承認' },
  'requests.reject': { en: 'Reject', ja: '却下' },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('en');

  const t = useCallback((key: string): string => {
    const translation = translations[key];
    if (!translation) return key;
    return translation[language];
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
