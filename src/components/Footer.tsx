import { Link } from "react-router-dom";
import { Facebook, Instagram, Mail, Phone } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-xl font-display font-bold mb-4">Pousadas Amazônia</h3>
            <p className="text-sm opacity-90">
              Viva a Amazônia com responsabilidade e autenticidade. Turismo sustentável em meio à maior floresta tropical do planeta.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Navegação</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/" className="opacity-90 hover:opacity-100 transition-opacity">
                  Início
                </Link>
              </li>
              <li>
                <Link to="/pousadas" className="opacity-90 hover:opacity-100 transition-opacity">
                  Pousadas
                </Link>
              </li>
              <li>
                <Link to="/sustentabilidade" className="opacity-90 hover:opacity-100 transition-opacity">
                  Sustentabilidade
                </Link>
              </li>
              <li>
                <Link to="/como-chegar" className="opacity-90 hover:opacity-100 transition-opacity">
                  Como Chegar
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Informações</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/contato" className="opacity-90 hover:opacity-100 transition-opacity">
                  Contato
                </Link>
              </li>
              <li>
                <a href="#" className="opacity-90 hover:opacity-100 transition-opacity">
                  Política de Privacidade
                </a>
              </li>
              <li>
                <a href="#" className="opacity-90 hover:opacity-100 transition-opacity">
                  Termos de Uso
                </a>
              </li>
              <li>
                <a href="#" className="opacity-90 hover:opacity-100 transition-opacity">
                  Política de Cancelamento
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Contato</h4>
            <div className="space-y-3 text-sm">
              <div className="flex items-center space-x-2 opacity-90">
                <Phone className="h-4 w-4" />
                <span>+55 92 3232-5050</span>
              </div>
              <div className="flex items-center space-x-2 opacity-90">
                <Mail className="h-4 w-4" />
                <span>contato@pousadasamazonia.com</span>
              </div>
              <div className="flex space-x-4 mt-4">
                <a href="#" className="opacity-90 hover:opacity-100 transition-opacity">
                  <Facebook className="h-5 w-5" />
                </a>
                <a href="#" className="opacity-90 hover:opacity-100 transition-opacity">
                  <Instagram className="h-5 w-5" />
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-primary-foreground/20 mt-8 pt-8 text-center text-sm opacity-80">
          <p>&copy; 2025 Pousadas Amazônia. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
