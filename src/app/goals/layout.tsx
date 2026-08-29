export default function GoalsLayout({ children }: { children: React.ReactNode }) {
  // Goals is a fixed-height two-pane app, so it cancels the root layout's
  // padding. The bottom value must track the root's exactly — the phone bar is
  // 74px plus the home indicator, not a round 80.
  return (
    <div className="h-dvh -mx-5 -mt-4 -mb-[calc(74px+env(safe-area-inset-bottom))] md:-mx-8 md:-my-8">
      {children}
    </div>
  );
}
