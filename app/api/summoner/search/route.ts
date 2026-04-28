import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

export async function GET(req: NextRequest) {
    try {
        const url = new URL(req.url);
        const query = url.searchParams.get('q') || '';
        
        if (query.length < 2) {
            return NextResponse.json([]);
        }

        let namePrefix = query;
        let tagPrefix: string | undefined = undefined;

        if (query.includes('#')) {
            const parts = query.split('#');
            namePrefix = parts[0].trim();
            if (parts.length > 1 && parts[1].trim() !== '') {
                tagPrefix = parts[1].trim();
            }
        } else if (query.includes('-')) {
            const parts = query.split('-');
            namePrefix = parts[0].trim();
            if (parts.length > 1 && parts[1].trim() !== '') {
                tagPrefix = parts[1].trim();
            }
        }

        const summoners = await prisma.summoner.findMany({
            where: {
                gameName: {
                    startsWith: namePrefix,
                    mode: 'insensitive',
                },
                ...(tagPrefix && {
                    tagLine: {
                        startsWith: tagPrefix,
                        mode: 'insensitive',
                    }
                })
            },
            take: 5,
            select: {
                puuid: true,
                gameName: true,
                tagLine: true,
                profileIconId: true,
                summonerLevel: true,
                updatedAt: true
            },
            orderBy: {
                views: 'desc'
            }
        });

        // We map it to the structure expected by the frontend
        return NextResponse.json(summoners);

    } catch (e: any) {
        console.error('[summoner search] Server Search Error', e);
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}
