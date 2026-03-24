-- Set default icons for existing apps using Lucide-style placeholder icons
-- These use ui-avatars.com to generate letter-based icons matching the app name

-- Update GSL News app icon
update public.applications
set icon_url = 'https://ui-avatars.com/api/?name=GSL+News&background=0070f3&color=fff&size=128&font-size=0.4&bold=true&format=svg'
where slug = 'gsl-news' and icon_url is null;

-- Generic fallback: set icon for any app without one
-- (Uses first two letters of the app name as the icon)
update public.applications
set icon_url = 'https://ui-avatars.com/api/?name=' || replace(name, ' ', '+') || '&background=0070f3&color=fff&size=128&font-size=0.4&bold=true&format=svg'
where icon_url is null;
