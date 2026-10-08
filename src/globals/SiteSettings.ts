import type { GlobalConfig } from 'payload'
import { revalidateSite } from '@/lib/revalidate'
import { settingsDefaults as d } from '@/content/defaults'

export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  label: 'Configurações',
  admin: {
    group: 'Site',
  },
  hooks: {
    afterChange: [() => revalidateSite()],
  },
  access: {
    read: () => true,
  },
  fields: [
    // Busca e compartilhamento foram para o menu SEO. Os campos antigos ficam
    // guardados (escondidos) e servem de reserva enquanto o SEO estiver vazio.
    { name: 'siteTitle', type: 'text', defaultValue: d.siteTitle, admin: { hidden: true } },
    { name: 'siteDescription', type: 'textarea', defaultValue: d.siteDescription, admin: { hidden: true } },
    { name: 'ogImage', type: 'upload', relationTo: 'media', admin: { hidden: true } },
    { name: 'googleSiteVerification', type: 'text', admin: { hidden: true } },
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Contato',
          fields: [
            {
              type: 'row',
              fields: [
                {
                  name: 'whatsapp',
                  type: 'text',
                  label: 'WhatsApp (com DDI e DDD, só números)',
                  defaultValue: d.whatsapp,
                  admin: { width: '50%', description: 'Ex: 5548999450235. Vale para todos os botões do site.' },
                },
                {
                  name: 'email',
                  type: 'email',
                  label: 'E-mail',
                  admin: { width: '50%' },
                },
              ],
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'instagram',
                  type: 'text',
                  label: 'Instagram (sem @)',
                  defaultValue: d.instagram,
                  admin: { width: '50%' },
                },
                {
                  name: 'cnpj',
                  type: 'text',
                  label: 'CNPJ',
                  admin: { width: '50%', description: 'Aparece no rodapé quando preenchido.' },
                },
              ],
            },
            {
              type: 'row',
              fields: [
                { name: 'city', type: 'text', label: 'Cidade', defaultValue: d.city, admin: { width: '50%' } },
                { name: 'region', type: 'text', label: 'Estado (UF)', defaultValue: d.region, admin: { width: '50%' } },
              ],
            },
          ],
        },
        {
          label: 'Rastreamento',
          description: 'Pixels de anúncio. Só carregam depois que o visitante aceita os cookies. Vazio = não carrega.',
          fields: [
            {
              type: 'row',
              fields: [
                {
                  name: 'metaPixelId',
                  type: 'text',
                  label: 'ID do Pixel da Meta',
                  admin: { width: '50%', description: 'Só números. Eventos: Contact (WhatsApp) e Lead (formulário).' },
                },
                {
                  name: 'ga4Id',
                  type: 'text',
                  label: 'ID do GA4',
                  admin: { width: '50%', description: 'Ex: G-XXXXXXXXXX' },
                },
              ],
            },
            {
              name: 'googleAdsId',
              type: 'text',
              label: 'ID do Google Ads',
              admin: { description: 'Ex: AW-123456789' },
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'adsLabelWhatsapp',
                  type: 'text',
                  label: 'Rótulo da conversão: clique no WhatsApp',
                  admin: { width: '50%', description: 'A parte depois da barra em AW-123/abcDEF.' },
                },
                {
                  name: 'adsLabelForm',
                  type: 'text',
                  label: 'Rótulo da conversão: envio do formulário',
                  admin: { width: '50%' },
                },
              ],
            },
          ],
        },
      ],
    },
  ],
}
