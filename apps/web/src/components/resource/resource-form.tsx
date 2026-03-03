import type { UseFormRegister, FieldErrors } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { FormField } from "@/components/ui/form-field";
import { RESOURCE_CATEGORIES } from "@app/shared";
import type { CreateResourceInput } from "@app/shared";

const CATEGORY_OPTIONS = RESOURCE_CATEGORIES.map((c) => ({
  value: c.value,
  label: c.label,
}));

interface ResourceFormProps {
  register: UseFormRegister<CreateResourceInput>;
  errors: FieldErrors<CreateResourceInput>;
  disabled?: boolean;
}

/** Shared form fields for create/edit resource modals. Uses react-hook-form register. */
export function ResourceForm({ register, errors, disabled }: ResourceFormProps) {
  return (
    <div className="space-y-4">
      <FormField label="Name" required error={errors.name?.message} htmlFor="name">
        <Input
          id="name"
          placeholder="my-resource"
          disabled={disabled}
          {...register("name")}
        />
      </FormField>

      <FormField label="Description" error={errors.description?.message} htmlFor="description">
        <Textarea
          id="description"
          placeholder="A brief description..."
          disabled={disabled}
          rows={3}
          {...register("description")}
        />
      </FormField>

      <FormField label="Category" error={errors.category?.message} htmlFor="category">
        <Select
          id="category"
          options={CATEGORY_OPTIONS}
          disabled={disabled}
          {...register("category")}
        />
      </FormField>
    </div>
  );
}
