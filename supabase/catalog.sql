-- Initial catalog for the static cards currently shown in loja.html.
-- Run after schema.sql in the Supabase SQL Editor.

insert into public.albums (id, title, slug, location, event_date, category, cover_path, is_published)
values
  ('10000000-0000-4000-8000-000000000001', 'Porto das Barcas', 'porto-das-barcas', 'Porto das Barcas, Parnaíba - PI', '2026-09-13', 'turismo', 'portodasbarcas.png', true),
  ('10000000-0000-4000-8000-000000000002', '5º Edição Treinão Setembro Amarelo', 'treinao-setembro-amarelo', 'Parnaíba, PI', '2026-09-12', 'corrida', 'Setembro-Amarelo.png', true),
  ('10000000-0000-4000-8000-000000000003', 'Oligarquia — UFDPar', 'oligarquia-ufdpar', 'Universidade Federal do Delta do Parnaíba', '2026-09-11', 'volei', 'Oligarquia.png', true),
  ('10000000-0000-4000-8000-000000000004', 'Torcida — Arena São Raimundo', 'torcida-arena-sao-raimundo', 'Buriti dos Lopes, PI', '2026-09-07', 'futebol', 'torcida.png', true),
  ('10000000-0000-4000-8000-000000000005', 'França', 'franca', 'Paris', '2025-12-10', 'corrida', 'França.png', true),
  ('10000000-0000-4000-8000-000000000006', 'Vôlei de Praia — Torneio Regional', 'volei-praia-torneio-regional', 'Praia do Coqueiro, PI', '2026-08-24', 'volei', '1049.jpg', true),
  ('10000000-0000-4000-8000-000000000007', 'Final do Campeonato Municipal', 'final-campeonato-municipal', 'Estádio Municipal, Parnaíba - PI', '2026-08-18', 'futebol', '1067.jpg', true),
  ('10000000-0000-4000-8000-000000000008', 'Delta do Parnaíba', 'delta-do-parnaiba', 'Ilha Grande de Santa Isabel, PI', '2026-08-10', 'turismo', '1036.jpg', true),
  ('10000000-0000-4000-8000-000000000009', 'O instante da virada', 'o-instante-da-virada', 'Fotografia esportiva', null, 'futebol', 'Anilton1.jpg', true),
  ('10000000-0000-4000-8000-000000000010', 'Entre pessoas e lugares', 'entre-pessoas-e-lugares', 'Retratos e experiências', null, 'turismo', 'Anilton2.png', true),
  ('10000000-0000-4000-8000-000000000011', 'Por trás da câmera', 'por-tras-da-camera', 'Parnaíba, PI', null, 'corrida', 'Aniltonsobre.jpg', true)
on conflict (id) do update set is_published = excluded.is_published;

insert into public.photos (id, album_id, title, storage_path, price, is_published)
select values_table.photo_id, values_table.album_id, values_table.title, values_table.storage_path, 29.90, true
from (values
  ('20000000-0000-4000-8000-000000000001'::uuid, '10000000-0000-4000-8000-000000000001'::uuid, 'Porto das Barcas', 'portodasbarcas.png'),
  ('20000000-0000-4000-8000-000000000002'::uuid, '10000000-0000-4000-8000-000000000002'::uuid, '5º Edição Treinão Setembro Amarelo', 'Setembro-Amarelo.png'),
  ('20000000-0000-4000-8000-000000000003'::uuid, '10000000-0000-4000-8000-000000000003'::uuid, 'Oligarquia — UFDPar', 'Oligarquia.png'),
  ('20000000-0000-4000-8000-000000000004'::uuid, '10000000-0000-4000-8000-000000000004'::uuid, 'Torcida — Arena São Raimundo', 'torcida.png'),
  ('20000000-0000-4000-8000-000000000005'::uuid, '10000000-0000-4000-8000-000000000005'::uuid, 'França', 'França.png'),
  ('20000000-0000-4000-8000-000000000006'::uuid, '10000000-0000-4000-8000-000000000006'::uuid, 'Vôlei de Praia — Torneio Regional', '1049.jpg'),
  ('20000000-0000-4000-8000-000000000007'::uuid, '10000000-0000-4000-8000-000000000007'::uuid, 'Final do Campeonato Municipal', '1067.jpg'),
  ('20000000-0000-4000-8000-000000000008'::uuid, '10000000-0000-4000-8000-000000000008'::uuid, 'Delta do Parnaíba', '1036.jpg'),
  ('20000000-0000-4000-8000-000000000009'::uuid, '10000000-0000-4000-8000-000000000009'::uuid, 'O instante da virada', 'Anilton1.jpg'),
  ('20000000-0000-4000-8000-000000000010'::uuid, '10000000-0000-4000-8000-000000000010'::uuid, 'Entre pessoas e lugares', 'Anilton2.png'),
  ('20000000-0000-4000-8000-000000000011'::uuid, '10000000-0000-4000-8000-000000000011'::uuid, 'Por trás da câmera', 'Aniltonsobre.jpg')
) as values_table(photo_id, album_id, title, storage_path)
on conflict (id) do update set price = excluded.price, is_published = excluded.is_published;
