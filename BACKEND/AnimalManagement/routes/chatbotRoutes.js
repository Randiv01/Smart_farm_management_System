import express from "express";
import OpenAI from "openai";

const router = express.Router();

// Comprehensive animal knowledge database (self-contained)
const animalDatabase = {
  cows: {
    commonBreeds: ["Holstein", "Jersey", "Angus", "Hereford", "Simmental", "Limousin"],
    health: {
      commonIssues: ["Mastitis", "Lameness", "Respiratory diseases", "Metabolic disorders"],
      vitalSigns: {
        temperature: "101.5°F (38.6°C)",
        heartRate: "48-84 beats/minute",
        respiration: "26-50 breaths/minute"
      }
    },
    nutrition: {
      dailyWater: "10-20 gallons",
      feedRequirements: "2.5-4% of body weight in dry matter",
      keyNutrients: ["Protein 12-18%", "Energy (TDN)", "Fiber", "Minerals", "Vitamins"]
    },
    reproduction: {
      gestation: "283 days",
      breedingAge: "12-15 months",
      heatCycle: "21 days",
      heatDuration: "12-18 hours"
    }
  },
  pigs: {
    commonBreeds: ["Yorkshire", "Hampshire", "Duroc", "Landrace", "Pietrain"],
    health: {
      commonIssues: ["Respiratory diseases", "Scours", "Parasites", "Lameness"],
      vitalSigns: {
        temperature: "102.5°F (39.2°C)",
        heartRate: "70-120 beats/minute",
        respiration: "32-58 breaths/minute"
      }
    },
    nutrition: {
      dailyWater: "2-4 gallons",
      feedRequirements: "4-8% of body weight",
      keyNutrients: ["Protein 16-18%", "Energy", "Amino acids", "Minerals", "Vitamins"]
    },
    reproduction: {
      gestation: "114 days (3 months, 3 weeks, 3 days)",
      breedingAge: "6-8 months",
      heatCycle: "21 days",
      heatDuration: "2-3 days"
    }
  },
  chickens: {
    commonBreeds: ["Rhode Island Red", "Leghorn", "Plymouth Rock", "Sussex", "Orpington"],
    health: {
      commonIssues: ["Respiratory infections", "Parasites", "Coccidiosis", "Egg binding"],
      vitalSigns: {
        temperature: "105-107°F (40.6-41.7°C)",
        heartRate: "250-300 beats/minute",
        respiration: "12-37 breaths/minute"
      }
    },
    nutrition: {
      dailyWater: "1-2 cups",
      feedRequirements: "1/4 pound per day",
      keyNutrients: ["Protein 16-20%", "Calcium", "Phosphorus", "Vitamins", "Minerals"]
    },
    reproduction: {
      incubation: "21 days",
      layingAge: "5-6 months",
      eggProduction: "250-300 eggs/year for layers"
    }
  }
};

// Enhanced fallback responses with more specific animal management knowledge
const fallbackResponses = {
  "greeting": "Hello! 👋 I'm your advanced farm animal management assistant. I can help with health issues, breeding, feeding, housing, and general care for various farm animals. How can I assist you today?",
  
  "farewell": "Goodbye! 👋 Feel free to reach out if you have more questions about animal management. Remember to check on your animals regularly!",
  
  "thanks": "You're welcome! 😊 I'm always here to help with your animal management needs.",
  
  "diarrhea": {
    "cows": "For diarrhea in cows: 🚨 Isolate immediately. 💧 Provide electrolyte solution (1 tbsp salt + 1 tbsp baking soda per gallon water). 🌿 Offer quality hay, avoid lush pasture. 🌡️ Monitor temperature (normal: 101.5°F). 📞 Contact vet if no improvement in 24 hours or if showing signs of dehydration.",
    "pigs": "For diarrhea in pigs: 🚨 Separate sick animals. 💦 Ensure clean water with electrolytes. 🍎 Withhold food for 12-24 hours then offer easy-to-digest feed. 🧼 Improve sanitation. 🌡️ Check temperature (normal: 102.5°F).",
    "chickens": "For diarrhea in chickens: 🚨 Isolate affected birds. 💧 Add electrolytes to water. 🍎 Provide probiotic feed. 🧼 Clean and disinfect housing. 🌿 Consider natural remedies like apple cider vinegar (1 tbsp per gallon water).",
    "default": "For diarrhea in animals: 🚨 Isolate affected animal. 💧 Provide plenty of fresh water with electrolytes. 🍽️ Temporarily withhold food then introduce bland diet. 🧴 Maintain strict hygiene. 📞 Consult veterinarian if condition persists beyond 24 hours."
  },
  
  "vaccination": {
    "cows": "Basic cow vaccination schedule: \n• 2-4 months: IBR, BVD, PI3, BRSV \n• 4-6 months: Brucellosis (heifers only) \n• Annual boosters: IBR, BVD, PI3, BRSV, Leptospirosis \n• Pre-breeding: Vibriosis, Trichomoniasis if needed \n• Consult your vet for farm-specific program",
    "pigs": "Basic pig vaccination schedule: \n• 3-7 days: Iron injection \n• 3-4 weeks: Mycoplasma pneumonia \n• 6-8 weeks: Erysipelas \n• Breeding sows: Parvovirus, Erysipelas, Leptospirosis 2-4 weeks pre-farrowing",
    "chickens": "Basic chicken vaccination schedule: \n• Day 1: Marek's disease \n• 7-14 days: Newcastle disease, Infectious bronchitis \n• 14-21 days: Gumboro disease \n• 4-6 weeks: Fowl pox \n• Consult your vet for specific flock needs",
    "default": "Vaccination needs vary by species, age, and location. Core vaccines typically include protection against common respiratory and reproductive diseases. Always work with your veterinarian to develop a farm-specific vaccination program."
  },
  
  "feeding": {
    "dairy_cows": "Dairy cow nutrition: \n• Dry matter intake: 3-4% of body weight \n• Forage should be 50-60% of diet \n• Protein: 16-18% for lactating cows \n• Energy: Balance with fiber to maintain rumen health \n• Always provide fresh, clean water",
    "beef_cows": "Beef cattle nutrition: \n• Dry matter intake: 2-2.5% of body weight \n• Forage-based diet with grain supplementation \n• Protein: 11-13% for growing cattle \n• Minerals: Provide free-choice mineral supplement \n• Water: 1-2 gallons per 100lb body weight daily",
    "pigs": "Pig nutrition requirements: \n• Starter pigs (up to 50 lbs): 18-20% protein \n• Grower pigs (50-125 lbs): 16-18% protein \n• Finisher pigs (125-250 lbs): 14-16% protein \n• Breeding stock: 14-16% protein with careful mineral balance",
    "chickens": "Chicken feeding guidelines: \n• Starter feed (0-8 weeks): 20-24% protein \n• Grower feed (8-16 weeks): 16-18% protein \n• Layer feed (16+ weeks): 16-18% protein with 3.5-4% calcium \n• Always provide grit for digestion and fresh water",
    "default": "Proper animal nutrition requires balancing energy, protein, vitamins and minerals based on species, age, production stage, and environment. Always provide access to clean, fresh water."
  },
  
  "breeding": {
    "cows": "Bovine reproduction: \n• Heat cycle: 21 days \n• Heat duration: 12-18 hours \n• Breeding time: 12 hours after heat onset \n• Gestation: 283 days \n• Pregnancy check: 35-45 days post-breeding \n• Calving interval goal: 12-13 months",
    "pigs": "Porcine reproduction: \n• Heat cycle: 21 days \n• Heat duration: 2-3 days \n• Breeding time: 12-24 hours after heat onset \n• Gestation: 114 days \n• Farrowing interval goal: 5-6 litters/year",
    "chickens": "Poultry reproduction: \n• Sexual maturity: 5-6 months \n• Egg production: Peak at 28-30 weeks \n• Fertility duration: 2-3 weeks after mating \n• Incubation: 21 days for chickens \n• Broodiness: Varies by breed",
    "default": "Reproduction management varies significantly by species. Key factors include detecting heat signs, proper timing of breeding, nutrition during gestation, and preparation for birthing."
  },
  
  "housing": {
    "cows": "Cattle housing requirements: \n• Space: 100-150 sq ft per adult cow \n• Bedding: 3-4 inches of dry material \n• Ventilation: Good air flow without drafts \n• Flooring: Non-slip surfaces \n• Shelter: Protection from extreme weather",
    "pigs": "Pig housing requirements: \n• Space: 8-12 sq ft per growing pig \n• Temperature: 60-70°F for growing pigs \n• Bedding: Straw or other absorbent material \n• Ventilation: Controlled to remove moisture and gases",
    "chickens": "Poultry housing requirements: \n• Space: 2-3 sq ft per bird inside, 8-10 sq ft outside \n• Roosts: 8-12 inches per bird \n• Nesting boxes: 1 per 4-5 hens \n• Ventilation: Good air exchange without drafts",
    "default": "Proper housing provides protection from weather, adequate space, good ventilation, clean bedding, and safe enclosures. Requirements vary significantly by species and climate."
  },
  
  "emergency": "🚨 ANIMAL EMERGENCY PROTOCOL: \n1. Ensure your safety first \n2. Isolate the affected animal if possible \n3. Provide water and comfort \n4. Contact your veterinarian immediately \n5. Describe symptoms clearly: \n   - Temperature, pulse, respiration \n   - Behavior changes \n   - Appetite and water consumption \n   - Any visible injuries or abnormalities",
  
  "default": "I'm not sure I understand. Could you provide more details about which animal species you're asking about and the specific concern? For immediate assistance, please contact your veterinarian or agricultural extension service. 📞 Emergency Vet Line: [Your local emergency number]"
};

// Advanced animal symptom checker
const symptomChecker = {
  "diarrhea": {
    "cows": "Bovine diarrhea causes: \n• Nutritional: Sudden diet change, poor quality feed \n• Bacterial: E. coli, Salmonella \n• Viral: BVD, Rotavirus \n• Parasitic: Coccidiosis, Worms \n• Metabolic: Acidosis",
    "pigs": "Porcine diarrhea causes: \n• Piglets: E. coli, Clostridium, Coccidiosis \n• Growers: Salmonella, Swine dysentery \n• Adults: Porcine epidemic diarrhea virus, Lawsonia",
    "chickens": "Poultry diarrhea causes: \n• Bacterial: Salmonella, E. coli \n• Viral: Newcastle disease, Avian influenza \n• Parasitic: Coccidiosis, Worms \n• Nutritional: Imbalance, spoiled feed",
    "default": "Diarrhea can indicate various issues including dietary problems, infections, parasites, or systemic illness. Isolate affected animals and consult a veterinarian for proper diagnosis."
  },
  "coughing": {
    "cows": "Bovine respiratory issues: \n• BRD complex: IBR, PI3, BRSV, Pasteurella \n• Lungworms \n• Allergies or environmental irritants",
    "pigs": "Porcine respiratory issues: \n• PRRS \n• Mycoplasma pneumonia \n• Influenza \n• Actinobacillus pleuropneumonia",
    "chickens": "Poultry respiratory issues: \n• Infectious bronchitis \n• Newcastle disease \n• Mycoplasma \n• Aspergillosis (fungal)",
    "default": "Respiratory symptoms warrant immediate attention as they can spread quickly through herds. Isolate affected animals and consult your veterinarian."
  },
  "lameness": {
    "cows": "Bovine lameness causes: \n• Foot rot: Bacterial infection \n• Digital dermatitis: Hairy heel warts \n• Laminitis: Inflammation of hoof tissue \n• Injury: Stones, bruises, fractures",
    "pigs": "Porcine lameness causes: \n• Foot rot: Bacterial infection \n• Arthritis: Joint inflammation \n• Injury: Pen trauma, flooring issues \n• Nutritional: Biotin deficiency",
    "chickens": "Poultry lameness causes: \n• Bumblefoot: Bacterial infection \n• Marek's disease: Viral paralysis \n• Nutritional: Riboflavin deficiency \n• Injury: Perches, fighting",
    "default": "Lameness can result from infections, injuries, nutritional deficiencies, or housing issues. Isolate affected animals and consult your veterinarian for proper diagnosis and treatment."
  }
};

// Conversation context storage with expiration
const conversationContexts = new Map();

// Clean up old contexts periodically
setInterval(() => {
  const now = Date.now();
  for (const [sessionId, context] of conversationContexts.entries()) {
    if (now - context.lastActivity > 30 * 60 * 1000) { // 30 minutes inactivity
      conversationContexts.delete(sessionId);
    }
  }
}, 5 * 60 * 1000); // Check every 5 minutes

// Create OpenAI client with enhanced configuration
const getOpenAIClient = () => {
  if (!process.env.OPENAI_API_KEY) {
    console.error("❌ OpenAI API key missing from environment variables");
    throw new Error("OpenAI API key not configured");
  }
  
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    timeout: 20000, // 20 second timeout
    maxRetries: 2,
  });
};

// Enhanced intent detection with animal species recognition
const detectIntentAndSpecies = (message) => {
  const lowerMessage = message.toLowerCase().trim();
  
  // Detect animal species
  let species = null;
  const speciesKeywords = {
    'cows': ['cow', 'cows', 'cattle', 'bovine', 'calf', 'calves', 'heifer', 'steer', 'bull', 'dairy', 'beef'],
    'pigs': ['pig', 'pigs', 'swine', 'hog', 'hogs', 'piglet', 'sow', 'boar', 'porcine'],
    'sheep': ['sheep', 'lamb', 'lambs', 'ewe', 'ram', 'ovine'],
    'goats': ['goat', 'goats', 'kid', 'doe', 'buck', 'caprine'],
    'chickens': ['chicken', 'chickens', 'hen', 'rooster', 'poultry', 'chick', 'broiler', 'layer', 'bird', 'birds']
  };
  
  for (const [spec, keywords] of Object.entries(speciesKeywords)) {
    if (keywords.some(keyword => lowerMessage.includes(keyword))) {
      species = spec;
      break;
    }
  }
  
  // Greetings
  if (/^(hi|hello|hey|good morning|good afternoon|good evening|howdy|sup|yo|greetings)/i.test(lowerMessage)) {
    return { intent: "greeting", species };
  }
  
  // Farewells
  if (/^(bye|goodbye|see ya|see you|farewell|exit|quit|stop|end)/i.test(lowerMessage)) {
    return { intent: "farewell", species };
  }
  
  // Thanks
  if (/^(thanks|thank you|thankyou|appreciate it|thx|ty|cheers)/i.test(lowerMessage)) {
    return { intent: "thanks", species };
  }
  
  // Specific topics with enhanced detection
  if (lowerMessage.includes('diarrhea') || lowerMessage.includes('scours') || 
      lowerMessage.includes('loose stool') || lowerMessage.includes('not eating') || 
      lowerMessage.includes('loss of appetite') || lowerMessage.includes('runny manure')) {
    return { intent: "diarrhea", species };
  }
  
  if (lowerMessage.includes('vaccin') || lowerMessage.includes('shot') || 
      lowerMessage.includes('immuniz') || lowerMessage.includes('vaccine')) {
    return { intent: "vaccination", species };
  }
  
  if (lowerMessage.includes('feed') || lowerMessage.includes('food') || 
      lowerMessage.includes('diet') || lowerMessage.includes('nutrition') ||
      lowerMessage.includes('ration') || lowerMessage.includes('fodder')) {
    return { intent: "feeding", species };
  }
  
  if (lowerMessage.includes('breed') || lowerMessage.includes('pregnant') || 
      lowerMessage.includes('heat') || lowerMessage.includes('calving') ||
      lowerMessage.includes('farrow') || lowerMessage.includes('gestation') ||
      lowerMessage.includes('reproduction') || lowerMessage.includes('mating')) {
    return { intent: "breeding", species };
  }
  
  if (lowerMessage.includes('house') || lowerMessage.includes('shelter') || 
      lowerMessage.includes('housing') || lowerMessage.includes('pen') ||
      lowerMessage.includes('coop') || lowerMessage.includes('barn')) {
    return { intent: "housing", species };
  }
  
  if (lowerMessage.includes('emergency') || lowerMessage.includes('urgent') || 
      lowerMessage.includes('dying') || lowerMessage.includes('critical') ||
      lowerMessage.includes('help') || lowerMessage.match(/\b911\b/) ||
      lowerMessage.includes('sick') || lowerMessage.includes('not well')) {
    return { intent: "emergency", species };
  }
  
  // Symptom-based detection
  if (lowerMessage.includes('cough') || lowerMessage.includes('sneeze') ||
      lowerMessage.includes('breathing') || lowerMessage.includes('respiratory')) {
    return { intent: "symptom_coughing", species };
  }
  
  if (lowerMessage.includes('limp') || lowerMessage.includes('lameness') ||
      lowerMessage.includes('hoof') || lowerMessage.includes('foot') ||
      lowerMessage.includes('leg') || lowerMessage.includes('lame')) {
    return { intent: "symptom_lameness", species };
  }
  
  return { intent: "default", species };
};

// Enhanced response generator
const generateResponse = (intent, species, question, context) => {
  // Handle symptom responses
  if (intent.startsWith('symptom_')) {
    const symptomType = intent.replace('symptom_', '');
    if (symptomChecker[symptomType]) {
      const response = species && symptomChecker[symptomType][species] 
        ? symptomChecker[symptomType][species] 
        : symptomChecker[symptomType].default;
      
      return {
        answer: `Based on your mention of ${symptomType}, here's what might be relevant:\n\n${response}`,
        source: "knowledge_base"
      };
    }
  }
  
  // Handle other intents
  if (fallbackResponses[intent]) {
    if (typeof fallbackResponses[intent] === 'object' && species && fallbackResponses[intent][species]) {
      return {
        answer: fallbackResponses[intent][species],
        source: "knowledge_base"
      };
    } else if (typeof fallbackResponses[intent] === 'string') {
      return {
        answer: fallbackResponses[intent],
        source: "knowledge_base"
      };
    }
  }
  
  // Default response
  return {
    answer: fallbackResponses.default,
    source: "knowledge_base"
  };
};

// POST /api/chatbot
router.post("/", async (req, res) => {
  try {
    const { question, sessionId = "default" } = req.body;

    if (!question) {
      return res.status(400).json({ error: "Question is required" });
    }

    console.log(`📝 Chatbot question from ${sessionId}: ${question}`);

    // Get or create conversation context
    if (!conversationContexts.has(sessionId)) {
      conversationContexts.set(sessionId, {
        messages: [],
        lastActivity: Date.now(),
        animalSpecies: null
      });
    }
    
    const context = conversationContexts.get(sessionId);
    context.lastActivity = Date.now(); // Update activity timestamp
    
    // Detect intent and species
    const { intent, species } = detectIntentAndSpecies(question);
    
    // Update context with detected species if any
    if (species && !context.animalSpecies) {
      context.animalSpecies = species;
    }
    
    console.log(`✅ Detected intent: ${intent}, species: ${species || 'none'}`);
    
    // Use knowledge base for specific intents
    if (intent !== "default" && !intent.startsWith('symptom_')) {
      const response = generateResponse(intent, context.animalSpecies || species, question, context);
      
      context.messages.push({ role: "user", content: question });
      context.messages.push({ role: "assistant", content: response.answer });
      
      // Limit context size
      if (context.messages.length > 10) {
        context.messages.splice(0, 2);
      }
      
      return res.json({ 
        answer: response.answer,
        source: response.source,
        sessionId,
        detectedSpecies: context.animalSpecies
      });
    }

    // Try to use OpenAI for more complex queries
    try {
      const openai = getOpenAIClient();

      // Prepare enhanced system prompt with contextual information
      const systemPrompt = `You are an expert AI assistant specialized in Animal Management and Farming. 
        ${context.animalSpecies ? `The user is managing ${context.animalSpecies}.` : 'The user works with farm animals.'}
        Provide practical, actionable advice for farmers and animal caretakers.
        Be specific and include emojis for readability but don't overuse them.
        Always recommend consulting a veterinarian for serious health issues.
        Format responses clearly with bullet points or numbered steps when appropriate.
        Keep responses concise but helpful (400-600 tokens).
        If the question is about a specific animal species, tailor your response accordingly.
        Important: Never recommend medications or dosages - always refer to a veterinarian for prescriptions.`;

      // Prepare conversation context
      const messages = [
        { role: "system", content: systemPrompt },
        ...context.messages.slice(-6), // Include last 3 exchanges for context
        { role: "user", content: question }
      ];

      // Send question to GPT
      const response = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        messages: messages,
        max_tokens: 600,
        temperature: 0.7,
      });

      const answer = response.choices[0].message.content;
      
      // Update conversation context
      context.messages.push({ role: "user", content: question });
      context.messages.push({ role: "assistant", content: answer });
      
      // Limit context size
      if (context.messages.length > 10) {
        context.messages.splice(0, 2);
      }
      
      console.log("✅ OpenAI response successful");
      return res.json({ 
        answer, 
        source: "openai", 
        sessionId,
        detectedSpecies: context.animalSpecies
      });
      
    } catch (openaiError) {
      console.error("❌ OpenAI failed, using fallback:", openaiError.message);
      
      // Use enhanced fallback response
      const response = generateResponse("default", context.animalSpecies, question, context);
      
      // Update conversation context
      context.messages.push({ role: "user", content: question });
      context.messages.push({ role: "assistant", content: response.answer });
      
      return res.json({ 
        answer: response.answer,
        source: "fallback",
        sessionId,
        detectedSpecies: context.animalSpecies,
        note: "Using fallback response due to technical issues with AI service" 
      });
    }
    
  } catch (error) {
    console.error("❌ Chatbot Route Error:", error);
    res.status(500).json({ 
      error: "Service temporarily unavailable",
      message: error.message,
      fallback: fallbackResponses.default
    });
  }
});

// Add endpoint to clear conversation context
router.post("/clear-context", (req, res) => {
  const { sessionId = "default" } = req.body;
  
  if (conversationContexts.has(sessionId)) {
    conversationContexts.delete(sessionId);
  }
  
  res.json({ success: true, message: "Conversation context cleared" });
});

// Get conversation history
router.get("/context/:sessionId", (req, res) => {
  const { sessionId } = req.params;
  
  if (conversationContexts.has(sessionId)) {
    const context = conversationContexts.get(sessionId);
    res.json({ 
      success: true, 
      messages: context.messages,
      animalSpecies: context.animalSpecies,
      lastActivity: context.lastActivity
    });
  } else {
    res.json({ success: false, message: "No context found for this session" });
  }
});

// Health check endpoint
router.get("/health", async (req, res) => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ 
        status: "degraded", 
        error: "OPENAI_API_KEY not configured",
        fallback: "Fallback responses available",
        timestamp: new Date().toISOString()
      });
    }
    
    const openai = getOpenAIClient();
    await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: "test" }],
      max_tokens: 5,
    });
    
    res.json({ 
      status: "healthy", 
      service: "openai_connected",
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      status: "degraded", 
      error: error.message,
      fallback: "Fallback responses available",
      timestamp: new Date().toISOString()
    });
  }
});

// Animal species detection endpoint
router.post("/detect-species", (req, res) => {
  const { text } = req.body;
  
  if (!text) {
    return res.status(400).json({ error: "Text is required" });
  }
  
  const { species } = detectIntentAndSpecies(text);
  res.json({ detectedSpecies: species });
});

// Get animal information endpoint
router.get("/animal-info/:species", (req, res) => {
  const { species } = req.params;
  
  if (animalDatabase[species]) {
    res.json({ 
      success: true, 
      species,
      data: animalDatabase[species]
    });
  } else {
    res.status(404).json({ 
      success: false, 
      message: `No information available for ${species}`,
      availableSpecies: Object.keys(animalDatabase)
    });
  }
});

export default router;