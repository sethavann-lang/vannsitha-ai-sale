"use client";

import { useState, useEffect } from "react";
import {
  Bot,
  MessageSquare,
  Sparkles,
  ShieldCheck,
  Plus,
  Trash2,
  Save,
  PauseCircle,
  PlayCircle,
  RefreshCw,
  Sliders,
  BookOpen,
  CheckCircle2,
  Clock,
  Send,
  User,
  ExternalLink,
  Layers,
  Megaphone,
  Settings as SettingsIcon,
  Database,
  Radio,
  TrendingUp,
  DollarSign,
  Users,
  MessageCircle,
  ArrowRight,
  ArrowLeft,
  AlertTriangle,
  Phone,
  Calendar,
  Check,
  X,
  Filter,
  Search,
  Tag,
  Eye,
  ChevronRight,
  Copy,
  Kanban,
  BellRing,
  Edit,
} from "lucide-react";

// --- Data Types ---

interface KnowledgeItem {
  id: string;
  title: string;
  category: string | null;
  content: string;
  createdAt: string;
}

interface Message {
  id: string;
  sender: string;
  text: string;
  createdAt: string;
}

interface Conversation {
  id: string;
  psid: string;
  customerName: string | null;
  isAiPaused: boolean;
  messages: Message[];
  createdAt?: string;
  updatedAt: string;
}

interface PageConfig {
  id: string;
  pageId: string;
  pageName: string | null;
  systemPrompt: string;
  autoReplyComment: boolean;
  privateReplyComment: boolean;
  autoReplyInbox: boolean;
  knowledgeItems: KnowledgeItem[];
}

interface HealthStatus {
  facebook: { connected: boolean; name: string; id: string };
  webhook: { active: boolean; url: string };
  ai: { online: boolean; provider: string; model: string; latency: string };
  database: { connected: boolean; type: string };
  token: { type: string; status: string; valid: boolean };
}

interface RecentConv {
  id: string;
  psid: string;
  customerName: string;
  source: string;
  lastUserMessage: string;
  lastAiReply: string;
  updatedAt: string;
  isAiPaused: boolean;
}

interface CustomerLead {
  id: string;
  name: string;
  facebookId?: string | null;
  psid?: string | null;
  phone?: string | null;
  source: "COMMENT" | "MESSENGER";
  productInterest?: string | null;
  stage: "NEW_LEAD" | "INTERESTED" | "HOT_LEAD" | "FOLLOW_UP" | "ORDERED" | "LOST";
  assignedSeller?: string | null;
  notes?: string | null;
  lastContactAt: string;
  nextFollowUpAt?: string | null;
  conversations?: Conversation[];
  followUps?: FollowUpTaskItem[];
  updatedAt: string;
}

interface FollowUpTaskItem {
  id: string;
  customerId: string;
  customer: {
    id: string;
    name: string;
    phone?: string | null;
    psid?: string | null;
    productInterest?: string | null;
    stage: string;
    assignedSeller?: string | null;
    source: string;
  };
  scheduledAt: string;
  reason: string;
  customReason?: string | null;
  status: "PENDING" | "COMPLETED" | "CANCELLED" | "OVERDUE";
  aiSuggestedText?: string | null;
  actualSentText?: string | null;
  outcomeNotes?: string | null;
  createdAt: string;
}

// Design System Tokens: Stages (Khmer-First)
const STAGE_CONFIG: Record<
  string,
  { label: string; khmer: string; color: string; bg: string; border: string; dot: string }
> = {
  NEW_LEAD: {
    label: "New Lead",
    khmer: "អតិថិជនថ្មី",
    color: "text-blue-800",
    bg: "bg-blue-50",
    border: "border-blue-200",
    dot: "bg-blue-600",
  },
  INTERESTED: {
    label: "Interested",
    khmer: "ចាប់អារម្មណ៍",
    color: "text-amber-800",
    bg: "bg-amber-50",
    border: "border-amber-200",
    dot: "bg-amber-600",
  },
  HOT_LEAD: {
    label: "Hot Lead",
    khmer: "ចង់ទិញខ្លាំង",
    color: "text-orange-800",
    bg: "bg-orange-50",
    border: "border-orange-200",
    dot: "bg-orange-600",
  },
  FOLLOW_UP: {
    label: "Follow-up",
    khmer: "កំពុងតាមដាន",
    color: "text-purple-800",
    bg: "bg-purple-50",
    border: "border-purple-200",
    dot: "bg-purple-600",
  },
  ORDERED: {
    label: "Ordered",
    khmer: "បានកុម្ម៉ង់ (ជោគជ័យ)",
    color: "text-emerald-800",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    dot: "bg-emerald-600",
  },
  LOST: {
    label: "Lost",
    khmer: "បោះបង់ (មិនទិញ)",
    color: "text-rose-800",
    bg: "bg-rose-50",
    border: "border-rose-200",
    dot: "bg-rose-600",
  },
};

// Design System Tokens: Follow-up Reasons
const REASON_LABELS: Record<string, { label: string; khmer: string }> = {
  PRICE_OBJECTION: { label: "Price Objection", khmer: "តម្លៃរាងថ្លៃ / សុំចុះថ្លៃ" },
  NEED_TO_THINK: { label: "Need to Think", khmer: "សុំគិតមើលសិន" },
  NO_RESPONSE: { label: "No Response", khmer: "បាត់ការឆ្លើយតប (Ghosting)" },
  WAITING_SALARY: { label: "Waiting Salary", khmer: "រង់ចាំបើកប្រាក់ខែ" },
  ASK_FAMILY: { label: "Ask Family/Spouse", khmer: "សុំសួរប្តី/ប្រពន្ធ/គ្រួសារ" },
  INTERESTED_NOT_READY: { label: "Interested Not Ready", khmer: "ចាប់អារម្មណ៍តែមិនទាន់រួចរាល់" },
  OTHER: { label: "Other", khmer: "មូលហេតុផ្សេងៗ" },
};

export default function Dashboard() {
  const [activeNav, setActiveNav] = useState<
    | "overview"
    | "customers"
    | "pipeline"
    | "followups"
    | "conversations"
    | "knowledge"
    | "automation"
    | "ads"
    | "settings"
  >("overview");

  const [loading, setLoading] = useState(true);
  const [savingConfig, setSavingConfig] = useState(false);
  const [pageConfig, setPageConfig] = useState<PageConfig | null>(null);
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [recentConvs, setRecentConvs] = useState<RecentConv[]>([]);
  const [stats, setStats] = useState({
    totalConversations: 0,
    totalMessages: 0,
    totalKnowledge: 0,
    aiModel: "gemini-3.5-flash-lite",
  });

  // Knowledge form state
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState("Product");
  const [newContent, setNewContent] = useState("");
  const [addingKnowledge, setAddingKnowledge] = useState(false);

  // Conversations state
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [refreshingChats, setRefreshingChats] = useState(false);
  const [refreshingAll, setRefreshingAll] = useState(false);

  // CRM State
  const [customers, setCustomers] = useState<CustomerLead[]>([]);
  const [crmLoading, setCrmLoading] = useState(false);
  const [crmSearch, setCrmSearch] = useState("");
  const [crmStageFilter, setCrmStageFilter] = useState("ALL");
  const [editingCustomer, setEditingCustomer] = useState<CustomerLead | null>(null);
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [newCustomerForm, setNewCustomerForm] = useState({
    name: "",
    phone: "",
    productInterest: "Kidney Pro ឃីដនី ប្រូ",
    stage: "NEW_LEAD",
    assignedSeller: "Vann Sitha",
    notes: "",
  });

  // Pipeline State
  const [pipelineData, setPipelineData] = useState<Record<string, CustomerLead[]>>({
    NEW_LEAD: [],
    INTERESTED: [],
    HOT_LEAD: [],
    FOLLOW_UP: [],
    ORDERED: [],
    LOST: [],
  });
  const [pipelineCounts, setPipelineCounts] = useState<Record<string, number>>({});
  const [pipelineLoading, setPipelineLoading] = useState(false);

  // Follow-up State
  const [followUpTasks, setFollowUpTasks] = useState<FollowUpTaskItem[]>([]);
  const [followUpMetrics, setFollowUpMetrics] = useState({
    overdueCount: 0,
    todayCount: 0,
    pendingCount: 0,
    completedCount: 0,
  });
  const [followUpFilter, setFollowUpFilter] = useState("ALL");
  const [followUpLoading, setFollowUpLoading] = useState(false);

  // Scheduling Modal State
  const [schedulingCustomer, setSchedulingCustomer] = useState<CustomerLead | null>(null);
  const [scheduleForm, setScheduleForm] = useState({
    scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
    reason: "NEED_TO_THINK",
    customReason: "",
    aiSuggestedText: "",
  });
  const [generatingAiDraft, setGeneratingAiDraft] = useState(false);

  // Follow-up Sending / Review Studio state
  const [activeReviewTask, setActiveReviewTask] = useState<FollowUpTaskItem | null>(null);
  const [draftMessageText, setDraftMessageText] = useState("");
  const [sendingFollowUp, setSendingFollowUp] = useState(false);
  const [sendSuccessAlert, setSendSuccessAlert] = useState<string | null>(null);

  // Telegram Bot State & Handlers
  const [telegramInfo, setTelegramInfo] = useState<{
    ok: boolean;
    bot: any;
    isConnected: boolean;
    configuredChatId: string | null;
  } | null>(null);
  const [telegramChatIdInput, setTelegramChatIdInput] = useState("");
  const [detectingTelegram, setDetectingTelegram] = useState(false);
  const [testingTelegram, setTestingTelegram] = useState(false);
  const [telegramAlert, setTelegramAlert] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const fetchTelegramStatus = async () => {
    try {
      const res = await fetch("/api/telegram");
      const data = await res.json();
      setTelegramInfo(data);
      if (data.configuredChatId) {
        setTelegramChatIdInput(data.configuredChatId);
      }
    } catch (e) {
      console.error("Error fetching telegram status:", e);
    }
  };

  const handleDetectTelegram = async () => {
    try {
      setDetectingTelegram(true);
      setTelegramAlert(null);
      const res = await fetch("/api/telegram?action=detect");
      const data = await res.json();
      if (data.ok && data.chatId) {
        setTelegramChatIdInput(data.chatId);
        // Automatically save it
        const saveRes = await fetch("/api/telegram", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "save_chat_id", chatId: data.chatId }),
        });
        const saveData = await saveRes.json();
        if (saveData.ok) {
          setTelegramAlert({
            type: "success",
            message: `🎉 រកឃើញ និងបានភ្ជាប់ Telegram ដោយជោគជ័យ! (${data.chatTitle || data.senderName}) Chat ID: ${data.chatId}`,
          });
          fetchTelegramStatus();
        }
      } else {
        setTelegramAlert({
          type: "error",
          message:
            data.error ||
            "មិនទាន់រកឃើញសារថ្មីទេ។ សូមចុច Link ខាងក្រោមដើម្បីបើក Telegram ចុច START រួចចុចប៊ូតុងនេះម្តងទៀត។",
        });
      }
    } catch (e: any) {
      setTelegramAlert({
        type: "error",
        message: e.message || "មានបញ្ហាក្នុងការស្វែងរក Telegram Chat ID",
      });
    } finally {
      setDetectingTelegram(false);
    }
  };

  const handleSaveTelegramChatId = async () => {
    if (!telegramChatIdInput) return;
    try {
      setTelegramAlert(null);
      const res = await fetch("/api/telegram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "save_chat_id", chatId: telegramChatIdInput }),
      });
      const data = await res.json();
      if (data.ok) {
        setTelegramAlert({
          type: "success",
          message: "រក្សាទុក Telegram Chat ID បានជោគជ័យ!",
        });
        fetchTelegramStatus();
      } else {
        setTelegramAlert({
          type: "error",
          message: data.error || "មិនអាចរក្សាទុក Chat ID បានទេ។",
        });
      }
    } catch (e: any) {
      setTelegramAlert({ type: "error", message: e.message });
    }
  };

  const handleSendTestTelegram = async () => {
    try {
      setTestingTelegram(true);
      setTelegramAlert(null);
      const cleanChatId =
        telegramChatIdInput && !telegramChatIdInput.includes("*")
          ? telegramChatIdInput
          : undefined;
      const res = await fetch("/api/telegram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "test",
          chatId: cleanChatId,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setTelegramAlert({
          type: "success",
          message:
            "🎉 បានផ្ញើសារសាកល្បងទៅកាន់ Telegram របស់អ្នករួចរាល់ហើយ! សូមពិនិត្យមើលក្នុង Telegram Bot។",
        });
      } else {
        setTelegramAlert({
          type: "error",
          message:
            data.error ||
            "មិនអាចផ្ញើសារបានទេ។ សូមប្រាកដថាបានចុច START ក្នុង Bot ជាមុនសិន។",
        });
      }
    } catch (e: any) {
      setTelegramAlert({ type: "error", message: e.message });
    } finally {
      setTestingTelegram(false);
    }
  };

  // Fetch all dashboard data
  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/dashboard");
      const data = await res.json();
      if (data.pageConfig) {
        setPageConfig(data.pageConfig);
        setStats(data.stats);
        setHealth(data.health);
        setRecentConvs(data.recentConversations || []);
      }
    } catch (e) {
      console.error("Error fetching dashboard data:", e);
    } finally {
      setLoading(false);
    }
  };

  const fetchConversations = async () => {
    try {
      setRefreshingChats(true);
      const res = await fetch("/api/dashboard/conversations");
      const data = await res.json();
      if (data.conversations) {
        setConversations(data.conversations);
        if (!selectedConvId && data.conversations.length > 0) {
          setSelectedConvId(data.conversations[0].id);
        }
      }
    } catch (e) {
      console.error("Error fetching conversations:", e);
    } finally {
      setRefreshingChats(false);
    }
  };

  // Fetch CRM Customers
  const fetchCustomers = async () => {
    try {
      setCrmLoading(true);
      const params = new URLSearchParams();
      if (crmStageFilter !== "ALL") params.append("stage", crmStageFilter);
      if (crmSearch) params.append("search", crmSearch);
      const res = await fetch(`/api/crm/customers?${params.toString()}`);
      const data = await res.json();
      if (data.customers) {
        setCustomers(data.customers);
      }
    } catch (e) {
      console.error("Error fetching customers:", e);
    } finally {
      setCrmLoading(false);
    }
  };

  // Fetch Pipeline
  const fetchPipeline = async () => {
    try {
      setPipelineLoading(true);
      const res = await fetch("/api/crm/pipeline");
      const data = await res.json();
      if (data.pipeline) {
        setPipelineData(data.pipeline);
        setPipelineCounts(data.counts || {});
      }
    } catch (e) {
      console.error("Error fetching pipeline:", e);
    } finally {
      setPipelineLoading(false);
    }
  };

  // Fetch Follow-ups
  const fetchFollowUps = async () => {
    try {
      setFollowUpLoading(true);
      const res = await fetch(`/api/crm/followups?status=${followUpFilter}`);
      const data = await res.json();
      if (data.tasks) {
        setFollowUpTasks(data.tasks);
        setFollowUpMetrics(data.metrics || followUpMetrics);
      }
    } catch (e) {
      console.error("Error fetching follow-ups:", e);
    } finally {
      setFollowUpLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    fetchConversations();
    fetchCustomers();
    fetchPipeline();
    fetchFollowUps();
    fetchTelegramStatus();
  }, []);

  const handleRefreshAll = async () => {
    try {
      setRefreshingAll(true);
      await Promise.all([
        fetchData(),
        fetchConversations(),
        fetchCustomers(),
        fetchPipeline(),
        fetchFollowUps(),
        fetchTelegramStatus(),
      ]);
    } finally {
      setTimeout(() => setRefreshingAll(false), 600);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [crmStageFilter, crmSearch]);

  useEffect(() => {
    fetchFollowUps();
  }, [followUpFilter]);

  // Save Page Config & System Prompt
  const handleSaveConfig = async (overrides?: Partial<PageConfig>) => {
    if (!pageConfig) return;
    try {
      setSavingConfig(true);
      const payload = {
        id: pageConfig.id,
        systemPrompt: pageConfig.systemPrompt,
        autoReplyComment: pageConfig.autoReplyComment,
        privateReplyComment: pageConfig.privateReplyComment,
        autoReplyInbox: pageConfig.autoReplyInbox,
        ...overrides,
      };

      const res = await fetch("/api/dashboard", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        setPageConfig(data.pageConfig);
      }
    } catch (e) {
      console.error("Error updating page config:", e);
    } finally {
      setSavingConfig(false);
    }
  };

  // Human Takeover / Toggle AI per Conversation
  const handleToggleAi = async (convId: string, currentStatus: boolean) => {
    try {
      const nextStatus = !currentStatus;
      setConversations((prev) =>
        prev.map((c) => (c.id === convId ? { ...c, isAiPaused: nextStatus } : c))
      );
      setRecentConvs((prev) =>
        prev.map((c) => (c.id === convId ? { ...c, isAiPaused: nextStatus } : c))
      );

      await fetch("/api/dashboard/conversations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: convId, isAiPaused: nextStatus }),
      });
    } catch (e) {
      console.error("Error toggling AI pause:", e);
      fetchConversations();
    }
  };

  // Add Knowledge Item
  const handleAddKnowledge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newContent || !pageConfig) return;

    try {
      setAddingKnowledge(true);
      const res = await fetch("/api/knowledge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pageConfigId: pageConfig.id,
          title: newTitle,
          category: newCategory,
          content: newContent,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setPageConfig({
          ...pageConfig,
          knowledgeItems: [data.item, ...pageConfig.knowledgeItems],
        });
        setNewTitle("");
        setNewContent("");
        setStats((prev) => ({ ...prev, totalKnowledge: prev.totalKnowledge + 1 }));
      }
    } catch (e) {
      console.error("Error adding knowledge:", e);
    } finally {
      setAddingKnowledge(false);
    }
  };

  // Delete Knowledge Item
  const handleDeleteKnowledge = async (id: string) => {
    if (!confirm("តើអ្នកពិតជាចង់លុបព័ត៌មាននេះមែនទេ?")) return;
    try {
      const res = await fetch(`/api/knowledge?id=${id}`, { method: "DELETE" });
      if (res.ok && pageConfig) {
        setPageConfig({
          ...pageConfig,
          knowledgeItems: pageConfig.knowledgeItems.filter((k) => k.id !== id),
        });
        setStats((prev) => ({ ...prev, totalKnowledge: Math.max(0, prev.totalKnowledge - 1) }));
      }
    } catch (e) {
      console.error("Error deleting knowledge:", e);
    }
  };

  // Move Lead Stage (Pipeline)
  const handleMoveStage = async (customerId: string, targetStage: string) => {
    try {
      setPipelineData((prev) => {
        let movingLead: CustomerLead | null = null;
        const next: Record<string, CustomerLead[]> = {};
        for (const [stage, leads] of Object.entries(prev)) {
          const found = leads.find((l) => l.id === customerId);
          if (found) movingLead = { ...found, stage: targetStage as any };
          next[stage] = leads.filter((l) => l.id !== customerId);
        }
        if (movingLead && next[targetStage]) {
          next[targetStage].unshift(movingLead);
        }
        return next;
      });

      await fetch("/api/crm/pipeline", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerId, stage: targetStage }),
      });

      fetchPipeline();
      fetchCustomers();
    } catch (e) {
      console.error("Error moving lead stage:", e);
      fetchPipeline();
    }
  };

  // Generate AI Follow-up Suggestion
  const handleGenerateAiSuggestion = async (customerId: string, reason: string, custom?: string) => {
    try {
      setGeneratingAiDraft(true);
      const res = await fetch("/api/crm/followups/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerId, reason, customReason: custom }),
      });
      const data = await res.json();
      if (data.suggestedText) {
        setScheduleForm((prev) => ({ ...prev, aiSuggestedText: data.suggestedText }));
        setDraftMessageText(data.suggestedText);
      }
    } catch (e) {
      console.error("Error generating AI draft:", e);
    } finally {
      setGeneratingAiDraft(false);
    }
  };

  // Submit Schedule Follow-up
  const handleSaveSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!schedulingCustomer) return;
    try {
      const res = await fetch("/api/crm/followups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: schedulingCustomer.id,
          scheduledAt: scheduleForm.scheduledAt,
          reason: scheduleForm.reason,
          customReason: scheduleForm.customReason,
          aiSuggestedText: scheduleForm.aiSuggestedText,
        }),
      });

      if (res.ok) {
        setSchedulingCustomer(null);
        fetchFollowUps();
        fetchCustomers();
        fetchPipeline();
      }
    } catch (e) {
      console.error("Error scheduling follow-up:", e);
    }
  };

  // Human Approve & Send Follow-up to Messenger
  const handleApproveAndSend = async (taskId: string, customerId: string, messageText: string) => {
    try {
      setSendingFollowUp(true);
      const res = await fetch("/api/crm/followups/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId, customerId, messageText }),
      });
      const data = await res.json();
      if (res.ok) {
        setSendSuccessAlert("សារ Follow-up ត្រូវបានផ្ញើចូល Messenger អតិថិជនជោគជ័យ!");
        setTimeout(() => setSendSuccessAlert(null), 4000);
        setActiveReviewTask(null);
        fetchFollowUps();
        fetchConversations();
        fetchCustomers();
      } else {
        alert(data.error || "បរាជ័យក្នុងការផ្ញើសារ");
      }
    } catch (e) {
      console.error("Error approving and sending follow-up:", e);
    } finally {
      setSendingFollowUp(false);
    }
  };

  // Create Manual Customer
  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/crm/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newCustomerForm),
      });
      if (res.ok) {
        setShowAddCustomerModal(false);
        setNewCustomerForm({
          name: "",
          phone: "",
          productInterest: "Kidney Pro ឃីដនី ប្រូ",
          stage: "NEW_LEAD",
          assignedSeller: "Vann Sitha",
          notes: "",
        });
        fetchCustomers();
        fetchPipeline();
      }
    } catch (e) {
      console.error("Error creating customer:", e);
    }
  };

  // Save Edited Customer
  const handleSaveCustomerEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCustomer) return;
    try {
      const res = await fetch("/api/crm/customers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingCustomer),
      });
      if (res.ok) {
        setEditingCustomer(null);
        fetchCustomers();
        fetchPipeline();
      }
    } catch (e) {
      console.error("Error saving customer edit:", e);
    }
  };

  const selectedConversation = conversations.find((c) => c.id === selectedConvId);

  return (
    <div className="min-h-screen bg-[#fef9f2] flex text-slate-800 antialiased font-normal">
      {/* ========================================================= */}
      {/* 1. LEFT SIDEBAR (VANN SITHA STUDIO Style) */}
      {/* ========================================================= */}
      <aside className="w-68 bg-white border-r border-amber-200/80 text-slate-800 flex flex-col shrink-0 sticky top-0 h-screen z-40 shadow-xs select-none">
        {/* Brand Header */}
        <div className="p-5 flex items-center gap-3.5 border-b border-amber-200/80">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-white shadow-sm shadow-orange-500/20 font-bold text-xl">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="font-extrabold text-[18px] leading-tight tracking-wide text-[#c2410c]">
                VANN SITHA
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-orange-50 text-orange-600 border border-orange-200">
                PRO
              </span>
            </div>
            <p className="text-[13px] text-amber-900/70 font-semibold mt-0.5">
              AI Sales Studio
            </p>
          </div>
        </div>

        {/* Navigation Items (Sidebar menu: 16–17px, font-weight 600) */}
        <nav className="flex-1 overflow-y-auto p-3.5 space-y-1.5">
          {[
            { id: "overview", label: "ទិដ្ឋភាពទូទៅ", icon: Layers },
            { id: "customers", label: "អតិថិជន (CRM)", icon: Users },
            { id: "pipeline", label: "ដំណើរការលក់", icon: Kanban },
            {
              id: "followups",
              label: "ការតាមដាន",
              icon: BellRing,
              badge: followUpMetrics.overdueCount > 0 ? followUpMetrics.overdueCount : null,
            },
            { id: "conversations", label: "ការសន្ទនា", icon: MessageSquare },
            { id: "knowledge", label: "ចំណេះដឹងផលិតផល", icon: BookOpen },
            { id: "automation", label: "ស្វ័យប្រវត្តិកម្ម", icon: Sliders },
            { id: "ads", label: "ការផ្សាយពាណិជ្ជកម្ម", icon: Megaphone, tag: "ឆាប់ៗ" },
          ].map((item) => {
            const active = activeNav === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveNav(item.id as any)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all text-[16px] font-semibold tracking-wide ${
                  active
                    ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-sm shadow-orange-500/25 font-bold"
                    : "text-slate-700 hover:text-orange-600 hover:bg-orange-50/70"
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <Icon className={`w-5 h-5 shrink-0 ${active ? "text-white" : "text-amber-700"}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge ? (
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[13px] font-bold ${
                      active ? "bg-white text-orange-600 shadow-xs" : "bg-orange-100 text-orange-700"
                    }`}
                  >
                    {item.badge}
                  </span>
                ) : item.tag ? (
                  <span className="px-2 py-0.5 rounded-md text-[12px] bg-amber-100/80 text-amber-800 font-medium">
                    {item.tag}
                  </span>
                ) : null}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Bottom Area */}
        <div className="p-3.5 border-t border-amber-200/80 space-y-2.5">
          <button
            onClick={() => setActiveNav("settings")}
            className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl transition text-[16px] font-semibold ${
              activeNav === "settings"
                ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-sm shadow-orange-500/25 font-bold"
                : "text-slate-700 hover:text-orange-600 hover:bg-orange-50/70"
            }`}
          >
            <SettingsIcon className={`w-5 h-5 ${activeNav === "settings" ? "text-white" : "text-amber-700"}`} />
            <span>ការកំណត់</span>
          </button>

          {/* User Profile Card */}
          <div className="pt-2 flex items-center gap-3 px-3 py-2 rounded-xl bg-amber-50/80 border border-amber-200/80">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center font-bold text-[15px] text-white shadow-sm">
              VS
            </div>
            <div className="text-left overflow-hidden">
              <p className="text-[15px] font-bold truncate text-slate-800">Vann Sitha</p>
              <p className="text-[13px] text-amber-800/80 truncate font-semibold">
                ម្ចាស់អាជីវកម្ម / Admin
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* ========================================================= */}
      {/* 2. RIGHT MAIN CONTENT COLUMN */}
      {/* ========================================================= */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Sticky Top Header Bar (Studio Modern Minimalist Header) */}
        <header className="bg-white/90 backdrop-blur-md border-b border-amber-200/70 px-6 sm:px-8 py-3.5 sticky top-0 z-30 flex items-center justify-between shadow-2xs min-h-[64px]">
          {/* Left: Dynamic Module Title & Status Tag */}
          <div className="flex items-center gap-2.5 shrink-0">
            <h2 className="text-[20px] sm:text-[22px] font-bold text-slate-900 tracking-tight whitespace-nowrap">
              {activeNav === "overview" && "ទិដ្ឋភាពទូទៅ"}
              {activeNav === "customers" && "អតិថិជន (CRM)"}
              {activeNav === "pipeline" && "ដំណើរការលក់ (Sales Pipeline)"}
              {activeNav === "followups" && "ការតាមដាន & សារព្រាង AI (Follow-ups)"}
              {activeNav === "conversations" && "ការសន្ទនាផ្ទាល់ (Inbox)"}
              {activeNav === "knowledge" && "ចំណេះដឹងផលិតផល (Knowledge Base)"}
              {activeNav === "automation" && "ស្វ័យប្រវត្តិកម្ម & AI Persona"}
              {activeNav === "ads" && "ការផ្សាយពាណិជ្ជកម្ម (Meta Ads Manager)"}
              {activeNav === "settings" && "ការកំណត់ប្រព័ន្ធ (Settings)"}
            </h2>
            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10.5px] font-bold uppercase tracking-wider bg-orange-50 text-orange-600 border border-orange-200/80">
              PRO STUDIO
            </span>
          </div>

          {/* Right: Unified Status Capsule, Quick Refresh & Profile */}
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
            {/* Unified Studio Status Capsule (All-in-One, Never wraps) */}
            <div className="hidden lg:flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-amber-50/70 border border-amber-200/80 shadow-2xs text-[13px] font-medium whitespace-nowrap">
              {/* Live Dot & Facebook */}
              <div className="flex items-center gap-1.5" title={`Facebook Page: ${health?.facebook.name || "Kidney Pro"}`}>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="font-semibold text-slate-800">
                  {health?.facebook.name || "Kidney Pro"}
                </span>
              </div>

              <span className="text-amber-300">•</span>

              {/* Gemini AI */}
              <div className="flex items-center gap-1 text-slate-600" title="Google Gemini AI Engine (<1s latency)">
                <Sparkles className="w-3.5 h-3.5 text-orange-500" />
                <span className="font-semibold text-orange-700">Gemini AI</span>
              </div>

              <span className="text-amber-300">•</span>

              {/* Telegram Bot (Interactive Link) */}
              <button
                onClick={() => setActiveNav("settings")}
                className="flex items-center gap-1 text-sky-700 hover:text-sky-900 font-semibold cursor-pointer transition"
                title="Telegram Bot (@My_CEO_Assitant_bot) - ចុចដើម្បីកំណត់"
              >
                <Send className="w-3.5 h-3.5 text-sky-500" />
                <span>Telegram Alert</span>
              </button>
            </div>

            {/* Subtle Divider */}
            <div className="hidden sm:block h-5 w-[1px] bg-amber-200/80 mx-0.5"></div>

            {/* Refresh Button (Never wraps text, smooth spinning icon) */}
            <button
              onClick={handleRefreshAll}
              disabled={refreshingAll}
              className="flex items-center gap-2 h-9 px-3.5 py-1.5 rounded-xl border border-amber-200/90 bg-white hover:bg-orange-50/70 text-slate-700 text-[14px] font-semibold transition-all shadow-2xs hover:border-orange-300 disabled:opacity-50 whitespace-nowrap cursor-pointer active:scale-98"
              title="ផ្ទុកទិន្នន័យឡើងវិញ"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 text-orange-600 transition-transform ${
                  refreshingAll ? "animate-spin" : ""
                }`}
              />
              <span className="whitespace-nowrap">ផ្ទុកឡើងវិញ</span>
            </button>

            {/* Studio User Avatar */}
            <div
              className="h-9 px-2.5 rounded-xl bg-amber-50/70 border border-amber-200/80 flex items-center gap-2 shadow-2xs cursor-pointer hover:bg-amber-100/50 transition"
              title="Vann Sitha / Admin"
            >
              <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-orange-500 to-amber-500 text-white font-extrabold text-[11px] flex items-center justify-center shadow-xs">
                VS
              </div>
              <span className="text-[13px] font-bold text-slate-700 hidden sm:inline whitespace-nowrap">
                Vann Sitha
              </span>
            </div>
          </div>
        </header>

        {/* Global Notification Alert */}
        {sendSuccessAlert && (
          <div className="bg-emerald-600 text-white text-[15px] py-3 px-7 font-medium shadow-xs flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>{sendSuccessAlert}</span>
          </div>
        )}

        {/* Main View Body */}
        <main className="p-7 flex-1 max-w-7xl w-full space-y-7">
          {/* ========================================================= */}
          {/* TAB 1: OVERVIEW (ទិដ្ឋភាពទូទៅ) */}
          {/* ========================================================= */}
          {activeNav === "overview" && (
            <div className="space-y-6">
              {/* Metric KPI Cards (KPI Numbers: 24–28px, font-weight 700) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {/* 1. Total Leads (Amber/Orange) */}
                <div className="bg-white p-6 rounded-2xl border border-amber-200/80 shadow-xs flex items-center justify-between hover:shadow-md hover:border-orange-300 transition-all duration-200">
                  <div className="pr-2">
                    <p className="text-[14px] font-medium text-slate-500 tracking-wide">
                      អតិថិជនសរុបក្នុង CRM
                    </p>
                    <p className="text-[28px] font-extrabold text-slate-900 mt-1.5 leading-none">
                      {customers.length}
                    </p>
                    <p className="text-[13px] text-amber-700 mt-2.5 flex items-center gap-1.5 font-medium">
                      <Users className="w-4 h-4 text-orange-500 shrink-0" /> Auto-sync ពី Comment &amp; Inbox
                    </p>
                  </div>
                  <div className="w-13 h-13 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center p-3 border border-orange-200/70 shadow-xs shrink-0">
                    <Users className="w-6 h-6" />
                  </div>
                </div>

                {/* 2. Overdue Follow-ups (Orange Accent) */}
                <div className="bg-white p-6 rounded-2xl border border-amber-200/80 shadow-xs flex items-center justify-between hover:shadow-md hover:border-orange-300 transition-all duration-200">
                  <div className="pr-2">
                    <p className="text-[14px] font-medium text-slate-500 tracking-wide">
                      ការតាមដានហួសកាលកំណត់
                    </p>
                    <p className="text-[28px] font-extrabold text-[#ea580c] mt-1.5 leading-none">
                      {followUpMetrics.overdueCount}
                    </p>
                    <p className="text-[13px] text-[#ea580c] mt-2.5 flex items-center gap-1.5 font-medium">
                      <AlertTriangle className="w-4 h-4 shrink-0" /> ត្រូវការការឆ្លើយតបពីអ្នកលក់
                    </p>
                  </div>
                  <div className="w-13 h-13 bg-orange-50 text-[#ea580c] rounded-2xl flex items-center justify-center p-3 border border-orange-200/70 shadow-xs shrink-0">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                </div>

                {/* 3. Hot Leads & Ordered (Green Accent) */}
                <div className="bg-white p-6 rounded-2xl border border-amber-200/80 shadow-xs flex items-center justify-between hover:shadow-md hover:border-orange-300 transition-all duration-200">
                  <div className="pr-2">
                    <p className="text-[14px] font-medium text-slate-500 tracking-wide">
                      អតិថិជនចង់ទិញ &amp; បានកុម្ម៉ង់
                    </p>
                    <p className="text-[28px] font-extrabold text-emerald-600 mt-1.5 leading-none">
                      {(pipelineCounts.HOT_LEAD || 0) + (pipelineCounts.ORDERED || 0)}
                    </p>
                    <p className="text-[13px] text-emerald-600 mt-2.5 flex items-center gap-1.5 font-medium">
                      <TrendingUp className="w-4 h-4 shrink-0" /> អត្រាបិទការលក់ខ្ពស់
                    </p>
                  </div>
                  <div className="w-13 h-13 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center p-3 border border-emerald-200/70 shadow-xs shrink-0">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                </div>

                {/* 4. Active Knowledge Base (Warm Burnt Orange Accent) */}
                <div className="bg-white p-6 rounded-2xl border border-amber-200/80 shadow-xs flex items-center justify-between hover:shadow-md hover:border-orange-300 transition-all duration-200">
                  <div className="pr-2">
                    <p className="text-[14px] font-medium text-slate-500 tracking-wide">
                      ចំណេះដឹងផលិតផល
                    </p>
                    <p className="text-[28px] font-extrabold text-slate-900 mt-1.5 leading-none">
                      {stats.totalKnowledge}
                    </p>
                    <p className="text-[13px] text-[#c2410c] mt-2.5 flex items-center gap-1.5 font-semibold">
                      <BookOpen className="w-4 h-4 shrink-0" /> ព័ត៌មានដែល AI ប្រើប្រាស់
                    </p>
                  </div>
                  <div className="w-13 h-13 bg-amber-50 text-[#c2410c] rounded-2xl flex items-center justify-center p-3 border border-amber-200/70 shadow-xs shrink-0">
                    <BookOpen className="w-6 h-6" />
                  </div>
                </div>
              </div>

              {/* Automation Switches Panel (Section Title: 17–18px, font-weight 600–700) */}
              <div className="bg-white p-6 sm:p-7 rounded-2xl border border-amber-200/80 shadow-xs space-y-5">
                <div className="flex items-center justify-between pb-1 border-b border-amber-100/60">
                  <div>
                    <h3 className="text-[18px] font-bold text-slate-900 leading-snug">
                      កុងតាក់ស្វ័យប្រវត្តិកម្ម AI
                    </h3>
                    <p className="text-[14px] text-slate-500 font-normal mt-0.5">
                      កំណត់ការឆ្លើយតបស្វ័យប្រវត្តិតាមរយៈ Facebook Page
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveNav("automation")}
                    className="text-[15px] font-semibold text-orange-600 hover:text-orange-700 flex items-center gap-1.5 transition"
                  >
                    កែប្រែ System Prompt <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {/* Switch 1: Auto Comment Reply */}
                  <div className="flex items-center justify-between p-5 rounded-2xl border border-amber-200/70 bg-[#fffdfa] hover:border-orange-300/80 transition-all shadow-2xs">
                    <div className="pr-3">
                      <span className="font-bold text-[16px] text-slate-800">
                        ឆ្លើយតប Comment
                      </span>
                      <p className="text-[13.5px] text-slate-500 mt-1 leading-snug">
                        ឆ្លើយតបជាសាធារណៈលើ Post/Reel
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (!pageConfig) return;
                        const next = !pageConfig.autoReplyComment;
                        setPageConfig({ ...pageConfig, autoReplyComment: next });
                        handleSaveConfig({ autoReplyComment: next });
                      }}
                      className={`w-14 h-8 flex items-center rounded-full p-1 transition-colors cursor-pointer shrink-0 ${
                        pageConfig?.autoReplyComment ? "bg-gradient-to-r from-orange-500 to-amber-500 shadow-sm" : "bg-slate-300"
                      }`}
                    >
                      <div
                        className={`bg-white w-6 h-6 rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${
                          pageConfig?.autoReplyComment ? "translate-x-6" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>

                  {/* Switch 2: Private Reply to Messenger */}
                  <div className="flex items-center justify-between p-5 rounded-2xl border border-amber-200/70 bg-[#fffdfa] hover:border-orange-300/80 transition-all shadow-2xs">
                    <div className="pr-3">
                      <span className="font-bold text-[16px] text-slate-800">
                        ផ្ញើសារ Inbox
                      </span>
                      <p className="text-[13.5px] text-slate-500 mt-1 leading-snug">
                        ផ្ញើសារស្វាគមន៍ចូល Messenger ពេលមាន Comment
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (!pageConfig) return;
                        const next = !pageConfig.privateReplyComment;
                        setPageConfig({ ...pageConfig, privateReplyComment: next });
                        handleSaveConfig({ privateReplyComment: next });
                      }}
                      className={`w-14 h-8 flex items-center rounded-full p-1 transition-colors cursor-pointer shrink-0 ${
                        pageConfig?.privateReplyComment ? "bg-gradient-to-r from-orange-500 to-amber-500 shadow-sm" : "bg-slate-300"
                      }`}
                    >
                      <div
                        className={`bg-white w-6 h-6 rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${
                          pageConfig?.privateReplyComment ? "translate-x-6" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>

                  {/* Switch 3: Multi-turn Inbox Chat */}
                  <div className="flex items-center justify-between p-5 rounded-2xl border border-amber-200/70 bg-[#fffdfa] hover:border-orange-300/80 transition-all shadow-2xs">
                    <div className="pr-3">
                      <span className="font-bold text-[16px] text-slate-800">
                        AI ឆ្លើយក្នុង Messenger
                      </span>
                      <p className="text-[13.5px] text-slate-500 mt-1 leading-snug">
                        សន្ទនា និងបិទការលក់ដោយស្វ័យប្រវត្តិតាម AI
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (!pageConfig) return;
                        const next = !pageConfig.autoReplyInbox;
                        setPageConfig({ ...pageConfig, autoReplyInbox: next });
                        handleSaveConfig({ autoReplyInbox: next });
                      }}
                      className={`w-14 h-8 flex items-center rounded-full p-1 transition-colors cursor-pointer shrink-0 ${
                        pageConfig?.autoReplyInbox ? "bg-gradient-to-r from-orange-500 to-amber-500 shadow-sm" : "bg-slate-300"
                      }`}
                    >
                      <div
                        className={`bg-white w-6 h-6 rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${
                          pageConfig?.autoReplyInbox ? "translate-x-6" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>

              {/* Recent Conversations Table (Header: 14–15px, font-weight 600; Content: 15–16px, font-weight 500) */}
              <div className="bg-white rounded-2xl border border-amber-200/80 shadow-xs overflow-hidden">
                <div className="p-5 border-b border-amber-100 flex items-center justify-between">
                  <div>
                    <h3 className="text-[18px] font-bold text-slate-900 leading-snug">
                      ការសន្ទនាចុងក្រោយ (Recent Conversations)
                    </h3>
                    <p className="text-[14px] text-slate-500 font-normal">
                      សារចុងក្រោយដែលអតិថិជនបានផ្ញើចូល និងការឆ្លើយតបរបស់ AI
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveNav("conversations")}
                    className="text-[15px] font-semibold text-orange-600 hover:text-orange-700 flex items-center gap-1.5"
                  >
                    មើលការសន្ទនាទាំងអស់ <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-amber-50/50 text-slate-800 text-[14.5px] font-semibold border-b border-amber-200/80">
                      <tr>
                        <th className="px-5 py-3.5">ឈ្មោះអតិថិជន</th>
                        <th className="px-5 py-3.5">ប្រភព</th>
                        <th className="px-5 py-3.5">សារចុងក្រោយ</th>
                        <th className="px-5 py-3.5">ចម្លើយ AI</th>
                        <th className="px-5 py-3.5">ម៉ោង</th>
                        <th className="px-5 py-3.5">ស្ថានភាព</th>
                        <th className="px-5 py-3.5 text-right">សកម្មភាព</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-amber-100/60 text-[15.5px] font-medium">
                      {recentConvs.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-5 py-10 text-center text-slate-400">
                            មិនទាន់មានការសន្ទនានៅឡើយទេ។
                          </td>
                        </tr>
                      ) : (
                        recentConvs.map((conv) => (
                          <tr key={conv.id} className="hover:bg-amber-50/30 transition">
                            <td className="px-5 py-4 font-semibold text-slate-900">
                              {conv.customerName}
                            </td>
                            <td className="px-5 py-4">
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[13px] font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                                <MessageCircle className="w-3.5 h-3.5" /> {conv.source}
                              </span>
                            </td>
                            <td className="px-5 py-4 text-slate-600 max-w-xs truncate">
                              {conv.lastUserMessage}
                            </td>
                            <td className="px-5 py-4 text-slate-500 max-w-xs truncate">
                              {conv.lastAiReply}
                            </td>
                            <td className="px-5 py-4 text-slate-400 text-[14px]">
                              {new Date(conv.updatedAt).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </td>
                            <td className="px-5 py-4">
                              {conv.isAiPaused ? (
                                <span className="inline-flex items-center gap-1.5 text-[13.5px] px-3 py-1 rounded-full font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                                  <PauseCircle className="w-4 h-4" /> មនុស្សឆ្លើយផ្ទាល់
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 text-[13.5px] px-3 py-1 rounded-full font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> AI ឆ្លើយ
                                </span>
                              )}
                            </td>
                            <td className="px-5 py-4 text-right">
                              <button
                                onClick={() => {
                                  setSelectedConvId(conv.id);
                                  setActiveNav("conversations");
                                }}
                                className="text-[14.5px] font-semibold text-orange-600 hover:text-orange-800 px-3 py-1.5 rounded-lg bg-orange-50 hover:bg-orange-100/80 transition border border-orange-200/60"
                              >
                                បើក Chat
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 2: CUSTOMERS / CRM (អតិថិជន CRM) */}
          {/* ========================================================= */}
          {activeNav === "customers" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-[20px] font-bold text-slate-900 leading-snug">
                    បញ្ជីអតិថិជន &amp; Leads (CRM)
                  </h2>
                  <p className="text-[14px] text-slate-500 font-normal">
                    គ្រប់គ្រងទិន្នន័យអតិថិជន លេខទូរស័ព្ទ និងប្រវត្តិតាមដានការលក់
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowAddCustomerModal(true)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-[15px] font-bold shadow-xs transition"
                  >
                    <Plus className="w-4.5 h-4.5" /> បន្ថែមអតិថិជនថ្មី
                  </button>
                  <button
                    onClick={fetchCustomers}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-amber-200 bg-white text-slate-700 hover:bg-orange-50/60 text-[15px] font-semibold transition shadow-xs"
                  >
                    <RefreshCw className="w-4 h-4 text-orange-600" /> ផ្ទុកឡើងវិញ
                  </button>
                </div>
              </div>

              {/* Search and Filters Bar */}
              <div className="bg-white p-4.5 rounded-2xl border border-amber-200/80 shadow-xs flex flex-col sm:flex-row items-center gap-3.5">
                <div className="relative flex-1 w-full">
                  <Search className="w-4.5 h-4.5 absolute left-3.5 top-3 text-amber-500/70" />
                  <input
                    type="text"
                    placeholder="ស្វែងរកតាមឈ្មោះ, លេខទូរស័ព្ទ, ឬផលិតផល..."
                    value={crmSearch}
                    onChange={(e) => setCrmSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 text-[15px] font-medium border border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white"
                  />
                </div>

                <div className="flex items-center gap-2.5 w-full sm:w-auto">
                  <span className="text-[14.5px] font-medium text-slate-600 whitespace-nowrap">
                    ដំណាក់កាលលក់:
                  </span>
                  <select
                    value={crmStageFilter}
                    onChange={(e) => setCrmStageFilter(e.target.value)}
                    className="text-[14.5px] font-medium border border-amber-200 rounded-xl px-3.5 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-orange-400"
                  >
                    <option value="ALL">ដំណាក់កាលទាំងអស់</option>
                    <option value="NEW_LEAD">អតិថិជនថ្មី (New Lead)</option>
                    <option value="INTERESTED">ចាប់អារម្មណ៍ (Interested)</option>
                    <option value="HOT_LEAD">ចង់ទិញខ្លាំង (Hot Lead)</option>
                    <option value="FOLLOW_UP">កំពុងតាមដាន (Follow-up)</option>
                    <option value="ORDERED">បានកុម្ម៉ង់ (Ordered)</option>
                    <option value="LOST">បោះបង់ (Lost)</option>
                  </select>
                </div>
              </div>

              {/* Customers Data Table */}
              <div className="bg-white rounded-2xl border border-amber-200/80 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-amber-50/50 text-slate-800 text-[14.5px] font-semibold border-b border-amber-200/80">
                      <tr>
                        <th className="px-5 py-3.5">ឈ្មោះអតិថិជន</th>
                        <th className="px-5 py-3.5">លេខទូរស័ព្ទ</th>
                        <th className="px-5 py-3.5">ផលិតផលចាប់អារម្មណ៍</th>
                        <th className="px-5 py-3.5">ដំណាក់កាល</th>
                        <th className="px-5 py-3.5">អ្នកទទួលបន្ទុក</th>
                        <th className="px-5 py-3.5">ទាក់ទងចុងក្រោយ</th>
                        <th className="px-5 py-3.5">ថ្ងៃតាមដានបន្ទាប់</th>
                        <th className="px-5 py-3.5 text-right">សកម្មភាព</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-amber-100/60 text-[15.5px] font-medium">
                      {crmLoading ? (
                        <tr>
                          <td colSpan={8} className="px-5 py-10 text-center text-slate-400">
                            កំពុងទាញយកទិន្នន័យអតិថិជន...
                          </td>
                        </tr>
                      ) : customers.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="px-5 py-10 text-center text-slate-400">
                            មិនមានទិន្នន័យអតិថិជនដែលត្រូវនឹងលក្ខខណ្ឌស្វែងរកឡើយ។
                          </td>
                        </tr>
                      ) : (
                        customers.map((c) => {
                          const stageConf = STAGE_CONFIG[c.stage] || STAGE_CONFIG.NEW_LEAD;
                          const isOverdue =
                            c.nextFollowUpAt && new Date(c.nextFollowUpAt) < new Date();

                          return (
                            <tr key={c.id} className="hover:bg-amber-50/30 transition">
                              <td className="px-5 py-4">
                                <div className="font-semibold text-slate-900">{c.name}</div>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <span className="text-[12px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-mono">
                                    {c.source}
                                  </span>
                                  {c.psid && (
                                    <span className="text-[12px] text-slate-400 font-mono">
                                      PSID: ...{c.psid.slice(-4)}
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="px-5 py-4">
                                {c.phone ? (
                                  <span className="font-mono text-[15px] text-blue-600 font-semibold flex items-center gap-1.5">
                                    <Phone className="w-3.5 h-3.5" /> {c.phone}
                                  </span>
                                ) : (
                                  <span className="text-slate-400 italic">គ្មានលេខ</span>
                                )}
                              </td>
                              <td className="px-5 py-4 text-slate-700">
                                {c.productInterest || "Kidney Pro ឃីដនី ប្រូ"}
                              </td>
                              <td className="px-5 py-4">
                                <span
                                  className={`text-[13.5px] px-3 py-1 rounded-full font-semibold border ${stageConf.bg} ${stageConf.color} ${stageConf.border}`}
                                >
                                  {stageConf.khmer}
                                </span>
                              </td>
                              <td className="px-5 py-4 text-slate-600">
                                {c.assignedSeller || "Vann Sitha"}
                              </td>
                              <td className="px-5 py-4 text-slate-500 text-[14.5px]">
                                {new Date(c.lastContactAt).toLocaleDateString()}
                              </td>
                              <td className="px-5 py-4">
                                {c.nextFollowUpAt ? (
                                  <div
                                    className={`flex items-center gap-1.5 text-[14.5px] ${
                                      isOverdue ? "text-[#ea580c] font-bold" : "text-slate-700"
                                    }`}
                                  >
                                    <Clock className="w-4 h-4" />
                                    <span>{new Date(c.nextFollowUpAt).toLocaleString()}</span>
                                    {isOverdue && (
                                      <span className="text-[11px] px-2 py-0.5 rounded bg-orange-100 text-[#ea580c] font-bold">
                                        ហួសពេល
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-slate-400 italic">មិនទាន់កំណត់</span>
                                )}
                              </td>
                              <td className="px-5 py-4 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <button
                                    onClick={() => {
                                      setSchedulingCustomer(c);
                                      handleGenerateAiSuggestion(c.id, "NEED_TO_THINK");
                                    }}
                                    title="កំណត់ពេល Follow-up"
                                    className="text-[14px] px-3 py-1.5 rounded-xl bg-orange-50 text-[#ea580c] hover:bg-orange-100 font-semibold transition flex items-center gap-1.5 border border-orange-200/60"
                                  >
                                    <Calendar className="w-3.5 h-3.5" /> តាមដាន
                                  </button>
                                  <button
                                    onClick={() => setEditingCustomer(c)}
                                    title="កែប្រែទិន្នន័យ"
                                    className="p-1.5 rounded-lg hover:bg-amber-50 text-slate-600 transition"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </button>
                                  {c.conversations && c.conversations[0] && (
                                    <button
                                      onClick={() => {
                                        setSelectedConvId(c.conversations![0].id);
                                        setActiveNav("conversations");
                                      }}
                                      title="បើក Chat"
                                      className="p-1.5 rounded-lg hover:bg-amber-50 text-orange-600 transition"
                                    >
                                      <MessageSquare className="w-4 h-4" />
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 3: SALES PIPELINE (ដំណើរការលក់ KANBAN) */}
          {/* ========================================================= */}
          {activeNav === "pipeline" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-[20px] font-bold text-slate-900 leading-snug">
                    ដំណើរការលក់ (Sales Pipeline Kanban)
                  </h2>
                  <p className="text-[14px] text-slate-500 font-normal">
                    តាមដានដំណាក់កាលលក់ទាំង ៦ (អតិថិជនថ្មី ➔ ចាប់អារម្មណ៍ ➔ ចង់ទិញខ្លាំង ➔
                    កំពុងតាមដាន ➔ បានកុម្ម៉ង់ ➔ បោះបង់)
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={fetchPipeline}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-amber-200 bg-white text-slate-700 hover:bg-orange-50/60 text-[15px] font-semibold transition shadow-xs"
                  >
                    <RefreshCw className="w-4 h-4 text-orange-600" /> ផ្ទុកឡើងវិញ
                  </button>
                </div>
              </div>

              {/* Kanban Columns Horizontal Flex Container */}
              <div className="flex gap-5 items-start overflow-x-auto pb-6 pt-1">
                {(
                  [
                    "NEW_LEAD",
                    "INTERESTED",
                    "HOT_LEAD",
                    "FOLLOW_UP",
                    "ORDERED",
                    "LOST",
                  ] as (keyof typeof STAGE_CONFIG)[]
                ).map((stageKey) => {
                  const conf = STAGE_CONFIG[stageKey];
                  const leads = pipelineData[stageKey] || [];

                  return (
                    <div
                      key={stageKey}
                      className="bg-[#fffdfa] rounded-2xl p-4 border border-amber-200/80 w-[270px] min-w-[270px] shrink-0 flex flex-col max-h-[82vh] shadow-xs hover:border-orange-300 transition-all duration-200"
                    >
                      {/* Column Header */}
                      <div className="flex items-center justify-between pb-3.5 mb-3 border-b border-amber-200/70">
                        <div className="flex items-center gap-2">
                          <span className={`w-3 h-3 rounded-full ${conf.dot}`} />
                          <h4 className="font-bold text-[15.5px] text-slate-800">{conf.khmer}</h4>
                        </div>
                        <span className="px-2.5 py-0.5 rounded-full text-[13px] font-bold bg-white text-slate-700 shadow-xs border border-amber-200/80">
                          {leads.length}
                        </span>
                      </div>

                      {/* Column Cards List */}
                      <div className="space-y-3 overflow-y-auto pr-1 flex-1">
                        {leads.length === 0 ? (
                          <div className="text-center py-12 text-[14px] text-slate-400 italic bg-amber-50/20 rounded-xl border border-dashed border-amber-200/60 my-1">
                            គ្មានអតិថិជន
                          </div>
                        ) : (
                          leads.map((lead) => {
                            const isOverdue =
                              lead.nextFollowUpAt && new Date(lead.nextFollowUpAt) < new Date();

                            return (
                              <div
                                key={lead.id}
                                className="bg-white p-4 rounded-xl border border-amber-200/70 shadow-xs hover:border-orange-300 hover:shadow-sm transition-all space-y-2.5 group"
                              >
                                <div className="flex items-start justify-between">
                                  <span className="font-bold text-[15.5px] text-slate-900 leading-snug">
                                    {lead.name}
                                  </span>
                                  <span className="text-[11px] px-2 py-0.5 rounded bg-slate-50 text-slate-500 font-mono">
                                    {lead.source}
                                  </span>
                                </div>

                                {lead.phone && (
                                  <p className="font-mono text-[14px] text-blue-600 font-semibold flex items-center gap-1.5">
                                    <Phone className="w-3.5 h-3.5" /> {lead.phone}
                                  </p>
                                )}

                                <p className="text-[14px] text-slate-600 line-clamp-1 font-medium">
                                  📦 {lead.productInterest || "Kidney Pro ឃីដនី ប្រូ"}
                                </p>

                                {lead.nextFollowUpAt && (
                                  <div
                                    className={`text-[12.5px] flex items-center gap-1.5 px-2 py-1 rounded-md ${
                                      isOverdue
                                        ? "bg-orange-50 text-[#ea580c] font-bold"
                                        : "bg-purple-50 text-purple-700 font-medium"
                                    }`}
                                  >
                                    <Clock className="w-3.5 h-3.5" />
                                    <span>
                                      {isOverdue ? "Overdue: " : "តាមដាន: "}
                                      {new Date(lead.nextFollowUpAt).toLocaleDateString()}
                                    </span>
                                  </div>
                                )}

                                {/* Stage Transition Selector */}
                                <div className="pt-2 border-t border-amber-100 flex items-center justify-between">
                                  <select
                                    value={lead.stage}
                                    onChange={(e) => handleMoveStage(lead.id, e.target.value)}
                                    className="text-[13px] font-semibold py-1 px-2 rounded-lg border border-amber-200 bg-amber-50/40 text-slate-700 focus:outline-none focus:ring-1 focus:ring-orange-400"
                                  >
                                    <option value="NEW_LEAD">អតិថិជនថ្មី</option>
                                    <option value="INTERESTED">ចាប់អារម្មណ៍</option>
                                    <option value="HOT_LEAD">ចង់ទិញខ្លាំង</option>
                                    <option value="FOLLOW_UP">កំពុងតាមដាន</option>
                                    <option value="ORDERED">បានកុម្ម៉ង់ (Won)</option>
                                    <option value="LOST">បោះបង់ (Lost)</option>
                                  </select>

                                  <button
                                    onClick={() => {
                                      setSchedulingCustomer(lead);
                                      handleGenerateAiSuggestion(lead.id, "NEED_TO_THINK");
                                    }}
                                    title="កំណត់ពេល Follow-up"
                                    className="p-1.5 rounded-lg hover:bg-orange-50 text-[#ea580c]"
                                  >
                                    <Calendar className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 4: FOLLOW-UP ENGINE & AI STUDIO (ការតាមដាន) */}
          {/* ========================================================= */}
          {activeNav === "followups" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-[20px] font-bold text-slate-900 leading-snug">
                    ការតាមដាន &amp; ស្ទូឌីយោសារ AI (Follow-up Engine)
                  </h2>
                  <p className="text-[14px] text-slate-500 font-normal">
                    តាមដានកាលវិភាគ Follow-up, Overdue Reminders និងពិនិត្យអនុម័តសារដែល AI Gemini
                    Draft
                  </p>
                </div>

                <button
                  onClick={fetchFollowUps}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-amber-200 bg-white text-slate-700 hover:bg-orange-50/60 text-[15px] font-semibold transition shadow-xs"
                >
                  <RefreshCw className="w-4 h-4 text-orange-600" /> ផ្ទុកឡើងវិញ
                </button>
              </div>

              {/* Metric Alerts Strip (Color Accents: Orange, Amber, Sky, Teal/Green) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
                <button
                  onClick={() => setFollowUpFilter("OVERDUE")}
                  className={`p-5 rounded-2xl border text-left transition shadow-xs ${
                    followUpFilter === "OVERDUE"
                      ? "bg-orange-100 border-[#ea580c] ring-2 ring-orange-400"
                      : "bg-orange-50/80 border-orange-200 hover:bg-orange-100/70"
                  }`}
                >
                  <span className="text-[13.5px] font-semibold text-[#ea580c] uppercase">
                    ហួសកាលកំណត់ (Overdue)
                  </span>
                  <p className="text-[27px] font-bold text-[#ea580c] mt-1 leading-none">
                    {followUpMetrics.overdueCount}
                  </p>
                  <p className="text-[13px] text-orange-700 mt-1 font-medium">
                    ត្រូវការទាក់ទងជាបន្ទាន់
                  </p>
                </button>

                <button
                  onClick={() => setFollowUpFilter("TODAY")}
                  className={`p-5 rounded-2xl border text-left transition shadow-xs ${
                    followUpFilter === "TODAY"
                      ? "bg-amber-100 border-amber-400 ring-2 ring-amber-400"
                      : "bg-amber-50 border-amber-200 hover:bg-amber-100/70"
                  }`}
                >
                  <span className="text-[13.5px] font-semibold text-amber-800 uppercase">
                    ថ្ងៃនេះ (Due Today)
                  </span>
                  <p className="text-[27px] font-bold text-amber-800 mt-1 leading-none">
                    {followUpMetrics.todayCount}
                  </p>
                  <p className="text-[13px] text-amber-700 mt-1 font-medium">
                    ត្រូវតាមដានក្នុងថ្ងៃនេះ
                  </p>
                </button>

                <button
                  onClick={() => setFollowUpFilter("PENDING")}
                  className={`p-5 rounded-2xl border text-left transition shadow-xs ${
                    followUpFilter === "PENDING"
                      ? "bg-sky-100 border-sky-400 ring-2 ring-sky-400"
                      : "bg-sky-50/70 border-sky-200 hover:bg-sky-100/70"
                  }`}
                >
                  <span className="text-[13.5px] font-semibold text-sky-800 uppercase">
                    កំពុងរង់ចាំ (Pending)
                  </span>
                  <p className="text-[27px] font-bold text-sky-900 mt-1 leading-none">
                    {followUpMetrics.pendingCount}
                  </p>
                  <p className="text-[13px] text-sky-700 mt-1 font-medium">តាមកាលកំណត់ខាងមុខ</p>
                </button>

                <button
                  onClick={() => setFollowUpFilter("COMPLETED")}
                  className={`p-5 rounded-2xl border text-left transition shadow-xs ${
                    followUpFilter === "COMPLETED"
                      ? "bg-emerald-100 border-emerald-400 ring-2 ring-emerald-400"
                      : "bg-emerald-50 border-emerald-200 hover:bg-emerald-100/70"
                  }`}
                >
                  <span className="text-[13.5px] font-semibold text-emerald-800 uppercase">
                    រួចរាល់ (Completed)
                  </span>
                  <p className="text-[27px] font-bold text-emerald-800 mt-1 leading-none">
                    {followUpMetrics.completedCount}
                  </p>
                  <p className="text-[13px] text-emerald-700 mt-1 font-medium">
                    បាន Follow-up រួចរាល់
                  </p>
                </button>
              </div>

              {/* Task List & AI Studio Split Area */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Left Column: Task Cards (7 cols) */}
                <div className="lg:col-span-7 space-y-3.5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[17px] font-bold text-slate-800">
                      កាលវិភាគ Follow-up ({followUpTasks.length})
                    </h3>
                    <div className="flex items-center gap-1.5">
                      {[
                        { key: "ALL", label: "ទាំងអស់" },
                        { key: "PENDING", label: "រង់ចាំ" },
                        { key: "OVERDUE", label: "ហួសពេល" },
                        { key: "TODAY", label: "ថ្ងៃនេះ" },
                        { key: "COMPLETED", label: "រួចរាល់" },
                      ].map((f) => (
                        <button
                          key={f.key}
                          onClick={() => setFollowUpFilter(f.key)}
                          className={`text-[13.5px] px-3 py-1.5 rounded-lg font-semibold transition ${
                            followUpFilter === f.key
                              ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-xs font-bold"
                              : "bg-white text-slate-600 border border-amber-200/80 hover:bg-orange-50/50"
                          }`}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {followUpLoading ? (
                    <div className="bg-white p-10 rounded-2xl border border-amber-200/80 text-center text-slate-400 text-[15px]">
                      កំពុងទាញយកទិន្នន័យ Tasks...
                    </div>
                  ) : followUpTasks.length === 0 ? (
                    <div className="bg-white p-10 rounded-2xl border border-amber-200/80 text-center text-slate-400 text-[15px]">
                      គ្មាន Follow-up task ក្នុងក្រុមនេះឡើយ។
                    </div>
                  ) : (
                    followUpTasks.map((task) => {
                      const isOverdue =
                        task.status === "PENDING" && new Date(task.scheduledAt) < new Date();
                      const reasonInfo = REASON_LABELS[task.reason] || {
                        label: task.reason,
                        khmer: task.reason,
                      };
                      const isSelected = activeReviewTask?.id === task.id;

                      return (
                        <div
                          key={task.id}
                          className={`bg-white p-5 rounded-2xl border transition shadow-xs ${
                            isSelected
                              ? "border-orange-500 ring-2 ring-orange-200"
                              : "border-amber-200/80 hover:border-orange-300"
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center gap-2.5">
                                <span className="font-bold text-slate-900 text-[16px]">
                                  {task.customer.name}
                                </span>
                                <span className="text-[12px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-mono">
                                  {task.customer.source}
                                </span>
                              </div>
                              <p className="text-[14px] text-slate-500 mt-1 font-medium">
                                📞 {task.customer.phone || "គ្មានលេខ"} | 📦{" "}
                                {task.customer.productInterest || "Kidney Pro"}
                              </p>
                            </div>

                            <span
                              className={`text-[12px] px-3 py-1 rounded-full font-bold uppercase tracking-wider ${
                                task.status === "COMPLETED"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : isOverdue
                                  ? "bg-orange-100 text-[#ea580c]"
                                  : "bg-purple-100 text-purple-800"
                              }`}
                            >
                              {task.status === "COMPLETED"
                                ? "រួចរាល់"
                                : isOverdue
                                ? "ហួសពេល"
                                : "រង់ចាំ"}
                            </span>
                          </div>

                          {/* Reason & Scheduled Time */}
                          <div className="mt-3.5 flex flex-wrap items-center gap-2.5 text-[14px]">
                            <span className="px-3 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 font-semibold">
                              🎯 {reasonInfo.khmer}
                            </span>
                            <span className="text-slate-500 flex items-center gap-1.5 font-medium">
                              <Clock className="w-4 h-4 text-slate-400" />
                              {new Date(task.scheduledAt).toLocaleString()}
                            </span>
                          </div>

                          {/* AI Suggested Message Preview */}
                          {task.aiSuggestedText && (
                            <div className="mt-3 p-3.5 rounded-xl bg-amber-50/50 border border-amber-200/60 text-[14.5px] text-slate-700 italic line-clamp-2 leading-relaxed">
                              ✨ សារព្រាង AI: &ldquo;{task.aiSuggestedText}&rdquo;
                            </div>
                          )}

                          {/* Action Buttons: 15–16px, font-weight 600 */}
                          <div className="mt-4 pt-3.5 border-t border-amber-100 flex items-center justify-between">
                            <button
                              onClick={() => {
                                setActiveReviewTask(task);
                                setDraftMessageText(task.aiSuggestedText || "");
                              }}
                              className="text-[15px] font-bold px-4 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white transition flex items-center gap-2 shadow-xs"
                            >
                              <Sparkles className="w-4 h-4" />
                              ពិនិត្យ &amp; អនុម័តសារ AI
                            </button>

                            {task.status === "PENDING" && (
                              <button
                                onClick={async () => {
                                  await fetch("/api/crm/followups", {
                                    method: "PATCH",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({
                                      id: task.id,
                                      status: "COMPLETED",
                                      outcomeNotes: "Marked completed by admin",
                                    }),
                                  });
                                  fetchFollowUps();
                                }}
                                className="text-[14px] text-slate-600 hover:text-emerald-700 font-semibold px-3 py-1.5 rounded-lg hover:bg-emerald-50 transition"
                              >
                                ✓ សម្គាល់ថាបានរួចរាល់
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Right Column: AI Message Approval Studio (5 cols) */}
                <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-amber-200/80 shadow-xs sticky top-24 space-y-4.5">
                  <div className="border-b border-amber-100 pb-3.5 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
                        <Sparkles className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-[17px] leading-snug">
                          ស្ទូឌីយោសារ AI (Human-in-the-Loop)
                        </h3>
                        <p className="text-[13.5px] text-slate-500 font-normal">
                          ពិនិត្យ កែសម្រួល និងអនុម័តសារមុននឹងផ្ញើ
                        </p>
                      </div>
                    </div>
                  </div>

                  {activeReviewTask ? (
                    <div className="space-y-4">
                      <div className="p-3.5 bg-amber-50/50 rounded-xl border border-amber-200/70 text-[14px] space-y-1.5 font-medium">
                        <div className="flex justify-between">
                          <span className="text-slate-500">អតិថិជន:</span>
                          <strong className="text-slate-900">
                            {activeReviewTask.customer.name}
                          </strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">មូលហេតុ:</span>
                          <strong className="text-amber-800">
                            {REASON_LABELS[activeReviewTask.reason]?.khmer ||
                              activeReviewTask.reason}
                          </strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Messenger PSID:</span>
                          <strong className="font-mono text-slate-700">
                            {activeReviewTask.customer.psid || "គ្មាន"}
                          </strong>
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="text-[14.5px] font-semibold text-slate-700">
                            សារ Follow-up (ព្រាងជាភាសាខ្មែរ):
                          </label>
                          <button
                            onClick={() =>
                              handleGenerateAiSuggestion(
                                activeReviewTask.customerId,
                                activeReviewTask.reason
                              )
                            }
                            disabled={generatingAiDraft}
                            className="text-[13.5px] text-orange-600 hover:text-orange-700 font-semibold flex items-center gap-1.5"
                          >
                            <RefreshCw
                              className={`w-3.5 h-3.5 ${generatingAiDraft ? "animate-spin" : ""}`}
                            />
                            ព្រាងសារថ្មី
                          </button>
                        </div>

                        <textarea
                          rows={7}
                          value={draftMessageText}
                          onChange={(e) => setDraftMessageText(e.target.value)}
                          placeholder="សារដែល AI បានព្រាងទុកនឹងបង្ហាញនៅទីនេះ..."
                          className="w-full text-[15px] p-3.5 border border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 leading-relaxed font-medium bg-white"
                        />
                      </div>

                      {/* Meta Messaging Policy Notice */}
                      <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-[13.5px] text-amber-800 flex items-start gap-2.5 leading-relaxed">
                        <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                        <span>
                          <strong>សុវត្ថិភាព Meta Policy:</strong>{" "}
                          សារនេះនឹងផ្ញើតាមរយៈផេកផ្លូវការ ដោយមានការអនុម័តដោយដៃពីអ្នក
                          ដើម្បីគោរពគោលការណ៍ Messaging។
                        </span>
                      </div>

                      {/* Action Buttons (Teal Send Accent) */}
                      <div className="flex items-center gap-2.5 pt-2">
                        <button
                          onClick={() =>
                            handleApproveAndSend(
                              activeReviewTask.id,
                              activeReviewTask.customerId,
                              draftMessageText
                            )
                          }
                          disabled={sendingFollowUp || !draftMessageText}
                          className="flex-1 bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 px-5 rounded-xl text-[15.5px] shadow-xs transition flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          <Send className="w-4 h-4" />
                          {sendingFollowUp ? "កំពុងផ្ញើ..." : "អនុម័ត & ផ្ញើចូល Messenger"}
                        </button>

                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(draftMessageText);
                            alert("បានចម្លងសារទៅកាន់ Clipboard រួចរាល់!");
                          }}
                          className="px-4 py-3 border border-amber-200 text-slate-700 hover:bg-orange-50/60 rounded-xl text-[15px] font-semibold transition shadow-xs"
                          title="ចម្លងសារ"
                        >
                          <Copy className="w-4.5 h-4.5" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="py-14 text-center text-slate-400 text-[14.5px]">
                      <Sparkles className="w-9 h-9 mx-auto mb-2 text-amber-300" />
                      សូមជ្រើសរើស Task មួយនៅខាងឆ្វេង ដើម្បីពិនិត្យ និងកែសម្រួលសារ AI Draft
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 5: CONVERSATIONS (ការសន្ទនា LIVE CHAT) */}
          {/* ========================================================= */}
          {activeNav === "conversations" && (
            <div className="bg-white rounded-2xl border border-amber-200/80 shadow-xs overflow-hidden flex flex-col md:flex-row h-[760px]">
              {/* Conversation List Sidebar */}
              <div className="w-full md:w-84 border-r border-amber-200/80 flex flex-col bg-[#fffdfa]">
                <div className="p-4.5 border-b border-amber-200/80 flex items-center justify-between bg-white">
                  <span className="font-bold text-[16px] text-slate-900">ប្រអប់សារ Inbox</span>
                  <button
                    onClick={fetchConversations}
                    disabled={refreshingChats}
                    className="text-orange-600 hover:text-orange-700 transition"
                  >
                    <RefreshCw className={`w-4 h-4 ${refreshingChats ? "animate-spin" : ""}`} />
                  </button>
                </div>

                <div className="overflow-y-auto flex-1 divide-y divide-amber-100/60">
                  {conversations.length === 0 ? (
                    <div className="p-8 text-center text-[14px] text-slate-400">
                      មិនទាន់មានប្រវត្តិ Chat ណាមួយឡើយ។
                    </div>
                  ) : (
                    conversations.map((c) => {
                      const isSelected = c.id === selectedConvId;
                      const lastMsg = c.messages[c.messages.length - 1];

                      return (
                        <button
                          key={c.id}
                          onClick={() => setSelectedConvId(c.id)}
                          className={`w-full text-left p-4 transition flex flex-col gap-1.5 ${
                            isSelected
                              ? "bg-orange-50/80 border-l-4 border-orange-500 shadow-xs"
                              : "hover:bg-white"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-[15px] text-slate-900">
                              {c.customerName || `Customer #${c.psid.slice(-6)}`}
                            </span>
                            <span className="text-[12.5px] text-slate-400">
                              {new Date(c.updatedAt).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>

                          <p className="text-[14px] text-slate-600 line-clamp-1 font-normal">
                            {lastMsg ? `${lastMsg.sender}: ${lastMsg.text}` : "គ្មានសារនៅឡើយទេ"}
                          </p>

                          <div className="flex items-center gap-2 mt-1">
                            {c.isAiPaused ? (
                              <span className="inline-flex items-center gap-1 text-[12px] px-2 py-0.5 rounded-md font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                                <PauseCircle className="w-3 h-3" /> មនុស្សឆ្លើយ
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[12px] px-2 py-0.5 rounded-md font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                <PlayCircle className="w-3 h-3" /> AI កំពុងឆ្លើយ
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Conversation Active Window */}
              {selectedConversation ? (
                <div className="flex-1 flex flex-col bg-white">
                  {/* Chat Top Banner with Human Takeover Toggle */}
                  <div className="p-4.5 border-b border-amber-200/80 flex items-center justify-between bg-white">
                    <div>
                      <div className="flex items-center gap-2.5">
                        <span className="font-bold text-[17px] text-slate-900">
                          {selectedConversation.customerName ||
                            `Customer #${selectedConversation.psid.slice(-6)}`}
                        </span>
                        <span className="text-[12px] px-2 py-0.5 rounded bg-amber-50 border border-amber-200 text-slate-600 font-mono">
                          PSID: {selectedConversation.psid}
                        </span>
                      </div>
                      <p className="text-[13.5px] text-slate-500 mt-0.5 font-normal">
                        ចាប់ផ្តើមសន្ទនា:{" "}
                        {new Date(selectedConversation.createdAt || selectedConversation.updatedAt).toLocaleDateString()}
                      </p>
                    </div>

                    {/* Human Takeover Toggle Button: 15–16px, font-weight 600 */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          handleToggleAi(selectedConversation.id, selectedConversation.isAiPaused)
                        }
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[15px] font-semibold shadow-xs transition ${
                          selectedConversation.isAiPaused
                            ? "bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                            : "bg-[#ea580c] hover:bg-[#c2410c] text-white font-bold"
                        }`}
                      >
                        {selectedConversation.isAiPaused ? (
                          <>
                            <PlayCircle className="w-4.5 h-4.5" /> បន្ត AI ឡើងវិញ
                          </>
                        ) : (
                          <>
                            <PauseCircle className="w-4.5 h-4.5" /> ផ្អាក AI (មនុស្សឆ្លើយផ្ទាល់)
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Messages Timeline */}
                  <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-[#fef9f2]/70">
                    {selectedConversation.messages.map((m) => {
                      const isUser = m.sender === "USER";
                      return (
                        <div
                          key={m.id}
                          className={`flex flex-col ${isUser ? "items-start" : "items-end"}`}
                        >
                          <div className="flex items-center gap-2 mb-1 px-1">
                            <span className="text-[12.5px] font-semibold text-slate-500">
                              {isUser ? "អតិថិជន" : "ជំនួយការលក់ AI"}
                            </span>
                            <span className="text-[12px] text-slate-400">
                              {new Date(m.createdAt).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                          <div
                            className={`max-w-md p-4 rounded-2xl text-[15px] leading-relaxed shadow-xs font-medium ${
                              isUser
                                ? "bg-white text-slate-800 rounded-tl-none border border-amber-200"
                                : "bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-tr-none shadow-xs"
                            }`}
                          >
                            {m.text}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Notice Footer */}
                  <div className="p-4 border-t border-amber-200/80 bg-amber-50/50 text-[14px] text-slate-700 flex items-center justify-between font-normal">
                    <span>
                      {selectedConversation.isAiPaused
                        ? "⚠️ AI ត្រូវបាន Pause: លោកអ្នកអាចចូលឆ្លើយតបក្នុង Meta Business Inbox ដោយសុវត្ថិភាព។"
                        : "✅ AI កំពុងដំណើរការឆ្លើយតបដោយស្វ័យប្រវត្តិតាម System Prompt & Knowledge Base។"}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center text-slate-400 text-[15px]">
                  សូមជ្រើសរើសការសន្ទនាដើម្បីមើលសារ
                </div>
              )}
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 6: KNOWLEDGE BASE (ចំណេះដឹងផលិតផល) */}
          {/* ========================================================= */}
          {activeNav === "knowledge" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1 bg-white p-6 rounded-2xl border border-amber-200/80 shadow-xs space-y-4.5">
                <h3 className="font-bold text-slate-900 text-[18px] leading-snug">
                  បន្ថែមព័ត៌មានទំនិញ / សំណួរញឹកញាប់
                </h3>
                <p className="text-[14px] text-slate-500 font-normal">
                  បន្ថែមព័ត៌មានផលិតផល តម្លៃ ប្រូម៉ូសិន ឬលក្ខខណ្ឌដឹកជញ្ជូនចូលទៅក្នុង Supabase
                  ដើម្បីឲ្យ AI យកទៅឆ្លើយ។
                </p>

                <form onSubmit={handleAddKnowledge} className="space-y-4">
                  <div>
                    <label className="text-[14.5px] font-semibold text-slate-700">ប្រភេទ</label>
                    <select
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      className="w-full mt-1.5 text-[15px] font-medium border border-amber-200 rounded-xl p-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-orange-400"
                    >
                      <option value="Product">ព័ត៌មានទំនិញ (Product Details)</option>
                      <option value="Pricing">តម្លៃ &amp; ប្រូម៉ូសិន (Pricing &amp; Promo)</option>
                      <option value="Shipping">ការដឹកជញ្ជូន (Shipping &amp; Delivery)</option>
                      <option value="FAQ">សំណួរញឹកញាប់ (General FAQ)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[14.5px] font-semibold text-slate-700">ចំណងជើង</label>
                    <input
                      type="text"
                      placeholder="ឧ. Kidney Pro ឃីដនី ប្រូ 1 កំប៉ុង"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      className="w-full mt-1.5 text-[15px] font-medium border border-amber-200 rounded-xl p-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-orange-400"
                    />
                  </div>

                  <div>
                    <label className="text-[14.5px] font-semibold text-slate-700">ខ្លឹមសារ</label>
                    <textarea
                      rows={4}
                      placeholder="បញ្ចូលព័ត៌មានលម្អិត តម្លៃ ប្រូម៉ូសិន ឬការណែនាំ..."
                      value={newContent}
                      onChange={(e) => setNewContent(e.target.value)}
                      className="w-full mt-1.5 text-[15px] font-medium border border-amber-200 rounded-xl p-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-orange-400"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={addingKnowledge || !newTitle || !newContent}
                    className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold py-2.5 px-4 rounded-xl text-[15px] shadow-xs transition disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4.5 h-4.5" /> រក្សាទុកព័ត៌មាន
                  </button>
                </form>
              </div>

              <div className="lg:col-span-2 space-y-3.5">
                <h3 className="font-bold text-slate-900 text-[18px]">
                  ព័ត៌មានកំពុងប្រើប្រាស់ ({pageConfig?.knowledgeItems.length || 0})
                </h3>
                <div className="space-y-3.5">
                  {pageConfig?.knowledgeItems.length === 0 ? (
                    <div className="bg-white p-10 rounded-2xl border border-amber-200/80 text-center text-slate-400 text-[15px]">
                      មិនទាន់មានទិន្នន័យ Knowledge នៅឡើយទេ។ សូមបន្ថែមព័ត៌មានផលិតផលដំបូងរបស់អ្នក!
                    </div>
                  ) : (
                    pageConfig?.knowledgeItems.map((item) => (
                      <div
                        key={item.id}
                        className="bg-white p-5 rounded-2xl border border-amber-200/80 shadow-xs flex items-start justify-between gap-4"
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2.5">
                            <span className="text-[12px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-orange-50 text-orange-700 border border-orange-200">
                              {item.category || "General"}
                            </span>
                            <h4 className="font-bold text-[16px] text-slate-900">{item.title}</h4>
                          </div>
                          <p className="text-[15px] text-slate-600 leading-relaxed whitespace-pre-wrap font-medium">
                            {item.content}
                          </p>
                        </div>

                        <button
                          onClick={() => handleDeleteKnowledge(item.id)}
                          className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg transition"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 7: AUTOMATION (ស្វ័យប្រវត្តិកម្ម AI) */}
          {/* ========================================================= */}
          {activeNav === "automation" && (
            <div className="bg-white p-7 rounded-2xl border border-amber-200/80 shadow-xs space-y-6 max-w-3xl">
              <div>
                <h3 className="text-[20px] font-bold text-slate-900">
                  AI Persona &amp; System Prompt
                </h3>
                <p className="text-[14px] text-slate-500 font-normal mt-0.5">
                  កំណត់អត្តសញ្ញាណ របៀបនិយាយ និងក្បួនច្បាប់ក្នុងការលក់របស់ AI លើ Facebook Page
                </p>
              </div>

              <div>
                <label className="text-[14.5px] font-semibold text-slate-700">System Prompt</label>
                <textarea
                  rows={7}
                  value={pageConfig?.systemPrompt || ""}
                  onChange={(e) => {
                    if (pageConfig) setPageConfig({ ...pageConfig, systemPrompt: e.target.value });
                  }}
                  className="w-full mt-2 text-[15px] p-3.5 border border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 leading-relaxed font-medium bg-white"
                />
              </div>

              <div className="pt-2">
                <button
                  onClick={() => handleSaveConfig()}
                  disabled={savingConfig}
                  className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold py-2.5 px-6 rounded-xl text-[15px] shadow-xs transition disabled:opacity-50 flex items-center gap-2"
                >
                  <Save className="w-4.5 h-4.5" />
                  {savingConfig ? "កំពុងរក្សាទុក..." : "រក្សាទុក System Prompt"}
                </button>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 8: ADS (ការផ្សាយពាណិជ្ជកម្ម) */}
          {/* ========================================================= */}
          {activeNav === "ads" && (
            <div className="space-y-6">
              <div className="bg-white p-7 rounded-2xl border border-amber-200/80 shadow-xs space-y-3.5">
                <div className="flex items-center gap-2.5">
                  <Megaphone className="w-6 h-6 text-[#ea580c]" />
                  <h3 className="font-bold text-slate-900 text-[19px]">
                    ការផ្សាយពាណិជ្ជកម្ម Meta Ads (ឆាប់ៗនេះ)
                  </h3>
                </div>
                <p className="text-[15px] text-slate-600 leading-relaxed font-medium">
                  ផ្ទាំងគ្រប់គ្រងយុទ្ធនាការផ្សាយពាណិជ្ជកម្ម (Ads Manager) និងត្រួតពិនិត្យ Ad Spend,
                  ROAS, និង Cost per Lead ដោយផ្ទាល់តាមរយៈ Meta Marketing API។
                </p>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 9: SETTINGS (ការកំណត់) */}
          {/* ========================================================= */}
          {activeNav === "settings" && (
            <div className="space-y-6 max-w-4xl">
              {/* Card 1: Telegram CEO Assistant Bot */}
              <div className="bg-white p-7 rounded-2xl border border-amber-200/80 shadow-xs space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-amber-100">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center p-2.5 border border-sky-200/80 shrink-0">
                      <Send className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2.5">
                        <h3 className="text-[19px] font-bold text-slate-900 leading-snug">
                          Telegram Bot (My CEO Assistant)
                        </h3>
                        <span
                          className={`text-[12px] font-bold px-2.5 py-0.5 rounded-full ${
                            telegramInfo?.isConnected
                              ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                              : telegramInfo?.ok
                              ? "bg-amber-100 text-amber-800 border border-amber-300"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {telegramInfo?.isConnected
                            ? "✓ បានភ្ជាប់ជោគជ័យ"
                            : "រង់ចាំការភ្ជាប់ Chat ID"}
                        </span>
                      </div>
                      <p className="text-[14px] text-slate-500 font-normal mt-0.5">
                        ប្រព័ន្ធផ្ញើសារជូនដំណឹងស្វ័យប្រវត្តិតាម Telegram ពេលមាន Lead ថ្មី,
                        ការកុម្ម៉ង់ទិញ និងរំលឹក Follow-up
                      </p>
                    </div>
                  </div>

                  <a
                    href="https://t.me/My_CEO_Assitant_bot"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-[14.5px] font-bold shadow-xs transition shrink-0"
                  >
                    <Send className="w-4 h-4" /> បើក Telegram Bot
                  </a>
                </div>

                {/* Feedback Alert Banner */}
                {telegramAlert && (
                  <div
                    className={`p-4 rounded-xl border text-[14.5px] font-medium flex items-start gap-2.5 ${
                      telegramAlert.type === "success"
                        ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                        : "bg-rose-50 border-rose-200 text-rose-900"
                    }`}
                  >
                    <span className="text-[18px]">
                      {telegramAlert.type === "success" ? "✓" : "⚠️"}
                    </span>
                    <div className="flex-1 leading-relaxed">{telegramAlert.message}</div>
                  </div>
                )}

                {/* Bot Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[14.5px] font-medium">
                  <div className="p-4 bg-amber-50/40 rounded-xl border border-amber-200/60 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-500">ឈ្មោះ Bot:</span>
                      <strong className="text-slate-800">
                        {telegramInfo?.bot?.first_name || "My CEO Assistant"}
                      </strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Username:</span>
                      <span className="font-mono text-sky-700 font-bold">
                        @{telegramInfo?.bot?.username || "My_CEO_Assitant_bot"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">ស្ថានភាព Bot API:</span>
                      <span className="text-emerald-700 font-bold flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Active Online
                      </span>
                    </div>
                  </div>

                  <div className="p-4 bg-amber-50/40 rounded-xl border border-amber-200/60 space-y-2.5">
                    <label className="text-slate-600 font-semibold block text-[14px]">
                      Telegram Chat ID (សម្រាប់ទទួលសារ):
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="ឧ. 123456789 ឬ -100..."
                        value={telegramChatIdInput}
                        onChange={(e) => setTelegramChatIdInput(e.target.value)}
                        className="flex-1 px-3 py-1.5 border border-amber-200 rounded-lg text-[14.5px] font-mono bg-white focus:outline-none focus:ring-2 focus:ring-orange-400"
                      />
                      <button
                        onClick={handleSaveTelegramChatId}
                        className="px-3.5 py-1.5 bg-orange-600 hover:bg-orange-700 text-white text-[13.5px] font-bold rounded-lg transition shadow-xs"
                      >
                        រក្សាទុក
                      </button>
                    </div>
                  </div>
                </div>

                {/* Action Buttons: Auto-Detect & Test Alert */}
                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <button
                    onClick={handleDetectTelegram}
                    disabled={detectingTelegram}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-[15px] font-bold shadow-xs transition disabled:opacity-50"
                  >
                    <RefreshCw className={`w-4 h-4 ${detectingTelegram ? "animate-spin" : ""}`} />
                    {detectingTelegram ? "កំពុងស្វែងរក Chat ID..." : "🔍 ស្វែងរក Telegram Chat ID ដោយស្វ័យប្រវត្តិ"}
                  </button>

                  <button
                    onClick={handleSendTestTelegram}
                    disabled={testingTelegram}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-amber-200 bg-white hover:bg-orange-50/60 text-slate-800 text-[15px] font-semibold transition shadow-xs disabled:opacity-50"
                  >
                    <Send className="w-4 h-4 text-sky-600" />
                    {testingTelegram ? "កំពុងផ្ញើសារ..." : "🚀 ផ្ញើសារសាកល្បង (Test Alert)"}
                  </button>
                </div>

                {/* 3 Step Setup Guide */}
                <div className="p-4.5 bg-[#fffdfa] rounded-xl border border-amber-200/80 space-y-2 text-[14px]">
                  <h4 className="font-bold text-slate-800 text-[15px] flex items-center gap-2">
                    💡 របៀបភ្ជាប់ Telegram ត្រឹមតែ ៣ ជំហានងាយៗ៖
                  </h4>
                  <ol className="list-decimal list-inside space-y-1 text-slate-600 font-medium leading-relaxed">
                    <li>
                      ចុចប៊ូតុងពណ៌ខៀវ{" "}
                      <a
                        href="https://t.me/My_CEO_Assitant_bot"
                        target="_blank"
                        rel="noreferrer"
                        className="text-sky-600 font-bold underline"
                      >
                        "បើក Telegram Bot"
                      </a>{" "}
                      ខាងលើ (ឬចូល Telegram ស្វែងរក <code>@My_CEO_Assitant_bot</code>)។
                    </li>
                    <li>
                      ចុចប៊ូតុង <b>START</b> ក្នុង Telegram (ឬផ្ញើសារអ្វីមួយ ដូចជា "Hello")។ បើចង់ទទួលជាក្រុម សូមទាញ Bot ចូល Group រួចផ្ញើសារមួយ។
                    </li>
                    <li>
                      ត្រឡប់មកទីនេះ រួចចុចប៊ូតុង <b>"🔍 ស្វែងរក Telegram Chat ID ដោយស្វ័យប្រវត្តិ"</b> នោះប្រព័ន្ធនឹងចាប់យក Chat ID និងភ្ជាប់ភ្លាមៗ!
                    </li>
                  </ol>
                </div>
              </div>

              {/* Card 2: Meta Facebook & Webhook Settings */}
              <div className="bg-white p-7 rounded-2xl border border-amber-200/80 shadow-xs space-y-5">
                <h3 className="text-[19px] font-bold text-slate-900 border-b border-amber-100 pb-3">
                  ការតភ្ជាប់ Meta &amp; Webhook Settings
                </h3>

                <div className="space-y-3.5 text-[15px] font-medium">
                  <div className="p-5 bg-amber-50/50 rounded-xl border border-amber-200/70 space-y-2.5">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Facebook Page:</span>
                      <strong className="text-slate-900">Kidney Pro ឃីដនី ប្រូ</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Page ID:</span>
                      <span className="font-mono text-slate-700">955747057621489</span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                      <span className="text-slate-500">Webhook URL:</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-orange-600 font-semibold text-[13.5px] break-all bg-white px-2 py-0.5 rounded border border-amber-200">
                          {health?.webhook.url || "https://capitol-inclusive-browsing-paragraph.trycloudflare.com/api/webhook"}
                        </span>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(
                              health?.webhook.url || "https://capitol-inclusive-browsing-paragraph.trycloudflare.com/api/webhook"
                            );
                            alert("បានចម្លង Webhook URL រួចរាល់!");
                          }}
                          className="px-2 py-0.5 bg-orange-100 hover:bg-orange-200 text-orange-700 text-[12px] font-bold rounded transition shadow-2xs shrink-0"
                        >
                          ចម្លង
                        </button>
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Verify Token:</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-slate-700">chatkh_mvp_secure_token_2026</span>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText("chatkh_mvp_secure_token_2026");
                            alert("បានចម្លង Verify Token រួចរាល់!");
                          }}
                          className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[12px] font-bold rounded transition shadow-2xs shrink-0"
                        >
                          ចម្លង
                        </button>
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">ស្ថានភាព Token:</span>
                      <span className="text-emerald-700 font-bold">
                        Permanent Page Access Token (គ្មានថ្ងៃផុតកំណត់)
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ========================================================= */}
      {/* MODAL 1: ADD CUSTOMER MANUALLY */}
      {/* ========================================================= */}
      {showAddCustomerModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4.5 border border-amber-200/80">
            <div className="flex items-center justify-between border-b border-amber-100 pb-3.5">
              <h3 className="font-bold text-slate-900 text-[17px]">
                បន្ថែមអតិថិជនថ្មី (Manual Lead)
              </h3>
              <button
                onClick={() => setShowAddCustomerModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomer} className="space-y-3.5 text-[15px] font-medium">
              <div>
                <label className="font-semibold text-slate-700">ឈ្មោះអតិថិជន *</label>
                <input
                  type="text"
                  required
                  placeholder="ឧ. សុខ សាន"
                  value={newCustomerForm.name}
                  onChange={(e) =>
                    setNewCustomerForm({ ...newCustomerForm, name: e.target.value })
                  }
                  className="w-full mt-1.5 p-2.5 border border-amber-200 rounded-xl focus:ring-2 focus:ring-orange-400 font-medium bg-white"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700">លេខទូរស័ព្ទ</label>
                <input
                  type="text"
                  placeholder="012 345 678"
                  value={newCustomerForm.phone}
                  onChange={(e) =>
                    setNewCustomerForm({ ...newCustomerForm, phone: e.target.value })
                  }
                  className="w-full mt-1.5 p-2.5 border border-amber-200 rounded-xl focus:ring-2 focus:ring-orange-400 font-medium bg-white"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700">ផលិតផលចាប់អារម្មណ៍</label>
                <input
                  type="text"
                  value={newCustomerForm.productInterest}
                  onChange={(e) =>
                    setNewCustomerForm({ ...newCustomerForm, productInterest: e.target.value })
                  }
                  className="w-full mt-1.5 p-2.5 border border-amber-200 rounded-xl focus:ring-2 focus:ring-orange-400 font-medium bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700">ដំណាក់កាល</label>
                  <select
                    value={newCustomerForm.stage}
                    onChange={(e) =>
                      setNewCustomerForm({ ...newCustomerForm, stage: e.target.value })
                    }
                    className="w-full mt-1.5 p-2.5 border border-amber-200 rounded-xl font-medium bg-white"
                  >
                    <option value="NEW_LEAD">អតិថិជនថ្មី</option>
                    <option value="INTERESTED">ចាប់អារម្មណ៍</option>
                    <option value="HOT_LEAD">ចង់ទិញខ្លាំង</option>
                    <option value="FOLLOW_UP">កំពុងតាមដាន</option>
                    <option value="ORDERED">បានកុម្ម៉ង់ (Won)</option>
                    <option value="LOST">បោះបង់ (Lost)</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700">អ្នកទទួលបន្ទុក</label>
                  <input
                    type="text"
                    value={newCustomerForm.assignedSeller}
                    onChange={(e) =>
                      setNewCustomerForm({ ...newCustomerForm, assignedSeller: e.target.value })
                    }
                    className="w-full mt-1.5 p-2.5 border border-amber-200 rounded-xl font-medium bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700">កំណត់សម្គាល់</label>
                <textarea
                  rows={2}
                  placeholder="ចំណាំបន្ថែមពីអតិថិជន..."
                  value={newCustomerForm.notes}
                  onChange={(e) =>
                    setNewCustomerForm({ ...newCustomerForm, notes: e.target.value })
                  }
                  className="w-full mt-1.5 p-2.5 border border-amber-200 rounded-xl font-medium bg-white"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddCustomerModal(false)}
                  className="px-4.5 py-2.5 rounded-xl border border-amber-200 text-slate-700 hover:bg-orange-50/50 font-semibold"
                >
                  បោះបង់
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold shadow-xs transition"
                >
                  បង្កើតអតិថិជន
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: EDIT CUSTOMER */}
      {/* ========================================================= */}
      {editingCustomer && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4.5 border border-amber-200/80">
            <div className="flex items-center justify-between border-b border-amber-100 pb-3.5">
              <h3 className="font-bold text-slate-900 text-[17px]">កែប្រែព័ត៌មានអតិថិជន</h3>
              <button
                onClick={() => setEditingCustomer(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={handleSaveCustomerEdit}
              className="space-y-3.5 text-[15px] font-medium"
            >
              <div>
                <label className="font-semibold text-slate-700">ឈ្មោះអតិថិជន</label>
                <input
                  type="text"
                  required
                  value={editingCustomer.name}
                  onChange={(e) =>
                    setEditingCustomer({ ...editingCustomer, name: e.target.value })
                  }
                  className="w-full mt-1.5 p-2.5 border border-amber-200 rounded-xl font-medium bg-white"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700">លេខទូរស័ព្ទ</label>
                <input
                  type="text"
                  value={editingCustomer.phone || ""}
                  onChange={(e) =>
                    setEditingCustomer({ ...editingCustomer, phone: e.target.value })
                  }
                  className="w-full mt-1.5 p-2.5 border border-amber-200 rounded-xl font-medium bg-white"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700">ផលិតផលចាប់អារម្មណ៍</label>
                <input
                  type="text"
                  value={editingCustomer.productInterest || ""}
                  onChange={(e) =>
                    setEditingCustomer({ ...editingCustomer, productInterest: e.target.value })
                  }
                  className="w-full mt-1.5 p-2.5 border border-amber-200 rounded-xl font-medium bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700">ដំណាក់កាល</label>
                  <select
                    value={editingCustomer.stage}
                    onChange={(e) =>
                      setEditingCustomer({ ...editingCustomer, stage: e.target.value as any })
                    }
                    className="w-full mt-1.5 p-2.5 border border-amber-200 rounded-xl font-medium bg-white"
                  >
                    <option value="NEW_LEAD">អតិថិជនថ្មី</option>
                    <option value="INTERESTED">ចាប់អារម្មណ៍</option>
                    <option value="HOT_LEAD">ចង់ទិញខ្លាំង</option>
                    <option value="FOLLOW_UP">កំពុងតាមដាន</option>
                    <option value="ORDERED">បានកុម្ម៉ង់ (Won)</option>
                    <option value="LOST">បោះបង់ (Lost)</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700">អ្នកទទួលបន្ទុក</label>
                  <input
                    type="text"
                    value={editingCustomer.assignedSeller || ""}
                    onChange={(e) =>
                      setEditingCustomer({ ...editingCustomer, assignedSeller: e.target.value })
                    }
                    className="w-full mt-1.5 p-2.5 border border-amber-200 rounded-xl font-medium bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700">កំណត់សម្គាល់</label>
                <textarea
                  rows={2}
                  value={editingCustomer.notes || ""}
                  onChange={(e) =>
                    setEditingCustomer({ ...editingCustomer, notes: e.target.value })
                  }
                  className="w-full mt-1.5 p-2.5 border border-amber-200 rounded-xl font-medium bg-white"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingCustomer(null)}
                  className="px-4.5 py-2.5 rounded-xl border border-amber-200 text-slate-700 hover:bg-orange-50/50 font-semibold"
                >
                  បោះបង់
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold shadow-xs transition"
                >
                  រក្សាទុកការកែប្រែ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 3: SCHEDULE FOLLOW-UP & AI GENERATE */}
      {/* ========================================================= */}
      {schedulingCustomer && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6.5 shadow-xl space-y-4.5 border border-amber-200/80">
            <div className="flex items-center justify-between border-b border-amber-100 pb-3.5">
              <div>
                <h3 className="font-bold text-slate-900 text-[18px]">
                  កាលវិភាគ Follow-up: {schedulingCustomer.name}
                </h3>
                <p className="text-[13.5px] text-slate-500 font-normal mt-0.5">
                  កំណត់កាលវិភាគ និងអនុញ្ញាតឲ្យ AI Gemini Draft សារជាភាសាខ្មែរ
                </p>
              </div>
              <button
                onClick={() => setSchedulingCustomer(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSchedule} className="space-y-4 text-[15px] font-medium">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="font-semibold text-slate-700">
                    មូលហេតុ Follow-up *
                  </label>
                  <select
                    value={scheduleForm.reason}
                    onChange={(e) => {
                      const nextReason = e.target.value;
                      setScheduleForm({ ...scheduleForm, reason: nextReason });
                      handleGenerateAiSuggestion(schedulingCustomer.id, nextReason);
                    }}
                    className="w-full mt-1.5 p-2.5 border border-amber-200 rounded-xl bg-white font-medium focus:ring-2 focus:ring-orange-400"
                  >
                    <option value="NEED_TO_THINK">សុំគិតមើលសិន (Need to think)</option>
                    <option value="PRICE_OBJECTION">តម្លៃរាងថ្លៃ (Price objection)</option>
                    <option value="WAITING_SALARY">ចាំបើកប្រាក់ខែ (Waiting salary)</option>
                    <option value="NO_RESPONSE">បាត់ការឆ្លើយតប (No response)</option>
                    <option value="ASK_FAMILY">សុំសួរគ្រួសារ (Ask family/spouse)</option>
                    <option value="INTERESTED_NOT_READY">
                      មិនទាន់រួចរាល់ (Interested not ready)
                    </option>
                    <option value="OTHER">មូលហេតុផ្សេងៗ (Other)</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700">ថ្ងៃ &amp; ម៉ោងកំណត់ *</label>
                  <input
                    type="datetime-local"
                    required
                    value={scheduleForm.scheduledAt}
                    onChange={(e) =>
                      setScheduleForm({ ...scheduleForm, scheduledAt: e.target.value })
                    }
                    className="w-full mt-1.5 p-2.5 border border-amber-200 rounded-xl bg-white font-medium focus:ring-2 focus:ring-orange-400"
                  />
                </div>
              </div>

              {scheduleForm.reason === "OTHER" && (
                <div>
                  <label className="font-semibold text-slate-700">បញ្ជាក់មូលហេតុបន្ថែម</label>
                  <input
                    type="text"
                    placeholder="បញ្ជាក់មូលហេតុបន្ថែម..."
                    value={scheduleForm.customReason}
                    onChange={(e) =>
                      setScheduleForm({ ...scheduleForm, customReason: e.target.value })
                    }
                    className="w-full mt-1.5 p-2.5 border border-amber-200 rounded-xl font-medium focus:ring-2 focus:ring-orange-400 bg-white"
                  />
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[14.5px] font-semibold text-slate-700">
                    សារ Follow-up ដែល AI ព្រាងទុក (Khmer Draft)
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      handleGenerateAiSuggestion(
                        schedulingCustomer.id,
                        scheduleForm.reason,
                        scheduleForm.customReason
                      )
                    }
                    disabled={generatingAiDraft}
                    className="text-[13.5px] text-orange-600 hover:text-orange-700 font-semibold flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    {generatingAiDraft ? "កំពុងព្រាងសារ..." : "ព្រាងសារ AI ថ្មី"}
                  </button>
                </div>

                <textarea
                  rows={4}
                  value={scheduleForm.aiSuggestedText}
                  onChange={(e) =>
                    setScheduleForm({ ...scheduleForm, aiSuggestedText: e.target.value })
                  }
                  placeholder="AI នឹងរៀបចំសេចក្តីព្រាងសារជាភាសាខ្មែរនៅទីនេះ..."
                  className="w-full p-3 border border-amber-200 rounded-xl bg-[#fffdfa] focus:bg-white leading-relaxed text-[15px] font-medium focus:ring-2 focus:ring-orange-400"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setSchedulingCustomer(null)}
                  className="px-4.5 py-2.5 rounded-xl border border-amber-200 text-slate-700 hover:bg-orange-50/50 font-semibold"
                >
                  បោះបង់
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold shadow-xs flex items-center gap-2 text-[15px] transition"
                >
                  <Calendar className="w-4 h-4" /> រក្សាទុកកាលវិភាគ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
