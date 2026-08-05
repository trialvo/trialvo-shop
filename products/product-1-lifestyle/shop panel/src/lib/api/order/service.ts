// src/lib/api/order/service.ts
import { api } from "../client";

// -----------------------------
// Types
// -----------------------------

// Base types
export type OrderTotals = {
    subtotal: number;
    sku_discount_total?: number;
    bulk_discount_total?: number;
    combo_discount_total?: number;
    cart_wide_discount?: number;
    coupon_discount?: number;
    discount_total: number;
    delivery_charge: number;
    weight_kg_total?: number;
    weight_extra_charge?: number;
    grand_total: number;
    paid_amount: number;
    due_amount: number;
};

export type OrderSummary = {
    item_count: number;
    unique_products: number;
    total_quantity: number;
};

export type OrderActions = {
    can_cancel: boolean;
    can_return: boolean;
    can_contact_support: boolean;
    can_view_invoice: boolean;
};

export type OrderAddress = {
    full_address: string;
    city: string;
    zip_code: string;
    address_type: string;
};

export type ProductCategories = {
    main: string;
    sub: string;
    child: string;
};

// Order Item Type
export type OrderItem = {
    id: number;
    order_id: number;
    product_id: number;
    product_sku_id: number;
    product_name: string;
    product_image: string | null;
    product_slug: string;
    product_short_description: string | null;
    color_id: number;
    color_name: string;
    color_hex: string;
    attribute_id: number | null;
    attribute_name: string | null;
    variant_id: number;
    variant_name: string;
    quantity: number;
    selling_price: number;
    discount: number;
    discount_type: number;
    coupon_code: string | null;
    coupon_discount: number;
    final_unit_price: number;
    line_total: number;
    created_at: string;
    sku: string;
    brand_name: string;
    categories: ProductCategories;
};

// Payment Type
export type OrderPayment = {
    id: number;
    order_id: number;
    provider: string;
    transaction_ref: string | null;
    amount: number;
    status: 'pending' | 'success' | 'failed' | 'cancelled';
    paid_at: string | null;
};

// Courier Type
export type OrderCourier = {
    id: number;
    courier_provider: string | null;
    delivery_charge_id: number;
    delivery_title: string;
    tracking_number: string | null;
    memo: string | null;
    weight: number;
    type: string | null;
    is_auto_available: boolean;
    reference_id: string | null;
    created_at: string;
};

// Coupon Type
export type OrderCoupon = {
    coupon_id: number;
    coupon_code: string;
    coupon_title: string;
    discount_type: number;
    discount_value: number;
    discount_amount: number;
};

// Order Status History Type
export type OrderStatusHistory = {
    id: number;
    order_id: number;
    old_status: OrderStatus | null;
    new_status: OrderStatus;
    note?: string | null;
    created_at: string;
    changed_by_admin?: number | null;
    admin_first_name?: string | null;
    admin_last_name?: string | null;
    admin_email?: string | null;
};

// Order Status Type
export type OrderStatus = 
    | 'new'
    | 'approved'
    | 'processing'
    | 'packaging'
    | 'shipped'
    | 'out_for_delivery'
    | 'delivered'
    | 'returned'
    | 'on_hold'
    | 'cancelled'
    | 'trash';

// Payment Status Type
export type PaymentStatus = 'paid' | 'unpaid';

// Payment Type
export type PaymentType = 'cod' | 'gateway' | 'mixed';

// Order Type
export type OrderType = 'regular' | 'guest' | 'admin_regular' | 'admin_stranger' | 'single_page';

// Order Core Type
export type OrderCore = {
    id: number;
    customer_id: number;
    customer_name: string;
    customer_email: string;
    customer_phone: string;
    order_type: OrderType;
    guest_order_uuid: string | null;
    payment_type: PaymentType;
    payment_status: PaymentStatus;
    subtotal: number;
    discount_total: number;
    delivery_charge: number;
    grand_total: number;
    paid_amount: number;
    due_amount: number;
    order_status: OrderStatus;
    note: string | null;
    placed_at: string;
    paid_at: string | null;
    shipped_at: string | null;
    delivered_at: string | null;
    cancelled_at: string | null;
    created_at: string;
    updated_at: string;
    address: OrderAddress;
};

export type OrderDetail = {
    order: OrderCore;
    items: OrderItem[];
    payments: OrderPayment[];
    couriers: OrderCourier[];
    coupons: OrderCoupon[];
    status_history: OrderStatusHistory[];
    totals: OrderTotals;
    summary: OrderSummary;
    issues: unknown | null;
    actions: OrderActions;
};

export type OrderListItem = OrderCore & {
    items: OrderItem[];
    payments: OrderPayment[];
    couriers: OrderCourier[];
    coupons: OrderCoupon[];
};

export type Pagination = {
    limit: number;
    offset: number;
    total: number;
};

// Response Types
export type BaseResponse = {
    success: boolean;
    message?: string;
    error?: string;
    flag?: number;
};

export type CreateOrderResponse = BaseResponse & {
    order_id?: number;
    totals?: OrderTotals;
    delivery_info?: {
        free_delivery: boolean;
        message: string;
    };
    items_summary?: {
        unique_skus: number;
        total_items: number;
        grouped_skus: number;
    };
    payment?: {
        type: string;
        advance_required: boolean;
        url: string | null;
    };
    deliveryCharge?: {
        id: number;
        title: string;
        type: string;
        customer_charge: number;
        our_charge: number;
        status: number;
        img_path: string | null;
        created_at: string;
        updated_at: string;
        deleted_at: string | null;
    } | null;
};

export type CreateOrderItemPayload = {
    product_variation_id: number;
    quantity: number;
};

export type CreateOrderPayload = {
    address_id: number;
    payment_type: PaymentType;
    delivery_charge_id: number;
    note?: string;
    coupon_code?: string;
    order_items: CreateOrderItemPayload[];
    // Analytics: FB CAPI cookie handoff (from useCookieIds hook)
    fbp?: string | null;
    fbc?: string | null;
    capi_event_id?: string | null;
};

export type GetOrdersParams = {
    limit?: number;
    offset?: number;
    
    status?: OrderStatus;
    payment_status?: PaymentStatus;
    order_type?: OrderType;
    
    date_from?: string; 
    date_to?: string;
    
    sort_by?: 'created_at' | 'updated_at' | 'grand_total';
    sort_order?: 'asc' | 'desc';
};

export type GetOrderByIdResponse = BaseResponse & {
    data: OrderDetail
};

export type GetOrdersResponse = BaseResponse & {
    data: OrderListItem[];
    pagination: Pagination;
};

export type InitiatePaymentResponse = BaseResponse & {
    url?: string;
    redirect_url?: string;
    payment_id?: string;
    transaction_id?: string;
};

export type TrackOrderResponse = BaseResponse & {
    status?: OrderStatus;
    updates?: OrderStatusHistory[];
};

export const orderKeys = {
    all: ["orders"] as const,
    lists: () => [...orderKeys.all, "list"] as const,
    list: (params?: GetOrdersParams) => {
        const key: Array<string | number | null> = [...orderKeys.lists()];
        
        if (params?.status) key.push(`status-${params.status}`);
        if (params?.payment_status) key.push(`paymentStatus-${params.payment_status}`);
        if (params?.order_type) key.push(`orderType-${params.order_type}`);
        if (params?.limit) key.push(`limit-${params.limit}`);
        if (params?.offset) key.push(`offset-${params.offset}`);
        if (params?.sort_by) key.push(`sortBy-${params.sort_by}`);
        if (params?.sort_order) key.push(`sortOrder-${params.sort_order}`);
        
        return key;
    },
    infiniteList: (params?: GetOrdersParams) => [...orderKeys.lists(), "infinite", ...orderKeys.list(params)] as const,
    details: () => [...orderKeys.all, "detail"] as const,
    detail: (id: number) => [...orderKeys.details(), id] as const,
};

export const orderService = {
    createOrder: async (payload: CreateOrderPayload): Promise<CreateOrderResponse> => {
        const res = await api.post<CreateOrderResponse>("/user/order", payload);
        return res.data;
    },

    getOrders: async (params?: GetOrdersParams): Promise<GetOrdersResponse> => {
        const res = await api.get<GetOrdersResponse>("/user/orders", { params });
        return res.data;
    },

    getOrderById: async (id: number): Promise<GetOrderByIdResponse> => {
        const res = await api.get<GetOrderByIdResponse>(`/user/order/${id}`);
        return res.data;
    },

    initiatePayment: async (orderId: number, payment_method: string): Promise<InitiatePaymentResponse> => {
        const res = await api.post<InitiatePaymentResponse>(`/payment/initiatePayment/${orderId}`, {
            payment_method
        });
        return res.data;
    },

    cancelOrder: async (orderId: number): Promise<BaseResponse> => {
        const res = await api.patch<BaseResponse>(`/user/order/cancel/${orderId}`);
        return res.data;
    },

    trackOrder: async (orderId: number): Promise<TrackOrderResponse> => {
        const res = await api.get<TrackOrderResponse>(`/user/order/${orderId}/track`);
        return res.data;
    },
};
