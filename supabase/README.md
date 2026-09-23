# Backend do Anilton Batista

## Instalação

1. Crie um projeto no Supabase.
2. Abra o SQL Editor.
3. Execute o conteúdo de `schema.sql`.
4. Execute `catalog.sql` para cadastrar os produtos iniciais.
5. Execute `cart.sql` para permitir remoção de itens do próprio carrinho.
6. Em Authentication > Providers, ative Email.
7. Crie uma conta normal pelo site.
8. Promova essa conta a administradora no SQL Editor:

```sql
update public.profiles
set role = 'admin'
where id = (
  select id from auth.users where email = 'seu-email@example.com'
);
```

Troque o e-mail pelo e-mail real da conta. Execute esse comando somente no SQL Editor do Supabase.

## Painel de álbuns

Depois de executar `schema.sql`, execute também `admin-panel.sql` no SQL Editor. Esse arquivo cria o bucket público de prévias com marca d'água e as políticas usadas pelo painel.

Abra `admin.html` no endereço publicado do site para entrar no painel. Use o e-mail da conta promovida a `admin`. No painel, crie um álbum, selecione as fotos e marque a opção de publicar. A primeira foto vira a capa e o álbum passa a ser carregado pela página inicial.

Os arquivos originais ficam no bucket privado `photo-originals`. As prévias reduzidas ficam no bucket `photo-previews`. O pagamento automático ainda precisa de uma integração com Mercado Pago ou Asaas e um webhook no servidor.

## Regras de segurança

- Nunca coloque a chave `service_role` no frontend.
- A chave `anon` só deve ser usada com RLS ativo.
- O bucket `photo-originals` é privado e só libera fotos de pedidos pagos.
- O bucket `payment-proofs` é privado e limita uploads à pasta do usuário.
- O cliente pode criar apenas pedidos pendentes.
- Somente administradores podem alterar o status de pagamento.
- Nunca marque pedidos como pagos a partir de uma ação do navegador.

## Carrinho

O carrinho usa `orders` e `order_items` no Supabase. O preço é definido pelo trigger do banco, não pelo navegador. A confirmação Pix deverá ser manual no início ou feita por uma Edge Function/webhook depois.

## Sanity

O arquivo `anilton-site/sanity-config.js` contém apenas a configuração pública de leitura. Depois de criar o projeto no Sanity, substitua `COLE_AQUI_O_PROJECT_ID` pelo ID do projeto. Nunca coloque token de escrita no frontend.

O schema inicial está em `sanity/schema.js`. Use-o no Sanity Studio para criar álbuns publicados, capas e prévias. Configure o domínio publicado em **Manage > API > CORS origins** antes de testar a leitura pelo site.
