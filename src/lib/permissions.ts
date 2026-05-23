export type Role = "ADMIN" | "STAFF" | "CUSTOMER";

export interface Permission { admin: boolean; staff: boolean }
const defaultRoutes: Record<string, Permission> = {
  "/admin": { admin: true, staff: true },
  "/admin/products": { admin: true, staff: true },
  "/admin/categories": { admin: true, staff: true },
  "/admin/orders": { admin: true, staff: true },
  "/admin/users": { admin: true, staff: false },
  "/admin/keys": { admin: true, staff: true },
  "/admin/ui-customization": { admin: true, staff: false },
  "/admin/settings": { admin: true, staff: false },
  "/admin/audit-logs": { admin: true, staff: false },
  "/admin/tickets": { admin: true, staff: true },
  "/admin/roles": { admin: true, staff: false },
}
const defaultApiRoutes: Record<string, Permission> = {
  "/api/admin/dashboard-stats": { admin: true, staff: true },
  "/api/admin/online-count": { admin: true, staff: true },
  "/api/admin/visit-log": { admin: true, staff: true },
  "/api/admin/products": { admin: true, staff: true },
  "/api/admin/orders": { admin: true, staff: true },
  "/api/admin/keys": { admin: true, staff: true },
  "/api/admin/import-keys": { admin: true, staff: true },
  "/api/admin/parse-keys": { admin: true, staff: true },
  "/api/admin/tickets": { admin: true, staff: true },
  "/api/admin/users": { admin: true, staff: false },
  "/api/admin/settings": { admin: true, staff: false },
  "/api/admin/ui-elements": { admin: true, staff: false },
  "/api/admin/audit-logs": { admin: true, staff: false },
  "/api/admin/categories": { admin: true, staff: true },
  "/api/admin/permissions": { admin: true, staff: false },
}
let _cachedRoutes: Record<string, Permission> | null = null;
let _cachedApiRoutes: Record<string, Permission> | null = null;

export function setRoutePermissions(
  routes: Record<string, Permission>,
  apiRoutes: Record<string, Permission>,
) {
  _cachedRoutes = routes;
  _cachedApiRoutes = apiRoutes }
export function resetRoutePermissions() {
  _cachedRoutes = null;
  _cachedApiRoutes = null }
function getRoutes() {
  return _cachedRoutes || defaultRoutes }
function getApiRoutes() {
  return _cachedApiRoutes || defaultApiRoutes }
export function getRoutePermissions() {
  return { routes: defaultRoutes, apiRoutes: defaultApiRoutes } }
export function hasPermission(role: string, path: string): boolean {
  if (role === "ADMIN") return true;

  const routePerms = getRoutes()[path] || getApiRoutes()[path];
  if (!routePerms) return role === "STAFF";

  if (role === "STAFF") return routePerms.staff ?? false;

  return false }
export function getNavItems(role: string) {
  const allItems = [
    { href: "/admin", label: "Dashboard", icon: "LayoutDashboard" },
    { href: "/admin/products", label: "Quản lý Sản phẩm", icon: "Package" },
    { href: "/admin/categories", label: "Danh mục", icon: "FolderTree" },
    { href: "/admin/orders", label: "Đơn hàng", icon: "ShoppingCart" },
    { href: "/admin/users", label: "Người dùng", icon: "Users" },
    { href: "/admin/keys", label: "Nhập Kho Key", icon: "Key" },
    {
      href: "/admin/ui-customization",
      label: "Tùy chỉnh UI",
      icon: "LayoutDashboard",
    },
    { href: "/admin/tickets", label: "Ticket hỗ trợ", icon: "MessageSquare" },
    { href: "/admin/settings", label: "Cấu hình", icon: "Settings" },
    { href: "/admin/audit-logs", label: "Nhật ký", icon: "FileText" },
    { href: "/admin/roles", label: "Phân quyền", icon: "Shield" },
  ];
  return allItems.filter((item) => {
    const perm = getRoutes()[item.href];
    return perm && (role === "ADMIN" || perm.staff) }) }
export function getQuickActions(role: string) {
  const all = [
    { href: "/admin/products", label: "Sản phẩm" },
    { href: "/admin/orders", label: "Đơn hàng" },
    { href: "/admin/keys", label: "Nhập Key" },
    { href: "/admin/users", label: "Người dùng" },
    { href: "/admin/tickets", label: "Hỗ trợ" },
    { href: "/admin/ui-customization", label: "Tùy chỉnh UI" },
  ];
  return all.filter((item) => {
    const perm = getRoutes()[item.href];
    return perm && (role === "ADMIN" || perm.staff) }) }
