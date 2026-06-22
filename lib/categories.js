export const CATEGORIES = {
  food: { label: "Food & Dining", color: "#D2691E", code: "FOOD", emoji: "🍔" },
  groceries: { label: "Groceries", color: "#A98B3F", code: "GROC", emoji: "🛒" },
  transport: { label: "Transport", color: "#4A6FA5", code: "TRNS", emoji: "🚕" },
  shopping: { label: "Shopping", color: "#7A5C7E", code: "SHOP", emoji: "🛍️" },
  bills: { label: "Bills & Utilities", color: "#5C6B73", code: "BILL", emoji: "💡" },
  entertainment: { label: "Entertainment", color: "#C9A24B", code: "ENTM", emoji: "🎬" },
  health: { label: "Health", color: "#6E8F72", code: "HLTH", emoji: "💊" },
  housing: { label: "Housing & Rent", color: "#8C5A3C", code: "HOME", emoji: "🏠" },
  education: { label: "Education", color: "#3E7C7C", code: "EDUC", emoji: "📚" },
  travel: { label: "Travel", color: "#B07A8C", code: "TRVL", emoji: "✈️" },
  personal: { label: "Personal Care", color: "#8C82A8", code: "CARE", emoji: "🧴" },
  other: { label: "Other", color: "#8A8470", code: "OTHR", emoji: "🪙" },
};

const KEYWORDS = {
  food: [
    "swiggy", "zomato", "restaurant", "cafe", "food", "lunch", "dinner",
    "breakfast", "snack", "dominos", "pizza", "mcdonald", "kfc", "starbucks",
    "chai", "tea", "coffee", "biryani", "dhaba", "eatery", "tiffin", "bakery",
    "burger", "sandwich", "diner", "takeout", "takeaway",
  ],
  groceries: [
    "grocery", "groceries", "bigbasket", "blinkit", "zepto", "vegetable",
    "supermarket", "kirana", "dmart", "reliance fresh", "milk", "provisions",
    "walmart", "trader joe", "whole foods", "costco", "tesco", "sainsbury",
    "aldi", "kroger",
  ],
  transport: [
    "uber", "ola", "rapido", "taxi", "auto", "bus", "train", "metro", "fuel",
    "petrol", "diesel", "gas station", "parking", "toll", "irctc", "cab",
    "rickshaw", "lyft", "subway fare", "gas",
  ],
  shopping: [
    "amazon", "flipkart", "myntra", "ajio", "clothes", "clothing", "shoes",
    "mall", "shopping", "dress", "target", "ebay", "etsy", "zara", "h&m",
  ],
  bills: [
    "electricity", "water bill", "recharge", "internet", "wifi", "broadband",
    "phone bill", "gas bill", "dth", "jio", "airtel", "bsnl", "bill",
    "verizon", "at&t", "comcast", "utility",
  ],
  entertainment: [
    "movie", "netflix", "prime video", "spotify", "hotstar", "bookmyshow",
    "concert", "game", "pvr", "inox", "subscription", "cinema", "theatre",
    "disney+", "hbo", "youtube premium",
  ],
  health: [
    "medicine", "doctor", "hospital", "pharmacy", "medical", "gym",
    "fitness", "apollo", "clinic", "dentist", "cvs pharmacy", "walgreens",
    "therapy", "checkup",
  ],
  housing: ["rent", "maintenance", "emi", "mortgage", "society", "landlord"],
  education: [
    "course", "tuition", "fees", "udemy", "school", "college", "class",
    "exam", "book", "textbook", "coursera",
  ],
  travel: [
    "hotel", "flight", "trip", "vacation", "makemytrip", "goibibo", "airbnb",
    "holiday", "resort", "expedia", "booking.com",
  ],
  personal: ["salon", "spa", "haircut", "cosmetics", "parlour", "barber"],
};

export function detectCategory(text) {
  const t = (text || "").toLowerCase();
  for (const key in KEYWORDS) {
    const words = KEYWORDS[key];
    for (let i = 0; i < words.length; i++) {
      if (t.indexOf(words[i]) !== -1) return key;
    }
  }
  return "other";
}
