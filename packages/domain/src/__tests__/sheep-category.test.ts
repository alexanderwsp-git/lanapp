import { SheepCategory } from '../enums/sheep-category';

describe('SheepCategory', () => {
    it('includes all official Spanish male categories', () => {
        expect(SheepCategory.CORDERO).toBe('CORDERO');
        expect(SheepCategory.CORDERO_DESTETADO).toBe('CORDERO DESTETADO (MALTÓN)');
        expect(SheepCategory.BORREGO).toBe('BORREGO');
        expect(SheepCategory.REPRODUCTOR).toBe('REPRODUCTOR');
        expect(SheepCategory.FAENADO).toBe('FAENADO');
    });

    it('includes all official Spanish female categories', () => {
        expect(SheepCategory.CORDERA).toBe('CORDERA');
        expect(SheepCategory.CORDERA_DESTETADA).toBe('CORDERA DESTETADA (MALTONA)');
        expect(SheepCategory.BORREGA).toBe('BORREGA');
        expect(SheepCategory.BORREGA_PRENADA).toBe('BORREGA PREÑADA');
        expect(SheepCategory.OVEJA_PRENADA).toBe('OVEJA PREÑADA');
        expect(SheepCategory.OVEJA_LACTANCIA).toBe('OVEJA LACTANCIA');
        expect(SheepCategory.OVEJA_VACIA).toBe('OVEJA VACÍA');
        expect(SheepCategory.FAENADA).toBe('FAENADA');
    });

    it('unifies sale disposition as VENTA', () => {
        expect(SheepCategory.VENTA).toBe('VENTA');
    });
});
