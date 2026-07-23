import axiosClient from "./axiosClient";

// Oturum açmış herhangi bir rol erişebilir; backend kendi içinde role göre
// sınırlar (ADMIN: tümü, TEKNIK_PERSONEL: kendisine atananlar, PERSONEL:
// kendi talepleri). Dashboard'daki "Aylık Talep Dağılımı" ve "Taleplerin
// Kategoriye Göre Dağılımı" grafikleri için kullanılır.
export const getDashboardChartsReport = () =>
  axiosClient.get("/reports/dashboard").then((res) => res.data);

// Backend authorize("BILGI_ISLEM", "ADMIN") kullanıyor; şemada BILGI_ISLEM rolü
// tanımlı olmadığından bu iki endpoint de pratikte yalnızca ADMIN için çalışır.
export const getTicketSummaryReport = () =>
  axiosClient.get("/reports/tickets").then((res) => res.data);

export const getCategoryReport = () =>
  axiosClient.get("/reports/categories").then((res) => res.data);

// ADMIN rolü gerekir.
export const getDepartmentReport = () =>
  axiosClient.get("/reports/departments").then((res) => res.data);

// ADMIN rolü gerekir. Dashboard'daki "En Yoğun Müdürlükler" kartı için;
// talep sayısına göre azalan sıralı ilk 5 müdürlüğü döner.
export const getTopDepartmentsReport = () =>
  axiosClient.get("/reports/departments/top").then((res) => res.data);

export const getPersonnelPerformanceReport = () =>
  axiosClient.get("/reports/personnel-performance").then((res) => res.data);
