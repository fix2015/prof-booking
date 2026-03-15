import apiClient from "./client";
import { ProviderReport, ProfessionalReport } from "@/types";

const getProviderReport = (providerId: number, dateFrom: string, dateTo: string) =>
  apiClient
    .get<ProviderReport>(`/reports/provider/${providerId}`, {
      params: { date_from: dateFrom, date_to: dateTo },
    })
    .then((r) => r.data);

const getMyProfessionalReport = (dateFrom: string, dateTo: string) =>
  apiClient
    .get<ProfessionalReport>("/reports/professional/me", {
      params: { date_from: dateFrom, date_to: dateTo },
    })
    .then((r) => r.data);

const getProfessionalReport = (professionalId: number, dateFrom: string, dateTo: string) =>
  apiClient
    .get<ProfessionalReport>(`/reports/professional/${professionalId}`, {
      params: { date_from: dateFrom, date_to: dateTo },
    })
    .then((r) => r.data);

export const reportsApi = {
  getProviderReport,
  getMyProfessionalReport,
  getProfessionalReport,

  // Backward-compat aliases
  getSalonReport: getProviderReport,
  getMyMasterReport: getMyProfessionalReport,
  getMasterReport: getProfessionalReport,
};
