-- Seed: Add GSL News App to the applications catalog
-- =============================================

insert into public.applications (name, slug, description, url, icon_url, visibility, is_active)
values (
  'GSL News',
  'gsl-news',
  'Portail d''actualités et de nouvelles internes GSL.',
  'https://gsl-news-portal.vercel.app',
  null,
  'internal',
  true
)
on conflict (slug) do nothing;
