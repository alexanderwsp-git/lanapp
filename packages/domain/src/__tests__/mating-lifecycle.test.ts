import { BreedingResult, PregnancyCheckKind } from '../enums/breeding';
import {
    canRecordDiagnosis,
    deriveMatingPhase,
    hadTerminalEmptyBeforeAnyPregnancy,
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

    it('stays empty after Vacía then Revisar without prior Preñada', () => {
        expect(deriveMatingPhase([vacia, revisar])).toBe('empty');
    });

    it('stays empty after Vacía then Revisar then Preñada without prior Preñada', () => {
        const laterPrenada = { checkDate: '2026-07-20', isPregnant: true };
        expect(deriveMatingPhase([vacia, revisar, laterPrenada])).toBe('empty');
    });

    it('detects terminal empty before pregnancy in history order', () => {
        expect(hadTerminalEmptyBeforeAnyPregnancy([vacia, revisar])).toBe(true);
        expect(hadTerminalEmptyBeforeAnyPregnancy([prenada, vacia])).toBe(false);
        expect(hadTerminalEmptyBeforeAnyPregnancy([revisar])).toBe(false);
    });

    it('blocks Revisar when mating closed by Vacía without Preñada', () => {
        expect(canRecordDiagnosis('empty', BreedingResult.RECHECK).ok).toBe(false);
    });
});
