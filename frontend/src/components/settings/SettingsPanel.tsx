"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  User,
  Bell,
  Shield,
  CreditCard,
  Link as LinkIcon,
  Settings,
  Camera,
  CheckCircle2,
  Download,
  AlertTriangle,
  Smartphone,
  Globe,
  Monitor,
  Check,
  X,
  Upload,
  Eye,
  EyeOff,
  LogOut,
  ChevronDown,
  ChevronRight,
  Plus
} from "lucide-react";
import { UseDashboardType } from "../../hooks/useDashboard";

type TabId = "profile" | "notifications" | "security" | "billing" | "integrations" | "preferences";

interface SettingsPanelProps {
  hook: UseDashboardType;
}

export default function SettingsPanel({ hook }: SettingsPanelProps) {
  const [activeTab, setActiveTab] = useState<TabId>("profile");

  const tabs: { id: TabId; label: string; icon: any }[] = [
    { id: "profile", label: "Profile", icon: User },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "security", label: "Security", icon: Shield },
    { id: "billing", label: "Billing", icon: CreditCard },
    { id: "integrations", label: "Integrations", icon: LinkIcon },
    { id: "preferences", label: "Preferences", icon: Settings },
  ];

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-ppmondwest tracking-tight text-pitch-black dark:text-canvas-white mb-2">
          Account Settings
        </h1>
        <p className="text-sm font-af text-slate-gray dark:text-zinc-400">
          Manage your account details, billing, and application preferences.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        
        {/* Navigation Sidebar */}
        <div className="w-full lg:w-64 shrink-0 space-y-1 bg-white dark:bg-[#1A1A24] p-3 rounded-[20px] border border-cool-gray dark:border-zinc-800 shadow-subtle-2">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-af font-medium transition-all duration-200 ${
                  isActive 
                    ? "bg-[#534AB7]/10 text-[#534AB7] dark:bg-[#00C2FF]/10 dark:text-[#00C2FF]" 
                    : "text-slate-gray dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 hover:text-pitch-black dark:hover:text-zinc-200"
                }`}
              >
                <tab.icon className={`w-4 h-4 ${isActive ? "opacity-100" : "opacity-70"}`} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="flex-1 w-full bg-white dark:bg-[#1A1A24] border border-cool-gray dark:border-zinc-800 rounded-[24px] shadow-subtle-2 min-h-[500px]">
          {hook.isFetchingSettings || !hook.settingsData ? (
            <div className="flex flex-col items-center justify-center h-64 space-y-4 animate-in fade-in duration-500">
              <div className="w-8 h-8 border-4 border-[#534AB7] border-t-transparent rounded-full animate-spin"></div>
              <p className="text-sm font-af text-zinc-500">Loading your settings...</p>
            </div>
          ) : (
            <>
              {activeTab === "profile" && <ProfileTab hook={hook} />}
              {activeTab === "notifications" && <NotificationsTab hook={hook} />}
              {activeTab === "security" && <SecurityTab hook={hook} />}
              {activeTab === "billing" && <BillingTab hook={hook} />}
              {activeTab === "integrations" && <IntegrationsTab hook={hook} />}
              {activeTab === "preferences" && <PreferencesTab hook={hook} />}
            </>
          )}
        </div>

      </div>
    </div>
  );
}

// ==========================================
// 1. PROFILE TAB
// ==========================================
function ProfileTab({ hook }: { hook: UseDashboardType }) {
  const data = hook.settingsData || {};
  
  const [formData, setFormData] = useState({
    full_name: data.full_name || "",
    username: data.username || "",
    bio: data.bio || "",
    website: data.website || "",
    location: data.location || ""
  });
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    try {
      await hook.updateSettings(formData);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="p-8 animate-in fade-in duration-300">
      <h2 className="text-xl font-bold font-af text-pitch-black dark:text-white mb-6">Public Profile</h2>
      
      {/* Avatar Section */}
      <div className="flex items-center gap-6 mb-8">
        <div className="relative group cursor-pointer">
          <div className="w-24 h-24 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden border-2 border-cool-gray dark:border-zinc-700">
            <img src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&q=80" alt="Avatar" className="w-full h-full object-cover" />
          </div>
          <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <Camera className="w-6 h-6 text-white" />
          </div>
        </div>
        <div>
          <button className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 text-sm font-af font-medium text-pitch-black dark:text-zinc-200 rounded-xl hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors mb-2">
            Upload new picture
          </button>
          <p className="text-[10px] text-zinc-500 font-af">At least 800x800 px recommended. JPG or PNG.</p>
        </div>
      </div>

      {/* Form Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-gray dark:text-zinc-400 font-af">Full Name</label>
          <input type="text" value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} className="w-full bg-transparent border border-cool-gray dark:border-zinc-800 rounded-xl px-4 py-2.5 text-sm font-af text-pitch-black dark:text-white focus:outline-none focus:border-[#534AB7] dark:focus:border-[#00C2FF] transition-colors" />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-gray dark:text-zinc-400 font-af flex items-center gap-1.5">
            Email Address
            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
          </label>
          <input type="email" defaultValue="user@example.com" disabled className="w-full bg-zinc-50 dark:bg-zinc-900 border border-cool-gray dark:border-zinc-800 rounded-xl px-4 py-2.5 text-sm font-af text-zinc-500 cursor-not-allowed" />
        </div>
        <div className="space-y-1.5 md:col-span-2">
          <label className="text-xs font-bold text-slate-gray dark:text-zinc-400 font-af">Username</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 text-sm">@</span>
            <input type="text" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} className="w-full bg-transparent border border-cool-gray dark:border-zinc-800 rounded-xl pl-8 pr-4 py-2.5 text-sm font-af text-pitch-black dark:text-white focus:outline-none focus:border-[#534AB7] dark:focus:border-[#00C2FF] transition-colors" />
          </div>
        </div>
        <div className="space-y-1.5 md:col-span-2">
          <label className="text-xs font-bold text-slate-gray dark:text-zinc-400 font-af">Bio</label>
          <textarea rows={3} value={formData.bio} onChange={e => setFormData({...formData, bio: e.target.value})} className="w-full bg-transparent border border-cool-gray dark:border-zinc-800 rounded-xl px-4 py-2.5 text-sm font-af text-pitch-black dark:text-white focus:outline-none focus:border-[#534AB7] dark:focus:border-[#00C2FF] transition-colors resize-none" />
          <p className="text-[10px] text-zinc-500 font-af text-right">{formData.bio.length}/200</p>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-gray dark:text-zinc-400 font-af">Website</label>
          <input type="url" value={formData.website} onChange={e => setFormData({...formData, website: e.target.value})} className="w-full bg-transparent border border-cool-gray dark:border-zinc-800 rounded-xl px-4 py-2.5 text-sm font-af text-pitch-black dark:text-white focus:outline-none focus:border-[#534AB7] dark:focus:border-[#00C2FF] transition-colors" />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-gray dark:text-zinc-400 font-af">Location</label>
          <input type="text" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} className="w-full bg-transparent border border-cool-gray dark:border-zinc-800 rounded-xl px-4 py-2.5 text-sm font-af text-pitch-black dark:text-white focus:outline-none focus:border-[#534AB7] dark:focus:border-[#00C2FF] transition-colors" />
        </div>
      </div>

      <div className="flex justify-end pt-4 border-t border-cool-gray dark:border-zinc-800 items-center gap-4">
        {saved && <span className="text-emerald-500 text-sm font-bold font-af animate-in fade-in">Saved!</span>}
        <button 
          onClick={handleSave} 
          disabled={hook.isSavingSettings}
          className="px-6 py-2.5 bg-[#534AB7] hover:bg-[#433B9E] text-white rounded-xl font-af font-bold text-sm transition-transform hover:scale-105 active:scale-95 shadow-lg disabled:opacity-50 disabled:pointer-events-none flex items-center gap-2"
        >
          {hook.isSavingSettings ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span> : null}
          Save Changes
        </button>
      </div>
    </div>
  );
}

// ==========================================
// 2. NOTIFICATIONS TAB
// ==========================================
function NotificationsTab({ hook }: { hook: UseDashboardType }) {
  const data = hook.settingsData || {};
  const [emailNotifs, setEmailNotifs] = useState(data.email_notifications || {
    processing: true, reports: true, announcements: false, receipts: true
  });

  const Toggle = ({ label, desc, keyName, defaultChecked, disabled = false }: { label: string, desc: string, keyName?: string, defaultChecked: boolean, disabled?: boolean }) => {
    
    const handleToggle = () => {
      if (disabled || !keyName) return;
      const newNotifs = { ...emailNotifs, [keyName]: !emailNotifs[keyName as keyof typeof emailNotifs] };
      setEmailNotifs(newNotifs);
      hook.updateSettings({ email_notifications: newNotifs });
    };

    return (
      <div className="flex items-start justify-between py-4 border-b border-cool-gray dark:border-zinc-800/50 last:border-0">
        <div>
          <p className={`text-sm font-bold font-af ${disabled ? 'text-zinc-400' : 'text-pitch-black dark:text-white'}`}>{label}</p>
          <p className="text-xs text-slate-gray dark:text-zinc-500 font-af mt-0.5">{desc}</p>
        </div>
        <button 
          disabled={disabled}
          onClick={handleToggle}
          className={`relative w-10 h-6 rounded-full transition-colors duration-200 ease-in-out shrink-0 focus:outline-none ${
            defaultChecked ? 'bg-[#534AB7] dark:bg-[#00C2FF]' : 'bg-zinc-200 dark:bg-zinc-700'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          <span className={`absolute left-1 top-1 w-4 h-4 rounded-full bg-white transition-transform duration-200 ease-in-out ${defaultChecked ? 'translate-x-4' : 'translate-x-0'}`} />
        </button>
      </div>
    );
  };

  return (
    <div className="p-8 animate-in fade-in duration-300">
      <h2 className="text-xl font-bold font-af text-pitch-black dark:text-white mb-2">Email Notifications</h2>
      <p className="text-sm font-af text-slate-gray dark:text-zinc-400 mb-6">Choose what updates you want to receive in your inbox.</p>
      
      <div className="mb-10">
        <Toggle keyName="processing" label="Clip processing complete" desc="Get notified when your long video finishes generating short clips." defaultChecked={emailNotifs.processing} />
        <Toggle keyName="reports" label="Weekly performance report" desc="Receive a summary of your viral scores and downloads every Monday." defaultChecked={emailNotifs.reports} />
        <Toggle keyName="announcements" label="New features announcement" desc="Stay updated with the latest AI tools and platform updates." defaultChecked={emailNotifs.announcements} />
        <Toggle keyName="receipts" label="Payment receipts" desc="Receive invoices for your subscription and one-time purchases." defaultChecked={emailNotifs.receipts} />
        <Toggle label="Security alerts" desc="Important notifications about account activity and security." defaultChecked={true} disabled={true} />
      </div>

      <h2 className="text-xl font-bold font-af text-pitch-black dark:text-white mb-2">Push Notifications</h2>
      <p className="text-sm font-af text-slate-gray dark:text-zinc-400 mb-6">Receive alerts directly on your device (requires browser permission).</p>
      
      <div>
        <Toggle label="Clip processing complete" desc="Instant desktop notification when clips are ready." defaultChecked={true} />
        <Toggle label="Weekly performance report" desc="Quick push alert for weekly stats." defaultChecked={false} />
      </div>
    </div>
  );
}

// ==========================================
// 3. SECURITY TAB
// ==========================================
function SecurityTab({ hook }: { hook: UseDashboardType }) {
  const [showPwd, setShowPwd] = useState(false);
  const [pwdForm, setPwdForm] = useState({ current: "", new: "", confirm: "" });
  const [pwdStatus, setPwdStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);

  const handleUpdatePassword = async () => {
    if (!pwdForm.new || pwdForm.new !== pwdForm.confirm) {
      alert("Passwords do not match!");
      return;
    }
    setPwdStatus("loading");
    try {
      const { supabase } = await import("@/lib/supabase");
      const { error } = await supabase.auth.updateUser({ password: pwdForm.new });
      if (error) throw error;
      setPwdStatus("success");
      setPwdForm({ current: "", new: "", confirm: "" });
      setTimeout(() => setPwdStatus("idle"), 3000);
    } catch (e) {
      console.error(e);
      setPwdStatus("error");
    }
  };
  
  return (
    <div className="p-8 animate-in fade-in duration-300">
      
      {/* Change Password */}
      <div className="mb-12">
        <h2 className="text-xl font-bold font-af text-pitch-black dark:text-white mb-2">Change Password</h2>
        <p className="text-sm font-af text-slate-gray dark:text-zinc-400 mb-6">Update your password to keep your account secure.</p>
        
        <div className="space-y-4 max-w-md">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-gray dark:text-zinc-400 font-af">Current Password</label>
            <div className="relative">
              <input type={showPwd ? "text" : "password"} value={pwdForm.current} onChange={e => setPwdForm({...pwdForm, current: e.target.value})} className="w-full bg-transparent border border-cool-gray dark:border-zinc-800 rounded-xl px-4 py-2.5 text-sm font-af text-pitch-black dark:text-white focus:outline-none focus:border-[#534AB7] transition-colors" />
              <button onClick={() => setShowPwd(!showPwd)} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-300">
                {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-gray dark:text-zinc-400 font-af">New Password</label>
            <input type={showPwd ? "text" : "password"} value={pwdForm.new} onChange={e => setPwdForm({...pwdForm, new: e.target.value})} className="w-full bg-transparent border border-cool-gray dark:border-zinc-800 rounded-xl px-4 py-2.5 text-sm font-af text-pitch-black dark:text-white focus:outline-none focus:border-[#534AB7] transition-colors" />
            {/* Strength Meter Mock */}
            {pwdForm.new.length > 0 && (
              <>
                <div className="flex gap-1 mt-2">
                  <div className={`h-1 flex-1 rounded-full ${pwdForm.new.length > 4 ? 'bg-amber-500' : 'bg-red-500'}`}></div>
                  <div className={`h-1 flex-1 rounded-full ${pwdForm.new.length > 6 ? 'bg-amber-500' : 'bg-zinc-200 dark:bg-zinc-800'}`}></div>
                  <div className={`h-1 flex-1 rounded-full ${pwdForm.new.length > 8 ? 'bg-emerald-500' : 'bg-zinc-200 dark:bg-zinc-800'}`}></div>
                  <div className={`h-1 flex-1 rounded-full ${pwdForm.new.length > 10 ? 'bg-emerald-500' : 'bg-zinc-200 dark:bg-zinc-800'}`}></div>
                </div>
              </>
            )}
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-gray dark:text-zinc-400 font-af">Confirm New Password</label>
            <input type={showPwd ? "text" : "password"} value={pwdForm.confirm} onChange={e => setPwdForm({...pwdForm, confirm: e.target.value})} className="w-full bg-transparent border border-cool-gray dark:border-zinc-800 rounded-xl px-4 py-2.5 text-sm font-af text-pitch-black dark:text-white focus:outline-none focus:border-[#534AB7] transition-colors" />
          </div>
          <div className="flex items-center gap-4 mt-2">
            <button onClick={handleUpdatePassword} disabled={pwdStatus === "loading"} className="px-6 py-2.5 bg-pitch-black dark:bg-white text-white dark:text-pitch-black rounded-xl font-af font-bold text-sm transition-transform hover:scale-105 active:scale-95 disabled:opacity-50">
              {pwdStatus === "loading" ? "Updating..." : "Update Password"}
            </button>
            {pwdStatus === "success" && <span className="text-emerald-500 text-sm font-bold animate-in fade-in">Password Updated!</span>}
            {pwdStatus === "error" && <span className="text-red-500 text-sm font-bold animate-in fade-in">Update Failed</span>}
          </div>
        </div>
      </div>

      {/* Two-Factor Auth */}
      <div className="mb-12 border-t border-cool-gray dark:border-zinc-800 pt-8">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold font-af text-pitch-black dark:text-white mb-2">Two-Factor Authentication (2FA)</h2>
            <p className="text-sm font-af text-slate-gray dark:text-zinc-400 max-w-xl">Add an extra layer of security to your account. We recommend using an authenticator app like Google Authenticator or Authy.</p>
          </div>
          <button onClick={() => setIs2FAEnabled(!is2FAEnabled)} className={`px-4 py-2 rounded-xl font-af font-bold text-sm transition-colors ${is2FAEnabled ? 'bg-red-500/10 text-red-600 border border-red-500/20' : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'}`}>
            {is2FAEnabled ? "Disable 2FA" : "Enable 2FA"}
          </button>
        </div>
      </div>

      {/* Active Sessions */}
      <div className="border-t border-cool-gray dark:border-zinc-800 pt-8">
        <h2 className="text-xl font-bold font-af text-pitch-black dark:text-white mb-2">Active Sessions</h2>
        <p className="text-sm font-af text-slate-gray dark:text-zinc-400 mb-6">These devices are currently logged into your account.</p>
        
        <div className="border border-cool-gray dark:border-zinc-800 rounded-xl overflow-hidden">
          <table className="w-full text-left text-sm font-af">
            <thead className="bg-zinc-50 dark:bg-zinc-900 border-b border-cool-gray dark:border-zinc-800 text-zinc-500">
              <tr>
                <th className="px-4 py-3 font-medium">Device</th>
                <th className="px-4 py-3 font-medium">Location</th>
                <th className="px-4 py-3 font-medium">Last Active</th>
                <th className="px-4 py-3 text-right font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cool-gray dark:divide-zinc-800">
              <tr>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-3">
                    <Monitor className="w-5 h-5 text-zinc-400" />
                    <div>
                      <p className="font-bold text-pitch-black dark:text-white">Windows 11 • Chrome</p>
                      <p className="text-xs text-emerald-500 font-medium">Current Session</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4 text-slate-gray dark:text-zinc-400">San Francisco, CA</td>
                <td className="px-4 py-4 text-slate-gray dark:text-zinc-400">Just now</td>
                <td className="px-4 py-4 text-right">
                  <button className="text-xs text-zinc-400 cursor-not-allowed" disabled>Revoke</button>
                </td>
              </tr>
              <tr>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-3">
                    <Smartphone className="w-5 h-5 text-zinc-400" />
                    <div>
                      <p className="font-bold text-pitch-black dark:text-white">iPhone 14 Pro • Safari</p>
                      <p className="text-xs text-zinc-500">IP: 192.168.1.5</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4 text-slate-gray dark:text-zinc-400">San Francisco, CA</td>
                <td className="px-4 py-4 text-slate-gray dark:text-zinc-400">2 hours ago</td>
                <td className="px-4 py-4 text-right">
                  <button className="text-xs text-red-500 hover:underline font-bold">Revoke</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}

// ==========================================
// 4. BILLING TAB
// ==========================================
function BillingTab({ hook }: { hook: UseDashboardType }) {
  const [upgraded, setUpgraded] = useState(false);
  const storageGB = ((hook.stats.clipsGenerated * 15) / 1024).toFixed(1); // Mock 15MB per clip
  const storagePercent = Math.min(100, Math.round((parseFloat(storageGB) / 5) * 100));
  const clipsPercent = Math.min(100, Math.round((hook.stats.clipsGenerated / 100) * 100)); // Say plan is 100 clips

  return (
    <div className="p-8 animate-in fade-in duration-300">
      
      {/* Current Plan */}
      <div className="flex flex-col md:flex-row gap-8 mb-12">
        <div className="flex-1 bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-900 dark:to-[#1A1A24] border border-cool-gray dark:border-zinc-800 rounded-[24px] p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <span className="px-3 py-1 bg-zinc-200 dark:bg-zinc-800 text-pitch-black dark:text-white text-xs font-bold rounded-full font-af uppercase tracking-wider">Current Plan</span>
          </div>
          <h2 className="text-3xl font-ppmondwest tracking-tight text-pitch-black dark:text-white mb-2">{upgraded ? "Pro Plan" : "Free Plan"}</h2>
          <p className="text-sm text-slate-gray dark:text-zinc-400 font-af mb-6">{upgraded ? "You have unlimited access." : "Perfect for trying out ShortifyAI."}</p>
          
          <ul className="space-y-3 mb-8">
            <li className="flex items-center gap-3 text-sm font-af text-pitch-black dark:text-zinc-300">
              <Check className="w-4 h-4 text-emerald-500" /> {upgraded ? "Unlimited" : "100"} clips / month
            </li>
            <li className="flex items-center gap-3 text-sm font-af text-pitch-black dark:text-zinc-300">
              <Check className="w-4 h-4 text-emerald-500" /> {upgraded ? "4K" : "720p"} HD exports
            </li>
            <li className={`flex items-center gap-3 text-sm font-af ${upgraded ? 'text-pitch-black dark:text-zinc-300' : 'text-zinc-400 dark:text-zinc-600 line-through'}`}>
              {upgraded ? <Check className="w-4 h-4 text-emerald-500" /> : <X className="w-4 h-4 text-zinc-300 dark:text-zinc-700" />} AI Auto-Captions
            </li>
            <li className={`flex items-center gap-3 text-sm font-af ${upgraded ? 'text-pitch-black dark:text-zinc-300' : 'text-zinc-400 dark:text-zinc-600 line-through'}`}>
              {upgraded ? <Check className="w-4 h-4 text-emerald-500" /> : <X className="w-4 h-4 text-zinc-300 dark:text-zinc-700" />} Social Auto-Scheduling
            </li>
          </ul>
        </div>
        
        {/* Usage */}
        <div className="flex-1 space-y-6">
          <h3 className="text-lg font-bold font-af text-pitch-black dark:text-white">Usage this month</h3>
          
          <div>
            <div className="flex justify-between text-sm font-af mb-2">
              <span className="font-medium text-slate-gray dark:text-zinc-300">Clips Generated</span>
              <span className="font-bold text-pitch-black dark:text-white">{hook.stats.clipsGenerated} / {upgraded ? '∞' : '100'}</span>
            </div>
            <div className="h-2.5 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
              <div className="h-full bg-pitch-black dark:bg-white rounded-full transition-all duration-1000" style={{ width: upgraded ? '10%' : `${clipsPercent}%` }}></div>
            </div>
            {clipsPercent > 80 && !upgraded && <p className="text-xs text-red-500 mt-2 font-af font-medium">Approaching limit. Resets in 12 days.</p>}
          </div>

          <div>
            <div className="flex justify-between text-sm font-af mb-2">
              <span className="font-medium text-slate-gray dark:text-zinc-300">Storage Used</span>
              <span className="font-bold text-pitch-black dark:text-white">{storageGB} / {upgraded ? '100' : '5'} GB</span>
            </div>
            <div className="h-2.5 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
              <div className="h-full bg-pitch-black dark:bg-[#00C2FF] rounded-full transition-all duration-1000" style={{ width: upgraded ? '2%' : `${storagePercent}%` }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* Upgrade CTA */}
      {!upgraded && (
        <div className="bg-gradient-to-r from-[#534AB7] to-[#8C83E5] dark:from-[#2A2369] dark:to-[#534AB7] rounded-[24px] p-8 text-white relative overflow-hidden shadow-xl mb-12 animate-in fade-in slide-in-from-bottom-4">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4"></div>
          <div className="relative z-10 md:flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-ppmondwest tracking-tight mb-2">Upgrade to Pro</h2>
              <p className="text-sm font-af text-white/80 max-w-md mb-6 md:mb-0">Unlock unlimited clips, stunning AI captions, 1080p exports, auto-scheduling, and direct API access.</p>
            </div>
            <div className="text-left md:text-right shrink-0">
              <p className="text-sm font-bold font-af text-white/80 uppercase tracking-wider mb-1">Starting at</p>
              <p className="text-4xl font-bold font-af mb-4">₹499 <span className="text-sm font-normal">/ month</span></p>
              <button onClick={() => setUpgraded(true)} className="px-6 py-3 bg-white text-[#534AB7] rounded-xl font-af font-bold text-sm transition-transform hover:scale-105 active:scale-95 shadow-lg w-full md:w-auto">
                Upgrade Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment History */}
      <div>
        <h2 className="text-xl font-bold font-af text-pitch-black dark:text-white mb-2">Payment History</h2>
        <div className="border border-cool-gray dark:border-zinc-800 rounded-xl overflow-hidden mt-4">
          <table className="w-full text-left text-sm font-af">
            <thead className="bg-zinc-50 dark:bg-zinc-900 border-b border-cool-gray dark:border-zinc-800 text-zinc-500">
              <tr>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Plan</th>
                <th className="px-4 py-3 font-medium">Amount</th>
                <th className="px-4 py-3 text-right font-medium">Invoice</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cool-gray dark:divide-zinc-800">
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-zinc-400">
                  No payment history available on the Free Plan.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}

// ==========================================
// 5. INTEGRATIONS TAB
// ==========================================

const YoutubeIcon = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    className={className}
  >
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
  </svg>
);

function IntegrationsTab({ hook }: { hook: UseDashboardType }) {
  const [connections, setConnections] = useState<Record<string, boolean>>({
    YouTube: true,
  });
  const [apiKeys, setApiKeys] = useState<{ id: string, key: string }[]>([]);

  const handleConnect = (app: string) => {
    // Simulated OAuth popup delay
    const win = window.open("", "_blank", "width=500,height=600");
    if (win) win.document.write(`<h2>Connecting to ${app}...</h2><p>Please authorize ShortifyAI.</p>`);
    
    setTimeout(() => {
      if (win) win.close();
      setConnections(prev => ({ ...prev, [app]: true }));
    }, 1500);
  };

  const handleDisconnect = (app: string) => {
    setConnections(prev => ({ ...prev, [app]: false }));
  };

  const generateApiKey = () => {
    const newKey = "sk_live_" + Array.from(crypto.getRandomValues(new Uint8Array(16))).map(b => b.toString(16).padStart(2, '0')).join('');
    setApiKeys([...apiKeys, { id: Math.random().toString(), key: newKey }]);
  };

  return (
    <div className="p-8 animate-in fade-in duration-300">
      
      {/* Connected Accounts */}
      <div className="mb-12">
        <h2 className="text-xl font-bold font-af text-pitch-black dark:text-white mb-2">Connected Accounts</h2>
        <p className="text-sm font-af text-slate-gray dark:text-zinc-400 mb-6">Connect your social accounts to schedule and auto-post clips directly.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { name: "YouTube", handle: "JohnDoeClips", Icon: YoutubeIcon, color: "text-red-500", desc: "Upload & schedule shorts" },
          ].map((app, idx) => {
            const isConnected = connections[app.name];
            return (
              <div key={idx} className="border border-cool-gray dark:border-zinc-800 rounded-xl p-4 flex flex-col justify-between h-36 hover:border-[#534AB7]/50 transition-colors">
                <div className="flex justify-between items-start">
                  <app.Icon className={`w-8 h-8 ${app.color}`} />
                  {isConnected && <span className="w-2 h-2 rounded-full bg-emerald-500"></span>}
                </div>
                <div>
                  <p className="font-bold text-pitch-black dark:text-white font-af text-sm">{app.name}</p>
                  {app.desc && <p className="text-[10px] text-zinc-500 font-af">{app.desc}</p>}
                  {isConnected ? (
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-xs text-zinc-500 font-af">{app.handle}</p>
                      <button onClick={() => handleDisconnect(app.name)} className="text-[10px] text-red-500 font-bold hover:underline font-af">Disconnect</button>
                    </div>
                  ) : (
                    <button onClick={() => handleConnect(app.name)} className="mt-2 text-xs font-bold text-[#534AB7] dark:text-[#00C2FF] hover:underline font-af">
                      Connect
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* API Access */}
      <div className="mb-12 border-t border-cool-gray dark:border-zinc-800 pt-8">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-bold font-af text-pitch-black dark:text-white flex items-center gap-2">
            API Access
          </h2>
          <button onClick={generateApiKey} className="px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 text-pitch-black dark:text-white rounded-lg text-xs font-bold font-af hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors">
            Generate New Key
          </button>
        </div>
        <p className="text-sm font-af text-slate-gray dark:text-zinc-400 mb-6 max-w-2xl">Use our REST API to programmatically generate clips from your own apps. <a href="#" className="text-[#534AB7] dark:text-[#00C2FF] hover:underline">Read the docs</a>.</p>
        
        {apiKeys.length === 0 ? (
          <p className="text-sm text-zinc-500 font-af">No API keys generated yet.</p>
        ) : (
          <div className="space-y-3">
            {apiKeys.map((k) => (
              <div key={k.id} className="bg-zinc-50 dark:bg-zinc-900 border border-cool-gray dark:border-zinc-800 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-1 w-full">
                  <p className="text-xs font-bold text-zinc-500 font-af">Production API Key</p>
                  <div className="flex gap-2 w-full">
                    <input type="text" value={k.key} readOnly className="bg-transparent border border-zinc-300 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm font-mono w-full max-w-sm text-pitch-black dark:text-white" />
                    <button onClick={() => navigator.clipboard.writeText(k.key)} className="px-4 py-2 bg-zinc-200 dark:bg-zinc-800 text-pitch-black dark:text-white rounded-lg text-sm font-bold font-af hover:bg-zinc-300 dark:hover:bg-zinc-700">Copy</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Webhooks */}
      <div className="border-t border-cool-gray dark:border-zinc-800 pt-8">
        <h2 className="text-xl font-bold font-af text-pitch-black dark:text-white mb-2">Webhooks</h2>
        <p className="text-sm font-af text-slate-gray dark:text-zinc-400 mb-6">Receive real-time HTTP POST payloads when events happen.</p>
        
        <div className="space-y-4 max-w-xl">
          <div className="flex gap-2">
            <input type="url" placeholder="https://your-domain.com/webhook" className="w-full bg-transparent border border-cool-gray dark:border-zinc-800 rounded-xl px-4 py-2 text-sm font-af text-pitch-black dark:text-white focus:outline-none focus:border-[#534AB7] transition-colors" />
            <button className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 text-pitch-black dark:text-white rounded-xl text-sm font-bold font-af hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors shrink-0 flex items-center gap-1">
              <Plus className="w-4 h-4" /> Add
            </button>
          </div>
          <div className="border border-cool-gray dark:border-zinc-800 rounded-xl p-4 bg-zinc-50 dark:bg-zinc-900/50">
            <div className="flex justify-between items-center mb-2">
              <p className="text-sm font-bold font-af text-pitch-black dark:text-white">https://hooks.zapier.com/hooks/catch/123/</p>
              <button className="text-xs text-[#534AB7] dark:text-[#00C2FF] font-bold hover:underline font-af">Test</button>
            </div>
            <div className="flex gap-2">
              <span className="px-2 py-1 bg-zinc-200 dark:bg-zinc-800 text-zinc-500 text-[10px] rounded font-mono">clip.ready</span>
              <span className="px-2 py-1 bg-zinc-200 dark:bg-zinc-800 text-zinc-500 text-[10px] rounded font-mono">clip.failed</span>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}

// ==========================================
// 6. PREFERENCES TAB
// ==========================================
function PreferencesTab({ hook }: { hook: UseDashboardType }) {
  const data = hook.settingsData || {};

  const handleThemeChange = (newTheme: string) => {
    hook.updateSettings({ theme: newTheme });
  };

  const SelectDropdown = ({ label, options, defaultValue, settingKey }: { label: string, options: string[], defaultValue: string, settingKey: string }) => (
    <div className="space-y-1.5 flex-1">
      <label className="text-xs font-bold text-slate-gray dark:text-zinc-400 font-af">{label}</label>
      <div className="relative">
        <select 
          defaultValue={defaultValue} 
          onChange={(e) => hook.updateSettings({ [settingKey]: e.target.value })}
          className="w-full bg-transparent border border-cool-gray dark:border-zinc-800 rounded-xl px-4 py-2.5 text-sm font-af text-pitch-black dark:text-white focus:outline-none focus:border-[#534AB7] transition-colors appearance-none cursor-pointer"
        >
          {options.map((opt: string) => <option key={opt} value={opt} className="bg-white dark:bg-zinc-900">{opt}</option>)}
        </select>
        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
      </div>
    </div>
  );

  // Danger Zone Actions
  const handleExportData = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({ settings: data, stats: hook.stats, clips: hook.libraryClips }));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "shortifyai_data_export.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleDeleteClips = async () => {
    if (!confirm("Are you sure you want to permanently delete ALL clips? This cannot be undone.")) return;
    try {
      const { user } = await import("@/lib/auth").then(m => m.getCurrentUser());
      if (user) await import("@/lib/api").then(m => m.apiPost("/api/clips/cleanup", { userId: user.id }));
      hook.setLibraryClips([]);
      alert("All clips deleted successfully.");
    } catch (e) {
      alert("Failed to delete clips.");
    }
  };

  const handleLogout = async () => {
    try {
      const { supabase } = await import("@/lib/supabase");
      await supabase.auth.signOut();
      window.location.href = "/login";
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="p-8 animate-in fade-in duration-300">
      
      {/* App Preferences */}
      <div className="mb-12">
        <h2 className="text-xl font-bold font-af text-pitch-black dark:text-white mb-2">App Preferences</h2>
        <p className="text-sm font-af text-slate-gray dark:text-zinc-400 mb-6">Customize the studio interface to your liking.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-gray dark:text-zinc-400 font-af">Theme</label>
            <div className="flex bg-zinc-100 dark:bg-zinc-900 p-1 rounded-xl">
              <button 
                onClick={() => handleThemeChange("Light")} 
                className={`flex-1 py-1.5 text-sm font-af font-medium rounded-lg transition-colors ${data.theme === 'Light' ? 'bg-white shadow-sm text-pitch-black' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                Light
              </button>
              <button 
                onClick={() => handleThemeChange("Dark")} 
                className={`flex-1 py-1.5 text-sm font-af font-medium rounded-lg transition-colors ${data.theme === 'Dark' ? 'bg-zinc-800 shadow-sm text-white' : 'text-zinc-500 hover:text-zinc-700'}`}
              >
                Dark
              </button>
              <button 
                onClick={() => handleThemeChange("System")}
                className={`flex-1 py-1.5 text-sm font-af font-medium rounded-lg transition-colors ${data.theme === 'System' || !data.theme ? 'bg-white dark:bg-zinc-800 shadow-sm text-pitch-black dark:text-white' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
              >
                System
              </button>
            </div>
          </div>
          
          <SelectDropdown label="Language" settingKey="language" options={["English", "Spanish", "French", "German", "Hindi"]} defaultValue={data.language || "English"} />
          <SelectDropdown label="Timezone" settingKey="timezone" options={["Asia/Kolkata", "America/New_York", "Europe/London", "UTC"]} defaultValue={data.timezone || "Asia/Kolkata"} />
          <SelectDropdown label="Date Format" settingKey="date_format" options={["DD/MM/YYYY", "MM/DD/YYYY", "YYYY-MM-DD"]} defaultValue={data.date_format || "DD/MM/YYYY"} />
        </div>
      </div>

      {/* Default Clip Settings */}
      <div className="mb-12 border-t border-cool-gray dark:border-zinc-800 pt-8">
        <h2 className="text-xl font-bold font-af text-pitch-black dark:text-white mb-2">Default Clip Settings</h2>
        <p className="text-sm font-af text-slate-gray dark:text-zinc-400 mb-6">These settings will be pre-selected when you create new clips.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mb-6">
          <SelectDropdown settingKey="default_aspect_ratio" label="Default Aspect Ratio" options={["9:16 (Vertical)", "16:9 (Horizontal)", "1:1 (Square)"]} defaultValue={data.default_aspect_ratio || "9:16 (Vertical)"} />
          <SelectDropdown settingKey="default_clip_length" label="Default Clip Length" options={["15s", "30s", "45s", "60s", "Custom"]} defaultValue={data.default_clip_length || "30s"} />
          <SelectDropdown settingKey="default_platform" label="Default Platform" options={["TikTok", "Reels", "Shorts", "All"]} defaultValue={data.default_platform || "TikTok"} />
          <SelectDropdown settingKey="default_caption_style" label="Default Caption Style" options={["Viral Yellow", "Clean White", "Hormozi Style", "Minimal"]} defaultValue={data.default_caption_style || "Viral Yellow"} />
        </div>

        <div className="max-w-2xl space-y-4">
          <label className="flex items-center gap-3 cursor-pointer group">
            <div className="relative flex items-center justify-center w-5 h-5 border-2 border-[#534AB7] dark:border-[#00C2FF] rounded bg-[#534AB7] dark:bg-[#00C2FF]">
              <Check className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-sm font-medium font-af text-pitch-black dark:text-zinc-300 group-hover:text-black dark:group-hover:text-white transition-colors">Auto-download zip when processing completes</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer group">
            <div className="relative flex items-center justify-center w-5 h-5 border-2 border-cool-gray dark:border-zinc-600 rounded bg-transparent">
              {/* Empty checkbox */}
            </div>
            <span className="text-sm font-medium font-af text-pitch-black dark:text-zinc-300 group-hover:text-black dark:group-hover:text-white transition-colors">Email me when generation finishes</span>
          </label>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="border-t border-red-200 dark:border-red-900/50 pt-8 mt-16">
        <h2 className="text-xl font-bold font-af text-red-600 dark:text-red-500 mb-2 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" /> Danger Zone
        </h2>
        <p className="text-sm font-af text-slate-gray dark:text-zinc-400 mb-6">Irreversible and destructive actions for your account.</p>
        
        <div className="space-y-4 max-w-2xl border border-red-200 dark:border-red-900/30 rounded-xl p-4 bg-red-50/50 dark:bg-red-950/10">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-red-100 dark:border-red-900/30">
            <div>
              <p className="text-sm font-bold text-pitch-black dark:text-white font-af">Export All My Data</p>
              <p className="text-xs text-slate-gray dark:text-zinc-500 font-af mt-0.5">Download a zip of all your videos, transcripts, and account info.</p>
            </div>
            <button onClick={handleExportData} className="px-4 py-2 bg-white dark:bg-zinc-800 border border-cool-gray dark:border-zinc-700 text-pitch-black dark:text-white text-sm font-bold font-af rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors whitespace-nowrap">
              Export Data
            </button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-red-100 dark:border-red-900/30">
            <div>
              <p className="text-sm font-bold text-pitch-black dark:text-white font-af">Delete All Clips</p>
              <p className="text-xs text-slate-gray dark:text-zinc-500 font-af mt-0.5">Permanently remove all generated videos from our servers. This cannot be undone.</p>
            </div>
            <button onClick={handleDeleteClips} className="px-4 py-2 bg-white dark:bg-zinc-800 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-500 text-sm font-bold font-af rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors whitespace-nowrap">
              Delete All Clips
            </button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-pitch-black dark:text-white font-af">Delete Account</p>
              <p className="text-xs text-slate-gray dark:text-zinc-500 font-af mt-0.5">Permanently delete your account and all associated data. Requires password.</p>
            </div>
            <button className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-bold font-af rounded-lg transition-colors whitespace-nowrap">
              Delete Account
            </button>
          </div>

        </div>

        {/* Logout Button */}
        <div className="mt-8">
          <button onClick={handleLogout} className="flex items-center gap-2 text-sm font-bold font-af text-red-600 dark:text-red-500 hover:text-red-700 dark:hover:text-red-400 transition-colors">
            <LogOut className="w-4 h-4" />
            Sign out of ShortifyAI
          </button>
        </div>

      </div>

    </div>
  );
}
