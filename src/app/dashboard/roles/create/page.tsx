"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RedirectToRoles() {
  const router = useRouter();
  
  useEffect(() => {
    router.replace("/dashboard/roles");
  }, [router]);

  return null;
}
