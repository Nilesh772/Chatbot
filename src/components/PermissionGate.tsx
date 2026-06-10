"use client";

import React from "react";
import { useAuth } from "@/context/AuthContext";

interface PermissionGateProps {
  permission: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export default function PermissionGate({
  permission,
  children,
  fallback = null,
}: PermissionGateProps) {
  const { can } = useAuth();

  if (can(permission)) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
}
export { PermissionGate };
