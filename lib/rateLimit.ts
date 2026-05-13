
/**
 * A very simple in-memory Rate Limiter for Next.js API Routes.
 * Note: In a serverless environment like Vercel, memory is shared per lambda instance.
 * This demonstrates the architectural intent of protecting expensive resources.
 */
const rateLimitMap = new Map<string, { count: number, resetAt: number }>();

export function checkRateLimit(ip: string, limit: number, windowMs: number): { success: boolean, remaining: number } {
    const now = Date.now();
    const current = rateLimitMap.get(ip);

    if (!current || now > current.resetAt) {
        rateLimitMap.set(ip, { count: 1, resetAt: now + windowMs });
        return { success: true, remaining: limit - 1 };
    }

    if (current.count >= limit) {
        return { success: false, remaining: 0 };
    }

    current.count++;
    return { success: true, remaining: limit - current.count };
}
