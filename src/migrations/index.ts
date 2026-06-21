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
import * as migration_20260511_074420 from './20260511_074420'
import * as migration_20260511_173500_media_hub_triptych_media_items from './20260511_173500_media_hub_triptych_media_items'
import * as migration_20260511_174500_add_media_items_to_pages_rels from './20260511_174500_add_media_items_to_pages_rels'
import * as migration_20260512_000000_listing_create_block from './20260512_000000_listing_create_block'
import * as migration_20260516_223553_add_mobile_header_banner from './20260516_223553_add_mobile_header_banner'
import * as migration_20260516_235700_portal_split_humanitarian_items from './20260516_235700_portal_split_humanitarian_items'
import * as migration_20260517_120000_portal_split_mobile_ad_fields from './20260517_120000_portal_split_mobile_ad_fields'
import * as migration_20260517_180000_targeted_ad_slot_block from './20260517_180000_targeted_ad_slot_block'
import * as migration_20260517_210000_remove_portal_split_mobile_ad_fields from './20260517_210000_remove_portal_split_mobile_ad_fields'
import * as migration_20260517_220000_tas_target_element_id_nullable from './20260517_220000_tas_target_element_id_nullable'
import * as migration_20260522_120000_media_block_visible from './20260522_120000_media_block_visible'
import * as migration_20260522_120001_fix_media_block_visible_columns from './20260522_120001_fix_media_block_visible_columns'
import * as migration_20260531_000000_guest_comments from './20260531_000000_guest_comments'
import * as migration_20260601_000000_post_comments_disabled from './20260601_000000_post_comments_disabled'
import * as migration_20260622_000000_post_display_on from './20260622_000000_post_display_on'

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
  {
    up: migration_20260511_074420.up,
    down: migration_20260511_074420.down,
    name: '20260511_074420',
  },
  {
    up: migration_20260511_173500_media_hub_triptych_media_items.up,
    down: migration_20260511_173500_media_hub_triptych_media_items.down,
    name: '20260511_173500_media_hub_triptych_media_items',
  },
  {
    up: migration_20260511_174500_add_media_items_to_pages_rels.up,
    down: migration_20260511_174500_add_media_items_to_pages_rels.down,
    name: '20260511_174500_add_media_items_to_pages_rels',
  },
  {
    up: migration_20260512_000000_listing_create_block.up,
    down: migration_20260512_000000_listing_create_block.down,
    name: '20260512_000000_listing_create_block',
  },
  {
    up: migration_20260516_223553_add_mobile_header_banner.up,
    down: migration_20260516_223553_add_mobile_header_banner.down,
    name: '20260516_223553_add_mobile_header_banner',
  },
  {
    up: migration_20260516_235700_portal_split_humanitarian_items.up,
    down: migration_20260516_235700_portal_split_humanitarian_items.down,
    name: '20260516_235700_portal_split_humanitarian_items',
  },
  {
    up: migration_20260517_120000_portal_split_mobile_ad_fields.up,
    down: migration_20260517_120000_portal_split_mobile_ad_fields.down,
    name: '20260517_120000_portal_split_mobile_ad_fields',
  },
  {
    up: migration_20260517_180000_targeted_ad_slot_block.up,
    down: migration_20260517_180000_targeted_ad_slot_block.down,
    name: '20260517_180000_targeted_ad_slot_block',
  },
  {
    up: migration_20260517_210000_remove_portal_split_mobile_ad_fields.up,
    down: migration_20260517_210000_remove_portal_split_mobile_ad_fields.down,
    name: '20260517_210000_remove_portal_split_mobile_ad_fields',
  },
  {
    up: migration_20260517_220000_tas_target_element_id_nullable.up,
    down: migration_20260517_220000_tas_target_element_id_nullable.down,
    name: '20260517_220000_tas_target_element_id_nullable',
  },
  {
    up: migration_20260522_120000_media_block_visible.up,
    down: migration_20260522_120000_media_block_visible.down,
    name: '20260522_120000_media_block_visible',
  },
  {
    up: migration_20260522_120001_fix_media_block_visible_columns.up,
    down: migration_20260522_120001_fix_media_block_visible_columns.down,
    name: '20260522_120001_fix_media_block_visible_columns',
  },
  {
    up: migration_20260531_000000_guest_comments.up,
    down: migration_20260531_000000_guest_comments.down,
    name: '20260531_000000_guest_comments',
  },
  {
    up: migration_20260601_000000_post_comments_disabled.up,
    down: migration_20260601_000000_post_comments_disabled.down,
    name: '20260601_000000_post_comments_disabled',
  },
  {
    up: migration_20260622_000000_post_display_on.up,
    down: migration_20260622_000000_post_display_on.down,
    name: '20260622_000000_post_display_on',
  },
]
