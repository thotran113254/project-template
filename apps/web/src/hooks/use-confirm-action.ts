import { useCallback, useState } from "react";

interface ConfirmState<T> {
  open: boolean;
  item: T | null;
}

interface UseConfirmActionReturn<T> {
  /** Whether the confirm dialog is open */
  open: boolean;
  /** The item being confirmed (null when closed) */
  item: T | null;
  /** Open the confirm dialog with the given item */
  requestConfirm: (item: T) => void;
  /** Close the confirm dialog */
  cancel: () => void;
  /** Execute the action and close */
  confirm: (onConfirm: (item: T) => void) => void;
}

/**
 * Manages confirm dialog state for destructive actions.
 * Extracts the repeated open/item/close pattern used across pages.
 *
 * @example
 * const { open, item, requestConfirm, cancel } = useConfirmAction<User>();
 * // In JSX:
 * <Button onClick={() => requestConfirm(user)}>Delete</Button>
 * <ConfirmDialog open={open} onOpenChange={(v) => !v && cancel()} ... />
 */
export function useConfirmAction<T>(): UseConfirmActionReturn<T> {
  const [state, setState] = useState<ConfirmState<T>>({
    open: false,
    item: null,
  });

  const requestConfirm = useCallback((item: T) => {
    setState({ open: true, item });
  }, []);

  const cancel = useCallback(() => {
    setState({ open: false, item: null });
  }, []);

  const confirm = useCallback(
    (onConfirm: (item: T) => void) => {
      if (state.item) {
        onConfirm(state.item);
      }
    },
    [state.item],
  );

  return {
    open: state.open,
    item: state.item,
    requestConfirm,
    cancel,
    confirm,
  };
}
