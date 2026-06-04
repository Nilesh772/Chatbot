import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { dbService } from "./dbService";

const SECRET_KEY = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET || "super-secret-chetbot-key-12345"
);

export interface JWTPayload {
  userId: string;
  email: string;
  name?: string;
  role?: string;
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
  const token = cookieStore.get("chetbot_session")?.value;
  if (!token) return null;
  return await decrypt(token);
}

// API helper to get user model from request
export async function getCurrentUser() {
  const session = await getSession();
  if (!session) return null;
  return await dbService.getUserByEmail(session.email);
}

// Log in email
export async function loginUser(email: string, password?: string) {
  const user = await dbService.getUserByEmail(email);
  if (!user) {
    throw new Error("Invalid credentials");
  }

  // Simple local plaintext or mock password verify
  if (password && user.password && user.password !== password) {
    throw new Error("Invalid credentials");
  }

  const token = await encrypt({
    userId: user.id,
    email: user.email,
    name: user.name || undefined,
  });

  const cookieStore = await cookies();
  cookieStore.set("chetbot_session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });

  return user;
}

// Register user
export async function registerUser(email: string, name: string, password?: string) {
  const existing = await dbService.getUserByEmail(email);
  if (existing) {
    throw new Error("User already exists");
  }

  const user = await dbService.createUser(email, name, password);

  const token = await encrypt({
    userId: user.id,
    email: user.email,
    name: user.name || undefined,
  });

  const cookieStore = await cookies();
  cookieStore.set("chetbot_session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });

  return user;
}

// Log out user
export async function logoutUser() {
  const cookieStore = await cookies();
  cookieStore.delete("chetbot_session");
}
