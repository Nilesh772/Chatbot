import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { dbService } from "@/lib/dbService";
import { logAction } from "@/lib/auditLog";

function isSuperAdmin(user: any): boolean {
  return user && user.role === "super_admin";
}

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!isSuperAdmin(user)) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const accounts = await dbService.getAllAccounts();
    return NextResponse.json({ success: true, accounts });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Failed to fetch accounts" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!isSuperAdmin(user)) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const { company, owner, plan } = await request.json();

    if (!company || !owner) {
      return NextResponse.json({ success: false, error: "Company name and owner email are required" }, { status: 400 });
    }

    const account = await dbService.createAccount(company, owner, plan || "free");
    if (!account) {
      return NextResponse.json({ success: false, error: "Failed to create account" }, { status: 500 });
    }

    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || undefined;
    await logAction(user!.email, "CREATE_ACCOUNT", "account", account.id, ip);

    return NextResponse.json({ success: true, account });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Failed to create account" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!isSuperAdmin(user)) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const { id, company, owner, plan, status } = await request.json();

    if (!id) {
      return NextResponse.json({ success: false, error: "Account ID is required" }, { status: 400 });
    }

    const updates: any = {};
    if (company !== undefined) updates.company = company;
    if (owner !== undefined) updates.owner = owner;
    if (plan !== undefined) updates.plan = plan;
    if (status !== undefined) updates.status = status;

    const account = await dbService.updateAccount(id, updates);
    if (!account) {
      return NextResponse.json({ success: false, error: "Account not found" }, { status: 404 });
    }

    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || undefined;
    await logAction(user!.email, "UPDATE_ACCOUNT", "account", id, ip);

    return NextResponse.json({ success: true, account });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Failed to update account" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!isSuperAdmin(user)) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "Account ID is required" }, { status: 400 });
    }

    if (id === "acc-super-admin") {
      return NextResponse.json({ success: false, error: "Cannot delete the default platform account" }, { status: 400 });
    }

    const success = await dbService.deleteAccount(id);
    if (!success) {
      return NextResponse.json({ success: false, error: "Account not found" }, { status: 404 });
    }

    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || undefined;
    await logAction(user!.email, "DELETE_ACCOUNT", "account", id, ip);

    return NextResponse.json({ success: true, message: "Account deleted successfully" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Failed to delete account" }, { status: 500 });
  }
}
