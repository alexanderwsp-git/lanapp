import { Gender, SheepBreed, SheepStatus, SheepCategory, RecordType, BirthType } from '@sheep/domain';
import * as XLSX from 'xlsx';
import { SheepService } from './sheep.service';
import { HealthCheckService } from './health-check.service';

import { randomUUID } from 'crypto';

interface ImportPreviewRow {
    row: number;
    tag: string;
    name?: string;
    gender?: string;
    status: 'valid' | 'error';
    message?: string;
}

export class ImportService {
    private sheepService: SheepService;
    private healthCheckService: HealthCheckService;

    constructor() {
        this.sheepService = new SheepService();
        this.healthCheckService = new HealthCheckService();
    }

    parseInventoryFile(buffer: Buffer): ImportPreviewRow[] {
        const workbook = XLSX.read(buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);

        return rows.map((row, index) => {
            const tag = String(row['ARETE'] || row['arete'] || row['Tag'] || row['tag'] || '');
            const name = String(row['NOMBRE'] || row['nombre'] || row['Name'] || row['name'] || '');

            if (!tag) {
                return { row: index + 2, tag: '', status: 'error' as const, message: 'Missing tag' };
            }

            return { row: index + 2, tag, name: name || undefined, status: 'valid' as const };
        });
    }

    async importInventory(buffer: Buffer, username: string): Promise<{ imported: number; errors: string[] }> {
        const workbook = XLSX.read(buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);

        let imported = 0;
        const errors: string[] = [];

        for (const [index, row] of rows.entries()) {
            try {
                const tag = String(row['ARETE'] || row['arete'] || row['Tag'] || '');
                if (!tag) continue;

                const genderRaw = String(row['SEXO'] || row['sexo'] || 'HEMBRA').toUpperCase();
                const gender = genderRaw.includes('MACHO') ? Gender.MALE : Gender.FEMALE;

                await this.sheepService.create(
                    {
                        id: randomUUID(),
                        tag,
                        name: String(row['NOMBRE'] || row['nombre'] || '') || undefined,
                        breed: SheepBreed.CRIOLLA,
                        gender,
                        birthDate: this.parseExcelDate(row['FECHA NAC'] || row['birthDate']) || new Date(),
                        birthType: BirthType.SINGLE,
                        weight: Number(row['PESO'] || row['peso'] || 3.5),
                        status: SheepStatus.ACTIVE,
                        category:
                            gender === Gender.MALE
                                ? SheepCategory.CORDERO
                                : SheepCategory.CORDERA,
                        recordType: RecordType.BORN,
                        notes: String(row['OBSERVACIONES'] || row['observaciones'] || '') || undefined,
                    },
                    username
                );
                imported++;
            } catch (err) {
                errors.push(`Row ${index + 2}: ${err instanceof Error ? err.message : 'Unknown error'}`);
            }
        }

        return { imported, errors };
    }

    async importFamacha(buffer: Buffer, username: string): Promise<{ imported: number; errors: string[] }> {
        const workbook = XLSX.read(buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);

        let imported = 0;
        const errors: string[] = [];

        for (const [index, row] of rows.entries()) {
            try {
                const tag = String(row['ARETE'] || row['arete'] || row['Tag'] || '');
                const score = Number(row['FAMACHA'] || row['famacha'] || row['Score'] || 0);
                if (!tag || !score) continue;

                const { data: sheepList } = await this.sheepService.findAll(1, 10000);
                const sheep = sheepList.find(s => s.tag === tag);
                if (!sheep) {
                    errors.push(`Row ${index + 2}: Sheep with tag ${tag} not found`);
                    continue;
                }

                await this.healthCheckService.recordCheck(
                    {
                        sheepId: sheep.id,
                        checkDate: this.parseExcelDate(row['FECHA'] || row['fecha']) || new Date(),
                        famachaScore: score,
                        notes: String(row['OBSERVACIONES'] || '') || undefined,
                    },
                    username
                );
                imported++;
            } catch (err) {
                errors.push(`Row ${index + 2}: ${err instanceof Error ? err.message : 'Unknown error'}`);
            }
        }

        return { imported, errors };
    }

    private parseExcelDate(value: unknown): Date | null {
        if (!value) return null;
        if (value instanceof Date) return value;
        if (typeof value === 'number') {
            const date = XLSX.SSF.parse_date_code(value);
            return new Date(date.y, date.m - 1, date.d);
        }
        const parsed = new Date(String(value));
        return isNaN(parsed.getTime()) ? null : parsed;
    }
}
