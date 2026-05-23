import { prisma } from '../src/lib/prisma';

const DEFAULT_ELEMENTS = [
  { name: 'Hero Banner', key: 'hero_banner', section: 'homepage', position: 'top' },
  { name: 'Features Section', key: 'features_section', section: 'homepage', position: 'middle' },
  { name: 'Products Section', key: 'products_section', section: 'homepage', position: 'middle' },
  { name: 'Why Choose Us', key: 'why_choose_us', section: 'homepage', position: 'middle' },
  { name: 'CTA - Sẵn sàng trải nghiệm', key: 'trust_badges', section: 'homepage', position: 'bottom' },
  { name: 'Header Logo', key: 'header_logo', section: 'header', position: 'left' },
  { name: 'Header Search', key: 'header_search', section: 'header', position: 'center' },
  { name: 'Header Cart', key: 'header_cart', section: 'header', position: 'right' },
  { name: 'Header User Menu', key: 'header_user', section: 'header', position: 'right' },
  { name: 'Header Deposit', key: 'header_deposit', section: 'header', position: 'right' },
  { name: 'Header Theme Toggle', key: 'header_theme', section: 'header', position: 'right' },
  { name: 'Footer', key: 'footer', section: 'footer', position: 'bottom' },
  { name: 'Product Reviews', key: 'product_reviews', section: 'product', position: 'bottom' },
  { name: 'Related Products', key: 'related_products', section: 'product', position: 'bottom' },
  { name: 'Dashboard Balance', key: 'dashboard_balance', section: 'dashboard', position: 'top' },
  { name: 'Dashboard Orders', key: 'dashboard_orders', section: 'dashboard', position: 'middle' },
  { name: 'Dashboard Keys', key: 'dashboard_keys', section: 'dashboard', position: 'bottom' },
];

async function seed() {
  console.log('Seeding UI elements...');
  for (const def of DEFAULT_ELEMENTS) {
    const existing = await prisma.uIElement.findUnique({ where: { key: def.key } });
    if (existing) {
      await prisma.uIElement.update({
        where: { id: existing.id },
        data: { name: def.name, section: def.section, position: def.position },
      });
      console.log(`  Updated: ${def.key} -> section="${def.section}"`);
    } else {
      await prisma.uIElement.create({
        data: { ...def, isVisible: true, sortOrder: 0 },
      });
      console.log(`  Created: ${def.key}`);
    }
  }
  console.log('Done!');
  await prisma.$disconnect();
}

seed().catch((e) => {
  console.error(e);
  prisma.$disconnect();
});
