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
  DollarSign,
  Phone,
  Mail,
  MapPin
} from "lucide-react";
import { NewClientModal } from "@/components/modals/NewClientModal";

export const ClientsSection = () => {
  const [isNewClientOpen, setIsNewClientOpen] = useState(false);
  const clients = [
    {
      id: "CLI001",
      name: "María García",
      email: "maria.garcia@email.com",
      phone: "+34 666 123 456",
      address: "Calle Mayor 123, Madrid",
      balance: 450.00,
      orders: 12,
      lastOrder: "2024-01-08"
    },
    {
      id: "CLI002",
      name: "Carlos López",
      email: "carlos.lopez@email.com", 
      phone: "+34 677 234 567",
      address: "Avenida España 45, Barcelona",
      balance: -120.50,
      orders: 8,
      lastOrder: "2024-01-07"
    },
    {
      id: "CLI003",
      name: "Ana Rodríguez",
      email: "ana.rodriguez@email.com",
      phone: "+34 688 345 678", 
      address: "Plaza Central 8, Valencia",
      balance: 0,
      orders: 15,
      lastOrder: "2024-01-06"
    },
    {
      id: "CLI004",
      name: "Luis Martín",
      email: "luis.martin@email.com",
      phone: "+34 699 456 789",
      address: "Calle Sol 67, Sevilla", 
      balance: 230.75,
      orders: 6,
      lastOrder: "2024-01-05"
    }
  ];

  const getBalanceBadge = (balance: number) => {
    if (balance > 0) {
      return <Badge className="bg-success/10 text-success border-success/20">+€{balance.toFixed(2)}</Badge>;
    } else if (balance < 0) {
      return <Badge className="bg-destructive/10 text-destructive border-destructive/20">€{balance.toFixed(2)}</Badge>;
    } else {
      return <Badge className="bg-muted/10 text-muted-foreground border-muted/20">€0.00</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gestión de Clientes</h1>
          <p className="text-muted-foreground">Administra la información de tus clientes y sus cuentas</p>
        </div>
        <Button 
          onClick={() => setIsNewClientOpen(true)}
          className="bg-gradient-to-r from-secondary to-secondary-hover hover:from-secondary-hover hover:to-secondary"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Cliente
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-card to-accent/5">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Clientes</p>
                <p className="text-2xl font-bold text-foreground">142</p>
              </div>
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-success/5 to-success/10 border-success/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Saldo a Favor</p>
                <p className="text-2xl font-bold text-success">€680.75</p>
              </div>
              <div className="w-12 h-12 bg-success/10 rounded-full flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-destructive/5 to-destructive/10 border-destructive/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Deudas Pendientes</p>
                <p className="text-2xl font-bold text-destructive">€120.50</p>
              </div>
              <div className="w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-destructive" />
              </div>
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
                placeholder="Buscar clientes por nombre, email o teléfono..." 
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

      {/* Clients Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Clientes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-semibold text-foreground">Cliente</th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground">Contacto</th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground">Pedidos</th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground">Saldo</th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground">Último Pedido</th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {clients.map((client) => (
                  <tr key={client.id} className="border-b border-border hover:bg-accent/30 transition-colors">
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-medium text-foreground">{client.name}</p>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {client.address}
                        </p>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="space-y-1">
                        <p className="text-sm text-foreground flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {client.email}
                        </p>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {client.phone}
                        </p>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-foreground">{client.orders}</td>
                    <td className="py-3 px-4">{getBalanceBadge(client.balance)}</td>
                    <td className="py-3 px-4 text-muted-foreground">{client.lastOrder}</td>
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

      <NewClientModal open={isNewClientOpen} onOpenChange={setIsNewClientOpen} />
    </div>
  );
};