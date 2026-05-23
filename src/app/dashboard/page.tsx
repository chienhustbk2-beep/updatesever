"use client";
import { useState, useEffect, startTransition } from "react";
import { getSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Wallet,
  Key,
  Package,
  ChevronRight,
  Clock,
  CheckCircle,
  XCircle,
  Search,
  Edit,
  Save,
  X,
  AlertCircle,
  MessageSquare,
  Loader2,
  Truck,
  RotateCcw,
  CreditCard,
  Lock,
  Eye,
  EyeOff,
  Phone,
  Mail,
  Calendar,
  ShoppingBag,
  User,
  Minus,
  Plus,
  Store,
  Tag,
  Heart,
  PiggyBank,
  ArrowRight,
  Landmark,
  Smartphone,
  ChevronDown,
  Trash2,
} from "lucide-react";
import CopyKeyButton from "@/components/ui/CopyKeyButton";
import Link from "next/link";
import Image from "next/image";
import { useCartStore } from "@/store/useCartStore";
import OrderItemsList, {
  OrderItemDisplay,
} from "@/components/ui/OrderItemsList";
interface Order {
  id: string;
  orderNumber: string;
  totalAmount: number;
  discountAmount: number;
  finalAmount: number;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  createdAt: string;
  items: {
    id: string;
    quantity: number;
    price: number;
    total: number;
    product: {
      id: string;
      name: string;
      images: string;
      slug: string;
      salePrice: number | null;
    };
  }[];
  productKeys?: { id: string; keyValue: string; status: string }[];
  [key: string]: unknown;
}
interface User {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  balance: number;
  role: string;
  isActive: boolean;
  createdAt: string;
}
const statusConfig: Record<
  string,
  {
    label: string;
    color: string;
    bg: string;
    icon: React.ComponentType<{ className?: string }>;
    step: number;
  }
> = {
  PENDING: {
    label: "Chờ xử lý",
    color: "text-[var(--warning)]",
    bg: "bg-[var(--warning)]/10",
    icon: Clock,
    step: 1,
  },
  PROCESSING: {
    label: "Đang xử lý",
    color: "text-[var(--primary)]",
    bg: "bg-[var(--primary)]/10",
    icon: Truck,
    step: 2,
  },
  COMPLETED: {
    label: "Hoàn thành",
    color: "text-[var(--success)]",
    bg: "bg-[var(--success)]/10",
    icon: CheckCircle,
    step: 4,
  },
  CANCELLED: {
    label: "Đã hủy",
    color: "text-[var(--danger)]",
    bg: "bg-[var(--danger)]/10",
    icon: XCircle,
    step: 0,
  },
  REFUNDED: {
    label: "Đã hoàn tiền",
    color: "text-muted",
    bg: "bg-muted/10",
    icon: RotateCcw,
    step: 0,
  },
};
const paymentStatusConfig: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  UNPAID: {
    label: "Chưa thanh toán",
    color: "text-[var(--danger)]",
    bg: "bg-[var(--danger)]/10",
  },
  PAID: {
    label: "Đã thanh toán",
    color: "text-[var(--success)]",
    bg: "bg-[var(--success)]/10",
  },
  FAILED: {
    label: "Thất bại",
    color: "text-[var(--danger)]",
    bg: "bg-[var(--danger)]/10",
  },
  REFUNDED: {
    label: "Đã hoàn tiền",
    color: "text-muted",
    bg: "bg-muted/10",
  },
};
const paymentMethodLabels: Record<string, string> = {
  BANK_TRANSFER: "Chuyển khoản",
  MOMO: "Ví MoMo",
  ZALOPAY: "ZaloPay",
  CRYPTO: "Tiền mã hóa",
  BALANCE: "Số dư ví",
  MANUAL: "Thủ công",
};
function getProductImage(images: string): string | null {
  if (!images) return null;
  try {
    const parsed = JSON.parse(images);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed[0];
    }
    return images;
  } catch {
    return images || null;
  }
}
const TABS = [
  { id: "all", label: "Tất cả", icon: Package },
  { id: "pending", label: "Chờ thanh toán", icon: Clock },
  { id: "processing", label: "Đang xử lý", icon: Truck },
  { id: "completed", label: "Hoàn thành", icon: CheckCircle },
  { id: "cancelled", label: "Đã hủy", icon: XCircle },
  { id: "refunded", label: "Hoàn tiền", icon: RotateCcw },
];
export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [purchasedKeys, setPurchasedKeys] = useState<
    {
      id: string;
      keyValue: string;
      product?: { name: string };
      order?: { orderNumber: string };
      soldAt?: string;
    }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("pending");
  const [searchQuery, setSearchQuery] = useState("");
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({ name: "", phone: "" });
  const [savingProfile, setSavingProfile] = useState(false);
  const [cancelLoading, setCancelLoading] = useState<string | null>(null);
  const [removeItemLoading, setRemoveItemLoading] = useState<string | null>(
    null,
  );
  const [showReportModal, setShowReportModal] = useState<string | null>(null);
  const [reportMessage, setReportMessage] = useState("");
  const [reportLoading, setReportLoading] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [dashboardTab, setDashboardTab] = useState("account");
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  const removeFromCart = useCartStore((state) => state.removeFromCart);
  const [selectedPendingOrder, setSelectedPendingOrder] = useState<
    string | null
  >(null);
  const [payingOrder, setPayingOrder] = useState(false);
  const [payStatus, setPayStatus] = useState<"idle" | "success" | "error">(
    "idle",
  );
  const [payMessage, setPayMessage] = useState("");
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [depositAmount, setDepositAmount] = useState(0);
  const fetchData = async () => {
    try {
      const [userRes, ordersRes] = await Promise.all([
        fetch("/api/user/profile"),
        fetch("/api/user/orders"),
      ]);
      if (userRes.ok) {
        const userData = await userRes.json();
        setUser(userData.user);
        setProfileForm({
          name: userData.user?.name || "",
          phone: userData.user?.phone || "",
        });
        if (ordersRes.ok) {
          const ordersData = await ordersRes.json();
          setOrders(ordersData.orders || []);
          setPurchasedKeys(ordersData.purchasedKeys || []);
        }
      }
    } catch (err) {
      console.error("Failed to fetch data:", err);
      setUser(undefined as any);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    getSession().then((session) => {
      if (!session) {
        router.push("/login");
      } else {
        setLoading(true);
        fetchData();
      }
    });
  }, [router]);
  const handleSaveProfile = async () => {
    setSavingProfile(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profileForm),
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setEditingProfile(false);
      }
    } catch (_err) {
      console.error("Failed to save profile");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    setPasswordError("");
    setPasswordSuccess("");
    if (
      !passwordForm.currentPassword ||
      !passwordForm.newPassword ||
      !passwordForm.confirmPassword
    ) {
      setPasswordError("Vui lòng điền đầy đủ thông tin");
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      setPasswordError("Mật khẩu mới phải có ít nhất 6 ký tự");
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError("Mật khẩu xác nhận không khớp");
      return;
    }
    setChangingPassword(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setPasswordSuccess("Đổi mật khẩu thành công!");
        setPasswordForm({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
        setTimeout(() => setShowPasswordForm(false), 1500);
      } else {
        setPasswordError(data.error || "Có lỗi xảy ra");
      }
    } catch (_err) {
      setPasswordError("Có lỗi xảy ra");
    } finally {
      setChangingPassword(false);
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    if (!confirm("Bạn có chắc chắn muốn hủy đơn hàng này?"))
      return;
    /* Tìm đơn hàng để biết các product cần xóa khỏi giỏ */ const order =
      orders.find((o) => o.id === orderId);
    setCancelLoading(orderId);
    try {
      const res = await fetch(`/api/user/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel" }),
      });
      const data = await res.json();
      if (res.ok) {
        /* Xóa các sản phẩm của đơn hàng đã hủy khỏi giỏ hàng */ if (
          order
        ) {
          order.items.forEach((item) => {
            removeFromCart(item.product.id);
          });
        }
        fetchData();
      } else {
        alert(data.error || "Có lỗi xảy ra");
      }
    } catch (_err) {
      alert("Có lỗi xảy ra");
    } finally {
      setCancelLoading(null);
    }
  };

  const handleRemoveItem = async (
    orderId: string,
    orderItemId: string,
  ) => {
    setRemoveItemLoading(orderItemId);
    try {
      const res = await fetch(`/api/user/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "removeItem", orderItemId }),
      });
      const data = await res.json();
      if (res.ok) {
        fetchData();
      } else {
        alert(data.error || "Có lỗi xảy ra");
      }
    } catch (_err) {
      alert("Có lỗi xảy ra");
    } finally {
      setRemoveItemLoading(null);
    }
  };

  const handleUpdateItemQuantity = async (
    orderId: string,
    orderItemId: string,
    quantity: number,
  ) => {
    if (quantity < 1) return setRemoveItemLoading(orderItemId);
    try {
      const res = await fetch(`/api/user/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "updateQuantity",
          orderItemId,
          quantity,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        fetchData();
      } else {
        alert(data.error || "Có lỗi xảy ra");
      }
    } catch (_err) {
      alert("Có lỗi xảy ra");
    } finally {
      setRemoveItemLoading(null);
    }
  };

  const handlePayPendingOrder = async (orderId: string) => {
    if (user === null) return;
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;
    if (user.balance < order.finalAmount) {
      setDepositAmount(Math.round(order.finalAmount - user.balance));
      setShowDepositModal(true);
      return;
    }
    setPayingOrder(true);
    setPayStatus("idle");
    setPayMessage("");
    try {
      const res = await fetch(`/api/user/orders/${orderId}/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentMethod: "BALANCE" }),
      });
      const data = await res.json();
      if (res.ok) {
        setPayStatus("success");
        setPayMessage(
          `Thanh toán thành công! Đơn hàng: ${data.order?.orderNumber}`,
        );
        fetchData();
        setSelectedPendingOrder(null);
        setTimeout(() => {
          setPayStatus("idle");
          setPayMessage("");
        }, 3000);
      } else {
        setPayStatus("error");
        setPayMessage(data.error || "Có lỗi xảy ra");
      }
    } catch (_err) {
      setPayStatus("error");
      setPayMessage("Không thể kết nối đến máy chủ");
    } finally {
      setPayingOrder(false);
    }
  };

  const handleReportOrder = async () => {
    if (!showReportModal || !reportMessage.trim())
      return setReportLoading(true);
    try {
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: `Báo cáo đơn hàng ${showReportModal}`,
          message: reportMessage,
          orderId: showReportModal,
        }),
      });
      if (res.ok) {
        setShowReportModal(null);
        setReportMessage("");
        alert("Đã gửi báo cáo thành công!");
      }
    } catch (_err) {
      alert("Có lỗi xảy ra");
    } finally {
      setReportLoading(false);
    }
  };

  const filteredOrders = orders.filter((order) => {
    if (activeTab !== "all") {
      if (activeTab === "pending" && order.status !== "PENDING")
        return false;
      if (
        activeTab === "processing" &&
        order.status !== "PROCESSING"
      )
        return false;
      if (
        activeTab === "completed" &&
        order.status !== "COMPLETED"
      )
        return false;
      if (
        activeTab === "cancelled" &&
        order.status !== "CANCELLED"
      )
        return false;
      if (activeTab === "refunded" && order.status !== "REFUNDED")
        return false;
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (
        !order.orderNumber.toLowerCase().includes(q) &&
        !order.items.some((item) =>
          item.product.name.toLowerCase().includes(q),
        )
      ) {
        return false;
      }
    }
    return true;
  });
  const pendingOrders = orders.filter(
    (o) => o.status === "PENDING" && o.paymentStatus === "UNPAID",
  );
  const selectedPendingOrderData = pendingOrders.find(
    (o) => o.id === selectedPendingOrder,
  );
  const totalSpent = orders
    .filter((o) => o.status === "COMPLETED")
    .reduce((sum, o) => sum + o.finalAmount, 0);
  if (!mounted || loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        {" "}
        <Loader2 className="h-8 w-8 animate-spin text-divine-blue" />{" "}
      </div>
    );
  }
  if (!user) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4">
        {" "}
        <div className="rounded-xl border border-divider bg-card p-8 text-center shadow-sm max-w-md">
          {" "}
          <AlertCircle className="mx-auto h-12 w-12 text-[var(--danger)]" />{" "}
          <h2 className="mt-4 text-lg font-semibold text-main">
            Không thể tải thông tin tài khoản
          </h2>{" "}
          <p className="mt-2 text-sm text-muted">
            Có lỗi xảy ra khi tải dữ liệu. Vui lòng
            thử lại.
          </p>{" "}
          <button
            onClick={() => {
              setLoading(true);
              fetchData();
            }}
            className="mt-4 rounded-lg bg-[var(--primary)] px-6 py-2 text-sm font-semibold text-white transition hover:opacity-90"
          >
            {" "}
            Thử lại{" "}
          </button>{" "}
        </div>{" "}
      </div>
    );
  }
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 bg-card min-h-screen">
      {" "}
      <h1 className="mb-6 text-2xl font-bold text-main">
        Tài khoản của tôi
      </h1>{" "}
      {/* Stats Cards - Always visible */}{" "}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-4">
        {" "}
        <div className="rounded-xl border-2 border-indigo-200 bg-indigo-50 p-5 shadow-sm dark:border-indigo-800 dark:bg-indigo-950/50">
          {" "}
          <div className="flex items-center gap-3">
            {" "}
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-content">
              {" "}
              <Wallet className="h-6 w-6" />{" "}
            </div>{" "}
            <div>
              {" "}
              <p className="text-sm text-indigo-600 font-medium dark:text-indigo-400">
                Số dư ví
              </p>{" "}
              <p className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
                {user.balance.toLocaleString("vi-VN")}đ
              </p>{" "}
            </div>{" "}
          </div>{" "}
        </div>{" "}
        <div className="rounded-xl border-2 border-emerald-200 bg-emerald-50 p-5 shadow-sm dark:border-emerald-800 dark:bg-emerald-950/50">
          {" "}
          <div className="flex items-center gap-3">
            {" "}
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success text-white">
              {" "}
              <Package className="h-6 w-6" />{" "}
            </div>{" "}
            <div>
              {" "}
              <p className="text-sm text-emerald-600 font-medium dark:text-emerald-400">
                Đơn hàng
              </p>{" "}
              <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                {orders.length}
              </p>{" "}
            </div>{" "}
          </div>{" "}
        </div>{" "}
        <div className="rounded-xl border-2 border-border bg-violet-50 p-5 shadow-sm dark:border-border dark:bg-violet-950/50">
          {" "}
          <div className="flex items-center gap-3">
            {" "}
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-content">
              {" "}
              <Key className="h-6 w-6" />{" "}
            </div>{" "}
            <div>
              {" "}
              <p className="text-sm text-indigo-600 font-medium dark:text-indigo-400">
                Key đã mua
              </p>{" "}
              <p className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
                {purchasedKeys.length}
              </p>{" "}
            </div>{" "}
          </div>{" "}
        </div>{" "}
        <div className="rounded-xl border-2 border-red-200 bg-red-50 p-5 shadow-sm dark:border-rose-950/30 dark:bg-rose-950/50">
          {" "}
          <div className="flex items-center gap-3">
            {" "}
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-destructive text-white">
              {" "}
              <CreditCard className="h-6 w-6" />{" "}
            </div>{" "}
            <div>
              {" "}
              <p className="text-sm text-rose-500 font-medium dark:text-rose-400">
                Tổng chi tiêu
              </p>{" "}
              <p className="text-xl font-bold text-rose-500 dark:text-rose-400">
                {totalSpent.toLocaleString("vi-VN")}đ
              </p>{" "}
            </div>{" "}
          </div>{" "}
        </div>{" "}
      </div>{" "}
      {/* Main Dashboard Tabs */}{" "}
      <div className="mb-6 bg-card rounded-xl p-1.5">
        {" "}
        <div className="flex gap-1.5">
          {" "}
          <button
            onClick={() => setDashboardTab("account")}
            className={`flex-1 py-3 px-4 text-base font-bold rounded-lg transition-all duration-200 ${dashboardTab === "account" ? "bg-main text-indigo-600 shadow-md" : "bg-transparent text-muted hover:text-main"}`}
          >
            {" "}
            <span className="flex items-center justify-center gap-2">
              {" "}
              <User className="h-5 w-5" /> Tài khoản của
              tôi{" "}
            </span>{" "}
          </button>{" "}
          <button
            onClick={() => setDashboardTab("orders")}
            className={`flex-1 py-3 px-4 text-base font-bold rounded-lg transition-all duration-200 ${dashboardTab === "orders" ? "bg-main text-indigo-600 shadow-md" : "bg-transparent text-muted hover:text-main"}`}
          >
            {" "}
            <span className="flex items-center justify-center gap-2">
              {" "}
              <Package className="h-5 w-5" /> Đơn mua{" "}
              {pendingOrders.length > 0 && (
                <span
                  className={`inline-flex items-center justify-center text-xs px-2 py-0.5 rounded-full font-bold ${dashboardTab === "orders" ? "bg-warning text-white" : "bg-warning text-white"}`}
                >
                  {pendingOrders.length}
                </span>
              )}{" "}
            </span>{" "}
          </button>{" "}
        </div>{" "}
      </div>{" "}
      {/* Tab Content: Account */}{" "}
      {dashboardTab === "account" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {" "}
          {/* Profile Section */}{" "}
          <div className="lg:col-span-2 rounded-xl border-default bg-main shadow-sm">
            {" "}
            <div className="p-6 border-b border-divider">
              {" "}
              <div className="flex items-center justify-between">
                {" "}
                <h2 className="text-lg font-semibold text-main flex items-center gap-2">
                  {" "}
                  <User className="h-5 w-5 text-indigo-600" /> Thông
                  tin tài khoản{" "}
                </h2>{" "}
                <div className="flex gap-2">
                  {" "}
                  <button
                    onClick={() => {
                      setShowPasswordForm(!showPasswordForm);
                      setPasswordError("");
                      setPasswordSuccess("");
                    }}
                    className="flex items-center gap-1.5 rounded-lg bg-[var(--primary)] px-3 py-2 text-sm font-semibold !text-white shadow-md hover:shadow-lg transition-all"
                  >
                    {" "}
                    <Lock className="h-4 w-4" /> Đổi mật
                    khẩu{" "}
                  </button>{" "}
                  <button
                    onClick={() =>
                      setEditingProfile(!editingProfile)
                    }
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold !text-white shadow-md transition-all hover:shadow-lg ${editingProfile ? "bg-danger dark:bg-red-600" : "bg-success dark:bg-green-600"}`}
                  >
                    {" "}
                    {editingProfile ? (
                      <X className="h-4 w-4" />
                    ) : (
                      <Edit className="h-4 w-4" />
                    )}{" "}
                    {editingProfile
                      ? "Hủy"
                      : "Chỉnh sửa"}{" "}
                  </button>{" "}
                </div>{" "}
              </div>{" "}
            </div>{" "}
            <div className="p-6">
              {" "}
              {editingProfile ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {" "}
                  <div>
                    {" "}
                    <label className="block text-sm text-muted mb-1">
                      Tên
                    </label>{" "}
                    <input
                      type="text"
                      value={profileForm.name}
                      onChange={(e) =>
                        setProfileForm({
                          ...profileForm,
                          name: e.target.value,
                        })
                      }
                      className="w-full rounded-lg bg-card border border-divider px-3 py-2.5 text-sm text-main focus:border-[var(--primary)] focus:outline-none"
                    />{" "}
                  </div>{" "}
                  <div>
                    {" "}
                    <label className="block text-sm text-muted mb-1">
                      Số điện thoại
                    </label>{" "}
                    <input
                      type="text"
                      value={profileForm.phone}
                      onChange={(e) =>
                        setProfileForm({
                          ...profileForm,
                          phone: e.target.value,
                        })
                      }
                      className="w-full rounded-lg bg-card border border-divider px-3 py-2.5 text-sm text-main focus:border-[var(--primary)] focus:outline-none"
                    />{" "}
                  </div>{" "}
                  <div className="sm:col-span-2">
                    {" "}
                    <label className="block text-sm text-muted mb-1">
                      Email
                    </label>{" "}
                    <input
                      type="email"
                      value={user.email}
                      disabled
                      className="w-full rounded-lg bg-card border border-divider px-3 py-2.5 text-sm text-muted cursor-not-allowed"
                    />{" "}
                  </div>{" "}
                  <div className="sm:col-span-2 flex justify-end gap-2">
                    {" "}
                    <button
                      onClick={() => setEditingProfile(false)}
                      className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-semibold text-main shadow-md hover:shadow-lg transition-all"
                    >
                      {" "}
                      Hủy{" "}
                    </button>{" "}
                    <button
                      onClick={handleSaveProfile}
                      disabled={savingProfile}
                      className="flex items-center gap-2 rounded-lg bg-[var(--success)] px-4 py-2 text-sm font-semibold !text-white shadow-md hover:shadow-lg disabled:opacity-50 transition-all"
                    >
                      {" "}
                      {savingProfile ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4" />
                      )}{" "}
                      Lưu thay đổi{" "}
                    </button>{" "}
                  </div>{" "}
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {" "}
                  <div className="flex items-center gap-3">
                    {" "}
                    <Mail className="h-4 w-4 text-muted" />{" "}
                    <div>
                      {" "}
                      <p className="text-xs text-muted">
                        Email
                      </p>{" "}
                      <p className="font-medium text-main">
                        {user.email}
                      </p>{" "}
                    </div>{" "}
                  </div>{" "}
                  <div className="flex items-center gap-3">
                    {" "}
                    <User className="h-4 w-4 text-muted" />{" "}
                    <div>
                      {" "}
                      <p className="text-xs text-muted">
                        Tên
                      </p>{" "}
                      <p className="font-medium text-main">
                        {user.name || "Chưa cập nhật"}
                      </p>{" "}
                    </div>{" "}
                  </div>{" "}
                  <div className="flex items-center gap-3">
                    {" "}
                    <Phone className="h-4 w-4 text-muted" />{" "}
                    <div>
                      {" "}
                      <p className="text-xs text-muted">
                        Số điện thoại
                      </p>{" "}
                      <p className="font-medium text-main">
                        {user.phone || "Chưa cập nhật"}
                      </p>{" "}
                    </div>{" "}
                  </div>{" "}
                  <div className="flex items-center gap-3">
                    {" "}
                    <Calendar className="h-4 w-4 text-muted" />{" "}
                    <div>
                      {" "}
                      <p className="text-xs text-muted">
                        Ngày tham gia
                      </p>{" "}
                      <p className="font-medium text-main">
                        {new Date(
                          user.createdAt,
                        ).toLocaleDateString("vi-VN")}
                      </p>{" "}
                    </div>{" "}
                  </div>{" "}
                </div>
              )}{" "}
              {/* Password Change Form */}{" "}
              {showPasswordForm && (
                <div className="mt-6 pt-6 border-t border-divider">
                  {" "}
                  <h3 className="text-sm font-semibold text-main mb-4 flex items-center gap-2">
                    {" "}
                    <Lock className="h-4 w-4 text-indigo-600" />{" "}
                    Đổi mật khẩu{" "}
                  </h3>{" "}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {" "}
                    <div className="sm:col-span-2">
                      {" "}
                      <label className="block text-sm text-muted mb-1">
                        Mật khẩu hiện tại
                      </label>{" "}
                      <div className="relative">
                        {" "}
                        <input
                          type={
                            showPasswords.current
                              ? "text"
                              : "password"
                          }
                          value={passwordForm.currentPassword}
                          onChange={(e) =>
                            setPasswordForm({
                              ...passwordForm,
                              currentPassword: e.target.value,
                            })
                          }
                          className="w-full rounded-lg bg-card border border-divider px-3 py-2.5 pr-10 text-sm text-main focus:border-[var(--primary)] focus:outline-none"
                        />{" "}
                        <button
                          onClick={() =>
                            setShowPasswords({
                              ...showPasswords,
                              current: !showPasswords.current,
                            })
                          }
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-muted"
                        >
                          {" "}
                          {showPasswords.current ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}{" "}
                        </button>{" "}
                      </div>{" "}
                    </div>{" "}
                    <div>
                      {" "}
                      <label className="block text-sm text-muted mb-1">
                        Mật khẩu mới
                      </label>{" "}
                      <div className="relative">
                        {" "}
                        <input
                          type={
                            showPasswords.new
                              ? "text"
                              : "password"
                          }
                          value={passwordForm.newPassword}
                          onChange={(e) =>
                            setPasswordForm({
                              ...passwordForm,
                              newPassword: e.target.value,
                            })
                          }
                          className="w-full rounded-lg bg-card border border-divider px-3 py-2.5 pr-10 text-sm text-main focus:border-[var(--primary)] focus:outline-none"
                        />{" "}
                        <button
                          onClick={() =>
                            setShowPasswords({
                              ...showPasswords,
                              new: !showPasswords.new,
                            })
                          }
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-muted"
                        >
                          {" "}
                          {showPasswords.new ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}{" "}
                        </button>{" "}
                      </div>{" "}
                    </div>{" "}
                    <div>
                      {" "}
                      <label className="block text-sm text-muted mb-1">
                        Xác nhận mật khẩu
                      </label>{" "}
                      <div className="relative">
                        {" "}
                        <input
                          type={
                            showPasswords.confirm
                              ? "text"
                              : "password"
                          }
                          value={passwordForm.confirmPassword}
                          onChange={(e) =>
                            setPasswordForm({
                              ...passwordForm,
                              confirmPassword: e.target.value,
                            })
                          }
                          className="w-full rounded-lg bg-card border border-divider px-3 py-2.5 pr-10 text-sm text-main focus:border-[var(--primary)] focus:outline-none"
                        />{" "}
                        <button
                          onClick={() =>
                            setShowPasswords({
                              ...showPasswords,
                              confirm: !showPasswords.confirm,
                            })
                          }
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-muted"
                        >
                          {" "}
                          {showPasswords.confirm ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}{" "}
                        </button>{" "}
                      </div>{" "}
                    </div>{" "}
                    {passwordError && (
                      <div className="sm:col-span-2 flex items-center gap-2 text-sm text-danger">
                        {" "}
                        <AlertCircle className="h-4 w-4" />{" "}
                        {passwordError}{" "}
                      </div>
                    )}{" "}
                    {passwordSuccess && (
                      <div className="sm:col-span-2 flex items-center gap-2 text-sm text-emerald-600">
                        {" "}
                        <CheckCircle className="h-4 w-4" />{" "}
                        {passwordSuccess}{" "}
                      </div>
                    )}{" "}
                    <div className="sm:col-span-2 flex justify-end">
                      {" "}
                      <button
                        onClick={handleChangePassword}
                        disabled={changingPassword}
                        className="flex items-center gap-2 rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-semibold !text-white shadow-md hover:shadow-lg disabled:opacity-50 transition-all"
                      >
                        {" "}
                        {changingPassword ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Lock className="h-4 w-4" />
                        )}{" "}
                        Đổi mật khẩu{" "}
                      </button>{" "}
                    </div>{" "}
                  </div>{" "}
                </div>
              )}{" "}
            </div>{" "}
          </div>{" "}
          {/* Quick Links */}{" "}
          <div className="space-y-4">
            {" "}
            <Link
              href="/deposit"
              className="block rounded-xl border-default bg-gradient-to-br from-emerald-50 to-white p-5 shadow-sm transition hover:shadow-md hover:border-emerald-300 dark:from-emerald-950/50 dark:to-gray-900 dark:hover:border-emerald-700"
            >
              {" "}
              <div className="flex items-center gap-3">
                {" "}
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success text-white shadow-lg">
                  {" "}
                  <CreditCard className="h-6 w-6" />{" "}
                </div>{" "}
                <div>
                  {" "}
                  <p className="font-semibold text-emerald-600 dark:text-emerald-400">
                    Nạp tiền
                  </p>{" "}
                  <p className="text-xs text-emerald-600 dark:text-emerald-400">
                    Cộng thêm vào số dư ví
                  </p>{" "}
                </div>{" "}
              </div>{" "}
            </Link>{" "}
            <Link
              href="/support"
              className="block rounded-xl border-2 border-border bg-gradient-to-br from-indigo-50 to-white p-5 shadow-sm transition hover:shadow-md hover:border-indigo-300 dark:border-border dark:from-indigo-950/50 dark:to-gray-900 dark:hover:border-indigo-500"
            >
              {" "}
              <div className="flex items-center gap-3">
                {" "}
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-content shadow-lg">
                  {" "}
                  <MessageSquare className="h-6 w-6" />{" "}
                </div>{" "}
                <div>
                  {" "}
                  <p className="font-semibold text-indigo-600 dark:text-indigo-400">
                    Hỗ trợ
                  </p>{" "}
                  <p className="text-xs text-indigo-600 dark:text-indigo-400">
                    Gửi yêu cầu hỗ trợ
                  </p>{" "}
                </div>{" "}
              </div>{" "}
            </Link>{" "}
          </div>{" "}
        </div>
      )}{" "}
      {/* Tab Content: Orders */}{" "}
      {dashboardTab === "orders" && (
        <div>
          {" "}
          {/* Pending Payment Banner */}{" "}
            <div className="mb-8 rounded-xl border-2 border-amber-400 bg-gradient-to-r from-amber-50 via-amber-50 to-white p-6 shadow-md dark:border-amber-600 dark:from-amber-950/40 dark:via-amber-950/20 dark:to-gray-900 relative z-10 overflow-hidden">
            {" "}
            <div className="flex items-center justify-between flex-wrap gap-4">
              {" "}
              <div className="flex items-center gap-4">
                {" "}
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-warning text-white shadow-lg">
                  {" "}
                  <Clock className="h-7 w-7" />{" "}
                </div>{" "}
                <div>
                  {" "}
                  <p className="text-lg font-bold text-warning">
                    Đơn hàng chờ thanh toán
                  </p>{" "}
                  <p className="text-sm text-warning/70">
                    {
                      orders.filter(
                        (o) =>
                          o.status === "PENDING" &&
                          o.paymentStatus === "UNPAID",
                      ).length
                    }{" "}
                    đơn hàng cần được thanh toán ngay
                  </p>{" "}
                </div>{" "}
              </div>{" "}
              <div className="flex items-center gap-3">
                {" "}
                <span className="text-3xl font-black text-warning drop-shadow-sm">
                  {
                    orders.filter(
                      (o) =>
                        o.status === "PENDING" &&
                        o.paymentStatus === "UNPAID",
                    ).length
                  }
                </span>{" "}
              </div>{" "}
            </div>{" "}
          </div>{" "}
          {/* Pending Orders Section */}{" "}
          {pendingOrders.length > 0 && (
            <div className="mb-8">
              {" "}
              <div className="flex items-center justify-between mb-4">
                {" "}
                <h2 className="text-xl font-semibold bg-gradient-to-r from-amber-600 to-orange-600 dark:from-amber-400 dark:to-orange-400 bg-clip-text text-transparent flex items-center gap-2"> 
                  {" "}
                  <Clock className="h-5 w-5 text-warning" /> Chờ
                  thanh toán ({pendingOrders.length}){" "}
                </h2>{" "}
              </div>{" "}
              <div className="space-y-4">
                {" "}
                {pendingOrders.map((order) => (
                  <div
                    key={order.id}
                    className="rounded-xl border-default bg-gradient-to-br from-amber-50 to-white dark:from-amber-950/40 dark:to-gray-900 overflow-hidden shadow-sm hover:shadow-md transition"
                  >
                    {" "}
                    {/* Order Header */}{" "}
                    <div className="flex items-center justify-between px-5 py-3 border-b-2 border-border dark:border-border bg-gradient-to-r from-amber-50 to-white dark:from-amber-950/40 dark:to-gray-900">
                      {" "}
                      <div className="flex items-center gap-3">
                        {" "}
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold bg-gradient-to-br from-warning to-warning text-white shadow-md">
                          {" "}
                          D{" "}
                        </div>{" "}
                        <span className="text-sm font-semibold text-main">
                          DigitalShop
                        </span>{" "}
                        <span className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1 rounded-lg bg-warning text-white shadow-sm">
                          {" "}
                          <Clock className="h-3 w-3" /> Chờ thanh
                          toán{" "}
                        </span>{" "}
                      </div>{" "}
                      <span className="text-xs text-muted">
                        {" "}
                        {new Date(
                          order.createdAt,
                        ).toLocaleDateString("vi-VN")}{" "}
                      </span>{" "}
                    </div>{" "}
                    {/* Order Items */}{" "}
                    <div className="px-4 sm:px-6 py-3">
                      {" "}
                       <div className="hidden sm:flex items-center justify-between px-0 py-2 text-xs text-muted mb-1">
                        <span className="flex-1 min-w-0 pl-14">Sản phẩm</span>
                        <div className="flex items-center gap-4 sm:gap-6 shrink-0">
                          <span className="w-20 text-right">Đơn giá</span>
                          <span className="w-8 text-center">SL</span>
                          <span className="w-24 text-right">Thành tiền</span>
                        </div>
                      </div>{" "}
                      {order.items.map((item) => {
                        const imageUrl = getProductImage(
                          item.product.images,
                        );
                        const hasSaleDiscount =
                          item.product.salePrice &&
                          item.product.salePrice < item.price;
                        const displayPrice =
                          item.product.salePrice ?? item.price;
                        const itemTotal =
                          displayPrice * item.quantity;
                        return (
                          <div
                            key={item.id}
                            className="flex items-center justify-between gap-4 py-4 border-b border-divider last:border-0 hover:bg-card transition"
                          >
                            {" "}
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              {" "}
                              <Link
                                href={`/product/${item.product.slug}`}
                                className="relative h-16 w-16 shrink-0 overflow-hidden rounded-sm border border-divider bg-card"
                              >
                                {" "}
                                {imageUrl ? (
                                  <img
                                    src={imageUrl}
                                    alt={item.product.name}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <div className="flex h-full w-full items-center justify-center text-muted">
                                    {" "}
                                    <Package className="h-5 w-5" />{" "}
                                  </div>
                                )}{" "}
                              </Link>{" "}
                              <div className="min-w-0">
                                {" "}
                                <Link
                                  href={`/product/${item.product.slug}`}
                                  className="text-sm text-main line-clamp-2 leading-5 hover:text-warning"
                                >
                                  {" "}
                                  {item.product.name}{" "}
                                </Link>{" "}
                                {hasSaleDiscount && (
                                  <span className="mt-1 inline-block rounded-sm border border-orange-300 bg-orange-50 px-1.5 py-0.5 text-[10px] text-warning">
                                    {" "}
                                    Giảm{" "}
                                    {Math.round(
                                      ((item.price -
                                        displayPrice) /
                                        item.price) *
                                        100,
                                    )}
                                    %{" "}
                                  </span>
                                )}{" "}
                              </div>{" "}
                            </div>{" "}
                            <div className="flex items-center gap-4 sm:gap-6 shrink-0">
                              {" "}
                              <div className="text-right w-20">
                                {" "}
                                {hasSaleDiscount ? (
                                  <div>
                                    {" "}
                                    <span className="text-sm font-medium text-warning">
                                      {displayPrice.toLocaleString("vi-VN")}đ
                                    </span>{" "}
                                    <span className="ml-1 text-xs text-muted line-through">
                                      {item.price.toLocaleString("vi-VN")}đ
                                    </span>{" "}
                                  </div>
                                ) : (
                                  <span className="text-sm text-main">
                                    {displayPrice.toLocaleString("vi-VN")}đ
                                  </span>
                                )}{" "}
                              </div>{" "}
                              <div className="text-center w-8">
                                {" "}
                                <span className="text-sm font-medium text-main">
                                  x{item.quantity}
                                </span>{" "}
                              </div>{" "}
                              <div className="text-right w-24">
                                {" "}
                                <span className="text-sm font-semibold text-warning">
                                  {itemTotal.toLocaleString("vi-VN")}đ
                                </span>{" "}
                              </div>{" "}
                            </div>{" "}
                          </div>
                        );
                      })}{" "}
                    </div>{" "}
                    {/* Order Footer */}{" "}
                    <div className="flex items-center justify-between px-4 sm:px-6 py-4 bg-card">
                      {" "}
                      <div className="text-sm text-muted">
                        {" "}
                        Mã đơn:{" "}
                        <span className="font-mono text-indigo-600">
                          #{order.orderNumber}
                        </span>{" "}
                      </div>{" "}
                      <div className="flex items-center gap-4">
                        {" "}
                        <div className="text-right">
                          {" "}
                          <span className="text-xs text-muted">
                            Thành tiền:{" "}
                          </span>{" "}
                            <span className="text-lg font-bold bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
                            {" "}
                            {order.finalAmount.toLocaleString(
                              "vi-VN",
                            )}
                            đ{" "}
                          </span>{" "}
                        </div>{" "}
                        <button
                          onClick={() =>
                            handleCancelOrder(order.id)
                          }
                          disabled={cancelLoading === order.id}
                          className="rounded-lg bg-transparent border border-red-200 px-5 py-2.5 text-sm font-medium text-rose-500 hover:bg-red-50 hover:text-red-500 hover:border-red-300 transition-all disabled:opacity-50"
                        >
                          {" "}
                          {cancelLoading === order.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            "Hủy đơn hàng"
                          )}{" "}
                        </button>{" "}
                        <button
                          onClick={() =>
                            handlePayPendingOrder(order.id)
                          }
                          disabled={payingOrder}
                          className="rounded-lg bg-gradient-to-r from-orange-500 to-red-500 px-8 py-3 text-base font-bold !text-white shadow-md shadow-orange-200 hover:shadow-xl hover:scale-105 transition-all duration-200 disabled:opacity-50"
                        >
                          {" "}
                          {payingOrder ? (
                            <span className="flex items-center gap-2">
                              {" "}
                              <Loader2 className="h-4 w-4 animate-spin" />{" "}
                              Đang xử lý...{" "}
                            </span>
                          ) : (
                            "Thanh toán ngay"
                          )}{" "}
                        </button>{" "}
                      </div>{" "}
                    </div>{" "}
                  </div>
                ))}{" "}
              </div>{" "}
            </div>
          )}{" "}
          {/* Order History Tabs */}{" "}
          <div className="rounded-xl border-default bg-main overflow-hidden shadow-sm mt-6">
            {" "}
            {/* Filter tabs */}{" "}
            <div className="flex items-center gap-2 overflow-x-auto px-4 sm:px-6 pt-4 pb-3 border-b border-divider scrollbar-hide">
              {" "}
              {TABS.map((tab) => {
                const Icon = tab.icon;
                const count =
                  tab.id === "all"
                    ? orders.length
                    : orders.filter((o) => {
                        if (tab.id === "pending")
                          return o.status === "PENDING";
                        if (tab.id === "processing")
                          return o.status === "PROCESSING";
                        if (tab.id === "completed")
                          return o.status === "COMPLETED";
                        if (tab.id === "cancelled")
                          return o.status === "CANCELLED";
                        if (tab.id === "refunded")
                          return o.status === "REFUNDED";
                        return false;
                      }).length;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-1.5 px-4 py-2 text-sm font-semibold whitespace-nowrap rounded-xl transition-all duration-200 ${
                      activeTab === tab.id
                        ? tab.id === "all"
                          ? "bg-card text-main shadow-md"
                          : tab.id === "pending"
                            ? "bg-warning text-white shadow-md"
                            : tab.id === "processing"
                              ? "bg-[var(--primary)] text-white shadow-md"
                              : tab.id === "completed"
                                ? "bg-[var(--success)] text-white shadow-md"
                                : tab.id === "cancelled"
                                  ? "bg-danger text-white shadow-md"
                                  : "bg-gradient-to-r from-gray-500 to-slate-500 text-white shadow-md"
                        : "bg-main text-muted border border-divider hover:shadow-sm"
                    }`}
                  >
                    {" "}
                    <Icon className="h-4 w-4" />{" "}
                    {tab.label}{" "}
                    <span
                      className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
                        activeTab === tab.id
                          ? "bg-white/25 text-white"
                          : "bg-slate-100 text-muted"
                      }`}
                    >
                      {" "}
                      {count}{" "}
                    </span>{" "}
                  </button>
                );
              })}{" "}
            </div>{" "}
            {/* Search */}{" "}
            <div className="px-4 sm:px-6 py-5 border-b border-divider">
              {" "}
              <div className="relative">
                {" "}
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />{" "}
                <input
                  type="text"
                  placeholder="Tìm theo mã đơn hàng hoặc tên sản phẩm..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl bg-card border border-divider pl-10 pr-4 py-2.5 text-sm text-main placeholder-muted focus:border-[var(--primary)] focus:outline-none"
                />{" "}
              </div>{" "}
            </div>{" "}
            {/* Orders List */}{" "}
            {filteredOrders.length === 0 ? (
              <div className="px-6 py-16 text-center">
                {" "}
                <ShoppingBag className="mx-auto h-16 w-16 text-muted" />{" "}
                <p className="mt-4 text-base font-medium text-muted">
                  Không tìm thấy đơn hàng nào
                </p>{" "}
                <p className="mt-1 text-sm text-muted">
                  Hãy mua sắm ngay để có trải nghiệm
                  tuyệt vời!
                </p>{" "}
                <Link
                  href="/products"
                  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[var(--primary)] px-6 py-3 text-sm font-semibold !text-white shadow-lg hover:shadow-xl transition-all"
                >
                  {" "}
                  Mua ngay{" "}
                </Link>{" "}
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {" "}
                {filteredOrders.map((order) => {
                  const status =
                    statusConfig[order.status] ||
                    statusConfig.PENDING;
                  const StatusIcon = status.icon;
                  const canCancel =
                    order.status === "PENDING" &&
                    order.paymentStatus === "UNPAID";
                  const isCompleted =
                    order.status === "COMPLETED";
                  const reviewDeadline = isCompleted
                    ? new Date(
                        new Date(order.createdAt).getTime() +
                          7 * 24 * 60 * 60 * 1000,
                      )
                    : null;
                  return (
                    <div
                      key={order.id}
                      className="transition hover:bg-card"
                    >
                      {" "}
                      {/* Shop Header */}{" "}
                      <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b-2 border-divider">
                        {" "}
                        <div className="flex items-center gap-3">
                          {" "}
                          <div className="flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold bg-gradient-to-br from-orange-500 to-red-500 text-white shadow-md">
                            {" "}
                            D{" "}
                          </div>{" "}
                          <span className="text-sm font-semibold text-main">
                            DigitalShop
                          </span>{" "}
                          <span
                            className={`inline-flex items-center gap-1 text-xs font-semibold px-3 py-1 rounded-lg shadow-sm ${order.status === "PENDING" ? "bg-warning text-white" : order.status === "PROCESSING" ? "bg-primary text-primary-content" : order.status === "COMPLETED" ? "bg-success text-white" : order.status === "CANCELLED" ? "bg-danger text-white" : "bg-muted text-main"}`}
                          >
                            {" "}
                            <StatusIcon className="h-3 w-3" />{" "}
                            {status.label}{" "}
                          </span>{" "}
                        </div>{" "}
                        <span className="text-xs text-muted">
                          {" "}
                          {new Date(
                            order.createdAt,
                          ).toLocaleDateString("vi-VN")}{" "}
                        </span>{" "}
                      </div>{" "}
                      {/* Order Items */}{" "}
<div className="px-4 sm:px-6 py-3">
                        {" "}
                        {order.items.map((item) => {
                          const imageUrl = getProductImage(
                            item.product.images,
                          );
                          const hasSaleDiscount =
                            item.product.salePrice &&
                            item.product.salePrice < item.price;
                          const displayPrice =
                            item.product.salePrice ?? item.price;
                          const itemTotal =
                            displayPrice * item.quantity;
                          return (
                            <div
                              key={item.id}
                              className="flex items-center justify-between gap-4 py-4 border-b border-divider last:border-0 hover:bg-card transition"
                            >
                              {" "}
                              <div className="flex items-center gap-3 flex-1 min-w-0">
                                {" "}
                                <Link
                                  href={`/product/${item.product.slug}`}
                                  className="relative h-16 w-16 shrink-0 overflow-hidden rounded-sm border border-divider bg-card"
                                >
                                  {" "}
                                  {imageUrl ? (
                                    <img
                                      src={imageUrl}
                                      alt={item.product.name}
                                      className="h-full w-full object-cover"
                                    />
                                  ) : (
                                    <div className="flex h-full w-full items-center justify-center text-muted">
                                      {" "}
                                      <Package className="h-5 w-5" />{" "}
                                    </div>
                                  )}{" "}
                                </Link>{" "}
                                <div className="min-w-0">
                                  {" "}
                                  <Link
                                    href={`/product/${item.product.slug}`}
                                    className="text-sm text-main line-clamp-2 leading-5 hover:text-warning"
                                  >
                                    {" "}
                                    {item.product.name}{" "}
                                  </Link>{" "}
                                  {hasSaleDiscount && (
                                    <span className="mt-1 inline-block rounded-sm border border-orange-300 bg-orange-50 px-1.5 py-0.5 text-[10px] text-warning">
                                      {" "}
                                      Giảm{" "}
                                      {Math.round(
                                        ((item.price -
                                          displayPrice) /
                                          item.price) *
                                          100,
                                      )}
                                      %{" "}
                                    </span>
                                  )}{" "}
                                </div>{" "}
                              </div>{" "}
                              <div className="flex items-center gap-4 sm:gap-6 shrink-0">
                                {" "}
                                <div className="text-right w-20">
                                  {" "}
                                  {hasSaleDiscount ? (
                                    <div>
                                      {" "}
                                      <span className="text-sm font-medium text-warning">
                                        {displayPrice.toLocaleString("vi-VN")}đ
                                      </span>{" "}
                                      <span className="ml-1 text-xs text-muted line-through">
                                        {item.price.toLocaleString("vi-VN")}đ
                                      </span>{" "}
                                    </div>
                                  ) : (
                                    <span className="text-sm text-main">
                                      {displayPrice.toLocaleString("vi-VN")}đ
                                    </span>
                                  )}{" "}
                                </div>{" "}
                                <div className="text-center w-8">
                                  {" "}
                                  <span className="text-sm font-medium text-main">
                                    x{item.quantity}
                                  </span>{" "}
                                </div>{" "}
                                <div className="text-right w-24">
                                  {" "}
                                  <span className="text-sm font-semibold text-warning">
                                    {itemTotal.toLocaleString("vi-VN")}đ
                                  </span>{" "}
                                </div>{" "}
                              </div>{" "}
                            </div>
                          );
                        })}{" "}
                      </div>{" "}
                      {/* Order Footer */}{" "}
<div className="flex items-center justify-between px-4 sm:px-6 py-4 bg-card">
                        {" "}
                        <div className="flex items-center gap-2">
                          {" "}
                          {isCompleted && reviewDeadline && (
                            <span className="text-xs text-muted">
                              {" "}
                              Đánh giá sản phẩm trước{" "}
                              <span className="text-indigo-600 font-medium">
                                {" "}
                                {reviewDeadline.toLocaleDateString(
                                  "vi-VN",
                                )}{" "}
                              </span>{" "}
                            </span>
                          )}{" "}
                          {order.status === "CANCELLED" && (
                            <span className="text-xs text-danger">
                              Đơn hàng đã bị hủy
                            </span>
                          )}{" "}
                          {order.status === "REFUNDED" && (
                            <span className="text-xs text-muted">
                              Đã hoàn tiền
                            </span>
                          )}{" "}
                        </div>{" "}
                        <div className="flex items-center gap-4">
                          {" "}
                          <div className="text-right">
                            {" "}
                            <span className="text-xs text-muted">
                              Thành tiền:{" "}
                            </span>{" "}
                          <span className="text-lg font-bold bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
                              {" "}
                              {order.finalAmount.toLocaleString(
                                "vi-VN",
                              )}
                              đ{" "}
                            </span>{" "}
                          </div>{" "}
                          <div className="flex items-center gap-2">
                            {" "}
                            {canCancel && (
                              <>
                                <button
                                  onClick={() =>
                                    handlePayPendingOrder(order.id)
                                  }
                                  disabled={payingOrder}
                                  className="rounded-lg bg-gradient-to-r from-orange-500 to-red-500 px-5 py-2 text-sm font-bold !text-white shadow-md shadow-orange-200 hover:shadow-xl hover:scale-105 transition-all duration-200 disabled:opacity-50"
                                >
                                  {" "}
                                  {payingOrder ? (
                                    <Loader2 className="inline h-4 w-4 animate-spin mr-1" />
                                  ) : null}{" "}
                                  Thanh toán ngay{" "}
                                </button>{" "}
                                <button
                                  onClick={() =>
                                    handleCancelOrder(order.id)
                                  }
                                  disabled={
                                    cancelLoading === order.id
                                  }
                                  className="rounded-lg bg-transparent border border-red-200 px-4 py-2 text-xs font-medium text-rose-500 hover:bg-red-50 hover:text-red-500 hover:border-red-300 transition-all disabled:opacity-50"
                                >
                                  {" "}
                                  {cancelLoading === order.id ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  ) : (
                                    "Hủy đơn"
                                  )}{" "}
                                </button>
                              </>
                            )}{" "}
                            {isCompleted && (
                              <>
                                {" "}
                                <Link
                                  href={`/product/${order.items[0]?.product.slug}`}
                                  className="rounded-lg bg-[var(--primary)] px-4 py-2 text-xs font-semibold !text-white shadow-md hover:shadow-lg transition-all"
                                >
                                  {" "}
                                  Mua lại{" "}
                                </Link>{" "}
                                <button
                                  onClick={() =>
                                    setShowReportModal(
                                      order.orderNumber,
                                    )
                                  }
                                  className="rounded-lg bg-warning px-4 py-2 text-xs font-semibold !text-white shadow-md hover:shadow-lg transition-all"
                                >
                                  {" "}
                                  Báo cáo{" "}
                                </button>{" "}
                              </>
                            )}{" "}
                            <button
                              onClick={() =>
                                setExpandedOrder(
                                  expandedOrder === order.id
                                    ? null
                                    : order.id,
                                )
                              }
                              className={`rounded-lg px-4 py-2 text-xs font-semibold !text-white shadow-md transition-all hover:shadow-lg ${expandedOrder === order.id ? "bg-gradient-to-r from-gray-500 to-slate-500" : "bg-[var(--primary)]"}`}
                            >
                              {" "}
                              {expandedOrder === order.id
                                ? "Thu gọn"
                                : "Xem chi tiết"}{" "}
                            </button>{" "}
                          </div>{" "}
                        </div>{" "}
                      </div>{" "}
                      {/* Expanded Order Details */}{" "}
                      {expandedOrder === order.id && (
                        <div className="px-4 sm:px-6 py-4 border-t border-divider bg-card">
                          {" "}
                          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            {" "}
                            <div>
                              {" "}
                              <p className="text-xs text-muted mb-1">
                                Mã đơn hàng
                              </p>{" "}
                              <p className="text-sm font-mono font-semibold text-indigo-600">
                                #{order.orderNumber}
                              </p>{" "}
                            </div>{" "}
                            <div>
                              {" "}
                              <p className="text-xs text-muted mb-1">
                                Phương thức thanh toán
                              </p>{" "}
                              <p className="text-sm text-main">
                                {paymentMethodLabels[
                                  order.paymentMethod
                                ] || order.paymentMethod}
                              </p>{" "}
                            </div>{" "}
                            <div>
                              {" "}
                              <p className="text-xs text-muted mb-1">
                                Trạng thái thanh toán
                              </p>{" "}
                              <p
                                className={`text-sm font-medium ${order.paymentStatus === "PAID" ? "text-emerald-600" : order.paymentStatus === "UNPAID" ? "text-danger" : "text-muted"}`}
                              >
                                {" "}
                                {order.paymentStatus === "PAID"
                                  ? "Đã thanh toán"
                                  : order.paymentStatus ===
                                      "UNPAID"
                                    ? "Chưa thanh toán"
                                    : order.paymentStatus ===
                                        "FAILED"
                                      ? "Thất bại"
                                      : "Đã hoàn tiền"}{" "}
                              </p>{" "}
                            </div>{" "}
                            <div>
                              {" "}
                              <p className="text-xs text-muted mb-1">
                                Ngày đặt hàng
                              </p>{" "}
                              <p className="text-sm text-main">
                                {" "}
                                {new Date(
                                  order.createdAt,
                                ).toLocaleDateString("vi-VN", {
                                  day: "2-digit",
                                  month: "2-digit",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}{" "}
                              </p>{" "}
                            </div>{" "}
                          </div>{" "}
                          {/* Price Breakdown */}{" "}
                          <div className="mt-4 pt-4 border-t border-divider">
                            {" "}
                            <div className="space-y-2">
                              {" "}
                              <div className="flex justify-between text-sm">
                                {" "}
                                <span className="text-muted">
                                  Tạm tính
                                </span>{" "}
                                <span className="text-main">
                                  {order.totalAmount.toLocaleString(
                                    "vi-VN",
                                  )}
                                  đ
                                </span>{" "}
                              </div>{" "}
                              {order.discountAmount > 0 && (
                                <div className="flex justify-between text-sm">
                                  {" "}
                                  <span className="text-muted">
                                    Giảm giá
                                  </span>{" "}
                                  <span className="text-emerald-600">
                                    -
                                    {order.discountAmount.toLocaleString(
                                      "vi-VN",
                                    )}
                                    đ
                                  </span>{" "}
                                </div>
                              )}{" "}
                              <div className="flex justify-between text-sm pt-2 border-t border-divider">
                                {" "}
                                <span className="text-main font-medium">
                                  Tổng cộng
                                </span>{" "}
                                <span className="text-lg font-bold text-warning">
                                  {order.finalAmount.toLocaleString(
                                    "vi-VN",
                                  )}
                                  đ
                                </span>{" "}
                              </div>{" "}
                            </div>{" "}
                          </div>{" "}
                          {/* Purchased Keys (if completed) */}{" "}
                          {isCompleted &&
                            order.productKeys &&
                            order.productKeys.length > 0 && (
                              <div className="mt-4 pt-4 border-t border-divider">
                                {" "}
                                <p className="text-xs text-muted mb-2 flex items-center gap-1">
                                  {" "}
                                  <Key className="h-3 w-3" /> Key
                                  bản quyền đã mua{" "}
                                </p>{" "}
                                <div className="space-y-2">
                                  {" "}
                                  {order.productKeys.map(
                                    (key) => (
                                      <div
                                        key={key.id}
                                        className="flex items-center gap-2 rounded-lg bg-card border border-divider px-3 py-2"
                                      >
                                        {" "}
                                        <code className="flex-1 text-sm font-mono text-main truncate">
                                          {key.keyValue}
                                        </code>{" "}
                                        <CopyKeyButton
                                          text={key.keyValue}
                                        />{" "}
                                      </div>
                                    ),
                                  )}{" "}
                                </div>{" "}
                              </div>
                            )}{" "}
                        </div>
                      )}{" "}
                    </div>
                  );
                })}{" "}
              </div>
            )}{" "}
          </div>{" "}
          {/* Purchased Keys */}{" "}
          <div className="mt-6 rounded-xl border-2 border-border bg-gradient-to-br from-violet-50 to-white overflow-hidden shadow-sm">
             {" "}
             <div className="border-b-2 border-border px-6 py-4 bg-gradient-to-r from-violet-50 to-white">
               {" "}
               <h2 className="text-lg font-semibold text-indigo-600 flex items-center gap-2">
                 {" "}
                 <Key className="h-5 w-5 text-indigo-600" /> Kho
                 Key đã mua{" "}
               </h2>{" "}
               <p className="mt-1 text-sm text-indigo-600">
                Các key bản quyền bạn đã mua, sao chép
                để sử dụng
              </p>{" "}
            </div>{" "}
            {purchasedKeys.length === 0 ? (
              <div className="px-6 py-16 text-center">
                {" "}
                <Key className="mx-auto h-16 w-16 text-muted" />{" "}
                <p className="mt-4 text-base font-medium text-muted">
                  Chưa có key nào
                </p>{" "}
                <p className="mt-1 text-sm text-muted">
                  Hãy mua sản phẩm để nhận key bản
                  quyền
                </p>{" "}
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {" "}
                {purchasedKeys.map(
                  (key: {
                    id: string;
                    keyValue: string;
                    product?: { name: string };
                    order?: { orderNumber: string };
                    soldAt?: string;
                  }) => (
                    <div
                      key={key.id}
                      className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between"
                    >
                      {" "}
                      <div className="flex-1">
                        {" "}
                        <p className="font-medium text-main">
                          {key.product?.name || "Sản phẩm"}
                        </p>{" "}
                        <p className="mt-1 text-xs text-muted flex items-center gap-2">
                          {" "}
                          <span>
                            Đơn hàng:{" "}
                            {key.order?.orderNumber || "-"}
                          </span>{" "}
                          <span>•</span>{" "}
                          <span>
                            {key.soldAt
                              ? new Date(
                                  key.soldAt,
                                ).toLocaleDateString("vi-VN")
                              : "-"}
                          </span>{" "}
                        </p>{" "}
                      </div>{" "}
                      <div className="flex items-center gap-2">
                        {" "}
                        <code className="rounded-lg bg-card border border-divider px-3 py-2 text-sm font-mono text-main">
                          {key.keyValue}
                        </code>{" "}
                        <CopyKeyButton text={key.keyValue} />{" "}
                      </div>{" "}
                    </div>
                  ),
                )}{" "}
              </div>
            )}{" "}
          </div>{" "}
        </div>
      )}{" "}
      {/* Report Modal */}{" "}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          {" "}
          <div className="w-full max-w-md rounded-2xl border border-default bg-card shadow-2xl">
            {" "}
            <div className="p-6 border-b border-default">
              {" "}
              <h2 className="text-lg font-bold text-main">
                Báo cáo đơn hàng
              </h2>{" "}
              <p className="text-sm text-muted mt-1">
                Mã đơn: {showReportModal}
              </p>{" "}
            </div>{" "}
            <div className="p-6">
              {" "}
              <textarea
                value={reportMessage}
                onChange={(e) => setReportMessage(e.target.value)}
                placeholder="Mô tả vấn đề bạn gặp phải..."
                rows={4}
                className="w-full rounded-lg bg-card border border-default px-3 py-2 text-sm text-main placeholder-muted focus:border-[var(--primary)] focus:outline-none resize-none"
              />{" "}
            </div>{" "}
            <div className="p-6 border-t border-default flex gap-3">
              {" "}
              <button
                onClick={() => {
                  setShowReportModal(null);
                  setReportMessage("");
                }}
                className="flex-1 rounded-lg bg-card px-4 py-2.5 text-sm font-medium text-muted hover:bg-card"
              >
                {" "}
                Hủy{" "}
              </button>{" "}
              <button
                onClick={handleReportOrder}
                disabled={reportLoading || !reportMessage.trim()}
                className="flex-1 rounded-lg bg-[var(--success)] px-4 py-2.5 text-sm font-semibold !text-white hover:bg-[var(--success)] disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {" "}
                {reportLoading ? (
                  <>
                    {" "}
                    <Loader2 className="h-4 w-4 animate-spin" />{" "}
                    Đang gửi...{" "}
                  </>
                ) : (
                  <>
                    {" "}
                    <MessageSquare className="h-4 w-4" /> Gửi
                    báo cáo{" "}
                  </>
                )}{" "}
              </button>{" "}
            </div>{" "}
          </div>{" "}
        </div>
      )}{" "}
      {/* Deposit Modal */}{" "}
      {showDepositModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          {" "}
          <div className="w-full max-w-md rounded-xl border border-divider bg-divine-card shadow-2xl">
            {" "}
            <div className="p-6 border-b border-divider">
              {" "}
              <div className="flex items-center gap-3">
                {" "}
                <div className="h-10 w-10 rounded-full bg-warning/10 flex items-center justify-center">
                  {" "}
                  <PiggyBank className="h-5 w-5 text-warning" />{" "}
                </div>{" "}
                <div>
                  {" "}
                  <h2 className="text-lg font-semibold text-main">
                    Số dư không đủ
                  </h2>{" "}
                  <p className="text-sm text-muted">
                    {" "}
                    Bạn cần nạp thêm để hoàn tất
                    thanh toán{" "}
                  </p>{" "}
                </div>{" "}
              </div>{" "}
            </div>{" "}
            <div className="p-6 space-y-4">
              {" "}
              <div className="rounded-lg bg-divine-dark/50 p-4 space-y-2">
                {" "}
                <div className="flex justify-between text-sm">
                  {" "}
                  <span className="text-muted">
                    Tổng đơn hàng
                  </span>{" "}
                  <span className="text-main font-medium">
                    {selectedPendingOrderData?.finalAmount.toLocaleString(
                      "vi-VN",
                    )}
                    đ
                  </span>{" "}
                </div>{" "}
                <div className="flex justify-between text-sm">
                  {" "}
                  <span className="text-muted">
                    Số dư hiện tại
                  </span>{" "}
                  <span className="text-danger font-medium">
                    {user?.balance.toLocaleString("vi-VN")}đ
                  </span>{" "}
                </div>{" "}
                <div className="border-t border-divider pt-2 flex justify-between">
                  {" "}
                  <span className="text-warning font-medium">
                    Cần nạp thêm
                  </span>{" "}
                  <span className="text-warning font-bold text-lg">
                    {" "}
                    {depositAmount.toLocaleString("vi-VN")}đ{" "}
                  </span>{" "}
                </div>{" "}
              </div>{" "}
              <p className="text-sm text-muted text-center">
                Chọn phương thức nạp tiền:
              </p>{" "}
            </div>{" "}
            <div className="p-6 border-t border-divider space-y-3">
              {" "}
              <button
                onClick={() => {
                  setShowDepositModal(false);
                  router.push(`/deposit?amount=${depositAmount}`);
                }}
                className="w-full flex items-center justify-between rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 px-4 py-3 text-sm font-semibold !text-white hover:from-blue-600 hover:to-indigo-700 hover:shadow-lg transition-all"
              >
                {" "}
                <div className="flex items-center gap-2">
                  {" "}
                  <PiggyBank className="h-4 w-4" /> Nạp tiền
                  qua QR{" "}
                </div>{" "}
                <ArrowRight className="h-4 w-4" />{" "}
              </button>{" "}
              <button
                onClick={() => {
                  setShowDepositModal(false);
                  router.push("/checkout");
                }}
                className="w-full flex items-center justify-between rounded-lg border border-divider bg-divine-dark/30 px-4 py-3 text-sm font-medium text-main hover:bg-divine-dark transition"
              >
                {" "}
                <div className="flex items-center gap-2">
                  {" "}
                  <Landmark className="h-4 w-4" /> Chuyển
                  khoản ngân hàng{" "}
                </div>{" "}
                <ArrowRight className="h-4 w-4" />{" "}
              </button>{" "}
              <button
                onClick={() => {
                  setShowDepositModal(false);
                  router.push("/checkout");
                }}
                className="w-full flex items-center justify-between rounded-lg border border-divider bg-divine-dark/30 px-4 py-3 text-sm font-medium text-main hover:bg-divine-dark transition"
              >
                {" "}
                <div className="flex items-center gap-2">
                  {" "}
                  <Smartphone className="h-4 w-4" /> Ví MoMo /
                  ZaloPay{" "}
                </div>{" "}
                <ArrowRight className="h-4 w-4" />{" "}
              </button>{" "}
              <button
                onClick={() => setShowDepositModal(false)}
                className="w-full rounded-lg px-4 py-2.5 text-sm font-medium text-muted hover:text-main transition"
              >
                {" "}
                Đóng{" "}
              </button>{" "}
            </div>{" "}
          </div>{" "}
        </div>
      )}{" "}
      {/* Payment Status Toast */}{" "}
      {payStatus !== "idle" && (
        <div className="fixed top-20 right-4 z-50 animate-slide-in">
          {" "}
          <div
            className={`flex items-center gap-3 rounded-sm px-5 py-3 shadow-lg ${payStatus === "success" ? "bg-success text-white" : "bg-danger text-white"}`}
          >
            {" "}
            {payStatus === "success" ? (
              <CheckCircle className="h-5 w-5" />
            ) : (
              <XCircle className="h-5 w-5" />
            )}{" "}
            <span className="text-sm font-medium">
              {payMessage}
            </span>{" "}
          </div>{" "}
        </div>
      )}{" "}
    </div>
  );
}
