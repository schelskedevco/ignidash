interface SectionControlsProps {
  leftAddOn: React.ReactNode;
  rightAddOn: React.ReactNode;
}

export default function SectionControls({ leftAddOn, rightAddOn }: SectionControlsProps) {
  return (
    <div className="mt-4 flex items-center justify-between">
      {leftAddOn}
      {rightAddOn}
    </div>
  );
}
