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

-- add a new staff (to add a new courier)
CREATE FUNCTION public.staff_create(iduser_p bigint, staff_level_p integer) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
    INSERT INTO staff (iduser, staff_level) VALUES (iduser_p, staff_level_p);
END;
$$;

-- remove a staff
CREATE FUNCTION public.staff_remove(iduser_p bigint) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
    delete from staff where iduser = iduser_p;
END;
$$;

-- check if user_id is courier
CREATE FUNCTION public.staff_check(iduser_p bigint) RETURNS boolean
    LANGUAGE plpgsql
    AS $$
DECLARE
    iscourier boolean;
BEGIN
    SELECT (count(*) >= 1) into iscourier
    FROM public.admins_v
    where id = iduser_p and staff_level >= 1;
    
    RETURN iscourier;
END;
$$;


-- get all available sweets with likes
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

-- retrieves a list of items associated with a given order ID and formats them as a concatenated string, including the item name, quantity, and total price, separated by newlines
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

-- get all sweets user likes
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

-- get recommendations for an user. Will select * from recommendations_v that uses recommendation ratings formula
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

-- retrieves sweets and their associated details from sweets_and_categories_v by category and user_id
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

-- add items (specified by their UUIDs and count_s) into a user's shopping cart 
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

-- get a user's cart
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

-- gets free and a courier's not finished orders
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

-- update an order's status, not more than 1 step between old and new statuses
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

-- get goods from a finished order for feedbacks
CREATE FUNCTION public.get_available_feedbacks(iduser_p bigint) RETURNS TABLE(iduser bigint, idsweet uuid, name character varying, created_at timestamp without time zone)
    LANGUAGE plpgsql
    AS $$
BEGIN  
    RETURN QUERY
    SELECT * from available_to_leave_feedback_v
    where available_to_leave_feedback_v.iduser = iduser_p;
END;
$$;

-- update good's score
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

-- unmark a good as "like"
CREATE FUNCTION public.favorite_remove(idsweet_p uuid, iduser_p bigint) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
    DELETE FROM favorites WHERE idsweet = idsweet_p and iduser = iduser_p;
END;
$$;

-- mark a good as "like"
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

-- create a new sweet
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

-- add a category for a good. A good can have few categories
CREATE FUNCTION public.categories_list_add(idsweet_p uuid, idcategory_p uuid) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
    insert into sweets_categories(idsweet, idcategory) values(idsweet_p, idcategory_p);
END;
$$;

-- remove a category from a good
CREATE FUNCTION public.categories_list_remove(idsweet_p uuid, idcategory_p uuid) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
    delete from sweets_categories
	where idsweet = idsweet_p and idcategory = idcategory_p;
END;
$$;

-- update good's details
CREATE FUNCTION public.sweets_update(sweet_id uuid, new_cost double precision, new_discount double precision, new_quantity integer) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
    UPDATE sweets SET 
        cost = new_cost, discount = new_discount, quantity = new_quantity
    WHERE idsweet = sweet_id;
END;
$$;

-- mark a good as deleted, quantity will be (-1)
CREATE FUNCTION public.sweets_remove(sweet_id uuid) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
    UPDATE sweets SET quantity = -1
    WHERE idsweet = sweet_id;
END;
$$;

-- update details for a category
CREATE FUNCTION public.category_update(category_id uuid, category_name character varying, category_description text) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
    UPDATE public.category SET name = category_name, description = category_description WHERE idcategory = category_id;
END;
$$;

-- delete a category
CREATE FUNCTION public.category_delete(category_id uuid) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
    DELETE FROM public.category WHERE idcategory = category_id;
END;
$$;

-- get an user's discount
CREATE OR REPLACE FUNCTION public.user_get_discount(
	iduser_p bigint)
    RETURNS double precision
    LANGUAGE 'plpgsql'
AS $BODY$
DECLARE
    discount double precision;
BEGIN
    select personal_discount into discount from users where iduser = iduser_p;
    
    RETURN discount;
END;
$BODY$;

-- update a discount for a user
CREATE FUNCTION public.user_update_discount(iduser_p bigint, discount_new double precision) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
    update users set personal_discount = discount_new where iduser = iduser_p;
END;
$$;

-- get a good's name by its UUID
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

-- get a good's price by its UUID, a discount will be taken
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

-- calculate a recommendation rate: R = ((avg_score - 3) / 2) + (num_orders / 10) + (num_favorites / 5)
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
