import * as migration_20260419_133509_livestreams from './20260419_133509_livestreams'
import * as migration_20260420_163500_stream_chat_mirror from './20260420_163500_stream_chat_mirror'
import * as migration_20260420_173000_comments_reactions from './20260420_173000_comments_reactions'
import * as migration_20260423_153457_add_mcp_listings_columns from './20260423_153457_add_mcp_listings_columns'
import * as migration_20260423_223500_listings_description_richtext from './20260423_223500_listings_description_richtext'
import * as migration_20260423_224700_fix_listings_description_richtext_cast from './20260423_224700_fix_listings_description_richtext_cast'
import * as migration_20260424_120000_portal_split_latest_range from './20260424_120000_portal_split_latest_range'
import * as migration_20260428_045904_add_portal_split_custom_accent_hex from './20260428_045904_add_portal_split_custom_accent_hex'
import * as migration_20260429_113926_add_roles_and_audit_tables from './20260429_113926_add_roles_and_audit_tables'
import * as migration_20260429_194900_fix_audit_logs_schema from './20260429_194900_fix_audit_logs_schema'
import * as migration_20260429_195200_relax_legacy_audit_logs_constraints from './20260429_195200_relax_legacy_audit_logs_constraints'
import * as migration_20260429_195500_relax_all_legacy_audit_logs_not_null from './20260429_195500_relax_all_legacy_audit_logs_not_null'
import * as migration_20260509_120000_audit_logs_backfill_required_columns from './20260509_120000_audit_logs_backfill_required_columns'
import * as migration_20260510_000000_add_livestream_cover_image from './20260510_000000_add_livestream_cover_image'
import * as migration_20260510_175149 from './20260510_175149'
import * as migration_20260510_180410 from './20260510_180410'
import * as migration_20260511_010000_add_portal_split_title_hrefs from './20260511_010000_add_portal_split_title_hrefs'

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
    name: '20260428_045904_add_portal_split_custom_accent_hex',
  },
  {
    up: migration_20260429_113926_add_roles_and_audit_tables.up,
    down: migration_20260429_113926_add_roles_and_audit_tables.down,
    name: '20260429_113926_add_roles_and_audit_tables',
  },
  {
    up: migration_20260429_194900_fix_audit_logs_schema.up,
    down: migration_20260429_194900_fix_audit_logs_schema.down,
    name: '20260429_194900_fix_audit_logs_schema',
  },
  {
    up: migration_20260429_195200_relax_legacy_audit_logs_constraints.up,
    down: migration_20260429_195200_relax_legacy_audit_logs_constraints.down,
    name: '20260429_195200_relax_legacy_audit_logs_constraints',
  },
  {
    up: migration_20260429_195500_relax_all_legacy_audit_logs_not_null.up,
    down: migration_20260429_195500_relax_all_legacy_audit_logs_not_null.down,
    name: '20260429_195500_relax_all_legacy_audit_logs_not_null',
  },
  {
    up: migration_20260509_120000_audit_logs_backfill_required_columns.up,
    down: migration_20260509_120000_audit_logs_backfill_required_columns.down,
    name: '20260509_120000_audit_logs_backfill_required_columns',
  },
  {
    up: migration_20260510_000000_add_livestream_cover_image.up,
    down: migration_20260510_000000_add_livestream_cover_image.down,
    name: '20260510_000000_add_livestream_cover_image',
  },
  {
    up: migration_20260510_175149.up,
    down: migration_20260510_175149.down,
    name: '20260510_175149',
  },
  {
    up: migration_20260510_180410.up,
    down: migration_20260510_180410.down,
    name: '20260510_180410',
  },
  {
    up: migration_20260511_010000_add_portal_split_title_hrefs.up,
    down: migration_20260511_010000_add_portal_split_title_hrefs.down,
    name: '20260511_010000_add_portal_split_title_hrefs',
  },
]
