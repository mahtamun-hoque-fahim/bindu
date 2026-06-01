export type AdminStats = {
  users: {
    total: number
    new24h: number
    new7d: number
    banned: number
    staff: number
    admin: number
    plus: number
  }
  messages: { total: number; sent24h: number; sent7d: number }
  flags: { total: number; pending: number; resolved: number }
  moderation: { bannedIps: number; mutes: number }
  reactions: number
}

export type AdminUser = {
  id: string
  username: string
  displayName: string | null
  theme: 'sunset' | 'acid' | 'dream'
  plan: 'free' | 'plus'
  isStaff: boolean
  isAdmin: boolean
  isBanned: boolean
  bannedAt: string | null
  bannedReason: string | null
  createdAt: string
}

export type UserCounts = {
  total: number
  banned: number
  staff: number
  admin: number
  plus: number
}

export type BannedIp = {
  id: string
  ip: string
  reason: string | null
  bannedBy: string
  createdAt: string
}

export type AuditEntry = {
  id: string
  actorId: string
  actorUsername: string | null
  action: string
  targetType: string | null
  targetId: string | null
  metadata: Record<string, unknown> | null
  createdAt: string
}

export type Tab = 'overview' | 'users' | 'ips' | 'audit'
