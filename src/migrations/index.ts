import * as migration_20260419_133509_livestreams from './20260419_133509_livestreams';
import * as migration_20260420_163500_stream_chat_mirror from './20260420_163500_stream_chat_mirror';
import * as migration_20260420_173000_comments_reactions from './20260420_173000_comments_reactions';
import * as migration_20260423_153457_add_mcp_listings_columns from './20260423_153457_add_mcp_listings_columns';
import * as migration_20260423_223500_listings_description_richtext from './20260423_223500_listings_description_richtext';
import * as migration_20260423_224700_fix_listings_description_richtext_cast from './20260423_224700_fix_listings_description_richtext_cast';
import * as migration_20260424_120000_portal_split_latest_range from './20260424_120000_portal_split_latest_range';
import * as migration_20260428_045904_add_portal_split_custom_accent_hex from './20260428_045904_add_portal_split_custom_accent_hex';

export const migrations = [
  {
    up: migration_20260419_133509_livestreams.up,
    down: migration_20260419_133509_livestreams.down,
    name: '20260419_133509_livestreams',
  },
  {
    up: migration_20260420_163500_stream_chat_mirror.up,
    down: migration_20260420_163500_stream_chat_mirror.down,
    name: '20260420_163500_stream_chat_mirror',
  },
  {
    up: migration_20260420_173000_comments_reactions.up,
    down: migration_20260420_173000_comments_reactions.down,
    name: '20260420_173000_comments_reactions',
  },
  {
    up: migration_20260423_153457_add_mcp_listings_columns.up,
    down: migration_20260423_153457_add_mcp_listings_columns.down,
    name: '20260423_153457_add_mcp_listings_columns',
  },
  {
    up: migration_20260423_223500_listings_description_richtext.up,
    down: migration_20260423_223500_listings_description_richtext.down,
    name: '20260423_223500_listings_description_richtext',
  },
  {
    up: migration_20260423_224700_fix_listings_description_richtext_cast.up,
    down: migration_20260423_224700_fix_listings_description_richtext_cast.down,
    name: '20260423_224700_fix_listings_description_richtext_cast',
  },
  {
    up: migration_20260424_120000_portal_split_latest_range.up,
    down: migration_20260424_120000_portal_split_latest_range.down,
    name: '20260424_120000_portal_split_latest_range',
  },
  {
    up: migration_20260428_045904_add_portal_split_custom_accent_hex.up,
    down: migration_20260428_045904_add_portal_split_custom_accent_hex.down,
    name: '20260428_045904_add_portal_split_custom_accent_hex'
  },
];
