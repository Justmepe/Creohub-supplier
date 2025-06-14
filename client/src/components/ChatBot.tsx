import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageCircle, X, Send, Bot, User } from "lucide-react";

interface Message {
  id: string;
  text: string;
  sender: "user" | "bot";
  timestamp: Date;
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
    
    support: "I'm here to help! For additional support:\n\n📧 **Email**: support@creohub.com\n💬 **Live Chat**: Available 9AM-6PM EAT\n📚 **Documentation**: Check our help center\n🎥 **Video Tutorials**: Coming soon!\n\nWhat specific question can I answer for you?",
    
    trial: "Your **14-day free trial** includes:\n\n• Full access to all features\n• Upload unlimited products\n• Custom storefront setup\n• Analytics dashboard\n• 10% platform fee on sales\n\nNo credit card required to start! Ready to begin your creator journey?",
  };

  const getBotResponse = (userMessage: string): string => {
    const message = userMessage.toLowerCase();
    
    if (message.includes("price") || message.includes("cost") || message.includes("plan")) {
      return predefinedResponses.pricing;
    }
    
    if (message.includes("start") || message.includes("begin") || message.includes("setup") || message.includes("how")) {
      return predefinedResponses.setup;
    }
    
    if (message.includes("payment") || message.includes("money") || message.includes("pay") || message.includes("mpesa") || message.includes("pesapal")) {
      return predefinedResponses.payments;
    }
    
    if (message.includes("feature") || message.includes("what") || message.includes("include") || message.includes("can")) {
      return predefinedResponses.features;
    }
    
    if (message.includes("help") || message.includes("support") || message.includes("contact")) {
      return predefinedResponses.support;
    }
    
    if (message.includes("trial") || message.includes("free")) {
      return predefinedResponses.trial;
    }
    
    if (message.includes("hello") || message.includes("hi") || message.includes("hey")) {
      return "Hello! 👋 Welcome to Creohub. I'm here to help you build your creator business in Africa. What would you like to know about our platform?";
    }
    
    // Default response
    return "I'd be happy to help! Here are some things I can tell you about:\n\n• **Pricing & Plans** - Our subscription options\n• **Getting Started** - How to set up your store\n• **Payment Methods** - African payment solutions\n• **Features** - What's included in Creohub\n• **Free Trial** - 14-day trial details\n• **Support** - How to get additional help\n\nWhat interests you most?";
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