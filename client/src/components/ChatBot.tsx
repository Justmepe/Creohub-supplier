import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MessageCircle, X, Send, Bot, User } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface Message {
  id: string;
  text: string;
  sender: "user" | "bot";
  timestamp: Date;
}

interface SmartResponse {
  answer: string;
  confidence: number;
  suggestedQuestions: string[];
  needsHumanSupport: boolean;
  conversationFlow?: string;
  quickActions?: { label: string; action: string }[];
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
  const [conversationContext, setConversationContext] = useState<string[]>([]);
  const [currentQuickActions, setCurrentQuickActions] = useState<{ label: string; action: string }[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const getIntelligentResponse = async (question: string): Promise<{ response: string; quickActions?: { label: string; action: string }[] }> => {
    try {
      const response = await apiRequest("POST", "/api/chatbot/ask", {
        question,
        context: {
          previousQuestions: conversationContext,
          userIntent: "general",
          confidence: 0.5
        }
      });

      const smartResponse: SmartResponse = await response.json();
      
      // Update conversation context
      setConversationContext(prev => [...prev.slice(-4), question]);
      
      // Build response with suggestions and quick actions
      let fullResponse = smartResponse.answer;
      
      if (smartResponse.suggestedQuestions && smartResponse.suggestedQuestions.length > 0) {
        const suggestions = smartResponse.suggestedQuestions
          .slice(0, 3)
          .map(q => `• ${q}`)
          .join('\n');
        
        fullResponse += `\n\n**You might also ask:**\n${suggestions}`;
      }
      
      return { 
        response: fullResponse, 
        quickActions: smartResponse.quickActions 
      };
    } catch (error) {
      console.error("Error getting intelligent response:", error);
      
      // Fallback to basic response if API fails
      return { 
        response: "I'm having trouble processing your question right now. For immediate assistance, please contact our support team at **support@creohub.io**.\n\nYou can also try asking about:\n• Pricing plans\n• Getting started\n• Payment methods\n• Country support",
        quickActions: []
      };
    }
  };

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText("");
    setIsTyping(true);

    // Get intelligent bot response
    const { response: botResponse, quickActions } = await getIntelligentResponse(inputText);

    setTimeout(() => {
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: botResponse,
        sender: "bot",
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, botMessage]);
      setCurrentQuickActions(quickActions || []);
      setIsTyping(false);
    }, 500);
  };

  const handleQuickAction = async (action: string) => {
    // Map quick actions to actual questions
    const actionQuestions: Record<string, string> = {
      pricing: "What are your pricing plans?",
      setup: "How do I get started?",
      features: "What features do you offer?",
      trial: "How do I start a free trial?",
      compare: "Compare your pricing plans",
      demo: "Can I see a demo?",
      support: "How do I contact support?",
      countries: "What countries do you support?",
      payments: "What payment methods do you accept?"
    };

    const question = actionQuestions[action] || action;
    await handleSuggestedQuestion(question);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSuggestedQuestion = async (question: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      text: question,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);

    const { response: botResponse, quickActions } = await getIntelligentResponse(question);

    setTimeout(() => {
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: botResponse,
        sender: "bot",
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, botMessage]);
      setCurrentQuickActions(quickActions || []);
      setIsTyping(false);
    }, 500);
  };

  const formatMessage = (text: string) => {
    return text.split('\n').map((line, index) => {
      // Handle bold text
      const boldFormatted = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      // Handle bullet points
      const bulletFormatted = boldFormatted.replace(/^•\s/, '• ');
      
      return (
        <span key={index}>
          <span dangerouslySetInnerHTML={{ __html: bulletFormatted }} />
          {index < text.split('\n').length - 1 && <br />}
        </span>
      );
    });
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-blue-600 hover:bg-blue-700 shadow-lg z-50"
        size="icon"
      >
        <MessageCircle className="h-6 w-6 text-white" />
      </Button>
    );
  }

  return (
    <Card className="fixed bottom-6 right-6 w-96 h-[500px] shadow-xl z-50 flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 border-b bg-white rounded-t-lg">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Bot className="h-5 w-5 text-blue-600" />
          Creohub Assistant
        </CardTitle>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsOpen(false)}
          className="h-8 w-8"
        >
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
        {/* Messages Area */}
        <div 
          ref={chatContainerRef}
          className="flex-1 overflow-y-auto p-4 space-y-4"
          style={{ maxHeight: 'calc(500px - 180px)' }}
        >
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${
                message.sender === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {message.sender === "bot" && (
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <Bot className="h-4 w-4 text-blue-600" />
                </div>
              )}
              
              <div
                className={`max-w-[250px] p-3 rounded-lg ${
                  message.sender === "user"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-900"
                }`}
              >
                <div className="text-sm leading-relaxed">
                  {formatMessage(message.text)}
                </div>
                <div className="text-xs opacity-70 mt-1">
                  {message.timestamp.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
              
              {message.sender === "user" && (
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                  <User className="h-4 w-4 text-white" />
                </div>
              )}
            </div>
          ))}
          
          {isTyping && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <Bot className="h-4 w-4 text-blue-600" />
              </div>
              <div className="bg-gray-100 p-3 rounded-lg">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
        
        {/* Input Area */}
        <div className="border-t bg-white p-4 space-y-3 rounded-b-lg">
          {/* Dynamic Quick Action Buttons */}
          {currentQuickActions.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {currentQuickActions.map((action, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickAction(action.action)}
                  className="text-xs h-7 px-2 bg-blue-50 hover:bg-blue-100 border-blue-200"
                >
                  {action.label}
                </Button>
              ))}
            </div>
          )}
          
          {/* Static Quick Actions when no dynamic ones */}
          {currentQuickActions.length === 0 && (
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSuggestedQuestion("What are your pricing plans?")}
                className="text-xs h-7 px-2"
              >
                Pricing
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSuggestedQuestion("Do you support South Africa?")}
                className="text-xs h-7 px-2"
              >
                Countries
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSuggestedQuestion("How do I get started?")}
                className="text-xs h-7 px-2"
              >
                Get Started
              </Button>
            </div>
          )}
          
          <div className="flex gap-2">
            <Input
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything about Creohub..."
              className="flex-1 text-sm"
              disabled={isTyping}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!inputText.trim() || isTyping}
              size="icon"
              className="bg-blue-600 hover:bg-blue-700 h-10 w-10"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}