import { BaseRepository } from './base.repository';
import { Location } from '../entities/location.entity';

export class LocationRepository extends BaseRepository<Location> {
    constructor() {
        super(Location);
    }

    async findWithDetails(id: string): Promise<Location | null> {
        return this.repository.findOne({
            where: { id } as any,
            relations: ['sheep'],
        });
    }
}
