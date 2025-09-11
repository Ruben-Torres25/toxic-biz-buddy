import { useState } from "react";
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
  AlertTriangle,
  Package
} from "lucide-react";
import { NewProductModal } from "@/components/modals/NewProductModal";

export const ProductsSection = () => {
  const [isNewProductOpen, setIsNewProductOpen] = useState(false);
  const products = [
    {
      id: "PROD001",
      name: "Detergente Líquido Premium",
      category: "Detergentes",
      price: 12.50,
      stock: 3,
      minStock: 10,
      supplier: "CleanCorp"
    },
    {
      id: "PROD002", 
      name: "Desinfectante Multiuso",
      category: "Desinfectantes",
      price: 8.75,
      stock: 1,
      minStock: 5,
      supplier: "HygienePro"
    },
    {
      id: "PROD003",
      name: "Jabón en Polvo Industrial",
      category: "Jabones", 
      price: 15.20,
      stock: 25,
      minStock: 8,
      supplier: "CleanCorp"
    },
    {
      id: "PROD004",
      name: "Limpiador de Vidrios",
      category: "Limpiadores",
      price: 6.90,
      stock: 4,
      minStock: 12,
      supplier: "CrystalClean"
    }
  ]);

  const getStockBadge = (stock: number, minStock: number) => {
    if (stock <= minStock / 2) {
      return <Badge className="bg-destructive/10 text-destructive border-destructive/20">Crítico</Badge>;
    } else if (stock <= minStock) {
      return <Badge className="bg-warning/10 text-warning border-warning/20">Bajo</Badge>;
    } else {
      return <Badge className="bg-success/10 text-success border-success/20">Normal</Badge>;
    }
  };

  const handleView = (product: any) => {
    setSelectedProduct(product);
    setIsViewModalOpen(true);
  };

  const handleEdit = (product: any) => {
    setSelectedProduct(product);
    setIsEditModalOpen(true);
  };

  const handleDelete = (productCode: string) => {
    toast({
      title: "Producto eliminado",
      description: `El producto ${productCode} ha sido eliminado exitosamente.`,
    });
    setProducts(products.filter(product => product.code !== productCode));
  };

  const handleSaveProduct = (updatedProduct: any) => {
    setProducts(products.map(product => 
      product.code === updatedProduct.code ? updatedProduct : product
    ));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gestión de Productos</h1>
          <p className="text-muted-foreground">Controla tu inventario y precios de productos</p>
        </div>
        <Button 
          onClick={() => setIsNewProductOpen(true)}
          className="bg-gradient-to-r from-primary to-primary-hover hover:from-primary-hover hover:to-primary"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Producto
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-card to-accent/5">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Productos</p>
                <p className="text-2xl font-bold text-foreground">156</p>
              </div>
              <Package className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-warning/5 to-warning/10 border-warning/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Stock Bajo</p>
                <p className="text-2xl font-bold text-warning">7</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-warning" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-destructive/5 to-destructive/10 border-destructive/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Stock Crítico</p>
                <p className="text-2xl font-bold text-destructive">2</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-destructive" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-success/5 to-success/10 border-success/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Valor Inventario</p>
                <p className="text-2xl font-bold text-success">€12,450</p>
              </div>
              <Package className="w-8 h-8 text-success" />
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
                placeholder="Buscar productos por nombre o categoría..." 
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

      {/* Products Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Productos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-semibold text-foreground">Producto</th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground">Categoría</th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground">Precio</th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground">Stock</th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground">Estado</th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground">Proveedor</th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id} className="border-b border-border hover:bg-accent/30 transition-colors">
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-medium text-foreground">{product.name}</p>
                        <p className="text-sm text-muted-foreground">{product.id}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-foreground">{product.category}</td>
                    <td className="py-3 px-4 font-semibold text-foreground">€{product.price.toFixed(2)}</td>
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-medium text-foreground">{product.stock} unidades</p>
                        <p className="text-sm text-muted-foreground">Mín: {product.minStock}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4">{getStockBadge(product.stock, product.minStock)}</td>
                    <td className="py-3 px-4 text-foreground">{product.supplier}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="h-8 w-8 p-0"
                          onClick={() => handleView(product)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="h-8 w-8 p-0"
                          onClick={() => handleEdit(product)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => handleDelete(product.code)}
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

      <NewProductModal open={isNewProductOpen} onOpenChange={setIsNewProductOpen} />
    </div>
  );
};