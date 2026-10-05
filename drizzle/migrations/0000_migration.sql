
create type public.app_role as enum ('admin','user');
create table public.user_roles (id uuid primary key default gen_random_uuid(), user_id uuid not null, role app_role not null, unique(user_id, role));
grant select on public.user_roles to authenticated; grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;
create or replace function public.has_role(_user_id uuid, _role app_role) returns boolean language sql stable security definer set search_path=public as $$ select exists(select 1 from public.user_roles where user_id=_user_id and role=_role) $$;
create policy "own roles" on public.user_roles for select to authenticated using (user_id = auth.uid());

-- first signed-up user becomes admin
create or replace function public.handle_first_admin() returns trigger language plpgsql security definer set search_path=public as $$
begin
  if not exists (select 1 from public.user_roles where role='admin') then
    insert into public.user_roles(user_id, role) values (new.id, 'admin');
  end if;
  return new;
end $$;
create trigger on_auth_user_first_admin after insert on auth.users for each row execute function public.handle_first_admin();

create table public.brands (id uuid primary key default gen_random_uuid(), name text not null unique, slug text not null unique, popular boolean not null default false, sort int not null default 0, created_at timestamptz not null default now());
create table public.phone_models (id uuid primary key default gen_random_uuid(), brand_id uuid not null references public.brands(id) on delete cascade, name text not null, slug text not null unique, aliases text[] not null default '{}', popular boolean not null default false, created_at timestamptz not null default now(), unique(brand_id,name));
create table public.categories (id uuid primary key default gen_random_uuid(), slug text not null unique, name_fr text not null, name_ar text not null, keywords text[] not null default '{}', sort int not null default 0);
create table public.products (
  id uuid primary key default gen_random_uuid(), sku text not null unique, name text not null, slug text not null unique,
  description text, category_id uuid not null references public.categories(id), brand_id uuid references public.brands(id),
  price int not null check (price >= 0), compare_price int, stock int not null default 0, quality text default 'Original',
  warranty text default '3 mois', specs jsonb not null default '{}', images text[] not null default '{}',
  featured boolean not null default false, sold_count int not null default 0, active boolean not null default true,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table public.product_compatibility (product_id uuid not null references public.products(id) on delete cascade, model_id uuid not null references public.phone_models(id) on delete cascade, primary key(product_id, model_id));
create index on public.product_compatibility(model_id);
create table public.reviews (id uuid primary key default gen_random_uuid(), product_id uuid references public.products(id) on delete cascade, author text not null, city text, rating int not null check (rating between 1 and 5), comment text not null, approved boolean not null default false, created_at timestamptz not null default now());
create table public.shipping_rates (wilaya_code int primary key, name text not null, home_fee int not null, desk_fee int not null, days text not null default '2-4');
create table public.orders (id uuid primary key default gen_random_uuid(), order_number text not null unique default ('CMD-' || upper(substr(md5(random()::text),1,8))), customer_name text not null, phone text not null, wilaya_code int not null references public.shipping_rates(wilaya_code), commune text not null, address text, delivery_type text not null check (delivery_type in ('home','desk')), notes text, subtotal int not null, shipping_fee int not null, total int not null, status text not null default 'pending' check (status in ('pending','confirmed','shipped','delivered','cancelled')), created_at timestamptz not null default now());
create table public.order_items (id uuid primary key default gen_random_uuid(), order_id uuid not null references public.orders(id) on delete cascade, product_id uuid references public.products(id) on delete set null, name text not null, sku text not null, unit_price int not null, quantity int not null check (quantity > 0));

grant select on public.brands, public.phone_models, public.categories, public.products, public.product_compatibility, public.shipping_rates to anon, authenticated;
grant insert, update, delete on public.brands, public.phone_models, public.categories, public.products, public.product_compatibility, public.shipping_rates to authenticated;
grant select on public.reviews to anon; grant select, insert, update, delete on public.reviews to authenticated; grant insert on public.reviews to anon;
grant select, update, delete on public.orders, public.order_items to authenticated;
grant all on public.brands, public.phone_models, public.categories, public.products, public.product_compatibility, public.shipping_rates, public.reviews, public.orders, public.order_items to service_role;

do $$ declare t text; begin
  foreach t in array array['brands','phone_models','categories','products','product_compatibility','shipping_rates'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy "public read" on public.%I for select to anon, authenticated using (true)', t);
    execute format('create policy "admin write" on public.%I for all to authenticated using (public.has_role(auth.uid(),''admin'')) with check (public.has_role(auth.uid(),''admin''))', t);
  end loop; end $$;
alter table public.reviews enable row level security;
create policy "read approved" on public.reviews for select to anon, authenticated using (approved or public.has_role(auth.uid(),'admin'));
create policy "submit review" on public.reviews for insert to anon, authenticated with check (approved = false);
create policy "admin manage reviews" on public.reviews for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
alter table public.orders enable row level security; alter table public.order_items enable row level security;
create policy "admin orders" on public.orders for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create policy "admin items" on public.order_items for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

-- order placement: prices computed server-side
create or replace function public.place_order(_customer jsonb, _items jsonb) returns jsonb language plpgsql security definer set search_path=public as $$
declare o public.orders; it jsonb; p public.products; sub int := 0; fee int; q int; rate public.shipping_rates;
begin
  if jsonb_array_length(_items) = 0 or jsonb_array_length(_items) > 50 then raise exception 'Panier invalide'; end if;
  if length(coalesce(_customer->>'customer_name','')) < 2 or length(coalesce(_customer->>'phone','')) < 9 then raise exception 'Coordonnées invalides'; end if;
  select * into rate from shipping_rates where wilaya_code = (_customer->>'wilaya_code')::int;
  if rate is null then raise exception 'Wilaya invalide'; end if;
  fee := case when _customer->>'delivery_type' = 'desk' then rate.desk_fee else rate.home_fee end;
  for it in select * from jsonb_array_elements(_items) loop
    q := (it->>'quantity')::int;
    select * into p from products where id = (it->>'product_id')::uuid and active for update;
    if p is null or q < 1 or q > p.stock then raise exception 'Stock insuffisant'; end if;
    sub := sub + p.price * q;
  end loop;
  insert into orders(customer_name, phone, wilaya_code, commune, address, delivery_type, notes, subtotal, shipping_fee, total)
  values (left(_customer->>'customer_name',100), left(_customer->>'phone',20), rate.wilaya_code, left(coalesce(_customer->>'commune',''),100), left(_customer->>'address',300),
    case when _customer->>'delivery_type'='desk' then 'desk' else 'home' end, left(_customer->>'notes',500), sub, fee, sub + fee) returning * into o;
  for it in select * from jsonb_array_elements(_items) loop
    q := (it->>'quantity')::int;
    select * into p from products where id = (it->>'product_id')::uuid;
    insert into order_items(order_id, product_id, name, sku, unit_price, quantity) values (o.id, p.id, p.name, p.sku, p.price, q);
    update products set stock = stock - q, sold_count = sold_count + q where id = p.id;
  end loop;
  return jsonb_build_object('order_number', o.order_number, 'total', o.total);
end $$;
grant execute on function public.place_order(jsonb, jsonb) to anon, authenticated;

-- fuzzy search
create extension if not exists pg_trgm;
create index products_name_trgm on public.products using gin (name gin_trgm_ops);

-- SEED
insert into public.categories(slug,name_fr,name_ar,keywords,sort) values
('ecrans','Écrans','شاشات','{ecran,écran,lcd,oled,afficheur,screen,display,tactile}',1),
('batteries','Batteries','بطاريات','{batterie,battery,pile}',2),
('flex-charge','Nappes de charge','فليكس الشحن','{flex,nappe,charging,charge}',3),
('connecteurs','Connecteurs de charge','منافذ الشحن','{connecteur,port,usb,type-c,lightning}',4),
('vitres-camera','Vitres caméra','زجاج الكاميرا','{vitre,lentille,glass,lens}',5),
('cameras','Caméras','كاميرات','{camera,caméra,appareil}',6),
('haut-parleurs','Haut-parleurs','مكبرات الصوت','{haut-parleur,speaker,buzzer,ecouteur}',7),
('micros','Microphones','ميكروفونات','{micro,microphone,mic}',8),
('boutons','Boutons','أزرار','{bouton,button,power,volume}',9),
('tiroirs-sim','Tiroirs SIM','حامل الشريحة','{sim,tiroir,tray}',10),
('chassis','Châssis','هياكل','{chassis,châssis,frame,cadre}',11),
('vitres-arriere','Vitres arrière','أغطية خلفية','{arriere,arrière,back,cover,coque}',12),
('empreinte','Capteurs d''empreinte','بصمة الإصبع','{empreinte,fingerprint,capteur}',13),
('autres','Autres pièces','قطع أخرى','{autre,divers}',14);

insert into public.brands(name,slug,popular,sort) values
('Samsung','samsung',true,1),('Apple','apple',true,2),('Xiaomi','xiaomi',true,3),('Oppo','oppo',true,4),('Huawei','huawei',true,5),('Realme','realme',true,6),('Infinix','infinix',false,7),('Tecno','tecno',false,8);

insert into public.phone_models(brand_id,name,slug,aliases,popular)
select b.id, m.name, m.slug, m.aliases, m.popular from (values
 ('samsung','Galaxy A52','galaxy-a52','{A52,A525}'::text[],true),('samsung','Galaxy A12','galaxy-a12','{A12}',true),('samsung','Galaxy A32','galaxy-a32','{A32}',false),('samsung','Galaxy S21','galaxy-s21','{S21}',false),
 ('apple','iPhone 11','iphone-11','{"iphone11","11"}',true),('apple','iPhone 12','iphone-12','{"iphone12","12"}',false),('apple','iPhone 13','iphone-13','{"iphone13","13"}',true),('apple','iPhone X','iphone-x','{iphonex}',false),
 ('xiaomi','Redmi 9A','redmi-9a','{9A}',true),('xiaomi','Redmi 9C','redmi-9c','{9C}',false),('xiaomi','Redmi Note 12','redmi-note-12','{"note 12","note12"}',true),('xiaomi','Redmi Note 10','redmi-note-10','{"note 10","note10"}',false),
 ('oppo','A16','oppo-a16','{A16}',true),('oppo','A54','oppo-a54','{A54}',false),
 ('huawei','Y9 Prime 2019','huawei-y9-prime','{"y9 prime"}',false),('realme','C21','realme-c21','{C21}',false),('infinix','Hot 30','infinix-hot-30','{"hot 30"}',false),('tecno','Spark 10','tecno-spark-10','{"spark 10"}',false)
) as m(bslug,name,slug,aliases,popular) join public.brands b on b.slug=m.bslug;

insert into public.products(sku,name,slug,description,category_id,brand_id,price,compare_price,stock,quality,warranty,specs,featured,sold_count,created_at)
select p.sku,p.name,p.slug,p.descr,c.id,b.id,p.price,p.cmp,p.stock,p.quality,p.warranty,p.specs::jsonb,p.featured,p.sold, now() - (p.age || ' days')::interval from (values
 ('LCD-SA52-OLED','Écran Samsung Galaxy A52 OLED avec châssis','ecran-samsung-a52-oled','Bloc écran OLED complet avec vitre tactile et châssis, prêt à monter.','ecrans','samsung',14900,16500,12,'OLED Original','6 mois','{"Technologie":"Super AMOLED","Taille":"6.5\"","Résolution":"1080 x 2400","Châssis":"Inclus"}',true,84,40),
 ('LCD-RM9A-9C','LCD Redmi 9A / 9C','lcd-redmi-9a-9c','Écran LCD + tactile compatible Redmi 9A et 9C.','ecrans','xiaomi',3200,3800,30,'Original','3 mois','{"Technologie":"IPS LCD","Taille":"6.53\""}',true,210,60),
 ('LCD-IP11-INC','Écran iPhone 11 Incell','ecran-iphone-11-incell','Écran Incell de haute qualité pour iPhone 11.','ecrans','apple',7500,null,18,'Incell','3 mois','{"Technologie":"Incell LCD","Taille":"6.1\""}',true,150,20),
 ('LCD-RMN12','Écran Redmi Note 12 AMOLED','ecran-redmi-note-12','Bloc AMOLED pour Redmi Note 12 4G.','ecrans','xiaomi',9800,11000,7,'AMOLED Original','6 mois','{"Technologie":"AMOLED","Taille":"6.67\""}',false,45,3),
 ('BAT-IP13','Batterie iPhone 13','batterie-iphone-13','Batterie 3227 mAh, 0 cycle.','batteries','apple',5900,6500,25,'Haute capacité','6 mois','{"Capacité":"3227 mAh","Tension":"3.88 V"}',true,120,10),
 ('BAT-SA52','Batterie Samsung A52 EB-BG781ABY','batterie-samsung-a52','Batterie d''origine 4500 mAh.','batteries','samsung',2800,null,40,'Original','6 mois','{"Capacité":"4500 mAh","Référence":"EB-BG781ABY"}',false,98,50),
 ('BAT-RM9A','Batterie Redmi 9A / 9C BN56','batterie-redmi-bn56','Batterie BN56 5000 mAh.','batteries','xiaomi',1900,null,0,'Original','3 mois','{"Capacité":"5000 mAh","Référence":"BN56"}',false,170,80),
 ('FLX-OPA16','Nappe de charge Oppo A16','flex-charge-oppo-a16','Carte de charge avec connecteur micro-USB et micro.','flex-charge','oppo',1200,1500,22,'Original','3 mois','{"Connecteur":"Micro-USB","Micro":"Inclus"}',true,60,5),
 ('FLX-SA12','Nappe de charge Samsung A12','flex-charge-samsung-a12','Sous-carte de charge pour Galaxy A12.','flex-charge','samsung',900,null,35,'Compatible','1 mois','{"Connecteur":"USB-C"}',false,77,30),
 ('POR-IP-LGT','Connecteur Lightning iPhone 11/12','connecteur-lightning-iphone','Nappe connecteur Lightning.','connecteurs','apple',2400,null,15,'Original','3 mois','{"Connecteur":"Lightning"}',false,33,2),
 ('CAM-GL-IP13','Vitre caméra arrière iPhone 13','vitre-camera-iphone-13','Lentilles de remplacement en saphir.','vitres-camera','apple',600,null,60,'Saphir','1 mois','{"Matériau":"Verre saphir"}',false,140,1),
 ('SPK-RMN10','Haut-parleur Redmi Note 10','haut-parleur-redmi-note-10','Buzzer inférieur.','haut-parleurs','xiaomi',800,null,20,'Original','1 mois','{"Type":"Haut-parleur bas"}',false,25,15),
 ('SIM-SA52','Tiroir SIM Samsung A52','tiroir-sim-samsung-a52','Tiroir SIM double, noir.','tiroirs-sim','samsung',400,null,50,'Original','1 mois','{"Couleur":"Noir"}',false,40,12),
 ('BCK-IP11','Vitre arrière iPhone 11','vitre-arriere-iphone-11','Vitre arrière grand trou, plusieurs couleurs.','vitres-arriere','apple',1800,2200,14,'Compatible','1 mois','{"Couleur":"Noir"}',true,55,4)
) as p(sku,name,slug,descr,cslug,bslug,price,cmp,stock,quality,warranty,specs,featured,sold,age)
join public.categories c on c.slug=p.cslug join public.brands b on b.slug=p.bslug;

insert into public.product_compatibility(product_id, model_id)
select pr.id, m.id from (values
 ('LCD-SA52-OLED','galaxy-a52'),('LCD-RM9A-9C','redmi-9a'),('LCD-RM9A-9C','redmi-9c'),('LCD-IP11-INC','iphone-11'),('LCD-RMN12','redmi-note-12'),
 ('BAT-IP13','iphone-13'),('BAT-SA52','galaxy-a52'),('BAT-RM9A','redmi-9a'),('BAT-RM9A','redmi-9c'),('FLX-OPA16','oppo-a16'),('FLX-SA12','galaxy-a12'),
 ('POR-IP-LGT','iphone-11'),('POR-IP-LGT','iphone-12'),('CAM-GL-IP13','iphone-13'),('SPK-RMN10','redmi-note-10'),('SIM-SA52','galaxy-a52'),('BCK-IP11','iphone-11')
) as x(sku,mslug) join public.products pr on pr.sku=x.sku join public.phone_models m on m.slug=x.mslug;

insert into public.reviews(product_id,author,city,rating,comment,approved)
select null, a, c, r, t, true from (values ('Karim B.','Oran',5,'Écran reçu en 48h, identique à l''original. Je recommande.'),('Sarah M.','Alger',5,'La recherche par modèle m''a évité une erreur de commande. Paiement à la livraison rassurant.'),('Yacine D.','Constantine',4,'Batterie de bonne qualité, livraison un peu longue mais bon service.')) v(a,c,r,t);

insert into public.shipping_rates(wilaya_code,name,home_fee,desk_fee,days)
select i, n, case when i in (16,9,35,42) then 400 when i between 1 and 48 and i not in (1,8,11,30,32,33,37,39,47) then 600 else 900 end,
 case when i in (16,9,35,42) then 250 when i not in (1,8,11,30,32,33,37,39,47,49,50,52,53,54,55,56,57,58) then 400 else 600 end,
 case when i in (16,9,35,42) then '1-2' when i in (1,8,11,30,32,33,37,39,47,49,50,52,53,54,55,56,57,58) then '4-7' else '2-4' end
from unnest(array['Adrar','Chlef','Laghouat','Oum El Bouaghi','Batna','Béjaïa','Biskra','Béchar','Blida','Bouira','Tamanrasset','Tébessa','Tlemcen','Tiaret','Tizi Ouzou','Alger','Djelfa','Jijel','Sétif','Saïda','Skikda','Sidi Bel Abbès','Annaba','Guelma','Constantine','Médéa','Mostaganem','M''Sila','Mascara','Ouargla','Oran','El Bayadh','Illizi','Bordj Bou Arréridj','Boumerdès','El Tarf','Tindouf','Tissemsilt','El Oued','Khenchela','Souk Ahras','Tipaza','Mila','Aïn Defla','Naâma','Aïn Témouchent','Ghardaïa','Relizane','Timimoun','Bordj Badji Mokhtar','Ouled Djellal','Béni Abbès','In Salah','In Guezzam','Touggourt','Djanet','El M''Ghair','El Meniaa']) with ordinality as w(n,i);
