import { prisma } from '../src/lib/prisma'

async function main() {
  console.log('Cleaning up seed data...')

  await prisma.ticketMessage.deleteMany()
  await prisma.supportTicket.deleteMany()
  await prisma.download.deleteMany()
  await prisma.orderItem.deleteMany()
  await prisma.productKey.deleteMany()
  await prisma.order.deleteMany()
  await prisma.review.deleteMany()
  await prisma.transaction.deleteMany()
  await prisma.userCoupon.deleteMany()
  await prisma.coupon.deleteMany()
  await prisma.product.deleteMany()
  await prisma.category.deleteMany()
  await prisma.visitLog.deleteMany()
  await prisma.activeSession.deleteMany()
  await prisma.auditLog.deleteMany()

  console.log('All seed data cleared (admin user preserved)')
  await prisma.$disconnect()
}

main()
