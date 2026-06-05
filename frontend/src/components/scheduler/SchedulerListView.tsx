import { ScheduledPost } from "./mockData";
import { Edit2, Send, Trash2, Smartphone, Camera, Video, MessageCircle } from "lucide-react";

export default function SchedulerListView({ posts }: { posts: ScheduledPost[] }) {
  
  const getStatusColor = (status: string) => {
    switch(status) {
      case "scheduled": return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case "posted": return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
      case "failed": return "bg-red-500/10 text-red-500 border-red-500/20";
      case "draft": return "bg-zinc-500/10 text-zinc-500 border-zinc-500/20";
      default: return "";
    }
  };

  const getIcon = (platform: string) => {
    switch (platform) {
      case "instagram": return <Camera className="w-4 h-4 text-pink-500" />;
      case "tiktok": return <Smartphone className="w-4 h-4 text-pitch-black dark:text-white" />;
      case "youtube": return <Video className="w-4 h-4 text-red-500" />;
      case "twitter": return <MessageCircle className="w-4 h-4 text-blue-500" />;
      default: return null;
    }
  };

  return (
    <div className="w-full overflow-x-auto pb-4">
      <table className="w-full text-left border-collapse min-w-[800px]">
        <thead>
          <tr className="border-b border-cool-gray dark:border-zinc-800 text-[10px] font-bold text-slate-gray dark:text-zinc-500 uppercase tracking-wider font-af">
            <th className="p-4 w-12">
              <input type="checkbox" className="w-4 h-4 accent-[#534AB7]" />
            </th>
            <th className="p-4">Clip</th>
            <th className="p-4">Platform</th>
            <th className="p-4">Scheduled Time</th>
            <th className="p-4">Status</th>
            <th className="p-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {posts.map(post => (
            <tr key={post.id} className="border-b border-cool-gray dark:border-zinc-800/50 hover:bg-zinc-50 dark:hover:bg-[#1A1A24] transition-colors">
              <td className="p-4">
                <input type="checkbox" className="w-4 h-4 accent-[#534AB7] cursor-pointer" />
              </td>
              <td className="p-4">
                <div className="flex items-center gap-3">
                  {post.thumbnail ? (
                    <img src={post.thumbnail} alt="" className="w-10 h-10 rounded-lg object-cover bg-zinc-900 shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-slate-gray dark:text-zinc-500 font-bold text-xs uppercase shrink-0 border border-cool-gray dark:border-zinc-700 font-af">
                      {post.platform.substring(0, 2)}
                    </div>
                  )}
                  <div>
                    <p className="font-bold text-sm text-pitch-black dark:text-zinc-200 line-clamp-1">{post.title}</p>
                    <p className="text-[10px] text-slate-gray font-af line-clamp-1 mt-0.5 max-w-[200px]">{post.caption}</p>
                  </div>
                </div>
              </td>
              <td className="p-4">
                <div className="flex items-center gap-1.5 bg-white dark:bg-zinc-800 w-fit px-2 py-1 rounded-md border border-cool-gray dark:border-zinc-700 shadow-sm">
                  {getIcon(post.platform)}
                  <span className="text-xs font-bold capitalize font-af">{post.platform}</span>
                </div>
              </td>
              <td className="p-4 text-sm font-af text-pitch-black dark:text-zinc-300">
                {post.date.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </td>
              <td className="p-4">
                <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider border ${getStatusColor(post.status)}`}>
                  {post.status}
                </span>
              </td>
              <td className="p-4 text-right">
                <div className="flex items-center justify-end gap-1">
                  <button title="Edit Schedule" className="p-1.5 hover:bg-white dark:hover:bg-zinc-800 rounded-lg text-slate-gray dark:text-zinc-400 transition-colors border border-transparent hover:border-cool-gray dark:hover:border-zinc-700 shadow-sm">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button title="Post Now" className="p-1.5 hover:bg-[#534AB7]/10 hover:text-[#534AB7] rounded-lg text-slate-gray dark:text-zinc-400 transition-colors border border-transparent shadow-sm">
                    <Send className="w-4 h-4" />
                  </button>
                  <button title="Delete" className="p-1.5 hover:bg-red-500/10 hover:text-red-500 rounded-lg text-slate-gray dark:text-zinc-400 transition-colors border border-transparent shadow-sm">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
