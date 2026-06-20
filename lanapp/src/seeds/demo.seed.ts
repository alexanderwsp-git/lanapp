import {
    AnalysisKind,
    AnalysisStatus,
    BirthType,
    BreedingCycleStatus,
    BreedingResult,
    DiagnosisType,
    Gender,
    MatingStatus,
    MedicineStatus,
    MedicineType,
    PregnancyCheckKind,
    RecordType,
    SheepBreed,
    SheepCategory,
    SheepStatus,
} from '@sheep/domain';
import { DataSource, Repository } from 'typeorm';
import { Analysis } from '../entities/analysis.entity';
import { AnalysisTypeEntity } from '../entities/analysis-type.entity';
import { BreedingCycle } from '../entities/breeding-cycle.entity';
import { Location } from '../entities/location.entity';
import { Mating } from '../entities/mating.entity';
import { Medicine } from '../entities/medicine.entity';
import { MedicineApplication } from '../entities/medicine-application.entity';
import { PregnancyCheck } from '../entities/pregnancy-check.entity';
import { Sheep } from '../entities/sheep.entity';
import { DEMO_IDS } from './demo-ids';

const SEED_USER = 'demo-seed';

function dateOnly(value: string): Date {
    return new Date(`${value}T00:00:00.000Z`);
}

function todayIso(): string {
    return new Date().toISOString().slice(0, 10);
}

function addDays(iso: string, days: number): string {
    const d = new Date(`${iso}T00:00:00.000Z`);
    d.setUTCDate(d.getUTCDate() + days);
    return d.toISOString().slice(0, 10);
}

async function saveIfMissing<T extends { id: string }>(
    repo: Repository<T>,
    entity: Partial<T> & { id: string }
): Promise<void> {
    const existing = await repo.findOne({ where: { id: entity.id } as never });
    if (existing) return;
    await repo.save({
        ...entity,
        createdBy: SEED_USER,
        updatedBy: SEED_USER,
    } as unknown as T);
}

export async function runDemoSeed(dataSource: DataSource, options: { force?: boolean } = {}): Promise<void> {
    const analysisRepo = dataSource.getRepository(Analysis);
    const seeded = await analysisRepo.findOne({ where: { id: DEMO_IDS.analyses.blancaFamachaLow } });
    if (seeded && !options.force) {
        console.log('Demo seed skipped — already applied. Set DEMO_SEED_FORCE=true to re-run.');
        return;
    }

    const sheepRepo = dataSource.getRepository(Sheep);
    const locationRepo = dataSource.getRepository(Location);
    const medicineRepo = dataSource.getRepository(Medicine);
    const analysisTypeRepo = dataSource.getRepository(AnalysisTypeEntity);
    const medAppRepo = dataSource.getRepository(MedicineApplication);
    const matingRepo = dataSource.getRepository(Mating);
    const pregRepo = dataSource.getRepository(PregnancyCheck);
    const cycleRepo = dataSource.getRepository(BreedingCycle);

    const today = todayIso();

    // --- Locations ---
    for (const loc of [
        { id: DEMO_IDS.locations.sanAlfonso, name: 'G San Alfonso', address: 'Riobamba, Chimborazo', description: 'Potrero principal' },
        { id: DEMO_IDS.locations.potreroNorte, name: 'Potrero Norte', address: 'Riobamba, Chimborazo', description: 'Área norte' },
        { id: DEMO_IDS.locations.potreroSur, name: 'Potrero Sur', address: 'Riobamba, Chimborazo', description: 'Área sur' },
    ]) {
        await saveIfMissing(locationRepo, loc);
    }

    // --- Sheep (hero flock for montas, análisis, medicina) ---
    const sheepRows: Array<Partial<Sheep> & { id: string; tag: string }> = [
        {
            id: DEMO_IDS.sheep.toro,
            tag: 'SA-055',
            name: 'Toro',
            breed: SheepBreed.DORPER,
            gender: Gender.MALE,
            birthDate: dateOnly('2023-02-10'),
            birthType: BirthType.SINGLE,
            weight: 68,
            status: SheepStatus.ACTIVE,
            category: SheepCategory.REPRODUCTOR,
            recordType: RecordType.PURCHASED,
            currentLocation: { id: DEMO_IDS.locations.sanAlfonso } as Location,
            isBreedingRam: true,
            isPregnant: false,
        },
        {
            id: DEMO_IDS.sheep.luna,
            tag: 'SA-103',
            name: 'Luna',
            breed: SheepBreed.DORSET,
            gender: Gender.FEMALE,
            birthDate: dateOnly('2024-03-20'),
            birthType: BirthType.SINGLE,
            weight: 52,
            status: SheepStatus.ACTIVE,
            category: SheepCategory.OVEJA_PRENADA,
            recordType: RecordType.PURCHASED,
            currentLocation: { id: DEMO_IDS.locations.sanAlfonso } as Location,
            isPregnant: true,
            lastMountedDate: dateOnly('2026-03-15'),
            pregnancyConfirmedAt: dateOnly('2026-04-14'),
            matingCount: 2,
            effectivenessCount: 1,
        },
        {
            id: DEMO_IDS.sheep.negro,
            tag: 'SA-042',
            name: 'Negro',
            breed: SheepBreed.HAMPSHIRE,
            gender: Gender.MALE,
            birthDate: dateOnly('2025-08-03'),
            birthType: BirthType.SINGLE,
            weight: 45.2,
            status: SheepStatus.ACTIVE,
            category: SheepCategory.BORREGO,
            recordType: RecordType.BORN,
            currentLocation: { id: DEMO_IDS.locations.potreroNorte } as Location,
            isBreedingRam: true,
            motherId: DEMO_IDS.sheep.luna,
            fatherId: DEMO_IDS.sheep.toro,
            isPregnant: false,
        },
        {
            id: DEMO_IDS.sheep.estrella,
            tag: 'SA-088',
            name: 'Estrella',
            breed: SheepBreed.DORPER,
            gender: Gender.FEMALE,
            birthDate: dateOnly('2025-05-18'),
            birthType: BirthType.SINGLE,
            weight: 38,
            status: SheepStatus.ACTIVE,
            category: SheepCategory.BORREGA,
            recordType: RecordType.BORN,
            currentLocation: { id: DEMO_IDS.locations.potreroNorte } as Location,
            motherId: DEMO_IDS.sheep.luna,
            fatherId: DEMO_IDS.sheep.toro,
            isPregnant: false,
        },
        {
            id: DEMO_IDS.sheep.blanca,
            tag: 'SA-001',
            name: 'Blanca',
            breed: SheepBreed.SUFFOLK,
            gender: Gender.FEMALE,
            birthDate: dateOnly('2026-01-15'),
            birthType: BirthType.SINGLE,
            weight: 28.5,
            status: SheepStatus.ACTIVE,
            category: SheepCategory.CORDERA_DESTETADA,
            recordType: RecordType.BORN,
            currentLocation: { id: DEMO_IDS.locations.sanAlfonso } as Location,
            motherId: DEMO_IDS.sheep.luna,
            fatherId: DEMO_IDS.sheep.toro,
            isPregnant: false,
            matingCount: 1,
        },
        {
            id: DEMO_IDS.sheep.manchas,
            tag: 'SA-015',
            name: 'Manchas',
            breed: SheepBreed.KATAHDIN,
            gender: Gender.FEMALE,
            birthDate: dateOnly('2026-03-12'),
            birthType: BirthType.SINGLE,
            weight: 18.3,
            status: SheepStatus.ACTIVE,
            category: SheepCategory.CORDERA,
            recordType: RecordType.BORN,
            currentLocation: { id: DEMO_IDS.locations.potreroSur } as Location,
            motherId: DEMO_IDS.sheep.estrella,
            fatherId: DEMO_IDS.sheep.negro,
            isPregnant: false,
        },
        {
            id: DEMO_IDS.sheep.oreja,
            tag: 'SA-022',
            name: 'Oreja',
            breed: SheepBreed.PELIBUEY,
            gender: Gender.FEMALE,
            birthDate: dateOnly('2026-03-28'),
            birthType: BirthType.SINGLE,
            weight: 16.1,
            status: SheepStatus.ACTIVE,
            category: SheepCategory.CORDERA,
            recordType: RecordType.BORN,
            currentLocation: { id: DEMO_IDS.locations.potreroSur } as Location,
            motherId: DEMO_IDS.sheep.estrella,
            fatherId: DEMO_IDS.sheep.negro,
            isPregnant: false,
        },
        {
            id: DEMO_IDS.sheep.rosa,
            tag: 'SA-077',
            name: 'Rosa',
            breed: SheepBreed.SANTA_INES,
            gender: Gender.FEMALE,
            birthDate: dateOnly('2024-11-30'),
            birthType: BirthType.SINGLE,
            weight: 31,
            status: SheepStatus.QUARANTINE,
            category: SheepCategory.OVEJA_VACIA,
            recordType: RecordType.TRANSFERRED,
            currentLocation: { id: DEMO_IDS.locations.potreroSur } as Location,
            quarantineEndDate: dateOnly('2026-07-01'),
            isPregnant: false,
        },
        {
            id: DEMO_IDS.sheep.pelusa,
            tag: 'SA-031',
            name: 'Pelusa',
            breed: SheepBreed.CRIOLLA,
            gender: Gender.FEMALE,
            birthDate: dateOnly('2026-03-04'),
            birthType: BirthType.SINGLE,
            weight: 21.8,
            status: SheepStatus.ACTIVE,
            category: SheepCategory.CORDERA,
            recordType: RecordType.BORN,
            currentLocation: { id: DEMO_IDS.locations.potreroSur } as Location,
            motherId: DEMO_IDS.sheep.estrella,
            fatherId: DEMO_IDS.sheep.negro,
            isPregnant: false,
        },
    ];
    for (const row of sheepRows) {
        await saveIfMissing(sheepRepo, row);
    }

    // --- Medicines ---
    for (const med of [
        { id: DEMO_IDS.medicines.ivermectina, type: MedicineType.DEWORMER, name: 'Ivermectina', dosage: '1ml/50kg', description: 'Antiparasitario de amplio espectro.' },
        { id: DEMO_IDS.medicines.albendazol, type: MedicineType.DEWORMER, name: 'Albendazol', dosage: '1 comprimido/40kg', description: 'Desparasitante oral.' },
        { id: DEMO_IDS.medicines.complejoB, type: MedicineType.VITAMIN, name: 'Complejo B', dosage: '5ml', description: 'Suplemento vitamínico.' },
        { id: DEMO_IDS.medicines.clostridial, type: MedicineType.VACCINE, name: 'Clostridial', dosage: '2ml', description: 'Vacuna clostridial.' },
    ]) {
        await saveIfMissing(medicineRepo, med);
    }

    // --- Analysis types (upsert by id; migration may have created FAMACHA/Copro without fixed ids) ---
    for (const t of [
        { id: DEMO_IDS.analysisTypes.famacha, type: AnalysisKind.FAMACHA, name: 'FAMACHA', description: 'Anemia por mucosa ocular (1–5)', defaultUnit: '1–5', recommendedMedicineType: MedicineType.DEWORMER },
        { id: DEMO_IDS.analysisTypes.coprological, type: AnalysisKind.COPROLOGICAL, name: 'Coprológico', description: 'Carga parasitaria', defaultUnit: 'hpg', recommendedMedicineType: MedicineType.DEWORMER },
        { id: DEMO_IDS.analysisTypes.bodyCondition, type: AnalysisKind.BODY_CONDITION, name: 'Condición corporal', description: 'Puntaje 1–5', defaultUnit: '1–5' },
        { id: DEMO_IDS.analysisTypes.blood, type: AnalysisKind.BLOOD, name: 'Hemograma', description: 'Panel sanguíneo básico', defaultUnit: 'g/dL', recommendedMedicineType: MedicineType.VITAMIN },
    ]) {
        await saveIfMissing(analysisTypeRepo, t);
    }

    // --- Analyses: history + scheduled (batch / inline treatment testing) ---
    for (const a of [
        {
            id: DEMO_IDS.analyses.blancaFamachaLow,
            analysisTypeId: DEMO_IDS.analysisTypes.famacha,
            sheepId: DEMO_IDS.sheep.blanca,
            scheduledDate: dateOnly('2026-06-01'),
            completedDate: dateOnly('2026-06-01'),
            status: AnalysisStatus.COMPLETED,
            famachaScore: 2,
            resultValue: '2',
            diagnosis: 'Anemia — desparasitar',
            notes: 'FAMACHA bajo — tratamiento vinculado en medicina',
        },
        {
            id: DEMO_IDS.analyses.blancaFamachaOk,
            analysisTypeId: DEMO_IDS.analysisTypes.famacha,
            sheepId: DEMO_IDS.sheep.blanca,
            scheduledDate: dateOnly('2026-05-01'),
            completedDate: dateOnly('2026-05-01'),
            status: AnalysisStatus.COMPLETED,
            famachaScore: 4,
            resultValue: '4',
            diagnosis: 'Sin alerta',
        },
        {
            id: DEMO_IDS.analyses.blancaCoproHigh,
            analysisTypeId: DEMO_IDS.analysisTypes.coprological,
            sheepId: DEMO_IDS.sheep.blanca,
            scheduledDate: dateOnly('2026-05-20'),
            completedDate: dateOnly('2026-05-20'),
            status: AnalysisStatus.COMPLETED,
            resultValue: '650 hpg (Alto)',
            diagnosis: 'Carga parasitaria alta',
            notes: 'Recomienda desparasitar',
        },
        {
            id: DEMO_IDS.analyses.estrellaFamachaDue,
            analysisTypeId: DEMO_IDS.analysisTypes.famacha,
            sheepId: DEMO_IDS.sheep.estrella,
            scheduledDate: dateOnly(today),
            status: AnalysisStatus.SCHEDULED,
            notes: 'Control mensual — probar resultado individual',
        },
        {
            id: DEMO_IDS.analyses.manchasCoproDue,
            analysisTypeId: DEMO_IDS.analysisTypes.coprological,
            sheepId: DEMO_IDS.sheep.manchas,
            scheduledDate: dateOnly(addDays(today, 2)),
            status: AnalysisStatus.SCHEDULED,
            notes: 'Programado — probar coprológico alto',
        },
        {
            id: DEMO_IDS.analyses.orejaFamachaDue,
            analysisTypeId: DEMO_IDS.analysisTypes.famacha,
            sheepId: DEMO_IDS.sheep.oreja,
            scheduledDate: dateOnly(today),
            status: AnalysisStatus.SCHEDULED,
            notes: 'Batch FAMACHA — oveja 1',
        },
        {
            id: DEMO_IDS.analyses.pelusaFamachaDue,
            analysisTypeId: DEMO_IDS.analysisTypes.famacha,
            sheepId: DEMO_IDS.sheep.pelusa,
            scheduledDate: dateOnly(today),
            status: AnalysisStatus.SCHEDULED,
            notes: 'Batch FAMACHA — oveja 2',
        },
        {
            id: DEMO_IDS.analyses.rosaBloodDue,
            analysisTypeId: DEMO_IDS.analysisTypes.blood,
            sheepId: DEMO_IDS.sheep.rosa,
            scheduledDate: dateOnly(today),
            status: AnalysisStatus.SCHEDULED,
            notes: 'Tipo custom con recommendedMedicineType',
        },
    ]) {
        await saveIfMissing(analysisRepo, a);
    }

    // --- Medicine applications (incl. analysisId link) ---
    await saveIfMissing(medAppRepo, {
        id: DEMO_IDS.medicineApps.fromBlancaAnalysis,
        medicineId: DEMO_IDS.medicines.ivermectina,
        sheepId: DEMO_IDS.sheep.blanca,
        analysisId: DEMO_IDS.analyses.blancaFamachaLow,
        applicationDate: dateOnly(today),
        status: MedicineStatus.SCHEDULED,
        notes: 'Desde análisis: FAMACHA — Anemia — desparasitar',
    });
    await saveIfMissing(medAppRepo, {
        id: DEMO_IDS.medicineApps.scheduledNegro,
        medicineId: DEMO_IDS.medicines.complejoB,
        sheepId: DEMO_IDS.sheep.negro,
        applicationDate: dateOnly(addDays(today, 3)),
        status: MedicineStatus.SCHEDULED,
        notes: 'Refuerzo vitamínico programado',
    });

    // --- Montas + diagnóstico preñez (ECO) ---
    await saveIfMissing(matingRepo, {
        id: DEMO_IDS.matings.m1,
        maleId: DEMO_IDS.sheep.toro,
        femaleId: DEMO_IDS.sheep.luna,
        matingDate: dateOnly('2026-03-15'),
        expectedBirthDate: dateOnly(addDays('2026-03-15', 147)),
        status: MatingStatus.EFFECTIVE,
    });
    await saveIfMissing(matingRepo, {
        id: DEMO_IDS.matings.m2,
        maleId: DEMO_IDS.sheep.negro,
        femaleId: DEMO_IDS.sheep.blanca,
        matingDate: dateOnly('2026-02-10'),
        status: MatingStatus.INEFFECTIVE,
    });
    await saveIfMissing(matingRepo, {
        id: DEMO_IDS.matings.m3,
        maleId: DEMO_IDS.sheep.toro,
        femaleId: DEMO_IDS.sheep.estrella,
        matingDate: dateOnly('2026-03-16'),
        expectedBirthDate: dateOnly(addDays('2026-03-16', 147)),
        status: MatingStatus.PENDING,
    });

    await saveIfMissing(pregRepo, {
        id: DEMO_IDS.pregnancyChecks.p1,
        matingId: DEMO_IDS.matings.m1,
        checkDate: dateOnly('2026-04-14'),
        isPregnant: true,
        checkType: DiagnosisType.ECO,
        kind: PregnancyCheckKind.DIAGNOSIS,
        notes: 'ECO positivo',
    });
    await saveIfMissing(pregRepo, {
        id: DEMO_IDS.pregnancyChecks.p2,
        matingId: DEMO_IDS.matings.m2,
        checkDate: dateOnly('2026-03-12'),
        isPregnant: false,
        checkType: DiagnosisType.ECO,
        kind: PregnancyCheckKind.DIAGNOSIS,
        notes: 'Vacía — marcar Vitasel en planificador',
    });

    await saveIfMissing(cycleRepo, {
        id: DEMO_IDS.breedingCycles.b1,
        eweId: DEMO_IDS.sheep.luna,
        ramId: DEMO_IDS.sheep.toro,
        matingId: DEMO_IDS.matings.m1,
        cycleName: '2026-A',
        matingDate: dateOnly('2026-03-15'),
        expectedBirthDate: dateOnly(addDays('2026-03-15', 147)),
        vitaselApplied: true,
        status: BreedingCycleStatus.ACTIVE,
    });
    await saveIfMissing(cycleRepo, {
        id: DEMO_IDS.breedingCycles.b2,
        eweId: DEMO_IDS.sheep.estrella,
        ramId: DEMO_IDS.sheep.toro,
        matingId: DEMO_IDS.matings.m3,
        cycleName: '2026-A',
        matingDate: dateOnly('2026-03-16'),
        expectedBirthDate: dateOnly(addDays('2026-03-16', 147)),
        status: BreedingCycleStatus.ACTIVE,
    });
    await saveIfMissing(cycleRepo, {
        id: DEMO_IDS.breedingCycles.b3,
        eweId: DEMO_IDS.sheep.blanca,
        ramId: DEMO_IDS.sheep.negro,
        matingId: DEMO_IDS.matings.m2,
        cycleName: '2026-A',
        matingDate: dateOnly('2026-02-10'),
        diagnosisType: DiagnosisType.ECO,
        diagnosisDate: dateOnly('2026-03-12'),
        result: BreedingResult.EMPTY,
        vitaselApplied: true,
        status: BreedingCycleStatus.ACTIVE,
    });

    console.log('Demo seed complete.');
    console.log('  Análisis: /analysis — FAMACHA/copro programados hoy (batch + individual)');
    console.log('  Medicina: aplicación vinculada a análisis en SA-001 (Blanca)');
    console.log('  Montas/Planificador: Luna preñada, Blanca vacía + Vitasel');
}
