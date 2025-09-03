import { LifeBuoy, Mail, MessageSquare } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const faqs = [
  {
    question: "How do I connect my ESP8266 device?",
    answer:
      "Navigate to the 'Connection' tab. Enter the IP address of your ESP8266 (found on your local network), your WiFi SSID, and password. Then click 'Connect to Device'. The app will send the configuration to your device.",
  },
  {
    question: "How do I create a new bell schedule?",
    answer:
      "Go to the 'Schedule' tab. Click the '+' icon to create a new schedule group (e.g., '1st Year'). Once created, you can select that schedule and use the large '+' button at the bottom right to add individual bells to it.",
  },
  {
    question: "The 'Test Bell' button isn't working.",
    answer:
      "Ensure your ESP8266 device is powered on and successfully connected to your WiFi network. You can check the status on the 'Connection' page. The device needs to be online to receive the test command.",
  },
  {
    question: "Can I manage schedules for multiple departments?",
    answer:
      "Currently, the app is designed to manage schedules within a single selected department. You can create multiple schedule groups (e.g., for different years or classes) within that department.",
  },
];

const HelpAndSupport = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Help & Support</h1>
        <p className="text-muted-foreground">
          Find answers and get help with the Smart Bell Scheduler.
        </p>
      </div>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Frequently Asked Questions</CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem value={`item-${index + 1}`} key={index}>
                <AccordionTrigger>{faq.question}</AccordionTrigger>
                <AccordionContent>{faq.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Contact Us</CardTitle>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-4">
          <Button variant="outline" className="w-full justify-start p-4 h-auto">
            <Mail className="mr-4 h-6 w-6 text-primary" />
            <div>
              <p className="font-semibold">Email Support</p>
              <p className="text-sm text-muted-foreground">support@example.com</p>
            </div>
          </Button>
          <Button variant="outline" className="w-full justify-start p-4 h-auto">
            <MessageSquare className="mr-4 h-6 w-6 text-primary" />
            <div>
              <p className="font-semibold">Live Chat</p>
              <p className="text-sm text-muted-foreground">Start a conversation</p>
            </div>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default HelpAndSupport;