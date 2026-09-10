// Auto-generated from your database schema — do not edit by hand.
// Regenerates automatically whenever a table is created or altered.

export type PublicDrawingsRow = {
  id: string
  userId: string
  title: string
  canvasData: string
  width: number | string
  height: number | string
  isPublic: boolean
  createdAt: string
  updatedAt: string
}

export type UsersRow = {
  id: string
  email: string
  emailVerified: number | string | null
  displayName: string | null
  avatarUrl: string | null
  phone: string | null
  phoneVerified: number | string | null
  role: string | null
  metadata: string | null
  createdAt: string
  updatedAt: string
  lastSignIn: string
}
