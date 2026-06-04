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
  sessionId: string;
  variables?: Record<string, any>;
  createdAt: string;
}

export interface SandboxMessage {
  id: string;
  conversationId: string;
  sender: "bot" | "user";
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
}

// Default helper to generate template flows
function getTemplateFlow(flowId: string, templateType: string): { nodes: any[]; edges: any[] } {
  const nodes: any[] = [
    {
      id: "node-start",
      flowId,
      type: "start",
      x: 100,
      y: 150,
      data: { label: "Start Flow" }
    }
  ];
  const edges: any[] = [];

  if (templateType === "lead_gen") {
    nodes.push(
      {
        id: "node-1",
        flowId,
        type: "message",
        x: 350,
        y: 150,
        data: { text: "Hello! Welcome to ChetBot. We'd love to help you grow your business. Can we ask a few quick questions?" }
      },
      {
        id: "node-2",
        flowId,
        type: "quick_reply",
        x: 600,
        y: 150,
        data: {
          text: "Are you ready to start?",
          options: ["Yes, let's go!", "Maybe later"]
        }
      },
      {
        id: "node-name",
        flowId,
        type: "name_input",
        x: 850,
        y: 50,
        data: { text: "Awesome! What's your name?", variable: "visitor_name" }
      },
      {
        id: "node-email",
        flowId,
        type: "email_input",
        x: 1100,
        y: 50,
        data: { text: "Nice to meet you, {{visitor_name}}! What's your best email address?", variable: "visitor_email" }
      },
      {
        id: "node-phone",
        flowId,
        type: "phone_input",
        x: 1350,
        y: 50,
        data: { text: "Thanks! And what is your phone number?", variable: "visitor_phone" }
      },
      {
        id: "node-success",
        flowId,
        type: "message",
        x: 1600,
        y: 150,
        data: { text: "Thank you! Our team will reach out to you shortly." }
      },
      {
        id: "node-later",
        flowId,
        type: "message",
        x: 850,
        y: 350,
        data: { text: "No worries! If you change your mind, we'll be right here. Have a great day!" }
      },
      {
        id: "node-end",
        flowId,
        type: "end",
        x: 1850,
        y: 150,
        data: { label: "End Flow" }
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
        x: 350,
        y: 150,
        data: { text: "Hi there! I am your Support Assistant. How can I help you today?" }
      },
      {
        id: "node-2",
        flowId,
        type: "button",
        x: 600,
        y: 150,
        data: {
          text: "Please select an issue type:",
          options: ["Technical Issues", "Billing & Pricing", "General Inquiry"]
        }
      },
      {
        id: "node-tech",
        flowId,
        type: "message",
        x: 850,
        y: 50,
        data: { text: "For technical issues, please check our status page at status.chetbot.com. Alternatively, you can describe your issue below." }
      },
      {
        id: "node-tech-input",
        flowId,
        type: "form",
        x: 1100,
        y: 50,
        data: { text: "Please enter your issue details:", fields: [{ label: "Description", type: "textarea", variable: "tech_desc" }] }
      },
      {
        id: "node-billing",
        flowId,
        type: "message",
        x: 850,
        y: 250,
        data: { text: "For billing support, you can view your invoices in the Billing tab of your dashboard, or ask a question here." }
      },
      {
        id: "node-billing-input",
        flowId,
        type: "email_input",
        x: 1100,
        y: 250,
        data: { text: "Please enter your registered email address:", variable: "billing_email" }
      },
      {
        id: "node-general",
        flowId,
        type: "message",
        x: 850,
        y: 450,
        data: { text: "Sure! What is your general question?" }
      },
      {
        id: "node-general-input",
        flowId,
        type: "form",
        x: 1100,
        y: 450,
        data: { text: "Enter your question:", fields: [{ label: "Question", type: "text", variable: "gen_question" }] }
      },
      {
        id: "node-agent",
        flowId,
        type: "live_agent",
        x: 1400,
        y: 250,
        data: { text: "Connecting you with a support representative. Please stand by...", queue: "support-general" }
      },
      {
        id: "node-end",
        flowId,
        type: "end",
        x: 1650,
        y: 250,
        data: { label: "End Chat" }
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
  } else {
    // Default fallback simple flow
    nodes.push(
      {
        id: "node-1",
        flowId,
        type: "message",
        x: 350,
        y: 150,
        data: { text: "Hello! Welcome to our site. How can I help you today?" }
      },
      {
        id: "node-2",
        flowId,
        type: "form",
        x: 600,
        y: 150,
        data: {
          text: "Please leave your contact info so we can reach you:",
          fields: [
            { label: "Name", type: "text", variable: "contact_name" },
            { label: "Email", type: "email", variable: "contact_email" }
          ]
        }
      },
      {
        id: "node-thanks",
        flowId,
        type: "message",
        x: 850,
        y: 150,
        data: { text: "Thanks, we will get in touch!" }
      },
      {
        id: "node-end",
        flowId,
        type: "end",
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
          email: "admin@chetbot.com",
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
      analytics: []
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
    return JSON.parse(raw);
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
      analytics: []
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
        return db.leads.filter((l) => l.botId === botId).sort((a,b) => b.createdAt.localeCompare(a.createdAt));
      }
      return db.leads.sort((a,b) => b.createdAt.localeCompare(a.createdAt));
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
        createdAt: new Date().toISOString()
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
      const messages = db.messages.filter((m) => m.conversationId === id).sort((a,b) => a.createdAt.localeCompare(b.createdAt));
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
    addMessage: (conversationId: string, sender: "bot" | "user", text: string, payload?: any) => {
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
      saveSandboxData(db);
      return newMsg;
    },
    updateVariables: (id: string, newVariables: Record<string, any>) => {
      const db = getSandboxData();
      const conv = db.conversations.find((c) => c.id === id);
      if (conv) {
        conv.variables = { ...(conv.variables || {}), ...newVariables };
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
  }
};
