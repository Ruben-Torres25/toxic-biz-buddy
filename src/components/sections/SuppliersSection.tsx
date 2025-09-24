import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Plus, 
  Search, 
  Filter, 
  Star,
  Package,
  TrendingUp,
  Users,
  Eye,
  Edit,
  Trash2
} from "lucide-react";
import { NewSupplierModal } from "@/components/modals/NewSupplierModal";
import { RegisterMerchandiseModal } from "@/components/modals/RegisterMerchandiseModal";
import { ViewSupplierModal } from "@/components/modals/ViewSupplierModal";
import { EditSupplierModal } from "@/components/modals/EditSupplierModal";
import { toast } from "@/hooks/use-toast";

export const SuppliersSection = () => {
  const [isNewSupplierOpen, setIsNewSupplierOpen] = useState(false);
  const [isRegisterMerchandiseOpen, setIsRegisterMerchandiseOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<any>(null);
  const [suppliers, setSuppliers] = useState([
    {
      id: "SUP001",
      name: "CleanCorp S.A.",
      contact: "Juan Pérez",
      phone: "+34 912 345 678",
      email: "juan@cleancorp.es",
      address: "Calle Industrial 123, Madrid",
      lastDelivery: "15/03/2024",
      rating: 4.5
    },
    {
      id: "SUP002",
      name: "HygienePro Distribuciones",
      contact: "María García",
      phone: "+34 923 456 789",
      email: "maria@hygienepro.es", 
      address: "Av. Comercial 456, Barcelona",
      lastDelivery: "18/03/2024",
      rating: 4.8
    },
    {
      id: "SUP003",
      name: "CrystalClean Import",
      contact: "Carlos Rodríguez",
      phone: "+34 934 567 890",
      email: "carlos@crystalclean.es",
      address: "Polígono Sur 789, Valencia",
      lastDelivery: "10/03/2024",
      rating: 4.2
    }
  ]);

  const handleView = (supplier: any) => {
    setSelectedSupplier(supplier);
    setIsViewModalOpen(true);
  };

  const handleEdit = (supplier: any) => {
    setSelectedSupplier(supplier);
    setIsEditModalOpen(true);
  };

  const handleDelete = (supplierId: string) => {
    toast({
      title: "Proveedor eliminado",
      description: `El proveedor ${supplierId} ha sido eliminado exitosamente.`,
    });
    setSuppliers(suppliers.filter(supplier => supplier.id !== supplierId));
  };

  const handleSaveSupplier = (updatedSupplier: any) => {
    setSuppliers(suppliers.map(supplier => 
      supplier.id === updatedSupplier.id ? updatedSupplier : supplier
    ));
  };

  const getRatingStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[...Array(5)].map((_, index) => (
          <Star
            key={index}
            className={`w-4 h-4 ${
              index < Math.floor(rating)
                ? "fill-warning text-warning"
                : "text-muted-foreground"
            }`}
          />
        ))}
        <span className="ml-1 text-sm text-muted-foreground">({rating})</span>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gestión de Proveedores</h1>
          <p className="text-muted-foreground">Administra tus proveedores y sus entregas</p>
        </div>
        <div className="flex gap-3">
          <Button 
            variant="outline"
            onClick={() => setIsRegisterMerchandiseOpen(true)}
            className="border-primary text-primary hover:bg-primary/10"
          >
            <Package className="w-4 h-4 mr-2" />
            Registrar Mercadería
          </Button>
          <Button 
            onClick={() => setIsNewSupplierOpen(true)}
            className="bg-gradient-to-r from-primary to-primary-hover hover:from-primary-hover hover:to-primary"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Proveedor
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-card to-accent/5">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Proveedores</p>
                <p className="text-2xl font-bold text-foreground">{suppliers.length}</p>
              </div>
              <Users className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-success/5 to-success/10 border-success/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Proveedores Activos</p>
                <p className="text-2xl font-bold text-success">{suppliers.length}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-success" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-warning/5 to-warning/10 border-warning/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Calificación Promedio</p>
                <p className="text-2xl font-bold text-warning">4.5</p>
              </div>
              <Star className="w-8 h-8 text-warning fill-warning" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Productos Totales</p>
                <p className="text-2xl font-bold text-primary">73</p>
              </div>
              <Package className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Buscar proveedores por nombre o contacto..." 
                className="pl-10"
              />
            </div>
            <Button variant="outline" className="sm:w-auto">
              <Filter className="w-4 h-4 mr-2" />
              Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Suppliers Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Proveedores</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-semibold text-foreground">Proveedor</th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground">Contacto</th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground">Teléfono</th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground">Dirección</th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground">Última Entrega</th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground">Estado</th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground">Calificación</th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {suppliers.map((supplier) => (
                  <tr key={supplier.id} className="border-b border-border hover:bg-accent/30 transition-colors">
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-medium text-foreground">{supplier.name}</p>
                        <p className="text-sm text-muted-foreground">{supplier.id}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-medium text-foreground">{supplier.contact}</p>
                        <p className="text-sm text-muted-foreground">{supplier.email}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-foreground">{supplier.phone}</td>
                    <td className="py-3 px-4 text-foreground">{supplier.address}</td>
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-medium text-foreground">{supplier.lastDelivery}</p>
                        <p className="text-sm text-muted-foreground">Última entrega</p>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <Badge className="bg-success/10 text-success border-success/20">Activo</Badge>
                    </td>
                    <td className="py-3 px-4">{getRatingStars(supplier.rating)}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="h-8 w-8 p-0"
                          onClick={() => handleView(supplier)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="h-8 w-8 p-0"
                          onClick={() => handleEdit(supplier)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => handleDelete(supplier.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <NewSupplierModal open={isNewSupplierOpen} onOpenChange={setIsNewSupplierOpen} />
      <RegisterMerchandiseModal open={isRegisterMerchandiseOpen} onOpenChange={setIsRegisterMerchandiseOpen} />
      <ViewSupplierModal 
        open={isViewModalOpen} 
        onOpenChange={setIsViewModalOpen} 
        supplier={selectedSupplier} 
      />
      <EditSupplierModal 
        open={isEditModalOpen} 
        onOpenChange={setIsEditModalOpen} 
        supplier={selectedSupplier} 
        onSave={handleSaveSupplier}
      />
    </div>
  );
};
