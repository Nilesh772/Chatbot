/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma, checkDbConnection } from "./db";
import { sandboxDb, getTemplateFlow } from "./sandboxDb";
import fs from "fs";
import path from "path";

// Keep track of database state
let isDbOnline = false;
let hasCheckedDb = false;
let hasSeeded = false;

function resolveAgentStatus(member: any): string {
  if (!member) return "offline";
  let status = member.agentStatus || "offline";
  if (member.schedule) {
    try {
      const schedule = typeof member.schedule === "string" ? JSON.parse(member.schedule) : member.schedule;
      if (schedule && typeof schedule === "object") {
        const now = new Date();
        const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        const currentDay = days[now.getDay()];
        
        const dayDetails = schedule[currentDay];
        if (!dayDetails || !dayDetails.active) {
          status = "offline";
        } else {
          const startTimeStr = dayDetails.startTime;
          const endTimeStr = dayDetails.endTime;
          if (startTimeStr && endTimeStr) {
            const currentMin = now.getHours() * 60 + now.getMinutes();
            const [startH, startM] = startTimeStr.split(":").map(Number);
            const startMin = startH * 60 + startM;
            const [endH, endM] = endTimeStr.split(":").map(Number);
            const endMin = endH * 60 + endM;
            
            if (currentMin >= startMin && currentMin <= endMin) {
              // inside working hours
            } else {
              status = "offline";
            }
          }
        }
      }
    } catch (e) {
      console.warn("Failed to parse agent schedule:", e);
    }
  }
  return status;
}

async function runDatabaseSeeding() {
  try {
    // Seed default Super Admin account first
    await prisma.account.upsert({
      where: { id: "acc-super-admin" },
      update: {},
      create: {
        id: "acc-super-admin",
        company: "ChetBot Platform",
        owner: "admin@chatbot.com",
        plan: "enterprise",
        status: "active",
      },
    });

    // Seed default Departments
    try {
      const defaultDepts = ["General Support", "Sales", "Billing", "Technical Support"];
      for (const deptName of defaultDepts) {
        await prisma.department.upsert({
          where: { accountId_name: { accountId: "acc-super-admin", name: deptName } },
          update: {},
          create: { accountId: "acc-super-admin", name: deptName }
        });
      }
    } catch (e) {
      console.warn("Warning: Failed to seed departments:", e);
    }

    // Fix admin user — handle all DB states safely
    // Create WITHOUT roleId first (roles not seeded yet — set after)
    try {
      const adminById = await prisma.user.findUnique({ where: { id: "usr-admin" } });
      if (adminById) {
        if (adminById.email !== "admin@chatbot.com" || adminById.accountId !== "acc-super-admin") {
          await prisma.user.update({
            where: { id: "usr-admin" },
            data: {
              email: "admin@chatbot.com",
              name: "Admin User",
              password: "adminpassword123",
              accountId: "acc-super-admin",
              role: "Super Admin",
            },
          });
        }
      } else {
        const adminByEmail = await prisma.user.findUnique({ where: { email: "admin@chatbot.com" } });
        if (adminByEmail) {
          await prisma.user.update({
            where: { email: "admin@chatbot.com" },
            data: {
              name: "Admin User",
              password: "adminpassword123",
              accountId: "acc-super-admin",
              role: "Super Admin",
            },
          });
        } else {
          // Create admin user WITHOUT roleId — will be set after roles are seeded
          await prisma.user.create({
            data: {
              id: "usr-admin",
              email: "admin@chatbot.com",
              name: "Admin User",
              password: "adminpassword123",
              accountId: "acc-super-admin",
              role: "Super Admin",
              roleId: null,
            },
          });
        }
      }
    } catch (e) {
      console.warn("Warning: Failed to seed admin user:", e);
    }

    // Seed plans idempotently
    try {
      await prisma.plan.createMany({
        data: [
          { id: "free", name: "Free Sandbox", price: 0, features: ["1 Chatbot", "100 Chats/mo", "Basic Analytics"] },
          { id: "pro", name: "Pro Builder", price: 29, features: ["Unlimited Chatbots", "5000 Chats/mo", "Advanced Analytics", "Remove Branding", "Excel Export"] },
          { id: "enterprise", name: "Enterprise Custom", price: 99, features: ["Unlimited Everything", "Priority Support", "Dedicated Live Agent Routing", "Whitelabel Widget"] },
        ],
        skipDuplicates: true,
      });

      // Upsert subscription for admin
      await prisma.subscription.upsert({
        where: { id: "sub-1" },
        update: {},
        create: {
          id: "sub-1",
          userId: "usr-admin",
          planId: "pro",
          status: "active",
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });
    } catch (e) {
      console.warn("Warning: Failed to seed plans/subscriptions (tables might be missing):", e);
    }

    // Seed default Modules
    try {
      const modulesToSeed = [
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

      // Deactivate obsolete modules
      await prisma.module.updateMany({
        where: { slug: { in: ["/dashboard/team", "/dashboard/super-admin"] } },
        data: { isActive: false }
      });

      for (const mod of modulesToSeed) {
        await prisma.module.upsert({
          where: { id: mod.id },
          update: { name: mod.name, slug: mod.slug, icon: mod.icon, sortOrder: mod.sortOrder, isActive: mod.isActive },
          create: mod
        });
      }
    } catch (e) {
      console.warn("Warning: Failed to seed modules:", e);
    }

    // Seed default Roles
    try {
      const rolesToSeed = [
        { id: "role-super-admin", name: "Super Admin", description: "Full platform permissions bypass" },
        { id: "role-admin", name: "Admin", description: "Default organization admin" },
        { id: "role-staff", name: "Staff", description: "Standard workspace staff" },
        { id: "role-agent", name: "Agent", description: "Live chat agent" }
      ];

      for (const role of rolesToSeed) {
        await prisma.role.upsert({
          where: { name: role.name },
          update: { description: role.description },
          create: role
        });
      }

      // Now that roles exist, update admin user's roleId safely
      await prisma.user.update({
        where: { id: "usr-admin" },
        data: { roleId: "role-super-admin" }
      }).catch(() => { }); // Ignore if user doesn't exist yet (shouldn't happen)
    } catch (e) {
      console.warn("Warning: Failed to seed roles:", e);
    }

    // Seed RolePermissions for Admin & Agent
    try {
      const adminRole = await prisma.role.findUnique({ where: { name: "Admin" } });
      const agentRole = await prisma.role.findUnique({ where: { name: "Agent" } });

      if (adminRole) {
        const allModules = await prisma.module.findMany();
        for (const mod of allModules) {
          await prisma.rolePermission.upsert({
            where: { roleId_moduleId: { roleId: adminRole.id, moduleId: mod.id } },
            update: { canView: true, canAdd: true, canEdit: true, canDelete: true },
            create: {
              roleId: adminRole.id,
              moduleId: mod.id,
              canView: true,
              canAdd: true,
              canEdit: true,
              canDelete: true
            }
          });
        }
      }

      if (agentRole) {
        const inboxModule = await prisma.module.findUnique({ where: { slug: "/dashboard/inbox" } });
        if (inboxModule) {
          await prisma.rolePermission.upsert({
            where: { roleId_moduleId: { roleId: agentRole.id, moduleId: inboxModule.id } },
            update: { canView: true, canAdd: true, canEdit: true, canDelete: true },
            create: {
              roleId: agentRole.id,
              moduleId: inboxModule.id,
              canView: true,
              canAdd: true,
              canEdit: true,
              canDelete: true
            }
          });
        }
      }
    } catch (e) {
      console.warn("Warning: Failed to seed role permissions:", e);
    }

    // Seed/migrate agents from backup if available
    try {
      const backupPath = "C:\\Users\\PC-1\\.gemini\\antigravity-ide\\brain\\e42515db-43f7-48f9-b2d1-e0bcdecfd3c4\\scratch\\agents-backup.json";
      if (fs.existsSync(backupPath)) {
        const raw = fs.readFileSync(backupPath, "utf8");
        const backedAgents = JSON.parse(raw);
        for (const agent of backedAgents) {
          let deptId = null;
          if (agent.department) {
            const dept = await prisma.department.findFirst({
              where: { name: agent.department, accountId: "acc-super-admin" }
            });
            deptId = dept?.id || null;
          }

          await prisma.user.upsert({
            where: { email: agent.email },
            update: {},
            create: {
              id: agent.id,
              accountId: "acc-super-admin",
              name: agent.name,
              email: agent.email,
              password: agent.password,
              role: "agent",
              permissions: ["conversations:view", "conversations:manage"],
              departmentId: deptId,
              status: "active",
            },
          });
        }
        console.log(`Migrated ${backedAgents.length} agents to team members.`);
      }
    } catch (err) {
      console.error("Failed to migrate agents:", err);
    }

    console.log("MySQL admin seed completed successfully.");
  } catch (err) {
    console.error("Failed to seed MySQL admin details:", err);
  }
}

async function ensureDbStatus() {
  if (!hasCheckedDb || !isDbOnline) {
    isDbOnline = await checkDbConnection();
    hasCheckedDb = true;
  }

  if (isDbOnline && !hasSeeded) {
    hasSeeded = true;
    // Run seeding in the background without blocking the connection check
    runDatabaseSeeding().catch(err => {
      console.error("Background seeding failed:", err);
    });
  }

  return isDbOnline;
}

export const dbService = {
  // Check if running in sandbox/mock mode
  async isSandboxMode(): Promise<boolean> {
    const online = await ensureDbStatus();
    return !online;
  },

  // USERS (Platform / Super Admins)
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

  async createUser(email: string, name?: string, password?: string, accountId?: string, role?: string, roleId?: string) {
    const online = await ensureDbStatus();
    if (online) {
      try {
        const user = await prisma.user.create({
          data: {
            email,
            name,
            password,
            accountId: accountId || "acc-super-admin",
            role: role || "Super Admin",
            roleId: roleId || null,
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

  // ACCOUNTS (Organizations)
  async getAccountById(id: string) {
    const online = await ensureDbStatus();
    if (online) {
      try {
        return await prisma.account.findUnique({ where: { id } });
      } catch (e) {
        console.error("DB Error - getAccountById:", e);
      }
    }
    return null;
  },

  async getAllAccounts() {
    const online = await ensureDbStatus();
    if (online) {
      try {
        return await prisma.account.findMany({ orderBy: { createdAt: "desc" } });
      } catch (e) {
        console.error("DB Error - getAllAccounts:", e);
      }
    }
    return [];
  },

  async createAccount(company: string, owner: string, plan: string = "free") {
    const online = await ensureDbStatus();
    if (online) {
      try {
        return await prisma.account.create({
          data: {
            company,
            owner,
            plan,
            status: "active"
          }
        });
      } catch (e) {
        console.error("DB Error - createAccount:", e);
      }
    }
    // Sandbox fallback
    return {
      id: "acc-super-admin",
      company,
      owner,
      plan,
      status: "active",
      createdAt: new Date(),
      updatedAt: new Date()
    };
  },

  async updateAccount(id: string, updates: any) {
    const online = await ensureDbStatus();
    if (online) {
      try {
        return await prisma.account.update({
          where: { id },
          data: updates
        });
      } catch (e) {
        console.error("DB Error - updateAccount:", e);
      }
    }
    return null;
  },

  async deleteAccount(id: string) {
    const online = await ensureDbStatus();
    if (online) {
      try {
        await prisma.account.delete({ where: { id } });
        return true;
      } catch (e) {
        console.error("DB Error - deleteAccount:", e);
      }
    }
    return false;
  },

  // TEAM MEMBERS
  async getTeamMembers(accountId: string) {
    const online = await ensureDbStatus();
    if (online) {
      try {
        const list = await prisma.user.findMany({
          where: { accountId },
          include: { roleRelation: true, department: true },
          orderBy: { createdAt: "desc" }
        });
        return list.map((member: any) => ({
          ...member,
          department: member.department?.name || null,
          departmentId: member.departmentId || null,
          agentStatus: resolveAgentStatus(member)
        }));
      } catch (e) {
        console.error("DB Error - getTeamMembers:", e);
      }
    }
    // Sandbox fallback
    const list = sandboxDb.agents.findMany(accountId);
    const db = sandboxDb.getSandboxData();
    return list.map(agent => {
      const dept = db.departments?.find(d => d.id === agent.departmentId || d.name === agent.department);
      return {
        id: agent.id,
        accountId: agent.accountId,
        name: agent.name,
        email: agent.email,
        role: "agent",
        permissions: ["bots:view", "conversations:view", "leads:view"],
        departmentId: dept?.id || null,
        department: dept?.name || null,
        status: "active",
        agentStatus: resolveAgentStatus(agent),
        schedule: agent.schedule || null,
        createdAt: agent.createdAt || new Date().toISOString()
      };
    }) as any;
  },

  async getTeamMemberById(id: string) {
    const online = await ensureDbStatus();
    if (online) {
      try {
        const member = await prisma.user.findUnique({
          where: { id },
          include: { roleRelation: true, department: true }
        });
        if (member) {
          (member as any).agentStatus = resolveAgentStatus(member);
        }
        return member;
      } catch (e) {
        console.error("DB Error - getTeamMemberById:", e);
      }
    }
    // Sandbox fallback
    const agent = sandboxDb.agents.findUnique(id);
    if (agent) {
      const db = sandboxDb.getSandboxData();
      const dept = db.departments?.find(d => d.id === agent.departmentId || d.name === agent.department);
      return {
        id: agent.id,
        accountId: agent.accountId,
        name: agent.name,
        email: agent.email,
        role: agent.role || "agent",
        permissions: agent.permissions || ["conversations:view", "conversations:manage"],
        departmentId: dept?.id || null,
        department: dept || null,
        status: "active",
        agentStatus: resolveAgentStatus(agent),
        schedule: agent.schedule || null
      } as any;
    }
    return null;
  },

  async getTeamMemberByEmail(email: string) {
    const online = await ensureDbStatus();
    if (online) {
      try {
        const member = await prisma.user.findUnique({
          where: { email },
          include: { roleRelation: true, department: true }
        });
        if (member) {
          (member as any).agentStatus = resolveAgentStatus(member);
        }
        return member;
      } catch (e) {
        console.error("DB Error - getTeamMemberByEmail:", e);
      }
    }
    // Sandbox fallback
    const db = sandboxDb.getSandboxData();
    const agent = db.agents?.find(a => a.email.toLowerCase() === email.toLowerCase());
    if (agent) {
      const dept = db.departments?.find(d => d.id === agent.departmentId || d.name === agent.department);
      return {
        id: agent.id,
        accountId: agent.accountId,
        name: agent.name,
        email: agent.email,
        role: agent.role || "agent",
        permissions: agent.permissions || ["conversations:view", "conversations:manage"],
        departmentId: dept?.id || null,
        department: dept || null,
        status: "active",
        agentStatus: resolveAgentStatus(agent),
        schedule: agent.schedule || null
      } as any;
    }
    return null;
  },

  async createTeamMember(accountId: string, data: any) {
    const online = await ensureDbStatus();
    if (online) {
      try {
        // Normalize role name to match seeded role names case-insensitively
        let roleName = data.role || "agent";
        const lowerRole = roleName.toLowerCase();
        if (lowerRole === "admin") roleName = "Admin";
        else if (lowerRole === "super_admin" || lowerRole === "super admin") roleName = "Super Admin";
        else if (lowerRole === "staff") roleName = "Staff";
        else if (lowerRole === "agent") roleName = "Agent";

        const roles = await prisma.role.findMany();
        const roleRecord = roles.find(r =>
          r.id === roleName ||
          r.name.toLowerCase() === roleName.toLowerCase()
        ) || null;

        const deptId = data.departmentId || data.department || null;
        return await prisma.user.create({
          data: {
            id: data.id || undefined,
            accountId,
            name: data.name,
            email: data.email,
            password: data.password,
            role: roleRecord?.name || roleName,
            roleId: roleRecord?.id || null,
            permissions: data.permissions || [],
            departmentId: deptId,
            status: data.status || "active",
            agentStatus: data.agentStatus || "offline",
            schedule: data.schedule || null
          }
        });
      } catch (e) {
        console.error("DB Error - createTeamMember:", e);
        throw e;
      }
    }
    // Sandbox fallback
    const deptName = data.department || null;
    const sAgent = sandboxDb.agents.create(accountId, data.name, data.email, data.password, deptName, data.role, data.permissions);
    if (sAgent) {
      if (data.schedule) {
        sandboxDb.agents.update(sAgent.id, { schedule: data.schedule });
        sAgent.schedule = data.schedule;
      }
      return {
        id: sAgent.id,
        accountId: sAgent.accountId,
        name: sAgent.name,
        email: sAgent.email,
        role: sAgent.role || "agent",
        permissions: sAgent.permissions || ["bots:view", "conversations:view", "leads:view"],
        department: deptName,
        status: "active",
        agentStatus: sAgent.agentStatus || "offline",
        schedule: sAgent.schedule || null
      } as any;
    }
    return null;
  },

  async updateTeamMember(id: string, data: any) {
    const online = await ensureDbStatus();
    if (online) {
      try {
        const updateData = { ...data };
        if (updateData.role !== undefined) {
          let roleName = updateData.role;
          const lowerRole = roleName.toLowerCase();
          if (lowerRole === "admin") roleName = "Admin";
          else if (lowerRole === "super_admin" || lowerRole === "super admin") roleName = "Super Admin";
          else if (lowerRole === "staff") roleName = "Staff";
          else if (lowerRole === "agent") roleName = "Agent";

          const roles = await prisma.role.findMany();
          const roleRecord = roles.find(r =>
            r.id === roleName ||
            r.name.toLowerCase() === roleName.toLowerCase()
          ) || null;
          updateData.role = roleRecord?.name || roleName;
          updateData.roleId = roleRecord?.id || null;
        }
        if (updateData.department !== undefined) {
          updateData.departmentId = updateData.department || null;
          delete updateData.department;
        }
        return await prisma.user.update({
          where: { id },
          data: updateData
        });
      } catch (e) {
        console.error("DB Error - updateTeamMember:", e);
        throw e;
      }
    }
    // Sandbox fallback
    const sAgent = sandboxDb.agents.update(id, data);
    if (sAgent) {
      return {
        id: sAgent.id,
        accountId: sAgent.accountId,
        name: sAgent.name,
        email: sAgent.email,
        role: "agent",
        permissions: ["bots:view", "conversations:view", "leads:view"],
        department: sAgent.department || null,
        status: "active",
        agentStatus: sAgent.agentStatus || "offline",
        schedule: sAgent.schedule || null
      } as any;
    }
    return null;
  },

  async deleteTeamMember(id: string) {
    const online = await ensureDbStatus();
    if (online) {
      try {
        await prisma.user.delete({ where: { id } });
        return true;
      } catch (e) {
        console.error("DB Error - deleteTeamMember:", e);
      }
    }
    return false;
  },

  // BOTS
  async getBots(accountId: string) {
    const online = await ensureDbStatus();
    if (online) {
      try {
        return await prisma.bot.findMany({ where: { accountId } });
      } catch (e) {
        console.error("DB Error - getBots, falling back to sandbox:", e);
      }
    }
    return sandboxDb.bots.findMany(accountId);
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

  async createBot(accountId: string, name: string, avatarUrl?: string, welcomeMessage?: string, userId?: string) { // Create bot handler
    const online = await ensureDbStatus();
    if (online) {
      try {
        const botCount = await prisma.bot.count({ where: { accountId } });

        // Only link userId if it corresponds to a valid User record (e.g. Super Admin) to avoid FK constraint issues
        let verifiedUserId = null;
        if (userId) {
          const userExists = await prisma.user.findUnique({ where: { id: userId } });
          if (userExists) {
            verifiedUserId = userId;
          }
        }

        const bot = await prisma.bot.create({
          data: {
            accountId,
            userId: verifiedUserId,
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
    return sandboxDb.bots.create(accountId, name, avatarUrl, welcomeMessage);
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

  async setActiveBot(accountId: string, botId: string) {
    const online = await ensureDbStatus();
    if (online) {
      try {
        await prisma.bot.updateMany({
          where: { accountId, NOT: { id: botId } },
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
    return sandboxDb.bots.setActive(accountId, botId);
  },

  async getActiveBot(accountId: string) {
    const online = await ensureDbStatus();
    if (online) {
      try {
        return await prisma.bot.findFirst({ where: { accountId, isActive: true } });
      } catch (e) {
        console.error("DB Error - getActiveBot, falling back to sandbox:", e);
      }
    }
    const bots = sandboxDb.bots.findMany(accountId);
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
        const temp = getTemplateFlow(id, templateType);
        if (temp) {
          return await prisma.flow.update({
            where: { id },
            data: {
              nodes: temp.nodes.map(n => ({
                id: n.id,
                type: n.type,
                position: { x: n.x, y: n.y },
                data: { ...n.data, type: n.type }  // include type in data so CustomNode renders correctly
              })),
              edges: temp.edges.map(e => ({
                id: e.id,
                source: e.source,
                target: e.target,
                sourceHandle: e.sourceHandle || null,
                targetHandle: e.targetHandle || null
              }))
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
  async getLeads(accountIdOrBotId: string, maybeBotId?: string) {
    const online = await ensureDbStatus();

    if (online) {
      try {
        let accountId = accountIdOrBotId;
        let botId = maybeBotId;

        if (maybeBotId) {
          // Both provided: getLeads(accountId, botId)
          // Proactively heal leads
          await prisma.lead.updateMany({
            where: { botId, accountId: "acc-super-admin" },
            data: { accountId }
          });
          
          return await prisma.lead.findMany({
            where: {
              accountId,
              botId
            },
            orderBy: { createdAt: "desc" }
          });
        } else {
          // Only one provided: getLeads(id) which could be botId or accountId
          const botExists = await prisma.bot.findUnique({ where: { id: accountIdOrBotId } });
          if (botExists) {
            accountId = botExists.accountId;
            botId = accountIdOrBotId;
            
            await prisma.lead.updateMany({
              where: { botId, accountId: "acc-super-admin" },
              data: { accountId }
            });

            return await prisma.lead.findMany({
              where: { botId },
              orderBy: { createdAt: "desc" }
            });
          } else {
            // It's accountId
            const bots = await prisma.bot.findMany({ where: { accountId } });
            const botIds = bots.map(b => b.id);
            if (botIds.length > 0) {
              await prisma.lead.updateMany({
                where: { botId: { in: botIds }, accountId: "acc-super-admin" },
                data: { accountId }
              });
            }

            return await prisma.lead.findMany({
              where: { accountId },
              orderBy: { createdAt: "desc" }
            });
          }
        }
      } catch (e) {
        console.error("DB Error - getLeads, falling back to sandbox:", e);
      }
    }
    return sandboxDb.leads.findMany(accountIdOrBotId);
  },

  async createLead(accountIdOrBotId: string, botIdOrLeadData: any, maybeLeadData?: any) {
    const online = await ensureDbStatus();

    let accountId = "acc-super-admin";
    let botId = accountIdOrBotId;
    let leadData = botIdOrLeadData;

    if (maybeLeadData) {
      accountId = accountIdOrBotId;
      botId = botIdOrLeadData;
      leadData = maybeLeadData;
    }

    if (online) {
      try {
        // Resolve the actual accountId from the Bot to ensure proper mapping
        const bot = await prisma.bot.findUnique({ where: { id: botId } });
        if (bot) {
          accountId = bot.accountId;
        }

        let lead;
        if (leadData.conversationId) {
          const existing = await prisma.lead.findUnique({
            where: { conversationId: leadData.conversationId }
          });
          if (existing) {
            lead = await prisma.lead.update({
              where: { id: existing.id },
              data: {
                accountId,
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
            accountId,
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
            accountId,
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
        const conversation = await prisma.conversation.findUnique({
          where: { id },
          include: {
            messages: { orderBy: { createdAt: "asc" } },
            department: true
          }
        });
        if (conversation) {
          return {
            ...conversation,
            department: conversation.department?.name || null
          } as any;
        }
        return null;
      } catch (e) {
        console.error("DB Error - getConversation, falling back to sandbox:", e);
      }
    }
    return sandboxDb.conversations.findUnique(id) as any;
  },

  async findOrCreateConversation(accountIdOrBotId: string, botIdOrSessionId: string, maybeSessionId?: string) {
    const online = await ensureDbStatus();

    let accountId = "acc-super-admin";
    let botId = accountIdOrBotId;
    let sessionId = botIdOrSessionId;

    if (maybeSessionId) {
      accountId = accountIdOrBotId;
      botId = botIdOrSessionId;
      sessionId = maybeSessionId;
    }

    if (online) {
      try {
        let conv = await prisma.conversation.findFirst({
          where: { botId, sessionId }
        });

        // Resolve the actual accountId from the Bot to ensure proper mapping
        const bot = await prisma.bot.findUnique({ where: { id: botId } });
        const actualAccountId = bot ? bot.accountId : accountId;

        if (!conv) {
          conv = await prisma.conversation.create({
            data: { accountId: actualAccountId, botId, sessionId }
          });
          // Track analytics for chat start
          await prisma.analytics.create({
            data: {
              accountId: actualAccountId,
              botId,
              metric: "chat_start",
              value: 1
            }
          });
        } else if (conv.accountId !== actualAccountId) {
          // Auto-heal/correct legacy or mismatched accountId mapping
          conv = await prisma.conversation.update({
            where: { id: conv.id },
            data: { accountId: actualAccountId }
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
    return sandboxDb.conversations.findOrCreateBySession(botId, sessionId) as any;
  },

  async addMessage(conversationId: string, sender: "bot" | "user" | "agent", text: string, payload?: any) {
    const online = await ensureDbStatus();
    if (online) {
      try {
        // Update conversation updatedAt
        await prisma.conversation.update({
          where: { id: conversationId },
          data: { updatedAt: new Date() }
        });
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
          const updatedVars = { ...currentVars, ...newVariables };
          const dataToUpdate: any = { variables: updatedVars };

          if (newVariables.visitor_name) dataToUpdate.visitorName = newVariables.visitor_name;
          if (newVariables.visitor_email) dataToUpdate.visitorEmail = newVariables.visitor_email;
          if (newVariables.name) dataToUpdate.visitorName = newVariables.name;
          if (newVariables.email) dataToUpdate.visitorEmail = newVariables.email;
          if (newVariables.department) dataToUpdate.department = newVariables.department;

          return await prisma.conversation.update({
            where: { id },
            data: dataToUpdate
          });
        }
      } catch (e) {
        console.error("DB Error - updateConversationVariables, falling back to sandbox:", e);
      }
    }
    return sandboxDb.conversations.updateVariables(id, newVariables);
  },

  async getConversations(accountId: string, botId?: string) {
    const online = await ensureDbStatus();
    if (online) {
      try {
        // Auto-heal all conversations for the given bot or account that are incorrectly set to "acc-super-admin"
        if (botId) {
          await prisma.conversation.updateMany({
            where: { botId, accountId: "acc-super-admin" },
            data: { accountId }
          });
          await prisma.lead.updateMany({
            where: { botId, accountId: "acc-super-admin" },
            data: { accountId }
          });
          await prisma.analytics.updateMany({
            where: { botId, accountId: "acc-super-admin" },
            data: { accountId }
          });
        } else {
          const bots = await prisma.bot.findMany({ where: { accountId } });
          const botIds = bots.map(b => b.id);
          if (botIds.length > 0) {
            await prisma.conversation.updateMany({
              where: { botId: { in: botIds }, accountId: "acc-super-admin" },
              data: { accountId }
            });
            await prisma.lead.updateMany({
              where: { botId: { in: botIds }, accountId: "acc-super-admin" },
              data: { accountId }
            });
            await prisma.analytics.updateMany({
              where: { botId: { in: botIds }, accountId: "acc-super-admin" },
              data: { accountId }
            });
          }
        }

        const convs = await prisma.conversation.findMany({
          where: {
            accountId,
            botId: botId ? botId : undefined
          },
          orderBy: { updatedAt: "desc" },
          include: {
            messages: { orderBy: { createdAt: "desc" }, take: 1 },
            department: true
          }
        });
        return convs.map(c => ({
          ...c,
          department: c.department?.name || null
        })) as any;
      } catch (e) {
        console.error("DB Error - getConversations, falling back to sandbox:", e);
      }
    }
    const convs = sandboxDb.conversations.findMany(botId);
    return convs.map(c => {
      const full = sandboxDb.conversations.findUnique(c.id);
      return {
        ...c,
        messages: full?.messages ? [full.messages[full.messages.length - 1]].filter(Boolean) : []
      };
    }) as any;
  },

  async updateConversation(id: string, updates: any) {
    if (updates.department && typeof updates.department === "string") {
      const online = await ensureDbStatus();
      if (online) {
        try {
          const conv = await prisma.conversation.findUnique({
            where: { id },
            select: { accountId: true }
          });
          if (conv) {
            const dept = await prisma.department.findFirst({
              where: {
                accountId: conv.accountId,
                name: updates.department
              }
            });
            if (dept) {
              updates.departmentId = dept.id;
            } else {
              const fallbackDept = await prisma.department.findFirst({
                where: {
                  accountId: conv.accountId,
                  name: "General Support"
                }
              });
              if (fallbackDept) {
                updates.departmentId = fallbackDept.id;
              }
            }
          }
        } catch (e) {
          console.error("DB Error in updateConversation department mapping:", e);
        }
      } else {
        const conv = sandboxDb.conversations.findUnique(id);
        if (conv) {
          const depts = sandboxDb.departments.findMany(conv.accountId || "acc-super-admin");
          const dept = depts.find(d => d.name === updates.department);
          if (dept) {
            updates.departmentId = dept.id;
          }
        }
      }
      delete updates.department;
    }

    const online = await ensureDbStatus();
    if (online) {
      try {
        return await prisma.conversation.update({
          where: { id },
          data: updates
        });
      } catch (e) {
        console.error("DB Error - updateConversation, falling back to sandbox:", e);
      }
    }
    return sandboxDb.conversations.update(id, updates);
  },

  async acceptConversation(id: string, agentId: string) {
    return this.updateConversation(id, {
      status: "active",
      assignedAgentId: agentId,
      startedAt: new Date()
    });
  },

  async closeConversation(id: string) {
    return this.updateConversation(id, {
      status: "closed",
      closedAt: new Date()
    });
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

  async trackAnalytics(accountId: string, botId: string, metric: string, value: number = 1, metadata?: any) {
    const online = await ensureDbStatus();
    if (online) {
      try {
        return await prisma.analytics.create({
          data: {
            accountId,
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
  },

  // COMPATIBILITY/AGENTS MAPPED TO TEAM MEMBERS WITH ROLE='AGENT'
  async getAgents(accountId: string) {
    const online = await ensureDbStatus();
    if (online) {
      try {
        const list = await prisma.user.findMany({
          where: { accountId, role: "agent" },
          include: { department: true },
          orderBy: { createdAt: "desc" }
        });
        return list.map((member: any) => ({
          ...member,
          department: member.department?.name || null,
          departmentId: member.departmentId || null,
          agentStatus: resolveAgentStatus(member)
        }));
      } catch (e) {
        console.error("DB Error - getAgents, falling back to sandbox:", e);
      }
    }
    const list = sandboxDb.agents.findMany(accountId);
    return list.map(agent => {
      const resolved = resolveAgentStatus(agent);
      return {
        ...agent,
        agentStatus: resolved
      };
    }) as any;
  },

  async getAgentById(id: string) {
    const online = await ensureDbStatus();
    if (online) {
      try {
        const member = await prisma.user.findFirst({
          where: { id, role: "agent" }
        });
        if (member) {
          (member as any).agentStatus = resolveAgentStatus(member);
        }
        return member;
      } catch (e) {
        console.error("DB Error - getAgentById, falling back to sandbox:", e);
      }
    }
    const agent = sandboxDb.agents.findUnique(id);
    if (agent) {
      return {
        ...agent,
        agentStatus: resolveAgentStatus(agent)
      } as any;
    }
    return null;
  },

  async createAgent(accountId: string, name: string, email: string, password?: string, department?: string) {
    const online = await ensureDbStatus();
    if (online) {
      try {
        return await prisma.user.create({
          data: {
            accountId,
            name,
            email,
            password,
            role: "agent",
            permissions: ["conversations:view", "conversations:manage"],
            departmentId: department || null,
            status: "active"
          }
        });
      } catch (e) {
        console.error("DB Error - createAgent, falling back to sandbox:", e);
        throw e;
      }
    }
    return sandboxDb.agents.create(accountId, name, email, password, department);
  },

  async updateAgent(id: string, data: { name?: string; email?: string; password?: string; department?: string; agentStatus?: string; schedule?: any }) {
    const online = await ensureDbStatus();
    if (online) {
      try {
        const { department, ...rest } = data;
        const updateData: any = {
          ...rest
        };
        if (department !== undefined) {
          updateData.departmentId = department || null;
        }
        return await prisma.user.update({
          where: { id },
          data: updateData
        });
      } catch (e) {
        console.error("DB Error - updateAgent, falling back to sandbox:", e);
        throw e;
      }
    }
    return sandboxDb.agents.update(id, data);
  },

  async deleteAgent(id: string) {
    const online = await ensureDbStatus();
    if (online) {
      try {
        await prisma.user.delete({
          where: { id }
        });
        return true;
      } catch (e) {
        console.error("DB Error - deleteAgent, falling back to sandbox:", e);
      }
    }
    return sandboxDb.agents.delete(id);
  },

  // Get agents for a specific department (by department name or id)
  async getDepartmentAgents(accountId: string, departmentName: string) {
    const online = await ensureDbStatus();
    if (online) {
      try {
        // Find the department
        const dept = await prisma.department.findFirst({
          where: { accountId, name: departmentName }
        });
        if (!dept) {
          // Fall back to General Support or return empty
          const generalDept = await prisma.department.findFirst({
            where: { accountId, name: "General Support" }
          });
          if (!generalDept) return { total: 0, online: 0, agents: [] };
          const members = await prisma.user.findMany({
            where: { accountId, OR: [{ departmentId: generalDept.id }, { departmentId: null }] }
          });
          const withStatus = members.map(m => ({ ...m, agentStatus: resolveAgentStatus(m) }));
          return {
            total: withStatus.length,
            online: withStatus.filter(a => a.agentStatus === "online").length,
            agents: withStatus
          };
        }
        const members = await prisma.user.findMany({
          where: { accountId, departmentId: dept.id }
        });
        const withStatus = members.map(m => ({ ...m, agentStatus: resolveAgentStatus(m) }));
        return {
          total: withStatus.length,
          online: withStatus.filter(a => a.agentStatus === "online").length,
          agents: withStatus
        };
      } catch (e) {
        console.error("DB Error - getDepartmentAgents:", e);
      }
    }
    // Sandbox fallback
    const depts = sandboxDb.departments.findMany(accountId);
    const dept = depts.find(d => d.name === departmentName);
    const allAgents = sandboxDb.agents.findMany(accountId);
    const filtered = dept ? allAgents.filter((a: any) => a.departmentId === dept.id) : allAgents;
    const withStatus = filtered.map((a: any) => ({ ...a, agentStatus: resolveAgentStatus(a) }));
    return {
      total: withStatus.length,
      online: withStatus.filter((a: any) => a.agentStatus === "online").length,
      agents: withStatus
    };
  },

  // ROLES & PERMISSIONS
  async getRoles() {
    const online = await ensureDbStatus();
    if (online) {
      try {
        return await prisma.role.findMany({
          orderBy: { name: "asc" }
        });
      } catch (e) {
        console.error("DB Error - getRoles, falling back to sandbox:", e);
      }
    }
    return sandboxDb.roles.findMany();
  },

  async getRoleById(id: string) {
    const online = await ensureDbStatus();
    if (online) {
      try {
        return await prisma.role.findUnique({
          where: { id }
        });
      } catch (e) {
        console.error("DB Error - getRoleById, falling back to sandbox:", e);
      }
    }
    return sandboxDb.roles.findUnique(id);
  },

  async createRole(name: string, description?: string, permissions?: { moduleId: string; canView: boolean; canAdd: boolean; canEdit: boolean; canDelete: boolean }[]) {
    const online = await ensureDbStatus();
    if (online) {
      try {
        const existing = await prisma.role.findFirst({
          where: { name }
        });
        if (existing) {
          throw new Error(`A role with the name "${name}" already exists.`);
        }

        return await prisma.$transaction(async (tx) => {
          const role = await tx.role.create({
            data: { name, description }
          });
          if (permissions && permissions.length > 0) {
            await tx.rolePermission.createMany({
              data: permissions.map(p => ({
                roleId: role.id,
                moduleId: p.moduleId,
                canView: p.canView,
                canAdd: p.canAdd,
                canEdit: p.canEdit,
                canDelete: p.canDelete
              }))
            });
          }
          return role;
        });
      } catch (e: any) {
        console.error("DB Error - createRole:", e);
        if (e.code === "P2002") {
          throw new Error(`A role with the name "${name}" already exists.`);
        }
        throw e;
      }
    }
    // Sandbox fallback
    const role = sandboxDb.roles.create(name, description);
    if (permissions && permissions.length > 0) {
      sandboxDb.rolePermissions.createMany(permissions.map(p => ({
        roleId: role.id,
        moduleId: p.moduleId,
        canView: p.canView,
        canAdd: p.canAdd,
        canEdit: p.canEdit,
        canDelete: p.canDelete
      })));
    }
    return role;
  },

  async updateRole(id: string, name: string, description?: string) {
    const online = await ensureDbStatus();
    if (online) {
      try {
        const another = await prisma.role.findFirst({
          where: { name, NOT: { id } }
        });
        if (another) {
          throw new Error(`Another role with the name "${name}" already exists.`);
        }
        return await prisma.role.update({
          where: { id },
          data: { name, description }
        });
      } catch (e: any) {
        console.error("DB Error - updateRole:", e);
        if (e.code === "P2002") {
          throw new Error(`Another role with the name "${name}" already exists.`);
        }
        throw e;
      }
    }
    return sandboxDb.roles.update(id, { name, description });
  },

  async deleteRole(id: string) {
    const online = await ensureDbStatus();
    if (online) {
      try {
        const role = await prisma.role.findUnique({ where: { id } });
        if (role && ["Super Admin", "Admin", "Staff", "Agent"].includes(role.name)) {
          throw new Error("Default system roles cannot be deleted.");
        }
        await prisma.rolePermission.deleteMany({
          where: { roleId: id }
        });
        await prisma.user.updateMany({
          where: { roleId: id },
          data: { roleId: null }
        });
        await prisma.role.delete({
          where: { id }
        });
        return true;
      } catch (e) {
        console.error("DB Error - deleteRole:", e);
        throw e;
      }
    }
    return sandboxDb.roles.delete(id);
  },

  async updateRolePermissions(roleId: string, permissions: { moduleId: string; canView: boolean; canAdd: boolean; canEdit: boolean; canDelete: boolean }[]) {
    const online = await ensureDbStatus();
    if (online) {
      try {
        return await prisma.$transaction(async (tx) => {
          await tx.rolePermission.deleteMany({
            where: { roleId }
          });
          if (permissions && permissions.length > 0) {
            await tx.rolePermission.createMany({
              data: permissions.map(p => ({
                roleId,
                moduleId: p.moduleId,
                canView: p.canView,
                canAdd: p.canAdd,
                canEdit: p.canEdit,
                canDelete: p.canDelete
              }))
            });
          }
          return true;
        });
      } catch (e) {
        console.error("DB Error - updateRolePermissions:", e);
        throw e;
      }
    }
    return sandboxDb.rolePermissions.updateRolePermissions(roleId, permissions);
  },

  async getRolePermissions(roleId: string) {
    const online = await ensureDbStatus();
    if (online) {
      try {
        return await prisma.rolePermission.findMany({
          where: { roleId }
        });
      } catch (e) {
        console.error("DB Error - getRolePermissions:", e);
      }
    }
    return sandboxDb.rolePermissions.findMany(roleId);
  },

  // MODULES
  async getModules() {
    const online = await ensureDbStatus();
    if (online) {
      try {
        return await prisma.module.findMany({
          where: { isActive: true },
          orderBy: { sortOrder: "asc" }
        });
      } catch (e) {
        console.error("DB Error - getModules, falling back to sandbox:", e);
      }
    }
    return sandboxDb.modules.findMany();
  },

  async getRolePermission(roleNameOrId: string, moduleSlug: string) {
    const online = await ensureDbStatus();
    if (online) {
      try {
        // Normalize role name to seed casing for lookup
        let roleName = roleNameOrId;
        const lowerRole = roleName.toLowerCase();
        if (lowerRole === "admin") roleName = "Admin";
        else if (lowerRole === "super_admin" || lowerRole === "super admin") roleName = "Super Admin";
        else if (lowerRole === "staff") roleName = "Staff";
        else if (lowerRole === "agent") roleName = "Agent";

        // Find role by name or ID
        const roles = await prisma.role.findMany();
        const role = roles.find(r =>
          r.id === roleNameOrId ||
          r.name.toLowerCase() === roleName.toLowerCase() ||
          r.name.toLowerCase() === roleNameOrId.toLowerCase()
        ) || null;
        if (!role) return null;

        // Find module by slug
        const moduleItem = await prisma.module.findUnique({
          where: { slug: moduleSlug }
        });
        if (!moduleItem) return null;

        return await prisma.rolePermission.findUnique({
          where: {
            roleId_moduleId: {
              roleId: role.id,
              moduleId: moduleItem.id
            }
          }
        });
      } catch (e) {
        console.error("DB Error - getRolePermission, falling back to sandbox:", e);
      }
    }
    // Sandbox fallback
    const sRole = sandboxDb.roles.findUnique(roleNameOrId);
    if (!sRole) return null;
    const sModule = sandboxDb.modules.findUnique(moduleSlug);
    if (!sModule) return null;
    const permissions = sandboxDb.rolePermissions.findMany(sRole.id);
    return permissions.find(p => p.moduleId === sModule.id) || null;
  },

  // AUDIT LOGS
  async createAuditLog(data: any) {
    const online = await ensureDbStatus();
    if (online) {
      try {
        return await prisma.auditLog.create({
          data: {
            accountId: data.accountId || null,
            userId: data.userId,
            action: data.action,
            resource: data.resource,
            resourceId: data.resourceId || null,
            ip: data.ip || null
          }
        });
      } catch (e) {
        console.error("DB Error - createAuditLog:", e);
      }
    }
    // Sandbox fallback
    const db = (sandboxDb as any).getSandboxData ? (sandboxDb as any).getSandboxData() : {};
    const newLog = {
      id: `log-${Math.random().toString(36).substr(2, 9)}`,
      accountId: data.accountId || null,
      userId: data.userId,
      action: data.action,
      resource: data.resource,
      resourceId: data.resourceId || null,
      ip: data.ip || null,
      createdAt: new Date().toISOString()
    };
    if (db.auditLogs) {
      db.auditLogs.push(newLog);
      (sandboxDb as any).saveSandboxData?.(db);
    }
    return newLog;
  },

  async getAuditLogs(accountId?: string) {
    const online = await ensureDbStatus();
    if (online) {
      try {
        return await prisma.auditLog.findMany({
          where: accountId ? { accountId } : undefined,
          orderBy: { createdAt: "desc" }
        });
      } catch (e) {
        console.error("DB Error - getAuditLogs:", e);
      }
    }
    // Sandbox fallback
    const db = (sandboxDb as any).getSandboxData ? (sandboxDb as any).getSandboxData() : {};
    const logs = db.auditLogs || [];
    if (accountId) {
      return logs.filter((l: any) => l.accountId === accountId).sort((a: any, b: any) => b.createdAt.localeCompare(a.createdAt));
    }
    return logs.sort((a: any, b: any) => b.createdAt.localeCompare(a.createdAt));
  },

  // DEPARTMENTS CRUD
  async getDepartments(accountId: string) {
    const online = await ensureDbStatus();
    if (online) {
      try {
        return await prisma.department.findMany({
          where: { accountId },
          include: { users: true },
          orderBy: { name: "asc" }
        });
      } catch (e) {
        console.error("DB Error - getDepartments:", e);
      }
    }
    return sandboxDb.departments.findMany(accountId);
  },

  async createDepartment(accountId: string, name: string) {
    const online = await ensureDbStatus();
    if (online) {
      try {
        return await prisma.department.create({
          data: { accountId, name }
        });
      } catch (e) {
        console.error("DB Error - createDepartment:", e);
        throw e;
      }
    }
    return sandboxDb.departments.create(accountId, name);
  },

  async updateDepartment(accountId: string, id: string, name: string) {
    const online = await ensureDbStatus();
    if (online) {
      try {
        return await prisma.department.update({
          where: { id },
          data: { name }
        });
      } catch (e) {
        console.error("DB Error - updateDepartment:", e);
        throw e;
      }
    }
    return sandboxDb.departments.update(accountId, id, name);
  },

  async deleteDepartment(accountId: string, id: string) {
    const online = await ensureDbStatus();
    if (online) {
      try {
        await prisma.department.delete({
          where: { id }
        });
        return true;
      } catch (e) {
        console.error("DB Error - deleteDepartment:", e);
        throw e;
      }
    }
    return sandboxDb.departments.delete(accountId, id);
  },

  async assignAgentsToDepartment(accountId: string, deptId: string, agentIds: string[]) {
    const online = await ensureDbStatus();
    if (online) {
      try {
        return await prisma.$transaction(async (tx) => {
          // Set departmentId to deptId for the assigned agents
          await tx.user.updateMany({
            where: { accountId, id: { in: agentIds } },
            data: { departmentId: deptId }
          });
          // Set departmentId to null for agents who were in this department but are not in the new list
          await tx.user.updateMany({
            where: { accountId, departmentId: deptId, id: { notIn: agentIds } },
            data: { departmentId: null }
          });
          return true;
        });
      } catch (e) {
        console.error("DB Error - assignAgentsToDepartment:", e);
        throw e;
      }
    }

    // Sandbox fallback
    const db = sandboxDb.getSandboxData();
    const dept = db.departments?.find(d => d.id === deptId && d.accountId === accountId);
    const deptName = dept?.name;
    db.agents.forEach(agent => {
      if (agent.accountId === accountId) {
        if (agentIds.includes(agent.id)) {
          agent.departmentId = deptId;
          agent.department = deptName || undefined;
        } else if (agent.departmentId === deptId || (deptName && agent.department === deptName)) {
          agent.departmentId = undefined;
          agent.department = undefined;
        }
      }
    });
    sandboxDb.saveSandboxData(db);
    return true;
  }

};

