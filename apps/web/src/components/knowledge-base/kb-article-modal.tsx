import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { apiClient } from "@/lib/api-client";
import { createKbArticleSchema } from "@app/shared";
import type { KbArticle, CreateKbArticleInput } from "@app/shared";

const CATEGORY_OPTIONS = [
  { value: "", label: "-- Chọn danh mục --" },
  { value: "FAQ", label: "FAQ" },
  { value: "Chính sách", label: "Chính sách" },
  { value: "Hướng dẫn", label: "Hướng dẫn" },
  { value: "Điểm đến", label: "Điểm đến" },
  { value: "Dịch vụ", label: "Dịch vụ" },
];

const STATUS_OPTIONS = [
  { value: "draft", label: "Bản nháp" },
  { value: "published", label: "Đang hoạt động" },
  { value: "archived", label: "Lưu trữ" },
];

interface KbArticleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  article?: KbArticle;
  onSuccess: () => void;
}

const DEFAULT_VALUES: CreateKbArticleInput = {
  title: "",
  content: "",
  category: "",
  status: "draft",
};

/** Create/Edit knowledge base article modal with react-hook-form + shared Zod schema. */
export function KbArticleModal({ open, onOpenChange, article, onSuccess }: KbArticleModalProps) {
  const queryClient = useQueryClient();
  const isEdit = !!article;

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateKbArticleInput>({
    resolver: zodResolver(createKbArticleSchema),
    defaultValues: DEFAULT_VALUES,
  });

  useEffect(() => {
    if (open) {
      reset(
        article
          ? {
              title: article.title,
              content: article.content ?? "",
              category: article.category,
              status: article.status,
            }
          : DEFAULT_VALUES,
      );
    }
  }, [open, article, reset]);

  const mutation = useMutation({
    mutationFn: async (values: CreateKbArticleInput) => {
      if (isEdit && article) {
        await apiClient.patch(`/knowledge-base/${article.id}`, values);
      } else {
        await apiClient.post("/knowledge-base", values);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kb-articles"] });
      onSuccess();
      onOpenChange(false);
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Chỉnh sửa bài viết" : "Thêm bài viết mới"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-[var(--foreground)]">Tiêu đề</label>
            <Input {...register("title")} placeholder="Nhập tiêu đề..." />
            {errors.title && <p className="text-xs text-red-600">{errors.title.message}</p>}
          </div>
          <Select
            id="kb-category"
            label="Danh mục"
            options={CATEGORY_OPTIONS}
            error={errors.category?.message}
            {...register("category")}
          />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-[var(--foreground)]">Nội dung</label>
            <Textarea {...register("content")} placeholder="Nội dung bài viết..." rows={5} />
          </div>
          <Select
            id="kb-status"
            label="Trạng thái"
            options={STATUS_OPTIONS}
            {...register("status")}
          />
          {mutation.isError && (
            <p className="text-xs text-red-600">Có lỗi xảy ra. Vui lòng thử lại.</p>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Hủy
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Đang lưu..." : isEdit ? "Cập nhật" : "Tạo mới"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
