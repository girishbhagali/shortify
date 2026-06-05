import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { MOCK_ANALYTICS_DATA } from "./mockData";
import { TrendingUp, CalendarCheck, Clock, CheckCircle2 } from "lucide-react";

export default function SchedulerAnalytics() {
  return (
    <div className="grid lg:grid-cols-12 gap-6 w-full">
      <div className="lg:col-span-8 bg-white dark:bg-[#1A1A24] border border-cool-gray dark:border-zinc-800 rounded-[24px] p-6 shadow-subtle-2">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-bold text-pitch-black dark:text-canvas-white font-af">Last 7 Days Performance</h2>
            <p className="text-xs text-slate-gray font-af">Number of scheduled posts per day</p>
          </div>
          <div className="flex items-center gap-2 text-xs font-bold font-af bg-emerald-500/10 text-emerald-500 px-2.5 py-1.5 rounded-lg">
            <TrendingUp className="w-3.5 h-3.5" />
            +24% vs last week
          </div>
        </div>
        
        <div className="h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
            <BarChart data={MOCK_ANALYTICS_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#3f3f46" opacity={0.2} />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fill: '#71717a' }} 
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fill: '#71717a' }}
              />
              <Tooltip 
                cursor={{ fill: '#3f3f46', opacity: 0.1 }}
                contentStyle={{ 
                  backgroundColor: '#18181b', 
                  border: '1px solid #27272a',
                  borderRadius: '12px',
                  fontSize: '12px',
                  color: '#fff'
                }}
              />
              <Bar 
                dataKey="posts" 
                fill="#534AB7" 
                radius={[4, 4, 0, 0]} 
                barSize={32}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="lg:col-span-4 flex flex-col gap-4">
        {[
          { label: "Total Scheduled", value: 14, icon: CalendarCheck, color: "text-blue-500", bg: "bg-blue-500/10" },
          { label: "Successfully Posted", value: 42, icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-500/10" },
          { label: "Pending Today", value: 3, icon: Clock, color: "text-orange-500", bg: "bg-orange-500/10" },
        ].map((stat, i) => (
          <div key={i} className="flex-1 bg-white dark:bg-[#1A1A24] border border-cool-gray dark:border-zinc-800 rounded-2xl p-5 shadow-sm flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${stat.bg}`}>
              <stat.icon className={`w-6 h-6 ${stat.color}`} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-gray dark:text-zinc-500 uppercase tracking-wider font-af mb-1">
                {stat.label}
              </p>
              <p className="text-2xl font-ppmondwest text-pitch-black dark:text-white">
                {stat.value}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
