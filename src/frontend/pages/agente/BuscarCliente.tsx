import Layout from "@/frontend/components/Layout";
import { Search, User, Phone, Mail, MapPin } from "lucide-react";
import { Button } from "@/frontend/components/ui/button";
import { Input } from "@/frontend/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/frontend/components/ui/card";
import { useState } from "react";

const mockClients = [
  { id: "C001", name: "Carlos Rodríguez", email: "carlos@email.com", phone: "+1234567890", address: "Calle Principal 123" },
  { id: "C002", name: "Ana Martínez", email: "ana@email.com", phone: "+1234567891", address: "Av. Secundaria 456" },
];

export default function BuscarCliente() {
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState<typeof mockClients>([]);

  const handleSearch = () => {
    if (searchTerm) {
      setResults(mockClients.filter(c => 
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.id.toLowerCase().includes(searchTerm.toLowerCase())
      ));
    }
  };

  return (
    <Layout role="agent">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Buscar Cliente</h1>
          <p className="text-muted-foreground mt-2">Encuentra y valida la información del cliente</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Búsqueda de Cliente</CardTitle>
            <CardDescription>Ingresa el nombre o ID del cliente</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input 
                placeholder="Nombre o ID del cliente..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Button onClick={handleSearch}>
                <Search className="h-4 w-4 mr-2" />
                Buscar
              </Button>
            </div>
          </CardContent>
        </Card>

        {results.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Resultados</h2>
            {results.map((client) => (
              <Card key={client.id}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    {client.name}
                  </CardTitle>
                  <CardDescription>ID: {client.id}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{client.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{client.phone}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{client.address}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
