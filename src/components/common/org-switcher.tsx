import { useNavigate } from '@tanstack/react-router'
import { Building2, ChevronsUpDown, Eye } from 'lucide-react'
import { Button } from '~/components/ui/button'
import { Badge } from '~/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu'

interface OrgInfo {
  id: string
  name: string
  slug: string
  isDemo: boolean
  role: string
}

interface OrgSwitcherProps {
  currentSlug: string
  orgs: OrgInfo[]
}

export function OrgSwitcher({ currentSlug, orgs }: OrgSwitcherProps) {
  const navigate = useNavigate()

  const currentOrg = orgs.find((o) => o.slug === currentSlug)
  const otherOrgs = orgs.filter((o) => o.slug !== currentSlug)

  // No dropdown needed if user only has one org
  if (otherOrgs.length === 0) {
    return (
      <div className="flex items-center gap-2 px-2 py-1.5">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10">
          <Building2 className="h-3.5 w-3.5 text-primary" />
        </div>
        <span className="text-sm font-medium text-foreground">
          {currentOrg?.name ?? currentSlug}
        </span>
        {currentOrg?.isDemo && (
          <Badge variant="secondary" className="text-[9px] px-1.5 py-0 gap-0.5">
            <Eye className="h-2.5 w-2.5" />
            Demo
          </Badge>
        )}
      </div>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="flex items-center gap-2 px-2 py-1.5 h-auto"
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10">
            <Building2 className="h-3.5 w-3.5 text-primary" />
          </div>
          <span className="text-sm font-medium text-foreground">
            {currentOrg?.name ?? currentSlug}
          </span>
          {currentOrg?.isDemo && (
            <Badge variant="secondary" className="text-[9px] px-1.5 py-0 gap-0.5">
              <Eye className="h-2.5 w-2.5" />
              Demo
            </Badge>
          )}
          <ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        {otherOrgs.map((org) => (
          <DropdownMenuItem
            key={org.id}
            className="flex items-center justify-between cursor-pointer"
            onClick={() => {
              navigate({ to: '/$orgSlug', params: { orgSlug: org.slug } })
            }}
          >
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-muted">
                <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium">{org.name}</p>
                <p className="text-xs text-muted-foreground font-mono">/{org.slug}</p>
              </div>
            </div>
            {org.isDemo && (
              <Badge variant="secondary" className="text-[9px] px-1.5 py-0 gap-0.5">
                <Eye className="h-2.5 w-2.5" />
                Demo
              </Badge>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
