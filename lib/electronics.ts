// Electronics device taxonomy and issue classifier for Urimai Guide.
// Mirrors the backend ElectronicsClassifier module output.

export type DeviceCategory =
  | "MOBILE_PHONE"
  | "LAPTOP"
  | "TELEVISION"
  | "REFRIGERATOR"
  | "WASHING_MACHINE"
  | "AIR_CONDITIONER"
  | "SMART_DEVICE"
  | "CHARGER_POWER_BANK"
  | "AUDIO_DEVICE"
  | "CAMERA"
  | "TABLET"
  | "PRINTER"
  | "MICROWAVE"
  | "OTHER_ELECTRONICS"

export type IssueType =
  | "DEAD_ON_ARRIVAL"
  | "PHYSICAL_DAMAGE"
  | "SCREEN_DEFECT"
  | "BATTERY_ISSUE"
  | "OVERHEATING"
  | "SOFTWARE_DEFECT"
  | "CONNECTIVITY_ISSUE"
  | "PERFORMANCE_DEGRADATION"
  | "COUNTERFEIT_PRODUCT"
  | "WRONG_PRODUCT_DELIVERED"
  | "MISSING_ACCESSORIES"
  | "REFUND_DENIED"
  | "REPLACEMENT_DENIED"
  | "WARRANTY_DISHONOURED"
  | "SERVICE_CENTER_NEGLIGENCE"
  | "DELAYED_DELIVERY"

export interface ElectronicsClassification {
  device_category: DeviceCategory
  device_label: string
  issue_types: IssueType[]
  issue_labels: string[]
  warranty_relevant: boolean
  service_center_relevant: boolean
  platform_detected: string | null
  confidence: number
}

const DEVICE_KEYWORDS: Record<DeviceCategory, string[]> = {
  MOBILE_PHONE: ["phone", "mobile", "smartphone", "iphone", "samsung", "oneplus", "redmi", "realme", "oppo", "vivo", "pixel", "nokia", "motorola"],
  LAPTOP: ["laptop", "notebook", "macbook", "dell", "hp", "lenovo", "asus", "acer", "chromebook"],
  TELEVISION: ["tv", "television", "led tv", "oled", "qled", "smart tv", "android tv"],
  REFRIGERATOR: ["fridge", "refrigerator", "freezer", "whirlpool", "lg fridge", "samsung fridge", "godrej fridge"],
  WASHING_MACHINE: ["washing machine", "washer", "dryer", "front load", "top load", "lg washing", "samsung washing"],
  AIR_CONDITIONER: ["ac", "air conditioner", "split ac", "window ac", "inverter ac", "daikin", "voltas", "blue star", "carrier"],
  SMART_DEVICE: ["smartwatch", "smart watch", "fitness band", "alexa", "google home", "smart speaker", "iot", "smart bulb"],
  CHARGER_POWER_BANK: ["charger", "power bank", "adapter", "cable", "usb", "fast charger", "wireless charger"],
  AUDIO_DEVICE: ["earphone", "headphone", "earbuds", "speaker", "bluetooth speaker", "airpods", "boat", "jbl", "sony headphone"],
  CAMERA: ["camera", "dslr", "mirrorless", "action camera", "gopro", "nikon", "canon", "sony camera"],
  TABLET: ["tablet", "ipad", "android tablet", "samsung tab", "lenovo tab"],
  PRINTER: ["printer", "inkjet", "laser printer", "hp printer", "canon printer", "epson"],
  MICROWAVE: ["microwave", "oven", "microwave oven", "otg"],
  OTHER_ELECTRONICS: ["electronics", "gadget", "device", "appliance"],
}

const ISSUE_KEYWORDS: Record<IssueType, string[]> = {
  DEAD_ON_ARRIVAL: ["dead on arrival", "doa", "not working", "doesn't turn on", "won't start", "not switching on"],
  PHYSICAL_DAMAGE: ["damaged", "broken", "cracked", "dent", "scratch", "bent", "physical damage"],
  SCREEN_DEFECT: ["screen", "display", "dead pixel", "flickering", "black screen", "touch not working", "screen crack"],
  BATTERY_ISSUE: ["battery", "not charging", "drains fast", "battery drain", "won't charge", "battery dead"],
  OVERHEATING: ["overheating", "heating", "hot", "burns", "temperature"],
  SOFTWARE_DEFECT: ["software", "bug", "crash", "hang", "freeze", "restart", "update issue", "os"],
  CONNECTIVITY_ISSUE: ["wifi", "bluetooth", "network", "signal", "sim", "connectivity", "not connecting"],
  PERFORMANCE_DEGRADATION: ["slow", "lag", "performance", "sluggish", "not responding"],
  COUNTERFEIT_PRODUCT: ["fake", "counterfeit", "duplicate", "not original", "replica"],
  WRONG_PRODUCT_DELIVERED: ["wrong product", "different product", "not what i ordered", "wrong model", "wrong color"],
  MISSING_ACCESSORIES: ["missing", "accessories", "charger missing", "box missing", "incomplete"],
  REFUND_DENIED: ["refund denied", "refused refund", "won't refund", "no refund", "refund rejected"],
  REPLACEMENT_DENIED: ["replacement denied", "refused replacement", "won't replace", "no replacement"],
  WARRANTY_DISHONOURED: ["warranty", "warranty void", "warranty rejected", "warranty claim", "warranty denied"],
  SERVICE_CENTER_NEGLIGENCE: ["service center", "repair", "technician", "service", "not repaired", "poor service"],
  DELAYED_DELIVERY: ["delayed", "not delivered", "late delivery", "delivery issue", "not received"],
}

const PLATFORM_KEYWORDS: Record<string, string[]> = {
  Amazon: ["amazon", "amazon.in"],
  Flipkart: ["flipkart"],
  Meesho: ["meesho"],
  Myntra: ["myntra"],
  Snapdeal: ["snapdeal"],
  Croma: ["croma"],
  Reliance: ["reliance digital", "reliancedigital"],
  Vijay: ["vijay sales"],
}

export function classifyElectronics(text: string): ElectronicsClassification {
  const t = text.toLowerCase()

  let device_category: DeviceCategory = "OTHER_ELECTRONICS"
  let device_label = "Electronic Device"
  let maxDeviceScore = 0

  for (const [cat, keywords] of Object.entries(DEVICE_KEYWORDS) as [DeviceCategory, string[]][]) {
    const score = keywords.filter((k) => t.includes(k)).length
    if (score > maxDeviceScore) {
      maxDeviceScore = score
      device_category = cat
      device_label = cat.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
    }
  }

  const issue_types: IssueType[] = []
  const issue_labels: string[] = []
  for (const [issue, keywords] of Object.entries(ISSUE_KEYWORDS) as [IssueType, string[]][]) {
    if (keywords.some((k) => t.includes(k))) {
      issue_types.push(issue)
      issue_labels.push(issue.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()))
    }
  }

  let platform_detected: string | null = null
  for (const [platform, keywords] of Object.entries(PLATFORM_KEYWORDS)) {
    if (keywords.some((k) => t.includes(k))) {
      platform_detected = platform
      break
    }
  }

  const warranty_relevant = issue_types.some((i) =>
    ["WARRANTY_DISHONOURED", "DEAD_ON_ARRIVAL", "SCREEN_DEFECT", "BATTERY_ISSUE", "PHYSICAL_DAMAGE"].includes(i)
  )
  const service_center_relevant = issue_types.some((i) =>
    ["SERVICE_CENTER_NEGLIGENCE", "WARRANTY_DISHONOURED", "PERFORMANCE_DEGRADATION"].includes(i)
  )

  const confidence = maxDeviceScore > 0 ? Math.min(0.95, 0.65 + maxDeviceScore * 0.1) : 0.55

  return {
    device_category,
    device_label,
    issue_types: issue_types.length > 0 ? issue_types : ["REFUND_DENIED"],
    issue_labels: issue_labels.length > 0 ? issue_labels : ["Refund Denied"],
    warranty_relevant,
    service_center_relevant,
    platform_detected,
    confidence,
  }
}

export function getElectronicsDocumentChecklist(
  classification: ElectronicsClassification
): { id: string; name: string; mandatory: boolean; tip: string }[] {
  const base = [
    { id: "e1", name: "Purchase Invoice / GST Bill", mandatory: true, tip: "Download from Amazon/Flipkart order history or request from the shop." },
    { id: "e2", name: "Payment Receipt / Bank Statement", mandatory: true, tip: "Screenshot of UPI/card payment or bank SMS." },
    { id: "e3", name: "Product Photos (showing defect)", mandatory: true, tip: "Take clear photos of the defect in good lighting." },
    { id: "e4", name: "Seller / Platform Communication", mandatory: true, tip: "Export WhatsApp chat or screenshot email thread with seller." },
  ]

  const conditional: typeof base = []

  if (classification.warranty_relevant)
    conditional.push({ id: "e5", name: "Warranty Card / Warranty Certificate", mandatory: true, tip: "Usually inside the product box. Check the manufacturer's website for e-warranty." })

  if (classification.service_center_relevant)
    conditional.push({ id: "e6", name: "Service Center Job Sheet / Report", mandatory: true, tip: "Get a written job sheet every time you visit the service center." })

  if (classification.issue_types.includes("WRONG_PRODUCT_DELIVERED"))
    conditional.push({ id: "e7", name: "Delivery Packaging Photos", mandatory: true, tip: "Photograph the sealed box before opening — critical for wrong product claims." })

  if (classification.issue_types.includes("DELAYED_DELIVERY"))
    conditional.push({ id: "e8", name: "Order Confirmation & Tracking Screenshots", mandatory: true, tip: "Screenshot the order page showing promised delivery date vs actual." })

  if (classification.platform_detected)
    conditional.push({ id: "e9", name: `${classification.platform_detected} Order Details Screenshot`, mandatory: true, tip: `Go to ${classification.platform_detected} → My Orders → screenshot the full order page.` })

  return [...base, ...conditional]
}

export function getAdaptiveQuestions(
  classification: ElectronicsClassification,
  answeredFields: string[]
): { id: string; text: string; field: string; placeholder: string; inputType?: "text" | "number" | "date" }[] {
  const all = [
    { id: "aq1", text: `What is the exact model of the ${classification.device_label}?`, field: "product_service", placeholder: `e.g. Samsung Galaxy S23 Ultra 256GB` },
    { id: "aq2", text: "From which seller or platform did you buy it?", field: "opposite_party_name", placeholder: `e.g. ${classification.platform_detected || "Amazon / Flipkart / local shop"}` },
    { id: "aq3", text: "When did you purchase it? (DD/MM/YYYY)", field: "purchase_date", placeholder: "e.g. 15/09/2024" },
    { id: "aq4", text: "How much did you pay? (₹)", field: "transaction_amount", placeholder: "e.g. 45000", inputType: "number" as const },
    { id: "aq5", text: "Describe exactly what went wrong with the device.", field: "defect_description", placeholder: `e.g. ${classification.issue_labels[0] || "Screen stopped working after 10 days"}` },
    { id: "aq6", text: "When did the problem first appear?", field: "incident_date", placeholder: "e.g. 25/09/2024" },
    { id: "aq7", text: "Did you contact the seller or service center? What was their response?", field: "company_response", placeholder: "e.g. They refused to repair or refund" },
    ...(classification.warranty_relevant ? [{ id: "aq8", text: "Is the device still under warranty?", field: "warranty_status", placeholder: "e.g. Yes, 1-year warranty valid until Dec 2025" }] : []),
    ...(classification.service_center_relevant ? [{ id: "aq9", text: "Did you visit the authorized service center? What happened?", field: "service_center_visit", placeholder: "e.g. Visited twice, they returned it unrepaired" }] : []),
    { id: "aq10", text: "What relief are you seeking? (refund, replacement, compensation)", field: "relief_sought", placeholder: "e.g. Full refund of ₹45,000 and ₹5,000 compensation for mental agony" },
    { id: "aq11", text: "What supporting documents do you have?", field: "evidence_available", placeholder: "e.g. Invoice, WhatsApp screenshots, service center job sheet" },
  ]

  return all.filter((q) => !answeredFields.includes(q.field))
}
