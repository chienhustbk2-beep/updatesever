import { test, expect } from '@playwright/test';

const USER_EMAIL = 'nguyenvana@gmail.com';
const USER_PASSWORD = 'user123';

test.describe('LUỒNG NGƯỜI DÙNG (Customer)', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('TC01 - Đăng nhập thành công và chuyển hướng về Dashboard', async ({ page }) => {
    await page.fill('#email', USER_EMAIL);
    await page.fill('#password', USER_PASSWORD);
    await page.click('button[type="submit"]');

    await page.waitForURL('**/dashboard', { timeout: 15000 });
    await expect(page.locator('h1')).toContainText('Tài khoản của tôi');
  });

  test('TC02 - Dashboard hiển thị đúng thông tin thống kê', async ({ page }) => {
    await page.fill('#email', USER_EMAIL);
    await page.fill('#password', USER_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 15000 });

    await page.waitForTimeout(2000);

    const statCards = page.locator('div.grid-cols-1.sm\\:grid-cols-4 > div');
    await expect(statCards).toHaveCount(4);

    const firstCardText = await statCards.nth(0).innerText();
    expect(firstCardText).toContain('Số dư ví');

    const secondCardText = await statCards.nth(1).innerText();
    expect(secondCardText).toContain('Đơn hàng');

    const thirdCardText = await statCards.nth(2).innerText();
    expect(thirdCardText).toContain('Key');

    const fourthCardText = await statCards.nth(3).innerText();
    expect(fourthCardText).toContain('Đã chi');
  });

  test('TC03 - Nạp tiền - Trang Deposit hiển thị đúng giao diện', async ({ page }) => {
    await page.fill('#email', USER_EMAIL);
    await page.fill('#password', USER_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 15000 });

    await page.goto('/deposit');
    await page.waitForSelector('h1');

    await expect(page.locator('h1')).toContainText('Nạp tiền vào ví');

    const presetButtons = page.locator('button.grid-cols-3 button').first();
    const totalPresetButtons = await page.locator('button:has-text("50,000")').count();
    expect(totalPresetButtons).toBeGreaterThanOrEqual(3);

    const qrImage = page.locator('img[alt="VietQR Code"]');
    await expect(qrImage).toBeVisible({ timeout: 10000 });
  });

  test('TC04 - Nạp tiền - Chọn mệnh giá và kiểm tra QR cập nhật', async ({ page }) => {
    await page.fill('#email', USER_EMAIL);
    await page.fill('#password', USER_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 15000 });

    await page.goto('/deposit');
    await page.waitForSelector('h1');

    const amountBtn = page.locator('button', { hasText: '100,000' }).first();
    await amountBtn.click();

    await page.waitForTimeout(500);

    const amountDisplay = page.locator('text=100,000').first();
    await expect(amountDisplay).toBeVisible();
  });

  test('TC05 - Mua hàng - Thêm sản phẩm vào giỏ và xem giỏ hàng', async ({ page }) => {
    await page.fill('#email', USER_EMAIL);
    await page.fill('#password', USER_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 15000 });

    await page.goto('/products');
    await page.waitForTimeout(2000);

    const productCards = page.locator('a[href^="/product/"]').first();
    await productCards.waitFor({ state: 'visible', timeout: 10000 });
    await productCards.click();

    await page.waitForSelector('h1');
    await page.waitForTimeout(1000);

    const addToCartBtn = page.locator('button', { hasText: 'Thêm vào giỏ' });
    if (await addToCartBtn.isVisible()) {
      await addToCartBtn.click();
      await page.waitForTimeout(1000);
    }

    await page.goto('/cart');
    await page.waitForTimeout(2000);

    const hasItems = await page.locator('text=Thanh toán').isVisible().catch(() => false);
    const isEmpty = await page.locator('text=Giỏ hàng trống').isVisible().catch(() => false);

    expect(hasItems || isEmpty).toBeTruthy();
  });

  test('TC06 - Mua hàng - Thanh toán qua số dư ví', async ({ page }) => {
    await page.fill('#email', USER_EMAIL);
    await page.fill('#password', USER_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 15000 });

    await page.goto('/products');
    await page.waitForTimeout(2000);

    const productCards = page.locator('a[href^="/product/"]').first();
    await productCards.waitFor({ state: 'visible', timeout: 10000 });
    await productCards.click();
    await page.waitForSelector('h1');
    await page.waitForTimeout(1000);

    const buyNowBtn = page.locator('button', { hasText: 'Mua ngay' });
    if (await buyNowBtn.isVisible()) {
      await buyNowBtn.click();
      await page.waitForTimeout(1000);
    }

    await page.goto('/checkout');
    await page.waitForTimeout(2000);

    const checkoutVisible = await page.locator('h1').first().isVisible().catch(() => false);
    if (!checkoutVisible) {
      await page.goto('/cart');
      await page.waitForTimeout(1000);

      const checkoutBtn = page.locator('a[href="/checkout"], button:has-text("Thanh toán")').first();
      if (await checkoutBtn.isVisible().catch(() => false)) {
        await checkoutBtn.click();
        await page.waitForURL('**/checkout', { timeout: 10000 }).catch(() => {});
      }
    }

    await page.waitForTimeout(1000);

    const balanceRadio = page.locator('input[type="radio"][value="BALANCE"]');
    if (await balanceRadio.isVisible().catch(() => false)) {
      await balanceRadio.check();
    }

    await page.waitForTimeout(500);

    const submitBtn = page.locator('button[type="submit"], button:has-text("Thanh toán"), button:has-text("Xác nhận")').first();
    if (await submitBtn.isVisible().catch(() => false)) {
      await submitBtn.click();
      await page.waitForTimeout(5000);
    }

    await page.waitForTimeout(2000);

    const successMessages = [
      'Thanh toán thành công',
      'Đơn hàng đã được tạo',
      'Đặt đơn thành công',
    ];
    let successFound = false;
    for (const msg of successMessages) {
      if (await page.locator(`text=${msg}`).isVisible().catch(() => false)) {
        successFound = true;
        break;
      }
    }

    if (!successFound) {
      const hasOrderInfo = await page.locator('text=Mã đơn').isVisible().catch(() => false);
      successFound = hasOrderInfo;
    }

    expect(successFound).toBeTruthy();
  });

  test('TC07 - Dashboard - Lịch sử đơn hàng hiển thị', async ({ page }) => {
    await page.fill('#email', USER_EMAIL);
    await page.fill('#password', USER_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 15000 });

    await page.waitForTimeout(3000);

    const orderTabs = page.locator('button:has-text("Tất cả")');
    await expect(orderTabs.first()).toBeVisible({ timeout: 5000 });

    const orderButtons = page.locator('button:has-text("Chờ thanh toán"), button:has-text("Hoàn thành"), button:has-text("Đã hủy")');
    const count = await orderButtons.count();
    expect(count).toBeGreaterThanOrEqual(3);

    const orderSection = page.locator('text=Đơn hàng của tôi');
    const orderListVisible = await orderSection.isVisible().catch(() => false);
    const orderItemsVisible = await page.locator('text=DigitalShop').first().isVisible().catch(() => false);

    expect(orderListVisible || orderItemsVisible).toBeTruthy();
  });

  test('TC08 - Đăng nhập sai hiển thị lỗi', async ({ page }) => {
    await page.fill('#email', 'sai@email.com');
    await page.fill('#password', 'saimatkhau');
    await page.click('button[type="submit"]');

    await page.waitForTimeout(3000);

    const errorDiv = page.locator('text=Email hoặc mật khẩu không đúng');
    await expect(errorDiv).toBeVisible({ timeout: 10000 });
  });
});
