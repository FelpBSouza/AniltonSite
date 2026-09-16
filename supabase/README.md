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
