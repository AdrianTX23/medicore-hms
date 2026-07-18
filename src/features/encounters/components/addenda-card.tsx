"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { PencilLine } from "@phosphor-icons/react";
import { toast } from "sonner";
import { addAddendum } from "@/features/encounters/actions/encounter.actions";
import type { EncounterDetail } from "@/features/encounters/queries/encounter.queries";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Textarea } from "@/shared/components/ui/textarea";
import { formatDateTime } from "@/shared/utils/format";

type AddendaCardProps = {
  encounterId: string;
  addenda: EncounterDetail["addenda"];
  canAdd: boolean;
};

function authorName(a: EncounterDetail["addenda"][number]) {
  const profile = a.author.staffProfile;
  return profile ? `${profile.firstName} ${profile.lastName}` : a.author.email;
}

export function AddendaCard({ encounterId, addenda, canAdd }: AddendaCardProps) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [isPending, startTransition] = useTransition();

  function submit() {
    startTransition(async () => {
      const result = await addAddendum({ encounterId, note });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Addendum registrado");
      setNote("");
      router.refresh();
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <PencilLine className="size-4" /> Addendums
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {addenda.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin addendums</p>
        ) : (
          <ul className="space-y-3">
            {addenda.map((a) => (
              <li key={a.id} className="rounded-md border-l-2 border-primary/40 bg-muted/40 p-3 text-sm">
                <p className="whitespace-pre-wrap">{a.note}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatDateTime(a.createdAt)} · {authorName(a)}
                </p>
              </li>
            ))}
          </ul>
        )}
        {canAdd ? (
          <div className="space-y-2">
            <Textarea
              rows={3}
              placeholder="Corrección o información adicional a la consulta cerrada..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
            <Button onClick={submit} disabled={isPending || note.trim().length < 3} size="sm">
              {isPending ? "Registrando..." : "Añadir addendum"}
            </Button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
