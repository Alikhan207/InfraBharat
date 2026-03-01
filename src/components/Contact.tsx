import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Send, Mail, Phone, MapPin } from "lucide-react";

const Contact = () => {
    const { toast } = useToast();
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        subject: "",
        message: ""
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        // Simulate network request
        await new Promise(resolve => setTimeout(resolve, 1500));

        toast({
            title: "Message Sent Successfully",
            description: "Thank you for contacting us. Our admin team will get back to you shortly.",
            className: "bg-green-50 border-green-200",
        });

        setFormData({
            name: "",
            email: "",
            subject: "",
            message: ""
        });
        setIsSubmitting(false);
    };

    return (
        <section id="contact" className="py-20 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                        Contact Admin
                    </h2>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                        Have questions or need assistance? Reach out to our support team.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    {/* Contact Info */}
                    <div className="space-y-8">
                        <div className="bg-infra-blue-50 p-8 rounded-2xl">
                            <h3 className="text-xl font-bold text-gray-900 mb-6">Get in Touch</h3>
                            <div className="space-y-6">
                                <div className="flex items-start space-x-4">
                                    <div className="bg-white p-3 rounded-full shadow-sm">
                                        <Mail className="h-6 w-6 text-infra-blue-600" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900">Email Us</p>
                                        <p className="text-gray-600">admin@infrabharat.gov.in</p>
                                        <p className="text-gray-600">support@infrabharat.gov.in</p>
                                    </div>
                                </div>

                                <div className="flex items-start space-x-4">
                                    <div className="bg-white p-3 rounded-full shadow-sm">
                                        <Phone className="h-6 w-6 text-infra-blue-600" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900">Call Us</p>
                                        <p className="text-gray-600">+91 1800-123-4567</p>
                                        <p className="text-gray-600">Mon - Fri, 9am - 6pm</p>
                                    </div>
                                </div>

                                <div className="flex items-start space-x-4">
                                    <div className="bg-white p-3 rounded-full shadow-sm">
                                        <MapPin className="h-6 w-6 text-infra-blue-600" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900">Visit Us</p>
                                        <p className="text-gray-600">Ministry of Urban Development</p>
                                        <p className="text-gray-600">Nirman Bhawan, New Delhi - 110011</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Contact Form */}
                    <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Full Name</Label>
                                    <Input
                                        id="name"
                                        placeholder="John Doe"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email Address</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="john@example.com"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="subject">Subject</Label>
                                <Input
                                    id="subject"
                                    placeholder="How can we help?"
                                    value={formData.subject}
                                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="message">Message</Label>
                                <Textarea
                                    id="message"
                                    placeholder="Type your message here..."
                                    className="min-h-[150px]"
                                    value={formData.message}
                                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                    required
                                />
                            </div>

                            <Button
                                type="submit"
                                className="w-full bg-infra-blue-600 hover:bg-infra-blue-700 text-white"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    "Sending..."
                                ) : (
                                    <>
                                        <Send className="mr-2 h-4 w-4" /> Send Message
                                    </>
                                )}
                            </Button>
                        </form>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Contact;
