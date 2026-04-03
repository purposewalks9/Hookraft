"use client";

import { Gem, Crown, Award } from "lucide-react";
import { Check } from "lucide-react";
import { HighlightedText } from "./spell-ui/highlighted-text";
import { RichButton } from "./spell-ui/rich-button";

const plans = [
    {
        id: "silver",
        name: "Silver",
        icon: Award,
        price: "₦10,000",
        period: "Per month (+tax)",
        badge: null,
        features: [
            "Support Spell UI",
            "Custom Role on Discord server",
            "Small logo & link in Sponsor page",
        ],
        accent: "#94a3b8",
    },
    {
        id: "gold",
        name: "Gold",
        icon: Crown,
        price: "₦50,000",
        period: "Per month (+tax)",
        badge: "Best Value",
        features: [
            "All Silver features",
            "Medium logo & link in Sponsor page",
            "Link in footer",
        ],
        accent: "#fbbf24",
    },
    {
        id: "diamond",
        name: "Diamond",
        icon: Gem,
        price: "₦100,000",
        period: "Per month (+tax)",
        features: [
            "All Platinum features",
            "Early access to upcoming components",
            "Featured logo with Homepage feature card",
        ],
        accent: "#67e8f9",
    },
];

function PlanCard({ plan }: { plan: any }) {
    const Icon = plan.icon;

    return (
        <div className="relative flex flex-col h-full group">
           
            <div className="flex-1  border-r  p-6 flex flex-col hover:border-accent/30 transition-colors">
                {/* Icon */}
                <div className="w-10 h-10 rounded-2xl bg-muted flex items-center justify-center mb-5">
                    <Icon size={24} color={plan.accent} strokeWidth={2.5} />
                </div>

                {/* Name */}
                <h3 className="text-2xl font-medium text-foreground text-left mb-4">
                    {plan.name}
                </h3>

                {/* Price */}
                <div className="mb-6 text-left">
                    <span className="text-4xl font-semibold tracking-tighter text-foreground">
                        {plan.price}
                    </span>
                
                </div>

                {/* Features */}
                <ul className="space-y-2.5 mb-8 text-sm text-muted-foreground flex-1">
                    {plan.features.map((feature: string, i: number) => (
                        <li key={i} className="flex items-start gap-3 text-[13px] leading-snug">
                          
                            <span>{feature}</span>
                        </li>
                    ))}
                </ul>

                {/* Button */}
                <RichButton
                    disabled
                    className="w-full py-3 rounded-xl font-medium text-sm text-white cursor-not-allowed opacity-75 hover:opacity-60 transition-opacity"
                >
                    Coming soon
                </RichButton>
            </div>
        </div>
    );
}

export function PricingSection() {
    return (
        <section className="relative py-20 px-4 w-full mx-auto text-center overflow-hidden pb-20l max-w-[1400px]">
            {/* Heading */}
            <div className="max-w-3xl mx-auto mb-14">
                <h2 className="text-xl md:text-3xl font-medium tracking-tight leading-[1.15] text-foreground">
                    Sponsor Hookraft,{" "}
                    <HighlightedText
                        from="left"
                        delay={0.1}
                        className="px-2 py-1 rounded-md  text-white"
                    >
                        get exclusive Hooks
                    </HighlightedText>{" "}
                    and help us keep it free for everyone
                </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {plans.map((plan) => (
                    <PlanCard key={plan.id} plan={plan} />
                ))}
            </div>
        </section>
    );
}