import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { dbService } from "./dbService";
import { prisma } from "./db";

const SECRET_KEY = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET || "super-secret-chatbot-key-12345"
);

export interface JWTPayload {
  userId: string;
  email: string;
  name?: string;
  role?: string;        // "Super Admin" | "Admin" | "Agent" etc.
  accountId?: string;   // account ID
  teamMemberId?: string; // kept for backward compat
  agentId?: string;
  permissions?: string[];
}

export async function encrypt(payload: JWTPayload) {
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(SECRET_KEY);
}

export async function decrypt(input: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(input, SECRET_KEY, {
      algorithms: ["HS256"],
    });
    return payload as unknown as JWTPayload;
  } catch (error) {
    return null;
  }
}

// Client session lookup
export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get("chatbot_session")?.value;
  if (!token) return null;
  return await decrypt(token);
}

// API helper — returns user from the User table based on session
export async function getCurrentUser() {
  const session = await getSession();
  if (!session) return null;

  // Look up User table by email (single source of truth)
  const user = await dbService.getUserByEmail(session.email);
  if (!user) return null;

  const userRole = (user as any).roleRelation?.name || (user as any).role || "Agent";
  
  // Platform-level Super Admin has email "admin@chatbot.com" or accountId "acc-super-admin"
  const isPlatformAdmin = 
    user.email === "admin@chatbot.com" || 
    (user as any).accountId === "acc-super-admin";

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    image: (user as any).image ?? null,
    role: isPlatformAdmin ? "super_admin" : userRole,
    accountId: isPlatformAdmin ? "acc-super-admin" : (user as any).accountId,
    permissions: (user as any).permissions as string[] | undefined,
    department: (user as any).department,
    departmentId: (user as any).departmentId || null,
  };
}

// Raw session payload (for internal use)
export async function getSessionPayload() {
  return await getSession();
}

// Log in — queries User table by email, then verifies password
export async function loginUser(email: string, password?: string) {
  const online = await dbService.isSandboxMode().then(s => !s);

  if (online) {
    // Query the single User table
    const user = await dbService.getUserByEmail(email);

    if (!user) {
      throw new Error("Invalid credentials");
    }

    if (password && user.password && user.password !== password) {
      throw new Error("Invalid credentials");
    }

    if ((user as any).status === "inactive") {
      throw new Error("Your account has been deactivated.");
    }

    // Fetch role relation and permissions from DB
    let fullUser: any = user;
    try {
      fullUser = await prisma.user.findUnique({
        where: { email },
        include: { roleRelation: { include: { permissions: { include: { module: true } } } } }
      });
    } catch {
      // fall back to basic user
    }

    const userRole = fullUser?.roleRelation?.name || fullUser?.role || "Agent";
    
    // Platform-level Super Admin has email "admin@chatbot.com" or accountId "acc-super-admin"
    const isPlatformAdmin = 
      email === "admin@chatbot.com" || 
      fullUser?.accountId === "acc-super-admin";

    // Build permissions list from roleRelation permissions
    let permissions: string[] = [];
    if (Array.isArray(fullUser?.permissions)) {
      permissions = fullUser.permissions as string[];
    } else if (fullUser?.roleRelation?.permissions) {
      permissions = fullUser.roleRelation.permissions
        .filter((p: any) => p.canView)
        .map((p: any) => p.module?.slug || "");
    }

    const token = await encrypt({
      userId: fullUser.id,
      email: fullUser.email,
      name: fullUser.name || undefined,
      role: isPlatformAdmin ? "super_admin" : userRole,
      accountId: isPlatformAdmin ? "acc-super-admin" : fullUser.accountId,
      teamMemberId: fullUser.id,
      permissions,
    });

    const cookieStore = await cookies();
    cookieStore.set("chatbot_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return {
      id: fullUser.id,
      email: fullUser.email,
      name: fullUser.name,
      role: isPlatformAdmin ? "super_admin" : userRole,
      accountId: isPlatformAdmin ? "acc-super-admin" : fullUser.accountId,
      permissions,
    };
  }

  // ---------- Sandbox fallback ----------
  const sandboxUser = await dbService.getUserByEmail(email);
  if (!sandboxUser) {
    // Try sandbox agents
    try {
      const { sandboxDb } = await import("./sandboxDb");
      const allAgents = sandboxDb.agents.findMany("usr-admin");
      const agent = allAgents.find((a: any) => a.email === email) || null;
      if (agent) {
        if (password && agent.password && agent.password !== password) {
          throw new Error("Invalid credentials");
        }
        const token = await encrypt({
          userId: "usr-admin",
          email: agent.email,
          name: agent.name || undefined,
          role: "agent",
          accountId: "acc-super-admin",
          teamMemberId: agent.id,
          permissions: ["conversations:view", "conversations:manage"],
        });
        const cookieStore = await cookies();
        cookieStore.set("chatbot_session", token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
          maxAge: 60 * 60 * 24 * 7,
        });
        return {
          id: agent.id,
          email: agent.email,
          name: agent.name,
          role: "agent" as const,
          accountId: "acc-super-admin",
          permissions: ["conversations:view", "conversations:manage"],
        };
      }
    } catch {}
    throw new Error("Invalid credentials");
  }

  if (password && sandboxUser.password && sandboxUser.password !== password) {
    throw new Error("Invalid credentials");
  }

  const token = await encrypt({
    userId: sandboxUser.id,
    email: sandboxUser.email,
    name: sandboxUser.name || undefined,
    role: "super_admin",
    accountId: "acc-super-admin",
  });
  const cookieStore = await cookies();
  cookieStore.set("chatbot_session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return {
    id: sandboxUser.id,
    email: sandboxUser.email,
    name: sandboxUser.name,
    role: "super_admin" as const,
    accountId: "acc-super-admin",
    permissions: [] as string[],
  };
}

// Register user — Step 1: Create Account, Step 2: Find Super Admin role, Step 3: Create User
export async function registerUser(email: string, name: string, password?: string, company?: string) {
  // Check if email already taken
  const existingUser = await dbService.getUserByEmail(email);
  if (existingUser) {
    throw new Error("User already exists");
  }

  // Step 1: Create the Account
  const account = await dbService.createAccount(company || `${name}'s Workspace`, email, "free");
  if (!account) {
    throw new Error("Failed to create account");
  }

  // Step 2: Find the Super Admin roleId
  let superAdminRoleId: string | null = null;
  try {
    const superAdminRole = await prisma.role.findUnique({ where: { name: "Super Admin" } });
    superAdminRoleId = superAdminRole?.id || "role-super-admin";
  } catch {
    superAdminRoleId = "role-super-admin";
  }

  // Step 3: Create the User with accountId + Super Admin role
  const permissions = [
    "bots:view",
    "bots:manage",
    "conversations:view",
    "conversations:manage",
    "leads:view",
    "leads:manage",
    "team:view",
    "team:manage",
    "analytics:view",
  ];

  const user = await dbService.createUser(
    email,
    name,
    password,
    account.id,
    "Super Admin",
    superAdminRoleId || undefined
  );

  if (!user) {
    throw new Error("Failed to create user");
  }

  const token = await encrypt({
    userId: user.id,
    email: user.email,
    name: user.name || undefined,
    role: "Super Admin",
    accountId: account.id,
    teamMemberId: user.id,
    permissions,
  });

  const cookieStore = await cookies();
  cookieStore.set("chatbot_session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: "Super Admin" as const,
    accountId: account.id,
    permissions,
  };
}

// Log out user
export async function logoutUser() {
  const cookieStore = await cookies();
  cookieStore.delete("chatbot_session");
}
