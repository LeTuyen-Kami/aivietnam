import * as migration_20260419_133509_livestreams from './20260419_133509_livestreams';

export const migrations = [
  {
    up: migration_20260419_133509_livestreams.up,
    down: migration_20260419_133509_livestreams.down,
    name: '20260419_133509_livestreams'
  },
];
