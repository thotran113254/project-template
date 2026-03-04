import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Save, FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, THead, TBody, TR, TH, TD, TableHeaderRow } from "@/components/ui/data-table";
import { PageSpinner } from "@/components/ui/spinner";
import { apiClient } from "@/lib/api-client";
import type { PricingRule, PaginatedResponse } from "@app/shared";

const fmtVnd = (n: number) => `${new Intl.NumberFormat("vi-VN").format(n)} VND`;

const COST_ROWS = [
  { key: "accommodation", label: "Lưu trú", base: 4500000, margin: 20 },
  { key: "transport", label: "Vận chuyển", base: 2000000, margin: 15 },
  { key: "tours", label: "Tour tham quan", base: 1800000, margin: 25 },
  { key: "management", label: "Phí quản lý hệ thống", base: 500000, margin: 10 },
];

/** Admin pricing management page with cost breakdown table and admin notes. */
export default function PricingAdminPage() {
  const [destination, setDestination] = useState("");
  const [guests, setGuests] = useState("2");
  const [days, setDays] = useState("3");
  const [adminNotes, setAdminNotes] = useState("");

  const { data: rulesData, isLoading } = useQuery({
    queryKey: ["pricing-rules"],
    queryFn: async () => {
      const res = await apiClient.get<PaginatedResponse<PricingRule>>("/pricing/rules");
      return res.data.data ?? [];
    },
  });

  const guestsNum = Math.max(1, parseInt(guests) || 1);
  const daysNum = Math.max(1, parseInt(days) || 1);

  const computedRows = COST_ROWS.map((row) => {
    const perPerson = Math.round((row.base * (1 + row.margin / 100)) / guestsNum);
    const total = perPerson * guestsNum * daysNum;
    return { ...row, perPerson, total };
  });

  const grandTotal = computedRows.reduce((sum, r) => sum + r.total, 0);

  if (isLoading) return <PageSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Công cụ tính giá (Admin)</h1>
          <p className="text-sm text-[var(--muted-foreground)]">{(rulesData ?? []).length} quy tắc giá đang hoạt động</p>
        </div>
        <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 px-3 py-1 text-xs font-semibold">
          CHẾ ĐỘ QUẢN TRỊ VIÊN
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Thông tin cơ bản</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-[var(--foreground)]">Điểm đến</label>
            <Input placeholder="Đà Nẵng, Hội An..." value={destination} onChange={(e) => setDestination(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-[var(--foreground)]">Số khách</label>
            <Input type="number" min={1} value={guests} onChange={(e) => setGuests(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-[var(--foreground)]">Số ngày</label>
            <Input type="number" min={1} value={days} onChange={(e) => setDays(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <div className="rounded-xl bg-teal-600 p-6 text-white flex items-center justify-between">
        <div>
          <p className="text-sm uppercase tracking-wide opacity-80">Tổng giá báo</p>
          <p className="text-3xl font-bold mt-1">{fmtVnd(grandTotal)}</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="border-white/40 bg-white/10 text-white hover:bg-white/20">
            <Save className="mr-2 h-4 w-4" /> Lưu báo giá
          </Button>
          <Button variant="outline" className="border-white/40 bg-white/10 text-white hover:bg-white/20">
            <FileDown className="mr-2 h-4 w-4" /> Xuất PDF
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Cơ cấu chi phí</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <THead>
              <TableHeaderRow>
                <TH>Hạng mục</TH>
                <TH className="text-right">Chi phí gốc</TH>
                <TH className="text-right">% Margin</TH>
                <TH className="text-right">Giá/người</TH>
                <TH className="text-right">Tổng</TH>
              </TableHeaderRow>
            </THead>
            <TBody>
              {computedRows.map((row) => (
                <TR key={row.key}>
                  <TD className="font-medium text-[var(--foreground)]">{row.label}</TD>
                  <TD className="text-right text-[var(--muted-foreground)]">{fmtVnd(row.base)}</TD>
                  <TD className="text-right text-[var(--muted-foreground)]">{row.margin}%</TD>
                  <TD className="text-right text-[var(--muted-foreground)]">{fmtVnd(row.perPerson)}</TD>
                  <TD className="text-right font-medium text-[var(--foreground)]">{fmtVnd(row.total)}</TD>
                </TR>
              ))}
              <TR>
                <TD colSpan={4} className="font-semibold text-[var(--foreground)]">Tổng cộng</TD>
                <TD className="text-right font-bold text-teal-600">{fmtVnd(grandTotal)}</TD>
              </TR>
            </TBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ghi chú admin</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Nhập ghi chú nội bộ..."
            rows={4}
            value={adminNotes}
            onChange={(e) => setAdminNotes(e.target.value)}
          />
        </CardContent>
      </Card>
    </div>
  );
}
