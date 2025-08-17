import { PanelLeft } from 'lucide-react';

import IconButton from '@/components/ui/icon-button';

export default function SidebarToggle() {
  return <IconButton icon={PanelLeft} label="Toggle sidebar" onClick={() => {}} surfaceColor="emphasized" />;
}
