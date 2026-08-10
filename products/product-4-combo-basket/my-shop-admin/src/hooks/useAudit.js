import { useQuery } from '@tanstack/react-query';
import * as auditApi from '../api/audit.api';

export const useAuditLogs = (params) =>
 useQuery({
  queryKey: ['audit', params],
  queryFn: () => auditApi.getAuditLogs(params),
  keepPreviousData: true,
 });

export const useEntityHistory = (entityType, entityId) =>
 useQuery({
  queryKey: ['audit', entityType, entityId],
  queryFn: () => auditApi.getEntityHistory(entityType, entityId),
  enabled: !!entityType && !!entityId,
 });
