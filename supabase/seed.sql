-- Dados fictícios (example.com) só para desenvolvimento local e testes.
-- Lista de e-mails autorizados: um admin e dois usuários.
insert into public.authorized_emails (email, role) values
  ('admin@example.com', 'admin'),
  ('usuario.a@example.com', 'user'),
  ('usuario.b@example.com', 'user');
