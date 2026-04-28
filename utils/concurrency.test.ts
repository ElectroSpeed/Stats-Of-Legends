import { describe, it, expect } from 'vitest';
import { mapWithConcurrency } from './concurrency';

// Utility delay function for testing concurrency
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

describe('concurrencyUtils', () => {
    describe('mapWithConcurrency', () => {
        it('should process all items and return their results', async () => {
            const items = [1, 2, 3, 4, 5];
            const result = await mapWithConcurrency(items, 2, async (item) => {
                await delay(10);
                return item * 2;
            });
            expect(result).toEqual([2, 4, 6, 8, 10]);
        });

        it('should handle empty arrays correctly', async () => {
            const result = await mapWithConcurrency([], 2, async (item) => item);
            expect(result).toEqual([]);
        });

        it('should throw if any task fails', async () => {
            const items = [1, 2, 3];
            const promise = mapWithConcurrency(items, 2, async (item) => {
                if (item === 2) {
                    throw new Error('Test Failure');
                }
                return item;
            });

            await expect(promise).rejects.toThrow('Test Failure');
        });
    });
});
