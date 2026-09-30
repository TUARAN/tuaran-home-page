import WorkspaceHub from '../../components/WorkspaceHub'
import { getWorkspaceHubProps } from '../../../../lib/adminRoutes'

export default function ProjectWorkspace() {
  return <WorkspaceHub {...getWorkspaceHubProps('/admin/projects')} />
}
