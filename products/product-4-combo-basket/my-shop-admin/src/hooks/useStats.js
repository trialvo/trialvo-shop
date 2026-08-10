import { useQuery } from '@tanstack/react-query';
import * as statsApi from '../api/stats.api';

export const useStats = () =>
 useQuery({ queryKey: ['stats'], queryFn: statsApi.getStats, staleTime: 60_000 });

export const useOrdersChart = () =>
 useQuery({ queryKey: ['stats', 'chart'], queryFn: statsApi.getOrdersChart, staleTime: 60_000 });

export const useTopProducts = () =>
 useQuery({ queryKey: ['stats', 'top-products'], queryFn: statsApi.getTopProducts, staleTime: 60_000 });
