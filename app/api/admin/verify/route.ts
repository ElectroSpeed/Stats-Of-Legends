import { NextResponse } from 'next/server';

import { checkRateLimit } from '@/lib/rateLimit';

export async function POST(request: Request) {
    const ip = request.headers.get('x-forwarded-for') || 'anonymous';
    const { success } = checkRateLimit(ip, 5, 15 * 60 * 1000); 
    if (!success) return NextResponse.json({ error: 'Too many attempts' }, { status: 429 });

    try {
        const { key } = await request.json();

        if (key === process.env.ADMIN_SECRET_KEY) {
            return NextResponse.json({ status: 'ok' });
        } else {
            // Anti-brute force delay
            await new Promise(resolve => setTimeout(resolve, 1500));
            return NextResponse.json({ error: 'Invalid Key' }, { status: 401 });
        }
    } catch (error) {
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}
