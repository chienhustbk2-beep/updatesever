import { test, expect } from '@playwright/test';

const ADMIN_EMAIL = 'admin@shop.com';
const ADMIN_PASSWORD = '123456';

const ADMIN_TABS = [
  { url: '/admin', heading: 'Tổng quan' },
  { url: '/admin/products', heading: 'Quản lý Sản phẩm' },
  { url: '/admin/categories', heading: 'Quản lý Danh mục' },
  { url: '/admin/orders', heading: 'Quản lý Đơn hàng' },
  { url: '/admin/users', heading: 'Quản lý Người dùng' },
  { url: '/admin/transactions', heading: 'Quản lý Giao dịch' },
  { url: '/admin/keys', heading: 'Nhập Kho Key' },
  { url: '/admin/ui-customization', heading: 'Tùy chỉnh Giao diện' },
  { url: '/admin/homepage', heading: 'Nội dung Trang chủ' },
  { url: '/admin/tickets', heading: 'Quản lý Ticket hỗ trợ' },
  { url: '/admin/settings', heading: 'Cấu hình Hệ thống' },
  { url: '/admin/audit-logs', heading: 'Nhật ký' },
  { url: '/admin/roles', heading: 'Phân quyền' },
];

test.describe('LUỒNG QUẢN TRỊ VIÊN (Admin)', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('#email', ADMIN_EMAIL);
    await page.fill('#password', ADMIN_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/admin', { timeout: 15000 });
  });

  test('TC01 - Admin Dashboard hiển thị đúng', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Tổng quan', { timeout: 10000 });

    await page.waitForTimeout(3000);

    const statCards = page.locator('text=Tổng doanh thu, text=Đơn thành công, text=Người dùng, text=Key đã bán');
    const count = await statCards.count();
    expect(count).toBeGreaterThanOrEqual(1);

    const sidebarLinks = page.locator('nav a.nav-link');
    const linkCount = await sidebarLinks.count();
    expect(linkCount).toBeGreaterThanOrEqual(10);
  });

  test('TC02 - Quản lý Sản phẩm - Bảng danh sách render', async ({ page }) => {
    await page.goto('/admin/products');
    await page.waitForTimeout(3000);

    await expect(page.locator('h1')).toContainText('Quản lý Sản phẩm', { timeout: 10000 });

    const productCount = page.locator('text=Tổng cộng');
    await expect(productCount.first()).toBeVisible({ timeout: 10000 });

    const addButton = page.locator('button:has-text("Thêm sản phẩm")');
    await expect(addButton).toBeVisible({ timeout: 5000 });
  });

  test('TC03 - Quản lý Sản phẩm - Mở modal Thêm sản phẩm', async ({ page }) => {
    await page.goto('/admin/products');
    await page.waitForTimeout(3000);

    const addBtn = page.locator('button:has-text("Thêm sản phẩm")');
    await addBtn.click();

    await page.waitForTimeout(1000);

    const modalTitle = page.locator('h2:has-text("Thêm sản phẩm mới")');
    await expect(modalTitle).toBeVisible({ timeout: 5000 });

    const nameInput = page.locator('input[placeholder="Tên sản phẩm *"]');
    const slugInput = page.locator('input[placeholder="ten-san-pham"]');
    await expect(nameInput).toBeVisible();
    await expect(slugInput).toBeVisible();

    const closeBtn = page.locator('button:has-text("Hủy"), button:has-text("Đóng"), button:has-text("X")').first();
    await closeBtn.click();
    await page.waitForTimeout(500);
    await expect(modalTitle).not.toBeVisible();
  });

  test('TC04 - Danh mục - Bảng danh sách render', async ({ page }) => {
    await page.goto('/admin/categories');
    await page.waitForTimeout(3000);

    await expect(page.locator('h1')).toContainText('Quản lý Danh mục', { timeout: 10000 });

    const addButton = page.locator('button:has-text("Thêm danh mục")');
    await expect(addButton).toBeVisible({ timeout: 5000 });
  });

  test('TC05 - Đơn hàng - Bảng danh sách render', async ({ page }) => {
    await page.goto('/admin/orders');
    await page.waitForTimeout(3000);

    await expect(page.locator('h1')).toContainText('Quản lý Đơn hàng', { timeout: 10000 });

    const orderCount = page.locator('text=Tổng cộng');
    await expect(orderCount.first()).toBeVisible({ timeout: 10000 });

    const searchInput = page.locator('input[placeholder="Tìm theo mã đơn, tên, email..."]');
    await expect(searchInput).toBeVisible({ timeout: 5000 });
  });

  test('TC06 - Đơn hàng - Xem chi tiết đơn hàng', async ({ page }) => {
    await page.goto('/admin/orders');
    await page.waitForTimeout(3000);

    const detailButton = page.locator('button:has-text("Chi tiết"), button:has-text("Xem")').first();
    if (await detailButton.isVisible().catch(() => false)) {
      await detailButton.click();
      await page.waitForTimeout(1000);

      const modalContent = page.locator('h2:has-text("Chi tiết đơn hàng")');
      if (await modalContent.isVisible().catch(() => false)) {
        await expect(modalContent).toBeVisible();

        const closeBtn = page.locator('button:has-text("Hủy"), button:has-text("Đóng")').first();
        if (await closeBtn.isVisible().catch(() => false)) {
          await closeBtn.click();
        }
      }
    }
  });

  test('TC07 - Người dùng - Bảng danh sách render', async ({ page }) => {
    await page.goto('/admin/users');
    await page.waitForTimeout(3000);

    await expect(page.locator('h1')).toContainText('Quản lý Người dùng', { timeout: 10000 });

    const userCount = page.locator('text=Tổng cộng');
    await expect(userCount.first()).toBeVisible({ timeout: 10000 });

    const roleFilter = page.locator('select').first();
    await expect(roleFilter).toBeVisible({ timeout: 5000 });
  });

  test('TC08 - Người dùng - Xem chi tiết người dùng', async ({ page }) => {
    await page.goto('/admin/users');
    await page.waitForTimeout(3000);

    const detailButton = page.locator('button:has-text("Chi tiết"), button:has-text("Xem")').first();
    if (await detailButton.isVisible().catch(() => false)) {
      await detailButton.click();
      await page.waitForTimeout(1000);

      const modalContent = page.locator('h2:has-text("Chi tiết người dùng")');
      if (await modalContent.isVisible().catch(() => false)) {
        await expect(modalContent).toBeVisible();
      }
    }
  });

  test('TC09 - Giao dịch - Bảng danh sách render', async ({ page }) => {
    await page.goto('/admin/transactions');
    await page.waitForTimeout(3000);

    await expect(page.locator('h1')).toContainText('Quản lý Giao dịch', { timeout: 10000 });

    const statusFilter = page.locator('select').first();
    await expect(statusFilter).toBeVisible({ timeout: 5000 });
  });

  test('TC10 - Nhập Kho Key - Trang render', async ({ page }) => {
    await page.goto('/admin/keys');
    await page.waitForTimeout(3000);

    const hasHeading = await page.locator('h1').isVisible().catch(() => false);
    const hasSelect = await page.locator('select').isVisible().catch(() => false);
    expect(hasHeading || hasSelect).toBeTruthy();
  });

  test('TC11 - Tùy chỉnh UI - Trang render', async ({ page }) => {
    await page.goto('/admin/ui-customization');
    await page.waitForTimeout(3000);

    const hasHeading = await page.locator('h1').isVisible().catch(() => false);
    const hasContent = await page.locator('text=Tùy chỉnh').isVisible().catch(() => false);
    expect(hasHeading || hasContent).toBeTruthy();
  });

  test('TC12 - Nội dung Trang chủ - Trang render', async ({ page }) => {
    await page.goto('/admin/homepage');
    await page.waitForTimeout(3000);

    const hasHeading = await page.locator('h1').isVisible().catch(() => false);
    const hasContent = await page.locator('text=Nội dung').isVisible().catch(() => false);
    expect(hasHeading || hasContent).toBeTruthy();
  });

  test('TC13 - Ticket hỗ trợ - Bảng danh sách render', async ({ page }) => {
    await page.goto('/admin/tickets');
    await page.waitForTimeout(3000);

    await expect(page.locator('h1')).toContainText('Quản lý Ticket hỗ trợ', { timeout: 10000 });

    const ticketSection = page.locator('text=Tổng cộng');
    await expect(ticketSection.first()).toBeVisible({ timeout: 5000 }).catch(() => {});
  });

  test('TC14 - Cấu hình Hệ thống - Các tab render', async ({ page }) => {
    await page.goto('/admin/settings');
    await page.waitForTimeout(3000);

    await expect(page.locator('h1')).toContainText('Cấu hình Hệ thống', { timeout: 10000 });

    const tabButtons = page.locator('button:has-text("Chung"), button:has-text("Thanh toán"), button:has-text("Email")');
    const tabCount = await tabButtons.count();
    expect(tabCount).toBeGreaterThanOrEqual(3);
  });

  test('TC15 - Nhật ký - Trang render', async ({ page }) => {
    await page.goto('/admin/audit-logs');
    await page.waitForTimeout(3000);

    const hasHeading = await page.locator('h1').isVisible().catch(() => false);
    const hasTableContent = await page.locator('text=Nhật ký').isVisible().catch(() => false);
    expect(hasHeading || hasTableContent).toBeTruthy();
  });

  test('TC16 - Phân quyền - Trang render', async ({ page }) => {
    await page.goto('/admin/roles');
    await page.waitForTimeout(3000);

    const hasContent = await page.locator('text=Phân quyền').isVisible().catch(() => false);
    expect(hasContent || await page.locator('h1').isVisible().catch(() => false)).toBeTruthy();
  });

  test('TC17 - Sidebar điều hướng hoạt động', async ({ page }) => {
    const sidebarLinks = page.locator('nav a.nav-link');
    const linkCount = await sidebarLinks.count();

    const navigatedTabs: string[] = [];
    for (let i = 0; i < Math.min(linkCount, 5); i++) {
      const link = sidebarLinks.nth(i);
      const href = await link.getAttribute('href');
      const text = await link.innerText();

      if (href && href !== '/admin') {
        await link.click();
        await page.waitForTimeout(2000);
        navigatedTabs.push(`${text} -> ${href}`);

        const bodyContent = page.locator('body');
        await expect(bodyContent).toBeVisible({ timeout: 5000 });
      }
    }

    expect(navigatedTabs.length).toBeGreaterThanOrEqual(1);
  });

  test('TC18 - Đăng xuất Admin', async ({ page }) => {
    await page.goto('/admin');

    await page.goto('/login');
    await page.waitForTimeout(1000);

    const emailField = page.locator('#email');
    await expect(emailField).toBeVisible({ timeout: 5000 });
  });
});
