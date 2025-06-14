// Intelligent Chatbot Service - Advanced FAQ with Natural Language Processing
// Uses semantic matching and context understanding without external AI APIs

interface ChatContext {
  previousQuestions: string[];
  userIntent: string;
  confidence: number;
}

interface SmartResponse {
  answer: string;
  confidence: number;
  suggestedQuestions: string[];
  needsHumanSupport: boolean;
}

export class IntelligentChatbot {
  private knowledgeBase = {
    pricing: {
      keywords: ["price", "cost", "fee", "money", "expensive", "cheap", "plan", "subscription", "payment"],
      synonyms: ["pricing", "rates", "charges", "billing", "amount"],
      responses: {
        general: "Creohub offers 3 pricing tiers:\n\n🆓 **Free Trial** - 14 days, 10% platform fee\n💼 **Starter** - $14.99/month, 5% platform fee\n🚀 **Pro** - $29.99/month, 0% platform fee\n\nAll plans include unlimited products, custom storefront, and analytics.",
        specific: {
          kenya: "In Kenya, pricing is the same: Free trial (10% fee), Starter $14.99/month (5% fee), Pro $29.99/month (0% fee). Payments accepted via M-Pesa and local banks.",
          "south africa": "For South African creators: Free trial (10% fee), Starter $14.99/month (5% fee), Pro $29.99/month (0% fee). We support ZAR and local payment methods.",
          nigeria: "Nigerian pricing: Free trial (10% fee), Starter $14.99/month (5% fee), Pro $29.99/month (0% fee). Accept Naira payments via local banks and Flutterwave."
        } as Record<string, string>
      }
    },
    
    countries: {
      keywords: ["country", "africa", "kenya", "nigeria", "south africa", "ghana", "uganda", "available", "support"],
      responses: {
        general: "Creohub supports ALL African countries! We specifically optimize for:\n\n🇰🇪 Kenya - M-Pesa, KES support\n🇿🇦 South Africa - ZAR, local banks\n🇳🇬 Nigeria - Naira, Flutterwave\n🇬🇭 Ghana - Cedis, mobile money\n🇺🇬 Uganda - UGX support\n\n+ Every other African nation with local payment methods!"
      }
    },
    
    payments: {
      keywords: ["payment", "mpesa", "mobile money", "bank", "transfer", "stripe", "flutterwave", "pesapal"],
      responses: {
        general: "We support African-focused payment methods:\n\n📱 **M-Pesa** - Kenya, Tanzania, Uganda\n🏦 **Pesapal** - Pan-African gateway\n💳 **Flutterwave** - Banks across Africa\n🌍 **Stripe** - International cards\n\nEarnings go directly to your local bank account!"
      }
    },
    
    gettingStarted: {
      keywords: ["start", "begin", "setup", "create", "how to", "guide", "tutorial"],
      responses: {
        general: "Getting started is easy:\n\n1️⃣ **Sign up** - Free 14-day trial\n2️⃣ **Upload products** - Digital or physical\n3️⃣ **Customize store** - Your brand, colors\n4️⃣ **Set payments** - Choose your methods\n5️⃣ **Start selling** - Share your store link\n\nNo credit card needed for trial!"
      }
    },
    
    products: {
      keywords: ["product", "digital", "physical", "ebook", "course", "inventory", "upload"],
      responses: {
        digital: "**Digital Products** perfect for:\n\n📚 eBooks and guides\n🎓 Online courses\n🎵 Music and audio\n📱 Software and apps\n🎨 Templates and designs\n\nInstant delivery, no shipping costs!",
        physical: "**Physical Products** features:\n\n📦 Inventory management\n🚚 Shipping calculator\n📍 Local courier integration\n💰 No upfront costs\n📊 Order tracking\n\nPerfect for handmade goods!"
      }
    },
    
    affiliate: {
      keywords: ["affiliate", "referral", "commission", "promote", "marketing", "partner"],
      responses: {
        general: "**Affiliate Program** helps you grow:\n\n💼 Set 5-50% commission rates\n🔗 Generate unique affiliate links\n📊 Track referral performance\n💰 Automatic commission payouts\n🌍 Expand across Africa\n\nLet others promote your products for commission!"
      }
    },
    
    withdrawals: {
      keywords: ["withdrawal", "payout", "earnings", "money", "bank account", "withdraw"],
      responses: {
        general: "**Withdrawal Process**:\n\n💰 Minimum: $10 USD equivalent\n⏰ Processing: 3-5 business days\n🏦 Methods: Bank transfer, mobile money\n✅ Admin approval for security\n📊 Track in dashboard\n\nEarnings calculated after platform fees!"
      }
    }
  };

  analyzeIntent(question: string): { intent: string; confidence: number; entities: string[] } {
    const normalizedQuestion = question.toLowerCase().trim();
    const words = normalizedQuestion.split(/\s+/);
    
    let bestMatch = { intent: "general", confidence: 0, entities: [] as string[] };
    
    for (const [category, data] of Object.entries(this.knowledgeBase)) {
      let matchCount = 0;
      let totalKeywords = data.keywords.length;
      const foundEntities: string[] = [];
      
      // Check for keyword matches
      for (const keyword of data.keywords) {
        if (normalizedQuestion.includes(keyword)) {
          matchCount++;
          foundEntities.push(keyword);
        }
      }
      
      // Check for synonyms if available
      if ('synonyms' in data) {
        for (const synonym of data.synonyms) {
          if (normalizedQuestion.includes(synonym)) {
            matchCount++;
            foundEntities.push(synonym);
          }
        }
        totalKeywords += data.synonyms.length;
      }
      
      const confidence = matchCount / Math.min(totalKeywords, words.length);
      
      if (confidence > bestMatch.confidence) {
        bestMatch = { intent: category, confidence, entities: foundEntities };
      }
    }
    
    return bestMatch;
  }

  detectCountryContext(question: string): string | null {
    const countries = {
      "kenya": ["kenya", "kenyan", "nairobi", "kes", "ksh"],
      "south africa": ["south africa", "south african", "cape town", "johannesburg", "zar", "rand"],
      "nigeria": ["nigeria", "nigerian", "lagos", "abuja", "naira", "ngn"],
      "ghana": ["ghana", "ghanaian", "accra", "cedis", "ghs"],
      "uganda": ["uganda", "ugandan", "kampala", "ugx"]
    };
    
    const normalizedQuestion = question.toLowerCase();
    
    for (const [country, identifiers] of Object.entries(countries)) {
      for (const identifier of identifiers) {
        if (normalizedQuestion.includes(identifier)) {
          return country;
        }
      }
    }
    
    return null;
  }

  generateSmartResponse(question: string, context?: ChatContext): SmartResponse {
    const intent = this.analyzeIntent(question);
    const countryContext = this.detectCountryContext(question);
    
    let response = "";
    let needsHumanSupport = false;
    let suggestedQuestions: string[] = [];
    
    // Handle specific intents
    if (intent.confidence > 0.3) {
      const categoryData = this.knowledgeBase[intent.intent as keyof typeof this.knowledgeBase];
      
      // Check for country-specific responses
      if (countryContext && 'responses' in categoryData && 'specific' in categoryData.responses) {
        const specific = categoryData.responses.specific as Record<string, string>;
        const specificResponse = specific[countryContext];
        if (specificResponse) {
          response = specificResponse;
        }
      }
      
      // Fallback to general response
      if (!response && 'responses' in categoryData) {
        if (typeof categoryData.responses === 'object' && 'general' in categoryData.responses) {
          response = categoryData.responses.general;
        } else if (typeof categoryData.responses === 'string') {
          response = categoryData.responses;
        }
      }
      
      // Generate contextual suggestions
      suggestedQuestions = this.generateSuggestions(intent.intent, countryContext);
    }
    
    // Handle technical issues or complex questions
    if (this.detectTechnicalIssue(question) || intent.confidence < 0.2) {
      needsHumanSupport = true;
      response = this.generateEscalationResponse(question);
    }
    
    // Default intelligent response
    if (!response) {
      response = this.generateContextualDefault(question, intent.entities);
    }
    
    return {
      answer: response,
      confidence: intent.confidence,
      suggestedQuestions,
      needsHumanSupport
    };
  }

  private detectTechnicalIssue(question: string): boolean {
    const technicalKeywords = ["bug", "error", "broken", "not working", "issue", "problem", "crash", "login"];
    return technicalKeywords.some(keyword => question.toLowerCase().includes(keyword));
  }

  private generateEscalationResponse(question: string): string {
    if (this.detectTechnicalIssue(question)) {
      return "I understand you're experiencing a technical issue. Our support team can help you directly at **support@creohub.io**. Please include:\n\n• Description of the problem\n• Steps you tried\n• Screenshots if possible\n\nThey'll investigate and resolve it quickly!";
    }
    
    return "That's a great question! For detailed assistance with your specific situation, please contact our support team at **support@creohub.io**. They can provide personalized guidance.\n\nIs there anything else from our FAQ I can help with?";
  }

  private generateContextualDefault(question: string, entities: string[]): string {
    if (entities.length > 0) {
      return `I noticed you're asking about ${entities.join(", ")}. While I have information on many Creohub topics, I'd like to connect you with our detailed FAQ or support team at **support@creohub.io** for the most accurate answer.\n\nTry asking about: pricing, countries, payments, getting started, or products!`;
    }
    
    return "I'm here to help with Creohub questions! I can provide information about:\n\n• **Pricing & Plans** - Costs and fees\n• **Country Support** - African market coverage\n• **Payment Methods** - M-Pesa, banks, mobile money\n• **Getting Started** - Setup process\n• **Products** - Digital and physical items\n\nWhat would you like to know?";
  }

  private generateSuggestions(intent: string, country?: string | null): string[] {
    const suggestions: { [key: string]: string[] } = {
      pricing: [
        "What's included in the free trial?",
        "How do platform fees work?",
        "Can I change plans anytime?"
      ],
      countries: [
        "What payment methods are available?",
        "How do I withdraw earnings?",
        "Is there local customer support?"
      ],
      payments: [
        "How long do payments take?",
        "Are there any transaction fees?",
        "Can I use multiple payment methods?"
      ],
      gettingStarted: [
        "How do I upload my first product?",
        "Can I customize my store design?",
        "Do I need technical skills?"
      ]
    };
    
    return suggestions[intent] || [
      "What are the pricing plans?",
      "Which countries do you support?",
      "How do I get started?"
    ];
  }
}

export const intelligentBot = new IntelligentChatbot();