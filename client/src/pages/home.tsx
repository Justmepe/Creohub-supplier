import { useState, useEffect } from "react";
import { Link } from "wouter";
import logoPath from "@assets/Logo_1749474304178.png";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Rocket, 
  Play, 
  Smartphone, 
  Globe, 
  TrendingUp, 
  Palette, 
  BarChart3, 
  Link as LinkIcon,
  Upload,
  Users,
  Mail,
  Truck,
  CreditCard,
  Building2,
  Star,
  ArrowRight,
  Check,
  X
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import CreatorOnboarding from "@/components/forms/creator-onboarding";
import PlatformDemo from "@/components/demo/platform-demo";
import { detectCurrencyFromBrowser, formatCurrency, convertCurrency } from "@/../../shared/currency";

export default function Home() {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showDemo, setShowDemo] = useState(false);
  const [detectedCurrency, setDetectedCurrency] = useState('USD');

  useEffect(() => {
    const currency = detectCurrencyFromBrowser();
    setDetectedCurrency(currency);
  }, []);

  const formatPrice = (usdPrice: number) => {
    const convertedPrice = convertCurrency(usdPrice, 'USD', detectedCurrency);
    return formatCurrency(convertedPrice, detectedCurrency);
  };

  const features = [
    {
      icon: <Smartphone className="h-8 w-8 text-primary" />,
      title: "M-Pesa Integration",
      description: "Accept local payments seamlessly with M-Pesa and other mobile money solutions"
    },
    {
      icon: <Palette className="h-8 w-8 text-secondary" />,
      title: "Custom Storefronts",
      description: "Design beautiful, branded storefronts that reflect your unique style"
    },
    {
      icon: <BarChart3 className="h-8 w-8 text-accent" />,
      title: "Sales Analytics",
      description: "Track performance, understand customers, and grow your business"
    },
    {
      icon: <LinkIcon className="h-8 w-8 text-purple-600" />,
      title: "Link in Bio",
      description: "Share your entire store through one powerful link across all platforms"
    }
  ];

  const storefronts = [
    {
      name: "Sarah's Learning Hub",
      category: "Digital Course Creator",
      gradient: "from-purple-50 to-pink-50",
      icon: "🎓",
      products: [
        { name: "Web Development Course", price: "KES 2,500" },
        { name: "1-on-1 Coaching", price: "KES 1,200/hr" }
      ]
    },
    {
      name: "Kevo's Merch Store",
      category: "Fashion & Lifestyle",
      gradient: "from-green-50 to-blue-50",
      icon: "👕",
      products: [
        { name: "Ankara Print Hoodie", price: "KES 3,500" },
        { name: "Custom T-Shirt Design", price: "KES 1,800" }
      ]
    },
    {
      name: "Grace Business Hub",
      category: "Business Consultant",
      gradient: "from-yellow-50 to-orange-50",
      icon: "🤝",
      products: [
        { name: "Business Plan Review", price: "KES 5,000" },
        { name: "Strategy Session", price: "KES 2,500" }
      ]
    }
  ];

  const payments = [
    { name: "M-Pesa", icon: <Smartphone className="h-8 w-8 text-green-600" />, color: "bg-green-100" },
    { name: "Credit/Debit Cards", icon: <CreditCard className="h-8 w-8 text-blue-600" />, color: "bg-blue-100" },
    { name: "Bank Transfer", icon: <Building2 className="h-8 w-8 text-orange-600" />, color: "bg-orange-100" }
  ];

  const testimonials = [
    {
      quote: "Creohub helped me turn my passion for teaching into a thriving online business. M-Pesa integration was a game-changer!",
      author: "Amara Okafor",
      role: "Digital Course Creator, Nigeria",
      earnings: "₦2M+ in sales",
      avatar: "👩🏾‍💼"
    },
    {
      quote: "From zero to KES 100K in my first month. The platform is intuitive and the payment options are perfect for African customers.",
      author: "David Kimani",
      role: "App Developer, Kenya",
      earnings: "KES 100K+ monthly",
      avatar: "👨🏿‍💻"
    },
    {
      quote: "The customization options let me create a storefront that truly represents my brand. My sales doubled within weeks!",
      author: "Zara Mensah",
      role: "Fashion Designer, Ghana",
      earnings: "₵50K+ monthly",
      avatar: "👩🏾‍🎨"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <img 
                  src={logoPath} 
                  alt="Creohub" 
                  className="h-8 w-8"
                />
                <h1 className="text-2xl font-bold text-primary">Creohub</h1>
              </div>
              <div className="hidden md:flex items-baseline space-x-4 ml-10">
                <a href="#features" className="text-neutral hover:text-primary px-3 py-2 rounded-md text-sm font-medium">Features</a>
                <a href="#pricing" className="text-neutral hover:text-primary px-3 py-2 rounded-md text-sm font-medium">Pricing</a>
                <a href="#creators" className="text-neutral hover:text-primary px-3 py-2 rounded-md text-sm font-medium">For Creators</a>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/auth">
                <Button variant="ghost" className="text-neutral hover:text-primary font-medium">
                  Sign In
                </Button>
              </Link>
              <Dialog open={showOnboarding} onOpenChange={setShowOnboarding}>
                <DialogTrigger asChild>
                  <Button className="bg-primary hover:bg-primary/90 text-white">
                    Start Free
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Create Your Creator Account</DialogTitle>
                  </DialogHeader>
                  <CreatorOnboarding onComplete={() => setShowOnboarding(false)} />
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-gradient py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <h1 className="text-4xl lg:text-6xl font-bold text-neutral leading-tight">
                  Your Creator
                  <span className="text-primary block">Commerce Hub</span>
                </h1>
                <p className="text-xl text-gray-600 leading-relaxed">
                  Sell digital products, physical merchandise, and services from one powerful link. Built for African creators, designed for global success.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Dialog open={showOnboarding} onOpenChange={setShowOnboarding}>
                  <DialogTrigger asChild>
                    <Button className="bg-primary hover:bg-primary/90 text-white px-8 py-4 rounded-xl font-semibold text-lg h-auto">
                      <Rocket className="mr-2 h-5 w-5" />
                      Launch Your Store
                    </Button>
                  </DialogTrigger>
                </Dialog>
                <Button 
                  variant="outline" 
                  className="border-2 border-neutral text-neutral hover:bg-neutral hover:text-white px-8 py-4 rounded-xl font-semibold text-lg h-auto"
                  onClick={() => setShowDemo(true)}
                >
                  <Play className="mr-2 h-5 w-5" />
                  Watch Demo
                </Button>
              </div>

              <div className="flex items-center space-x-6 pt-4">
                <div className="flex items-center space-x-2">
                  <Smartphone className="h-5 w-5 text-secondary" />
                  <span className="text-sm font-medium text-gray-600">M-Pesa Ready</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Globe className="h-5 w-5 text-secondary" />
                  <span className="text-sm font-medium text-gray-600">Global Payments</span>
                </div>
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5 text-secondary" />
                  <span className="text-sm font-medium text-gray-600">Analytics</span>
                </div>
              </div>
            </div>

            <div className="lg:pl-8">
              <div className="relative">
                <img 
                  src="https://images.unsplash.com/photo-1557804506-669a67965ba0?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600" 
                  alt="African entrepreneur using mobile commerce" 
                  className="rounded-2xl shadow-2xl w-full h-auto"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-2xl"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Storefront Preview */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-neutral mb-4">
              Beautiful Storefronts That Convert
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Create stunning, mobile-optimized stores that showcase your products and build your brand
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {storefronts.map((store, index) => (
              <Card key={index} className={`bg-gradient-to-br ${store.gradient} shadow-lg hover:shadow-xl transition-shadow`}>
                <CardHeader>
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="text-2xl">{store.icon}</div>
                    <div>
                      <CardTitle className="text-lg">{store.name}</CardTitle>
                      <CardDescription>{store.category}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {store.products.map((product, idx) => (
                      <div key={idx} className="flex justify-between items-center p-3 bg-white rounded-lg">
                        <span className="text-sm font-medium">{product.name}</span>
                        <span className="text-primary font-bold text-sm">{product.price}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-neutral mb-4">
              Everything You Need to Succeed
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              From payments to analytics, we've got African creators covered
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="text-center hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    {feature.icon}
                  </div>
                  <h3 className="text-lg font-semibold text-neutral mb-2">{feature.title}</h3>
                  <p className="text-gray-600 text-sm">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Dashboard Preview */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div>
                <h2 className="text-3xl lg:text-4xl font-bold text-neutral mb-4">
                  Powerful Creator Dashboard
                </h2>
                <p className="text-xl text-gray-600">
                  Manage your products, track sales, and engage with customers from one beautiful dashboard
                </p>
              </div>

              <div className="space-y-4">
                {[
                  { icon: <Upload className="h-5 w-5 text-primary" />, text: "Easy product upload and management" },
                  { icon: <Users className="h-5 w-5 text-secondary" />, text: "Customer relationship management" },
                  { icon: <Mail className="h-5 w-5 text-accent" />, text: "Email marketing integration" },
                  { icon: <Truck className="h-5 w-5 text-purple-600" />, text: "Order fulfillment tracking" }
                ].map((item, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                      {item.icon}
                    </div>
                    <span className="font-medium text-neutral">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>

            <Card className="bg-gradient-to-br from-gray-900 to-gray-800 text-white shadow-2xl">
              <CardContent className="p-8">
                <img 
                  src="https://images.unsplash.com/photo-1551434678-e076c223a692?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=300" 
                  alt="Modern creator workspace" 
                  className="w-full h-48 object-cover rounded-lg mb-6"
                />

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-primary/20 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-primary">KES 45K</div>
                      <div className="text-sm text-gray-300">This Month</div>
                    </div>
                    <div className="bg-secondary/20 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-secondary">234</div>
                      <div className="text-sm text-gray-300">Total Orders</div>
                    </div>
                  </div>

                  <div className="bg-gray-700 p-4 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-white font-medium">Top Products</span>
                      <TrendingUp className="h-5 w-5 text-accent" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-300">Web Dev Course</span>
                        <span className="text-white">45 sales</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-300">Design Consultation</span>
                        <span className="text-white">28 sales</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Payment Methods */}
      <section className="py-16 bg-gradient-to-r from-primary/5 to-secondary/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-neutral mb-4">
              Accept Payments Your Way
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              From M-Pesa to global cards, support every customer with flexible payment options
            </p>
          </div>

          <div className="flex justify-center mb-12">
            <img 
              src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400" 
              alt="Mobile payment interface" 
              className="rounded-2xl shadow-xl max-w-2xl w-full h-auto"
            />
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {payments.map((payment, index) => (
              <Card key={index} className="text-center">
                <CardContent className="pt-6">
                  <div className={`w-16 h-16 ${payment.color} rounded-full flex items-center justify-center mx-auto mb-4`}>
                    {payment.icon}
                  </div>
                  <h3 className="font-semibold text-neutral mb-2">{payment.name}</h3>
                  <p className="text-gray-600 text-sm">
                    {payment.name === "M-Pesa" && "Instant mobile money payments for East African customers"}
                    {payment.name === "Credit/Debit Cards" && "Secure card payments with international support"}
                    {payment.name === "Bank Transfer" && "Direct bank transfers for larger transactions"}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-neutral mb-4">
              Simple, Creator-Friendly Pricing
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Start free, scale when you're ready. No hidden fees, no surprises.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Free Plan */}
            <Card className="border-2 border-gray-200">
              <CardHeader className="pb-6">
                <CardTitle className="text-2xl">Free</CardTitle>
                <div className="mb-4">
                  <span className="text-4xl font-bold text-neutral">Free</span>
                  <span className="text-gray-600 ml-2">14-day trial</span>
                </div>
                <CardDescription>Perfect for getting started</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center space-x-3">
                    <Check className="h-5 w-5 text-secondary" />
                    <span className="text-gray-700">Basic storefront customization</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <Check className="h-5 w-5 text-secondary" />
                    <span className="text-gray-700">Up to 3 products</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <Check className="h-5 w-5 text-secondary" />
                    <span className="text-gray-700">Accept payments</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <Check className="h-5 w-5 text-secondary" />
                    <span className="text-gray-700">Basic analytics</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <Check className="h-5 w-5 text-secondary" />
                    <span className="text-gray-700">M-Pesa + card payments</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <X className="h-5 w-5 text-gray-400" />
                    <span className="text-gray-500">10% transaction fee</span>
                  </li>
                </ul>
                <Button variant="outline" className="w-full">
                  Start Free Trial
                </Button>
              </CardContent>
            </Card>

            {/* Starter Plan */}
            <Card className="border-2 border-primary relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-primary text-white">
                  Most Popular
                </Badge>
              </div>

              <CardHeader className="pb-6">
                <CardTitle className="text-2xl">Starter</CardTitle>
                <div className="mb-4">
                  <span className="text-4xl font-bold text-neutral">{formatPrice(14.99)}</span>
                  <span className="text-gray-600 ml-2">/month</span>
                </div>
                <CardDescription>For growing creators</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center space-x-3">
                    <Check className="h-5 w-5 text-primary" />
                    <span className="text-gray-700">Up to 25 products</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <Check className="h-5 w-5 text-primary" />
                    <span className="text-gray-700">Email capture & basic CRM</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <Check className="h-5 w-5 text-primary" />
                    <span className="text-gray-700">Custom domain support</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <Check className="h-5 w-5 text-primary" />
                    <span className="text-gray-700">Enhanced analytics</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <Check className="h-5 w-5 text-primary" />
                    <span className="text-gray-700">Limited marketing tools</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <X className="h-5 w-5 text-gray-400" />
                    <span className="text-gray-500">5% transaction fee</span>
                  </li>
                </ul>
                <Button className="w-full">
                  Upgrade to Starter
                </Button>
              </CardContent>
            </Card>

            {/* Pro Plan */}
            <Card className="border-2 border-purple-200">
              <CardHeader className="pb-6">
                <CardTitle className="text-2xl">Pro</CardTitle>
                <div className="mb-4">
                  <span className="text-4xl font-bold text-neutral">{formatPrice(29.99)}</span>
                  <span className="text-gray-600 ml-2">/month</span>
                </div>
                <CardDescription>For professional creators</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center space-x-3">
                    <Check className="h-5 w-5 text-purple-600" />
                    <span className="text-gray-700">Unlimited products</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <Check className="h-5 w-5 text-purple-600" />
                    <span className="text-gray-700">Advanced analytics & reports</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <Check className="h-5 w-5 text-purple-600" />
                    <span className="text-gray-700">Full marketing suite</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <Check className="h-5 w-5 text-purple-600" />
                    <span className="text-gray-700">Priority support</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <Check className="h-5 w-5 text-purple-600" />
                    <span className="text-gray-700">Multi-currency pricing</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <Check className="h-5 w-5 text-purple-600" />
                    <span className="text-gray-700 font-semibold">0% transaction fees</span>
                  </li>
                </ul>
                <Button variant="outline" className="w-full border-purple-200 text-purple-600 hover:bg-purple-50">
                  Upgrade to Pro
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="creators" className="py-16 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
              Join Thousands of African Creators
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              From Lagos to Nairobi, creators are building their businesses with Creohub
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="bg-gray-800 border-gray-700">
                <CardContent className="pt-6">
                  <div className="text-center mb-4">
                    <div className="text-4xl mb-2">{testimonial.avatar}</div>
                    <div className="flex justify-center mb-2">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 text-yellow-400 fill-current" />
                      ))}
                    </div>
                  </div>
                  <blockquote className="text-center mb-4 text-gray-300">
                    "{testimonial.quote}"
                  </blockquote>
                  <div className="text-center">
                    <div className="font-semibold text-white">{testimonial.author}</div>
                    <div className="text-sm text-gray-400">{testimonial.role}</div>
                    <div className="text-secondary font-semibold mt-2">{testimonial.earnings}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 gradient-primary text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="space-y-6">
            <h2 className="text-3xl lg:text-5xl font-bold">
              Ready to Launch Your Creator Business?
            </h2>
            <p className="text-xl lg:text-2xl opacity-90 max-w-2xl mx-auto">
              Join the creator economy revolution. Start selling your products, services, and expertise today.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
              <Dialog open={showOnboarding} onOpenChange={setShowOnboarding}>
                <DialogTrigger asChild>
                  <Button className="bg-white text-primary hover:bg-gray-100 px-8 py-4 rounded-xl font-semibold text-lg h-auto">
                    <Rocket className="mr-2 h-5 w-5" />
                    Start Your Free Store
                  </Button>
                </DialogTrigger>
              </Dialog>
              <Button variant="outline" className="border-2 border-white text-white hover:bg-white hover:text-primary px-8 py-4 rounded-xl font-semibold text-lg h-auto">
                <ArrowRight className="mr-2 h-5 w-5" />
                Schedule Demo
              </Button>
            </div>

            <div className="pt-8 grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div className="flex flex-col items-center">
                <div className="text-2xl font-bold">15,000+</div>
                <div className="text-sm opacity-80">Creators Registered</div>
              </div>
              <div className="flex flex-col items-center">
                <div className="text-2xl font-bold">$800K+</div>
                <div className="text-sm opacity-80">Platform Sales Volume</div>
              </div>
              <div className="flex flex-col items-center">
                <div className="text-2xl font-bold">20+</div>
                <div className="text-sm opacity-80">Countries Supported</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-neutral text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="mb-4">
                <h3 className="text-2xl font-bold text-primary">Creohub</h3>
                <p className="text-gray-300 mt-2 max-w-md">
                  Empowering African creators to build, sell, and scale their digital businesses. From Kenya to the world.
                </p>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-300">
                <li><a href="#features" className="hover:text-primary transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-primary transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Templates</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Integrations</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-300">
                <li><a href="#" className="hover:text-primary transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Contact Us</a></li>
                <li><a href="#creators" className="hover:text-primary transition-colors">Creator Stories</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Blog</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-700 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
            <div className="text-gray-400 text-sm">
              © 2024 Creohub. All rights reserved. Made with ❤️ in Africa.
            </div>
            <div className="flex space-x-6 text-sm text-gray-400 mt-4 md:mt-0">
              <a href="#" className="hover:text-primary transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-primary transition-colors">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>

      {/* Demo Modal */}
      {showDemo && (
        <PlatformDemo onClose={() => setShowDemo(false)} />
      )}
    </div>
  );
}