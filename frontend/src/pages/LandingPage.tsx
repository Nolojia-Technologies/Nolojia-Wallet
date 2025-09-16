import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Wallet,
  Send,
  Download,
  Shield,
  Users,
  TrendingUp,
  CheckCircle,
  Star,
  ArrowRight,
  Phone,
  Mail,
  MapPin,
  Menu,
  X,
  Coins,
  Lock,
  Receipt,
  HeadphonesIcon,
  History,
  Globe,
  CreditCard,
  Smartphone,
  Banknote,
  PiggyBank,
  Calculator,
  Clock,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function LandingPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const features = [
    {
      icon: Send,
      title: "Send Money",
      description: "Transfer money instantly to anyone, anywhere in Kenya with low fees and real-time notifications.",
      color: "text-blue-600"
    },
    {
      icon: Download,
      title: "Receive Money",
      description: "Get paid quickly with QR codes, phone numbers, or custom payment links.",
      color: "text-green-600"
    },
    {
      icon: Lock,
      title: "Escrow Services",
      description: "Secure transactions for business deals, freelance work, and marketplace purchases.",
      color: "text-purple-600"
    },
    {
      icon: Coins,
      title: "Community Finance",
      description: "Join Chamas, participate in group savings, and access peer-to-peer lending.",
      color: "text-orange-600"
    },
    {
      icon: Receipt,
      title: "Digital Receipts",
      description: "Generate, store, and manage digital receipts for all your transactions.",
      color: "text-indigo-600"
    },
    {
      icon: Users,
      title: "Payroll Management",
      description: "Streamline employee payments with bulk transfers and automated scheduling.",
      color: "text-red-600"
    },
    {
      icon: Shield,
      title: "Fraud Protection",
      description: "Advanced fraud detection, user verification, and trust scoring system.",
      color: "text-yellow-600"
    },
    {
      icon: History,
      title: "Transaction History",
      description: "Complete transaction tracking with detailed analytics and export options.",
      color: "text-cyan-600"
    }
  ]

  const stats = [
    { number: "50K+", label: "Active Users" },
    { number: "KES 2B+", label: "Transactions Processed" },
    { number: "99.9%", label: "Uptime" },
    { number: "24/7", label: "Customer Support" }
  ]

  const testimonials = [
    {
      name: "Sarah Wanjiku",
      role: "Small Business Owner",
      content: "Nolojia Wallet has revolutionized how I handle my business payments. The escrow feature gives my customers confidence, and I've seen a 40% increase in sales.",
      rating: 5,
      avatar: "SW"
    },
    {
      name: "David Kiprotich",
      role: "Freelance Developer",
      content: "The peer-to-peer lending feature helped me get quick funding for my project. The transparent terms and trust scoring system made everything smooth.",
      rating: 5,
      avatar: "DK"
    },
    {
      name: "Grace Mutua",
      role: "Chama Secretary",
      content: "Managing our Chama contributions has never been easier. The automated tracking and payout system saves us hours every month.",
      rating: 5,
      avatar: "GM"
    }
  ]

  const pricingPlans = [
    {
      name: "Personal",
      price: "Free",
      description: "Perfect for individual users",
      features: [
        "Send/Receive money",
        "Basic fraud protection",
        "Transaction history",
        "Customer support",
        "Up to KES 100K/month"
      ],
      popular: false
    },
    {
      name: "Business",
      price: "KES 2,500",
      period: "/month",
      description: "For growing businesses",
      features: [
        "Everything in Personal",
        "Payroll management",
        "Digital receipts",
        "Bulk transactions",
        "Up to KES 5M/month",
        "Priority support"
      ],
      popular: true
    },
    {
      name: "Enterprise",
      price: "Custom",
      description: "For large organizations",
      features: [
        "Everything in Business",
        "Custom integrations",
        "Advanced analytics",
        "Dedicated account manager",
        "Unlimited transactions",
        "SLA guarantee"
      ],
      popular: false
    }
  ]

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center space-x-2">
              <div className="bg-kenya-red p-2 rounded-lg">
                <Wallet className="h-8 w-8 text-white" />
              </div>
              <span className="text-2xl font-bold text-gray-900">
                Nolojia Wallet
              </span>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-8">
              <a href="#features" className="text-gray-600 hover:text-gray-900 transition-colors">Features</a>
              <a href="#pricing" className="text-gray-600 hover:text-gray-900 transition-colors">Pricing</a>
              <a href="#about" className="text-gray-600 hover:text-gray-900 transition-colors">About</a>
              <a href="#contact" className="text-gray-600 hover:text-gray-900 transition-colors">Contact</a>
            </nav>

            {/* Auth Buttons */}
            <div className="hidden md:flex items-center space-x-4">
              <Link to="/login">
                <Button variant="ghost">Sign In</Button>
              </Link>
              <Link to="/register">
                <Button className="bg-kenya-red hover:bg-red-700">Get Started</Button>
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </Button>
            </div>
          </div>

          {/* Mobile Menu */}
          {isMenuOpen && (
            <div className="md:hidden border-t border-gray-200 py-4">
              <div className="flex flex-col space-y-4">
                <a href="#features" className="text-gray-600 hover:text-gray-900 transition-colors">Features</a>
                <a href="#pricing" className="text-gray-600 hover:text-gray-900 transition-colors">Pricing</a>
                <a href="#about" className="text-gray-600 hover:text-gray-900 transition-colors">About</a>
                <a href="#contact" className="text-gray-600 hover:text-gray-900 transition-colors">Contact</a>
                <div className="flex flex-col space-y-2 pt-4 border-t">
                  <Link to="/login">
                    <Button variant="ghost" className="w-full">Sign In</Button>
                  </Link>
                  <Link to="/register">
                    <Button className="w-full bg-kenya-red hover:bg-red-700">Get Started</Button>
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-kenya-red to-red-700 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              The Future of
              <span className="block text-yellow-300">Digital Payments</span>
              in Kenya
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-red-100 max-w-3xl mx-auto">
              Send money, manage finances, build communities, and grow your business with Kenya's most trusted digital wallet platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/register">
                <Button size="lg" className="bg-white text-kenya-red hover:bg-gray-100 text-lg px-8 py-4">
                  Start Free Today
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-kenya-red text-lg px-8 py-4">
                Watch Demo
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-kenya-red mb-2">
                  {stat.number}
                </div>
                <div className="text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Everything You Need in One Wallet
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              From simple money transfers to complex business operations, Nolojia Wallet provides all the financial tools you need to succeed.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className={`w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center mb-4`}>
                      <Icon className={`h-6 w-6 ${feature.color}`} />
                    </div>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-gray-600">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600">
              Getting started with Nolojia Wallet is simple and secure
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-kenya-red rounded-full flex items-center justify-center mx-auto mb-4">
                <Smartphone className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">1. Sign Up</h3>
              <p className="text-gray-600">
                Create your account in minutes with just your phone number and basic information.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-kenya-red rounded-full flex items-center justify-center mx-auto mb-4">
                <CreditCard className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">2. Add Funds</h3>
              <p className="text-gray-600">
                Link your bank account or M-Pesa to add money to your digital wallet securely.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-kenya-red rounded-full flex items-center justify-center mx-auto mb-4">
                <Banknote className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">3. Start Transacting</h3>
              <p className="text-gray-600">
                Send money, pay bills, join Chamas, or start your business journey with us.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              What Our Users Say
            </h2>
            <p className="text-xl text-gray-600">
              Join thousands of satisfied customers across Kenya
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="bg-white">
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    {Array.from({ length: testimonial.rating }).map((_, i) => (
                      <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-gray-600 mb-4">"{testimonial.content}"</p>
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-kenya-red rounded-full flex items-center justify-center text-white font-semibold mr-4">
                      {testimonial.avatar}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">{testimonial.name}</div>
                      <div className="text-sm text-gray-600">{testimonial.role}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-gray-600">
              Choose the plan that fits your needs. No hidden fees.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {pricingPlans.map((plan, index) => (
              <Card key={index} className={`relative ${plan.popular ? 'border-kenya-red shadow-lg scale-105' : ''}`}>
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-kenya-red text-white px-4 py-1 rounded-full text-sm">
                      Most Popular
                    </span>
                  </div>
                )}
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <div className="text-3xl font-bold text-kenya-red">
                    {plan.price}
                    {plan.period && <span className="text-lg text-gray-600">{plan.period}</span>}
                  </div>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center">
                        <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                        <span className="text-gray-600">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    className={`w-full ${plan.popular ? 'bg-kenya-red hover:bg-red-700' : 'bg-gray-900 hover:bg-gray-800'}`}
                  >
                    {plan.name === 'Personal' ? 'Get Started Free' : 'Contact Sales'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Built for Kenya, by Kenyans
              </h2>
              <p className="text-lg text-gray-600 mb-6">
                Nolojia Wallet was founded with a simple mission: to make financial services accessible, affordable, and secure for every Kenyan. We understand the unique challenges and opportunities in our market.
              </p>
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="w-6 h-6 bg-kenya-red rounded-full flex items-center justify-center mt-1 mr-4">
                    <CheckCircle className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Local Understanding</h3>
                    <p className="text-gray-600">Built with deep knowledge of Kenyan financial culture and needs.</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="w-6 h-6 bg-kenya-red rounded-full flex items-center justify-center mt-1 mr-4">
                    <CheckCircle className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Community First</h3>
                    <p className="text-gray-600">Designed to strengthen communities through shared financial goals.</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="w-6 h-6 bg-kenya-red rounded-full flex items-center justify-center mt-1 mr-4">
                    <CheckCircle className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Innovation Focus</h3>
                    <p className="text-gray-600">Continuously evolving with cutting-edge technology and user feedback.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-kenya-red to-red-700 rounded-2xl p-8 text-white">
              <div className="grid grid-cols-2 gap-6">
                <div className="text-center">
                  <PiggyBank className="h-12 w-12 mx-auto mb-4" />
                  <div className="text-2xl font-bold">KES 50M+</div>
                  <div className="text-red-200">Saved in Chamas</div>
                </div>
                <div className="text-center">
                  <Users className="h-12 w-12 mx-auto mb-4" />
                  <div className="text-2xl font-bold">500+</div>
                  <div className="text-red-200">Active Chamas</div>
                </div>
                <div className="text-center">
                  <Calculator className="h-12 w-12 mx-auto mb-4" />
                  <div className="text-2xl font-bold">10K+</div>
                  <div className="text-red-200">Loans Facilitated</div>
                </div>
                <div className="text-center">
                  <Clock className="h-12 w-12 mx-auto mb-4" />
                  <div className="text-2xl font-bold">&lt; 30s</div>
                  <div className="text-red-200">Avg Transfer Time</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-kenya-red text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Transform Your Financial Life?
          </h2>
          <p className="text-xl text-red-100 mb-8 max-w-2xl mx-auto">
            Join thousands of Kenyans who are already using Nolojia Wallet to send money, build wealth, and grow their businesses.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register">
              <Button size="lg" className="bg-white text-kenya-red hover:bg-gray-100 text-lg px-8 py-4">
                Create Free Account
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-kenya-red text-lg px-8 py-4">
              <Phone className="mr-2 h-5 w-5" />
              Call Sales: +254 700 123 456
            </Button>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Get In Touch
            </h2>
            <p className="text-xl text-gray-600">
              We're here to help you succeed. Reach out to us anytime.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Contact Information</h3>
              <div className="space-y-6">
                <div className="flex items-start">
                  <Phone className="h-6 w-6 text-kenya-red mr-4 mt-1" />
                  <div>
                    <div className="font-semibold text-gray-900">Phone</div>
                    <div className="text-gray-600">+254 700 123 456</div>
                    <div className="text-gray-600">+254 733 987 654</div>
                  </div>
                </div>
                <div className="flex items-start">
                  <Mail className="h-6 w-6 text-kenya-red mr-4 mt-1" />
                  <div>
                    <div className="font-semibold text-gray-900">Email</div>
                    <div className="text-gray-600">support@nolojia.com</div>
                    <div className="text-gray-600">sales@nolojia.com</div>
                  </div>
                </div>
                <div className="flex items-start">
                  <MapPin className="h-6 w-6 text-kenya-red mr-4 mt-1" />
                  <div>
                    <div className="font-semibold text-gray-900">Address</div>
                    <div className="text-gray-600">Nolojia Plaza, Westlands</div>
                    <div className="text-gray-600">Nairobi, Kenya</div>
                  </div>
                </div>
                <div className="flex items-start">
                  <Clock className="h-6 w-6 text-kenya-red mr-4 mt-1" />
                  <div>
                    <div className="font-semibold text-gray-900">Support Hours</div>
                    <div className="text-gray-600">24/7 Customer Support</div>
                    <div className="text-gray-600">Live Chat Available</div>
                  </div>
                </div>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Send us a Message</CardTitle>
                <CardDescription>
                  Fill out the form below and we'll get back to you within 24 hours.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input id="firstName" placeholder="John" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input id="lastName" placeholder="Doe" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" placeholder="john@example.com" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input id="phone" placeholder="+254 712 345 678" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="message">Message</Label>
                    <textarea
                      id="message"
                      rows={4}
                      className="w-full p-3 border rounded-md resize-none"
                      placeholder="Tell us how we can help you..."
                    />
                  </div>
                  <Button className="w-full bg-kenya-red hover:bg-red-700">
                    Send Message
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="bg-kenya-red p-2 rounded-lg">
                  <Wallet className="h-6 w-6 text-white" />
                </div>
                <span className="text-xl font-bold">Nolojia Wallet</span>
              </div>
              <p className="text-gray-400 mb-4">
                Kenya's most trusted digital wallet platform for individuals and businesses.
              </p>
              <div className="flex space-x-4">
                <Globe className="h-5 w-5 text-gray-400" />
                <Mail className="h-5 w-5 text-gray-400" />
                <Phone className="h-5 w-5 text-gray-400" />
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Products</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Personal Wallet</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Business Solutions</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Community Finance</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Escrow Services</a></li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Press</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Security</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 Nolojia Wallet. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}