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

CREATE FUNCTION public.user_create_or_update(iduser_p bigint, first_name_p character varying, last_name_p character varying, username_p character varying) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
  -- checking if the user already exists
  IF EXISTS (SELECT 1 FROM users WHERE iduser = iduser_p) THEN
    -- update, if exists
    UPDATE users 
    SET 
      first_name = first_name_p,
      last_name = last_name_p,
      username = username_p
    WHERE iduser = iduser_p;
  ELSE
    -- create new, if does not exist
    INSERT INTO users (iduser, first_name, last_name, username)
    VALUES (iduser_p, first_name_p, last_name_p, username_p);
  END IF;
END;
$$;

CREATE FUNCTION public.items_get_all(idorder_p uuid) RETURNS TABLE(items text)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN query select 
        (string_agg(format('%s x%s - ₽%s', "name", "count", total_price), E'\n')) as items
        from order_items_list
        join sweets using(idsweet)
        where idorder = idorder_p;
END;
$$;

CREATE FUNCTION public.category_create(category_name character varying, category_description text) RETURNS uuid
    LANGUAGE plpgsql
    AS $$
DECLARE
    new_category_id uuid;
BEGIN
    INSERT INTO public.category (name, description) VALUES (category_name, category_description)
    RETURNING idcategory INTO new_category_id;
    RETURN new_category_id;
END;
$$;

CREATE FUNCTION public.order_update_payment_charge(telegram_payment_charge_id_p character varying, provider_payment_charge_id_p character varying, idorder_p uuid) RETURNS void
    LANGUAGE plpgsql
    AS $$declare
iduser_p bigint;
discount double precision;
total_amount_p integer := 0;
cart_item record;
BEGIN
    select iduser into iduser_p from "order" where idorder = idorder_p;
    update "order" 
    set 
        telegram_payment_charge_id = telegram_payment_charge_id_p,
        provider_payment_charge_id = provider_payment_charge_id_p
    where
        idorder = idorder_p;
        
    FOR cart_item IN SELECT * FROM public.cart_items_list WHERE iduser = iduser_p LOOP
            IF cart_item.count <= (SELECT quantity FROM public.sweets WHERE idsweet = cart_item.idsweet) THEN
                total_amount_p := total_amount_p + cart_item.total_price;
                INSERT INTO public.order_items_list (iduser, idorder, idsweet, count, total_price)
                VALUES (iduser_p, idorder_p, cart_item.idsweet, cart_item.count, cart_item.total_price);
                DELETE FROM public.cart_items_list WHERE iduser = iduser_p AND idsweet = cart_item.idsweet;
                update sweets set quantity = quantity - cart_item.count where sweets.idsweet = cart_item.idsweet;
            END IF;
        END LOOP;
     discount := user_get_discount(iduser_p);

     UPDATE public."order" SET total_amount = total_amount_p - (discount * total_amount_p) WHERE idorder = idorder_p;
END;
$$;

CREATE FUNCTION public.cart_items_getuser(user_id bigint) RETURNS TABLE(label text, amount integer)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
    SELECT cart_v.label, cart_v.amount
    FROM public.cart_v
    WHERE iduser = user_id;
END;
$$;


CREATE FUNCTION public.order_create(p_iduser bigint) RETURNS uuid
    LANGUAGE plpgsql
    AS $$
DECLARE
    order_id uuid;
    total_amount_p integer := 0;
    cart_item record;
    available integer := 0;
    userput integer := 0;
    discount double precision := 0.0;
BEGIN
    available := cart_getuser_availablegoods(p_iduser);
    userput := cart_getuser_totalgoods(p_iduser);
    discount := user_get_discount(p_iduser);

    IF available = userput and available != 0 then
        INSERT INTO public."order" (iduser, total_amount)
        VALUES (p_iduser, total_amount_p)
        RETURNING idorder INTO order_id;
    end if;
    
    return order_id;
END;
$$;


CREATE FUNCTION public.order_getid_byuserid(iduser_p bigint) RETURNS character varying
    LANGUAGE plpgsql
    AS $$
DECLARE
    idorder_p uuid;
BEGIN
    SELECT idorder INTO idorder_p FROM "order" WHERE iduser_p = iduser and status is null 
    order by created desc
    limit 1;
    
    RETURN idorder_p;
END;
$$;

CREATE FUNCTION public.order_update_address(idorder_p uuid, country_code_p character varying, state_p character varying, city_p character varying, street_line1_p character varying, street_line2_p character varying, post_code_p integer, phone_number_p character varying) RETURNS void
    LANGUAGE plpgsql
    AS $$

BEGIN
    update "order"
    set 
    country_code = country_code_p,
    "state" = state_p ,
    city = city_p,
    street_line1 = street_line1_p, 
    street_line2 = street_line2_p, 
    post_code = post_code_p,
    phone_number = phone_number_p,
    status = 1
    where idorder = idorder_p;
END;
$$;

CREATE FUNCTION public.staff_create(iduser_p bigint, staff_level_p integer) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
    INSERT INTO staff (iduser, staff_level) VALUES (iduser_p, staff_level_p);
END;
$$;

CREATE FUNCTION public.staff_remove(iduser_p bigint) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
    delete from staff where iduser = iduser_p;
END;
$$;

CREATE FUNCTION public.staff_check(iduser_p bigint) RETURNS boolean
    LANGUAGE plpgsql
    AS $$
DECLARE
    isadmin boolean;
BEGIN
    SELECT (count(*) >= 1) into isadmin
    FROM public.admins_v
    where id = iduser_p and staff_level >= 1;
    
    RETURN isadmin;
END;
$$;





CREATE FUNCTION public.sweets_getall(iduser_p bigint) RETURNS TABLE(idsweet uuid, name character varying, cost double precision, discount double precision, wt double precision, description text, picture_base64 text, max integer, purchases_total bigint, "like" boolean)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
     SELECT sweets.idsweet,
    sweets.name,
    sweets.cost,
    sweets.discount,
    sweets.wt,
    sweets.description,
    sweets.picture_base64,
    sweets.quantity AS max,
    t.purchases_total,
    favorite_check(sweets.idsweet, iduser_p) as "like"
   FROM sweets
     FULL JOIN ( SELECT order_items_list.idsweet,
            sum(order_items_list.count) AS purchases_total
           FROM order_items_list
          GROUP BY order_items_list.idsweet) t USING (idsweet)
	 where sweets.quantity >= 0;
END;
$$;




CREATE FUNCTION public.likes_v_getsweets(iduser_p bigint) RETURNS TABLE(idsweet uuid, name character varying, cost double precision, discount double precision, wt double precision, description text, picture_base64 text, max integer, "like" boolean)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        likes_v.idsweet, 
        likes_v.name, 
        likes_v.cost, 
        likes_v.discount, 
        likes_v.wt, 
        likes_v.description, 
        likes_v.picture_base64, 
        likes_v.max,
        true as "like"
        from likes_v WHERE iduser = iduser_p
    order by added desc;
END;
$$;


CREATE FUNCTION public.get_recommendations(iduser_p bigint) RETURNS TABLE(idsweet uuid, name character varying, cost double precision, discount double precision, wt double precision, description text, picture_base64 text, max integer, "like" boolean)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
     SELECT recommendations_v.idsweet,
    recommendations_v.name,
    recommendations_v.cost,
    recommendations_v.discount,
    recommendations_v.wt,
    recommendations_v.description,
    recommendations_v.picture_base64,
    recommendations_v.quantity AS max,
    favorite_check(recommendations_v.idsweet, iduser_p) as "like"
   FROM recommendations_v
   where recommendations_v.quantity >= 0;
END;
$$;

CREATE FUNCTION public.sweets_and_categories_v_getsweets(idcategory_p uuid, iduser_p bigint) RETURNS TABLE(idsweet uuid, idcategory uuid, name character varying, cost double precision, discount double precision, wt double precision, description text, picture_base64 text, max integer, purchases_total bigint, "like" boolean)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
    SELECT sweets_and_categories_v.idsweet,
	sweets_and_categories_v.idcategory,
    sweets_and_categories_v.name,
    sweets_and_categories_v.cost,
    sweets_and_categories_v.discount,
    sweets_and_categories_v.wt,
    sweets_and_categories_v.description,
    sweets_and_categories_v.picture_base64,
    sweets_and_categories_v.max,
    sweets_and_categories_v.purchases_total,
	favorite_check(sweets_and_categories_v.idsweet, iduser_p) as like 
	from sweets_and_categories_v WHERE sweets_and_categories_v.idcategory = idcategory_p
    order by purchases_total desc;
END;
$$;


CREATE FUNCTION public.cart_add(idsweet_p uuid[], iduser_p bigint, count_p integer[]) RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
    sweet_id uuid;
    count integer;
    i integer;
BEGIN
    delete from cart_items_list where iduser = iduser_p;

    FOR i IN 1..array_length(idsweet_p, 1) LOOP
        sweet_id := idsweet_p[i];
        count := count_p[i];
        INSERT INTO cart_items_list (iduser, idsweet, count, total_price)
        VALUES (iduser_p, sweet_id, count, sweets_get_cost(sweet_id) * count);
    END LOOP;
END;
$$;



CREATE FUNCTION public.orders_get_available(idcourier_p bigint) RETURNS TABLE(idorder uuid, iduser bigint, idcourier bigint, user_info text, address text, phone_number text, paid_string text, items text, status integer, status_name character varying)
    LANGUAGE plpgsql
    AS $$
declare isadmin integer := 0;
BEGIN
    select count(*) into isadmin from "admins_v" where "id" = idcourier_p;
    
    RETURN QUERY
    SELECT * from active_orders_v
    where 
    (
        active_orders_v.idcourier = idcourier_p 
        or active_orders_v.idcourier is NULL
    )
    and isadmin != 0
    ;
END;
$$;

CREATE FUNCTION public.order_update_status(idorder_p uuid, idcourier_p bigint, new_status_p integer) RETURNS boolean
    LANGUAGE plpgsql
    AS $$DECLARE
    status_old integer;
BEGIN
    select status into status_old from "order" 
    where idorder = idorder_p 
    and (idcourier is null or idcourier = idcourier_p);

    if ABS(status_old - new_status_p) > 1 
        OR status_old - new_status_p = 0
        then return false;
    else
    update "order" 
    set 
        status = new_status_p,
        status_changed_at = CURRENT_TIMESTAMP
    where
        idorder = idorder_p 
        and (idcourier is null or idcourier = idcourier_p);
        
    return FOUND;
    end if;
END;
$$;


CREATE FUNCTION public.get_available_feedbacks(iduser_p bigint) RETURNS TABLE(iduser bigint, idsweet uuid, name character varying, created_at timestamp without time zone)
    LANGUAGE plpgsql
    AS $$
BEGIN  
    RETURN QUERY
    SELECT * from available_to_leave_feedback_v
    where available_to_leave_feedback_v.iduser = iduser_p;
END;
$$;


CREATE FUNCTION public.order_items_list_update_score(iduser_p bigint, idsweet_p uuid, score_p integer) RETURNS boolean
    LANGUAGE plpgsql
    AS $$

BEGIN
    update "order_items_list"
    set
    score = score_p
    where iduser = iduser_p and idsweet = idsweet_p and score is NULL;
        
    return FOUND;
END;
$$;

CREATE FUNCTION public.favorite_remove(idsweet_p uuid, iduser_p bigint) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
    DELETE FROM favorites WHERE idsweet = idsweet_p and iduser = iduser_p;
END;
$$;

CREATE FUNCTION public.favorite_add(idsweet_p uuid, iduser_p bigint) RETURNS void
    LANGUAGE plpgsql
    AS $$DECLARE
    liked boolean;
BEGIN
    select (count(idsweet) > 0) into liked from "favorites" where 
    iduser = iduser_p and idsweet = idsweet_p;
    
    if liked then perform favorite_remove(idsweet_p, iduser_p);
    else   
    insert into favorites(iduser, idsweet) values(iduser_p, idsweet_p);
    end if;
END;
$$;

CREATE FUNCTION public.sweet_create(sweet_name character varying, sweet_cost double precision, sweet_discount double precision, sweet_wt double precision, sweet_description text, sweet_picture_base64 text, sweet_quantity integer, categories_p uuid[]) RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
    sweet_id uuid;
BEGIN
    INSERT INTO sweets (name, cost, discount, wt, description, picture_base64, quantity) 
    VALUES (sweet_name, sweet_cost, sweet_discount, sweet_wt, sweet_description, sweet_picture_base64, sweet_quantity)
    RETURNING idsweet INTO sweet_id;
    
	FOR i IN 1..array_length(categories_p, 1) LOOP
        insert into "sweets_categories"(idsweet, idcategory) 
		values (sweet_id, categories_p[i]);
    END LOOP;
END;
$$;

CREATE FUNCTION public.categories_list_add(idsweet_p uuid, idcategory_p uuid) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
    insert into sweets_categories(idsweet, idcategory) values(idsweet_p, idcategory_p);
END;
$$;

CREATE FUNCTION public.categories_list_remove(idsweet_p uuid, idcategory_p uuid) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
    delete from sweets_categories
	where idsweet = idsweet_p and idcategory = idcategory_p;
END;
$$;

CREATE FUNCTION public.sweets_update(sweet_id uuid, new_cost double precision, new_discount double precision, new_quantity integer) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
    UPDATE sweets SET 
        cost = new_cost, discount = new_discount, quantity = new_quantity
    WHERE idsweet = sweet_id;
END;
$$;

CREATE FUNCTION public.sweets_remove(sweet_id uuid) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
    UPDATE sweets SET quantity = -1
    WHERE idsweet = sweet_id;
END;
$$;

CREATE FUNCTION public.category_update(category_id uuid, category_name character varying, category_description text) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
    UPDATE public.category SET name = category_name, description = category_description WHERE idcategory = category_id;
END;
$$;

CREATE FUNCTION public.category_delete(category_id uuid) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
    DELETE FROM public.category WHERE idcategory = category_id;
END;
$$;


CREATE FUNCTION public.user_update_discount(iduser_p bigint, discount_new double precision) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
    update users set personal_discount = discount_new where iduser = iduser_p;
END;
$$;

CREATE FUNCTION public.sweets_get_name(sweet_id uuid) RETURNS character varying
    LANGUAGE plpgsql
    AS $$
DECLARE
    sweet_name character varying(127);
BEGIN
    SELECT name INTO sweet_name FROM sweets WHERE idsweet = sweet_id;
    RETURN sweet_name;
END;
$$;

CREATE FUNCTION public.sweets_get_cost(sweet_id uuid) RETURNS double precision
    LANGUAGE plpgsql
    AS $$
DECLARE
    sweet_cost double precision;
BEGIN
    SELECT cost - (cost * discount) INTO sweet_cost
    FROM sweets
    WHERE idsweet = sweet_id;
    
    RETURN sweet_cost;
END;
$$;

CREATE FUNCTION public.get_sweets_recommendations() RETURNS TABLE(idsweet uuid, name character varying, cost double precision, discount double precision, wt double precision, description text, picture_base64 text, quantity integer, recommendation_score numeric)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
    WITH sweets_score AS (
        SELECT
            sweets.idsweet,
            sweets.name,
            sweets.cost,
            sweets.discount,
            sweets.wt,
            sweets.description,
            sweets.picture_base64,
            sweets.quantity,
            COALESCE(AVG(score), 0) AS avg_score,
            COUNT(DISTINCT idorder) AS num_orders,
            COUNT(DISTINCT favorites.iduser) AS num_favorites
        FROM
            sweets
            LEFT JOIN order_items_list ON sweets.idsweet = order_items_list.idsweet
            LEFT JOIN favorites ON sweets.idsweet = favorites.idsweet
        GROUP BY
            sweets.idsweet
    ),
    normalized_sweets_score AS (
        SELECT
            sweets_score.idsweet,
            sweets_score.name,
            sweets_score.cost,
            sweets_score.discount,
            sweets_score.wt,
            sweets_score.description,
            sweets_score.picture_base64,
            sweets_score.quantity,
            ((avg_score - 3) / 2) + (num_orders / 10) + (num_favorites / 5) AS recommendation_score
        FROM
            sweets_score
    )
    SELECT
        normalized_sweets_score.idsweet,
        normalized_sweets_score.name,
        normalized_sweets_score.cost,
        normalized_sweets_score.discount,
        normalized_sweets_score.wt,
        normalized_sweets_score.description,
        normalized_sweets_score.picture_base64,
        normalized_sweets_score.quantity,
        normalized_sweets_score.recommendation_score
    FROM
        normalized_sweets_score
    ORDER BY
        recommendation_score DESC;
END;
$$;

CREATE VIEW public.sweets_and_categories_v AS
 SELECT sweets.idsweet,
    sweets_categories.idcategory,
    sweets.name,
    sweets.cost,
    sweets.discount,
    sweets.wt,
    sweets.description,
    sweets.picture_base64,
    sweets.quantity AS max,
    t.purchases_total
   FROM ((public.sweets_categories
     FULL JOIN public.sweets USING (idsweet))
     FULL JOIN ( SELECT order_items_list.idsweet,
            sum(order_items_list.count) AS purchases_total
           FROM public.order_items_list
          GROUP BY order_items_list.idsweet) t USING (idsweet));

CREATE VIEW public.active_orders_v AS
 SELECT "order".idorder,
    "order".iduser,
    "order".idcourier,
    format('👤 %s %s, @%s (-%s%%)'::text, users.first_name, users.last_name, users.username, (users.personal_discount * (100)::double precision)) AS user_info,
    format('📍 %s, %s, %s'::text, "order".city, "order".street_line1, "order".street_line2) AS address,
    format('📞 +%s'::text, "order".phone_number) AS phone_number,
    format('Paid (with discount) - ₽%s'::text, "order".total_amount) AS paid_string,
    public.items_get_all("order".idorder) AS items,
    "order".status,
    order_statuses.status_name
   FROM ((public."order"
     JOIN public.users USING (iduser))
     JOIN public.order_statuses ON (("order".status = order_statuses.idstatus)))
  WHERE (("order".status <> 5) AND ("order".status <> '-1'::integer) AND ("order".telegram_payment_charge_id IS NOT NULL));

CREATE VIEW public.available_to_leave_feedback_v AS
 SELECT order_items_list.iduser,
    order_items_list.idsweet,
    public.sweets_get_name(order_items_list.idsweet) AS name,
    order_items_list.created_at
   FROM (public.order_items_list
     JOIN public."order" USING (idorder))
  WHERE ((order_items_list.score IS NULL) AND ("order".status = 5))
  ORDER BY order_items_list.created_at DESC;

CREATE VIEW public.admins_v AS
 SELECT staff.iduser AS id,
    users.first_name,
    users.username,
    staff.staff_level
   FROM (public.staff
     JOIN public.users USING (iduser));

CREATE VIEW public.cart_v AS
 SELECT cart_items_list.iduser,
    format('%s – ✕%s'::text, public.sweets_get_name(cart_items_list.idsweet), cart_items_list.count) AS label,
    (((public.sweets_get_cost(cart_items_list.idsweet) * (cart_items_list.count)::double precision) * (100)::double precision))::integer AS amount
   FROM public.cart_items_list;

CREATE VIEW public.sweets_v AS
 SELECT sweets.idsweet,
    sweets.name,
    sweets.cost,
    sweets.discount,
    sweets.wt,
    sweets.description,
    sweets.picture_base64,
    sweets.quantity AS max,
    t.purchases_total,
    true AS "like"
   FROM (public.sweets
     FULL JOIN ( SELECT order_items_list.idsweet,
            sum(order_items_list.count) AS purchases_total
           FROM public.order_items_list
          GROUP BY order_items_list.idsweet) t USING (idsweet))
  WHERE (sweets.quantity >= 0);

CREATE VIEW public.categories_v AS
 SELECT category.idcategory,
    category.name,
    category.description
   FROM public.category;

CREATE VIEW public.sweets_categories_list_v AS
 SELECT sweets_categories.idsweet,
    sweets_categories.idcategory
   FROM public.sweets_categories;

CREATE VIEW public.users_v AS
 SELECT users.iduser,
    format('%s %s'::text, users.first_name, users.last_name) AS fullname,
    users.username,
    users.personal_discount
   FROM public.users;

CREATE VIEW public.recommendations_v AS
 SELECT get_sweets_recommendations.idsweet,
    get_sweets_recommendations.name,
    get_sweets_recommendations.cost,
    get_sweets_recommendations.discount,
    get_sweets_recommendations.wt,
    get_sweets_recommendations.description,
    get_sweets_recommendations.quantity,
    get_sweets_recommendations.recommendation_score,
    get_sweets_recommendations.picture_base64
   FROM public.get_sweets_recommendations() get_sweets_recommendations(idsweet, name, cost, discount, wt, description, picture_base64, quantity, recommendation_score)
  ORDER BY get_sweets_recommendations.recommendation_score DESC;

CREATE VIEW public.sweets_and_categories_v AS
 SELECT sweets.idsweet,
    sweets_categories.idcategory,
    sweets.name,
    sweets.cost,
    sweets.discount,
    sweets.wt,
    sweets.description,
    sweets.picture_base64,
    sweets.quantity AS max,
    t.purchases_total
   FROM ((public.sweets_categories
     FULL JOIN public.sweets USING (idsweet))
     FULL JOIN ( SELECT order_items_list.idsweet,
            sum(order_items_list.count) AS purchases_total
           FROM public.order_items_list
          GROUP BY order_items_list.idsweet) t USING (idsweet));

CREATE VIEW public.likes_v AS
 SELECT favorites.idsweet,
    favorites.iduser,
    favorites.added,
    sweets_v.name,
    sweets_v.cost,
    sweets_v.discount,
    sweets_v.wt,
    sweets_v.description,
    sweets_v.picture_base64,
    sweets_v.max,
    sweets_v.purchases_total
   FROM (public.favorites
     JOIN public.sweets_v USING (idsweet));