CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE public."order" (
    idorder uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    iduser bigint NOT NULL,
    created timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    idcourier bigint,
    status integer,
    country_code character varying(2),
    state character varying(128),
    city character varying(128),
    street_line1 character varying(256),
    street_line2 character varying(256),
    post_code integer,
    total_amount integer,
    telegram_payment_charge_id character varying(1024),
    provider_payment_charge_id character varying(1024),
    phone_number character varying(12),
    status_changed_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE TABLE public.order_statuses (
    idstatus integer NOT NULL,
    status_name character varying(25) NOT NULL
);
CREATE TABLE public.users (
    iduser bigint NOT NULL,
    first_name character varying(255) NOT NULL,
    last_name character varying(255),
    username character varying(255),
    personal_discount double precision DEFAULT 0
);
CREATE TABLE public.staff (
    iduser bigint NOT NULL,
    staff_level integer NOT NULL
);
CREATE TABLE public.order_items_list (
    iduser bigint NOT NULL,
    idsweet uuid NOT NULL,
    idorder uuid NOT NULL,
    count integer NOT NULL,
    total_price double precision NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    score integer
);
CREATE TABLE public.cart_items_list (
    iduser bigint NOT NULL,
    idsweet uuid NOT NULL,
    count integer NOT NULL,
    total_price double precision NOT NULL
);
CREATE TABLE public.category (
    idcategory uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(127) NOT NULL,
    description text
);
CREATE TABLE public.favorites (
    iduser integer NOT NULL,
    idsweet uuid NOT NULL,
    added timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE TABLE public.sweets (
    idsweet uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(127) NOT NULL,
    cost double precision NOT NULL,
    discount double precision DEFAULT 0,
    wt double precision,
    description text,
    picture_base64 text,
    quantity integer DEFAULT 0 NOT NULL
);
CREATE TABLE public.sweets_categories (
    idsweet uuid NOT NULL,
    idcategory uuid NOT NULL
);

ALTER TABLE ONLY public.category
    ADD CONSTRAINT category_pkey PRIMARY KEY (idcategory);

ALTER TABLE ONLY public."order"
    ADD CONSTRAINT order_pkey PRIMARY KEY (idorder);

ALTER TABLE ONLY public.order_statuses
    ADD CONSTRAINT order_statuses_pkey PRIMARY KEY (idstatus);

ALTER TABLE ONLY public.staff
    ADD CONSTRAINT staff_pkey PRIMARY KEY (iduser);

ALTER TABLE ONLY public.sweets
    ADD CONSTRAINT sweets_pkey PRIMARY KEY (idsweet);

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (iduser);

ALTER TABLE ONLY public."order"
    ADD CONSTRAINT fk_courier FOREIGN KEY (idcourier) REFERENCES public.staff(iduser);

ALTER TABLE ONLY public.order_items_list
    ADD CONSTRAINT fk_idorder FOREIGN KEY (idorder) REFERENCES public."order"(idorder);

ALTER TABLE ONLY public.cart_items_list
    ADD CONSTRAINT fk_idsweet FOREIGN KEY (idsweet) REFERENCES public.sweets(idsweet);

ALTER TABLE ONLY public.favorites
    ADD CONSTRAINT fk_idsweet FOREIGN KEY (idsweet) REFERENCES public.sweets(idsweet);

ALTER TABLE ONLY public.order_items_list
    ADD CONSTRAINT fk_idsweet FOREIGN KEY (idsweet) REFERENCES public.sweets(idsweet);

ALTER TABLE ONLY public.favorites
    ADD CONSTRAINT fk_iduser FOREIGN KEY (iduser) REFERENCES public.users(iduser);

ALTER TABLE ONLY public.cart_items_list
    ADD CONSTRAINT fk_iduser FOREIGN KEY (iduser) REFERENCES public.users(iduser);

ALTER TABLE ONLY public."order"
    ADD CONSTRAINT fk_iduser FOREIGN KEY (iduser) REFERENCES public.users(iduser);

ALTER TABLE ONLY public.staff
    ADD CONSTRAINT fk_iduser FOREIGN KEY (iduser) REFERENCES public.users(iduser);

ALTER TABLE ONLY public.order_items_list
    ADD CONSTRAINT fk_iduser FOREIGN KEY (iduser) REFERENCES public.users(iduser);

ALTER TABLE ONLY public."order"
    ADD CONSTRAINT fk_status FOREIGN KEY (status) REFERENCES public.order_statuses(idstatus);

ALTER TABLE ONLY public.sweets_categories
    ADD CONSTRAINT sweets_categories_idcategory_fkey FOREIGN KEY (idcategory) REFERENCES public.category(idcategory);

ALTER TABLE ONLY public.sweets_categories
    ADD CONSTRAINT sweets_categories_idsweet_fkey FOREIGN KEY (idsweet) REFERENCES public.sweets(idsweet);
