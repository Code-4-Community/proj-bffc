import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

import { CreateAdminEventDto } from './create-admin-event.dto';

const valid = {
  site_id: '11111111-1111-4111-8111-111111111111',
  name: 'Fall Harvest',
  description: 'Cider and potluck',
  place: 'Orchard',
  date: '2026-10-25',
  startTime: '14:00:00',
  endTime: '16:00:00',
  registrationLink: 'https://lu.ma/harvest',
};

async function messages(body: Record<string, unknown>): Promise<string[]> {
  const errors = await validate(plainToInstance(CreateAdminEventDto, body));
  return errors.flatMap((e) => Object.values(e.constraints ?? {}));
}

describe('CreateAdminEventDto', () => {
  it('accepts a valid payload, with or without flyerS3Key', async () => {
    expect(await messages(valid)).toEqual([]);
    expect(await messages({ ...valid, flyerS3Key: 'flyers/a.png' })).toEqual(
      [],
    );
    expect(
      await messages({ ...valid, startTime: '14:00', endTime: '15:30' }),
    ).toEqual([]);
  });

  it('names every missing field', async () => {
    const result = (await messages({})).join(' | ');
    for (const field of [
      'site_id',
      'name',
      'description',
      'place',
      'date',
      'startTime',
      'endTime',
      'registrationLink',
    ]) {
      expect(result).toContain(field);
    }
  });

  it('rejects end time before or equal to start time', async () => {
    expect(await messages({ ...valid, endTime: '13:00:00' })).toContain(
      'endTime must be after startTime',
    );
    expect(await messages({ ...valid, endTime: '14:00' })).toContain(
      'endTime must be after startTime',
    );
  });

  it('rejects malformed or non-Luma links', async () => {
    for (const link of [
      'not a url',
      'http://lu.ma/x',
      'https://evil.com/lu.ma',
      'https://notlu.ma/x',
    ]) {
      expect(
        (await messages({ ...valid, registrationLink: link })).join(),
      ).toContain('registrationLink must be a valid https Luma event link');
    }
    expect(
      await messages({ ...valid, registrationLink: 'https://luma.com/e/abc' }),
    ).toEqual([]);
  });

  it('rejects a bad site_id, date and time', async () => {
    expect(await messages({ ...valid, site_id: 'nope' })).toContain(
      'site_id must be a UUID',
    );
    expect(await messages({ ...valid, date: '25-10-2026' })).toContain(
      'date must be in YYYY-MM-DD format',
    );
    expect(await messages({ ...valid, startTime: '25:00' })).toContain(
      'startTime must be in HH:MM or HH:MM:SS format',
    );
  });
});
