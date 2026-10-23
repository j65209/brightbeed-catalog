-- 공구 제안관 (brightbeed-catalog) Supabase 스키마
-- 새 프로젝트에 그대로 실행하면 테이블·권한(RLS)·이미지 버킷·관리자 PIN 설정이 만들어진다.

create table public.cat_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
comment on table public.cat_admins is '공구 제안관 관리자 계정. 이 표에 있는 auth 사용자만 제안관 데이터를 수정할 수 있다.';

create or replace function public.cat_is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.cat_admins where user_id = auth.uid());
$$;
revoke all on function public.cat_is_admin() from public;
grant execute on function public.cat_is_admin() to anon, authenticated;

-- 관리자 PIN (엣지 함수만 읽음)
create table public.cat_admin_config (
  id int primary key default 1 check (id = 1),
  pin_hash text not null,
  admin_email text not null
);
create table public.cat_pin_attempts (
  id bigserial primary key,
  ok boolean not null,
  ip text,
  created_at timestamptz not null default now()
);

-- 사이트 문구·이미지 (key → value)
create table public.cat_content (
  key text primary key,
  value text,
  updated_at timestamptz not null default now()
);
comment on table public.cat_content is '제안관 페이지의 고정 문구/이미지. key 는 HTML data-k 값.';

create table public.cat_brands (
  id uuid primary key default gen_random_uuid(),
  slug text unique,
  name text,
  category text,
  badge text,
  one_liner text,
  description text,
  logo_url text,
  cover_url text,
  images text[] not null default '{}',
  tags text[] not null default '{}',
  usp jsonb not null default '[]',
  facts jsonb not null default '[]',
  pitch text,
  pitch_short text,
  shop_url text,
  store_url text,
  pdf_url text,
  video_url text,
  visible boolean not null default true,
  sort int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.cat_products (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid references public.cat_brands(id) on delete set null,
  slug text unique,
  name text,
  summary text,
  category text,
  badge text,
  price int,
  list_price int,
  images text[] not null default '{}',
  detail_images text[] not null default '{}',
  options text[] not null default '{}',
  tags text[] not null default '{}',
  points jsonb not null default '[]',
  notice jsonb not null default '[]',
  facts jsonb not null default '[]',
  pitch text,
  pitch_short text,
  shop_url text,
  store_url text,
  stock int,
  is_new boolean not null default false,
  visible boolean not null default true,
  sort int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.cat_products (brand_id);

-- 공급가는 공개 테이블과 분리 (지금은 관리자만)
create table public.cat_product_prices (
  product_id uuid primary key references public.cat_products(id) on delete cascade,
  supply_price int,
  margin_note text,
  moq int,
  updated_at timestamptz not null default now()
);

create table public.cat_sellers (
  id uuid primary key default gen_random_uuid(),
  seller_type text,
  name text,
  channel_url text,
  contact_name text,
  phone text,
  email text,
  memo text,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  business_type text,                    -- 개인 셀러: 사업자 / 법인 / 사업자 없음
  created_at timestamptz not null default now()
);

create table public.cat_requests (
  id uuid primary key default gen_random_uuid(),
  kind text not null default 'apply' check (kind in ('apply','custom')),
  company text,
  contact_name text,
  phone text,
  email text,
  memo text,
  product_ids uuid[] not null default '{}',
  status text not null default 'new' check (status in ('new','progress','done','hold')),
  created_at timestamptz not null default now()
);

-- updated_at 자동 갱신
create or replace function public.cat_touch() returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end $$;
create trigger cat_brands_touch before update on public.cat_brands for each row execute function public.cat_touch();
create trigger cat_products_touch before update on public.cat_products for each row execute function public.cat_touch();
create trigger cat_content_touch before update on public.cat_content for each row execute function public.cat_touch();
create trigger cat_prices_touch before update on public.cat_product_prices for each row execute function public.cat_touch();

-- RLS
alter table public.cat_admins enable row level security;
alter table public.cat_admin_config enable row level security;
alter table public.cat_pin_attempts enable row level security;
alter table public.cat_content enable row level security;
alter table public.cat_brands enable row level security;
alter table public.cat_products enable row level security;
alter table public.cat_product_prices enable row level security;
alter table public.cat_sellers enable row level security;
alter table public.cat_requests enable row level security;
-- cat_admin_config / cat_pin_attempts: 정책 없음 = service role(엣지 함수)만 접근

create policy cat_admins_self on public.cat_admins for select to authenticated using (user_id = auth.uid());

create policy cat_content_read on public.cat_content for select to anon, authenticated using (true);
create policy cat_content_admin on public.cat_content for all to authenticated using (public.cat_is_admin()) with check (public.cat_is_admin());

create policy cat_brands_read on public.cat_brands for select to anon, authenticated using (visible or public.cat_is_admin());
create policy cat_brands_admin on public.cat_brands for all to authenticated using (public.cat_is_admin()) with check (public.cat_is_admin());

create policy cat_products_read on public.cat_products for select to anon, authenticated using (visible or public.cat_is_admin());
create policy cat_products_admin on public.cat_products for all to authenticated using (public.cat_is_admin()) with check (public.cat_is_admin());

create policy cat_prices_admin on public.cat_product_prices for all to authenticated using (public.cat_is_admin()) with check (public.cat_is_admin());

-- 신청서: 누구나 넣을 수 있고, 보는 건 관리자만
create policy cat_sellers_insert on public.cat_sellers for insert to anon, authenticated with check (status = 'pending');
create policy cat_sellers_admin on public.cat_sellers for all to authenticated using (public.cat_is_admin()) with check (public.cat_is_admin());
create policy cat_requests_insert on public.cat_requests for insert to anon, authenticated with check (status = 'new');
create policy cat_requests_admin on public.cat_requests for all to authenticated using (public.cat_is_admin()) with check (public.cat_is_admin());

-- 이미지 버킷 (읽기는 공개 URL, 올리기·지우기는 관리자만)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('catalog', 'catalog', true, 10485760, array['image/png','image/jpeg','image/webp','image/gif','image/svg+xml','application/pdf']);
create policy cat_storage_admin_select on storage.objects for select to authenticated using (bucket_id = 'catalog' and public.cat_is_admin());
create policy cat_storage_admin_insert on storage.objects for insert to authenticated with check (bucket_id = 'catalog' and public.cat_is_admin());
create policy cat_storage_admin_update on storage.objects for update to authenticated using (bucket_id = 'catalog' and public.cat_is_admin());
create policy cat_storage_admin_delete on storage.objects for delete to authenticated using (bucket_id = 'catalog' and public.cat_is_admin());

-- 관리자 PIN 2580 (sha256('bb-catalog:' || PIN)). 바꾸려면 관리자 페이지 > 설정
insert into public.cat_admin_config (id, pin_hash, admin_email)
values (1, '99297593db3ba42c487d983397b32000f1ba57f9c781bbd94f871d8b010d63aa', 'catalog-admin@brightbeed.kr');

-- BEST 공구 순위: 관리자가 지정한 BEST 1·2·3(cat_products.best_rank)이 먼저 그 자리를 차지하고,
-- 빈 자리는 최근 30일 공구 신청에 많이 담긴 상품 순(같으면 BEST 배지 → 순서)으로 자동 채운다.
-- 신청서 내용은 관리자만 읽을 수 있어서, 손님 화면에는 상품 id·건수만 내주는 함수로 연다.
alter table public.cat_products add column if not exists best_rank smallint check (best_rank between 1 and 3);
create unique index if not exists cat_products_best_rank_uniq on public.cat_products (best_rank) where best_rank is not null;
drop function if exists public.cat_best_products(int);
create or replace function public.cat_best_products(n int default 3)
returns table (product_id uuid, requests bigint, pinned boolean)
language sql stable security definer set search_path = public as $$
  with req as (
    select unnest(product_ids) as pid, count(*) as cnt
    from public.cat_requests
    where kind = 'apply' and created_at > now() - interval '30 days'
    group by 1
  ), pin as (
    select id, best_rank from public.cat_products where visible and best_rank is not null
  ), auto as (
    select p.id, coalesce(r.cnt, 0) as cnt,
      row_number() over (order by coalesce(r.cnt, 0) desc, (coalesce(p.badge, '') ilike 'best') desc, p.sort, p.created_at) as rn
    from public.cat_products p left join req r on r.pid = p.id
    where p.visible and p.best_rank is null
  ), slots as (
    select s as slot, (select count(*) from pin where best_rank < s) as pinned_before
    from generate_series(1, greatest(1, least(n, 12))) s
  )
  select coalesce(pin.id, auto.id), coalesce((select cnt from req where pid = coalesce(pin.id, auto.id)), 0), pin.id is not null
  from slots
  left join pin on pin.best_rank = slots.slot
  left join auto on pin.id is null and auto.rn = slots.slot - slots.pinned_before
  where coalesce(pin.id, auto.id) is not null
  order by slots.slot;
$$;
revoke all on function public.cat_best_products(int) from public;
grant execute on function public.cat_best_products(int) to anon, authenticated;

-- 카테고리 (메인 상품 필터 칩 + 상품 카테고리 선택지). 상품에는 이름(text)으로 저장한다.
create table public.cat_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  sort int not null default 0,
  created_at timestamptz not null default now()
);
alter table public.cat_categories enable row level security;
create policy cat_categories_read on public.cat_categories for select to anon, authenticated using (true);
create policy cat_categories_admin on public.cat_categories for all to authenticated using (public.cat_is_admin()) with check (public.cat_is_admin());
