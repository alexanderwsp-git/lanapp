import { AnalysisKind, AnalysisStatus } from '../enums/analysis';
import { MedicineType } from '../enums/medicine';

export type AnalysisRecommendationInput = {
    status?: AnalysisStatus;
    famachaScore?: number | null;
    resultValue?: string | null;
    analysisType?: {
        type?: AnalysisKind | string;
        recommendedMedicineType?: MedicineType | string | null;
    } | null;
};

export type AnalysisRecommendation = {
    needsTreatment: boolean;
    message: string;
    /** MedicineType sugerido para prellenar la programación de medicina. */
    medicineType?: MedicineType;
};

function hasResult(record: AnalysisRecommendationInput): boolean {
    if (record.famachaScore != null) return true;
    return (record.resultValue ?? '').trim().length > 0;
}

/**
 * Dado un resultado de análisis, indica si amerita tratamiento y qué sugerir.
 * - FAMACHA ≤ 2 → desparasitar.
 * - Coprológico con resultado "alto"/"positivo" → desparasitar.
 * - Tipos personalizados → solo si hay resultado y `recommendedMedicineType` en el catálogo.
 */
export function analysisRecommendation(record: AnalysisRecommendationInput): AnalysisRecommendation {
    const type = record.analysisType?.type;

    if (type === AnalysisKind.FAMACHA && record.famachaScore != null) {
        if (record.famachaScore <= 2) {
            return {
                needsTreatment: true,
                message: 'Puntaje FAMACHA bajo: se recomienda desparasitar a la oveja.',
                medicineType: MedicineType.DEWORMER,
            };
        }
        return { needsTreatment: false, message: 'Sin alerta. No requiere tratamiento.' };
    }

    if (type === AnalysisKind.COPROLOGICAL) {
        if (!hasResult(record)) {
            return { needsTreatment: false, message: 'Sin recomendación hasta ingresar resultado.' };
        }
        const v = (record.resultValue ?? '').toLowerCase();
        const high = /(alto|alta|positiv|elevad)/.test(v) || parseInt(v, 10) >= 500;
        if (high) {
            return {
                needsTreatment: true,
                message: 'Carga parasitaria alta: se recomienda desparasitar.',
                medicineType: MedicineType.DEWORMER,
            };
        }
        return { needsTreatment: false, message: 'Carga parasitaria dentro de lo normal.' };
    }

    const recommended = record.analysisType?.recommendedMedicineType;
    if (recommended && hasResult(record)) {
        return {
            needsTreatment: true,
            message: 'El resultado podría requerir tratamiento.',
            medicineType: recommended as MedicineType,
        };
    }

    return { needsTreatment: false, message: 'Sin recomendación automática para este análisis.' };
}
