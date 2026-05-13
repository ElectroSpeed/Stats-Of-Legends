import { TierListGenerationService } from '../services/TierListGenerationService';
import { PrismaClient } from '@prisma/client';

async function testTierList() {
    console.log("Testing Tier List Generation...");
    try {
        const data = await TierListGenerationService.getTierList('ALL', 'CHALLENGER');
        console.log(`Results found: ${data.length}`);
        if (data.length > 0) {
            console.log("First item:", JSON.stringify(data[0], null, 2));
        } else {
            console.log("❌ Still empty!");
        }
    } catch (e) {
        console.error("Test failed:", e);
    }
}

testTierList();
