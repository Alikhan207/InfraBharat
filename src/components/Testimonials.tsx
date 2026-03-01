import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const testimonials = [
    {
        name: "Rajesh Kumar",
        role: "Urban Planner, Bangalore",
        content: "InfraBharat has revolutionized how we approach drainage management. The AI predictions are incredibly accurate and have helped us prevent flooding in key areas.",
        avatar: "RK"
    },
    {
        name: "Priya Sharma",
        role: "Citizen, Mumbai",
        content: "The citizen dashboard is a game-changer. Reporting issues is so easy, and the safe route finder has saved me from getting stuck in waterlogged roads multiple times.",
        avatar: "PS"
    },
    {
        name: "Amit Patel",
        role: "Municipal Contractor",
        content: "The bidding process is transparent and efficient. The AI analysis reports give us a clear understanding of the work required before we even visit the site.",
        avatar: "AP"
    }
];

const Testimonials = () => {
    return (
        <section id="testimonials" className="py-20 bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                        Trusted by Officials & Citizens
                    </h2>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                        See how InfraBharat is making a difference in cities across India.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {testimonials.map((testimonial, index) => (
                        <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
                            <CardHeader className="flex flex-row items-center gap-4 pb-2">
                                <Avatar className="h-12 w-12 border-2 border-infra-blue-100">
                                    <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${testimonial.name}`} />
                                    <AvatarFallback>{testimonial.avatar}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <CardTitle className="text-lg font-semibold">{testimonial.name}</CardTitle>
                                    <p className="text-sm text-gray-500">{testimonial.role}</p>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <p className="text-gray-600 italic">"{testimonial.content}"</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Testimonials;
