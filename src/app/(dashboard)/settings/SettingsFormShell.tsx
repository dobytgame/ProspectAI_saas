"use client";

import { useActionState, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  saveBusinessSettings,
  saveProfileSettings,
  type SettingsSaveState,
} from "./actions";

function SaveFeedback({
  isPending,
  state,
}: {
  isPending: boolean;
  state: SettingsSaveState;
}) {
  if (isPending) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="flex items-center gap-3 rounded-xl border border-primary/35 bg-primary/10 px-4 py-3 text-sm font-bold text-primary"
      >
        <Loader2 className="h-5 w-5 shrink-0 animate-spin" />
        <span>Salvando alterações…</span>
      </div>
    );
  }

  if (state?.ok === false) {
    return (
      <div
        role="alert"
        className="flex items-start gap-3 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-200"
      >
        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />
        <span>{state.message}</span>
      </div>
    );
  }

  if (state?.ok === true && !isPending) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="flex animate-in fade-in slide-in-from-top-1 duration-300 items-center gap-3 rounded-xl border border-emerald-500/35 bg-emerald-500/10 px-4 py-3 text-sm font-bold text-emerald-200"
      >
        <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />
        <span>Salvo com sucesso.</span>
      </div>
    );
  }

  return null;
}

export function BusinessSettingsForm({ children }: { children: ReactNode }) {
  const [state, formAction, isPending] = useActionState(saveBusinessSettings, null);

  return (
    <form action={formAction} className="contents">
      <div className="px-4 pb-2">
        <SaveFeedback isPending={isPending} state={state} />
      </div>
      {children}
    </form>
  );
}

export function ProfileSettingsForm({ children }: { children: ReactNode }) {
  const [state, formAction, isPending] = useActionState(saveProfileSettings, null);

  return (
    <form action={formAction} className="contents">
      <div className="px-4 pb-2">
        <SaveFeedback isPending={isPending} state={state} />
      </div>
      {children}
    </form>
  );
}

type SubmitProps = React.ComponentProps<typeof Button> & {
  pendingLabel?: string;
};

export function SettingsSubmitButton({
  children,
  pendingLabel = "Salvando…",
  disabled,
  ...props
}: SubmitProps) {
  const { pending } = useFormStatus();
  return (
    <Button {...props} disabled={disabled || pending}>
      {pending ? (
        <>
          <Loader2 className="h-5 w-5 shrink-0 animate-spin" />
          {pendingLabel}
        </>
      ) : (
        children
      )}
    </Button>
  );
}
