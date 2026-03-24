from fastapi import APIRouter
from pydantic import BaseModel
import random

router = APIRouter(prefix="/api/chat", tags=["chat"])

class ChatMessage(BaseModel):
    message: str

RESPONSES = {
    "hello": ["Hello! I'm ParkNow AI Assistant. How can I assist you today?", "Hi! Looking for a parking spot?", "Greetings! How can I help with your parking needs?"],
    "price": ["Our rates start from ₹30/hour. Longer durations like Full Day (24h) are only ₹250!", "Pricing varies: 1h is ₹30, 8h is ₹150, and 24h is ₹250."],
    "booking": ["To book a slot, select any green slot on the map and click 'Book Now'.", "Simple bookings: Pick a slot, choose your duration, and pay. Done!"],
    "zone": ["Zone A & B are Ground Floor. Zone C & D are First Floor. D is our Premium Zone.", "We have 4 zones. Zones C & D are on the first floor."],
    "payment": ["We accept UPI, Credit/Debit Cards, and Wallets. You can also pay by Cash at the gate.", "Payment is easy! You can even choose 'Cash' to pay the attendant later."],
    "cancel": ["You can cancel from the 'My Bookings' tab as long as the booking hasn't started.", "Go to 'My Bookings' to manage or cancel your existing reservations."],
    "nav": ["Once booked, click 'Route to Slot' in your ticket to see directions!", "We provide step-by-step navigation to your specific parking spot."]
}

@router.post("")
def chat_with_ai(data: ChatMessage):
    msg = data.message.lower()
    
    # Simple keyword matching for a smart-simulated AI
    response = "I'm still learning! Could you ask about pricing, bookings, zones, or payments? I'd love to help."
    
    for key in RESPONSES:
        if key in msg:
            response = random.choice(RESPONSES[key])
            break
            
    if "help" in msg or "assist" in msg:
        response = "I am the ParkNow AI Assistant. You can ask me about parking rates, how to book, our zones, or payment methods!"
        
    return {"response": response}
