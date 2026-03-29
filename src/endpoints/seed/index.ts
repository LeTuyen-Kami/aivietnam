import type { CollectionSlug, Payload, PayloadRequest, File } from 'payload'

import type { Category } from '@/payload-types'

import { contactForm as contactFormData } from './contact-form'
import { contact as contactPageData } from './contact-page'
import { home } from './home'
import { createNavPage, navPages } from './nav-pages'
import { image1 } from './image-1'
import { image2 } from './image-2'
import { imageHero1 } from './image-hero-1'
import { SEED_CATEGORY_DEFS, seedBulkPosts } from './bulk-posts'

/** Thứ tự xóa phải tôn trọng FK Postgres (ví dụ posts → categories). Không dùng Promise.all song song. */
const COLLECTIONS_CLEAR_ORDER: CollectionSlug[] = [
  'search',
  'form-submissions',
  'posts',
  'pages',
  'categories',
  'media',
  'forms',
]

const globals = ['header', 'footer'] as const

// Next.js revalidation errors are normal when seeding the database without a server running
// i.e. running `yarn seed` locally instead of using the admin UI within an active app
// The app is not running to revalidate the pages and so the API routes are not available
// These error messages can be ignored: `Error hitting revalidate route for...`
export const seed = async ({
  payload,
  req,
}: {
  payload: Payload
  req: PayloadRequest
}): Promise<void> => {
  payload.logger.info('Seeding database...')

  // we need to clear the media directory before seeding
  // as well as the collections and globals
  // this is because while `yarn seed` drops the database
  // the custom `/api/seed` endpoint does not
  payload.logger.info(`— Clearing collections and globals...`)

  // clear the database
  await Promise.all(
    globals.map((global) =>
      payload.updateGlobal({
        slug: global,
        data: {
          navItems: [],
        },
        depth: 0,
        context: {
          disableRevalidate: true,
        },
      }),
    ),
  )

  for (const collection of COLLECTIONS_CLEAR_ORDER) {
    await payload.db.deleteMany({ collection, req, where: {} })
  }

  for (const collection of COLLECTIONS_CLEAR_ORDER) {
    if (payload.collections[collection]?.config.versions) {
      await payload.db.deleteVersions({ collection, req, where: {} })
    }
  }

  payload.logger.info(`— Seeding demo author and user...`)

  await payload.delete({
    collection: 'users',
    depth: 0,
    where: {
      email: {
        equals: 'demo-author@example.com',
      },
    },
  })

  payload.logger.info(`— Seeding media...`)

  const [image1Buffer, image2Buffer, image3Buffer, hero1Buffer] = await Promise.all([
    fetchFileByURL(
      'https://raw.githubusercontent.com/payloadcms/payload/refs/heads/main/templates/website/src/endpoints/seed/image-post1.webp',
    ),
    fetchFileByURL(
      'https://raw.githubusercontent.com/payloadcms/payload/refs/heads/main/templates/website/src/endpoints/seed/image-post2.webp',
    ),
    fetchFileByURL(
      'https://raw.githubusercontent.com/payloadcms/payload/refs/heads/main/templates/website/src/endpoints/seed/image-post3.webp',
    ),
    fetchFileByURL(
      'https://raw.githubusercontent.com/payloadcms/payload/refs/heads/main/templates/website/src/endpoints/seed/image-hero1.webp',
    ),
  ])

  const [demoAuthor, image1Doc, image2Doc, image3Doc, imageHomeDoc] = await Promise.all([
    payload.create({
      collection: 'users',
      data: {
        name: 'Demo Author',
        email: 'demo-author@example.com',
        password: 'password',
      },
    }),
    payload.create({
      collection: 'media',
      data: image1,
      file: image1Buffer,
    }),
    payload.create({
      collection: 'media',
      data: image2,
      file: image2Buffer,
    }),
    payload.create({
      collection: 'media',
      data: image2,
      file: image3Buffer,
    }),
    payload.create({
      collection: 'media',
      data: imageHero1,
      file: hero1Buffer,
    }),
  ])

  payload.logger.info(`— Seeding categories (5)…`)

  const categoryDocs: Category[] = []
  for (const c of SEED_CATEGORY_DEFS) {
    const doc = await payload.create({
      collection: 'categories',
      data: {
        title: c.title,
        slug: c.slug,
        parent: null,
      },
      req,
      context: { disableRevalidate: true },
    })
    categoryDocs.push(doc)
  }

  payload.logger.info(`— Seeding posts (50: 5 categories × 10)…`)

  await seedBulkPosts({
    payload,
    req,
    demoAuthor,
    images: [image1Doc, image2Doc, image3Doc],
    categoryDocs,
  })

  payload.logger.info(`— Seeding contact form...`)

  const contactForm = await payload.create({
    collection: 'forms',
    depth: 0,
    data: contactFormData,
  })

  payload.logger.info(`— Seeding pages...`)

  // Trang chủ uses home(), other 8 pages from navPages[1..8].
  // Create pages sequentially to avoid relation race conditions in hooks/plugins.
  const homePage = await payload.create({
    collection: 'pages',
    depth: 0,
    context: { disableRevalidate: true },
    data: home({ heroImage: imageHomeDoc, metaImage: image2Doc }),
  })

  await payload.create({
    collection: 'pages',
    depth: 0,
    context: { disableRevalidate: true },
    data: contactPageData({ contactForm }),
  })

  const navPageDocs: Array<{ id: number }> = []
  for (const { title, slug } of navPages.slice(1)) {
    const page = await payload.create({
      collection: 'pages',
      depth: 0,
      context: { disableRevalidate: true },
      data: createNavPage(title, slug),
    })
    navPageDocs.push({ id: page.id })
  }

  payload.logger.info(`— Seeding globals...`)

  const headerNavItems = [
    {
      link: {
        type: 'reference' as const,
        label: navPages[0].title,
        reference: {
          relationTo: 'pages' as const,
          value: homePage.id,
        },
      },
    },
    ...navPageDocs.map((page, i) => ({
      link: {
        type: 'reference' as const,
        label: navPages[i + 1].title,
        reference: {
          relationTo: 'pages' as const,
          value: page.id,
        },
      },
    })),
  ]

  await Promise.all([
    payload.updateGlobal({
      slug: 'header',
      data: {
        navItems: headerNavItems,
      },
      context: { disableRevalidate: true },
    }),
    payload.updateGlobal({
      slug: 'footer',
      context: { disableRevalidate: true },
      data: {
        navItems: [
          {
            link: {
              type: 'custom',
              label: 'Admin',
              url: '/admin',
            },
          },
          {
            link: {
              type: 'custom',
              label: 'Source Code',
              newTab: true,
              url: 'https://github.com/payloadcms/payload/tree/main/templates/website',
            },
          },
          {
            link: {
              type: 'custom',
              label: 'Payload',
              newTab: true,
              url: 'https://payloadcms.com/',
            },
          },
        ],
      },
    }),
  ])

  payload.logger.info('Seeded database successfully!')
}

async function fetchFileByURL(url: string): Promise<File> {
  const res = await fetch(url, {
    credentials: 'include',
    method: 'GET',
  })

  if (!res.ok) {
    throw new Error(`Failed to fetch file from ${url}, status: ${res.status}`)
  }

  const data = await res.arrayBuffer()

  return {
    name: url.split('/').pop() || `file-${Date.now()}`,
    data: Buffer.from(data),
    mimetype: `image/${url.split('.').pop()}`,
    size: data.byteLength,
  }
}
