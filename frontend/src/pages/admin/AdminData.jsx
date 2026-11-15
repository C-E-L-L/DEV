import { createContext, useContext } from 'react';
import { useLocation } from 'react-router-dom';
import { adminApi } from '../../api';
import { useRemote } from '../../components/console/ConsoleUI';
const Context = createContext(null);
export function AdminDataProvider({ children }) {
  const { pathname } = useLocation();
  const dashboard = useRemote(adminApi.dashboard, [pathname]);
  const users = useRemote(adminApi.getUsers, [pathname]);
  return <Context.Provider value={{ dashboard, users, refresh: () => { dashboard.reload(); users.reload(); } }}>{children}</Context.Provider>;
}
export const useAdminData = () => useContext(Context);
