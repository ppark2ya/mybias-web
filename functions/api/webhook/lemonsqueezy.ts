import { eq, sql } from "drizzle-orm";
import { profiles } from "../../../src/db/schema";
import { createDbClient } from "../../lib/db";
import type { DbClient } from "../../types";

interface Env {
  DATABASE_URL: string;
  LEMONSQUEEZY_WEBHOOK_SECRET?: string;
}

/**
 * Lemon Squeezy webhook event types
 */
type LemonSqueezyEventType =
  | "order_created"
  | "order_refunded"
  | "subscription_created"
  | "subscription_updated"
  | "subscription_cancelled"
  | "subscription_resumed"
  | "subscription_expired"
  | "subscription_paused"
  | "subscription_unpaused"
  | "subscription_payment_success"
  | "subscription_payment_failed"
  | "subscription_payment_recovered"
  | "license_key_created"
  | "license_key_updated";

/**
 * Lemon Squeezy webhook payload structure
 */
interface LemonSqueezyWebhookPayload {
  meta: {
    event_name: LemonSqueezyEventType;
    custom_data?: {
      user_id?: string;
    };
  };
  data: {
    type: string;
    id: string;
    attributes: {
      store_id: number;
      customer_id: number;
      identifier: string;
      order_number: number;
      user_name: string;
      user_email: string;
      currency: string;
      currency_rate: string;
      subtotal: number;
      discount_total: number;
      tax: number;
      total: number;
      subtotal_usd: number;
      discount_total_usd: number;
      tax_usd: number;
      total_usd: number;
      tax_name: string;
      tax_rate: string;
      status:
        | "pending"
        | "failed"
        | "paid"
        | "refunded"
        | "partial_refund"
        | "fraudulent";
      status_formatted: string;
      refunded: boolean;
      refunded_at: string | null;
      subtotal_formatted: string;
      discount_total_formatted: string;
      tax_formatted: string;
      total_formatted: string;
      first_order_item: {
        id: number;
        order_id: number;
        product_id: number;
        variant_id: number;
        product_name: string;
        variant_name: string;
        price: number;
        quantity: number;
        created_at: string;
        updated_at: string;
      };
      urls: {
        receipt: string;
      };
      created_at: string;
      updated_at: string;
      test_mode: boolean;
    };
  };
}

/**
 * Credits to add per order (can be customized based on product)
 */
const CREDITS_PER_ORDER = 50;

/**
 * Validate webhook request from Lemon Squeezy
 * Lemon Squeezy signs webhooks with HMAC-SHA256
 *
 * @see https://docs.lemonsqueezy.com/guides/developer-guide/webhooks#signing-requests
 */
async function validateWebhook(
  request: Request,
  secret?: string
): Promise<boolean> {
  // If no secret configured, skip validation (not recommended for production)
  if (!secret) {
    console.warn(
      "LEMONSQUEEZY_WEBHOOK_SECRET not configured - skipping validation"
    );
    return true;
  }

  // Get signature header
  const signature = request.headers.get("X-Signature");

  if (!signature) {
    console.error("Missing X-Signature header");
    return false;
  }

  // Get request body
  const body = await request.clone().text();

  // Calculate expected signature using HMAC-SHA256
  const encoder = new TextEncoder();

  // 비밀키 import (verify 용도)
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"]
  );

  // Hex String(헤더) -> Uint8Array(바이트) 변환
  // verify 함수는 바이트 배열을 원하므로 변환이 필요합니다.
  const signatureBytes = hexToBytes(signature);

  // 6. 네이티브 검증 실행 (Timing Safe 처리됨)
  const isValid = await crypto.subtle.verify(
    "HMAC",
    cryptoKey,
    signatureBytes,
    encoder.encode(body)
  );

  if (!isValid) {
    console.error("❌ Webhook signature verification failed");
    return false;
  }

  return true;
}

// 헬퍼 함수: Hex 문자열을 바이트 배열로 변환
function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

/**
 * Add credits to user account
 */
async function addCreditsToUser(
  db: DbClient,
  userId: string,
  credits: number
): Promise<boolean> {
  try {
    const result = await db
      .update(profiles)
      .set({
        credits: sql`${profiles.credits} + ${credits}`,
        updatedAt: new Date(),
      })
      .where(eq(profiles.id, userId))
      .returning({ id: profiles.id });

    return result.length > 0;
  } catch (error) {
    console.error("Failed to add credits:", error);
    return false;
  }
}

/**
 * Find user by email
 */
async function findUserByEmail(
  db: DbClient,
  email: string
): Promise<string | null> {
  try {
    const result = await db
      .select({ id: profiles.id })
      .from(profiles)
      .where(eq(profiles.email, email))
      .limit(1);

    return result.length > 0 ? result[0].id : null;
  } catch (error) {
    console.error("Failed to find user by email:", error);
    return null;
  }
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const { request, env } = context;

    // Validate webhook signature
    const isValid = await validateWebhook(
      request,
      env.LEMONSQUEEZY_WEBHOOK_SECRET
    );
    if (!isValid) {
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Create database client
    const db = createDbClient(env.DATABASE_URL);

    // Parse webhook payload
    const payload: LemonSqueezyWebhookPayload = await request.json();
    const eventName = payload.meta.event_name;

    console.log("Received Lemon Squeezy webhook:", eventName, payload.data.id);

    // Handle order_created event
    if (eventName === "order_created") {
      const { attributes } = payload.data;

      // Only process paid orders
      if (attributes.status !== "paid") {
        console.log("Order not paid, skipping:", attributes.status);
        return new Response(
          JSON.stringify({ received: true, processed: false }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      // Get user ID from custom data or find by email
      let userId = payload.meta.custom_data?.user_id;

      if (!userId) {
        // Try to find user by email
        userId =
          (await findUserByEmail(db, attributes.user_email)) ?? undefined;
      }

      if (!userId) {
        console.error("Could not identify user for order:", payload.data.id);
        return new Response(
          JSON.stringify({ error: "User not found", received: true }),
          {
            status: 200, // Return 200 to prevent retries
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      // Add credits to user
      const success = await addCreditsToUser(db, userId, CREDITS_PER_ORDER);

      if (success) {
        console.log(
          `Added ${CREDITS_PER_ORDER} credits to user ${userId} for order ${payload.data.id}`
        );
      } else {
        console.error(`Failed to add credits for user ${userId}`);
      }

      return new Response(
        JSON.stringify({ received: true, processed: success }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Handle refund events
    if (eventName === "order_refunded") {
      const { attributes } = payload.data;

      // Get user ID from custom data or find by email
      let userId = payload.meta.custom_data?.user_id;

      if (!userId) {
        userId =
          (await findUserByEmail(db, attributes.user_email)) ?? undefined;
      }

      if (userId) {
        // Deduct credits (don't go negative)
        await db
          .update(profiles)
          .set({
            credits: sql`GREATEST(0, ${profiles.credits} - ${CREDITS_PER_ORDER})`,
            updatedAt: new Date(),
          })
          .where(eq(profiles.id, userId));

        console.log(
          `Deducted ${CREDITS_PER_ORDER} credits from user ${userId} due to refund`
        );
      }

      return new Response(JSON.stringify({ received: true, processed: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // For other events, just acknowledge
    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Lemon Squeezy webhook error:", err);
    return new Response(
      JSON.stringify({
        error: err instanceof Error ? err.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
