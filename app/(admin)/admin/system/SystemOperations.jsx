import WorkspaceHub from '../../components/WorkspaceHub'
import { getWorkspaceHubProps } from '../../../../lib/admin/adminRoutes'

export default function SystemOperations() {
  return <WorkspaceHub {...getWorkspaceHubProps('/admin/projects')} />
}
