"use client";

import { useState, useEffect } from "react";
import { UseDashboardType } from "../../hooks/useDashboard";
import { ConnectedAccount, ScheduledPost } from "./mockData";
import SchedulerTopBar from "./SchedulerTopBar";
import ConnectedAccountsRow from "./ConnectedAccountsRow";
import CalendarView from "./CalendarView";
import SchedulerListView from "./SchedulerListView";
import SchedulerAnalytics from "./SchedulerAnalytics";
import ScheduleModal from "./ScheduleModal";
import { apiFetch } from "@/lib/api";

interface SchedulerPanelProps {
  hook: UseDashboardType;
}

export default function SchedulerPanel({ hook }: SchedulerPanelProps) {
  const [viewMode, setViewMode] = useState<"calendar" | "list">("calendar");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  
  const [accounts, setAccounts] = useState<ConnectedAccount[]>([]);
  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>([]);
  
  const loadData = async () => {
    try {
      const [accs, posts] = await Promise.all([
        apiFetch<ConnectedAccount[]>("/api/scheduler/accounts").catch(() => []),
        apiFetch<any[]>("/api/scheduler/posts").catch(() => [])
      ]);
      setAccounts(accs);
      
      // Parse dates
      const parsedPosts = posts.map(p => ({
        ...p,
        date: new Date(p.date)
      }));
      setScheduledPosts(parsedPosts);
    } catch (err) {
      // Silently fail - scheduler data is non-critical
      console.warn("Scheduler data unavailable:", err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenModal = (date?: Date) => {
    setSelectedDate(date || new Date());
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedDate(null);
    loadData(); // reload on close
  };

  return (
    <div className="relative w-full min-h-[80vh] flex flex-col gap-6 animate-in fade-in duration-500 pb-12">
      
      <SchedulerTopBar 
        viewMode={viewMode}
        setViewMode={setViewMode}
        onScheduleNew={() => handleOpenModal()}
      />

      <ConnectedAccountsRow accounts={accounts} />

      <div className="flex-1 bg-white dark:bg-[#1A1A24] border border-cool-gray dark:border-zinc-800 rounded-3xl p-6 shadow-subtle-2">
        {viewMode === "calendar" ? (
          <CalendarView 
            posts={scheduledPosts} 
            onOpenScheduleModal={handleOpenModal} 
          />
        ) : (
          <SchedulerListView 
            posts={scheduledPosts} 
          />
        )}
      </div>

      <SchedulerAnalytics />

      {isModalOpen && (
        <ScheduleModal 
          onClose={handleCloseModal} 
          initialDate={selectedDate}
          hook={hook}
        />
      )}
      
    </div>
  );
}
