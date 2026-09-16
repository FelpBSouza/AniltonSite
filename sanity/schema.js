// Use these document types in a Sanity Studio project.
export const album = {
  name: 'album',
  title: 'Álbum',
  type: 'document',
  fields: [
    { name: 'title', title: 'Título', type: 'string', validation: rule => rule.required() },
    { name: 'slug', title: 'Slug', type: 'slug', options: { source: 'title' }, validation: rule => rule.required() },
    { name: 'category', title: 'Categoria', type: 'string', options: { list: ['corrida', 'futebol', 'volei', 'turismo'] }, validation: rule => rule.required() },
    { name: 'location', title: 'Local', type: 'string' },
    { name: 'eventDate', title: 'Data do evento', type: 'date' },
    { name: 'description', title: 'Descrição', type: 'text', rows: 3 },
    { name: 'cover', title: 'Capa', type: 'image', options: { hotspot: true }, validation: rule => rule.required() },
    {
      name: 'photos',
      title: 'Fotos do álbum',
      type: 'array',
      of: [{
        type: 'object',
        fields: [
          { name: 'title', title: 'Título da foto', type: 'string' },
          { name: 'supabasePhotoId', title: 'ID da foto no Supabase', type: 'string', description: 'Cole o UUID da tabela photos para permitir compra.' },
          { name: 'preview', title: 'Prévia com marca d\'água', type: 'image' }
        ],
        preview: { select: { title: 'title', media: 'preview' } }
      }]
    },
    { name: 'published', title: 'Publicado', type: 'boolean', initialValue: false }
  ],
  preview: { select: { title: 'title', media: 'cover', subtitle: 'category' } }
};

export default [album];
