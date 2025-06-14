import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageCircle, X, Send, Bot, User } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface Message {
  id: string;
  text: string;
  sender: "user" | "bot";
  timestamp: Date;
  suggestedQuestions?: string[];
}

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: "Hi! 👋 I'm here to help you get started with Creohub. What would you like to know?",
      sender: "bot",
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const predefinedResponses = {
    pricing: "Creohub offers 3 plans:\n\n• **Free Trial** (14 days): 10% platform fee\n• **Starter** ($14.99/month): 5% platform fee\n• **Pro** ($29.99/month): 0% platform fee\n\nAll plans include unlimited products, custom storefront, and analytics!",
    
    setup: "Getting started is easy:\n\n1. **Sign up** for your free 14-day trial\n2. **Create your creator profile** with your brand\n3. **Upload your first product** (digital or physical)\n4. **Customize your storefront** with themes\n5. **Share your store link** and start selling!\n\nNeed help with any step?",
    
    payments: "We support multiple African payment methods:\n\n• **Pesapal** - Pan-African payment gateway\n• **M-Pesa** - Mobile money (Kenya, Tanzania, etc.)\n• **Stripe** - International credit/debit cards\n• **Flutterwave** - African banks and mobile money\n\nEarnings are deposited directly to your bank account!",
    
    features: "Creohub includes everything you need:\n\n✅ **Unlimited Products** - Digital & physical\n✅ **Custom Storefront** - Your brand, your way\n✅ **Analytics Dashboard** - Track sales & customers\n✅ **Affiliate Program** - Let others promote your products\n✅ **Theme Customization** - Colors and branding\n✅ **Email Verification** - Secure customer accounts\n✅ **Mobile Responsive** - Works on all devices",
    
    support: "I can answer most questions about Creohub! Try asking me about:\n\n• Pricing plans and fees\n• Getting started guide\n• Payment methods and countries\n• Platform features\n• Free trial details\n\nIf I can't help with your specific question, I'll connect you with our support team at **support@creohub.io**\n\nWhat would you like to know?",
    
    trial: "Your **14-day free trial** includes:\n\n• Full access to all features\n• Upload unlimited products\n• Custom storefront setup\n• Analytics dashboard\n• 10% platform fee on sales\n\nNo credit card required to start! Ready to begin your creator journey?",
    
    countries: "Yes! Creohub welcomes creators from all African countries including:\n\n🇿🇦 **South Africa** - ZAR support, local banks, Flutterwave\n🇰🇪 **Kenya** - M-Pesa, KES, local banking\n🇳🇬 **Nigeria** - Naira, local banks, Flutterwave\n🇬🇭 **Ghana** - Cedis, mobile money, local banking\n🇺🇬 **Uganda** - UGX, mobile money integration\n\n+ All other African countries with full platform access, local currency support, and African payment methods!",
    
    affiliate: "**Affiliate Program** lets others promote your products:\n\n• Set commission rates (5-50%)\n• Generate unique affiliate links\n• Track sales and commissions\n• Automatic payouts to affiliates\n• Expand your reach across Africa\n\nAffiliate marketers earn when they refer customers to your products!",
    
    withdrawal: "**Earnings & Withdrawals:**\n\n• Minimum withdrawal: $10 USD equivalent\n• Processing time: 3-5 business days\n• Supported methods: Bank transfer, mobile money\n• Admin approval required for security\n• Track earnings in your dashboard\n• Monthly payout statements available\n\nEarnings are calculated after platform fees!",
    
    digital: "**Digital Products** - Perfect for creators:\n\n• eBooks, courses, software\n• Music, videos, templates\n• Instant delivery after purchase\n• No shipping costs\n• Global reach\n• Higher profit margins\n\nUpload once, sell unlimited copies!",
    
    physical: "**Physical Products** - Ship anywhere:\n\n• Manage inventory levels\n• Set shipping rates by region\n• Print shipping labels\n• Track deliveries\n• Handle returns/refunds\n• Integration with local couriers\n\nPerfect for handmade goods, books, merchandise!",
  };

  const getBotResponse = (userMessage: string): string => {
    const message = userMessage.toLowerCase().trim();
    
    // Pricing related
    if (message.includes("price") || message.includes("cost") || message.includes("plan") || message.includes("subscription")) {
      return predefinedResponses.pricing;
    }
    
    // Getting started
    if (message.includes("start") || message.includes("begin") || message.includes("setup") || 
        (message.includes("how") && (message.includes("create") || message.includes("make") || message.includes("build")))) {
      return predefinedResponses.setup;
    }
    
    // Payment methods
    if (message.includes("payment") || message.includes("money") || message.includes("pay") || 
        message.includes("mpesa") || message.includes("pesapal") || message.includes("stripe") || message.includes("flutterwave")) {
      return predefinedResponses.payments;
    }
    
    // Features - more specific matching
    if (message.includes("feature") || message.includes("include") || message.includes("benefit") || 
        (message.includes("what") && (message.includes("get") || message.includes("offer") || message.includes("include")))) {
      return predefinedResponses.features;
    }
    
    // Support
    if (message.includes("help") || message.includes("support") || message.includes("contact") || message.includes("email")) {
      return predefinedResponses.support;
    }
    
    // Free trial
    if (message.includes("trial") || message.includes("free")) {
      return predefinedResponses.trial;
    }
    
    // Country/region specific questions
    if (message.includes("south africa") || message.includes("kenya") || message.includes("nigeria") || 
        message.includes("ghana") || message.includes("uganda") || message.includes("country") || 
        message.includes("accept") || message.includes("available") || message.includes("from")) {
      return predefinedResponses.countries;
    }
    
    // Affiliate program questions
    if (message.includes("affiliate") || message.includes("referral") || message.includes("commission") || 
        message.includes("promote") || message.includes("marketing")) {
      return predefinedResponses.affiliate;
    }
    
    // Withdrawal and earnings questions
    if (message.includes("withdrawal") || message.includes("withdraw") || message.includes("payout") || 
        message.includes("earning") || message.includes("money") || message.includes("bank")) {
      return predefinedResponses.withdrawal;
    }
    
    // Digital products questions
    if (message.includes("digital") || message.includes("ebook") || message.includes("course") || 
        message.includes("software") || message.includes("download")) {
      return predefinedResponses.digital;
    }
    
    // Physical products questions
    if (message.includes("physical") || message.includes("shipping") || message.includes("delivery") || 
        message.includes("inventory") || message.includes("product")) {
      return predefinedResponses.physical;
    }
    
    // Greetings
    if (message.includes("hello") || message.includes("hi") || message.includes("hey") || message.includes("good")) {
      return "Hello! Welcome to Creohub. I'm here to help you build your creator business in Africa. What would you like to know about our platform?";
    }
    
    // Thank you responses
    if (message.includes("thank") || message.includes("thanks")) {
      return "You're welcome! Is there anything else you'd like to know about Creohub? I'm here to help with questions about pricing, features, getting started, or our payment methods.";
    }
    
    // User indicates they need human help
    if (message.includes("human") || message.includes("agent") || message.includes("can't help") || 
        message.includes("not helpful") || message.includes("talk to someone")) {
      return "I understand you need human assistance! Please contact our support team at **support@creohub.io** for personalized help. Include details about your specific question or issue, and they'll respond within 24 hours.\n\nIs there anything else I can help you with from our FAQ?";
    }
    
    // Technical/specific issues that need human support
    if (message.includes("bug") || message.includes("error") || message.includes("broken") || 
        message.includes("not working") || message.includes("problem") || message.includes("issue")) {
      return "For technical issues or specific problems, our support team can help you directly. Please email **support@creohub.io** with:\n\n• Description of the issue\n• Steps you tried\n• Screenshots if applicable\n\nThey'll investigate and resolve it quickly!";
    }
    
    // Yes/No responses
    if (message === "yes" || message === "y" || message === "sure") {
      return "Great! What specific aspect of Creohub would you like to learn more about? I can help with pricing, features, setup process, or payment options.";
    }
    
    if (message === "no" || message === "n") {
      return "No problem! Feel free to ask me anything about Creohub whenever you're ready. I'm here to help!";
    }
    
    // FAQ-focused default responses
    const defaultResponses = [
      "I can help you with common questions about Creohub! Try asking about:\n\n• **Pricing** - Plans and fees\n• **Countries** - South Africa, Kenya, Nigeria support\n• **Payments** - M-Pesa, Pesapal, Flutterwave\n• **Products** - Digital vs physical items\n• **Affiliate Program** - Earn commissions\n• **Withdrawals** - How to get paid\n\nWhat would you like to know?",
      
      "I'm your Creohub FAQ assistant! I can answer questions about:\n\n• Getting started and free trial\n• Pricing plans and platform fees\n• African payment methods\n• Platform features and benefits\n• Country availability\n• Affiliate and withdrawal systems\n\nWhat specific topic interests you?",
      
      "Let me help you learn about Creohub! I have answers for:\n\n• **Setup Process** - How to start selling\n• **Payment Options** - African solutions\n• **Product Types** - Digital and physical\n• **Earnings** - Withdrawals and payouts\n• **Country Support** - All African nations\n\nIf I can't answer your question, I'll connect you with our support team!"
    ];
    
    return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
  };

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText("");
    setIsTyping(true);

    // Simulate typing delay
    setTimeout(() => {
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: getBotResponse(inputText),
        sender: "bot",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botResponse]);
      setIsTyping(false);
    }, 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      {/* Chat Button */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg bg-primary hover:bg-primary/90 z-50"
          size="icon"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <Card className="fixed bottom-6 right-6 w-80 h-96 shadow-xl z-50 flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-primary text-primary-foreground rounded-t-lg flex-shrink-0">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Bot className="h-4 w-4" />
              Creohub Assistant
            </CardTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="h-6 w-6 text-primary-foreground hover:bg-primary-foreground/20"
            >
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          
          <CardContent className="flex-1 p-0 flex flex-col min-h-0">
            {/* Messages Area */}
            <ScrollArea className="flex-1 p-4 max-h-64">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg px-3 py-2 text-sm whitespace-pre-line ${
                        message.sender === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        {message.sender === "bot" && (
                          <Bot className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        )}
                        {message.sender === "user" && (
                          <User className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        )}
                        <span>{message.text}</span>
                      </div>
                    </div>
                  </div>
                ))}
                
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-muted rounded-lg px-3 py-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Bot className="h-4 w-4" />
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Input Area */}
            <div className="p-4 border-t flex-shrink-0">
              <div className="flex gap-2">
                <Input
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask me anything about Creohub..."
                  className="flex-1"
                />
                <Button
                  onClick={handleSendMessage}
                  size="icon"
                  disabled={!inputText.trim()}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}