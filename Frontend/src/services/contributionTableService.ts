import api from "./api";

export const getSssTable = () => api.get("/contribution-tables/sss").then((r) => r.data.data);
export const getPhilHealthTable = () => api.get("/contribution-tables/philhealth").then((r) => r.data.data);
export const getPagIbigTable = () => api.get("/contribution-tables/pagibig").then((r) => r.data.data);
export const getWithholdingTaxTable = () => api.get("/contribution-tables/withholding-tax").then((r) => r.data.data);
