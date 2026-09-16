-- Run after schema.sql to allow customers to remove items from their own pending order.

create policy "Users remove items from their pending orders"
on public.order_items for delete
to authenticated
using (exists (
  select 1 from public.orders
  where orders.id = order_items.order_id
    and orders.user_id = auth.uid()
    and orders.status = 'pending'
));
