import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { auth } from '@clerk/tanstack-react-start/server'
import { prisma } from '~/lib/prisma'

export const fetchClerkAuth = createServerFn({ method: 'GET' })
  .handler(async () => {
    const { userId } = await auth()
    return { userId }
  })

export const superAdminLogin = createServerFn({ method: 'POST' })
  .inputValidator(z.object({
    email: z.string().email(),
    password: z.string().min(1),
  }))
  .handler(async ({ data }) => {
    const superAdmin = await prisma.superAdmin.findUnique({
      where: { email: data.email },
    })

    if (!superAdmin) {
      throw new Error('Invalid credentials')
    }

    // TODO: Use argon2 to verify password
    // import { verify } from 'argon2'
    // const valid = await verify(superAdmin.passwordHash, data.password)
    // if (!valid) throw new Error('Invalid credentials')

    // TODO: Create and return a session token
    // For now, return a placeholder
    return {
      token: 'placeholder-token',
      admin: { id: superAdmin.id, email: superAdmin.email, name: superAdmin.name },
    }
  })
