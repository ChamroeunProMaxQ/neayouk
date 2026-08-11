import { Injectable } from '@nestjs/common';
import { DataSource, type EntitySubscriberInterface, EventSubscriber } from 'typeorm';

@EventSubscriber()
@Injectable()
export class NestLensModelSubscriber implements EntitySubscriberInterface {
  constructor(dataSource: DataSource) {
    if (dataSource && Array.isArray(dataSource.subscribers)) {
      dataSource.subscribers.push(this);
    }
  }

  afterLoad(entity: any, event?: any) {}
  beforeInsert(event?: any) {}
  afterInsert(event?: any) {}
  beforeUpdate(event?: any) {}
  afterUpdate(event?: any) {}
  beforeRemove(event?: any) {}
  afterRemove(event?: any) {}
}
