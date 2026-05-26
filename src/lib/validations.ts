import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Email không hợp lệ"),
  password: z.string().min(1, "Mật khẩu là bắt buộc"),
  captchaToken: z.string().optional(),
});

export const registerSchema = z.object({
  name: z.string().max(100, "Tên tối đa 100 ký tự").optional(),
  email: z.string().email("Email không hợp lệ"),
  password: z.string().min(6, "Mật khẩu phải có ít nhất 6 ký tự"),
  captchaToken: z.string().optional(),
});

export const checkoutSchema = z.object({
  cartItems: z
    .array(
      z.object({
        productId: z.string().min(1),
        name: z.string().min(1),
        price: z.number().positive(),
        salePrice: z.number().positive().optional().nullable(),
        quantity: z.number().int().positive(),
      }),
    )
    .min(1, "Giỏ hàng trống"),
  couponCode: z.string().optional(),
  paymentMethod: z.enum(["BALANCE", "BANK_TRANSFER"]).optional(),
  guestEmail: z.string().email().optional().nullable(),
  guestName: z.string().max(200).optional().nullable(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type CheckoutInput = z.infer<typeof checkoutSchema>;
