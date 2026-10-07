import type { GlobalConfig } from 'payload'
import { revalidateSite } from '@/lib/revalidate'

export const Privacy: GlobalConfig = {
  slug: 'privacy',
  label: 'Política de Privacidade',
  admin: {
    group: 'Site',
    description: 'Página /politica-de-privacidade. Se o texto estiver vazio, o site mostra a política padrão.',
  },
  hooks: {
    afterChange: [() => revalidateSite()],
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'updatedOn',
      type: 'date',
      label: 'Última atualização',
      admin: { date: { pickerAppearance: 'dayOnly', displayFormat: 'dd/MM/yyyy' } },
    },
    {
      name: 'body',
      type: 'richText',
      label: 'Texto',
    },
  ],
}
