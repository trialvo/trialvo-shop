export type OrderFailedData = {
    id: number;
    title?: string;
    message?: string;
    supportEmail?: string;
    continueShoppingHref: string;
    confirmationEmail: string;
    deliveryAddress: {
        name: string;
        address: string;
        mobile: string;
        email: string;
    };
    meta: {
        date: string;
        orderId: string;
        paymentMethod: string;
    };
    items: Array<{
        id: string;
        title: string;
        image: string;
        quantity: number;
        price: number;
        originalPrice?: number;
        oldPrice?: number;
    }>;
    totals: {
        subtotal: number;
        delivery: number;
        discount: number;
        total: number;
    };
    trackOrderHref: string;
};