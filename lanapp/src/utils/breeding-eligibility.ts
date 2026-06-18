import { Gender, SheepCategory, SheepStatus } from '@sheep/domain';
import { Sheep } from '../entities/sheep.entity';

/** Female categories that may enter a breeding cycle (≥6 mo, not pregnant). */
const EWE_BREEDING_CATEGORIES = new Set<SheepCategory>([
    SheepCategory.BORREGA,
    SheepCategory.OVEJA_VACIA,
]);

/** Male categories that may serve as ram (mature, active). */
const RAM_BREEDING_CATEGORIES = new Set<SheepCategory>([SheepCategory.REPRODUCTOR]);

export function eweBreedingEligibility(
    ewe: Pick<Sheep, 'gender' | 'status' | 'category' | 'isPregnant'>
): string | null {
    if (ewe.gender !== Gender.FEMALE) return 'La oveja no es hembra';
    if (ewe.status !== SheepStatus.ACTIVE) return 'La oveja no está activa';
    if (ewe.isPregnant) return 'La oveja ya está preñada';
    if (!EWE_BREEDING_CATEGORIES.has(ewe.category)) {
        return `Categoría no apta para monta (${ewe.category})`;
    }
    return null;
}

export function ramBreedingEligibility(
    ram: Pick<Sheep, 'gender' | 'status' | 'category'>
): string | null {
    if (ram.gender !== Gender.MALE) return 'El reproductor no es macho';
    if (ram.status !== SheepStatus.ACTIVE) return 'El reproductor no está activo';
    if (!RAM_BREEDING_CATEGORIES.has(ram.category)) {
        return `Categoría no apta para reproducción (${ram.category})`;
    }
    return null;
}
