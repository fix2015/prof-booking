import apiClient from "./client";
import { SalonReport, MasterReport } from "@/types";

export const reportsApi = {
  getSalonReport: (salonId: number, dateFrom: string, dateTo: string) =>
    apiClient
      .get<SalonReport>(`/reports/salon/${salonId}`, {
        params: { date_from: dateFrom, date_to: dateTo },
      })
      .then((r) => r.data),

  getMyMasterReport: (dateFrom: string, dateTo: string) =>
    apiClient
      .get<MasterReport>("/reports/master/me", {
        params: { date_from: dateFrom, date_to: dateTo },
      })
      .then((r) => r.data),

  getMasterReport: (masterId: number, dateFrom: string, dateTo: string) =>
    apiClient
      .get<MasterReport>(`/reports/master/${masterId}`, {
        params: { date_from: dateFrom, date_to: dateTo },
      })
      .then((r) => r.data),
};
