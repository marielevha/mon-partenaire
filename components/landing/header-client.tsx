"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/components/ui/utils";
import { logoutAction } from "@/app/auth/actions";

interface HeaderClientProps {
  initialSession: any | null;
}

export function HeaderClient({ initialSession }: HeaderClientProps) {
  const [displayName, setDisplayName] = useState<string | null>(
    // prefer full_name from server session, fallback to email
    initialSession?.user?.user_metadata?.full_name ??
      initialSession?.user?.email ??
      null
  );

  useEffect(() => {
    // Prefer stored full name, then stored email
    const storedFullName = localStorage.getItem("user_full_name");
    const storedEmail = localStorage.getItem("user_email");
    if (storedFullName) {
      setDisplayName(storedFullName);
    } else if (storedEmail) {
      setDisplayName(storedEmail);
    }
  }, []);

  const handleLogout = async () => {
    localStorage.removeItem("user_email");
    await logoutAction();
  };

  return (
    <div className="flex items-center gap-3">
      {displayName ? (
        <div className="flex items-center gap-3">
          <span className="text-sm text-text-secondary">{displayName}</span>
          <button
            onClick={handleLogout}
            className={cn(buttonVariants({ variant: "primary", size: "sm" }))}
          >
            Se déconnecter
          </button>
        </div>
      ) : (
        <div className="hidden items-center gap-2 sm:flex">
          <Link
            href="/auth/login"
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
          >
            Se connecter
          </Link>
          <Link
            href="/auth/signup"
            className={cn(buttonVariants({ variant: "primary", size: "sm" }))}
          >
            Créer un compte
          </Link>
        </div>
      )}
    </div>
  );
}
