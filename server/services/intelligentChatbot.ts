// Intelligent Chatbot Service - Advanced FAQ with Natural Language Processing
// Uses semantic matching and context understanding without external AI APIs

interface ChatContext {
  previousQuestions: string[];
  userIntent: string;
  confidence: number;
  conversationFlow?: string;
  userState?: 'new' | 'returning' | 'setup_in_progress';
}

interface SmartResponse {
  answer: string;
  confidence: number;
  suggestedQuestions: string[];
  needsHumanSupport: boolean;
  conversationFlow?: string;
  quickActions?: { label: string; action: string }[];
}

export class IntelligentChatbot {
  private intentPatterns = {
    generalInquiry: [
      /what is creohub/i, /tell me about/i, /explain creohub/i, /about this platform/i, 
      /what does creohub do/i, /how does this work/i
    ],
    pricingInquiry: [
      /how much.*cost/i, /what.*price/i, /pricing.*plan/i, /cost.*sell/i, 
      /fee.*charge/i, /subscription.*price/i, /monthly.*cost/i, /plan.*cost/i,
      /free.*trial/i, /how much.*pay/i
    ],
    featureInquiry: [
      /what.*can.*do/i, /features/i, /capabilities/i, /what.*included/i,
      /support.*ecommerce/i, /can.*sell/i, /what.*offer/i
    ],
    accountHelp: [
      /can't.*log.*in/i, /login.*problem/i, /create.*account/i, /sign.*up/i,
      /forgot.*password/i, /account.*issue/i
    ],
    technicalSupport: [
      /error/i, /bug/i, /not.*working/i, /broken/i, /app.*won't.*load/i,
      /technical.*issue/i, /problem.*with/i
    ],
    integrationQuery: [
      /integrate.*with/i, /connect.*pesapal/i, /payment.*gateway/i, /api/i,
      /third.*party/i, /webhook/i, /banking.*integration/i
    ],
    useCaseGuidance: [
      /sell.*digital.*products/i, /course/i, /ebook/i, /membership/i,
      /subscription/i, /online.*store/i, /digital.*downloads/i
    ],
    setupGuidance: [
      /how.*start/i, /get.*started/i, /setup/i, /guide.*me/i, /first.*steps/i,
      /tutorial/i, /onboarding/i
    ],
    contactSupport: [
      /talk.*to.*someone/i, /human.*help/i, /live.*support/i, /contact.*support/i,
      /speak.*agent/i, /complex.*issue/i
    ]
  };

  private knowledgeBase = {
    generalInquiry: {
      answer: "Creohub is an all-in-one platform for African creators to sell digital products, manage e-commerce, memberships, and automation — without coding.\n\n✨ **What you can build:**\n• Digital product stores (ebooks, courses, templates)\n• Membership sites and subscriptions\n• Physical product e-commerce\n• Creator brand websites\n\nBuilt specifically for the African market with local payment methods like M-Pesa, local banking, and African currencies.",
      quickActions: [
        { label: "See Pricing", action: "pricing" },
        { label: "Get Started", action: "setup" },
        { label: "View Features", action: "features" }
      ]
    },
    
    pricingInquiry: {
      answer: "We offer flexible pricing designed for African creators:\n\n🆓 **Free Trial** - 14 days, 10% platform fee\n💼 **Starter** - $14.99/month, 5% platform fee  \n🚀 **Pro** - $29.99/month, 0% platform fee\n\n**All plans include:**\n• Unlimited products & customers\n• Custom storefront & branding\n• Analytics dashboard\n• African payment methods\n• Email support\n\nWant a detailed breakdown of features?",
      quickActions: [
        { label: "Start Free Trial", action: "trial" },
        { label: "Compare Plans", action: "compare" },
        { label: "See Features", action: "features" }
      ]
    },

    featureInquiry: {
      answer: "Creohub gives you everything to build your creator business:\n\n🛍️ **E-commerce Features:**\n• Digital & physical product sales\n• Inventory management\n• Order tracking & fulfillment\n\n💰 **Monetization:**\n• Subscriptions & memberships\n• Course creation & delivery\n• Affiliate program\n\n🎨 **Customization:**\n• Custom storefront themes\n• Brand colors & logos\n• Mobile-responsive design\n\n📊 **Business Tools:**\n• Sales analytics\n• Customer management\n• Payment processing",
      quickActions: [
        { label: "See Demo", action: "demo" },
        { label: "Get Started", action: "setup" },
        { label: "Pricing", action: "pricing" }
      ]
    },

    pricing: {
      keywords: ["price", "cost", "fee", "money", "expensive", "cheap", "plan", "subscription", "payment"],
      synonyms: ["pricing", "rates", "charges", "billing", "amount"],
      responses: {
        general: "Creohub offers 3 pricing tiers:\n\n🆓 **Free Trial** - 14 days, 10% platform fee\n💼 **Starter** - $14.99/month, 5% platform fee\n🚀 **Pro** - $29.99/month, 0% platform fee\n\nAll plans include unlimited products, custom storefront, and analytics.",
        specific: {
          kenya: "In Kenya, pricing is the same: Free trial (10% fee), Starter $14.99/month (5% fee), Pro $29.99/month (0% fee). Payments accepted via M-Pesa, Pesapal and local banks.",
          "south africa": "For South African creators: Free trial (10% fee), Starter $14.99/month (5% fee), Pro $29.99/month (0% fee). We support ZAR via Pesapal and local payment methods.",
          nigeria: "Nigerian pricing: Free trial (10% fee), Starter $14.99/month (5% fee), Pro $29.99/month (0% fee). Accept Naira payments via Pesapal, local banks and Flutterwave."
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
      keywords: ["payment", "mpesa", "mobile money", "bank", "transfer", "flutterwave", "pesapal"],
      responses: {
        general: "We support African-focused payment methods:\n\n📱 **M-Pesa** - Kenya, Tanzania, Uganda\n🏦 **Pesapal** - Pan-African gateway (our primary processor)\n💳 **Flutterwave** - Banks across Africa\n🏧 **Local Banking** - Direct bank transfers\n\nEarnings go directly to your local bank account!"
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
    
    // Check intent patterns first (highest confidence)
    for (const [intent, patterns] of Object.entries(this.intentPatterns)) {
      for (const pattern of patterns) {
        if (pattern.test(question)) {
          return { 
            intent, 
            confidence: 0.9, 
            entities: [intent] 
          };
        }
      }
    }
    
    // Fallback to keyword matching for legacy data
    const words = normalizedQuestion.split(/\s+/);
    let bestMatch = { intent: "general", confidence: 0, entities: [] as string[] };
    
    for (const [category, data] of Object.entries(this.knowledgeBase)) {
      if ('keywords' in data) {
        let matchScore = 0;
        const foundEntities: string[] = [];
        
        // Weight matches based on keyword importance
        for (const keyword of data.keywords) {
          if (normalizedQuestion.includes(keyword)) {
            const weight = keyword.length > 4 ? 2 : 1;
            matchScore += weight;
            foundEntities.push(keyword);
          }
        }
        
        // Check for synonyms with lower weight
        if ('synonyms' in data) {
          for (const synonym of data.synonyms) {
            if (normalizedQuestion.includes(synonym)) {
              matchScore += 1;
              foundEntities.push(synonym);
            }
          }
        }
        
        const confidence = Math.min(matchScore / Math.max(words.length, 3), 1);
        
        if (confidence > bestMatch.confidence && confidence > 0.2) {
          bestMatch = { intent: category, confidence, entities: foundEntities };
        }
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
    const questionLower = question.toLowerCase().trim();
    
    // Early detection for thanks and common responses
    if (questionLower.match(/^(thank you|thanks|thank|ty)(\s|$)/i) || 
        questionLower === 'thank you' || 
        questionLower === 'thanks' || 
        questionLower === 'thank') {
      return {
        answer: "You're welcome! Is there anything else about Creohub I can help you with? I'm here to answer questions about pricing, features, getting started, or African market support.",
        confidence: 1.0,
        suggestedQuestions: ["What are your pricing plans?", "How do I get started?", "Do you support my country?"],
        needsHumanSupport: false
      };
    }
    
    const intent = this.analyzeIntent(question);
    const countryContext = this.detectCountryContext(question);
    
    // Handle high-confidence intent matches with new structure
    if (intent.confidence > 0.8) {
      const intentData = this.knowledgeBase[intent.intent as keyof typeof this.knowledgeBase];
      
      if (intentData && 'answer' in intentData) {
        return {
          answer: intentData.answer,
          confidence: intent.confidence,
          suggestedQuestions: this.generateSuggestions(intent.intent, countryContext),
          needsHumanSupport: false,
          conversationFlow: intent.intent,
          quickActions: intentData.quickActions || []
        };
      }
    }
    
    // Handle legacy keyword-based responses
    if (intent.confidence > 0.4) {
      const categoryData = this.knowledgeBase[intent.intent as keyof typeof this.knowledgeBase];
      
      if (categoryData && 'responses' in categoryData) {
        let response = "";
        
        // Check for country-specific responses
        if (countryContext && 'specific' in categoryData.responses) {
          const specific = categoryData.responses.specific as Record<string, string>;
          response = specific[countryContext] || "";
        }
        
        // Fallback to general response
        if (!response && 'general' in categoryData.responses) {
          response = categoryData.responses.general;
        }
        
        if (response) {
          return {
            answer: response,
            confidence: intent.confidence,
            suggestedQuestions: this.generateSuggestions(intent.intent, countryContext),
            needsHumanSupport: false
          };
        }
      }
    }
    
    // Handle lower confidence matches with intelligent inference
    if (intent.confidence > 0.15) {
      return {
        answer: this.generateIntelligentInference(question, intent, countryContext),
        confidence: intent.confidence,
        suggestedQuestions: this.generateSuggestions(intent.intent, countryContext),
        needsHumanSupport: false
      };
    }
    
    // Handle technical issues
    if (this.detectTechnicalIssue(question)) {
      return {
        answer: this.generateEscalationResponse(question),
        confidence: 0.5,
        suggestedQuestions: ["Contact technical support", "Check system status", "Try basic troubleshooting"],
        needsHumanSupport: true
      };
    }
    
    // Intelligent default response for unclear questions
    return {
      answer: this.generateIntelligentDefault(question, intent.entities),
      confidence: 0.3,
      suggestedQuestions: ["What is Creohub?", "See pricing plans", "How do I get started?"],
      needsHumanSupport: false
    };
  }

  private generateIntelligentInference(question: string, intent: any, countryContext: string | null): string {
    const questionLower = question.toLowerCase();
    
    // Smart inference based on question patterns
    if (questionLower.includes('smart') || questionLower.includes('intelligent')) {
      return "Yes! Our platform uses intelligent systems to help creators succeed:\n\n• **Smart Analytics** - Track what sells best\n• **Intelligent Pricing** - Competitive market insights\n• **Auto-optimization** - Platform learns from your sales\n• **Smart Notifications** - Real-time updates\n• **AI-powered Support** - Like this conversation!\n\nWhat specific intelligent feature interests you most?";
    }
    
    if (questionLower.includes('really') && (questionLower.includes('work') || questionLower.includes('good'))) {
      return "Absolutely! Creohub is designed specifically for African creators and has proven results:\n\n✅ **Real Success Stories** - Creators earning consistently\n✅ **Local Payment Methods** - M-Pesa, local banks\n✅ **African-focused Features** - Built for our market\n✅ **Growing Community** - Active creator network\n✅ **Reliable Platform** - 99.9% uptime\n\nTry our free 14-day trial to experience it yourself!";
    }
    
    // Use the best matching category data
    const categoryData = this.knowledgeBase[intent.intent as keyof typeof this.knowledgeBase];
    if (categoryData && 'responses' in categoryData) {
      if (typeof categoryData.responses === 'object' && 'general' in categoryData.responses) {
        return categoryData.responses.general;
      }
    }
    
    return "I understand you're asking about " + intent.entities.join(', ') + ". Let me provide you with relevant information:\n\n" + this.generateContextualGuidance(intent.intent);
  }

  private generateIntelligentDefault(question: string, entities: string[]): string {
    const questionLower = question.toLowerCase().trim();
    
    // Handle greetings
    if (questionLower.match(/^(hi|hello|hey|good morning|good afternoon)/)) {
      return "Hello! Welcome to Creohub. I'm here to help you build your creator business in Africa. What would you like to know about our platform?";
    }
    
    // Handle thanks - prioritize this detection
    if (questionLower.match(/^(thank you|thanks|thank|ty)(\s|$)/i) || 
        questionLower === 'thank you' || 
        questionLower === 'thanks' || 
        questionLower === 'thank') {
      return "You're welcome! Is there anything else about Creohub I can help you with? I'm here to answer questions about pricing, features, getting started, or African market support.";
    }
    
    // Provide guidance based on detected entities
    if (entities.length > 0) {
      return `I can help you with questions about ${entities.join(', ')}. Here are some things I know well:\n\n• **Pricing Plans** - Free trial, Starter, Pro options\n• **African Countries** - Support across all African nations\n• **Payment Methods** - M-Pesa, local banks, mobile money\n• **Getting Started** - Step-by-step setup guide\n• **Products** - Digital and physical selling\n\nWhat specific aspect would you like to explore?`;
    }
    
    return "I'm here to help with Creohub questions! I can provide detailed information about:\n\n• **Pricing & Plans** - Costs and features\n• **Country Support** - African market coverage\n• **Payment Solutions** - Local payment methods\n• **Platform Features** - What you can build\n• **Getting Started** - Your first steps\n\nWhat would you like to know?";
  }

  private generateContextualGuidance(intent: string): string {
    const guidance: Record<string, string> = {
      pricing: "Our pricing is transparent with three tiers: Free trial (10% fee), Starter $14.99/month (5% fee), and Pro $29.99/month (0% fee). All plans include unlimited products and full platform access.",
      countries: "We support all African countries with local payment methods, currencies, and banking integrations. Special focus on South Africa, Kenya, Nigeria, Ghana, and Uganda.",
      payments: "Multiple African payment options including M-Pesa, Pesapal, Flutterwave, and local banking. Earnings go directly to your bank account.",
      gettingStarted: "Simple setup: Sign up for free trial, create your profile, upload products, customize your store, and start selling. No technical skills required.",
      products: "Sell both digital (courses, ebooks, software) and physical products (handmade goods, books, merchandise) with full inventory management."
    };
    
    return guidance[intent] || "Let me connect you with specific information that matches your question.";
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