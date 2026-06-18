import { BreedingResult, PregnancyCheckKind } from '../enums/breeding';
import {
    canRecordDiagnosis,
    deriveMatingPhase,
    hasConfirmedPregnancy,
} from '../mating-lifecycle';

describe('mating-lifecycle', () => {
    const prenada = { checkDate: '2026-02-01', isPregnant: true };
    const revisar = { checkDate: '2026-03-01', isPregnant: false, nextCheckDate: '2026-03-15' };
    const vacia = { checkDate: '2026-03-02', isPregnant: false };

    it('detects confirmed pregnancy in history', () => {
        expect(hasConfirmedPregnancy([prenada, revisar])).toBe(true);
        expect(hasConfirmedPregnancy([revisar])).toBe(false);
    });

    it('stays pregnant after Revisar following Preñada', () => {
        expect(deriveMatingPhase([prenada, revisar])).toBe('pregnant');
    });

    it('stays pregnant after Preñada → Revisar → Preñada attempt path', () => {
        expect(deriveMatingPhase([prenada, revisar, prenada])).toBe('pregnant');
    });

    it('becomes empty only on definitive Vacía after Preñada', () => {
        expect(deriveMatingPhase([prenada, vacia])).toBe('empty');
    });

    it('pre-confirmation Revisar stays recheck', () => {
        expect(deriveMatingPhase([revisar])).toBe('recheck');
    });

    it('blocks redundant Preñada when already pregnant', () => {
        const gate = canRecordDiagnosis('pregnant', BreedingResult.PREGNANT);
        expect(gate.ok).toBe(false);
    });

    it('allows Vacía after confirmed pregnant phase', () => {
        const gate = canRecordDiagnosis('pregnant', BreedingResult.EMPTY);
        expect(gate.ok).toBe(true);
    });

    it('allows Revisar follow-up when pregnant', () => {
        const gate = canRecordDiagnosis('pregnant', BreedingResult.RECHECK);
        expect(gate.ok).toBe(true);
    });

    it('delivered phase wins over diagnosis history', () => {
        const checks = [
            prenada,
            { checkDate: '2026-07-01', isPregnant: false, kind: PregnancyCheckKind.DELIVERY },
        ];
        expect(deriveMatingPhase(checks)).toBe('delivered');
    });
});
