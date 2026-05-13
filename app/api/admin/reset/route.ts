import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

import { checkRateLimit } from '@/lib/rateLimit';

export async function POST(request: Request) {
    const ip = request.headers.get('x-forwarded-for') || 'anonymous';
    const { success } = checkRateLimit(ip, 3, 15 * 60 * 1000); // Very strict for reset
    if (!success) return NextResponse.json({ error: 'Too many requests' }, { status: 429 });

    const adminKey = request.headers.get('x-admin-key');
    if (adminKey !== process.env.ADMIN_SECRET_KEY) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        // Delete all data
        await prisma.championStat.deleteMany({});
        await prisma.scannedMatch.deleteMany({});

        return NextResponse.json({ status: 'reset' });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
