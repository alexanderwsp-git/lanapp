import { BaseService } from './base.service';
import { LocationRepository } from '../repositories/location.repository';
import { Location } from '../entities/location.entity';

export class LocationService extends BaseService<Location> {
    constructor() {
        super(new LocationRepository());
    }

    async findWithDetails(id: string): Promise<Location | null> {
        return (this.repository as LocationRepository).findWithDetails(id);
    }
}
