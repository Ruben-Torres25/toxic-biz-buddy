import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Eye,
  Phone,
  Mail,
  MapPin,
  Truck,
  Package
} from "lucide-react";

export const SuppliersSection = () => {
  const suppliers = [
    {
      id: "SUP001",
      name: "CleanCorp S.L.",
      contact: "Juan Pérez",
      email: "ventas@cleancorp.es",
      phone: "+34 911 234 567",
      address: "Polígono Industrial Norte, Madrid",
      products: 15,
      lastDelivery: "2024-01-08",
      status: "activo"
    },
    {
      id: "SUP002", 
      name: "HygienePro Ltd.",
      contact: "María González",
      email: "info@hygienepro.com",
      phone: "+34 922 345 678",
      address: "Zona Franca, Barcelona",
      products: 8,
      lastDelivery: "2024-01-06",
      status: "activo"
    },
    {
      id: "SUP003",
      name: "CrystalClean Solutions",
      contact: "Carlos Ruiz", 
      email: "pedidos@crystalclean.es",
      phone: "+34 933 456 789",
      address: "Parque Empresarial, Valencia",
      products: 12,
      lastDelivery: "2024-01-05",
      status: "inactivo"
    },
    {
      id: "SUP004",
      name: "EcoLimpia Distribución",
      contact: "Ana López",
      email: "comercial@ecolimpia.es",
      phone: "+34 944 567 890",
      address: "Área Industrial, Bilbao", 
      products: 6,
      lastDelivery: "2024-01-04",
      status: "activo"
    }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "activo":
        return <Badge className="bg-success/10 text-success border-success/20">Activo</Badge>;
      case "inactivo":
        return <Badge className="bg-muted/10 text-muted-foreground border-muted/20">Inactivo</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gestión de Proveedores</h1>
          <p className="text-muted-foreground">Administra tus proveedores y recepción de mercadería</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="bg-gradient-to-r from-secondary/10 to-secondary/20 border-secondary/30">
            <Package className="w-4 h-4 mr-2" />
            Registrar Mercadería
          </Button>
          <Button className="bg-gradient-to-r from-primary to-primary-hover hover:from-primary-hover hover:to-primary">
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
                <p className="text-2xl font-bold text-foreground">24</p>
              </div>
              <Truck className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-success/5 to-success/10 border-success/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Proveedores Activos</p>
                <p className="text-2xl font-bold text-success">18</p>
              </div>
              <Truck className="w-8 h-8 text-success" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-warning/5 to-warning/10 border-warning/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Entregas Esta Semana</p>
                <p className="text-2xl font-bold text-warning">5</p>
              </div>
              <Package className="w-8 h-8 text-warning" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Productos Suministrados</p>
                <p className="text-2xl font-bold text-primary">156</p>
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
                  <th className="text-left py-3 px-4 font-semibold text-foreground">Productos</th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground">Última Entrega</th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground">Estado</th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {suppliers.map((supplier) => (
                  <tr key={supplier.id} className="border-b border-border hover:bg-accent/30 transition-colors">
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-medium text-foreground">{supplier.name}</p>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {supplier.address}
                        </p>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="space-y-1">
                        <p className="font-medium text-foreground">{supplier.contact}</p>
                        <p className="text-sm text-foreground flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {supplier.email}
                        </p>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {supplier.phone}
                        </p>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-foreground">{supplier.products} productos</td>
                    <td className="py-3 px-4 text-muted-foreground">{supplier.lastDelivery}</td>
                    <td className="py-3 px-4">{getStatusBadge(supplier.status)}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline" className="h-8 w-8 p-0">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="outline" className="h-8 w-8 p-0">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="outline" className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive">
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
    </div>
  );
};