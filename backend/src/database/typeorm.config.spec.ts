import { getTypeOrmConfig } from './typeorm.config';

describe('getTypeOrmConfig', () => {
  it('uses a local sqlite-compatible fallback when no postgres host is configured', () => {
    const config = getTypeOrmConfig();

    expect(config.type).toBe('better-sqlite3');
    expect(config.database).toBe(':memory:');
  });
});
