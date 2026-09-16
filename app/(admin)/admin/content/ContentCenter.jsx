import WorkspaceHub from '../../components/WorkspaceHub'
import { getWorkspaceHubProps } from '../../../../lib/adminRoutes'

export default function ContentCenter() {
  return <WorkspaceHub {...getWorkspaceHubProps('/admin/content')} />
}
