import WorkspaceHub from '../../components/WorkspaceHub'
import { getWorkspaceHubProps } from '../../../../lib/adminRoutes'

export default function SystemOperations() {
  return <WorkspaceHub {...getWorkspaceHubProps('/admin/projects')} />
}
