import { useTranslation } from "react-i18next";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, Eye, Edit, X } from "lucide-react";

const Reservations = () => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");

  const reservations = [
    {
      id: "RSV-001",
      guest: "João Silva",
      lodge: "Canopy Retreat",
      checkIn: "2025-11-01",
      checkOut: "2025-11-05",
      status: "confirmed",
      amount: "R$ 3.400",
    },
    {
      id: "RSV-002",
      guest: "Maria Santos",
      lodge: "Rio Serenidade",
      checkIn: "2025-11-10",
      checkOut: "2025-11-15",
      status: "pending",
      amount: "R$ 3.600",
    },
    {
      id: "RSV-003",
      guest: "Pedro Costa",
      lodge: "Casa na Árvore Esmeralda",
      checkIn: "2025-10-28",
      checkOut: "2025-11-02",
      status: "completed",
      amount: "R$ 4.750",
    },
    {
      id: "RSV-004",
      guest: "Ana Lima",
      lodge: "Flutuante AMA",
      checkIn: "2025-11-15",
      checkOut: "2025-11-20",
      status: "cancelled",
      amount: "R$ 6.000",
    },
  ];

  const getStatusBadge = (status: string) => {
    const variants: { [key: string]: any } = {
      confirmed: { label: t("admin.confirmed"), className: "bg-green-100 text-green-800" },
      pending: { label: t("admin.pending"), className: "bg-yellow-100 text-yellow-800" },
      completed: { label: t("admin.completed"), className: "bg-blue-100 text-blue-800" },
      cancelled: { label: t("admin.cancelled"), className: "bg-red-100 text-red-800" },
    };

    const variant = variants[status] || variants.pending;
    return <Badge className={variant.className}>{variant.label}</Badge>;
  };

  const filteredReservations = reservations.filter(
    (res) =>
      res.guest.toLowerCase().includes(searchTerm.toLowerCase()) ||
      res.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold text-foreground mb-2">
          {t("admin.reservations")}
        </h1>
        <p className="text-muted-foreground">Gerencie todas as reservas da plataforma</p>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-2 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por hóspede ou ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>{t("reservation.guestName")}</TableHead>
                  <TableHead>Pousada</TableHead>
                  <TableHead>Check-in</TableHead>
                  <TableHead>Check-out</TableHead>
                  <TableHead>{t("admin.status")}</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead className="text-right">{t("admin.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReservations.map((reservation) => (
                  <TableRow key={reservation.id}>
                    <TableCell className="font-medium">{reservation.id}</TableCell>
                    <TableCell>{reservation.guest}</TableCell>
                    <TableCell>{reservation.lodge}</TableCell>
                    <TableCell>{new Date(reservation.checkIn).toLocaleDateString()}</TableCell>
                    <TableCell>{new Date(reservation.checkOut).toLocaleDateString()}</TableCell>
                    <TableCell>{getStatusBadge(reservation.status)}</TableCell>
                    <TableCell className="font-medium">{reservation.amount}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button size="sm" variant="ghost">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost">
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Reservations;
