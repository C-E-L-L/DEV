import { createContext, useContext } from 'react';
import Icon from '../login/icons';

/**
 * Full-height work screens (labeling and results of one coursework) replace the console's top bar
 * with their own header. The console shell hands them its sidebar toggle and the account controls.
 */
const WorkspaceChromeContext = createContext({ toggleSidebar: null, sidebarShown: true, sidebarId: undefined, account: null });

export const WorkspaceChromeProvider = WorkspaceChromeContext.Provider;
export const useWorkspaceChrome = () => useContext(WorkspaceChromeContext);

/** `/expert/assignments/12/edit` and `/admin/assignments/12/results` render without the console top bar. */
export const isWorkspacePath = pathname => /^\/(expert|admin)\/assignments\/\d+\/(edit|results)\/?$/.test(pathname);

export function WorkspaceSidebarToggle() {
  const { toggleSidebar, sidebarShown, sidebarId } = useWorkspaceChrome();
  if (!toggleSidebar) return null;
  const label = sidebarShown ? '사이드바 접기' : '사이드바 펼치기';
  return (
    <button type="button" className="prof-icon-btn" onClick={toggleSidebar} aria-controls={sidebarId} aria-expanded={sidebarShown} aria-label={label} title={label}>
      <Icon name="panelLeft" size={18} />
    </button>
  );
}
