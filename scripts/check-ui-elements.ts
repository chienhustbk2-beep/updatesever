import { prisma } from '../src/lib/prisma';

async function check() {
  const elements = await prisma.uIElement.findMany({ orderBy: [{ section: 'asc' }, { sortOrder: 'asc' }] });
  for (const el of elements) {
    console.log(`${el.key.padEnd(30)} section="${el.section}" position="${el.position}" visible=${el.isVisible}`);
  }
  await prisma.$disconnect();
}
check();
