import { prisma, checkDbConnection } from "./db";
import { sandboxDb } from "./sandboxDb";
import fs from "fs";
import path from "path";

// Keep track of database state
let isDbOnline = false;
let hasCheckedDb = false;

async function ensureDbStatus() {
  if (!hasCheckedDb) {
    isDbOnline = await checkDbConnection();
    hasCheckedDb = true;
    if (isDbOnline) {
      try {
        const adminExists = await prisma.user.findUnique({ where: { email: "admin@chetbot.com" } });
        if (!adminExists) {
          await prisma.user.create({
            data: {
              id: "usr-admin",
              email: "admin@chetbot.com",
              name: "Admin User",
              password: "adminpassword123",
            }
          });
          const planCount = await prisma.plan.count();
          if (planCount === 0) {
            await prisma.plan.createMany({
              data: [
                { id: "free", name: "Free Sandbox", price: 0, features: ["1 Chatbot", "100 Chats/mo", "Basic Analytics"] },
                { id: "pro", name: "Pro Builder", price: 29, features: ["Unlimited Chatbots", "5000 Chats/mo", "Advanced Analytics", "Remove Branding", "Excel Export"] },
                { id: "enterprise", name: "Enterprise Custom", price: 99, features: ["Unlimited Everything", "Priority Support", "Dedicated Live Agent Routing", "Whitelabel Widget"] }
              ]
            });
          }
          await prisma.subscription.create({
            data: {
              id: "sub-1",
              userId: "usr-admin",
              planId: "pro",
              status: "active",
              currentPeriodStart: new Date(),
              currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            }
          });
          console.log("MySQL default admin user and plans seeded successfully.");
        }
      } catch (err) {
        console.error("Failed to seed MySQL admin:", err);
      }
    }
  }
  return isDbOnline;
}

export const dbService = {
  // Check if running in sandbox/mock mode
  async isSandboxMode(): Promise<boolean> {
    const online = await ensureDbStatus();
    return !online;
  },

  // USERS
  async getUserByEmail(email: string) {
    const online = await ensureDbStatus();
    if (online) {
      try {
        return await prisma.user.findUnique({ where: { email } });
      } catch (e) {
        console.error("DB Error - getUserByEmail, falling back to sandbox:", e);
      }
    }
    return sandboxDb.users.findUnique(email);
  },

  async createUser(email: string, name?: string, password?: string) {
    const online = await ensureDbStatus();
    if (online) {
      try {
        const user = await prisma.user.create({
          data: {
            email,
            name,
            password,
            subscriptions: {
              create: {
                planId: "free",
                status: "active",
                currentPeriodStart: new Date(),
                currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
              }
            }
          }
        });
        return user;
      } catch (e) {
        console.error("DB Error - createUser, falling back to sandbox:", e);
      }
    }
    return sandboxDb.users.create(email, name, password);
  },

  // BOTS
  async getBots(userId: string) {
    const online = await ensureDbStatus();
    if (online) {
      try {
        return await prisma.bot.findMany({ where: { userId } });
      } catch (e) {
        console.error("DB Error - getBots, falling back to sandbox:", e);
      }
    }
    return sandboxDb.bots.findMany(userId);
  },

  async getBotById(id: string) {
    const online = await ensureDbStatus();
    if (online) {
      try {
        return await prisma.bot.findUnique({ where: { id } });
      } catch (e) {
        console.error("DB Error - getBotById, falling back to sandbox:", e);
      }
    }
    return sandboxDb.bots.findUnique(id);
  },

  async createBot(userId: string, name: string, avatarUrl?: string, welcomeMessage?: string) {
    const online = await ensureDbStatus();
    if (online) {
      try {
        const botCount = await prisma.bot.count({ where: { userId } });
        const bot = await prisma.bot.create({
          data: {
            userId,
            name,
            avatarUrl,
            welcomeMessage,
            isActive: botCount === 0,
            flows: {
              create: {
                name: "Main Flow",
                isMain: true,
                nodes: [
                  { id: "node-start", type: "start", position: { x: 100, y: 150 }, data: { label: "Start Flow" } },
                  { id: "node-welcome", type: "message", position: { x: 350, y: 150 }, data: { text: welcomeMessage || "Hello! Let me know if I can help you today." } }
                ],
                edges: [
                  { id: "e-start-welcome", source: "node-start", target: "node-welcome" }
                ]
              }
            },
            widgetSettings: {
              create: {
                widgetColor: "#4F46E5",
                headerColor: "#4F46E5",
                position: "bottom-right",
                bubbleStyle: "round",
                font: "Inter",
                borderRadius: 16,
                launcherIcon: "",
                launcherBgTransparent: false,
                launcherIconSize: 28
              }
            }
          }
        });
        return bot;
      } catch (e) {
        console.error("DB Error - createBot, falling back to sandbox:", e);
      }
    }
    return sandboxDb.bots.create(userId, name, avatarUrl, welcomeMessage);
  },

  async updateBot(id: string, updates: any) {
    const online = await ensureDbStatus();
    if (online) {
      try {
        return await prisma.bot.update({
          where: { id },
          data: updates
        });
      } catch (e) {
        console.error("DB Error - updateBot, falling back to sandbox:", e);
      }
    }
    return sandboxDb.bots.update(id, updates);
  },

  async setActiveBot(userId: string, botId: string) {
    const online = await ensureDbStatus();
    if (online) {
      try {
        await prisma.bot.updateMany({
          where: { userId, NOT: { id: botId } },
          data: { isActive: false }
        });
        return await prisma.bot.update({
          where: { id: botId },
          data: { isActive: true }
        });
      } catch (e) {
        console.error("DB Error - setActiveBot, falling back to sandbox:", e);
      }
    }
    return sandboxDb.bots.setActive(userId, botId);
  },

  async getActiveBot(userId: string) {
    const online = await ensureDbStatus();
    if (online) {
      try {
        return await prisma.bot.findFirst({ where: { userId, isActive: true } });
      } catch (e) {
        console.error("DB Error - getActiveBot, falling back to sandbox:", e);
      }
    }
    const bots = sandboxDb.bots.findMany(userId);
    return bots.find(b => b.isActive) || bots[0] || null;
  },

  async deleteBot(id: string) {
    const online = await ensureDbStatus();
    if (online) {
      try {
        await prisma.bot.delete({ where: { id } });
        return true;
      } catch (e) {
        console.error("DB Error - deleteBot, falling back to sandbox:", e);
      }
    }
    return sandboxDb.bots.delete(id);
  },

  // FLOWS
  async getFlowsByBotId(botId: string) {
    const online = await ensureDbStatus();
    if (online) {
      try {
        const flows = await prisma.flow.findMany({
          where: { botId }
        });
        return flows.map(flow => ({
          ...flow,
          nodes: flow.nodes as any[],
          edges: flow.edges as any[]
        }));
      } catch (e) {
        console.error("DB Error - getFlowsByBotId, falling back to sandbox:", e);
      }
    }
    return sandboxDb.flows.findMany(botId);
  },

  async getFlowById(id: string) {
    const online = await ensureDbStatus();
    if (online) {
      try {
        const flow = await prisma.flow.findUnique({
          where: { id }
        });
        if (flow) {
          return {
            ...flow,
            nodes: flow.nodes as any[],
            edges: flow.edges as any[]
          };
        }
      } catch (e) {
        console.error("DB Error - getFlowById, falling back to sandbox:", e);
      }
    }
    return sandboxDb.flows.findUnique(id);
  },

  async getFlowByBotId(botId: string) {
    const online = await ensureDbStatus();
    if (online) {
      try {
        const flow = await prisma.flow.findFirst({
          where: { botId, isMain: true }
        }) || await prisma.flow.findFirst({
          where: { botId }
        });
        if (flow) {
          return {
            ...flow,
            nodes: flow.nodes as any[],
            edges: flow.edges as any[]
          };
        }
      } catch (e) {
        console.error("DB Error - getFlowByBotId, falling back to sandbox:", e);
      }
    }
    return sandboxDb.flows.findMainFlow(botId);
  },

  async createFlow(botId: string, name: string, isMain: boolean = false) {
    const online = await ensureDbStatus();
    if (online) {
      try {
        if (isMain) {
          await prisma.flow.updateMany({
            where: { botId },
            data: { isMain: false }
          });
        }
        return await prisma.flow.create({
          data: {
            botId,
            name,
            isMain,
            nodes: [
              { id: "node-start", type: "start", position: { x: 100, y: 150 }, data: { label: "Start Flow" } }
            ],
            edges: []
          }
        });
      } catch (e) {
        console.error("DB Error - createFlow, falling back to sandbox:", e);
      }
    }
    return sandboxDb.flows.create(botId, name, isMain);
  },

  async updateFlow(id: string, updates: any) {
    const online = await ensureDbStatus();
    if (online) {
      try {
        if (updates.isMain) {
          const flow = await prisma.flow.findUnique({ where: { id } });
          if (flow) {
            await prisma.flow.updateMany({
              where: { botId: flow.botId },
              data: { isMain: false }
            });
          }
        }
        
        const data: any = {};
        if (updates.name !== undefined) data.name = updates.name;
        if (updates.isMain !== undefined) data.isMain = updates.isMain;
        if (updates.nodes !== undefined) data.nodes = updates.nodes;
        if (updates.edges !== undefined) data.edges = updates.edges;

        return await prisma.flow.update({
          where: { id },
          data
        });
      } catch (e) {
        console.error("DB Error - updateFlow, falling back to sandbox:", e);
      }
    }
    return sandboxDb.flows.update(id, updates);
  },

  async deleteFlow(id: string) {
    const online = await ensureDbStatus();
    if (online) {
      try {
        const flow = await prisma.flow.findUnique({ where: { id } });
        if (flow) {
          if (flow.isMain) {
            const other = await prisma.flow.findFirst({
              where: { botId: flow.botId, NOT: { id } }
            });
            if (other) {
              await prisma.flow.update({
                where: { id: other.id },
                data: { isMain: true }
              });
            }
          }
          await prisma.flow.delete({ where: { id } });
          return true;
        }
      } catch (e) {
        console.error("DB Error - deleteFlow, falling back to sandbox:", e);
      }
    }
    return sandboxDb.flows.delete(id);
  },

  async applyFlowTemplate(id: string, templateType: string) {
    const online = await ensureDbStatus();
    if (online) {
      try {
        const mockFlow = sandboxDb.flows.applyTemplate(id, templateType);
        if (mockFlow) {
          return await prisma.flow.update({
            where: { id },
            data: {
              nodes: mockFlow.nodes,
              edges: mockFlow.edges
            }
          });
        }
      } catch (e) {
        console.error("DB Error - applyFlowTemplate, falling back to sandbox:", e);
      }
    }
    return sandboxDb.flows.applyTemplate(id, templateType);
  },

  // WIDGET SETTINGS
  async getWidgetSettings(botId: string) {
    const online = await ensureDbStatus();
    if (online) {
      try {
        return await prisma.widgetSettings.findUnique({ where: { botId } });
      } catch (e) {
        console.error("DB Error - getWidgetSettings, falling back to sandbox:", e);
      }
    }
    return sandboxDb.widgetSettings.findUnique(botId);
  },

  async updateWidgetSettings(botId: string, updates: any) {
    const online = await ensureDbStatus();
    if (online) {
      try {
        return await prisma.widgetSettings.update({
          where: { botId },
          data: updates
        });
      } catch (e) {
        console.error("DB Error - updateWidgetSettings, falling back to sandbox:", e);
      }
    }
    return sandboxDb.widgetSettings.update(botId, updates);
  },

  // LEADS
  async getLeads(botId?: string) {
    const online = await ensureDbStatus();
    if (online) {
      try {
        return await prisma.lead.findMany({
          where: botId ? { botId } : undefined,
          orderBy: { createdAt: "desc" }
        });
      } catch (e) {
        console.error("DB Error - getLeads, falling back to sandbox:", e);
      }
    }
    return sandboxDb.leads.findMany(botId);
  },

  async createLead(botId: string, leadData: any) {
    const online = await ensureDbStatus();
    if (online) {
      try {
        let lead;
        if (leadData.conversationId) {
          const existing = await prisma.lead.findUnique({
            where: { conversationId: leadData.conversationId }
          });
          if (existing) {
            lead = await prisma.lead.update({
              where: { id: existing.id },
              data: {
                name: leadData.name ?? undefined,
                email: leadData.email ?? undefined,
                mobile: leadData.mobile ?? undefined,
                source: leadData.source ?? undefined
              }
            });
            return lead;
          }
        }
        lead = await prisma.lead.create({
          data: {
            botId,
            name: leadData.name,
            email: leadData.email,
            mobile: leadData.mobile,
            source: leadData.source,
            conversationId: leadData.conversationId
          }
        });
        // Track lead conversion in analytics
        await prisma.analytics.create({
          data: {
            botId,
            metric: "lead_conversion",
            value: 1
          }
        });
        return lead;
      } catch (e) {
        console.error("DB Error - createLead, falling back to sandbox:", e);
      }
    }
    return sandboxDb.leads.create(botId, leadData);
  },

  // CONVERSATIONS
  async getConversation(id: string) {
    const online = await ensureDbStatus();
    if (online) {
      try {
        return await prisma.conversation.findUnique({
          where: { id },
          include: { messages: { orderBy: { createdAt: "asc" } } }
        });
      } catch (e) {
        console.error("DB Error - getConversation, falling back to sandbox:", e);
      }
    }
    return sandboxDb.conversations.findUnique(id);
  },

  async findOrCreateConversation(botId: string, sessionId: string) {
    const online = await ensureDbStatus();
    if (online) {
      try {
        let conv = await prisma.conversation.findFirst({
          where: { botId, sessionId }
        });
        if (!conv) {
          conv = await prisma.conversation.create({
            data: { botId, sessionId }
          });
          // Track analytics for chat start
          await prisma.analytics.create({
            data: {
              botId,
              metric: "chat_start",
              value: 1
            }
          });
        }
        return await prisma.conversation.findUnique({
          where: { id: conv.id },
          include: { messages: { orderBy: { createdAt: "asc" } } }
        });
      } catch (e) {
        console.error("DB Error - findOrCreateConversation, falling back to sandbox:", e);
      }
    }
    return sandboxDb.conversations.findOrCreateBySession(botId, sessionId);
  },

  async addMessage(conversationId: string, sender: "bot" | "user", text: string, payload?: any) {
    const online = await ensureDbStatus();
    if (online) {
      try {
        return await prisma.message.create({
          data: {
            conversationId,
            sender,
            text,
            payload: payload ? JSON.stringify(payload) : undefined
          }
        });
      } catch (e) {
        console.error("DB Error - addMessage, falling back to sandbox:", e);
      }
    }
    return sandboxDb.conversations.addMessage(conversationId, sender, text, payload);
  },

  async updateConversationVariables(id: string, newVariables: Record<string, any>) {
    const online = await ensureDbStatus();
    if (online) {
      try {
        const conv = await prisma.conversation.findUnique({ where: { id } });
        if (conv) {
          const currentVars = conv.variables && typeof conv.variables === 'object' && !Array.isArray(conv.variables) 
             ? (conv.variables as Record<string, any>)
             : {};
          return await prisma.conversation.update({
            where: { id },
            data: {
              variables: { ...currentVars, ...newVariables }
            }
          });
        }
      } catch (e) {
        console.error("DB Error - updateConversationVariables, falling back to sandbox:", e);
      }
    }
    return sandboxDb.conversations.updateVariables(id, newVariables);
  },

  // ANALYTICS
  async getAnalyticsSummary(botId: string, periodDays: number = 30) {
    const online = await ensureDbStatus();
    if (online) {
      try {
        // Query database metrics
        const cutoff = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000);
        const records = await prisma.analytics.findMany({
          where: {
            botId,
            createdAt: { gte: cutoff }
          }
        });

        // Compute metrics similar to sandbox helper
        let visitors = 0;
        let chats = 0;
        let leads = 0;

        records.forEach((r) => {
          if (r.metric === "visitor") visitors += r.value;
          if (r.metric === "chat_start") chats += r.value;
          if (r.metric === "lead_conversion") leads += r.value;
        });

        const dailyMap: { [date: string]: { date: string; visitors: number; chats: number; leads: number } } = {};
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
        const conversionRate = visitors > 0 ? parseFloat(((leads / visitors) * 100).toFixed(1)) : 0;

        return {
          visitors,
          chats,
          leads,
          conversionRate,
          chartData,
          popularFlows: [
            { name: "Start Conversation", count: chats, rate: 100 },
            { name: "Quick Reply Select", count: Math.floor(chats * 0.8), rate: 80 },
            { name: "Name captured", count: Math.floor(chats * 0.6), rate: 60 },
            { name: "Email captured", count: Math.floor(chats * 0.45), rate: 45 },
            { name: "Form complete (Lead)", count: leads, rate: Math.floor(conversionRate) }
          ],
          dropOffPoints: [
            { stage: "Welcome Message", drops: Math.floor(chats * 0.2) },
            { stage: "Quick Reply Choice", drops: Math.floor(chats * 0.2) },
            { stage: "Name Field Input", drops: Math.floor(chats * 0.15) },
            { stage: "Email Field Input", drops: Math.floor(chats * 0.1) }
          ]
        };
      } catch (e) {
        console.error("DB Error - getAnalyticsSummary, falling back to sandbox:", e);
      }
    }
    return sandboxDb.analytics.getSummary(botId, periodDays);
  },

  async trackAnalytics(botId: string, metric: string, value: number = 1, metadata?: any) {
    const online = await ensureDbStatus();
    if (online) {
      try {
        return await prisma.analytics.create({
          data: {
            botId,
            metric,
            value,
            metadata: metadata ? JSON.stringify(metadata) : undefined
          }
        });
      } catch (e) {
        console.error("DB Error - trackAnalytics, falling back to sandbox:", e);
      }
    }
    return sandboxDb.analytics.track(botId, metric, value, metadata);
  }
};
