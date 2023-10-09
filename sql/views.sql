-- check all not finished orders
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

-- check all goods (from finished orders) available for feedback
CREATE VIEW public.available_to_leave_feedback_v AS
 SELECT order_items_list.iduser,
    order_items_list.idsweet,
    public.sweets_get_name(order_items_list.idsweet) AS name,
    order_items_list.created_at
   FROM (public.order_items_list
     JOIN public."order" USING (idorder))
  WHERE ((order_items_list.score IS NULL) AND ("order".status = 5))
  ORDER BY order_items_list.created_at DESC;

-- get all couriers
CREATE VIEW public.admins_v AS
 SELECT staff.iduser AS id,
    users.first_name,
    users.username,
    staff.staff_level
   FROM (public.staff
     JOIN public.users USING (iduser));

-- format prices for Telegram
CREATE VIEW public.cart_v AS
 SELECT cart_items_list.iduser,
    format('%s – ✕%s'::text, public.sweets_get_name(cart_items_list.idsweet), cart_items_list.count) AS label,
    ((((public.sweets_get_cost(cart_items_list.idsweet) - public.sweets_get_cost(cart_items_list.idsweet) * user_get_discount(cart_items_list.iduser)) * (cart_items_list.count)::double precision) * (100)::double precision))::integer AS amount
   FROM public.cart_items_list;

-- all available (not marked as deleted) goods
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

-- get all categories
CREATE VIEW public.categories_v AS
 SELECT category.idcategory,
    category.name,
    category.description
   FROM public.category;

CREATE VIEW public.sweets_categories_list_v AS
 SELECT sweets_categories.idsweet,
    sweets_categories.idcategory
   FROM public.sweets_categories;

-- get all users
CREATE VIEW public.users_v AS
 SELECT users.iduser,
    format('%s %s'::text, users.first_name, users.last_name) AS fullname,
    users.username,
    users.personal_discount
   FROM public.users;

-- get goods list with recommendation rate (check public.get_sweets_recommendations())
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

-- get goods and categories list
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

-- combines data from the "favorites" table and the "sweets_v" view to provide information about items that users have marked as favorites
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