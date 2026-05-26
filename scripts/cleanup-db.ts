import { cleanupOldVisitLogs, cleanupOldSessions } from '../src/lib/cleanup'

async function main() {
  console.log('[Cleanup] Starting...')
  const deletedLogs = await cleanupOldVisitLogs()
  const deletedSessions = await cleanupOldSessions()
  console.log(`[Cleanup] Deleted ${deletedLogs} visit logs, ${deletedSessions} sessions`)
}

main().catch((e) => {
  console.error('[Cleanup] Failed:', e)
  process.exit(1)
})
