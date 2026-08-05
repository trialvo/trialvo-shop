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
    type PaymentStatus,
} from "@/lib/api/order/service";
import { useAppDispatch } from "@/redux/hooks";
import { setError, setSuccess } from "@/redux/slices/uiSlice";
import { useInfiniteQuery, useMutation, useQuery, useQueryClient, UseQueryResult } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useAuth } from "./useAuth";
import { useCookieIds } from "./useCookieIds";

function toErrorMessage(input: unknown): string | undefined {
  if (typeof input === "string") {
    const s = input.trim();
    return s.length > 0 ? s : undefined;
  }

  if (input && typeof input === "object") {
    const obj = input as { message?: unknown; error?: unknown };

    if (typeof obj.message === "string" && obj.message.trim().length > 0) {
      return obj.message.trim();
    }

    if (typeof obj.error === "string" && obj.error.trim().length > 0) {
      return obj.error.trim();
    }
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

type UseOrderOptions = {
  onCreateOrderSuccess?: (res: CreateOrderResponse, payload: CreateOrderPayload) => void;
  onCreateOrderError?: (error: Error, payload: CreateOrderPayload) => void;

  onInitiatePaymentSuccess?: (res: InitiatePaymentResponse, payload: InitiatePaymentPayload) => void;
  onInitiatePaymentError?: (error: Error, payload: InitiatePaymentPayload) => void;

  onCancelOrderSuccess?: (payload: CancelOrderPayload) => void;
  onCancelOrderError?: (error: Error, payload: CancelOrderPayload) => void;

  autoFilterOrders?: boolean;
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

export const useOrder = (params?: GetOrdersParams, options?: UseOrderOptions) => {
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  // Auto-read FB cookie IDs — attached to every order for CAPI deduplication
  const cookieIds = useCookieIds();

  const ordersQuery: UseQueryResult<OrderListItem[], Error> = useQuery({
    queryKey: orderKeys.list(params),
    enabled: !!isAuthenticated,
    staleTime: 60 * 1000,
    queryFn: async (): Promise<OrderListItem[]> => {
      const res = await orderService.getOrders(params);

      if (!res?.success) {
        const msg =
          toErrorMessage(res?.error) ??
          toErrorMessage(res?.message) ??
          "Failed to load orders";
        dispatch(setError(msg));
        throw new Error(msg);
      }

      return extractOrders(res);
    },
  });

  const filterOrders = filterOrdersByStatus;

  const allOrders: OrderListItem[] = ordersQuery.data ?? [];

  const filteredOrders: FilteredOrders = {
    all: allOrders,
    toPay: options?.autoFilterOrders ? filterOrders(allOrders, "to-pay") : [],
    completed: options?.autoFilterOrders ? filterOrders(allOrders, "completed") : [],
    canceled: options?.autoFilterOrders ? filterOrders(allOrders, "canceled") : [],
  };

  const createOrder = useMutation<CreateOrderResponse, Error, CreateOrderPayload>({
    mutationFn: async (payload: CreateOrderPayload): Promise<CreateOrderResponse> => {
      // Automatically attach FB cookie IDs for CAPI deduplication.
      // The caller can still override these by passing them explicitly.
      const enrichedPayload: CreateOrderPayload = {
        ...payload,
        fbp: payload.fbp ?? cookieIds.fbp,
        fbc: payload.fbc ?? cookieIds.fbc,
        // capi_event_id must be provided by the checkout component
        // via generateEventId() so it can also be passed to trackPurchase().
      };

      let res: CreateOrderResponse;
      try {
        res = await orderService.createOrder(enrichedPayload);
      } catch (axiosErr: unknown) {
        // Axios throws on 4xx/5xx — extract the backend error body
        const data = (axiosErr as { response?: { data?: CreateOrderResponse } })?.response?.data;
        const errorMsg =
          toErrorMessage(data?.message) ??
          toErrorMessage(data?.error) ??
          "Order creation failed. Please try again.";
        dispatch(setError(errorMsg));
        throw new Error(errorMsg);
      }

      if (res?.flag === 411 || res?.flag === 404 || res?.flag === 405 || res?.flag === 102) {
        const errorMsg = res?.message || res?.error || "Order creation failed";
        dispatch(setError(errorMsg));
        throw new Error(errorMsg);
      }

      if (res?.success) {
        dispatch(setSuccess(res?.message || "Order created successfully"));
      } else {
        const msg =
          toErrorMessage(res?.error) ??
          toErrorMessage(res?.message) ??
          "Failed to create order";
        dispatch(setError(msg));
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
        if (!order) {
          throw new Error("Order not found");
        }

        return order;
      },
    });

  const initiatePayment = useMutation<InitiatePaymentResponse, Error, InitiatePaymentPayload>({
    mutationFn: async ({
      orderId,
      payment_method,
    }: InitiatePaymentPayload): Promise<InitiatePaymentResponse> => {
      if (!Number.isFinite(orderId) || orderId <= 0) {
        const errorMsg = "Invalid order id";
        dispatch(setError(errorMsg));
        throw new Error(errorMsg);
      }

      const pt = typeof payment_method === "string" ? payment_method.trim() : "";
      if (!pt && payment_method !== "cod") {
        const errorMsg = "Payment method is required";
        dispatch(setError(errorMsg));
        throw new Error(errorMsg);
      }

      const res = await orderService.initiatePayment(orderId, pt);

      if (res?.success) {
        dispatch(setSuccess(res?.message || "Payment initiated successfully"));
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
        dispatch(setError(errorMsg));
        throw new Error(errorMsg);
      }

      const res = await orderService.cancelOrder(orderId);

      if (res?.success) {
        dispatch(setSuccess(res?.message || "Order cancelled successfully"));
      } else {
        const msg =
          toErrorMessage(res?.error) ??
          toErrorMessage(res?.message) ??
          "Failed to cancel order";
        dispatch(setError(msg));
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

  const refetchOrders = () => {
    return ordersQuery.refetch();
  };

  const pagination: PaginationInfo = ordersQuery.data
    ? {
      limit: params?.limit || 20,
      offset: params?.offset || 0,
      total: allOrders.length,
    }
    : null;

  return {
    orders: allOrders,
    ordersLoading: ordersQuery.isLoading,
    ordersError: ordersQuery.error,
    ordersRefetch: refetchOrders,
    ordersIsRefetching: ordersQuery.isRefetching,

    filteredOrders,

    pagination,

    useOrderById,

    createOrder,
    initiatePayment,
    cancelOrder,

    isFetchingOrders: ordersQuery.isFetching,
    hasOrders: allOrders.length > 0,
    totalOrders: allOrders.length,

    filterOrdersByStatus: filterOrders,
  };
};

type UseOrderTabsReturn = {
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
  totalOrders: number;
};

export const useOrderTabs = (params?: GetOrdersParams): UseOrderTabsReturn => {
  const { isAuthenticated } = useAuth();
  const pageSize = 10;
  const dispatch = useAppDispatch();

  const infiniteOrdersQuery = useInfiniteQuery({
    queryKey: orderKeys.infiniteList({ ...params, limit: pageSize }),
    enabled: !!isAuthenticated,
    initialPageParam: 0,
    queryFn: async ({ pageParam = 0 }): Promise<InfiniteOrdersPage> => {
      const res = await orderService.getOrders({
        ...params,
        limit: pageSize,
        offset: pageParam,
      });

      if (!res?.success) {
        const msg =
          toErrorMessage(res?.error) ??
          toErrorMessage(res?.message) ??
          "Failed to load orders";
        dispatch(setError(msg));
        throw new Error(msg);
      }

      const orders = extractOrders(res);
      const pagination = res.pagination ?? null;
      const nextOffset =
        pagination && pagination.offset + pagination.limit < pagination.total
          ? pagination.offset + pagination.limit
          : null;

      return { orders, pagination, nextOffset };
    },
    getNextPageParam: (lastPage: InfiniteOrdersPage) => lastPage.nextOffset,
    staleTime: 60 * 1000,
  });

  const allOrders = infiniteOrdersQuery.data?.pages.flatMap((p) => p.orders) ?? [];
  const filteredOrders: FilteredOrders = {
    all: allOrders,
    toPay: filterOrdersByStatus(allOrders, "to-pay"),
    completed: filterOrdersByStatus(allOrders, "completed"),
    canceled: filterOrdersByStatus(allOrders, "canceled"),
  };

  return {
    all: allOrders,
    toPay: filteredOrders.toPay,
    completed: filteredOrders.completed,
    canceled: filteredOrders.canceled,
    isLoading: infiniteOrdersQuery.isLoading,
    isFetching: infiniteOrdersQuery.isFetching,
    isFetchingNextPage: infiniteOrdersQuery.isFetchingNextPage,
    hasNextPage: !!infiniteOrdersQuery.hasNextPage,
    fetchNextPage: () => infiniteOrdersQuery.fetchNextPage(),
    error: infiniteOrdersQuery.error ?? null,
    refetch: () => infiniteOrdersQuery.refetch(),
    totalOrders: allOrders.length,
  };
};
