import Link from "next/link"
import * as React from "react"

import {
    NavigationMenuLink,
} from "@/components/ui/navigation-menu"

export type NavigationIconLinkProps = {
  icon: React.ElementType
  label: string
  href?: string
}

export function NavigationIconLink({
  icon: Icon,
  label,
  href = "#",
}: Readonly<NavigationIconLinkProps>): React.JSX.Element {
  return (
    <NavigationMenuLink asChild>
      <Link href={href} className="flex items-center gap-2">
        <Icon className="h-4 w-4" />
        {label}
      </Link>
    </NavigationMenuLink>
  )
}
