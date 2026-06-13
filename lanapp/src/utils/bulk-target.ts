import { SheepTarget } from '@sheep/domain';
import { SheepRepository } from '../repositories/sheep.repository';

export type BulkResult = {
    succeeded: { sheepId: string; recordId: string }[];
    failed: { sheepId: string; error: string }[];
    total: number;
};

export function emptyBulkResult(): BulkResult {
    return { succeeded: [], failed: [], total: 0 };
}

export async function resolveSheepIds(
    sheepRepository: SheepRepository,
    target: SheepTarget
): Promise<string[]> {
    if (target.sheepIds?.length) {
        return [...new Set(target.sheepIds)];
    }
    if (target.filters) {
        const sheep = await sheepRepository.findFiltered(target.filters);
        return sheep.map(s => s.id);
    }
    return [];
}
