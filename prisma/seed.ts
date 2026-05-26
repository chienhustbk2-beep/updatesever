import { hash } from 'bcryptjs'
import { prisma } from '../src/lib/prisma'

async function main() {
  console.log('🌱 Bắt đầu seed dữ liệu...')

  // Xóa dữ liệu cũ (theo thứ tự phụ thuộc)
  console.log('🗑️  Xóa dữ liệu cũ...')
  await prisma.ticketMessage.deleteMany()
  await prisma.supportTicket.deleteMany()
  await prisma.download.deleteMany()
  await prisma.orderItem.deleteMany()
  await prisma.productKey.deleteMany()
  await prisma.order.deleteMany()
  await prisma.review.deleteMany()
  await prisma.transaction.deleteMany()
  await prisma.userCoupon.deleteMany()
  await prisma.auditLog.deleteMany()
  await prisma.coupon.deleteMany()
  await prisma.product.deleteMany()
  await prisma.category.deleteMany()
  await prisma.user.deleteMany()

  // ==================== USERS ====================
  console.log('👤 Tạo users...')

  const adminPassword = await hash('123456', 12)
  const admin = await prisma.user.create({
    data: {
      email: 'admin@shop.com',
      passwordHash: adminPassword,
      name: 'Admin Shop',
      role: 'ADMIN',
      accountCode: '100001',
      balance: 0,
    },
  })
  console.log(`  ✅ Admin: ${admin.email} / 123456`)

  const user1Password = await hash('user123', 12)
  const user1 = await prisma.user.create({
    data: {
      email: 'nguyenvana@gmail.com',
      passwordHash: user1Password,
      name: 'Nguyen Van A',
      role: 'CUSTOMER',
      accountCode: '100002',
      balance: 500000,
    },
  })
  console.log(`  ✅ User 1: ${user1.email} / user123 (Balance: 500,000đ)`)

  const user2Password = await hash('user123', 12)
  const user2 = await prisma.user.create({
    data: {
      email: 'tranb@gmail.com',
      passwordHash: user2Password,
      name: 'Tran Thi B',
      role: 'CUSTOMER',
      accountCode: '100003',
      balance: 200000,
    },
  })
  console.log(`  ✅ User 2: ${user2.email} / user123 (Balance: 200,000đ)`)

  const staffPassword = await hash('staff123', 12)
  const staff = await prisma.user.create({
    data: {
      email: 'staff@shop.com',
      passwordHash: staffPassword,
      name: 'Nhan vien Support',
      role: 'STAFF',
      accountCode: '100004',
      balance: 0,
    },
  })
  console.log(`  ✅ Staff: ${staff.email} / staff123`)

  // ==================== CATEGORIES ====================
  console.log('📁 Tạo danh mục...')

  const catSecurity = await prisma.category.create({
    data: { name: 'Bảo mật', slug: 'bao-mat', description: 'Phần mềm diệt virus, bảo mật' },
  })
  const catGame = await prisma.category.create({
    data: { name: 'Game', slug: 'game', description: 'Key game, tài khoản game' },
  })
  const catTool = await prisma.category.create({
    data: { name: 'Tool', slug: 'tool', description: 'Tool hỗ trợ, tự động hóa' },
  })
  const catOffice = await prisma.category.create({
    data: { name: 'Văn phòng', slug: 'van-phong', description: 'Phần mềm văn phòng' },
  })
  const catDesign = await prisma.category.create({
    data: { name: 'Thiết kế', slug: 'thiet-ke', description: 'Phần mềm thiết kế đồ họa' },
  })

  // ==================== PRODUCTS ====================
  console.log('📦 Tạo sản phẩm...')

  const product1 = await prisma.product.create({
    data: {
      name: 'Kaspersky Internet Security 2026',
      slug: 'kaspersky-internet-security-2026',
      description: 'Phần mềm diệt virus hàng đầu thế giới. Bảo vệ toàn diện khỏi malware, ransomware, phishing. Hỗ trợ tối đa 3 thiết bị, thời hạn 1 năm.',
      shortDesc: 'Diệt virus số 1 thế giới - 3 thiết bị/1 năm',
      price: 450000,
      salePrice: 290000,
      stock: 100,
      sku: 'KIS-2026-3DEV',
      type: 'LICENSE_KEY',
      status: 'ACTIVE',
      images: JSON.stringify(['https://placehold.co/600x400/1a73e8/ffffff?text=Kaspersky+IS']),
      categoryId: catSecurity.id,
    },
  })
  console.log(`  ✅ ${product1.name} - ${product1.salePrice?.toLocaleString('vi-VN')}đ`)

  const product2 = await prisma.product.create({
    data: {
      name: 'Tool Auto MMO Pro VIP',
      slug: 'tool-auto-mmo-pro-vip',
      description: 'Tool tự động hóa công việc MMO: đăng bài, like, share, comment tự động. Hỗ trợ đa nền tảng Facebook, TikTok, YouTube. Cập nhật liên tục, hỗ trợ 24/7.',
      shortDesc: 'Tool tự động MMO đa nền tảng',
      price: 1200000,
      salePrice: 890000,
      stock: 50,
      sku: 'TOOL-MMO-PRO',
      type: 'SOFTWARE_TOOL',
      status: 'ACTIVE',
      images: JSON.stringify(['https://placehold.co/600x400/7b1fa2/ffffff?text=Tool+MMO+Pro']),
      categoryId: catTool.id,
    },
  })
  console.log(`  ✅ ${product2.name} - ${product2.salePrice?.toLocaleString('vi-VN')}đ`)

  const product3 = await prisma.product.create({
    data: {
      name: 'Account Netflix Premium 4K',
      slug: 'account-netflix-premium-4k',
      description: 'Tài khoản Netflix Premium xem 4K Ultra HD. Sử dụng riêng 1 profile, không share. Thời hạn 1 tháng, bảo hành full thời gian sử dụng.',
      shortDesc: 'Netflix 4K - Profile riêng - 1 tháng',
      price: 220000,
      salePrice: 150000,
      stock: 200,
      sku: 'NFLX-PREM-4K',
      type: 'DIGITAL_ACCOUNT',
      status: 'ACTIVE',
      images: JSON.stringify(['https://placehold.co/600x400/e53935/ffffff?text=Netflix+4K']),
      categoryId: catGame.id,
    },
  })
  console.log(`  ✅ ${product3.name} - ${product3.salePrice?.toLocaleString('vi-VN')}đ`)

  const product4 = await prisma.product.create({
    data: {
      name: 'Windows 11 Pro License Key',
      slug: 'windows-11-pro-license-key',
      description: 'Key bản quyền Windows 11 Professional chính hãng. Active vĩnh viễn, hỗ trợ cập nhật đầy đủ. 1 key cho 1 máy.',
      shortDesc: 'Win 11 Pro - Active vĩnh viễn',
      price: 300000,
      salePrice: 120000,
      stock: 500,
      sku: 'WIN11-PRO-KEY',
      type: 'SOFTWARE_KEY',
      status: 'ACTIVE',
      images: JSON.stringify(['https://placehold.co/600x400/00a4ef/ffffff?text=Windows+11+Pro']),
      categoryId: catOffice.id,
    },
  })
  console.log(`  ✅ ${product4.name} - ${product4.salePrice?.toLocaleString('vi-VN')}đ`)

  const product5 = await prisma.product.create({
    data: {
      name: 'Adobe Creative Cloud All Apps',
      slug: 'adobe-creative-cloud-all-apps',
      description: 'Bộ Adobe CC đầy đủ: Photoshop, Illustrator, Premiere, After Effects, v.v. Tài khoản team, sử dụng 1 năm.',
      shortDesc: 'Adobe CC đầy đủ - 1 năm',
      price: 1500000,
      salePrice: 890000,
      stock: 80,
      sku: 'ADBE-CC-ALL',
      type: 'SUBSCRIPTION',
      status: 'ACTIVE',
      images: JSON.stringify(['https://placehold.co/600x400/ff0000/ffffff?text=Adobe+CC']),
      categoryId: catDesign.id,
    },
  })
  console.log(`  ✅ ${product5.name} - ${product5.salePrice?.toLocaleString('vi-VN')}đ`)

  // ==================== PRODUCT KEYS ====================
  console.log('🔑 Tạo Product Keys...')

  // Keys cho Kaspersky
  for (let i = 1; i <= 10; i++) {
    await prisma.productKey.create({
      data: {
        productId: product1.id,
        keyValue: `KIS-XXXX-XXXX-XXXX-${String(i).padStart(4, '0')}`,
        status: 'AVAILABLE',
      },
    })
  }
  console.log(`  ✅ 10 keys cho ${product1.name}`)

  // Keys cho Windows 11
  for (let i = 1; i <= 15; i++) {
    await prisma.productKey.create({
      data: {
        productId: product4.id,
        keyValue: `W11P-XXXX-XXXX-XXXX-${String(i).padStart(4, '0')}`,
        status: 'AVAILABLE',
      },
    })
  }
  console.log(`  ✅ 15 keys cho ${product4.name}`)

  // Keys cho Netflix
  for (let i = 1; i <= 20; i++) {
    await prisma.productKey.create({
      data: {
        productId: product3.id,
        keyValue: `NFLX-EMAIL-${String(i).padStart(3, '0')}@temp.com / Pass: Netflix${i}!`,
        status: 'AVAILABLE',
      },
    })
  }
  console.log(`  ✅ 20 keys cho ${product3.name}`)

  // Keys cho Tool MMO
  for (let i = 1; i <= 5; i++) {
    await prisma.productKey.create({
      data: {
        productId: product2.id,
        keyValue: `TOOL-MMO-LICENSE-${String(i).padStart(4, '0')}-VIP`,
        status: 'AVAILABLE',
      },
    })
  }
  console.log(`  ✅ 5 keys cho ${product2.name}`)

  // ==================== ORDERS ====================
  console.log('🛒 Tạo đơn hàng mẫu...')

  // Order 1 - COMPLETED
  const order1 = await prisma.order.create({
    data: {
      orderNumber: `ORD-${Date.now() - 86400000 * 5}-A1B2`,
      userId: user1.id,
      totalAmount: 290000,
      discountAmount: 0,
      finalAmount: 290000,
      status: 'COMPLETED',
      paymentMethod: 'BALANCE',
      paymentStatus: 'PAID',
      customerEmail: user1.email,
      customerName: user1.name || '',
      items: {
        create: {
          productId: product1.id,
          quantity: 1,
          price: 290000,
          total: 290000,
        },
      },
    },
  })
  console.log(`  ✅ ${order1.orderNumber} - COMPLETED - ${user1.name} - 290,000đ`)

  // Order 2 - PENDING
  const order2 = await prisma.order.create({
    data: {
      orderNumber: `ORD-${Date.now() - 86400000 * 2}-C3D4`,
      userId: user2.id,
      totalAmount: 150000,
      discountAmount: 0,
      finalAmount: 150000,
      status: 'PENDING',
      paymentMethod: 'BANK_TRANSFER',
      paymentStatus: 'UNPAID',
      customerEmail: user2.email,
      customerName: user2.name || '',
      note: 'Khách hàng cần hỗ trợ thanh toán',
      items: {
        create: {
          productId: product3.id,
          quantity: 1,
          price: 150000,
          total: 150000,
        },
      },
    },
  })
  console.log(`  ✅ ${order2.orderNumber} - PENDING - ${user2.name} - 150,000đ`)

  // Order 3 - CANCELLED
  const order3 = await prisma.order.create({
    data: {
      orderNumber: `ORD-${Date.now() - 86400000}-E5F6`,
      userId: user1.id,
      totalAmount: 890000,
      discountAmount: 0,
      finalAmount: 890000,
      status: 'CANCELLED',
      paymentMethod: 'BANK_TRANSFER',
      paymentStatus: 'FAILED',
      customerEmail: user1.email,
      customerName: user1.name || '',
      note: 'Khách hủy do đổi ý',
      items: {
        create: {
          productId: product2.id,
          quantity: 1,
          price: 890000,
          total: 890000,
        },
      },
    },
  })
  console.log(`  ✅ ${order3.orderNumber} - CANCELLED - ${user1.name} - 890,000đ`)

  // Order 4 - PROCESSING
  const order4 = await prisma.order.create({
    data: {
      orderNumber: `ORD-${Date.now() - 3600000}-G7H8`,
      userId: user2.id,
      totalAmount: 410000,
      discountAmount: 0,
      finalAmount: 410000,
      status: 'PROCESSING',
      paymentMethod: 'BANK_TRANSFER',
      paymentStatus: 'PAID',
      customerEmail: user2.email,
      customerName: user2.name || '',
      items: {
        create: [
          {
            productId: product4.id,
            quantity: 2,
            price: 120000,
            total: 240000,
          },
          {
            productId: product3.id,
            quantity: 1,
            price: 150000,
            total: 150000,
          },
        ],
      },
    },
  })
  console.log(`  ✅ ${order4.orderNumber} - PROCESSING - ${user2.name} - 410,000đ`)

  // Order 5 - COMPLETED (multiple items)
  const order5 = await prisma.order.create({
    data: {
      orderNumber: `ORD-${Date.now() - 86400000 * 3}-I9J0`,
      userId: user1.id,
      totalAmount: 1180000,
      discountAmount: 0,
      finalAmount: 1180000,
      status: 'COMPLETED',
      paymentMethod: 'BALANCE',
      paymentStatus: 'PAID',
      customerEmail: user1.email,
      customerName: user1.name || '',
      items: {
        create: [
          {
            productId: product5.id,
            quantity: 1,
            price: 890000,
            total: 890000,
          },
          {
            productId: product1.id,
            quantity: 1,
            price: 290000,
            total: 290000,
          },
        ],
      },
    },
  })
  console.log(`  ✅ ${order5.orderNumber} - COMPLETED - ${user1.name} - 1,180,000đ`)

  // ==================== COUPONS ====================
  console.log('🎫 Tạo coupons...')

  await prisma.coupon.create({
    data: {
      code: 'WELCOME10',
      description: 'Giảm 10% cho đơn hàng đầu tiên',
      type: 'PERCENTAGE',
      value: 10,
      maxUses: 100,
      usedCount: 0,
      minOrderAmount: 100000,
      validFrom: new Date(),
      validUntil: new Date(Date.now() + 30 * 86400000),
      isActive: true,
    },
  })

  await prisma.coupon.create({
    data: {
      code: 'SAVE50K',
      description: 'Giảm 50K cho đơn từ 300K',
      type: 'FIXED_AMOUNT',
      value: 50000,
      maxUses: 50,
      usedCount: 0,
      minOrderAmount: 300000,
      validFrom: new Date(),
      validUntil: new Date(Date.now() + 60 * 86400000),
      isActive: true,
    },
  })

  console.log('  ✅ 2 coupons: WELCOME10, SAVE50K')

  console.log('\n🎉 Seed dữ liệu hoàn tất!')
}

main()
  .catch((e) => {
    console.error('❌ Lỗi seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
