import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

import { CreatePlantDto } from './create-plant.dto';

const siteId = '11111111-1111-4111-8111-111111111111';

async function messages(body: Record<string, unknown>): Promise<string[]> {
  const errors = await validate(plainToInstance(CreatePlantDto, body));
  return errors.flatMap((e) => Object.values(e.constraints ?? {}));
}

describe('CreatePlantDto', () => {
  it('accepts just a name', async () => {
    expect(await messages({ name: 'Paw Paw' })).toEqual([]);
  });

  it('accepts every optional field', async () => {
    expect(
      await messages({
        name: 'Paw Paw',
        imageS3Key: 'plants/paw-paw.jpg',
        description: 'A native fruit tree',
        flavor: 'Custardy',
        harvestSeason: 'Late summer',
        howToHarvest: 'Pick when soft',
        recipes: ['https://example.com/pudding', 'Paw paw smoothie'],
        siteIds: [siteId],
      }),
    ).toEqual([]);
  });

  it('accepts empty optional strings and empty lists', async () => {
    expect(
      await messages({
        name: 'Paw Paw',
        description: '',
        flavor: '',
        recipes: [],
        siteIds: [],
      }),
    ).toEqual([]);
  });

  it('rejects a missing, empty or whitespace-only name', async () => {
    expect(await messages({})).toContain('name must be a string');
    expect(await messages({ name: '' })).toContain('name should not be empty');
    expect(await messages({ name: '   ' })).toContain(
      'name should not be empty',
    );
  });

  it('rejects invalid field types, naming the field', async () => {
    expect(await messages({ name: 42 })).toContain('name must be a string');
    expect(await messages({ name: 'Mint', flavor: 5 })).toContain(
      'flavor must be a string',
    );
    expect(await messages({ name: 'Mint', recipes: 'pudding' })).toContain(
      'recipes must be an array of strings',
    );
    expect(await messages({ name: 'Mint', recipes: ['ok', 3] })).toContain(
      'each value in recipes must be a string',
    );
    expect(await messages({ name: 'Mint', siteIds: siteId })).toContain(
      'siteIds must be an array of site IDs',
    );
  });

  it('rejects malformed or duplicate site IDs', async () => {
    expect(
      await messages({ name: 'Mint', siteIds: [siteId, 'not-a-uuid'] }),
    ).toContain('each value in siteIds must be a UUID');
    expect(
      await messages({ name: 'Mint', siteIds: [siteId, siteId] }),
    ).toContain('siteIds must not contain duplicates');
  });
});
