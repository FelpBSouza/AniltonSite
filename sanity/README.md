# Sanity Studio

O arquivo `schema.js` define o tipo `album` para o painel do Sanity.

## Configuração

1. Crie um projeto no Sanity e um Sanity Studio.
2. Use `sanity/schema.js` como schema do Studio.
3. Publique um álbum com capa e marque `Publicado`.
4. Copie o Project ID em `anilton-site/sanity-config.js`:

```js
window.SANITY_CONFIG = {
  projectId: 'seu-project-id',
  dataset: 'production',
  apiVersion: '2025-01-01'
};
```

5. No Sanity, em **Manage > API > CORS origins**, adicione:
   - `http://localhost:8080`
   - `https://felpbsouza.github.io`

O site consulta apenas conteúdo publicado pela API pública de leitura. Tokens de escrita não devem ser colocados no site.
