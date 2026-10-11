import WorkspaceHub from '../../components/WorkspaceHub'
import { getWorkspaceHubProps } from '../../../../lib/admin/adminRoutes'

export default function ContentCenter() {
  return <WorkspaceHub {...getWorkspaceHubProps('/admin/content')} />
}
