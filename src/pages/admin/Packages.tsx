import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import AdminLayout from "./AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Edit, Trash2, Eye, Package, Users, Calendar } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface PackageData {
  id: string;
  name: string;
  slug: string;
  duration: string;
  people: number;
  description: string;
  inclusions: string[];
  experiences: string[];
  price: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const Packages = () => {
  const { t } = useTranslation();
  const { isSuperAdmin } = useAuth();
  const [packages, setPackages] = useState<PackageData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<PackageData | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    duration: "",
    people: 2,
    description: "",
    inclusions: "",
    experiences: "",
    price: 0,
  });

  useEffect(() => {
    fetchPackages();

    // Real-time subscription for packages
    const channel = supabase
      .channel("packages-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "packages",
        },
        () => {
          fetchPackages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchPackages = async () => {
    try {
      const { data, error } = await supabase
        .from("packages")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPackages((data || []) as PackageData[]);
    } catch (error) {
      console.error("Erro ao buscar pacotes:", error);
      toast.error("Erro ao carregar pacotes");
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePackage = async () => {
    try {
      // Parse JSON fields
      const inclusionsArray = formData.inclusions
        .split("\n")
        .filter((item) => item.trim());
      const experiencesArray = formData.experiences
        .split("\n")
        .filter((item) => item.trim());

      const { error } = await supabase.from("packages").insert({
        name: formData.name,
        slug: formData.slug,
        duration: formData.duration,
        people: formData.people,
        description: formData.description,
        inclusions: inclusionsArray,
        experiences: experiencesArray,
        price: formData.price,
        is_active: true,
      });

      if (error) throw error;

      toast.success("Pacote criado com sucesso!");
      setIsCreateModalOpen(false);
      resetForm();
      fetchPackages();
    } catch (error) {
      console.error("Erro ao criar pacote:", error);
      toast.error("Erro ao criar pacote");
    }
  };

  const handleUpdatePackage = async () => {
    if (!selectedPackage) return;

    try {
      const inclusionsArray = formData.inclusions
        .split("\n")
        .filter((item) => item.trim());
      const experiencesArray = formData.experiences
        .split("\n")
        .filter((item) => item.trim());

      const { error } = await supabase
        .from("packages")
        .update({
          name: formData.name,
          slug: formData.slug,
          duration: formData.duration,
          people: formData.people,
          description: formData.description,
          inclusions: inclusionsArray,
          experiences: experiencesArray,
          price: formData.price,
        })
        .eq("id", selectedPackage.id);

      if (error) throw error;

      toast.success("Pacote atualizado com sucesso!");
      setIsEditModalOpen(false);
      resetForm();
      fetchPackages();
    } catch (error) {
      console.error("Erro ao atualizar pacote:", error);
      toast.error("Erro ao atualizar pacote");
    }
  };

  const handleDeletePackage = async () => {
    if (!selectedPackage) return;

    try {
      const { error } = await supabase
        .from("packages")
        .delete()
        .eq("id", selectedPackage.id);

      if (error) throw error;

      toast.success("Pacote excluído com sucesso!");
      setIsDeleteDialogOpen(false);
      setSelectedPackage(null);
      fetchPackages();
    } catch (error) {
      console.error("Erro ao excluir pacote:", error);
      toast.error("Erro ao excluir pacote");
    }
  };

  const openEditModal = (pkg: PackageData) => {
    setSelectedPackage(pkg);
    setFormData({
      name: pkg.name,
      slug: pkg.slug,
      duration: pkg.duration,
      people: pkg.people,
      description: pkg.description,
      inclusions: pkg.inclusions.join("\n"),
      experiences: pkg.experiences.join("\n"),
      price: pkg.price,
    });
    setIsEditModalOpen(true);
  };

  const openViewModal = (pkg: PackageData) => {
    setSelectedPackage(pkg);
    setIsViewModalOpen(true);
  };

  const openDeleteDialog = (pkg: PackageData) => {
    setSelectedPackage(pkg);
    setIsDeleteDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      slug: "",
      duration: "",
      people: 2,
      description: "",
      inclusions: "",
      experiences: "",
      price: 0,
    });
    setSelectedPackage(null);
  };

  const filteredPackages = packages.filter((pkg) =>
    pkg.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pkg.slug.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-screen">
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold text-foreground mb-2">
            Gestão de Pacotes
          </h1>
          <p className="text-muted-foreground">
            Gerencie os pacotes turísticos oferecidos pela pousada
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Pacotes</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{packages.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pacotes Ativos</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {packages.filter((p) => p.is_active).length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Preço Médio</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                R${" "}
                {packages.length > 0
                  ? (
                      packages.reduce((sum, p) => sum + Number(p.price), 0) /
                      packages.length
                    ).toFixed(2)
                  : "0.00"}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Create */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <Input
            placeholder="Buscar pacotes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="md:max-w-sm"
          />
          <Button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-gradient-forest"
          >
            <Plus className="h-4 w-4 mr-2" />
            Criar Novo Pacote
          </Button>
        </div>

        {/* Packages Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Duração</TableHead>
                  <TableHead>Pessoas</TableHead>
                  <TableHead>Preço</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPackages.map((pkg) => (
                  <TableRow key={pkg.id}>
                    <TableCell className="font-medium">{pkg.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                        {pkg.duration}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                        {pkg.people}
                      </div>
                    </TableCell>
                    <TableCell>R$ {Number(pkg.price).toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge variant={pkg.is_active ? "default" : "secondary"}>
                        {pkg.is_active ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openViewModal(pkg)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditModal(pkg)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        {isSuperAdmin && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openDeleteDialog(pkg)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Create/Edit Modal */}
        <Dialog open={isCreateModalOpen || isEditModalOpen} onOpenChange={(open) => {
          if (!open) {
            setIsCreateModalOpen(false);
            setIsEditModalOpen(false);
            resetForm();
          }
        }}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {isCreateModalOpen ? "Criar Novo Pacote" : "Editar Pacote"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Nome do Pacote</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Ex: Pacote Japiim"
                  />
                </div>
                <div>
                  <Label htmlFor="slug">Slug (URL)</Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) =>
                      setFormData({ ...formData, slug: e.target.value })
                    }
                    placeholder="Ex: japiim"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="duration">Duração</Label>
                  <Input
                    id="duration"
                    value={formData.duration}
                    onChange={(e) =>
                      setFormData({ ...formData, duration: e.target.value })
                    }
                    placeholder="Ex: 5 dias e 4 noites"
                  />
                </div>
                <div>
                  <Label htmlFor="people">Número de Pessoas</Label>
                  <Input
                    id="people"
                    type="number"
                    min="1"
                    value={formData.people}
                    onChange={(e) =>
                      setFormData({ ...formData, people: parseInt(e.target.value) })
                    }
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="price">Preço (R$)</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData({ ...formData, price: parseFloat(e.target.value) })
                  }
                  placeholder="Ex: 14721.00"
                />
              </div>

              <div>
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Descrição destacada do pacote..."
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="inclusions">
                  Inclusões (uma por linha)
                </Label>
                <Textarea
                  id="inclusions"
                  value={formData.inclusions}
                  onChange={(e) =>
                    setFormData({ ...formData, inclusions: e.target.value })
                  }
                  placeholder="Alimentação: pensão completa&#10;Transporte terrestre e fluvial (ida e volta)&#10;..."
                  rows={5}
                />
              </div>

              <div>
                <Label htmlFor="experiences">
                  Experiências (uma por linha)
                </Label>
                <Textarea
                  id="experiences"
                  value={formData.experiences}
                  onChange={(e) =>
                    setFormData({ ...formData, experiences: e.target.value })
                  }
                  placeholder="Interação com botos&#10;Visita à aldeia local&#10;..."
                  rows={5}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsCreateModalOpen(false);
                  setIsEditModalOpen(false);
                  resetForm();
                }}
              >
                Cancelar
              </Button>
              <Button
                onClick={isCreateModalOpen ? handleCreatePackage : handleUpdatePackage}
                className="bg-gradient-forest"
              >
                {isCreateModalOpen ? "Criar Pacote" : "Salvar Alterações"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* View Modal */}
        <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedPackage?.name}</DialogTitle>
            </DialogHeader>
            {selectedPackage && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Duração</Label>
                    <p className="font-medium">{selectedPackage.duration}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Pessoas</Label>
                    <p className="font-medium">{selectedPackage.people}</p>
                  </div>
                </div>

                <div>
                  <Label className="text-muted-foreground">Preço</Label>
                  <p className="font-medium text-2xl text-primary">
                    R$ {Number(selectedPackage.price).toFixed(2)}
                  </p>
                </div>

                <div>
                  <Label className="text-muted-foreground">Descrição</Label>
                  <p className="mt-1">{selectedPackage.description}</p>
                </div>

                <div>
                  <Label className="text-muted-foreground">Inclusões</Label>
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    {selectedPackage.inclusions.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <Label className="text-muted-foreground">Experiências</Label>
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    {selectedPackage.experiences.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir o pacote "{selectedPackage?.name}"?
                Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeletePackage}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
};

export default Packages;