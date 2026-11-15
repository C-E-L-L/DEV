import { createContext, useContext } from 'react';
const ConsoleContext = createContext('/expert');
export function ConsoleProvider({ basePath, children }) {
  return <ConsoleContext.Provider value={basePath}>{children}</ConsoleContext.Provider>;
}
export const useConsoleBase = () => useContext(ConsoleContext);
