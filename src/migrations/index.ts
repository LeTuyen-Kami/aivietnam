import * as migration_20260419_133509_livestreams from './20260419_133509_livestreams';
import * as migration_20260420_163500_stream_chat_mirror from './20260420_163500_stream_chat_mirror';
import * as migration_20260420_173000_comments_reactions from './20260420_173000_comments_reactions';

export const migrations = [
  {
    up: migration_20260419_133509_livestreams.up,
    down: migration_20260419_133509_livestreams.down,
    name: '20260419_133509_livestreams'
  },
  {
    up: migration_20260420_163500_stream_chat_mirror.up,
    down: migration_20260420_163500_stream_chat_mirror.down,
    name: '20260420_163500_stream_chat_mirror'
  },
  {
    up: migration_20260420_173000_comments_reactions.up,
    down: migration_20260420_173000_comments_reactions.down,
    name: '20260420_173000_comments_reactions'
  },
];
