import {
  useMutation,
  useQueryClient,
  type UseMutationResult,
} from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { getErrorMessage } from "@/lib/error-utils";

interface UseDeleteMutationOptions<T> {
  queryKey: readonly unknown[];
  endpoint: (id: string) => string;
  onSuccess?: () => void;
}

/** Reusable delete mutation with optimistic removal from list cache. */
export function useDeleteMutation<T extends { id: string }>({
  queryKey,
  endpoint,
  onSuccess,
}: UseDeleteMutationOptions<T>): UseMutationResult<void, Error, string> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(endpoint(id));
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<T[]>(queryKey);
      queryClient.setQueryData<T[]>(queryKey, (old) =>
        (old ?? []).filter((item) => item.id !== id),
      );
      return { previous };
    },
    onError: (_err, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
    },
    onSuccess: () => onSuccess?.(),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });
}

interface UseActionMutationOptions<T> {
  queryKey: readonly unknown[];
  endpoint: (id: string) => string;
  /** Maps action name to the new field value for optimistic update */
  optimisticFieldMap?: Record<string, Partial<T>>;
  /** Additional query keys to invalidate on settle */
  invalidateKeys?: string[][];
}

/** Reusable action mutation (e.g., activate/deactivate) with optimistic status update. */
export function useActionMutation<T extends { id: string }>({
  queryKey,
  endpoint,
  optimisticFieldMap,
  invalidateKeys,
}: UseActionMutationOptions<T>): UseMutationResult<
  void,
  Error,
  { id: string; action: string }
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, action }: { id: string; action: string }) => {
      await apiClient.post(endpoint(id), { action });
    },
    onMutate: async ({ id, action }) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<T[]>(queryKey);

      const fields = optimisticFieldMap?.[action];
      if (fields) {
        queryClient.setQueryData<T[]>(queryKey, (old) =>
          (old ?? []).map((item) =>
            item.id === id ? { ...item, ...fields } : item,
          ),
        );
      }
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
      invalidateKeys?.forEach((key) =>
        queryClient.invalidateQueries({ queryKey: key }),
      );
    },
  });
}

/** Extract error message for UI display. Re-exported for convenience. */
export { getErrorMessage };
