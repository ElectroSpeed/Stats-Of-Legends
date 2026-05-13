
/**
 * Utility to recursively convert BigInt values to strings in an object.
 * Useful for JSON serialization in Next.js API routes.
 */
export function serializeBigInt(obj: any): any {
    if (obj === null || obj === undefined) return obj;
    
    if (typeof obj === 'bigint') {
        return obj.toString();
    }
    
    if (Array.isArray(obj)) {
        return obj.map(serializeBigInt);
    }
    
    if (typeof obj === 'object') {
        const newObj: any = {};
        for (const key in obj) {
            newObj[key] = serializeBigInt(obj[key]);
        }
        return newObj;
    }
    
    return obj;
}
