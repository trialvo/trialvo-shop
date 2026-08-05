"use client";

import React from "react";
import { RecentOrder } from "../../types";
import RecentOrdersTableDesktop from "./RecentOrdersTableDesktop";
import RecentOrdersTableMobile from "./RecentOrdersTableMobile";

type Props = {
  orders: RecentOrder[];
  onView?: (id: string) => void;
  isLoading?: boolean;
  isFetchingMore?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
};

const RecentOrdersTable: React.FC<Props> = ({
  orders,
  onView,
  isLoading = false,
  isFetchingMore = false,
  hasMore = false,
  onLoadMore,
}) => {
  return (
    <div className="bg-white p-4 shadow-[0px_0px_10px_rgba(0,0,0,0.12)]">
      <div className="mb-3">
        <h3 className="text-lg font-bold text-black">Recent Orders</h3>
      </div>

      <div className="sm:hidden">
        <RecentOrdersTableMobile 
          orders={orders} 
          onView={onView} 
          isLoading={isLoading}
          isFetchingMore={isFetchingMore}
          hasMore={hasMore}
          onLoadMore={onLoadMore}
        />
      </div>

      <div className="hidden sm:block">
        <RecentOrdersTableDesktop 
          orders={orders} 
          onView={onView} 
          isLoading={isLoading}
          isFetchingMore={isFetchingMore}
          hasMore={hasMore}
          onLoadMore={onLoadMore}
        />
      </div>
    </div>
  );
};

export default RecentOrdersTable;
