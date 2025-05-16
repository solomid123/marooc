"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { isActivePath } from "@/lib/utils"

interface NavLinkProps {
  href: string
  exact?: boolean
  children: React.ReactNode
  className?: string
}

export function NavLink({ 
  href, 
  exact = false, 
  children,
  className
}: NavLinkProps) {
  const pathname = usePathname()
  
  // Check if the current path matches the href using the utility function
  const isActive = isActivePath(href, pathname, exact)
  
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-2 rounded-lg px-3 py-2 text-muted-foreground hover:text-foreground",
        isActive && "bg-primary/10 text-primary",
        className
      )}
    >
      {children}
    </Link>
  )
} 