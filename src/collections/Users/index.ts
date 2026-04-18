import type { CollectionConfig } from 'payload'

import { adminOrSelf } from '../../access/adminOrSelf'
import { isUsersCollectionAdmin } from '../../access/isAdminUser'

export const Users: CollectionConfig = {
  slug: 'users',
  access: {
    admin: ({ req: { user } }) => isUsersCollectionAdmin(user),
    create: () => true,
    delete: ({ req: { user } }) => isUsersCollectionAdmin(user),
    read: adminOrSelf,
    update: adminOrSelf,
  },
  admin: {
    defaultColumns: ['name', 'email', 'roles'],
    useAsTitle: 'name',
  },
  auth: true,
  fields: [
    {
      name: 'name',
      type: 'text',
    },
    {
      name: 'roles',
      type: 'select',
      hasMany: true,
      required: true,
      defaultValue: ['member'],
      options: [
        { label: 'Admin', value: 'admin' },
        { label: 'Member', value: 'member' },
      ],
      saveToJWT: true,
      access: {
        create: ({ req: { user } }) => isUsersCollectionAdmin(user),
        update: ({ req: { user } }) => isUsersCollectionAdmin(user),
      },
    },
    {
      name: 'googleSub',
      type: 'text',
      unique: true,
      index: true,
      admin: {
        description: 'Google account subject (sub). Set automatically for OAuth sign-in.',
      },
      access: {
        read: () => true,
        update: ({ req: { user } }) => isUsersCollectionAdmin(user),
      },
    },
  ],
  hooks: {
    beforeValidate: [
      ({ data, operation, req }) => {
        if (operation === 'create' && !isUsersCollectionAdmin(req.user)) {
          if (data) {
            data.roles = ['member']
          }
        }
        return data
      },
    ],
  },
  timestamps: true,
}
