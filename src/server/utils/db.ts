import { Pool, neonConfig } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-serverless'
import ws from 'ws'
import * as schema from '../db/schema'

neonConfig.webSocketConstructor = ws as any
const create = () => drizzle(new Pool({ connectionString: process.env.DATABASE_URL }), { schema })
let _db: ReturnType<typeof create> | undefined

export const useDB = () => (_db ??= create())
export type DB = ReturnType<typeof useDB>
