import { prisma } from '../src/lib/prisma'

async function main() {
  const settings: Record<string, string> = {
    siteName: 'ChienHust Store',
    siteDescription: 'Cửa hàng phần mềm và key bản quyền uy tín',
    enableCaptcha: 'false',
  }

  for (const [key, value] of Object.entries(settings)) {
    const existing = await prisma.systemSettings.findUnique({ where: { key } })
    if (existing) {
      await prisma.systemSettings.update({ where: { key }, data: { value } })
    } else {
      await prisma.systemSettings.create({ data: { key, value } })
    }
    console.log(`Set ${key} = ${value}`)
  }

  await prisma.$disconnect()
}

main()
