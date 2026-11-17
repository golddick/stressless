import { notifications } from '../db/schema'
import { useDB } from '../utils/db'

export async function createInAppNotification(userId: string, type: string, body: string) {
  await useDB().insert(notifications).values({ userId, type, body })
}
