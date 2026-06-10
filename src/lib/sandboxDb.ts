import fs from "fs";
import path from "path";

// Define the database path
const DB_FILE_PATH = path.join(process.cwd(), "prisma", "db-sandbox.json");

// Define interfaces for sandbox data
export interface SandboxUser {
  id: string;
  email: string;
  password?: string;
  name?: string;
  image?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SandboxAgent {
  id: string;
  userId: string;
  accountId: string;
  name: string;
  email: string;
  password?: string;
  role?: string;
  permissions?: string[];
  department?: string;
  departmentId?: string;
  agentStatus?: string;
  schedule?: any;
  createdAt: string;
  updatedAt: string;
}

export interface SandboxPlan {
  id: string;
  name: string;
  price: number;
  features: string[];
}

export interface SandboxSubscription {
  id: string;
  userId: string;
  planId: string;
  status: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
}

export interface SandboxBot {
  id: string;
  userId: string;
  accountId: string;
  name: string;
  avatarUrl?: string;
  welcomeMessage?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SandboxFlow {
  id: string;
  botId: string;
  name: string;
  isMain: boolean;
  nodes: any[];
  edges: any[];
  createdAt: string;
  updatedAt: string;
}

export interface SandboxWidgetSettings {
  id: string;
  botId: string;
  widgetColor: string;
  headerColor: string;
  position: string;
  bubbleStyle: string;
  font: string;
  borderRadius: number;
  launcherIcon?: string;
  launcherBgTransparent?: boolean;
  launcherIconSize?: number;
  headerTextColor?: string;
  leftMessageBgColor?: string;
  leftMessageTextColor?: string;
  rightMessageBgColor?: string;
  rightMessageTextColor?: string;
  widgetBgColor?: string;
  launcherGreeting?: string;
  launcherGreetingEnabled?: boolean;
  launcherAnimation?: string;
}

export interface SandboxConversation {
  id: string;
  botId: string;
  accountId?: string;
  sessionId: string;
  visitorName?: string;
  visitorEmail?: string;
  department?: string;
  departmentId?: string;
  status: string; // bot, waiting_agent, active, closed
  assignedAgentId?: string;
  collaboratorIds?: string[];
  startedAt?: string;
  closedAt?: string;
  variables?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface SandboxMessage {
  id: string;
  conversationId: string;
  sender: "bot" | "user" | "agent";
  text: string;
  payload?: any;
  createdAt: string;
}

export interface SandboxLead {
  id: string;
  botId: string;
  conversationId?: string;
  name?: string;
  email?: string;
  mobile?: string;
  source?: string;
  createdAt: string;
}

export interface SandboxAnalytics {
  id: string;
  botId: string;
  metric: string; // visitor, chat_start, lead_conversion, node_trigger
  value: number;
  metadata?: any;
  createdAt: string;
}

export interface SandboxRole {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SandboxDepartment {
  id: string;
  accountId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface SandboxModule {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  sortOrder: number;
  isActive: boolean;
}

export interface SandboxRolePermission {
  id: string;
  roleId: string;
  moduleId: string;
  canView: boolean;
  canAdd: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

export interface SandboxSchema {
  users: SandboxUser[];
  plans: SandboxPlan[];
  subscriptions: SandboxSubscription[];
  bots: SandboxBot[];
  flows: SandboxFlow[];
  widgetSettings: SandboxWidgetSettings[];
  conversations: SandboxConversation[];
  messages: SandboxMessage[];
  leads: SandboxLead[];
  analytics: SandboxAnalytics[];
  agents: SandboxAgent[];
  roles: SandboxRole[];
  modules: SandboxModule[];
  rolePermissions: SandboxRolePermission[];
  auditLogs: any[];
  departments?: SandboxDepartment[];
}

// Default helper to generate template flows
export function getTemplateFlow(flowId: string, templateType: string): { nodes: any[]; edges: any[] } {
  const nodes: any[] = [
    {
      id: "node-start",
      flowId,
      type: "start",
      x: 80,
      y: 200,
      data: { type: "start", label: "Start Flow" }
    }
  ];
  const edges: any[] = [];

  if (templateType === "lead_gen") {
    nodes.push(
      {
        id: "node-1",
        flowId,
        type: "message",
        x: 340,
        y: 200,
        data: { type: "message", text: "Hello! Welcome to our service. We'd love to help you grow your business. Can we ask a few quick questions?" }
      },
      {
        id: "node-2",
        flowId,
        type: "button",
        x: 620,
        y: 200,
        data: {
          type: "button",
          text: "Are you ready to start?",
          options: ["Yes, let's go!", "Maybe later"]
        }
      },
      {
        id: "node-name",
        flowId,
        type: "question",
        x: 900,
        y: 80,
        data: { type: "question", text: "Awesome! What's your name?", variable: "visitor_name", inputType: "Text" }
      },
      {
        id: "node-email",
        flowId,
        type: "question",
        x: 1180,
        y: 80,
        data: { type: "question", text: "Nice to meet you, {{visitor_name}}! What's your best email address?", variable: "visitor_email", inputType: "Email" }
      },
      {
        id: "node-phone",
        flowId,
        type: "question",
        x: 1460,
        y: 80,
        data: { type: "question", text: "Thanks! And what is your phone number?", variable: "visitor_phone", inputType: "Phone" }
      },
      {
        id: "node-success",
        flowId,
        type: "message",
        x: 1740,
        y: 200,
        data: { type: "message", text: "Thank you, {{visitor_name}}! Our team will reach out to you shortly." }
      },
      {
        id: "node-later",
        flowId,
        type: "message",
        x: 900,
        y: 380,
        data: { type: "message", text: "No worries! If you change your mind, we'll be right here. Have a great day!" }
      },
      {
        id: "node-end",
        flowId,
        type: "end",
        x: 2020,
        y: 200,
        data: { type: "end", label: "End Flow" }
      }
    );

    edges.push(
      { id: "e-start-1", flowId, source: "node-start", target: "node-1" },
      { id: "e-1-2", flowId, source: "node-1", target: "node-2" },
      { id: "e-2-name", flowId, source: "node-2", target: "node-name", sourceHandle: "option-0" },
      { id: "e-2-later", flowId, source: "node-2", target: "node-later", sourceHandle: "option-1" },
      { id: "e-name-email", flowId, source: "node-name", target: "node-email" },
      { id: "e-email-phone", flowId, source: "node-email", target: "node-phone" },
      { id: "e-phone-success", flowId, source: "node-phone", target: "node-success" },
      { id: "e-success-end", flowId, source: "node-success", target: "node-end" },
      { id: "e-later-end", flowId, source: "node-later", target: "node-end" }
    );
  } else if (templateType === "support") {
    nodes.push(
      {
        id: "node-1",
        flowId,
        type: "message",
        x: 340,
        y: 280,
        data: { type: "message", text: "Hi there! I am your Support Assistant. How can I help you today?" }
      },
      {
        id: "node-2",
        flowId,
        type: "button",
        x: 620,
        y: 280,
        data: {
          type: "button",
          text: "Please select an issue type:",
          options: ["Technical Issues", "Billing & Pricing", "General Inquiry"]
        }
      },
      {
        id: "node-tech",
        flowId,
        type: "message",
        x: 920,
        y: 80,
        data: { type: "message", text: "For technical issues, please describe your problem below and we will help you resolve it." }
      },
      {
        id: "node-tech-input",
        flowId,
        type: "question",
        x: 1200,
        y: 80,
        data: { type: "question", text: "Please enter your issue details:", variable: "tech_desc", inputType: "Textarea" }
      },
      {
        id: "node-billing",
        flowId,
        type: "message",
        x: 920,
        y: 280,
        data: { type: "message", text: "For billing support, you can view your invoices in the Billing tab of your dashboard, or ask a question here." }
      },
      {
        id: "node-billing-input",
        flowId,
        type: "question",
        x: 1200,
        y: 280,
        data: { type: "question", text: "Please enter your registered email address:", variable: "billing_email", inputType: "Email" }
      },
      {
        id: "node-general",
        flowId,
        type: "message",
        x: 920,
        y: 480,
        data: { type: "message", text: "Sure! What is your general question?" }
      },
      {
        id: "node-general-input",
        flowId,
        type: "question",
        x: 1200,
        y: 480,
        data: { type: "question", text: "Enter your question:", variable: "gen_question", inputType: "Text" }
      },
      {
        id: "node-agent",
        flowId,
        type: "live_agent",
        x: 1500,
        y: 280,
        data: { type: "live_agent", text: "Connecting you with a support representative. Please stand by...", department: "General Support" }
      },
      {
        id: "node-end",
        flowId,
        type: "end",
        x: 1780,
        y: 280,
        data: { type: "end", label: "End Chat" }
      }
    );

    edges.push(
      { id: "e-start-1", flowId, source: "node-start", target: "node-1" },
      { id: "e-1-2", flowId, source: "node-1", target: "node-2" },
      { id: "e-2-tech", flowId, source: "node-2", target: "node-tech", sourceHandle: "option-0" },
      { id: "e-2-billing", flowId, source: "node-2", target: "node-billing", sourceHandle: "option-1" },
      { id: "e-2-general", flowId, source: "node-2", target: "node-general", sourceHandle: "option-2" },
      { id: "e-tech-input", flowId, source: "node-tech", target: "node-tech-input" },
      { id: "e-billing-input", flowId, source: "node-billing", target: "node-billing-input" },
      { id: "e-general-input", flowId, source: "node-general", target: "node-general-input" },
      { id: "e-tech-agent", flowId, source: "node-tech-input", target: "node-agent" },
      { id: "e-billing-agent", flowId, source: "node-billing-input", target: "node-agent" },
      { id: "e-general-agent", flowId, source: "node-general-input", target: "node-agent" },
      { id: "e-agent-end", flowId, source: "node-agent", target: "node-end" }
    );
  } else if (templateType === "booking") {
    nodes.push(
      {
        id: "node-1",
        flowId,
        type: "message",
        x: 340,
        y: 200,
        data: { type: "message", text: "Hello! I can help you book an appointment. Let me collect a few details." }
      },
      {
        id: "node-name",
        flowId,
        type: "question",
        x: 620,
        y: 200,
        data: { type: "question", text: "What's your full name?", variable: "visitor_name", inputType: "Text" }
      },
      {
        id: "node-email",
        flowId,
        type: "question",
        x: 900,
        y: 200,
        data: { type: "question", text: "Great, {{visitor_name}}! What's your email address?", variable: "visitor_email", inputType: "Email" }
      },
      {
        id: "node-phone",
        flowId,
        type: "question",
        x: 1180,
        y: 200,
        data: { type: "question", text: "And your phone number?", variable: "visitor_phone", inputType: "Phone" }
      },
      {
        id: "node-service",
        flowId,
        type: "button",
        x: 1460,
        y: 200,
        data: {
          type: "button",
          text: "Which service are you booking?",
          options: ["Consultation", "Demo Session", "Support Call"]
        }
      },
      {
        id: "node-date",
        flowId,
        type: "question",
        x: 1740,
        y: 200,
        data: { type: "question", text: "What date works best for you? (e.g. June 20, 2026)", variable: "booking_date", inputType: "Text" }
      },
      {
        id: "node-time",
        flowId,
        type: "question",
        x: 2020,
        y: 200,
        data: { type: "question", text: "What time do you prefer? (e.g. 10:00 AM)", variable: "booking_time", inputType: "Text" }
      },
      {
        id: "node-confirm",
        flowId,
        type: "message",
        x: 2300,
        y: 200,
        data: { type: "message", text: "Perfect! Your appointment is booked for {{booking_date}} at {{booking_time}}. We'll send a confirmation to {{visitor_email}}. See you soon!" }
      },
      {
        id: "node-end",
        flowId,
        type: "end",
        x: 2580,
        y: 200,
        data: { type: "end", label: "Booking Complete" }
      }
    );

    edges.push(
      { id: "e-start-1", flowId, source: "node-start", target: "node-1" },
      { id: "e-1-name", flowId, source: "node-1", target: "node-name" },
      { id: "e-name-email", flowId, source: "node-name", target: "node-email" },
      { id: "e-email-phone", flowId, source: "node-email", target: "node-phone" },
      { id: "e-phone-service", flowId, source: "node-phone", target: "node-service" },
      { id: "e-service-date", flowId, source: "node-service", target: "node-date", sourceHandle: "option-0" },
      { id: "e-service-date-1", flowId, source: "node-service", target: "node-date", sourceHandle: "option-1" },
      { id: "e-service-date-2", flowId, source: "node-service", target: "node-date", sourceHandle: "option-2" },
      { id: "e-date-time", flowId, source: "node-date", target: "node-time" },
      { id: "e-time-confirm", flowId, source: "node-time", target: "node-confirm" },
      { id: "e-confirm-end", flowId, source: "node-confirm", target: "node-end" }
    );
  } else {
    // Default fallback / "scratch" — just start + welcome + end
    nodes.push(
      {
        id: "node-1",
        flowId,
        type: "message",
        x: 340,
        y: 200,
        data: { type: "message", text: "Hello! Welcome to our site. How can I help you today?" }
      },
      {
        id: "node-2",
        flowId,
        type: "question",
        x: 620,
        y: 200,
        data: {
          type: "question",
          text: "Please leave your contact email so we can reach you:",
          variable: "contact_email",
          inputType: "Email"
        }
      },
      {
        id: "node-thanks",
        flowId,
        type: "message",
        x: 1100,
        y: 150,
        data: { label: "End Flow" }
      }
    );

    edges.push(
      { id: "e-start-1", flowId, source: "node-start", target: "node-1" },
      { id: "e-1-2", flowId, source: "node-1", target: "node-2" },
      { id: "e-2-thanks", flowId, source: "node-2", target: "node-thanks" },
      { id: "e-thanks-end", flowId, source: "node-thanks", target: "node-end" }
    );
  }

  return { nodes, edges };
}

// Read/write functions
function getSandboxData(): SandboxSchema {
  if (!fs.existsSync(DB_FILE_PATH)) {
    // Generate initial sandbox data
    const initialData: SandboxSchema = {
      users: [
        {
          id: "usr-admin",
          email: "admin@chatbot.com",
          name: "Admin User",
          password: "adminpassword123", // Simple plain password for mock login
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ],
      plans: [
        { id: "free", name: "Free Sandbox", price: 0, features: ["1 Chatbot", "100 Chats/mo", "Basic Analytics"] },
        { id: "pro", name: "Pro Builder", price: 29, features: ["Unlimited Chatbots", "5000 Chats/mo", "Advanced Analytics", "Remove Branding", "Excel Export"] },
        { id: "enterprise", name: "Enterprise Custom", price: 99, features: ["Unlimited Everything", "Priority Support", "Dedicated Live Agent Routing", "Whitelabel Widget"] }
      ],
      subscriptions: [
        {
          id: "sub-1",
          userId: "usr-admin",
          planId: "pro",
          status: "active",
          currentPeriodStart: new Date().toISOString(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        }
      ],
      bots: [],
      flows: [],
      widgetSettings: [],
      conversations: [],
      messages: [],
      leads: [],
      analytics: [],
      agents: [],
      roles: [
        { id: "role-super-admin", name: "Super Admin", description: "Full platform permissions bypass", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: "role-admin", name: "Admin", description: "Default organization admin", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: "role-staff", name: "Staff", description: "Standard workspace staff", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: "role-agent", name: "Agent", description: "Live chat agent", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
      ],
      modules: [
        { id: "mod-dashboard", name: "Dashboard", slug: "/dashboard", icon: "LayoutDashboard", sortOrder: 0, isActive: true },
        { id: "mod-bots", name: "Bots", slug: "/dashboard/bots", icon: "Bot", sortOrder: 1, isActive: true },
        { id: "mod-inbox", name: "Live Chat", slug: "/dashboard/inbox", icon: "MessageSquare", sortOrder: 2, isActive: true },
        { id: "mod-templates", name: "Templates", slug: "/dashboard/templates", icon: "FileCode", sortOrder: 3, isActive: true },
        { id: "mod-leads", name: "Leads", slug: "/dashboard/leads", icon: "Users", sortOrder: 4, isActive: true },
        { id: "mod-analytics", name: "Analytics", slug: "/dashboard/analytics", icon: "BarChart2", sortOrder: 5, isActive: true },
        { id: "mod-billing", name: "Billing", slug: "/dashboard/billing", icon: "CreditCard", sortOrder: 6, isActive: true },
        { id: "mod-settings", name: "Settings", slug: "/dashboard/settings", icon: "Settings", sortOrder: 7, isActive: true },
        { id: "mod-users", name: "Users", slug: "/dashboard/users", icon: "Users", sortOrder: 8, isActive: true },
        { id: "mod-departments", name: "Departments", slug: "/dashboard/departments", icon: "Building", sortOrder: 9, isActive: true },
        { id: "mod-roles", name: "Roles", slug: "/dashboard/roles", icon: "Shield", sortOrder: 10, isActive: true },
        { id: "mod-permissions", name: "Permissions", slug: "/dashboard/permissions", icon: "KeyRound", sortOrder: 11, isActive: true }
      ],
      rolePermissions: [
        { id: "rp-0", roleId: "role-admin", moduleId: "mod-dashboard", canView: true, canAdd: true, canEdit: true, canDelete: true },
        { id: "rp-1", roleId: "role-admin", moduleId: "mod-bots", canView: true, canAdd: true, canEdit: true, canDelete: true },
        { id: "rp-2", roleId: "role-admin", moduleId: "mod-inbox", canView: true, canAdd: true, canEdit: true, canDelete: true },
        { id: "rp-3", roleId: "role-admin", moduleId: "mod-users", canView: true, canAdd: true, canEdit: true, canDelete: true },
        { id: "rp-4", roleId: "role-admin", moduleId: "mod-templates", canView: true, canAdd: true, canEdit: true, canDelete: true },
        { id: "rp-5", roleId: "role-admin", moduleId: "mod-leads", canView: true, canAdd: true, canEdit: true, canDelete: true },
        { id: "rp-6", roleId: "role-admin", moduleId: "mod-analytics", canView: true, canAdd: true, canEdit: true, canDelete: true },
        { id: "rp-7", roleId: "role-admin", moduleId: "mod-billing", canView: true, canAdd: true, canEdit: true, canDelete: true },
        { id: "rp-8", roleId: "role-admin", moduleId: "mod-settings", canView: true, canAdd: true, canEdit: true, canDelete: true },
        { id: "rp-9", roleId: "role-admin", moduleId: "mod-roles", canView: true, canAdd: true, canEdit: true, canDelete: true },
        { id: "rp-10", roleId: "role-admin", moduleId: "mod-permissions", canView: true, canAdd: true, canEdit: true, canDelete: true },
        { id: "rp-11", roleId: "role-agent", moduleId: "mod-inbox", canView: true, canAdd: true, canEdit: true, canDelete: true },
        { id: "rp-12", roleId: "role-admin", moduleId: "mod-departments", canView: true, canAdd: true, canEdit: true, canDelete: true }
      ],
      departments: [
        { id: "dept-general", accountId: "acc-super-admin", name: "General Support", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: "dept-sales", accountId: "acc-super-admin", name: "Sales", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: "dept-billing", accountId: "acc-super-admin", name: "Billing", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: "dept-tech", accountId: "acc-super-admin", name: "Technical Support", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
      ],
      auditLogs: []
    };

    // Save initial data
    const dir = path.dirname(DB_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DB_FILE_PATH, JSON.stringify(initialData, null, 2), "utf8");
    return initialData;
  }

  try {
    const raw = fs.readFileSync(DB_FILE_PATH, "utf8");
    const parsed = JSON.parse(raw);
    let changed = false;
    if (!parsed.agents) {
      parsed.agents = [];
      changed = true;
    }
    if (!parsed.departments) {
      parsed.departments = [
        { id: "dept-general", accountId: "acc-super-admin", name: "General Support", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: "dept-sales", accountId: "acc-super-admin", name: "Sales", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: "dept-billing", accountId: "acc-super-admin", name: "Billing", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: "dept-tech", accountId: "acc-super-admin", name: "Technical Support", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
      ];
      changed = true;
    }
    if (!parsed.roles || parsed.roles.length === 0) {
      parsed.roles = [
        { id: "role-super-admin", name: "Super Admin", description: "Full platform permissions bypass", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: "role-admin", name: "Admin", description: "Default organization admin", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: "role-staff", name: "Staff", description: "Standard workspace staff", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: "role-agent", name: "Agent", description: "Live chat agent", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
      ];
      changed = true;
    }
    if (!parsed.modules || parsed.modules.length === 0) {
      parsed.modules = [
        { id: "mod-dashboard", name: "Dashboard", slug: "/dashboard", icon: "LayoutDashboard", sortOrder: 0, isActive: true },
        { id: "mod-bots", name: "Bots", slug: "/dashboard/bots", icon: "Bot", sortOrder: 1, isActive: true },
        { id: "mod-inbox", name: "Live Chat", slug: "/dashboard/inbox", icon: "MessageSquare", sortOrder: 2, isActive: true },
        { id: "mod-templates", name: "Templates", slug: "/dashboard/templates", icon: "FileCode", sortOrder: 3, isActive: true },
        { id: "mod-leads", name: "Leads", slug: "/dashboard/leads", icon: "Users", sortOrder: 4, isActive: true },
        { id: "mod-analytics", name: "Analytics", slug: "/dashboard/analytics", icon: "BarChart2", sortOrder: 5, isActive: true },
        { id: "mod-billing", name: "Billing", slug: "/dashboard/billing", icon: "CreditCard", sortOrder: 6, isActive: true },
        { id: "mod-settings", name: "Settings", slug: "/dashboard/settings", icon: "Settings", sortOrder: 7, isActive: true },
        { id: "mod-users", name: "Users", slug: "/dashboard/users", icon: "Users", sortOrder: 8, isActive: true },
        { id: "mod-departments", name: "Departments", slug: "/dashboard/departments", icon: "Building", sortOrder: 9, isActive: true },
        { id: "mod-roles", name: "Roles", slug: "/dashboard/roles", icon: "Shield", sortOrder: 10, isActive: true },
        { id: "mod-permissions", name: "Permissions", slug: "/dashboard/permissions", icon: "KeyRound", sortOrder: 11, isActive: true }
      ];
      changed = true;
    }
    if (!parsed.rolePermissions || parsed.rolePermissions.length === 0) {
      parsed.rolePermissions = [
        { id: "rp-0", roleId: "role-admin", moduleId: "mod-dashboard", canView: true, canAdd: true, canEdit: true, canDelete: true },
        { id: "rp-1", roleId: "role-admin", moduleId: "mod-bots", canView: true, canAdd: true, canEdit: true, canDelete: true },
        { id: "rp-2", roleId: "role-admin", moduleId: "mod-inbox", canView: true, canAdd: true, canEdit: true, canDelete: true },
        { id: "rp-3", roleId: "role-admin", moduleId: "mod-users", canView: true, canAdd: true, canEdit: true, canDelete: true },
        { id: "rp-4", roleId: "role-admin", moduleId: "mod-templates", canView: true, canAdd: true, canEdit: true, canDelete: true },
        { id: "rp-5", roleId: "role-admin", moduleId: "mod-leads", canView: true, canAdd: true, canEdit: true, canDelete: true },
        { id: "rp-6", roleId: "role-admin", moduleId: "mod-analytics", canView: true, canAdd: true, canEdit: true, canDelete: true },
        { id: "rp-7", roleId: "role-admin", moduleId: "mod-billing", canView: true, canAdd: true, canEdit: true, canDelete: true },
        { id: "rp-8", roleId: "role-admin", moduleId: "mod-settings", canView: true, canAdd: true, canEdit: true, canDelete: true },
        { id: "rp-9", roleId: "role-admin", moduleId: "mod-roles", canView: true, canAdd: true, canEdit: true, canDelete: true },
        { id: "rp-10", roleId: "role-admin", moduleId: "mod-permissions", canView: true, canAdd: true, canEdit: true, canDelete: true },
        { id: "rp-11", roleId: "role-agent", moduleId: "mod-inbox", canView: true, canAdd: true, canEdit: true, canDelete: true },
        { id: "rp-12", roleId: "role-admin", moduleId: "mod-departments", canView: true, canAdd: true, canEdit: true, canDelete: true }
      ];
      changed = true;
    }

    // Migrate existing db-sandbox.json if any new sidebar settings are missing
    if (parsed.modules) {
      const correctSortOrders: Record<string, number> = {
        "mod-dashboard": 0,
        "mod-bots": 1,
        "mod-inbox": 2,
        "mod-templates": 3,
        "mod-leads": 4,
        "mod-analytics": 5,
        "mod-billing": 6,
        "mod-settings": 7,
        "mod-users": 8,
        "mod-departments": 9,
        "mod-roles": 10,
        "mod-permissions": 11
      };

      let isMigrated = false;

      // Remove Team and Super Admin modules if present
      const origLen = parsed.modules.length;
      parsed.modules = parsed.modules.filter((m: any) => m.id !== "mod-team" && m.id !== "mod-super-admin" && m.slug !== "/dashboard/team" && m.slug !== "/dashboard/super-admin");
      if (parsed.modules.length !== origLen) {
        isMigrated = true;
      }

      // Add mod-dashboard
      if (!parsed.modules.some((m: any) => m.id === "mod-dashboard")) {
        parsed.modules.push({ id: "mod-dashboard", name: "Dashboard", slug: "/dashboard", icon: "LayoutDashboard", sortOrder: 0, isActive: true });
        isMigrated = true;
      }

      // Add mod-users
      if (!parsed.modules.some((m: any) => m.id === "mod-users")) {
        parsed.modules.push({ id: "mod-users", name: "Users", slug: "/dashboard/users", icon: "Users", sortOrder: 8, isActive: true });
        isMigrated = true;
      }

      // Add mod-departments
      if (!parsed.modules.some((m: any) => m.id === "mod-departments")) {
        parsed.modules.push({ id: "mod-departments", name: "Departments", slug: "/dashboard/departments", icon: "Building", sortOrder: 9, isActive: true });
        isMigrated = true;
      }

      // Add mod-roles or update its slug
      const existingRolesMod = parsed.modules.find((m: any) => m.id === "mod-roles");
      if (!existingRolesMod) {
        parsed.modules.push({ id: "mod-roles", name: "Roles", slug: "/dashboard/roles", icon: "Shield", sortOrder: 10, isActive: true });
        isMigrated = true;
      } else if (existingRolesMod.slug !== "/dashboard/roles" || existingRolesMod.sortOrder !== 10) {
        existingRolesMod.slug = "/dashboard/roles";
        existingRolesMod.sortOrder = 10;
        isMigrated = true;
      }

      // Add mod-permissions
      if (!parsed.modules.some((m: any) => m.id === "mod-permissions")) {
        parsed.modules.push({ id: "mod-permissions", name: "Permissions", slug: "/dashboard/permissions", icon: "KeyRound", sortOrder: 11, isActive: true });
        isMigrated = true;
      }

      // Update sort orders for all modules to ensure they align perfectly
      parsed.modules.forEach((m: any) => {
        const targetOrder = correctSortOrders[m.id];
        if (targetOrder !== undefined && m.sortOrder !== targetOrder) {
          m.sortOrder = targetOrder;
          isMigrated = true;
        }
      });

      if (isMigrated) {
        parsed.modules.sort((a: any, b: any) => a.sortOrder - b.sortOrder);

        if (parsed.rolePermissions) {
          parsed.rolePermissions = parsed.rolePermissions.filter((rp: any) => rp.moduleId !== "mod-team" && rp.moduleId !== "mod-super-admin");
          const adminModules = ["mod-dashboard", "mod-users", "mod-roles", "mod-permissions", "mod-departments"];
          adminModules.forEach((mId) => {
            if (!parsed.rolePermissions.some((rp: any) => rp.roleId === "role-admin" && rp.moduleId === mId)) {
              parsed.rolePermissions.push({
                id: `rp-mig-${mId}-${Math.random().toString(36).substr(2, 5)}`,
                roleId: "role-admin",
                moduleId: mId,
                canView: true,
                canAdd: true,
                canEdit: true,
                canDelete: true
              });
            }
          });
        }
        changed = true;
      }
    }

    if (!parsed.auditLogs) {
      parsed.auditLogs = [];
      changed = true;
    }
    if (changed) {
      saveSandboxData(parsed);
    }
    return parsed;
  } catch (e) {
    console.error("Failed to read sandbox database, returning empty schema.", e);
    return {
      users: [],
      plans: [],
      subscriptions: [],
      bots: [],
      flows: [],
      widgetSettings: [],
      conversations: [],
      messages: [],
      leads: [],
      analytics: [],
      agents: [],
      roles: [],
      modules: [],
      rolePermissions: [],
      auditLogs: []
    };
  }
}

function saveSandboxData(data: SandboxSchema) {
  try {
    const dir = path.dirname(DB_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DB_FILE_PATH, JSON.stringify(data, null, 2), "utf8");
  } catch (e) {
    console.error("Failed to write to sandbox database", e);
  }
}

export const sandboxDb = {
  // USER METHODS
  users: {
    findUnique: (email: string) => {
      const db = getSandboxData();
      return db.users.find((u) => u.email.toLowerCase() === email.toLowerCase()) || null;
    },
    create: (email: string, name?: string, password?: string) => {
      const db = getSandboxData();
      const newUser: SandboxUser = {
        id: `usr-${Math.random().toString(36).substr(2, 9)}`,
        email,
        name,
        password,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      db.users.push(newUser);
      // Give them a default subscription
      db.subscriptions.push({
        id: `sub-${Math.random().toString(36).substr(2, 9)}`,
        userId: newUser.id,
        planId: "free",
        status: "active",
        currentPeriodStart: new Date().toISOString(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      });
      saveSandboxData(db);
      return newUser;
    }
  },

  // BOT METHODS
  bots: {
    findMany: (userId: string) => {
      const db = getSandboxData();
      const userBots = db.bots.filter((b) => b.userId === userId);
      let changed = false;
      userBots.forEach((b, idx) => {
        if (b.isActive === undefined) {
          b.isActive = idx === 0;
          changed = true;
        }
      });
      if (changed) {
        saveSandboxData(db);
      }
      return userBots;
    },
    findUnique: (id: string) => {
      const db = getSandboxData();
      return db.bots.find((b) => b.id === id) || null;
    },
    create: (userId: string, name: string, avatarUrl?: string, welcomeMessage?: string) => {
      const db = getSandboxData();
      const existingBots = db.bots.filter(b => b.userId === userId);
      const newBot: SandboxBot = {
        id: `bot-${Math.random().toString(36).substr(2, 9)}`,
        userId,
        accountId: "acc-super-admin",
        name,
        avatarUrl: avatarUrl || "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=80&auto=format&fit=crop&q=60",
        welcomeMessage: welcomeMessage || "Hello! Let me know if I can help you today.",
        isActive: existingBots.length === 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      db.bots.push(newBot);

      // Create empty flow
      const flowId = `flow-${Math.random().toString(36).substr(2, 9)}`;
      db.flows.push({
        id: flowId,
        botId: newBot.id,
        name: "Main Flow",
        isMain: true,
        nodes: [
          { id: "node-start", type: "start", position: { x: 100, y: 150 }, data: { label: "Start Flow" } },
          { id: "node-welcome", type: "message", position: { x: 350, y: 150 }, data: { text: welcomeMessage || "Hello! Let me know if I can help you today." } }
        ],
        edges: [
          { id: `e-start-welcome`, source: "node-start", target: "node-welcome" }
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      // Create default widget settings
      db.widgetSettings.push({
        id: `ws-${Math.random().toString(36).substr(2, 9)}`,
        botId: newBot.id,
        widgetColor: "#4f46e5",
        headerColor: "#4f46e5",
        position: "bottom-right",
        bubbleStyle: "round",
        font: "Inter",
        borderRadius: 16,
        launcherIcon: "",
        launcherBgTransparent: false,
        launcherIconSize: 28,
        headerTextColor: "#FFFFFF",
        leftMessageBgColor: "#F1F5F9",
        leftMessageTextColor: "#0F172A",
        rightMessageBgColor: "#4F46E5",
        rightMessageTextColor: "#FFFFFF",
        widgetBgColor: "#FFFFFF",
        launcherGreeting: "Hi! Need help? 👋",
        launcherGreetingEnabled: true,
        launcherAnimation: "bounce"
      });

      saveSandboxData(db);
      return newBot;
    },
    update: (id: string, updates: Partial<SandboxBot>) => {
      const db = getSandboxData();
      const idx = db.bots.findIndex((b) => b.id === id);
      if (idx !== -1) {
        db.bots[idx] = { ...db.bots[idx], ...updates, updatedAt: new Date().toISOString() };
        saveSandboxData(db);
        return db.bots[idx];
      }
      return null;
    },
    setActive: (userId: string, botId: string) => {
      const db = getSandboxData();
      db.bots.forEach((b) => {
        if (b.userId === userId) {
          b.isActive = b.id === botId;
        }
      });
      saveSandboxData(db);
      return true;
    },
    delete: (id: string) => {
      const db = getSandboxData();
      db.bots = db.bots.filter((b) => b.id !== id);
      db.flows = db.flows.filter((f) => f.botId !== id);
      db.widgetSettings = db.widgetSettings.filter((ws) => ws.botId !== id);
      db.leads = db.leads.filter((l) => l.botId !== id);
      db.conversations = db.conversations.filter((c) => c.botId !== id);
      db.analytics = db.analytics.filter((a) => a.botId !== id);
      saveSandboxData(db);
      return true;
    }
  },

  // FLOW METHODS
  flows: {
    findMany: (botId: string) => {
      const db = getSandboxData();
      return db.flows.filter((f) => f.botId === botId);
    },
    findUnique: (id: string) => {
      const db = getSandboxData();
      return db.flows.find((f) => f.id === id) || null;
    },
    findMainFlow: (botId: string) => {
      const db = getSandboxData();
      return db.flows.find((f) => f.botId === botId && f.isMain) || db.flows.find((f) => f.botId === botId) || null;
    },
    create: (botId: string, name: string, isMain: boolean = false) => {
      const db = getSandboxData();
      const flowId = `flow-${Math.random().toString(36).substr(2, 9)}`;
      const newFlow: SandboxFlow = {
        id: flowId,
        botId,
        name,
        isMain,
        nodes: [
          { id: "node-start", type: "start", position: { x: 100, y: 150 }, data: { label: "Start Flow" } }
        ],
        edges: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      if (isMain) {
        db.flows.forEach((f) => {
          if (f.botId === botId) f.isMain = false;
        });
      }
      db.flows.push(newFlow);
      saveSandboxData(db);
      return newFlow;
    },
    update: (id: string, updates: Partial<SandboxFlow>) => {
      const db = getSandboxData();
      const idx = db.flows.findIndex((f) => f.id === id);
      if (idx !== -1) {
        if (updates.isMain) {
          const botId = db.flows[idx].botId;
          db.flows.forEach((f) => {
            if (f.botId === botId) f.isMain = false;
          });
        }
        db.flows[idx] = {
          ...db.flows[idx],
          ...updates,
          updatedAt: new Date().toISOString()
        };
        saveSandboxData(db);
        return db.flows[idx];
      }
      return null;
    },
    delete: (id: string) => {
      const db = getSandboxData();
      const flow = db.flows.find((f) => f.id === id);
      if (!flow) return false;
      const botFlows = db.flows.filter((f) => f.botId === flow.botId);
      if (flow.isMain && botFlows.length > 1) {
        const other = botFlows.find((f) => f.id !== id);
        if (other) other.isMain = true;
      }
      db.flows = db.flows.filter((f) => f.id !== id);
      saveSandboxData(db);
      return true;
    },
    applyTemplate: (id: string, templateType: string) => {
      const db = getSandboxData();
      const idx = db.flows.findIndex((f) => f.id === id);
      if (idx !== -1) {
        const temp = getTemplateFlow(id, templateType);
        db.flows[idx].nodes = temp.nodes.map(n => ({
          id: n.id,
          type: n.type,
          position: { x: n.x, y: n.y },
          data: n.data
        }));
        db.flows[idx].edges = temp.edges.map(e => ({
          id: e.id,
          source: e.source,
          target: e.target,
          sourceHandle: e.sourceHandle,
          targetHandle: e.targetHandle
        }));
        db.flows[idx].updatedAt = new Date().toISOString();
        saveSandboxData(db);
        return db.flows[idx];
      }
      return null;
    }
  },

  // WIDGET SETTINGS METHODS
  widgetSettings: {
    findUnique: (botId: string) => {
      const db = getSandboxData();
      return db.widgetSettings.find((ws) => ws.botId === botId) || null;
    },
    update: (botId: string, updates: Partial<SandboxWidgetSettings>) => {
      const db = getSandboxData();
      const idx = db.widgetSettings.findIndex((ws) => ws.botId === botId);
      if (idx !== -1) {
        db.widgetSettings[idx] = { ...db.widgetSettings[idx], ...updates };
        saveSandboxData(db);
        return db.widgetSettings[idx];
      }
      return null;
    }
  },

  // LEAD METHODS
  leads: {
    findMany: (botId?: string) => {
      const db = getSandboxData();
      if (botId) {
        return db.leads.filter((l) => l.botId === botId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      }
      return db.leads.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    },
    create: (botId: string, leadData: Partial<SandboxLead>) => {
      const db = getSandboxData();
      let existingIdx = -1;
      if (leadData.conversationId) {
        existingIdx = db.leads.findIndex(l => l.conversationId === leadData.conversationId);
      }
      if (existingIdx !== -1) {
        db.leads[existingIdx] = {
          ...db.leads[existingIdx],
          ...leadData,
          name: leadData.name || db.leads[existingIdx].name,
          email: leadData.email || db.leads[existingIdx].email,
          mobile: leadData.mobile || db.leads[existingIdx].mobile,
        };
        saveSandboxData(db);
        return db.leads[existingIdx];
      } else {
        const newLead: SandboxLead = {
          id: leadData.id || `lead-${Math.random().toString(36).substr(2, 9)}`,
          botId,
          createdAt: new Date().toISOString(),
          ...leadData
        };
        db.leads.push(newLead);

        // Trigger lead analytics conversion
        db.analytics.push({
          id: `an-lead-conv-${Math.random().toString(36).substr(2, 9)}`,
          botId,
          metric: "lead_conversion",
          value: 1,
          createdAt: new Date().toISOString()
        });

        saveSandboxData(db);
        return newLead;
      }
    }
  },

  // CONVERSATIONS & MESSAGES
  conversations: {
    create: (botId: string, sessionId: string) => {
      const db = getSandboxData();
      const newConv: SandboxConversation = {
        id: `conv-${Math.random().toString(36).substr(2, 9)}`,
        botId,
        sessionId,
        status: "bot",
        visitorName: "Visitor",
        visitorEmail: "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      db.conversations.push(newConv);
      saveSandboxData(db);

      // Track chat start analytics
      db.analytics.push({
        id: `an-chat-start-${Math.random().toString(36).substr(2, 9)}`,
        botId,
        metric: "chat_start",
        value: 1,
        createdAt: new Date().toISOString()
      });
      saveSandboxData(db);

      return newConv;
    },
    findUnique: (id: string) => {
      const db = getSandboxData();
      const conv = db.conversations.find((c) => c.id === id);
      if (!conv) return null;
      const messages = db.messages.filter((m) => m.conversationId === id).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
      return { ...conv, messages };
    },
    findOrCreateBySession: (botId: string, sessionId: string) => {
      const db = getSandboxData();
      let conv = db.conversations.find((c) => c.botId === botId && c.sessionId === sessionId);
      if (!conv) {
        conv = sandboxDb.conversations.create(botId, sessionId);
      }
      return sandboxDb.conversations.findUnique(conv.id);
    },
    addMessage: (conversationId: string, sender: "bot" | "user" | "agent", text: string, payload?: any) => {
      const db = getSandboxData();
      const newMsg: SandboxMessage = {
        id: `m-${Math.random().toString(36).substr(2, 9)}`,
        conversationId,
        sender,
        text,
        payload,
        createdAt: new Date().toISOString()
      };
      db.messages.push(newMsg);
      // Update updatedAt timestamp of the conversation
      const convIdx = db.conversations.findIndex(c => c.id === conversationId);
      if (convIdx !== -1) {
        db.conversations[convIdx].updatedAt = new Date().toISOString();
      }
      saveSandboxData(db);
      return newMsg;
    },
    update: (id: string, updates: Partial<SandboxConversation>) => {
      const db = getSandboxData();
      const idx = db.conversations.findIndex((c) => c.id === id);
      if (idx !== -1) {
        db.conversations[idx] = {
          ...db.conversations[idx],
          ...updates,
          updatedAt: new Date().toISOString()
        };
        saveSandboxData(db);
        return db.conversations[idx];
      }
      return null;
    },
    findMany: (botId?: string) => {
      const db = getSandboxData();
      if (botId) {
        return db.conversations.filter((c) => c.botId === botId).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
      }
      return db.conversations.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    },
    updateVariables: (id: string, newVariables: Record<string, any>) => {
      const db = getSandboxData();
      const conv = db.conversations.find((c) => c.id === id);
      if (conv) {
        conv.variables = { ...(conv.variables || {}), ...newVariables };
        // Check if variables contain visitorName or visitorEmail and sync them
        if (newVariables.visitor_name) conv.visitorName = newVariables.visitor_name;
        if (newVariables.visitor_email) conv.visitorEmail = newVariables.visitor_email;
        if (newVariables.name) conv.visitorName = newVariables.name;
        if (newVariables.email) conv.visitorEmail = newVariables.email;
        conv.updatedAt = new Date().toISOString();
        saveSandboxData(db);
        return conv;
      }
      return null;
    }
  },

  // ANALYTICS METHODS
  analytics: {
    track: (botId: string, metric: string, value: number = 1, metadata?: any) => {
      const db = getSandboxData();
      const newAnalytics: SandboxAnalytics = {
        id: `an-${Math.random().toString(36).substr(2, 9)}`,
        botId,
        metric,
        value,
        metadata,
        createdAt: new Date().toISOString()
      };
      db.analytics.push(newAnalytics);
      saveSandboxData(db);
      return newAnalytics;
    },
    getSummary: (botId: string, periodDays: number = 30) => {
      const db = getSandboxData();
      const cutoff = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000).toISOString();
      const records = db.analytics.filter((a) => a.botId === botId && a.createdAt >= cutoff);

      // Sum metrics
      let visitors = 0;
      let chats = 0;
      let leads = 0;

      records.forEach((r) => {
        if (r.metric === "visitor") visitors += r.value;
        if (r.metric === "chat_start") chats += r.value;
        if (r.metric === "lead_conversion") leads += r.value;
      });

      // Daily analytics array for plotting charts
      const dailyMap: { [date: string]: { date: string; visitors: number; chats: number; leads: number } } = {};

      // Seed the map with empty values for each day in range
      for (let i = periodDays - 1; i >= 0; i--) {
        const dStr = new Date(Date.now() - i * 24 * 60 * 60 * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric" });
        dailyMap[dStr] = { date: dStr, visitors: 0, chats: 0, leads: 0 };
      }

      records.forEach((r) => {
        const dStr = new Date(r.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" });
        if (dailyMap[dStr]) {
          if (r.metric === "visitor") dailyMap[dStr].visitors += r.value;
          if (r.metric === "chat_start") dailyMap[dStr].chats += r.value;
          if (r.metric === "lead_conversion") dailyMap[dStr].leads += r.value;
        }
      });

      const chartData = Object.values(dailyMap);

      // Calculate conversion rates
      const conversionRate = visitors > 0 ? parseFloat(((leads / visitors) * 100).toFixed(1)) : 0;

      // Mock popular flows and drop-offs based on stats
      const popularFlows = [
        { name: "Start Conversation", count: chats, rate: 100 },
        { name: "Quick Reply Select", count: Math.floor(chats * 0.8), rate: 80 },
        { name: "Name captured", count: Math.floor(chats * 0.6), rate: 60 },
        { name: "Email captured", count: Math.floor(chats * 0.45), rate: 45 },
        { name: "Form complete (Lead)", count: leads, rate: Math.floor(conversionRate) }
      ];

      const dropOffPoints = [
        { stage: "Welcome Message", drops: Math.floor(chats * 0.2) },
        { stage: "Quick Reply Choice", drops: Math.floor(chats * 0.2) },
        { stage: "Name Field Input", drops: Math.floor(chats * 0.15) },
        { stage: "Email Field Input", drops: Math.floor(chats * 0.1) }
      ];

      return {
        visitors,
        chats,
        leads,
        conversionRate,
        chartData,
        popularFlows,
        dropOffPoints
      };
    }
  },

  // AGENT METHODS
  agents: {
    findMany: (userId: string) => {
      const db = getSandboxData();
      return db.agents.filter((a) => a.userId === userId);
    },
    findUnique: (id: string) => {
      const db = getSandboxData();
      return db.agents.find((a) => a.id === id) || null;
    },
    create: (userId: string, name: string, email: string, password?: string, department?: string, role?: string, permissions?: string[]) => {
      const db = getSandboxData();
      const newAgent: SandboxAgent = {
        id: `agt-${Math.random().toString(36).substr(2, 9)}`,
        userId,
        accountId: "acc-super-admin",
        name,
        email,
        password: password || undefined,
        role: role || "agent",
        permissions: permissions || ["bots:view", "conversations:view", "leads:view"],
        department: department || undefined,
        agentStatus: "offline",
        schedule: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      db.agents.push(newAgent);
      saveSandboxData(db);
      return newAgent;
    },
    update: (id: string, data: { name?: string; email?: string; password?: string; department?: string; agentStatus?: string; schedule?: any }) => {
      const db = getSandboxData();
      const agent = db.agents.find((a) => a.id === id);
      if (agent) {
        if (data.name !== undefined) agent.name = data.name;
        if (data.email !== undefined) agent.email = data.email;
        if (data.password !== undefined) agent.password = data.password;
        if (data.department !== undefined) agent.department = data.department;
        if (data.agentStatus !== undefined) agent.agentStatus = data.agentStatus;
        if (data.schedule !== undefined) agent.schedule = data.schedule;
        agent.updatedAt = new Date().toISOString();
        saveSandboxData(db);
        return agent;
      }
      return null;
    },
    delete: (id: string) => {
      const db = getSandboxData();
      const idx = db.agents.findIndex((a) => a.id === id);
      if (idx !== -1) {
        const deleted = db.agents.splice(idx, 1)[0];
        saveSandboxData(db);
        return deleted;
      }
      return null;
    }
  },
  roles: {
    findMany: () => {
      const db = getSandboxData();
      return db.roles || [];
    },
    findUnique: (id: string) => {
      const db = getSandboxData();
      return db.roles?.find((r) => r.id === id || r.name.toLowerCase() === id.toLowerCase()) || null;
    },
    create: (name: string, description?: string) => {
      const db = getSandboxData();
      if (!db.roles) db.roles = [];
      const existing = db.roles.find(r => r.name.toLowerCase() === name.toLowerCase());
      if (existing) {
        throw new Error(`A role with the name "${name}" already exists.`);
      }
      const newRole: SandboxRole = {
        id: `role-${Math.random().toString(36).substr(2, 9)}`,
        name,
        description,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      db.roles.push(newRole);
      saveSandboxData(db);
      return newRole;
    },
    update: (id: string, updates: { name: string; description?: string }) => {
      const db = getSandboxData();
      if (!db.roles) db.roles = [];
      const idx = db.roles.findIndex((r) => r.id === id);
      if (idx !== -1) {
        const existing = db.roles.find(r => r.id !== id && r.name.toLowerCase() === updates.name.toLowerCase());
        if (existing) {
          throw new Error(`Another role with the name "${updates.name}" already exists.`);
        }
        db.roles[idx] = { ...db.roles[idx], ...updates, updatedAt: new Date().toISOString() };
        saveSandboxData(db);
        return db.roles[idx];
      }
      return null;
    },
    delete: (id: string) => {
      const db = getSandboxData();
      if (!db.roles) db.roles = [];
      const role = db.roles.find((r) => r.id === id);
      if (role && ["Super Admin", "Admin", "Staff", "Agent"].includes(role.name)) {
        throw new Error("Default system roles cannot be deleted.");
      }
      db.roles = db.roles.filter((r) => r.id !== id);
      if (db.rolePermissions) {
        db.rolePermissions = db.rolePermissions.filter((rp) => rp.roleId !== id);
      }
      saveSandboxData(db);
      return true;
    }
  },
  modules: {
    findMany: () => {
      const db = getSandboxData();
      return db.modules || [];
    },
    findUnique: (id: string) => {
      const db = getSandboxData();
      return db.modules?.find((m) => m.id === id || m.slug === id) || null;
    }
  },
  rolePermissions: {
    findMany: (roleId?: string) => {
      const db = getSandboxData();
      if (roleId) {
        return db.rolePermissions?.filter((rp) => rp.roleId === roleId) || [];
      }
      return db.rolePermissions || [];
    },
    createMany: (permissions: Omit<SandboxRolePermission, "id">[]) => {
      const db = getSandboxData();
      if (!db.rolePermissions) db.rolePermissions = [];
      const newPermissions = permissions.map(p => ({
        id: `rp-${Math.random().toString(36).substr(2, 9)}`,
        ...p
      }));
      db.rolePermissions.push(...newPermissions);
      saveSandboxData(db);
      return newPermissions;
    },
    deleteManyByRoleId: (roleId: string) => {
      const db = getSandboxData();
      if (!db.rolePermissions) return;
      db.rolePermissions = db.rolePermissions.filter((rp) => rp.roleId !== roleId);
      saveSandboxData(db);
    },
    updateRolePermissions: (roleId: string, permissions: { moduleId: string; canView: boolean; canAdd: boolean; canEdit: boolean; canDelete: boolean }[]) => {
      const db = getSandboxData();
      if (!db.rolePermissions) db.rolePermissions = [];
      db.rolePermissions = db.rolePermissions.filter(rp => rp.roleId !== roleId);
      const newPermissions = permissions.map(p => ({
        id: `rp-${Math.random().toString(36).substr(2, 9)}`,
        roleId,
        ...p
      }));
      db.rolePermissions.push(...newPermissions);
      saveSandboxData(db);
      return true;
    }
  },
  departments: {
    findMany: (accountId: string) => {
      const db = getSandboxData();
      return (db.departments || []).filter((d) => d.accountId === accountId);
    },
    create: (accountId: string, name: string) => {
      const db = getSandboxData();
      if (!db.departments) db.departments = [];
      const newDept: SandboxDepartment = {
        id: `dept-${Math.random().toString(36).substr(2, 9)}`,
        accountId,
        name,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      db.departments.push(newDept);
      saveSandboxData(db);
      return newDept;
    },
    update: (accountId: string, id: string, name: string) => {
      const db = getSandboxData();
      if (!db.departments) db.departments = [];
      const idx = db.departments.findIndex((d) => d.id === id && d.accountId === accountId);
      if (idx !== -1) {
        db.departments[idx].name = name;
        db.departments[idx].updatedAt = new Date().toISOString();
        saveSandboxData(db);
        return db.departments[idx];
      }
      return null;
    },
    delete: (accountId: string, id: string) => {
      const db = getSandboxData();
      if (!db.departments) db.departments = [];
      
      // Find the department to check its name for compat mappings
      const dept = db.departments.find((d) => d.id === id && d.accountId === accountId);
      const deptName = dept?.name;

      db.departments = db.departments.filter((d) => !(d.id === id && d.accountId === accountId));

      // Also dissociate from agents/conversations in sandbox
      db.agents.forEach(agent => {
        if (agent.accountId === accountId) {
          if (agent.departmentId === id || (deptName && agent.department === deptName)) {
            agent.departmentId = undefined;
            agent.department = undefined;
          }
        }
      });
      db.conversations.forEach(c => {
        if (c.accountId === accountId) {
          if (c.departmentId === id || (deptName && c.department === deptName)) {
            c.departmentId = undefined;
            c.department = undefined;
          }
        }
      });

      saveSandboxData(db);
      return true;
    }
  },
  getSandboxData,
  saveSandboxData
};
