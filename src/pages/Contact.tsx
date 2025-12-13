import { useState } from "react";
import { useTranslation } from "react-i18next";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Mail, Phone, MapPin, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const Contact = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from("contact_messages").insert([
        {
          name: formData.name,
          email: formData.email,
          phone: formData.phone || null,
          message: formData.message,
        },
      ]);

      if (error) throw error;

      toast.success("Mensagem enviada! Entraremos em contato em breve.");
      setFormData({ name: "", email: "", phone: "", message: "" });
    } catch (error: any) {
      toast.error("Erro ao enviar mensagem. Tente novamente.");
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <section className="pt-24 sm:pt-32 pb-12 sm:pb-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8 sm:mb-12">
            <h1 className="text-3xl sm:text-4xl md:text-6xl font-display font-bold text-foreground mb-4 sm:mb-6">Entre em Contato</h1>
            <p className="text-base sm:text-lg text-muted-foreground max-w-3xl mx-auto">
              Nossa equipe está pronta para ajudar você a planejar sua experiência perfeita na Amazônia. Entre em
              contato conosco!
            </p>
          </div>

          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
            {/* Contact Info */}
            <div className="space-y-4 sm:space-y-6">
              <Card>
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-start space-x-3 sm:space-x-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-forest flex items-center justify-center flex-shrink-0">
                      <Phone className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-1 sm:mb-2">Telefone</h3>
                      <p className="text-xs sm:text-sm text-muted-foreground">WhatsApp: +55 92 9 8412-5475</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-start space-x-3 sm:space-x-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-forest flex items-center justify-center flex-shrink-0">
                      <Mail className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-1 sm:mb-2">E-mail</h3>
                      <p className="text-xs sm:text-sm text-muted-foreground break-all sm:break-normal">administrativo@pousadararazul.com</p>
                      <p className="text-xs sm:text-sm text-muted-foreground break-all sm:break-normal">reservas@pousadararazul.com</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-start space-x-3 sm:space-x-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-forest flex items-center justify-center flex-shrink-0">
                      <MapPin className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-1 sm:mb-2">Endereço</h3>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        A MARGEM ESQUERDA DO LAGO ACAJATUBA, S/N
                        <br />
                        AREA RURAL DE MANACAPURU, MANAUS - AM
                        <br />
                        CEP: 69.409-899
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-forest text-white">
                <CardContent className="p-4 sm:p-6">
                  <h3 className="font-semibold mb-1 sm:mb-2">Horário de Atendimento</h3>
                  <p className="text-xs sm:text-sm opacity-90">Segunda a Sexta: 8h - 18h</p>
                  <p className="text-xs sm:text-sm opacity-90">Sábado: 9h - 14h</p>
                  <p className="text-xs sm:text-sm opacity-90">Domingo: 9h - 14h</p>
                </CardContent>
              </Card>
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-2">
              <Card>
                <CardContent className="p-4 sm:p-6 lg:p-8">
                  <h2 className="text-xl sm:text-2xl font-display font-semibold mb-4 sm:mb-6 text-foreground">Envie sua Mensagem</h2>
                  <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium mb-2">
                        Nome Completo
                      </label>
                      <Input
                        id="name"
                        name="name"
                        type="text"
                        required
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Seu nome"
                      />
                    </div>

                    <div>
                      <label htmlFor="email" className="block text-sm font-medium mb-2">
                        E-mail
                      </label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="seu@email.com"
                      />
                    </div>

                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium mb-2">
                        Telefone (opcional)
                      </label>
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="+55 (92) 99999-0000"
                      />
                    </div>

                    <div>
                      <label htmlFor="message" className="block text-sm font-medium mb-2">
                        Mensagem
                      </label>
                      <Textarea
                        id="message"
                        name="message"
                        required
                        value={formData.message}
                        onChange={handleChange}
                        placeholder="Como podemos ajudá-lo?"
                        rows={5}
                        className="min-h-[120px] sm:min-h-[150px]"
                      />
                    </div>

                    <Button type="submit" className="w-full bg-gradient-forest hover:opacity-90 h-11 sm:h-12 text-base sm:text-lg">
                      <Send className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                      Enviar Mensagem
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Contact;
