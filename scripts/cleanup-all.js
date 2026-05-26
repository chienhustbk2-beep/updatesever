const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('=== CLEANUP ===\n');

  const admins = await prisma.user.findMany({
    where: { role: { in: ['ADMIN', 'STAFF'] } },
    select: { id: true, email: true, role: true },
  });
  console.log('Keep ' + admins.length + ' admin/staff:');
  admins.forEach(a => console.log('  - ' + a.email + ' (' + a.role + ')'));
  const adminIds = admins.map(a => a.id);

  await prisma.ticketMessage.deleteMany({}); console.log('1. TicketMessage deleted');
  await prisma.supportTicket.deleteMany({}); console.log('2. SupportTicket deleted');
  await prisma.download.deleteMany({}); console.log('3. Download deleted');
  await prisma.userCoupon.deleteMany({}); console.log('4. UserCoupon deleted');
  await prisma.review.deleteMany({}); console.log('5. Review deleted');

  // Reset product keys
  await prisma.productKey.updateMany({
    where: { OR: [{ status: 'SOLD' }, { orderItemId: { not: null } }] },
    data: { status: 'AVAILABLE', orderItemId: null, soldAt: null },
  });
  console.log('6. ProductKeys reset to AVAILABLE');

  await prisma.orderItem.deleteMany({}); console.log('7. OrderItem deleted');
  await prisma.order.deleteMany({}); console.log('8. Order deleted');
  await prisma.transaction.deleteMany({}); console.log('9. Transaction deleted');
  await prisma.auditLog.deleteMany({}); console.log('10. AuditLog deleted');
  await prisma.activeSession.deleteMany({}); console.log('11. ActiveSession deleted');
  await prisma.visitLog.deleteMany({}); console.log('12. VisitLog deleted');

  if (adminIds.length > 0) {
    const r = await prisma.user.deleteMany({ where: { id: { notIn: adminIds } } });
    console.log('13. Deleted ' + r.count + ' users (kept ' + adminIds.length + ' admins)');
  } else {
    console.log('13. No admins found, keeping all users');
  }

  console.log('\n=== DONE ===');
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
