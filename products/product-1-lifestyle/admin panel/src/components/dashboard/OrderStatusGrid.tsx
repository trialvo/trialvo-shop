import OrderStatusCard from "./OrderStatusCard";
import { dashboardStatusData } from "../../pages/Dashboard/dashboardStatusData";

const OrderStatusGrid = () => {
  return (
    <div className="grid h-full grid-cols-2 gap-4 content-stretch w-full">
      {dashboardStatusData.map((item) => (
        <OrderStatusCard key={item.id} item={item} />
      ))}
    </div>
  );
};

export default OrderStatusGrid;
