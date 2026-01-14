import SectionContainer from '@/components/ui/section-container';

export default function FooterDisclaimer() {
  return (
    <SectionContainer showBottomBorder={false} className="mb-0 py-4">
      <div className="border-border/25 bg-emphasized-background/50 mx-auto flex max-w-lg flex-col rounded-md border p-2">
        <p className="text-muted-foreground text-center text-xs/6">For educational purposes only.</p>
        <p className="text-muted-foreground text-center text-xs/6">Past performance not indicative of future results.</p>
      </div>
    </SectionContainer>
  );
}
