import { useState } from "react";
import { CheckCircle2, ArrowRight, Camera, MessageCircle, Video, Smartphone, X, Loader2 } from "lucide-react";
import { ConnectedAccount } from "./mockData";
import { getBackendUrl } from "@/lib/api";

export default function ConnectedAccountsRow({ accounts }: { accounts: ConnectedAccount[] }) {
  const [disconnecting, setDisconnecting] = useState<string | null>(null);
  const [localAccounts, setLocalAccounts] = useState(accounts);

  // Sync with parent when accounts prop changes
  if (accounts !== localAccounts && !disconnecting) {
    setLocalAccounts(accounts);
  }

  const getIcon = (platform: string) => {
    switch (platform) {
      case "instagram": return <Camera className="w-5 h-5" />;
      case "tiktok": return <Smartphone className="w-5 h-5" />;
      case "youtube": return <Video className="w-5 h-5" />;
      case "twitter": return <MessageCircle className="w-5 h-5" />;
      default: return <div className="w-5 h-5" />;
    }
  };

  const getColors = (platform: string, connected: boolean) => {
    if (!connected) return "bg-white dark:bg-[#1A1A24] text-slate-gray border-cool-gray dark:border-zinc-800 border-dashed hover:border-[#534AB7]";
    switch (platform) {
      case "instagram": return "bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-pink-500/30 text-pink-600 dark:text-pink-400";
      case "tiktok": return "bg-zinc-100 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-black dark:text-white";
      case "youtube": return "bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400";
      case "twitter": return "bg-blue-500/10 border-blue-500/30 text-blue-500";
      default: return "";
    }
  };

  const handleConnect = (platform: string) => {
    if (platform === "twitter") {
      alert("Twitter integration coming soon!");
      return;
    }
    window.location.href = getBackendUrl(`/api/auth/${platform}/connect`);
  };

  const handleDisconnect = async (platform: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Disconnect your ${platform} account?`)) return;

    setDisconnecting(platform);
    try {
      const resp = await fetch(getBackendUrl(`/api/auth/${platform}/disconnect`), {
        method: "DELETE",
      });
      if (resp.ok) {
        setLocalAccounts(prev =>
          prev.map(a => a.platform === platform ? { ...a, isConnected: false, handle: undefined } : a)
        );
      }
    } catch (err) {
      console.error("Disconnect failed:", err);
    } finally {
      setDisconnecting(null);
    }
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
      {localAccounts.map(acc => (
        <button 
          key={acc.id}
          onClick={() => !acc.isConnected && handleConnect(acc.platform)}
          className={`flex items-center justify-between p-4 rounded-2xl border transition-all hover:shadow-md group relative ${getColors(acc.platform, acc.isConnected)}`}
        >
          <div className="flex items-center gap-3">
            {getIcon(acc.platform)}
            <div className="text-left">
              <p className="text-xs font-bold font-af capitalize leading-tight">
                {acc.platform}
              </p>
              {acc.isConnected && acc.handle && (
                <p className="text-[10px] font-medium opacity-80 mt-0.5">{acc.handle}</p>
              )}
            </div>
          </div>
          
          {acc.isConnected ? (
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              {/* Disconnect button */}
              <div 
                onClick={(e) => handleDisconnect(acc.platform, e)}
                className="w-6 h-6 rounded-full bg-red-500/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/30 cursor-pointer"
                title={`Disconnect ${acc.platform}`}
              >
                {disconnecting === acc.platform ? (
                  <Loader2 className="w-3 h-3 text-red-500 animate-spin" />
                ) : (
                  <X className="w-3 h-3 text-red-500" />
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity">
              Connect <ArrowRight className="w-3 h-3" />
            </div>
          )}
        </button>
      ))}
    </div>
  );
}
