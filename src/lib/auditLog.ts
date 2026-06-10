import { dbService } from "./dbService";

export async function logAction(
  userId: string, // Email of the user/team member
  action: string, // e.g., LOGIN, CREATE_BOT, UPDATE_BOT
  resource: string, // e.g., bot, team_member, session
  resourceId?: string,
  ip?: string
) {
  try {
    let accountId = "acc-super-admin";
    
    // Find account mapping for the user email
    const member = await dbService.getTeamMemberByEmail(userId);
    if (member) {
      accountId = member.accountId;
    }
    
    await dbService.createAuditLog({
      accountId,
      userId,
      action,
      resource,
      resourceId,
      ip,
    });
    console.log(`[AUDIT LOG] ${action} on ${resource} by ${userId} (Account: ${accountId})`);
  } catch (error) {
    console.error("Audit log execution failed:", error);
  }
}
