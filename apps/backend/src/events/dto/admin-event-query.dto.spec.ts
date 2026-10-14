import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

import { EventSourceType } from '../events.types';
import { AdminEventQueryDto } from './admin-event-query.dto';

async function validateQuery(plain: Record<string, unknown>) {
  const dto = plainToInstance(AdminEventQueryDto, plain);
  return validate(dto);
}

describe('AdminEventQueryDto', () => {
  it('accepts a fully populated valid query', async () => {
    const errors = await validateQuery({
      site_id: '11111111-1111-4111-8111-111111111111',
      event_type: 'harvest',
      source_type: EventSourceType.LUMA,
    });
    expect(errors).toHaveLength(0);
  });

  it('accepts an empty query (all filters optional)', async () => {
    const errors = await validateQuery({});
    expect(errors).toHaveLength(0);
  });

  it('rejects a non-UUID site_id', async () => {
    const errors = await validateQuery({ site_id: 'not-a-uuid' });
    expect(errors.some((error) => error.property === 'site_id')).toBe(true);
  });

  it('rejects an unknown source_type', async () => {
    const errors = await validateQuery({ source_type: 'luma-calendar' });
    expect(errors.some((error) => error.property === 'source_type')).toBe(true);
  });

  it('accepts an unknown event_type so the query can match nothing', async () => {
    const errors = await validateQuery({ event_type: 'does-not-exist' });
    expect(errors).toHaveLength(0);
  });
});
