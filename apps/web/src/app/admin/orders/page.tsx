"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingBag,
  ChevronDown,
  ChevronUp,
  Loader2,
  Package,
  Truck,
} from "lucide-react";
import api from "@/lib/api";

interface OrderItem {
  id: string;
  photoUrl: string;
  product: string;
  size: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  orderNumber: string;
  clientName: string;
  itemsCount: number;
  total: number;
  status: string;
  createdAt: string;
  trackingNumber?: string;
  items?: OrderItem[];
}

const statusStyles: Record<string, string> = {
  pending: "border-amber-500/30 bg-amber-500/10 text-amber-400",
  confirmed: "border-blue-500/30 bg-blue-500/10 text-blue-400",
  processing: "border-purple-500/30 bg-purple-500/10 text-purple-400",
  shipped: "border-cyan-500/30 bg-cyan-500/10 text-cyan-400",
  delivered: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
  cancelled: "border-red-500/30 bg-red-500/10 text-red-400",
};

const STATUS_OPTIONS = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
];

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [trackingInputs, setTrackingInputs] = useState<Record<string, string>>(
    {}
  );

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const { data } = await api.get("/admin/orders");
      setOrders(data.data || data || []);
    } catch {
      // silently handle
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = async (orderId: string) => {
    if (expandedOrder === orderId) {
      setExpandedOrder(null);
      return;
    }

    // Fetch order items if not loaded
    const order = orders.find((o) => o.id === orderId);
    if (order && !order.items) {
      try {
        const { data } = await api.get(`/admin/orders/${orderId}`);
        const orderData = data.data || data;
        setOrders((prev) =>
          prev.map((o) =>
            o.id === orderId ? { ...o, items: orderData.items || [] } : o
          )
        );
      } catch {
        // silently handle
      }
    }

    setExpandedOrder(orderId);
  };

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    setUpdatingStatus(orderId);
    try {
      await api.patch(`/admin/orders/${orderId}`, { status: newStatus });
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      );
    } catch {
      // silently handle
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handleTrackingSubmit = async (orderId: string) => {
    const trackingNumber = trackingInputs[orderId];
    if (!trackingNumber) return;

    try {
      await api.patch(`/admin/orders/${orderId}`, { trackingNumber });
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, trackingNumber } : o))
      );
      setTrackingInputs((prev) => ({ ...prev, [orderId]: "" }));
    } catch {
      // silently handle
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gold" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-cream">
            Print Orders
          </h1>
          <p className="mt-1 text-sm text-cream-muted">
            Manage print and product orders
          </p>
        </div>
        <span className="rounded-full border border-border bg-dark px-4 py-1.5 text-xs text-cream-muted">
          {orders.length} order{orders.length !== 1 ? "s" : ""}
        </span>
      </div>

      {orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-surface/80 py-24 backdrop-blur-sm">
          <ShoppingBag className="mb-4 h-12 w-12 text-cream-muted/30" />
          <p className="text-sm text-cream-muted">No orders yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order, i) => (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="overflow-hidden rounded-2xl border border-border bg-surface/80 backdrop-blur-sm"
            >
              {/* Order Row */}
              <button
                onClick={() => toggleExpand(order.id)}
                className="flex w-full items-center gap-4 px-6 py-5 text-left transition-colors hover:bg-surface-light"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-gold/20 bg-gold/10">
                  <Package className="h-5 w-5 text-gold" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm font-semibold text-cream">
                      #{order.orderNumber}
                    </span>
                    <span
                      className={`rounded-full border px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider ${
                        statusStyles[order.status] || statusStyles.pending
                      }`}
                    >
                      {order.status}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-cream-muted">
                    {order.clientName} &middot; {order.itemsCount} item
                    {order.itemsCount !== 1 ? "s" : ""}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-cream">
                    &#8377;{order.total?.toLocaleString("en-IN")}
                  </p>
                  <p className="text-[10px] text-cream-muted">
                    {new Date(order.createdAt).toLocaleDateString("en-IN")}
                  </p>
                </div>
                {expandedOrder === order.id ? (
                  <ChevronUp className="h-4 w-4 text-cream-muted" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-cream-muted" />
                )}
              </button>

              {/* Expanded Detail */}
              <AnimatePresence>
                {expandedOrder === order.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden border-t border-border"
                  >
                    <div className="p-6">
                      {/* Order Items */}
                      <div className="mb-6 space-y-3">
                        {order.items?.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center gap-4 rounded-xl border border-border bg-dark/50 p-4"
                          >
                            <div className="h-16 w-16 overflow-hidden rounded-lg border border-border bg-dark">
                              <img
                                src={item.photoUrl}
                                alt={item.product}
                                className="h-full w-full object-cover"
                              />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-cream">
                                {item.product}
                              </p>
                              <p className="text-xs text-cream-muted">
                                Size: {item.size} &middot; Qty: {item.quantity}
                              </p>
                            </div>
                            <p className="text-sm font-semibold text-cream">
                              &#8377;{item.price?.toLocaleString("en-IN")}
                            </p>
                          </div>
                        ))}
                        {!order.items && (
                          <div className="flex items-center justify-center py-6">
                            <Loader2 className="h-5 w-5 animate-spin text-gold" />
                          </div>
                        )}
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        {/* Status Update */}
                        <div>
                          <label className="mb-1.5 block text-[10px] font-medium uppercase tracking-wider text-cream-muted">
                            Update Status
                          </label>
                          <select
                            value={order.status}
                            onChange={(e) =>
                              handleStatusUpdate(order.id, e.target.value)
                            }
                            disabled={updatingStatus === order.id}
                            className="w-full appearance-none rounded-xl border border-border bg-dark px-4 py-2.5 text-sm text-cream outline-none transition-all focus:border-gold/50 focus:ring-2 focus:ring-gold/20 disabled:opacity-50"
                          >
                            {STATUS_OPTIONS.map((status) => (
                              <option key={status} value={status}>
                                {status.charAt(0).toUpperCase() +
                                  status.slice(1)}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Tracking Number */}
                        <div>
                          <label className="mb-1.5 block text-[10px] font-medium uppercase tracking-wider text-cream-muted">
                            Tracking Number
                          </label>
                          <div className="flex gap-2">
                            <div className="flex flex-1 items-center rounded-xl border border-border bg-dark px-4 py-2.5">
                              <Truck className="mr-2 h-4 w-4 text-cream-muted/50" />
                              <input
                                type="text"
                                value={
                                  trackingInputs[order.id] ??
                                  order.trackingNumber ??
                                  ""
                                }
                                onChange={(e) =>
                                  setTrackingInputs((prev) => ({
                                    ...prev,
                                    [order.id]: e.target.value,
                                  }))
                                }
                                placeholder="Enter tracking #"
                                className="w-full bg-transparent text-sm text-cream placeholder-cream-muted/50 outline-none"
                              />
                            </div>
                            <button
                              onClick={() => handleTrackingSubmit(order.id)}
                              className="rounded-xl border border-gold/30 bg-gold/10 px-4 text-sm font-medium text-gold transition-all hover:bg-gold/20"
                            >
                              Save
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
