import type { Block, CollectionBeforeValidateHook, CollectionConfig, Field } from 'payload'
import { rowLabel, soLogado } from '@/lib/orcamentos/access'
import {
  LIMITES,
  TEXTO_APLICACOES,
  TEXTO_APRESENTACAO,
  TEXTO_CREDITOS,
  TEXTO_NORMAS,
  TEXTO_UNIVERSO,
  ateLimite,
  dicaLimite,
  grupoManuais,
  slugify,
} from '@/lib/manuais/padroes'

const ASSETS = 'manual-assets'

const titulo = (padrao?: string): Field => ({
  name: 'titulo',
  type: 'text',
  label: 'Título',
  required: true,
  maxLength: LIMITES.titulo,
  defaultValue: padrao,
  admin: { description: 'Aparece numerado no manual (01. Título).' },
})

const texto = (limite: number, padrao?: string, label = 'Texto'): Field => ({
  name: 'texto',
  type: 'textarea',
  label,
  defaultValue: padrao,
  validate: ateLimite(limite),
  admin: { description: dicaLimite(limite, 'Linha em branco separa parágrafos.'), rows: 6 },
})

// ------------------------------------------------------------ blocos do universo visual
// Cada bloco = uma pagina: titulo numerado e texto a esquerda, visual a direita.

const TextoImagem: Block = {
  slug: 'textoImagem',
  labels: { singular: 'Texto + imagens', plural: 'Texto + imagens' },
  fields: [
    titulo(),
    texto(LIMITES.textoBloco),
    {
      name: 'imagens',
      type: 'upload',
      relationTo: ASSETS,
      hasMany: true,
      required: true,
      minRows: 1,
      maxRows: 4,
      label: 'Imagens (1 a 4)',
      admin: { description: 'A grade se ajusta sozinha à quantidade. Serve para marca gráfica, estilo fotográfico, assets, ícones, patterns.' },
    },
  ],
}

const AntesDepois: Block = {
  slug: 'antesDepois',
  labels: { singular: 'Texto + antes/depois', plural: 'Texto + antes/depois' },
  fields: [
    titulo('Tratamento Fotográfico'),
    texto(LIMITES.textoBlocoComparacao),
    {
      name: 'pares',
      type: 'array',
      label: 'Pares de imagens',
      minRows: 1,
      maxRows: 2,
      required: true,
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'antes', type: 'upload', relationTo: ASSETS, required: true, label: 'Antes', admin: { width: '50%' } },
            { name: 'depois', type: 'upload', relationTo: ASSETS, required: true, label: 'Depois', admin: { width: '50%' } },
          ],
        },
      ],
    },
  ],
}

const PaletaBloco: Block = {
  slug: 'paleta',
  labels: { singular: 'Paleta', plural: 'Paletas' },
  fields: [
    titulo('Paleta Cromática'),
    texto(LIMITES.textoBlocoComparacao),
    {
      name: 'aviso',
      type: 'ui',
      admin: { components: { Field: '@/components/manuais/admin/Aviso#AvisoPaleta' } },
    },
  ],
}

const Tipografia: Block = {
  slug: 'tipografia',
  labels: { singular: 'Tipografia', plural: 'Tipografias' },
  fields: [
    titulo('Tipografia'),
    texto(LIMITES.textoBlocoComparacao),
    {
      name: 'fontes',
      type: 'array',
      label: 'Fontes (até 4)',
      minRows: 1,
      maxRows: 4,
      required: true,
      admin: { components: rowLabel.components },
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'nome', type: 'text', label: 'Nome da fonte', required: true, admin: { width: '50%' } },
            { name: 'papel', type: 'text', label: 'Uso', admin: { width: '50%', placeholder: 'Títulos, Subtítulos, Textos…' } },
          ],
        },
        {
          name: 'origem',
          type: 'radio',
          label: 'Como mostrar a fonte no manual',
          defaultValue: 'imagem',
          // imagem: nao depende de fonte instalada nem do Google (aparece igual
          // em qualquer computador e no PDF)
          options: [
            { label: 'Imagem do espécime', value: 'imagem' },
            { label: 'Google Fonts', value: 'google' },
            { label: 'Arquivo da fonte', value: 'arquivo' },
          ],
        },
        {
          name: 'imagem',
          type: 'upload',
          relationTo: ASSETS,
          label: 'Imagem do espécime',
          admin: {
            condition: (_, s) => !s?.origem || s.origem === 'imagem',
            description: 'O texto de exemplo escrito na fonte, exportado do Illustrator (PNG, de preferência com fundo transparente).',
          },
        },
        {
          name: 'exemplo',
          type: 'text',
          label: 'Texto de exemplo',
          maxLength: LIMITES.exemploFonte,
          defaultValue: 'A essência da marca',
          admin: { condition: (_, s) => s?.origem === 'google' || s?.origem === 'arquivo' },
        },
        {
          type: 'row',
          admin: { condition: (_, s) => s?.origem === 'google' },
          fields: [
            { name: 'googleFamilia', type: 'text', label: 'Família no Google Fonts', admin: { width: '60%', placeholder: 'Poppins' } },
            { name: 'pesos', type: 'text', label: 'Pesos', defaultValue: '400;700', admin: { width: '40%', description: 'Separados por ;' } },
          ],
        },
        {
          name: 'conferirGoogle',
          type: 'ui',
          admin: {
            condition: (_, s) => s?.origem === 'google',
            components: { Field: '@/components/manuais/admin/ConferirFonte' },
          },
        },
        {
          name: 'arquivo',
          type: 'upload',
          relationTo: ASSETS,
          label: 'Arquivo da fonte (.woff2, .woff, .ttf ou .otf)',
          admin: {
            condition: (_, s) => s?.origem === 'arquivo',
            description: 'Um arquivo por peso.',
          },
        },
        {
          name: 'link',
          type: 'text',
          label: 'Link para baixar ou comprar',
          admin: { description: 'Endereço livre (nem toda fonte é do Google).' },
        },
      ],
    },
  ],
}

// ------------------------------------------------------------ slug

/** Link /manual/<slug>: nasce do nome do cliente e nunca repete */
const garantirSlug: CollectionBeforeValidateHook = async ({ data, originalDoc, req }) => {
  if (!data) return data
  const base = slugify(String(data.slug || originalDoc?.slug || data.cliente || '')) || 'manual'
  let slug = base
  for (let n = 2; n < 50; n++) {
    const outro = await req.payload.find({
      collection: 'manuais',
      where: { and: [{ slug: { equals: slug } }, ...(originalDoc?.id ? [{ id: { not_equals: originalDoc.id } }] : [])] },
      limit: 1,
      depth: 0,
      overrideAccess: true,
      req,
    })
    if (!outro.docs.length) break
    slug = `${base}-${n}`
  }
  return { ...data, slug }
}

// ------------------------------------------------------------ collection

export const Manuais: CollectionConfig = {
  slug: 'manuais',
  labels: { singular: 'Manual de marca', plural: 'Manuais de marca' },
  admin: {
    group: grupoManuais,
    useAsTitle: 'cliente',
    defaultColumns: ['cliente', 'slug', 'status', 'updatedAt'],
    description: 'Cada manual gera um link para o cliente (/manual/nome-do-cliente). Rascunho só abre para você, logado.',
    preview: (doc) => (doc?.slug ? `/manual/${doc.slug}` : null),
  },
  access: soLogado,
  hooks: { beforeValidate: [garantirSlug] },
  fields: [
    // ------------------------------------------------------------ lateral
    {
      name: 'status',
      type: 'select',
      label: 'Status',
      required: true,
      defaultValue: 'rascunho',
      options: [
        { label: 'Rascunho', value: 'rascunho' },
        { label: 'Publicado', value: 'publicado' },
      ],
      admin: { position: 'sidebar', description: 'Rascunho não abre para o cliente (só para você, logado).' },
    },
    {
      name: 'linkManual',
      type: 'ui',
      admin: { position: 'sidebar', components: { Field: '@/components/manuais/admin/LinkManual' } },
    },
    {
      name: 'slug',
      type: 'text',
      label: 'Endereço',
      unique: true,
      index: true,
      admin: { position: 'sidebar', description: 'Gerado do nome do cliente. Só letras minúsculas, números e hífen.' },
    },
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Geral',
          fields: [
            { name: 'cliente', type: 'text', label: 'Cliente', required: true },
            {
              name: 'capa',
              type: 'upload',
              relationTo: ASSETS,
              label: 'Imagem da capa',
              admin: { description: 'O mockup escolhido para a capa.' },
            },
            {
              ...texto(LIMITES.textoApresentacao, TEXTO_APRESENTACAO, 'Texto de apresentação'),
              name: 'textoApresentacao',
            } as Field,
          ],
        },
        {
          label: 'Universo visual',
          fields: [
            { ...texto(LIMITES.textoDivisoria, TEXTO_UNIVERSO, 'Texto da divisória'), name: 'textoUniverso' } as Field,
            {
              name: 'universoVisual',
              type: 'blocks',
              label: 'Páginas do universo visual',
              labels: { singular: 'Página', plural: 'Páginas' },
              admin: { description: 'Cada bloco vira uma página, na ordem daqui (arraste para reordenar).' },
              blocks: [TextoImagem, AntesDepois, PaletaBloco, Tipografia],
            },
          ],
        },
        {
          label: 'Paleta',
          description: 'As cores aparecem no bloco "Paleta" do universo visual e viram os fundos das versões da marca.',
          fields: [
            {
              name: 'paleta',
              type: 'array',
              label: 'Grupos de cores',
              labels: { singular: 'Grupo', plural: 'Grupos' },
              admin: { components: rowLabel.components },
              fields: [
                { name: 'nome', type: 'text', label: 'Nome do grupo', required: true, admin: { placeholder: 'Cores principais' } },
                {
                  name: 'cores',
                  type: 'array',
                  label: 'Cores',
                  labels: { singular: 'Cor', plural: 'Cores' },
                  admin: { components: rowLabel.components },
                  fields: [
                    {
                      type: 'row',
                      fields: [
                        { name: 'nome', type: 'text', label: 'Nome', required: true, admin: { width: '40%' } },
                        {
                          name: 'hex',
                          type: 'text',
                          label: 'HEX',
                          required: true,
                          validate: (v: unknown) => (typeof v === 'string' && /^#[0-9a-fA-F]{6}$/.test(v.trim())) || 'Use o formato #RRGGBB',
                          admin: { width: '25%', placeholder: '#D70008' },
                        },
                        { name: 'pantone', type: 'text', label: 'Pantone', admin: { width: '35%', placeholder: 'opcional' } },
                      ],
                    },
                    {
                      type: 'row',
                      fields: [
                        {
                          name: 'categoria',
                          type: 'select',
                          label: 'Categoria de fundo',
                          required: true,
                          defaultValue: 'claro',
                          options: [
                            { label: 'Claro', value: 'claro' },
                            { label: 'Escuro', value: 'escuro' },
                            { label: 'Colorido', value: 'colorido' },
                          ],
                          admin: { width: '40%', description: 'Agrupa as versões da marca sobre esta cor.' },
                        },
                        {
                          name: 'cmyk',
                          type: 'text',
                          label: 'CMYK (impressão)',
                          admin: { width: '60%', placeholder: 'em branco = sugestão calculada', description: 'Ex.: 0 / 100 / 96 / 16' },
                        },
                      ],
                    },
                    { name: 'info', type: 'ui', admin: { components: { Field: '@/components/manuais/admin/CorInfo' } } },
                  ],
                },
              ],
            },
          ],
        },
        {
          label: 'Aplicações',
          fields: [
            { ...texto(LIMITES.textoDivisoria, TEXTO_APLICACOES, 'Texto da divisória'), name: 'textoAplicacoes' } as Field,
            {
              name: 'aplicacoes',
              type: 'array',
              label: 'Mockups',
              labels: { singular: 'Mockup', plural: 'Mockups' },
              admin: { components: rowLabel.components, description: 'Uma página por item.' },
              fields: [
                { name: 'nome', type: 'text', label: 'Nome (só no painel)', admin: { placeholder: 'Cartão de visita' } },
                {
                  name: 'layout',
                  type: 'radio',
                  label: 'Layout',
                  defaultValue: 'cheia',
                  options: [
                    { label: 'Página cheia', value: 'cheia' },
                    { label: 'Duas lado a lado', value: 'dupla' },
                  ],
                },
                {
                  type: 'row',
                  fields: [
                    { name: 'imagem', type: 'upload', relationTo: ASSETS, required: true, label: 'Imagem', admin: { width: '50%' } },
                    {
                      name: 'imagem2',
                      type: 'upload',
                      relationTo: ASSETS,
                      label: 'Segunda imagem',
                      admin: { width: '50%', condition: (_, s) => s?.layout === 'dupla' },
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          label: 'Normas de uso',
          description: 'Versões da marca, dimensões, área de segurança, redução máxima, usos incorretos e os arquivos para baixar.',
          fields: [
            { name: 'tituloNormas', type: 'text', label: 'Título da seção', defaultValue: 'Normas de Uso', maxLength: LIMITES.titulo },
            { ...texto(LIMITES.textoDivisoria, TEXTO_NORMAS, 'Texto da divisória'), name: 'textoNormas' } as Field,
            {
              name: 'descricaoX',
              type: 'text',
              label: 'O que é o x',
              maxLength: 80,
              admin: {
                placeholder: 'a altura do "c" de Cereja Bloom',
                description: 'Completa a frase: As proporções são calculadas usando uma referência "x", que é …',
              },
            },
            {
              // Referencia x, versoes (SVGs sanitizados) e grupos com a medicao calculada no painel
              name: 'marcas',
              type: 'json',
              label: 'Versões da marca',
              defaultValue: { refX: null, versoes: [], grupos: [] },
              admin: { components: { Field: '@/components/manuais/admin/marcas/GerenciadorMarcas' } },
            },
            {
              // ligados as versoes pelo nome do arquivo (mesmo nome do SVG)
              name: 'pngsMarcas',
              type: 'upload',
              relationTo: ASSETS,
              hasMany: true,
              label: 'PNGs das versões (para baixar)',
              filterOptions: { mimeType: { equals: 'image/png' } },
              admin: {
                description: 'Envie os PNGs com o mesmo nome dos SVGs (ex.: cerejabloom-horizontal-fundo-vermelho.png). No manual, ao clicar numa versão, dá para baixar em SVG e, se tiver PNG, em PNG.',
              },
            },
            { name: 'conferirPngs', type: 'ui', admin: { components: { Field: '@/components/manuais/admin/ConferirPngs' } } },
            {
              name: 'pacoteMarcas',
              type: 'upload',
              relationTo: ASSETS,
              label: 'Pacote com todas as marcas (ZIP)',
              filterOptions: { mimeType: { in: ['application/zip', 'application/x-zip-compressed'] } },
              admin: { description: 'Aparece no menu do manual como "Baixar versões da marca". Sem o ZIP, o botão não aparece.' },
            },
          ],
        },
        {
          label: 'Créditos',
          fields: [{ ...texto(LIMITES.textoCreditos, TEXTO_CREDITOS, 'Aviso de direitos das imagens'), name: 'textoCreditos' } as Field],
        },
      ],
    },
  ],
}
