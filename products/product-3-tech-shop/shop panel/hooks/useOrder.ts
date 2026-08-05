"use client";

import {
  orderKeys,
  orderService,
  type CreateOrderPayload,
  type CreateOrderResponse,
  type GetOrderByIdResponse,
  type GetOrdersParams,
  type GetOrdersResponse,
  type InitiatePaymentResponse,
  type OrderDetail,
  type OrderListItem,
  type OrderStatus,
  type Pagination,
  type PaymentStatus,
} from "@/lib/api/order/service";

import { useInfiniteQuery, useMutation, useQuery, useQueryClient, type UseQueryResult } from "@tanstack/react-query";
import { useAuth } from "./useAuth";

type OrdersListData = {
  orders: OrderListItem[];
  pagination: Pagination;
};

function toErrorMessage(input: unknown): string | undefined {
  if (typeof input === "string") {
    const s = input.trim();
    return s.length > 0 ? s : undefined;
  }
  if (input && typeof input === "object") {
    const obj = input as { message?: unknown; error?: unknown };
    if (typeof obj.message === "string" && obj.message.trim().length > 0) return obj.message.trim();
    if (typeof obj.error === "string" && obj.error.trim().length > 0) return obj.error.trim();
  }
  return undefined;
}

const extractOrders = (res: GetOrdersResponse): OrderListItem[] => {
  if (!res?.success) return [];
  return Array.isArray(res.data) ? res.data : [];
};

const extractOrder = (res: GetOrderByIdResponse): OrderDetail | null => {
  if (!res?.success) return null;
  if (res.data && "order" in res.data && "items" in res.data) {
    return res.data;
  }
  return null;
};

export type InitiatePaymentPayload = {
  orderId: number;
  payment_method: string;
};

export type CancelOrderPayload = {
  orderId: number;
};

type FilteredOrders = {
  all: OrderListItem[];
  toPay: OrderListItem[];
  completed: OrderListItem[];
  canceled: OrderListItem[];
};

type PaginationInfo = {
  limit: number;
  offset: number;
  total: number;
} | null;

type InfiniteOrdersPage = {
  orders: OrderListItem[];
  pagination: PaginationInfo;
  nextOffset: number | null;
};

const filterOrdersByStatus = (
  orders: OrderListItem[],
  status: OrderStatus | "to-pay" | "completed" | "canceled",
): OrderListItem[] => {
  return orders.filter((order) => {
    const orderStatus = order.order_status.toLowerCase() as OrderStatus;
    const paymentStatus = order.payment_status.toLowerCase() as PaymentStatus;
    const isCanceled = orderStatus === "cancelled" || orderStatus === "trash";
    const isCompleted = orderStatus === "delivered" || orderStatus === "returned";

    switch (status) {
      case "to-pay":
        return paymentStatus === "unpaid" && !isCanceled;
      case "completed":
        return isCompleted;
      case "canceled":
        return isCanceled;
      default:
        return orderStatus === status;
    }
  });
};

type UseOrderOptions = {
  onCreateOrderSuccess?: (res: CreateOrderResponse, payload: CreateOrderPayload) => void;
  onCreateOrderError?: (error: Error, payload: CreateOrderPayload) => void;
  onInitiatePaymentSuccess?: (res: InitiatePaymentResponse, payload: InitiatePaymentPayload) => void;
  onInitiatePaymentError?: (error: Error, payload: InitiatePaymentPayload) => void;
  onCancelOrderSuccess?: (payload: CancelOrderPayload) => void;
  onCancelOrderError?: (error: Error, payload: CancelOrderPayload) => void;
  autoFilterOrders?: boolean;
};

export const useOrder = (params?: GetOrdersParams, options?: UseOrderOptions) => {
  const queryClient = useQueryClient();
  
  const { isAuthenticated } = useAuth();

  const ordersQuery: UseQueryResult<OrdersListData, Error> = useQuery({
    queryKey: orderKeys.list(params),
    enabled: !!isAuthenticated,
    staleTime: 60 * 1000,
    queryFn: async (): Promise<OrdersListData> => {
      const res = await orderService.getOrders(params);
      if (!res?.success) {
        const msg = toErrorMessage(res?.error) ?? toErrorMessage(res?.message) ?? "Failed to load orders";
        console.error(msg);
        throw new Error(msg);
      }
      const orders = extractOrders(res);
      const pagination: Pagination = res.pagination ?? {
        limit: params?.limit ?? 20,
        offset: params?.offset ?? 0,
        total: orders.length,
      };
      return { orders, pagination };
    },
  });

  const allOrders: OrderListItem[] = ordersQuery.data?.orders ?? [];

  const filteredOrders: FilteredOrders = {
    all: allOrders,
    toPay: options?.autoFilterOrders ? filterOrdersByStatus(allOrders, "to-pay") : [],
    completed: options?.autoFilterOrders ? filterOrdersByStatus(allOrders, "completed") : [],
    canceled: options?.autoFilterOrders ? filterOrdersByStatus(allOrders, "canceled") : [],
  };

  const createOrder = useMutation<CreateOrderResponse, Error, CreateOrderPayload>({
    mutationFn: async (payload: CreateOrderPayload): Promise<CreateOrderResponse> => {
      let res: CreateOrderResponse;
      try {
        res = await orderService.createOrder(payload);
      } catch (axiosErr: unknown) {
        const data = (axiosErr as { response?: { data?: CreateOrderResponse } })?.response?.data;
        const errorMsg = toErrorMessage(data?.message) ?? toErrorMessage(data?.error) ?? "Order creation failed. Please try again.";
        console.error(errorMsg);
        throw new Error(errorMsg);
      }

      if (res?.flag === 411 || res?.flag === 404 || res?.flag === 405 || res?.flag === 102) {
        const errorMsg = res?.message || res?.error || "Order creation failed";
        console.error(errorMsg);
        throw new Error(errorMsg);
      }

      if (res?.success) {
        // success: res?.message || "Order created successfully"
      } else {
        const msg = toErrorMessage(res?.error) ?? toErrorMessage(res?.message) ?? "Failed to create order";
        console.error(msg);
        throw new Error(msg);
      }

      return res;
    },
    onSuccess: async (res: CreateOrderResponse, payload: CreateOrderPayload) => {
      await queryClient.invalidateQueries({ queryKey: orderKeys.all });
      await queryClient.invalidateQueries({ queryKey: ["cart"] });
      options?.onCreateOrderSuccess?.(res, payload);
    },
    onError: (err: Error, payload: CreateOrderPayload) => {
      options?.onCreateOrderError?.(err, payload);
    },
  });

  const useOrderById = (id: number): UseQueryResult<OrderDetail, Error> =>
    useQuery({
      queryKey: orderKeys.detail(id),
      enabled: Number.isFinite(id) && id > 0,
      staleTime: 60 * 1000,
      queryFn: async (): Promise<OrderDetail> => {
        const res = await orderService.getOrderById(id);
        const order = extractOrder(res);
        if (!order) throw new Error("Order not found");
        return order;
      },
    });

  const initiatePayment = useMutation<InitiatePaymentResponse, Error, InitiatePaymentPayload>({
    mutationFn: async ({ orderId, payment_method }: InitiatePaymentPayload): Promise<InitiatePaymentResponse> => {
      if (!Number.isFinite(orderId) || orderId <= 0) {
        const errorMsg = "Invalid order id";
        console.error(errorMsg);
        throw new Error(errorMsg);
      }
      const pt = typeof payment_method === "string" ? payment_method.trim() : "";
      if (!pt && payment_method !== "cod") {
        const errorMsg = "Payment method is required";
        console.error(errorMsg);
        throw new Error(errorMsg);
      }
      const res = await orderService.initiatePayment(orderId, pt);
      if (res?.success) {
        // success: res?.message || "Payment initiated successfully"
      }
      return res;
    },
    onSuccess: async (res: InitiatePaymentResponse, payload: InitiatePaymentPayload) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: orderKeys.detail(payload.orderId) }),
        queryClient.invalidateQueries({ queryKey: orderKeys.all }),
      ]);
      options?.onInitiatePaymentSuccess?.(res, payload);
    },
    onError: (err: Error, payload: InitiatePaymentPayload) => {
      options?.onInitiatePaymentError?.(err, payload);
    },
  });

  const cancelOrder = useMutation<{ success: boolean; message?: string; error?: string; flag?: number }, Error, CancelOrderPayload>({
    mutationFn: async ({ orderId }: CancelOrderPayload) => {
      if (!Number.isFinite(orderId) || orderId <= 0) {
        const errorMsg = "Invalid order id";
        console.error(errorMsg);
        throw new Error(errorMsg);
      }
      const res = await orderService.cancelOrder(orderId);
      if (res?.success) {
        // success: res?.message || "Order cancelled successfully"
      } else {
        const msg = toErrorMessage(res?.error) ?? toErrorMessage(res?.message) ?? "Failed to cancel order";
        console.error(msg);
        throw new Error(msg);
      }
      return res;
    },
    onSuccess: async (_res, payload) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: orderKeys.all }),
        queryClient.invalidateQueries({ queryKey: orderKeys.detail(payload.orderId) }),
      ]);
      options?.onCancelOrderSuccess?.(payload);
    },
    onError: (err: Error, payload: CancelOrderPayload) => {
      options?.onCancelOrderError?.(err, payload);
    },
  });

  const pagination: PaginationInfo = ordersQuery.data?.pagination ?? null;

  return {
    orders: allOrders,
    ordersLoading: ordersQuery.isLoading,
    ordersError: ordersQuery.error,
    ordersRefetch: () => ordersQuery.refetch(),
    ordersIsRefetching: ordersQuery.isRefetching,
    filteredOrders,
    pagination,
    useOrderById,
    createOrder,
    initiatePayment,
    cancelOrder,
    isFetchingOrders: ordersQuery.isFetching,
    hasOrders: allOrders.length > 0,
    /** Prefer API pagination total over loaded page length */
    totalOrders: pagination?.total ?? allOrders.length,
    filterOrdersByStatus,
  };
};

export type UseOrderTabsReturn = {
  all: OrderListItem[];
  toPay: OrderListItem[];
  completed: OrderListItem[];
  canceled: OrderListItem[];
  isLoading: boolean;
  isFetching: boolean;
  isFetchingNextPage: boolean;
  hasNextPage: boolean;
  fetchNextPage: () => Promise<unknown>;
  error: Error | null;
  refetch: () => Promise<unknown>;
  /** Loaded rows so far (client filter counts use this set) */
  loadedCount: number;
  /** Server-reported total when pagination is present */
  totalOrders: number;
};

/**
 * Infinite (offset) pagination for account orders tabs.
 * Uses react-query `useInfiniteQuery` against GET /user/orders.
 */
export const useOrderTabs = (params?: GetOrdersParams): UseOrderTabsReturn => {
  const { isAuthenticated } = useAuth();
  const pageSize = 10;

  const infiniteOrdersQuery = useInfiniteQuery({
    queryKey: orderKeys.infiniteList({ ...params, limit: pageSize }),
    enabled: !!isAuthenticated,
    initialPageParam: 0,
    queryFn: async ({ pageParam = 0 }): Promise<InfiniteOrdersPage> => {
      const offset = typeof pageParam === "number" ? pageParam : 0;
      const res = await orderService.getOrders({
        ...params,
        limit: pageSize,
        offset,
      });
      if (!res?.success) {
        const msg =
          toErrorMessage(res?.error) ??
          toErrorMessage(res?.message) ??
          "Failed to load orders";
        console.error(msg);
        throw new Error(msg);
      }
      const orders = extractOrders(res);
      const pagination = res.pagination ?? null;

      let nextOffset: number | null = null;
      if (pagination) {
        const next = pagination.offset + pagination.limit;
        nextOffset = next < pagination.total ? next : null;
      } else if (orders.length >= pageSize) {
        // Fallback when API omits pagination metadata
        nextOffset = offset + orders.length;
      }

      return { orders, pagination, nextOffset };
    },
    getNextPageParam: (lastPage: InfiniteOrdersPage) => lastPage.nextOffset,
    staleTime: 60 * 1000,
  });

  const allOrders =
    infiniteOrdersQuery.data?.pages.flatMap((p) => p.orders) ?? [];
  const lastPagination =
    infiniteOrdersQuery.data?.pages
      .map((p) => p.pagination)
      .filter(Boolean)
      .at(-1) ?? null;

  return {
    all: allOrders,
    toPay: filterOrdersByStatus(allOrders, "to-pay"),
    completed: filterOrdersByStatus(allOrders, "completed"),
    canceled: filterOrdersByStatus(allOrders, "canceled"),
    isLoading: infiniteOrdersQuery.isLoading,
    isFetching: infiniteOrdersQuery.isFetching,
    isFetchingNextPage: infiniteOrdersQuery.isFetchingNextPage,
    hasNextPage: Boolean(infiniteOrdersQuery.hasNextPage),
    fetchNextPage: () => infiniteOrdersQuery.fetchNextPage(),
    error: infiniteOrdersQuery.error ?? null,
    refetch: () => infiniteOrdersQuery.refetch(),
    loadedCount: allOrders.length,
    totalOrders: lastPagination?.total ?? allOrders.length,
  };
};
