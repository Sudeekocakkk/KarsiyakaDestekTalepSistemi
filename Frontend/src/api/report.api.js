import axiosClient from "./axiosClient";

// Backend authorize("BILGI_ISLEM", "ADMIN") kullanıyor; şemada BILGI_ISLEM rolü
// tanımlı olmadığından bu iki endpoint de pratikte yalnızca ADMIN için çalışır.
export const getTicketSummaryReport = () =>
  axiosClient.get("/reports/tickets").then((res) => res.data);

export const getCategoryReport = () =>
  axiosClient.get("/reports/categories").then((res) => res.data);

// ADMIN rolü gerekir.
export const getDepartmentReport = () =>
  axiosClient.get("/reports/departments").then((res) => res.data);

export const getPersonnelPerformanceReport = () =>
  axiosClient.get("/reports/personnel-performance").then((res) => res.data);
