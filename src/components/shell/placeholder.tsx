export function Placeholder({ step, children }: { step: string; children: string }) {
  return (
    <div className="flex min-h-0 flex-1 items-center justify-center px-6">
      <div className="max-w-sm text-center">
        <p className="text-heading font-medium text-grey-900">{children}</p>
        <p className="mt-1 text-small text-grey-500">Arrives in {step}.</p>
      </div>
    </div>
  );
}
