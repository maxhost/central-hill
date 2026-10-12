"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { UiIcon } from "@core/ui";
import { AdminButton, useToast } from "@slices/backoffice/contract";
import { moveApartment } from "../actions";
import type { MoveDirection } from "../derive";

/**
 * ↑ / ↓ buttons of one row in the building's Apartments tab (spec
 * building-detail-admin-editor S2). Calls `moveApartment`, then refreshes the server
 * list; disabled at the ends (`canUp` / `canDown`) and while a move is in flight.
 */
export function ApartmentMoveButtons({
  id,
  canUp,
  canDown,
}: {
  id: string;
  canUp: boolean;
  canDown: boolean;
}) {
  const tb = useTranslations("backoffice");
  const router = useRouter();
  const toast = useToast();
  const [pending, start] = useTransition();

  function move(direction: MoveDirection) {
    start(async () => {
      const result = await moveApartment(id, direction);
      if (result.ok) {
        toast.success(tb("actions.saved"));
        router.refresh();
      } else {
        toast.error(tb("actions.saveError"));
      }
    });
  }

  return (
    <div className="flex items-center gap-1">
      <AdminButton
        onClick={() => move("up")}
        disabled={!canUp || pending}
        aria-label={tb("media.moveUp")}
        title={tb("media.moveUp")}
        className="px-2"
      >
        <UiIcon name="arrow-up" size={16} />
      </AdminButton>
      <AdminButton
        onClick={() => move("down")}
        disabled={!canDown || pending}
        aria-label={tb("media.moveDown")}
        title={tb("media.moveDown")}
        className="px-2"
      >
        <UiIcon name="arrow-down" size={16} />
      </AdminButton>
    </div>
  );
}
