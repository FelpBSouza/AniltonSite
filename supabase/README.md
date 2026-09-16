# Backend do Anilton Batista

## Instalação

1. Crie um projeto no Supabase.
2. Abra o SQL Editor.
3. Execute o conteúdo de `schema.sql`.
4. Em Authentication > Providers, ative Email.
5. Crie uma conta normal pelo site.
6. Promova essa conta a administradora no SQL Editor:

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

## Próxima integração

O frontend deve usar Supabase Auth para login e as tabelas `orders` e `order_items` para o carrinho. A confirmação Pix deverá ser manual no início ou feita por uma Edge Function/webhook depois.
