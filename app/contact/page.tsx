import { Mail, Facebook, Instagram } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-linear-to-br from-background to-muted/20 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold tracking-tight mb-4">
            Get in Touch
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            We'd love to hear from you. Reach out through any of the channels
            below.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
            <CardHeader className="text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
                <Mail className="w-6 h-6 text-primary" />
              </div>
              <CardTitle className="text-lg">Email</CardTitle>
              <CardDescription>Send us a message anytime</CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button
                variant="outline"
                className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                asChild
              >
                <a href="mailto:contact@example.com">
                  remindly.business@gmail.com
                </a>
              </Button>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
            <CardHeader className="text-center">
              <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-500/20 transition-colors">
                <Facebook className="w-6 h-6 text-blue-600" />
              </div>
              <CardTitle className="text-lg">Facebook</CardTitle>
              <CardDescription>Follow us on Facebook</CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button
                variant="outline"
                className="w-full group-hover:bg-blue-600 group-hover:text-white transition-colors"
                asChild
              >
                <a
                  href="https://www.facebook.com/danieljhon.bancale.2025"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  @yourpage
                </a>
              </Button>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
            <CardHeader className="text-center">
              <div className="w-12 h-12 bg-linear-to-br from-purple-500/10 to-pink-500/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:from-purple-500/20 group-hover:to-pink-500/20 transition-colors">
                <Instagram className="w-6 h-6 text-foreground" />
              </div>
              <CardTitle className="text-lg">Instagram</CardTitle>
              <CardDescription>Follow our journey</CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button
                variant="outline"
                className="w-full group-hover:bg-linear-to-r group-hover:from-purple-600 group-hover:to-pink-600 group-hover:text-white transition-all"
                asChild
              >
                <a
                  href="https://instagram.com/yourprofile"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  @yourprofile
                </a>
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-muted/30">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Send us a Message</CardTitle>
            <CardDescription>
              Fill out the form below and we'll get back to you soon.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">
                Contact form coming soon! For now, please use one of the contact
                methods above.
              </p>
              <Button asChild>
                <a href="mailto:contact@example.com">
                  <Mail className="w-4 h-4 mr-2" />
                  Send us an email
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
