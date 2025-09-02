import { Order } from "@/lib/utils";
import { create } from "zustand";

interface OrdersState {
  orders: Order[];
  setOrders: (orders: Order[]) => void;
  addOrder: (order: Order) => void;
  removeOrder: (order: string) => void;
  updateOrder: (order: Order) => void;
}

export const useOrdersStore = create<OrdersState>((set) => ({
  orders: [],
  setOrders: (orders) => set({ orders }),
  addOrder: (order) => set((state) => ({ orders: [...state.orders, order] })),
  removeOrder: (order) =>
    set((state) => ({
      orders: state.orders.filter(
        (item) => item.address.toString() !== order.toString(),
      ),
    })),
  updateOrder: (order) =>
    set((state) => ({
      orders: state.orders.map((item) =>
        item.address.toString() === order.address.toString() ? order : item,
      ),
    })),
}));

// TODO: store this state locally so that it persists on refresh
// decreases rpc calls
