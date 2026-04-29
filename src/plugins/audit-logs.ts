import { isUsersCollectionAdmin } from '@/access/isAdminUser'
import { AfterDeleteHook } from 'node_modules/payload/dist/collections/config/types'
import { AfterChangeHook } from 'node_modules/payload/dist/globals/config/types'
import {
  Collection,
  CollectionConfig,
  CollectionSlug,
  Config,
  GeneratedTypes,
  Plugin,
} from 'payload'

export interface AuditLogOptions {
  collections?: (keyof Omit<GeneratedTypes['collections'], 'audit-logs'>)[]
  includeAuth?: boolean
}

export const defaultOptions: AuditLogOptions = {
  collections: [],
  includeAuth: false,
}

export const auditLogPlugin = (options: AuditLogOptions = {}): Plugin => {
  const pluginOptions = { ...defaultOptions, ...options }

  return (config: Config): Config => {
    const auditLogCollection: CollectionConfig = {
      slug: 'audit-logs',
      admin: {
        useAsTitle: 'action',
        defaultColumns: ['timestamp', 'collection', 'action', 'documentId', 'user'],
      },
      access: {
        read: ({ req: { user } }) => isUsersCollectionAdmin(user),
        update: ({ req: { user } }) => false,
        delete: ({ req: { user } }) => isUsersCollectionAdmin(user),
        create: () => true,
      },
      fields: [
        {
          name: 'collection',
          type: 'text',
          required: true,
        },
        {
          name: 'action',
          type: 'select',
          options: ['create', 'update', 'delete', 'read'],
          required: true,
        },
        {
          name: 'documentId',
          type: 'text',
          required: true,
        },
        {
          name: 'timestamp',
          type: 'date',
          required: true,
        },
        {
          name: 'user',
          type: 'relationship',
          relationTo: (config.admin?.user as CollectionSlug) ?? 'users',
          required: false,
        },
        {
          name: 'changes',
          type: 'json',
          admin: {
            description: 'Changes made in this operation',
          },
        },
      ],
    }

    config.collections = [...(config.collections || []), auditLogCollection]

    const collectionsToAudit = [
      ...(pluginOptions.collections ?? []),
      ...(pluginOptions.includeAuth ? [config.admin?.user ?? 'users'] : []),
    ]

    config.collections = config.collections?.map((collection) => {
      if (collectionsToAudit.includes(collection.slug)) {
        const afterChange: AfterChangeHook = async ({ req, context, doc, previousDoc }) => {
          const action = context.operation === 'create' ? 'create' : 'update'
          let changes = null

          if (action === 'update' && previousDoc) {
            changes = Object.keys(doc).reduce(
              (acc, key) => {
                if (JSON.stringify(doc[key]) !== JSON.stringify(previousDoc[key])) {
                  acc[key] = {
                    old: previousDoc[key],
                    new: doc[key],
                  }
                }
                return acc
              },
              {} as Record<string, any>,
            )
          }

          await req.payload.create({
            collection: 'audit-logs',
            data: {
              collection: collection.slug,
              action,
              documentId: String(doc.id ?? previousDoc?.id ?? ''),
              timestamp: new Date().toISOString(),
              user: req.user?.id,
              changes: action === 'update' ? changes : doc,
            },
          })
          return doc
        }

        const afterDelete: AfterDeleteHook = async ({ req, doc }) => {
          await req.payload.create({
            collection: 'audit-logs',
            data: {
              collection: collection.slug,
              action: 'delete',
              documentId: String(doc.id ?? ''),
              timestamp: new Date().toISOString(),
              user: req.user?.id,
              changes: doc, // Store the entire document being deleted
            },
          })
        }

        const hooks: any = {
          afterChange: [afterChange, ...(collection.hooks?.afterChange || [])],
          afterDelete: [afterDelete, ...(collection.hooks?.afterDelete || [])],
        }

        return {
          ...collection,
          hooks: {
            ...collection.hooks,
            ...hooks,
          },
        }
      }
      return collection
    })

    return config
  }
}

export default auditLogPlugin
