import { NextResponse } from 'next/server';
import { RiotService } from '@/services/RiotService';
import { HTTP_TOO_MANY_REQUESTS } from '@/constants/api';

import { checkRateLimit } from '@/lib/rateLimit';

export async function GET(request: Request) {
    const ip = request.headers.get('x-forwarded-for') || 'anonymous';
    const { success } = checkRateLimit(ip, 3, 15 * 60 * 1000); 
    if (!success) return NextResponse.json({ error: 'Too many requests' }, { status: 429 });

    const adminKey = request.headers.get('x-admin-key');
    if (adminKey !== process.env.ADMIN_SECRET_KEY) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(request.url);
        const tier = searchParams.get('tier'); // IRON, BRONZE...
        const division = searchParams.get('division'); // I, II, III, IV
        const region = searchParams.get('region') || 'euw1'; // Default to euw1

        let entries = [];
        if (tier && division) {
            entries = await RiotService.getLeagueEntries(region, 'RANKED_SOLO_5x5', tier, division, 1);
        } else {
            const league = await RiotService.getChallengerLeague(region);
            entries = league.entries;
        }

        return NextResponse.json({ entries, debug: entries[0] });
    } catch (error: any) {
        console.error("Seed API Error:", error);
        if (error.status === HTTP_TOO_MANY_REQUESTS) {
            return NextResponse.json({ error: 'Rate Limit Exceeded', retryAfter: error.retryAfter }, { status: HTTP_TOO_MANY_REQUESTS });
        }
        return NextResponse.json({ error: `Riot API Error: ${error.message}` }, { status: 500 });
    }
}
